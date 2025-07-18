import type { GedcomNode } from '@/types'

const gedcomLineRegex = /^(\d+)\s+(@[^@]+@)?\s*([^\s]+)(?:\s+(.*))?$/

export default function parseGedcom(gedcom: string): GedcomNode[] {
  const lines = gedcom
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const rootNodes: GedcomNode[] = []
  const stack: GedcomNode[] = []

  for (const line of lines) {
    const match = gedcomLineRegex.exec(line)

    if (!match) continue

    const [, levelStr, xrefIdRaw, tag, valueRaw] = match
    const level = parseInt(levelStr, 10)
    const xrefId = xrefIdRaw?.trim()
    const value = valueRaw?.trim()

    const node: GedcomNode = {
      level,
      xrefId,
      tag,
      value,
      children: [],
    }

    // Manage the stack to insert at correct hierarchy
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      rootNodes.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return rootNodes
}
