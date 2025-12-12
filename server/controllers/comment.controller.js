import prisma from "../prisma/prisma.config.js";

export const createComment = async (req,res) => {
    try {
        const {userId} = await req.auth()
        const {content,taskId} = req.body
        const task  = await prisma.task.findUnique({
            where:{id:taskId}
        })
        if (!task) {
            return res.status(404).json({message:"task not found"})
        }
        const project = await prisma.project.findUnique({
            where:{id:task.projectId},
            include:{members:{include:{user:true}}}
        })
        if (!project) {
            return res.status(404).json({message:"project not found"})
        }
        const member = project.members.find((member)=>member.userId === userId)
        if (!member) {
              return res.status(404).json({message:"you are not member of this project"})
        }
        const comment = await prisma.comment.create({
            data:{taskId,content,userId},
            include:{user:true}
        })
        res.status(201).json({comment,message:"comment created sucessfully"})
    } catch (error) {
         console.log(error);
        return res.status(500).json({ message: error.code || error.message });
    }
}


export const getAllComment = async (req,res) => {
    try {
        const {taskId} = req.params
        const comments = await prisma.comment.findMany({
            where:{taskId},include:{user:true}
        })
        res.status(201).json({comments,message:"comment fetch sucessfully"})
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.code || error.message });
        
    }
}