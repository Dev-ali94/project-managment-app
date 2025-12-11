import { clerkMiddleware } from '@clerk/express'
import express from 'express'
import { serve } from "inngest/express";
import {inngest,functions} from "./inngest/index.js"
import cors from "cors"
const app = express()

app.use(express.json())
app.use(clerkMiddleware())
app.use(cors({
    origin:"http://localhost:5173",
    Credential:true
}))

app.use("/api/inngest", serve({ client: inngest, functions }));
app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app