const concept = require('./Concept')
const course = require('./Course')
const workspace = require('./Workspace')
const project = require('./Project')
const sharing = require('./Sharing')
const user = require('./User')
const port = require('./Port')
module.exports = {
  ...concept,
  ...course,
  ...workspace,
  ...project,
  ...sharing,
  ...user,
  ...port
}
