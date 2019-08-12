import React, { useEffect, useState, useRef } from 'react'
import { makeStyles, Button, CircularProgress } from '@material-ui/core'
import cytoscape from 'cytoscape'
import klay from 'cytoscape-klay'

import {
  WORKSPACE_DATA_FOR_GRAPH
} from '../../graphql/Query'
import client from '../../apollo/apolloClient'
import colors from './hexcolors'
cytoscape.use(klay)

const useStyles = makeStyles({
  graph: {
    gridArea: 'content',
    overflow: 'hidden'
  },
  button: {
    top: '60px',
    zIndex: '10',
    position: 'absolute'
  }
})

/* eslint-disable max-len, no-unused-vars */
const options = {
  nodeDimensionsIncludeLabels: true, // Boolean which changes whether label dimensions are included when calculating node dimensions
  fit: true, // Whether to fit
  padding: 100, // Padding on fit
  animate: false, // Whether to transition the node positions
  animateFilter: (node, i) => true, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // Duration of animation in ms if enabled
  animationEasing: undefined, // Easing of animation if enabled
  transform: (node, pos) => pos, // A function that applies a transform to the final node position
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  klay: {
    // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
    addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
    aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
    borderSpacing: 20, // Minimal amount of space to be left to the border
    compactComponents: true, // Tries to further compact components (disconnected sub-graphs).
    crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
    /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
    INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
    cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
    /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
    INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
    direction: 'DOWN', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
    /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
    edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
    edgeSpacingFactor: 2.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
    feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
    fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
    /* NONE Chooses the smallest layout from the four possible candidates.
    LEFTUP Chooses the left-up candidate from the four possible candidates.
    RIGHTUP Chooses the right-up candidate from the four possible candidates.
    LEFTDOWN Chooses the left-down candidate from the four possible candidates.
    RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
    BALANCED Creates a balanced layout from the four possible candidates. */
    inLayerSpacingFactor: 2, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
    layoutHierarchy: true, // Whether the selected layouter should consider the full hierarchy
    linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
    mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
    mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
    nodeLayering: 'NETWORK_SIMPLEX', // Strategy for node layering.
    /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
    LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
    INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
    nodePlacement: 'BRANDES_KOEPF', // Strategy for Node Placement
    /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
    LINEAR_SEGMENTS Computes a balanced placement.
    INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
    SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
    randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
    routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
    separateConnectedComponents: true, // Whether each connected component should be processed separately
    spacing: 35, // Overall setting for the minimal amount of space to be left between objects
    thoroughness: 12 // How much effort should be spent to produce a nice layout..
  },
  priority: edge => null // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
}
/* eslint-enable max-len, no-unused-vars */

const GraphView = ({ workspaceId }) => {
  const classes = useStyles()
  const [nextMode, redraw] = useState('courses')
  const state = useRef({
    network: null,
    nodes: null,
    edges: null,
    conceptEdges: null,
    courseEdges: null,
    conceptNodes: null,
    courseNodes: null,
    mode: 'concepts',
    courseLayout: null,
    conceptLayout: null
  })

  const loadingRef = useRef(null)

  const toggleMode = () => {
    const cur = state.current
    if (!cur.network) {
      alert('Network is not defined')
      return
    }
    const oldMode = cur.mode
    cur.mode = nextMode

    cur.network.startBatch()
    cur.network.elements('[type="concept"]').style('display',
      cur.mode === 'concepts' ? 'element' : 'none')
    cur.network.elements('[type="course"]').style('display',
      cur.mode === 'courses' ? 'element' : 'none')
    cur.network.endBatch()

    resetLayout()
    redraw(oldMode)
  }

  const resetLayout = () => {
    const curMode = state.current.mode.slice(0, -1)
    const layout = state.current[`${curMode}Layout`]
    layout.stop()
    layout.run()
  }

  const drawConceptGraph = data => {
    const cur = state.current
    cur.conceptNodes = []
    cur.conceptEdges = []
    cur.courseNodes = []
    cur.courseEdges = []

    let colorIndex = 0
    for (const course of data.workspaceById.courses) {
      course.color = colors[colorIndex++]
      for (const concept of course.concepts) {
        cur.conceptNodes.push({
          group: 'nodes',
          data: {
            id: concept.id,
            label: concept.name,
            title: !concept.description ? 'No description available'
              : concept.description.replace('\n', '</br>'),
            color: course.color.bg,
            type: 'concept',
            display: 'element',
            courseId: course.id
          }
        })

        for (const conceptLink of concept.linksToConcept) {
          cur.conceptEdges.push({
            group: 'edges',
            data: {
              id: conceptLink.from.id + concept.id,
              source: conceptLink.from.id,
              type: 'concept',
              display: 'element',
              target: concept.id
            }
          })
        }
      }

      cur.courseNodes.push({
        data: {
          shape: 'ellipse',
          id: course.id,
          label: course.name,
          type: 'course',
          display: 'none',
          color: course.color.bg
        }
      })

      // Get course nodes
      for (const courseLink of course.linksToCourse) {
        if (courseLink.from.id === course.id) {
          continue
        }
        cur.courseEdges.push({
          data: {
            id: courseLink.from.id + course.id,
            source: courseLink.from.id,
            type: 'course',
            display: 'none',
            target: course.id
          }
        })
      }
    }

    cur.conceptNodes = cur.conceptNodes.filter(node =>
      cur.conceptEdges.find(edge =>
        edge.data.source === node.data.id || edge.data.target === node.data.id)
    )

    cur.courseNodes = cur.courseNodes.filter(node =>
      cur.courseEdges.find(edge =>
        edge.data.source === node.data.id || edge.data.target === node.data.id)
    )

    cur.network = cytoscape({
      container: document.getElementById('graph'),
      elements: [].concat(cur.conceptNodes, cur.conceptEdges, cur.courseNodes, cur.courseEdges),
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'shape': 'round-rectangle',
            'width': 'label',
            'height': 'label',
            'background-color': 'data(color)',
            'text-wrap': 'wrap',
            'text-max-width': '200px',
            'text-valign': 'center',
            'padding': '10px',
            'display': 'data(display)'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 5,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'mid-target-arrow-shape': 'triangle'
          }
        }
      ]
    })

    cur.conceptLayout = cur.network.layout({ ...options, name: 'klay' })
    cur.courseLayout = cur.network.layout({
      ...options,
      klay: {
        ...options.klay,
        direction: 'RIGHT',
        spacing: 50,
        edgeSpacingFactor: 1,
        inLayerSpacingFactor: 0.8
      },
      name: 'klay'
    })
    loadingRef.current.style.display = 'none'

    cur.conceptLayout.run()
  }

  useEffect(() => {
    (async () => {
      const response = await client.query({
        query: WORKSPACE_DATA_FOR_GRAPH,
        variables: {
          id: workspaceId
        }
      })
      drawConceptGraph(response.data)
    })()
  }, [])

  return <>
    <div className={classes.graph} id='graph'>
      {!state.current.network &&
        <div ref={loadingRef} style={{ textAlign: 'center' }}>
          <CircularProgress />
        </div>
      }
    </div>
    <Button
      className={classes.button}
      style={{ left: '10px', width: '200px' }}
      variant='contained'
      color='secondary'
      onClick={toggleMode}
    >
      Switch to {nextMode}
    </Button>
    <Button
      className={classes.button}
      style={{ left: '220px', width: '160px' }}
      variant='contained'
      color='secondary'
      onClick={resetLayout}
    >
      Reset layout
    </Button>
    <Button
      className={classes.button}
      style={{ left: '390px', width: '140px' }}
      variant='contained'
      color='secondary'
      onClick={() => state.current.network.fit([], 100)}
    >
      Reset zoom
    </Button>
  </>
}

export default GraphView
