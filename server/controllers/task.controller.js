import { inngest } from "../inngest/index.js"
import prisma from "../prisma/prisma.config.js"

export const createTask = async (req,res) => {
    try {
        const {userId} = await req.auth()
        const {projectId,title,description,type,status,priority,assigneeId,due_date} = req.body
        const origin =req.get("origin")
        const project = await prisma.project.findUnique({
            where:{id:projectId},
            include:{members:{include:{user:true}}}
        })
        if (!project) {
            return res.status(404).json({message:"Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message:"you dont have admin role"})
        }else if (assigneeId && !project.members.find((member)=>member.user.id === assigneeId)) {
              return res.status(403).json({message:"assigne is not a member of worspace / project "})
        } 
        const task = await prisma.task.create({
            data:{
                projectId,
                title,
                description,
                priority,
                assigneeId,
                status,
                due_date: new Date(due_date)
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where:{id:task.id},
            include:{assignee:true}
        })
        await inngest.send({
            name:"app/task.assigned",
            data:{taskId:task.id,origin}
        })
        res.status(201).json({task:taskWithAssignee, message:'task created sucessfully'})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error.code || error.message})
        
    }
    
}

export const updateTask = async (req,res) => {
    try {
        const {userId} = await req.auth()
        const task = await prisma.task.findUnique({
            where:{id:req.params.id}
        })
        if (!task) {
            return res.status(404).json({message:"task not found"})
        }
        const project = await prisma.project.findUnique({
            where:{id:task.projectId},
            include:{members:{include:{user:true}}}
        })
        if (!project) {
            return res.status(404).json({message:"Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message:"you dont have admin role"})
        }
        const updatedTask = await prisma.task.update({
           where:{id:req.params.id},
           data:req.body
        })
        res.status(201).json({task:updateTask, message:'task updated sucessfully'})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error.code || error.message})
        
    }
    
}

export const deleteTask = async (req,res) => {
    try {
        const {userId} = await req.auth() 
        const {taskIds} = req.body
        const tasks = await prisma.task.findUnique({
            where:{id:{in:taskIds}}
        })
        if (tasks.length === 0) {
            return res.status(404).json({message:"task not found"})
        }
        const project = await prisma.project.findUnique({
            where:{id:tasks[0].projectId},
            include:{members:{include:{user:true}}}
        })
        if (!project) {
            return res.status(404).json({message:"Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message:"you dont have admin role"})
        }
       await prisma.task.deleteMany({
        where:{id:{in:taskIds}}
       })
        res.status(201).json({message:'task deleted sucessfully'})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error.code || error.message})
        
    }
    
}