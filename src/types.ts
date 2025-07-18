import type { Node, Edge } from '@xyflow/react'

export interface FamilyTreeRef {
  zoomToNode: (nodeId: string) => void
  centerTree: () => void
  resetZoom: () => void
}

export type Gender = 'M' | 'F' | 'U' // Male, Female, Unknown

export interface Person {
  id: string
  wikiId?: string
  wikiLoaded?: boolean
  rels: {
    father?: string
    mother?: string
    children?: string[]
    spouses?: string[]
  }
  data: {
    firstName: string
    lastName?: string
    suffix?: string
    birthDay?: string
    deathDay?: string
    gender?: Gender
    avatar?: string
    note?: string
  }
}

export interface FamilyMemberNode {
  id: string
  x?: number
  y?: number
  parentFamilyId?: string
}

export interface FamilyNode {
  id: string
  x?: number
  y?: number
  spouseIds?: string[]
  childrenIds?: string[]
  width?: number
  height?: number
  color?: string
}

export interface FamilyMemberNodeData extends Record<string, unknown> {
  parentFamilyId?: string
}

export interface FamilyNodeData extends Record<string, unknown> {
  spouseIds?: string[]
  childrenIds?: string[]
  color?: string
}

export type FamilyMemberFlowNode = Node<FamilyMemberNodeData, 'familyMember'>
export type FamilyFlowNode = Node<FamilyNodeData, 'family'>
export type FamilyFlowEdge = Edge<{
  type: 'spouse' | 'child'
  familyId?: string
  childId?: string
  spouseId?: string
  color?: string
}>

export type GedcomNode = {
  level: number
  xrefId?: string
  tag: string
  value?: string
  children: GedcomNode[]
}
