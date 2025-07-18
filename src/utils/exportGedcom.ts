import type { GedcomNode } from '@/types'

export default function exportGedcom(
  nodes: GedcomNode[],
  includeGedcomEnvelope: boolean = true,
): string {
  const lines: string[] = []

  if (includeGedcomEnvelope) {
    // Standard GEDCOM header
    lines.push('0 HEAD')
    lines.push('1 SOUR FamilyTreeEditor')
    lines.push('1 GEDC')
    lines.push('2 VERS 5.5.1')
    lines.push('1 CHAR UTF-8')
  }

  function serialize(node: GedcomNode) {
    const parts = [node.level.toString(), node.xrefId ?? '', node.tag, node.value ?? '']
      .filter((part) => part !== '')
      .join(' ')

    lines.push(parts)

    for (const child of node.children) {
      serialize(child)
    }
  }

  for (const node of nodes) {
    serialize(node)
  }

  if (includeGedcomEnvelope) {
    // Standard GEDCOM footer
    lines.push('0 TRLR')
  }

  return lines.join('\n')
}
