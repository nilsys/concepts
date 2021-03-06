import gql from 'graphql-tag'

const CREATE_WORKSPACE = gql`
mutation createWorkspace($name: String!) {
  createWorkspace(name: $name) {
    id
    name
  }
}
`

const UPDATE_WORKSPACE = gql`
mutation updateWorkspace($id: ID!, $name: String, $courseOrder: [ID!]) {
  updateWorkspace(id: $id, name: $name, courseOrder: $courseOrder) {
    id
    name
    courseOrder
  }
}
`

const DELETE_WORKSPACE = gql`
mutation deleteWorkspace($id: ID!) {
  deleteWorkspace(id: $id) {
    id
  }
}
`

const CREATE_TEMPLATE_WORKSPACE = gql`
mutation createTemplateWorkspace($projectId: ID!, $name: String!) {
  createTemplateWorkspace(projectId: $projectId, name: $name) {
    id
    name
  }
}
`

const UPDATE_TEMPLATE_WORKSPACE = gql`
mutation updateTemplateWorkspace($id: ID!, $name: String, $active: Boolean, $courseId: ID) {
  updateTemplateWorkspace(id: $id, name: $name, active: $active, courseId: $courseId) {
    id
    name
    mainCourse {
      id
    }
  }
}
`

const DELETE_TEMPLATE_WORKSPACE = gql`
mutation deleteTemplateWorkspace($id: ID!) {
  deleteTemplateWorkspace(id: $id) {
    id
  }
}
`

const CLONE_TEMPLATE_WORKSPACE = gql`
mutation cloneTemplateWorkspace($name: String!, $projectId: ID!) {
  cloneTemplateWorkspace(name: $name, projectId: $projectId) {
    id
    name
    sourceTemplate {
      id
    }
  }
}
`

export {
  CREATE_WORKSPACE,
  UPDATE_WORKSPACE,
  DELETE_WORKSPACE,
  CREATE_TEMPLATE_WORKSPACE,
  UPDATE_TEMPLATE_WORKSPACE,
  DELETE_TEMPLATE_WORKSPACE,
  CLONE_TEMPLATE_WORKSPACE
}
