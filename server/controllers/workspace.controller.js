import prisma from "../prisma/prisma.config.js"

export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
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
        })
        res.json({ workspaces })
    } catch (error) {
        console.log(error);
        res.json({ message: error.code || error.message })
    }
}

export const addMemberToWorkspace = async (req,res) => {
    try {
        const userId = await req.auth()
        const {email,role,workspaceId,message} = req.body
        const user = await prisma.user.findUnique({where:{email}})
        if (!user) {
            return res.status(404).json({message:"user not found"})
        }
        if (!workspaceId || !role) {
            return res.status(400).json({message:"Required parameters are missing"})
        }
        if (!["ADMIN","MEMBER"].includes(role)) {
            return res.status(400).json({message:"Ivalid role"})
        }
        const workspace = await prisma.workspace.findUnique({where:{id:workspaceId},include:{members:true}})
        if (!workspace) {
            return res.status(404).json({message:"Workspace not found"})
        }
        if (!workspace.members.find((members)=>members.userId === userId && members.role === "ADMIN")){
            return res.status(401).json({message:"You dont have admin privileges"})
        }
        const existingMember = workspace.members.find((members)=> members.userId === userId)
        if (existingMember) {
            return res.status(400).json({message:"user are already member"})
        }
        const member = await prisma.workspaceMember.create({
            userId:user.id,
            workspaceId,
            role,
            message
        })
        res.status(201).json({member,message:"member added sucessfully"})
    } catch (error) {
         console.log(error);
        res.json({ message: error.code || error.message })
    }
}