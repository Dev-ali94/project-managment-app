import express from "express"
import { addMemberToProject, createProject, updateProject } from "../controllers/project.controller.js"

const projectRoutes =express.Router()

projectRoutes.post("/",createProject)
projectRoutes.put("/update",updateProject)
projectRoutes.post("/:projectId/add-member",addMemberToProject)
export default projectRoutes