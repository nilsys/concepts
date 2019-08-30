const { Privilege } = require('../../accessControl')
const { makeTypeResolvers } = require('./typeutil')

module.exports = {
  Workspace: makeTypeResolvers('workspace', [
    'participants',
    'sourceProject',
    'asTemplate',
    'courses',
    'conceptLinks',
    'courseLinks',
    'concepts',
    'clones',
    {
      name: 'pointGroups',
      checkPrivilegeArgs: root => ({
        minimumPrivilege: Privilege.OWNER,
        workspaceId: root.id
      }),
      insufficientPrivilegeValue: () => []
    },
    {
      name: 'tokens',
      checkPrivilegeArgs: root => ({
        minimumPrivilege: Privilege.OWNER,
        workspaceId: root.id
      }),
      insufficientPrivilegeValue: () => []
    }
  ])
}
