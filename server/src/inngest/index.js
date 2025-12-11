import { Inngest } from "inngest";
import prisma from "../../prisma/prisma.config.js"

export const inngest = new Inngest({ id: "project-managment-app" });

const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data.image_url
            }
        })

    }
)

const syncUserDeletation = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: {
                id: data.id
            }
        })

    }
)

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: { id: data.id },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data.image_url
            }
        })

    }
)

const syncWorkSpaceCreation = inngest.createFunction(
    { id: "sync-workspace-from-clerk" },
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const { data } = event
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by,
                image_url: data.image_url
            }
        })
        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId: data.id,
                role: "ADMIN"
            }
        })
    }
)

const syncWorkSpaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk" },
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const { data } = event
        await prisma.workspace.update({
            where: {
                id: data.id
            },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url
            }
        })
    }
)

const syncWorkSpaceDeletation = inngest.createFunction(
    {id:"delete-workspace-with-clerk"},
    {event:"clerk/organization.deleted"},
    async ({event}) => {
        const {data} = event
        await prisma.workspace.delete({
            where:{
                id:data.id
            },
        })
    }
)

const syncWorkSpaceMemberCreation = inngest.createFunction(
    {id:"sync-workspace-member-from-clerk"},
    {event:"clerk/organizationInvitation.accepted"},
    async ({event}) => {
        const {data} = event
        await prisma.workspaceMember.create({
            data:{
                userId:data.user_id,
                workspaceId:data.organization_id,
                role:String(data.role_name).toUpperCase()
            }
        })
    }
)

export const functions = [
    syncUserCreation,
    syncUserDeletation,
    syncUserUpdation,
    syncWorkSpaceCreation,
    syncWorkSpaceUpdation,
    syncWorkSpaceDeletation,
    syncWorkSpaceMemberCreation

];