import { clerkMiddleware } from '@clerk/express'
import express from 'express'
import { serve } from "inngest/express";
import {inngest,functions} from "./inngest/index.js"
import cors from "cors"
import workspaceRouter from './routes/workspace.routes.js';
import { protect } from './middleware/auth.middlewares.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import commentRoutes from './routes/comment.routes.js';
const app = express()

app.use(express.json())
app.use(clerkMiddleware())
app.use(cors({
    origin:"http://localhost:5173",
    Credential:true
}))

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/workspace",protect,workspaceRouter)
app.use("/api/project",protect,projectRoutes)
app.use("/api/task",protect,taskRoutes)
app.use("/api/comment",protect,commentRoutes)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app