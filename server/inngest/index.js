import { Inngest } from "inngest";
import prisma from "../prisma/prisma.config.js"
import sendMail from "../services/nodemailer.services.js";

export const inngest = new Inngest({ id: "project-managment-app" });

// 2.1 User creation
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses?.[0]?.email_address,
                name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
                image: data.image_url
            }
        });
    }
);

// 2.2 User update
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.update({
            where: { id: data.id },
            data: {
                email: data?.email_addresses?.[0]?.email_address,
                name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
                image: data.image_url
            }
        });
    }
);

// 2.3 User deletion
const syncUserDeletation = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({ where: { id: data.id } });
    }
);

const syncWorkSpaceCreation = inngest.createFunction(
    { id: "sync-workspace-from-clerk" },
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const data = event.data;

        // Use fallback defaults
        const workspaceData = {
            id: data.id,
            name: data.name || "Untitled Workspace",
            slug: data.slug || data.id,
            ownerId: data.created_by,
            image_url: data.image_url || ""
        };

        // Check if workspace already exists
        const exists = await prisma.workspace.findUnique({ where: { id: workspaceData.id } });
        if (exists) {
            return resizeBy.status(404).json({ message: "Worksapce already exist" })
        }

        await prisma.workspace.create({ data: workspaceData });
        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId: data.id,
                role: "ADMIN"
            }
        });
    }
);

// 2.5 Workspace update
const syncWorkSpaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk" },
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url
            }
        });
    }
);

// 2.6 Workspace deletion
const syncWorkSpaceDeletation = inngest.createFunction(
    { id: "delete-workspace-with-clerk" },
    { event: "clerk/organization.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({ where: { id: data.id } });
    }
);

// 2.7 Workspace member creation
const syncWorkSpaceMemberCreation = inngest.createFunction(
    { id: "sync-workspace-member-from-clerk" },
    { event: "clerk/organizationInvitation.accepted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: String(data.role_name).toUpperCase()
            }
        });
    }
);

const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-mail" },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true }
    });

    await sendMail({
      to: task.assignee.email,
      subject: `New Task Assigned in ${task.project.name}`,
      body: `
        <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h2 style="color: #333; margin-bottom: 10px;">New Task Assigned</h2>
            <p style="font-size: 15px; color: #555;">Hi <strong>${task.assignee.name}</strong>,</p>
            <p style="font-size: 15px; color: #555;">You have been assigned a new task in <strong>${task.project.name}</strong>.</p>
            <div style="margin: 20px 0; padding: 15px; background: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 6px;">
              <p style="margin: 0; font-size: 15px; color: #333;"><strong>Task:</strong> ${task.title}</p>
              <p style="margin: 5px 0 0; font-size: 15px; color: #333;"><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
            </div>
            <a href="${origin}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Task</a>
            <p style="font-size: 13px; color: #888; margin-top: 25px;">If you have any questions, feel free to reach out to your project manager.</p>
          </div>
        </div>
      `
    });

    if (new Date(task.due_date).toLocaleDateString() !== new Date().toLocaleDateString()) {
      await step.sleepUntil("wait-for-the-due-date", new Date(task.due_date));

      await step.run("check-if-task-is-completed", async () => {
        const updatedTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        });

        if (!updatedTask) return;

        if (updatedTask.status !== "DONE") {
          await step.run("send-task-reminder-mail", async () => {
            await sendMail({
              to: updatedTask.assignee.email,
              subject: `Reminder for ${updatedTask.project.name}`,
              body: `
                <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background: #f7f7f7;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <h2 style="color: #333; margin-bottom: 10px;">Task Reminder</h2>
                    <p style="font-size: 15px; color: #555;">Hi <strong>${updatedTask.assignee.name}</strong>,</p>
                    <p style="font-size: 15px; color: #555;">This is a reminder that your task in <strong>${updatedTask.project.name}</strong> is still not marked as completed.</p>
                    <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                      <p style="margin: 0; font-size: 15px; color: #333;"><strong>Task:</strong> ${updatedTask.title}</p>
                      <p style="margin: 5px 0 0; font-size: 15px; color: #333;"><strong>Due Date:</strong> ${new Date(updatedTask.due_date).toLocaleDateString()}</p>
                    </div>
                    <a href="${origin}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Task</a>
                    <p style="font-size: 13px; color: #888; margin-top: 25px;">Please make sure to update the task status as soon as possible.</p>
                  </div>
                </div>
              `
            });
          });
        }
      });
    }
  }
);


export const functions = [
    syncUserCreation,
    syncUserDeletation,
    syncUserUpdation,
    syncWorkSpaceCreation,
    syncWorkSpaceUpdation,
    syncWorkSpaceDeletation,
    syncWorkSpaceMemberCreation,
    sendTaskAssignmentEmail

];