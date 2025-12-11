import express from "express"
import { addMemberToWorkspace, getUserWorkspaces } from "../controllers/workspace.controller"
const workspaceRouter =express.Router()

workspaceRouter.get("/",getUserWorkspaces)
workspaceRouter.post("/add-member",addMemberToWorkspace )

export default workspaceRouter