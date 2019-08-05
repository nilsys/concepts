import { gql } from 'apollo-boost'

const PROJECTS_FOR_USER = gql`
query projectsForUser {
  projectsForUser {
    privilege
    project {
      id
      name
    }
  }
}
`

const PROJECT_BY_ID = gql`
query projectById($id: ID!) {
  projectById(id: $id) {
    id
    name
    tokens {
      id
      privilege
    }
    workspaces {
      id
      name
      participants {
        privilege
        user {
          id
        }
      }
    }
    templates {
      id
      name
      tokens {
        id
        privilege
      }
    }
    activeTemplate {
      id
    }
    participants {
      privilege
      user {
        id
      }
    }
  }
}
`

const PROJECT_BY_ID_TEMPLATES = gql`
query projectById($id: ID!) {
  projectById(id: $id) {
    id
    name
    templates {
      id
      name
    }
  }
}
`

const PEEK_ACTIVE_TEMPLATE = gql`
query limitedProjectById($id: ID!) {
  limitedProjectById(id: $id) {
    id
    name
    activeTemplateId
  }
}
`

export {
  PROJECTS_FOR_USER,
  PROJECT_BY_ID,
  PROJECT_BY_ID_TEMPLATES,
  PEEK_ACTIVE_TEMPLATE
}
