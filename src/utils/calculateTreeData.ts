import {
  NODE_HEIGHT,
  NODE_WIDTH,
  ELK_LAYOUT_OPTIONS,
  FAMILY_NODE_RADIUS,
  FAMILY_NODE_TOP_PADDING,
} from '@/config'
import { getFamilyColor } from '@/utils/familyColors'
import ELK from 'elkjs/lib/elk-api'

import type {
  FamilyMemberNode,
  FamilyNode,
  Person,
  FamilyMemberFlowNode,
  FamilyFlowNode,
  FamilyFlowEdge,
} from '@/types'

interface ElkNode {
  id: string
  width?: number
  height?: number
  children?: ElkNode[]
  x?: number
  y?: number
}

interface ElkEdge {
  id: string
  sources: string[]
  targets: string[]
  edgeType: 'spouse' | 'child'
  familyId?: string
  childId?: string
  spouseId?: string
}

export interface CalculateTreeDataResult {
  reactFlowNodes: (FamilyMemberFlowNode | FamilyFlowNode)[]
  reactFlowEdges: FamilyFlowEdge[]
}

const createFamilyId = (spouseIds: string[]) => {
  const sortedSpouseIds = spouseIds.slice().sort((a, b) => a.localeCompare(b))
  return `family_${sortedSpouseIds.join('_')}`
}

function createPersonNodes(
  data: Map<string, Person>,
  nodes: Map<string, FamilyMemberNode>,
  elkNodes: ElkNode[],
) {
  for (const person of data.values()) {
    const node: FamilyMemberNode = {
      id: person.id,
      x: 0,
      y: 0,
    }
    nodes.set(person.id, node)
    elkNodes.push({
      id: person.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })
  }
}

function groupPeopleIntoFamilies(data: Map<string, Person>) {
  const families = new Map<string, { spouses: Person[]; children: Person[] }>()
  data.forEach((person) => {
    if (!person.rels.spouses || person.rels.spouses.length === 0) return
    person.rels.spouses.forEach((spouseId) => {
      const spouse = data.get(spouseId)
      if (!spouse) return
      const familyKey = createFamilyId([person.id, spouse.id])
      if (!families.has(familyKey)) {
        families.set(familyKey, { spouses: [person, spouse], children: [] })
      }
    })
  })
  return families
}

function addChildrenToFamilies(
  data: Map<string, Person>,
  families: Map<string, { spouses: Person[]; children: Person[] }>,
) {
  data.forEach((person) => {
    const parentIds = [person.rels.father, person.rels.mother].filter(Boolean) as string[]
    if (parentIds.length === 0) return
    const familyKey = createFamilyId(parentIds)
    const family = families.get(familyKey)
    if (family) {
      family.children.push(person)
    } else {
      // Single parent family
      const parent = data.get(parentIds[0])
      if (parent) {
        families.set(familyKey, { spouses: [parent], children: [person] })
      }
    }
  })
}

function createFamilyNode(
  spouseIds: string[],
  familyNodes: Map<string, FamilyNode>,
  elkNodes: ElkNode[],
  children: Person[] = [],
) {
  const familyId = createFamilyId(spouseIds)
  if (familyNodes.has(familyId)) {
    return familyNodes.get(familyId)!
  }
  const familyNode: FamilyNode = {
    id: familyId,
    spouseIds,
    childrenIds: children.map((c) => c.id),
    x: 0,
    y: 0,
    width: NODE_WIDTH / 2,
    height: NODE_HEIGHT / 2,
    color: getFamilyColor(familyId),
  }
  familyNodes.set(familyId, familyNode)
  elkNodes.push({
    id: familyId,
    width: familyNode.width,
    height: familyNode.height,
  })
  return familyNode
}

function createFamilyNodesAndConnections(
  families: Map<string, { spouses: Person[]; children: Person[] }>,
  familyNodes: Map<string, FamilyNode>,
  elkNodes: ElkNode[],
  elkEdges: ElkEdge[],
  nodes: Map<string, FamilyMemberNode>,
  dummyNodes: Set<string>,
  dummyEdges: Set<string>,
) {
  for (const [, family] of families) {
    const familyNode = createFamilyNode(
      family.spouses.map((s) => s.id),
      familyNodes,
      elkNodes,
      family.children,
    )
    // Connect spouses to family node
    for (const spouse of family.spouses) {
      const edgeId = `spouse_${spouse.id}_${familyNode.id}`
      elkEdges.push({
        id: edgeId,
        sources: [spouse.id],
        targets: [familyNode.id],
        edgeType: 'spouse',
        familyId: familyNode.id,
        spouseId: spouse.id,
      })
    }
    // Connect children to family node
    for (const child of family.children) {
      const childNode = nodes.get(child.id)
      if (childNode) {
        childNode.parentFamilyId = familyNode.id
      }
      const edgeId = `child_${familyNode.id}_${child.id}`
      elkEdges.push({
        id: edgeId,
        sources: [familyNode.id],
        targets: [child.id],
        edgeType: 'child',
        familyId: familyNode.id,
        childId: child.id,
      })
    }
    // Add dummy children if no children exist
    if (family.children.length === 0) {
      const dummyChildId = `dummy_child_${familyNode.id}`
      dummyNodes.add(dummyChildId)
      elkNodes.push({
        id: dummyChildId,
        width: 1,
        height: 1,
      })
      const dummyEdgeId = `dummy_child_edge_${familyNode.id}`
      dummyEdges.add(dummyEdgeId)
      elkEdges.push({
        id: dummyEdgeId,
        sources: [familyNode.id],
        targets: [dummyChildId],
        edgeType: 'child',
        familyId: familyNode.id,
        childId: dummyChildId,
      })
    }
  }
}

function handleSpousesWithoutParents(
  data: Map<string, Person>,
  elkEdges: ElkEdge[],
  elkNodes: ElkNode[],
  dummyNodes: Set<string>,
  dummyEdges: Set<string>,
) {
  for (const person of data.values()) {
    const hasParents = person.rels.father ?? person.rels.mother
    const isConnectedToFamilyNode = elkEdges.some((edge) =>
      edge.id.includes(`spouse_${person.id}_`),
    )
    if (!hasParents && isConnectedToFamilyNode) {
      const dummyParentId = `dummy_parent_${person.id}`
      dummyNodes.add(dummyParentId)
      elkNodes.push({
        id: dummyParentId,
        width: 1,
        height: 1,
      })
      const dummyEdgeId = `dummy_parent_edge_${person.id}`
      dummyEdges.add(dummyEdgeId)
      elkEdges.push({
        id: dummyEdgeId,
        sources: [dummyParentId],
        targets: [person.id],
        edgeType: 'spouse',
        familyId: undefined,
        spouseId: undefined,
        childId: undefined,
      })
    }
  }
}

// Refactored: reduce complexity by splitting logic into smaller helpers
function updateNodePositionsFromElk(
  layoutedGraph: { children?: ElkNode[] },
  nodes: Map<string, FamilyMemberNode>,
  familyNodes: Map<string, FamilyNode>,
) {
  if (!layoutedGraph.children) return
  layoutedGraph.children.forEach((elkNode) => {
    updatePersonNodePosition(elkNode, nodes)
    updateFamilyNodePosition(elkNode, nodes, familyNodes)
  })
}

function updatePersonNodePosition(elkNode: ElkNode, nodes: Map<string, FamilyMemberNode>) {
  const node = nodes.get(elkNode.id)
  if (node) {
    node.x = elkNode.x ?? 0
    node.y = elkNode.y ?? 0
  }
}

function updateFamilyNodePosition(
  elkNode: ElkNode,
  nodes: Map<string, FamilyMemberNode>,
  familyNodes: Map<string, FamilyNode>,
) {
  const familyNode = familyNodes.get(elkNode.id)
  if (!familyNode) return
  familyNode.x = elkNode.x ?? 0
  familyNode.y = elkNode.y ?? 0
  if (familyNode.spouseIds && familyNode.spouseIds.length === 2) {
    const spouse1 = nodes.get(familyNode.spouseIds[0])
    const spouse2 = nodes.get(familyNode.spouseIds[1])
    if (spouse1 && spouse2) {
      familyNode.x =
        ((spouse1.x ?? 0) + NODE_WIDTH / 2 + (spouse2.x ?? 0) + NODE_WIDTH / 2) / 2 -
        (FAMILY_NODE_RADIUS * 2) / 2
      familyNode.y = Math.max(spouse1.y ?? 0, spouse2.y ?? 0) + FAMILY_NODE_TOP_PADDING
    }
  } else if (familyNode.spouseIds && familyNode.spouseIds.length === 1) {
    const spouse = nodes.get(familyNode.spouseIds[0])
    if (spouse) {
      familyNode.x = (spouse.x ?? 0) + NODE_WIDTH / 2 - FAMILY_NODE_RADIUS
      familyNode.y = (spouse.y ?? 0) + FAMILY_NODE_TOP_PADDING
    }
  }
}

function createReactFlowNodes(
  nodes: Map<string, FamilyMemberNode>,
  data: Map<string, Person>,
  dummyNodes: Set<string>,
  familyNodes: Map<string, FamilyNode>,
): (FamilyMemberFlowNode | FamilyFlowNode)[] {
  const reactFlowNodes: (FamilyMemberFlowNode | FamilyFlowNode)[] = []
  for (const [nodeId, node] of nodes) {
    if (!dummyNodes.has(nodeId)) {
      const person = data.get(nodeId)
      if (!person) continue
      reactFlowNodes.push({
        id: nodeId,
        type: 'familyMember',
        position: { x: node.x ?? 0, y: node.y ?? 0 },
        data: {
          parentFamilyId: node.parentFamilyId,
        },
      } as FamilyMemberFlowNode)
    }
  }
  for (const [familyId, familyNode] of familyNodes) {
    reactFlowNodes.push({
      id: familyId,
      type: 'family',
      position: { x: familyNode.x ?? 0, y: familyNode.y ?? 0 },
      data: {
        spouseIds: familyNode.spouseIds,
        childrenIds: familyNode.childrenIds,
        color: familyNode.color,
      },
    } as FamilyFlowNode)
  }
  return reactFlowNodes
}

function createReactFlowEdges(elkEdges: ElkEdge[], dummyEdges: Set<string>): FamilyFlowEdge[] {
  const reactFlowEdges: FamilyFlowEdge[] = []
  for (const elkEdge of elkEdges) {
    if (!dummyEdges.has(elkEdge.id)) {
      const edgeType = elkEdge.edgeType
      const familyId = elkEdge.familyId
      const childId = elkEdge.childId
      const spouseId = elkEdge.spouseId
      // If edgeType is "child", swap source and target
      const isChildEdge = edgeType === 'child'
      reactFlowEdges.push({
        id: elkEdge.id,
        source: isChildEdge ? elkEdge.targets[0] : elkEdge.sources[0],
        target: isChildEdge ? elkEdge.sources[0] : elkEdge.targets[0],
        sourceHandle: isChildEdge ? 'top' : 'bottom',
        targetHandle: isChildEdge ? 'bottom' : 'top',
        type: 'family',
        data: {
          type: edgeType,
          familyId,
          childId,
          spouseId,
          color: getFamilyColor(familyId!),
        },
      } as FamilyFlowEdge)
    }
  }
  return reactFlowEdges
}

export async function calculateTreeData(
  data: Map<string, Person>,
): Promise<CalculateTreeDataResult> {
  if (data.size === 0)
    return {
      reactFlowNodes: [],
      reactFlowEdges: [],
    }

  const elk = new ELK({
    workerFactory: () => new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url)),
  })
  const nodes = new Map<string, FamilyMemberNode>()
  const familyNodes = new Map<string, FamilyNode>()
  const elkNodes: ElkNode[] = []
  const elkEdges: ElkEdge[] = []
  const dummyNodes = new Set<string>()
  const dummyEdges = new Set<string>()

  createPersonNodes(data, nodes, elkNodes)
  const families = groupPeopleIntoFamilies(data)
  addChildrenToFamilies(data, families)
  createFamilyNodesAndConnections(
    families,
    familyNodes,
    elkNodes,
    elkEdges,
    nodes,
    dummyNodes,
    dummyEdges,
  )
  handleSpousesWithoutParents(data, elkEdges, elkNodes, dummyNodes, dummyEdges)

  const elkGraph = {
    id: 'root',
    layoutOptions: ELK_LAYOUT_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  }
  const layoutedGraph = await elk.layout(elkGraph)
  updateNodePositionsFromElk(layoutedGraph, nodes, familyNodes)
  const reactFlowNodes = createReactFlowNodes(nodes, data, dummyNodes, familyNodes)
  const reactFlowEdges = createReactFlowEdges(elkEdges, dummyEdges)
  return {
    reactFlowNodes,
    reactFlowEdges,
  }
}
