import { ForbiddenError } from 'apollo-server-core'

import { checkAccess, Role, Privilege } from '../../util/accessControl'

export const createProject = async (root, args, context) => {
  await checkAccess(context, { minimumRole: Role.STAFF })
  return await context.prisma.createProject({
    name: args.name,
    createdBy: { connect: { id: context.user.id } },
    participants: {
      create: [{
        privilege: Privilege.OWNER.toString(),
        user: { connect: { id: context.user.id } }
      }]
    }
  })
}

export const deleteProject = async (root, args, context) => {
  await checkAccess(context, {
    minimumRole: Role.STAFF,
    minimumPrivilege: Privilege.OWNER,
    projectId: args.id
  })
  if (args.deleteWorkspaces) {
    await context.prisma.deleteManyWorkspaces({
      OR: [
        { asMerge: { id: args.id } },
        { asTemplate: { id: args.id } },
        { sourceProject: { id: args.id } }
      ]
    })
  }
  return await context.prisma.deleteProject({
    id: args.id
  })
}

export const updateProject = async (root, args, context) => {
  await checkAccess(context, {
    minimumRole: Role.STAFF,
    minimumPrivilege: Privilege.EDIT,
    projectId: args.id
  })
  return await context.prisma.updateProject({
    where: { id: args.id },
    data: { name: args.name }
  })
}

export const setActiveTemplate = async (root, args, context) => {
  await checkAccess(context, {
    minimumRole: Role.STAFF,
    minimumPrivilege: Privilege.EDIT,
    projectId: args.projectId
  })

  const activeTemplate = await context.prisma.project({ id: args.projectId }).activeTemplate()
  if (activeTemplate?.id === args.workspaceId) {
    throw new ForbiddenError('Access denied')
  }

  return await context.prisma.updateProject({
    where: { id: args.projectId },
    data: {
      activeTemplate: args.workspaceId
        ? { connect: { id: args.workspaceId } }
        : { disconnect: true }
    }
  })
}

export const promoteMerge = async (root, args, context) => {
  await checkAccess(context, {
    minimumRole: Role.STAFF,
    minimumPrivilege: Privilege.EDIT,
    projectId: args.projectId
  })

  const parentTemplate = await context.prisma.workspace({ id: args.workspaceId }).asMerge()
  if (parentTemplate?.id !== args.projectId) {
    throw new ForbiddenError('Access denied')
  }

  return await context.prisma.updateWorkspace({
    where: { id: args.workspaceId },
    data: {
      asMerge: { disconnect: true },
      asTemplate: { connect: { id: args.projectId } }
    }
  })
}
