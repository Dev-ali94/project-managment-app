import { Inngest } from "inngest";
import prisma from "../prisma/prisma.config.js"

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

    // Validate essential fields
    if (!data.id || !data.created_by || !data.name) {
      console.log("⚠ Missing required fields, skipping workspace creation", data);
      return;
    }

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
      console.log("⚠ Workspace already exists, skipping:", workspaceData.id);
      return;
    }

    await prisma.workspace.create({ data: workspaceData });

    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN"
      }
    });

    console.log("✅ Workspace created:", workspaceData);
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

export const functions = [
    syncUserCreation,
    syncUserDeletation,
    syncUserUpdation,
    syncWorkSpaceCreation,
    syncWorkSpaceUpdation,
    syncWorkSpaceDeletation,
    syncWorkSpaceMemberCreation

];