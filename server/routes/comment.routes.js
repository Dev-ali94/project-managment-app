import express from "express"
import { createComment, getAllComment } from "../controllers/comment.controller.js"

const commentRoutes =express.Router()

commentRoutes.post("/",createComment)
commentRoutes.get("/:taskId",getAllComment)
export default commentRoutes