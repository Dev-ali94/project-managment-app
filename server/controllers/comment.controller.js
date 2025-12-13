import prisma from "../prisma/prisma.config.js";

export const createComment = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { content, taskId } = req.body;

    if (!content || !taskId) {
      return res.status(400).json({ message: "Content and taskId are required" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } }
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const member = project.members.find((m) => m.userId === userId);
    if (!member) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    const comment = await prisma.comment.create({
      data: { taskId, content, userId },
      include: { user: true }
    });

    // Return the comment in a consistent array format
    res.status(201).json({ comments: [comment], message: "Comment created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.code || error.message });
  }
};

export const getAllComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
      orderBy: { createdAt: "asc" } // optional: sort by date
    });

    res.status(200).json({ comments, message: "Comments fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.code || error.message });
  }
};
