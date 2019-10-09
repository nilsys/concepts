import { ForbiddenError } from 'apollo-server-core'

import { checkAccess, Role, Privilege } from '../../util/accessControl'
import { nullShield } from '../../util/errors'
import { createMissingTags, filterTags } from './tagUtils'

import { pubsub } from '../Subscription/config'
const { 
  COURSE_CREATED, 
  COURSE_UPDATED, 
  COURSE_DELETED 
} = require('../Subscription/config/channels')

const CourseQueries = {
  async createCourse(root, { name, workspaceId, official, frozen, tags }, context) {
    await checkAccess(context, {
      minimumRole: Role.GUEST,
      minimumPrivilege: Privilege.EDIT,
      workspaceId
    })

    if (official || frozen) await checkAccess(context, { minimumRole: Role.STAFF, workspaceId })

    const newCourse = context.prisma.createCourse({
      name: name,
      official: Boolean(official),
      frozen: Boolean(frozen),
      createdBy: { connect: { id: context.user.id } },
      workspace: { connect: { id: workspaceId } },
      tags: { connect: await createMissingTags(tags, workspaceId, context, 'courseTags') }
    })

    pubsub.publish(COURSE_CREATED, { courseCreated: newCourse})
    return newCourse
  },

  async deleteCourse(root, { id }, context) {
    const { id: workspaceId } = nullShield(await context.prisma.course({ id }).workspace())
    await checkAccess(context, {
      minimumRole: Role.GUEST,
      minimumPrivilege: Privilege.EDIT,
      workspaceId
    })
    const toDelete = await context.prisma.course({ id })
    if (toDelete.frozen) throw new ForbiddenError('This course is frozen')
    await context.prisma.deleteManyCourseLinks({
      OR: [
        { from: { id } },
        { to: { id } }
      ]
    })
    const deletedCourse = await context.prisma.deleteCourse({ id })
    pubsub.publish(COURSE_DELETED, {courseDeleted: deletedCourse})
    return deletedCourse
  },

  async updateCourse(root, { id, name, official, frozen, tags }, context) {
    const { id: workspaceId } = nullShield(await context.prisma.course({ id }).workspace())
    await checkAccess(context, {
      minimumRole: Role.GUEST,
      minimumPrivilege: Privilege.EDIT,
      workspaceId
    })
    const oldCourse = await context.prisma.course({ id })

    if (oldCourse.frozen && frozen !== false)
      throw new ForbiddenError('This course is frozen')
    if ((official !== undefined && official !== oldCourse.official)
      || (frozen || oldCourse.frozen)) {
      await checkAccess(context, {
        minimumRole: Role.STAFF,
        workspaceId
      })
    }

    const belongsToTemplate = await context.prisma.workspace({ id: workspaceId }).asTemplate()
    const oldTags = await context.prisma.course({ id }).tags()

    const data = {
      tags: await filterTags(tags, oldTags, workspaceId, context, 'courseTags'),
      official: Boolean(official),
      frozen: Boolean(frozen)
    }
    if (name !== undefined) {
      if (!belongsToTemplate && name !== oldCourse.name) data.official = false
      data.name = name
    }
    pubsub.publish(COURSE_UPDATED, {courseUpdated: {...data, id }})
    return await context.prisma.updateCourse({
      where: { id },
      data
    })
  }
}

export default CourseQueries
