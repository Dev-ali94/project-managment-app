import prisma from "../prisma/prisma.config.js";

export const createProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isAdmin = workspace.members.some((m) => m.userId === userId && m.role === "ADMIN");
        if (!isAdmin) {
            return res.status(403).json({ message: "You are not allowed to create a project in this workspace" });
        }

        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        });

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                team_lead: teamLead?.id || null,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        });

        if (team_members?.length > 0) {
            const membersToAdd = [];

            workspace.members.forEach(member => {
                if (team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id);
                }
            });

            if (membersToAdd.length > 0) {
                await prisma.projectMember.createMany({
                    data: membersToAdd.map(memberId => ({
                        projectId: project.id,
                        userId: memberId
                    }))
                });
            }
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true
            }
        });

        res.status(201).json({ project: projectWithMembers, message: "Project created successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.code || error.message });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id, workspaceId, description, name, status, start_date, end_date, team_lead, progress, priority } = req.body;

        // First check if the workspace exists
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check permissions
        const isAdmin = workspace.members.some((m) => m.userId === userId && m.role === "ADMIN");

        if (!isAdmin) {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            if (project.team_lead !== userId) {
                return res.status(403).json({ message: "You do not have permission to update this project" });
            }
        }
        let teamLeadId = null;
        if (team_lead) {
            const teamLeadUser = await prisma.user.findUnique({
                where: { email: team_lead },
                select: { id: true }
            });
            teamLeadId = teamLeadUser?.id || null;
        }
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                name,
                description,
                status,
                priority,
                progress,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            },
            include: {
                members: { include: { user: true } },
                workspace: true,
                owner: true
            }
        });

        res.status(200).json({ project: updatedProject, message: "Project updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.code || error.message });
    }
};
export const addMemberToProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { email } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.team_lead !== userId) {
            return res.status(403).json({ message: "Only project leader can add a member" });
        }

        const existingMember = project.members.find((m) => m.user.email === email);
        if (existingMember) {
            return res.status(400).json({ message: "User already a member" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found with that email" });
        }

        const newMember = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId
            }
        });

        res.status(201).json({ member: newMember, message: "User added successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.code || error.message });
    }
};
