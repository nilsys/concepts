import React, { useEffect } from 'react'
import vis from 'vis'
import { withStyles } from '@material-ui/core'
import {
  WORKSPACE_DATA_FOR_GRAPH
} from '../../graphql/Query'
import client from '../../apollo/apolloClient'
import colors from './colors'

const styles = () => ({
  graph: {
    gridArea: 'content',
    overflow: 'hidden'
  }
})

// Function to converting rgbArray into CSS rgba() color
const colorToString = ([r, g, b], a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`

// Style for edges between concepts (concept links)
const conceptEdgeStyle = {
  arrows: {
    to: {
      enabled: true,
      scaleFactor: 0.4,
      type: 'arrow'
    }
  },
  color: {
    inherit: 'both'
  },
  shadow: {
    enabled: false
  },
  smooth: {
    enabled: true,
    type: 'straightCross',
    roundness: 0.4
  },
  physics: false
}

// Style for edges between courses (course links)
const courseEdgeStyle = {
  ...conceptEdgeStyle
}

// Style for edges linking concepts to their courses
const conceptToCourseEdgeStyle = {
  dashes: true,
  shadow: {
    enabled: false
  }
}

const commonNodeStyle = {
  widthConstraint: {
    maximum: 175
  }
}

// Style for concept nodes
const conceptNodeStyle = (color) => ({
  ...commonNodeStyle,
  color: colorToString(color.bg, 1)
})

// Style for course nodes
const courseNodeStyle = (color) => ({
  ...commonNodeStyle,
  font: {
    color: 'rgba(52, 52, 52, 0.5)'
  },
  color: {
    background: colorToString(color.bg, 0.25),
    border: colorToString(color.bg, 0.5),
    foreground: colorToString(color.fg, 1),
    highlight: colorToString(color.bg, 0.5)
  },
  shape: 'ellipse',
  mass: 2
})

// Global vis.js options
const visOptions = {
  layout: {
    randomSeed: 1,
    improvedLayout: true
  },
  nodes: {
    shape: 'box',
    shadow: true
  },
  edges: {
    width: 2,
    shadow: true
  },
  physics: {
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.5,
      springLength: 95,
      springConstant: 0.02,
      damping: 0.4,
      avoidOverlap: 0.015
    },
    repulsion: {
      centralGravity: 0.1,
      springLength: 200,
      springConstant: 0.05,
      nodeDistance: 200,
      damping: 0.09
    },
    solver: 'barnesHut'
  }
}

const GraphView = ({ classes, workspaceId }) => {
  useEffect(() => {(async () => {
    const response = await client.query({
      query: WORKSPACE_DATA_FOR_GRAPH,
      variables: {
        id: workspaceId
      }
    })

    const nodes = []
    const edges = []

    let colorIndex = 0

    for (const course of response.data.workspaceById.courses) {
      course.color = colors[colorIndex++]
      for (const concept of course.concepts) {
        nodes.push({
          ...conceptNodeStyle(course.color),
          id: concept.id,
          label: concept.name
        })
        edges.push({
          ...conceptToCourseEdgeStyle,
          from: course.id,
          to: concept.id
        })

        for (const conceptLink of concept.linksToConcept) {
          edges.push({
            ...conceptEdgeStyle,
            from: conceptLink.from.id,
            to: concept.id
          })
        }
      }
      for (const courseLink of course.linksToCourse) {
        if (courseLink.from.id === course.id) {
          continue
        }
        edges.push({
          ...courseEdgeStyle,
          from: courseLink.from.id,
          to: course.id
        })
      }
      nodes.push({
        ...courseNodeStyle(course.color),
        shape: 'dot',
        id: course.id,
        label: course.name
      })
    }

    new vis.Network(document.getElementById('graph'), {
      nodes,
      edges
    }, visOptions)
  })()}, [])

  return <div className={classes.graph} id='graph' />
}


export default withStyles(styles)(GraphView)