import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { ReactFlow, ReactFlowProvider, useReactFlow, Background, Controls } from '@xyflow/react'
import { observer } from 'mobx-react-lite'
import { useComputedColorScheme } from '@mantine/core'
import familyTreeStore from '@/FamilyTreeStore'
import FamilyMember from './components/family-member'
import FamilyNode from './components/family-node'
import FamilyLink from './components/family-link'
import { MAX_ZOOM, MIN_ZOOM } from '@/config'

import type { NodeTypes, EdgeTypes } from '@xyflow/react'
import type { FamilyFlowEdge, FamilyTreeRef } from '@/types'

import '@xyflow/react/dist/style.css'
import styles from './FamilyTree.module.css'

const nodeTypes: NodeTypes = {
  familyMember: FamilyMember,
  family: FamilyNode,
}

const edgeTypes: EdgeTypes = {
  family: FamilyLink,
}

const handleEdgeClick = (_: React.MouseEvent, edge: FamilyFlowEdge) => {
  if (edge.data?.familyId) {
    if (familyTreeStore.selectedFamilyId === edge.data.familyId) {
      familyTreeStore.setSelectedFamilyId()
    } else {
      familyTreeStore.setSelectedFamilyId(edge.data.familyId)
    }
  }
}

const FamilyTreeWrapper = () => {
  const treeRef = useRef<FamilyTreeRef>(null)
  useEffect(() => {
    familyTreeStore.setTreeRef(treeRef)
  }, [])

  return (
    <ReactFlowProvider>
      <FamilyTree ref={treeRef} />
    </ReactFlowProvider>
  )
}

const FamilyTree = observer(
  forwardRef<FamilyTreeRef>((_, ref) => {
    const { fitView, zoomTo, setCenter } = useReactFlow()

    useImperativeHandle(ref, () => ({
      zoomToNode: (nodeId: string) => {
        const node = familyTreeStore.nodes.find((n) => n.id === nodeId)
        if (!node || node.position.x === undefined || node.position.y === undefined) return

        setCenter(node.position.x, node.position.y, { zoom: 1, duration: 750 })
      },
      centerTree: () => {
        fitView({ duration: 750, padding: 0.1 })
      },
      resetZoom: () => {
        zoomTo(1, { duration: 750 })
        setCenter(0, 0, { duration: 750 })
      },
    }))

    const colorScheme = useComputedColorScheme('light')

    return (
      <div className={styles['wrapper']}>
        <ReactFlow
          nodes={familyTreeStore.nodes}
          edges={familyTreeStore.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          colorMode={colorScheme}
          nodesDraggable={false}
          nodesConnectable={false}
          selectNodesOnDrag={false}
          onEdgeClick={handleEdgeClick}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    )
  }),
)

export default FamilyTreeWrapper
