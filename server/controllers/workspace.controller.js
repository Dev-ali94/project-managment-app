import prisma from "../prisma/prisma.config.js"

export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        if (!workspaces || workspaces.length === 0) {
            return res.status(404).json({ message: "No workspaces found for this user" });
        }

        res.json({ workspaces });
    } catch (error) {
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add a member to a workspace
export const addMemberToWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { email, role, workspaceId, message } = req.body;

        // Validate inputs
        if (!email || !workspaceId || !role) {
            return res.status(400).json({ message: "Required parameters are missing" });
        }
        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if workspace exists
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        // Check if the requester is admin
        if (!workspace.members.find((m) => m.userId === userId && m.role === "ADMIN")) {
            return res.status(401).json({ message: "You don't have admin privileges" });
        }

        // Check if the user is already a member
        const existingMember = workspace.members.find((m) => m.userId === user.id);
        if (existingMember) return res.status(400).json({ message: "User is already a member" });

        // Add member
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        });

        res.status(201).json({ member, message: "Member added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
