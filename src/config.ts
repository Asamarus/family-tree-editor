export const NODE_WIDTH = 200
export const NODE_HEIGHT = 60
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 3

export const FAMILY_NODE_RADIUS = 8

export const FAMILY_NODE_TOP_PADDING = NODE_HEIGHT + 100

export const ELK_LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.spacing.edgeNode': '20',
  'elk.spacing.edgeEdge': '15',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.edgeRouting': 'ORTHOGONAL',
}

export const BREAKPOINT_SM = '(max-width: 768px)'
export const BREAKPOINT_XS = '(max-width: 425px)'
