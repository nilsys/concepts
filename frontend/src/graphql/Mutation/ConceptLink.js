import gql from 'graphql-tag'

import {
  CREATE_CONCEPT_LINK_FRAGMENT, UPDATE_CONCEPT_LINK_FRAGMENT, DELETE_CONCEPT_LINK_FRAGMENT
} from '../Fragment'

const CREATE_CONCEPT_LINK = gql`
mutation createConceptLink($to: ID!, $from: ID!, $workspaceId: ID!, $official: Boolean,
                           $text: String, $weight: Int) {
  createConceptLink(to: $to, from: $from, workspaceId: $workspaceId, official: $official,
                    text: $text, weight: $weight) {
    ...createConceptLinkData
  }
}
${CREATE_CONCEPT_LINK_FRAGMENT}
`

const UPDATE_CONCEPT_LINK = gql`
mutation updateConceptLink($id: ID!, $official: Boolean, $text: String, $weight: Int) {
  updateConceptLink(id: $id, official: $official, text: $text, weight: $weight) {
    ...updateConceptLinkData
  }
}
${UPDATE_CONCEPT_LINK_FRAGMENT}
`

const DELETE_CONCEPT_LINK = gql`
mutation deleteConceptLink($id: ID!) {
  deleteConceptLink(id: $id) {
    ...deleteConceptLinkData
  }
}
${DELETE_CONCEPT_LINK_FRAGMENT}
`

export {
  CREATE_CONCEPT_LINK,
  UPDATE_CONCEPT_LINK,
  DELETE_CONCEPT_LINK
}
