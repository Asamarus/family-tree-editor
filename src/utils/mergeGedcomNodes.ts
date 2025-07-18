import type { GedcomNode, Person } from '@/types'
import gedcomNodesToPersons from './gedcomToPersons'
import personsToGedcomNodes from './personsToGedcom'

function extractIdFromXref(xrefId?: string): string | undefined {
  return xrefId ? xrefId.replace(/@/g, '') : undefined
}

function setOrUpdateChild(
  node: GedcomNode,
  tag: string,
  value?: string,
  children: GedcomNode[] = [],
) {
  let child = node.children.find((c) => c.tag === tag)
  if (value === undefined && !children.length) {
    // Remove child if value and children are undefined/empty
    node.children = node.children.filter((c) => c.tag !== tag)
    return
  }
  if (!child) {
    child = { level: 1, tag, value, children }
    node.children.push(child)
  } else {
    child.value = value
    child.children = children
  }
}

function updateDateChild(node: GedcomNode, tag: string, newDate?: string) {
  const parent = node.children.find((c) => c.tag === tag)
  if (!parent) return
  const dateChild = parent.children.find((c) => c.tag === 'DATE')
  if (newDate === undefined) {
    // Remove DATE child if newDate is undefined
    parent.children = parent.children.filter((c) => c.tag !== 'DATE')
  } else if (dateChild) {
    dateChild.value = newDate
  } else {
    parent.children.push({
      level: (parent.level ?? 1) + 1,
      tag: 'DATE',
      value: newDate,
      children: [],
    })
  }
}

function removeChildrenNotInNew(node: GedcomNode, tag: string, newChildren: GedcomNode[]) {
  for (let i = node.children.length - 1; i >= 0; i--) {
    if (
      node.children[i].tag === tag &&
      !newChildren.some((nc) => nc.value === node.children[i].value)
    ) {
      node.children.splice(i, 1)
    }
  }
}

function addOrUpdateChildren(node: GedcomNode, tag: string, newChildren: GedcomNode[]) {
  for (const newChild of newChildren) {
    const existing = node.children.find((c) => c.tag === tag && c.value === newChild.value)
    if (!existing) {
      node.children.push({ ...newChild })
    } else {
      existing.value = newChild.value
      existing.children = newChild.children
    }
  }
}

function updateIndiNode(
  node: GedcomNode,
  originalPerson: Person,
  newPerson: Person,
  newGedcomIndiNode?: GedcomNode,
) {
  // Compare and update NAME
  if (
    originalPerson.data.firstName !== newPerson.data.firstName ||
    originalPerson.data.lastName !== newPerson.data.lastName
  ) {
    // Only update value, leave children untouched
    const nameChild = node.children.find((c) => c.tag === 'NAME')
    if (nameChild) {
      nameChild.value = `${newPerson.data.firstName ?? ''} /${
        newPerson.data.lastName ?? ''
      }/`.trim()
    } else {
      setOrUpdateChild(
        node,
        'NAME',
        `${newPerson.data.firstName ?? ''} /${newPerson.data.lastName ?? ''}/`.trim(),
      )
    }
  }
  // Compare and update SEX
  if (originalPerson.data.gender !== newPerson.data.gender) {
    setOrUpdateChild(node, 'SEX', newPerson.data.gender)
  }
  // Compare and update BIRT
  if (originalPerson.data.birthDay !== newPerson.data.birthDay) {
    if (node.children.find((c) => c.tag === 'BIRT')) {
      updateDateChild(node, 'BIRT', newPerson.data.birthDay)
    } else {
      setOrUpdateChild(
        node,
        'BIRT',
        undefined,
        newPerson.data.birthDay
          ? [{ level: 2, tag: 'DATE', value: newPerson.data.birthDay, children: [] }]
          : [],
      )
    }
  }
  // Compare and update DEAT
  if (originalPerson.data.deathDay !== newPerson.data.deathDay) {
    if (node.children.find((c) => c.tag === 'DEAT')) {
      updateDateChild(node, 'DEAT', newPerson.data.deathDay)
    } else {
      setOrUpdateChild(
        node,
        'DEAT',
        undefined,
        newPerson.data.deathDay
          ? [{ level: 2, tag: 'DATE', value: newPerson.data.deathDay, children: [] }]
          : [],
      )
    }
  }
  // Compare and update NOTE
  const origNote = [
    originalPerson.data.note,
    originalPerson.wikiId ? `wikiId:${originalPerson.wikiId}` : '',
    typeof originalPerson.wikiLoaded !== 'undefined'
      ? `wikiLoaded:${originalPerson.wikiLoaded}`
      : '',
    originalPerson.data.avatar ? `avatar:${originalPerson.data.avatar}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  const newNote = [
    newPerson.data.note,
    newPerson.wikiId ? `wikiId:${newPerson.wikiId}` : '',
    typeof newPerson.wikiLoaded !== 'undefined' ? `wikiLoaded:${newPerson.wikiLoaded}` : '',
    newPerson.data.avatar ? `avatar:${newPerson.data.avatar}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  if (origNote !== newNote) {
    setOrUpdateChild(node, 'NOTE', newNote || undefined)
  }
  // Granular update for FAMC and FAMS
  if (newGedcomIndiNode) {
    // FAMC
    const newFAMC = newGedcomIndiNode.children.filter((c) => c.tag === 'FAMC')
    removeChildrenNotInNew(node, 'FAMC', newFAMC)
    addOrUpdateChildren(node, 'FAMC', newFAMC)
    // FAMS
    const newFAMS = newGedcomIndiNode.children.filter((c) => c.tag === 'FAMS')
    removeChildrenNotInNew(node, 'FAMS', newFAMS)
    addOrUpdateChildren(node, 'FAMS', newFAMS)
  }
}

function updateFamNode(node: GedcomNode, newFamNode: GedcomNode) {
  const allowedTags = new Set(['HUSB', 'WIFE', 'CHIL'])
  // Add or update only allowed tags
  for (const newChild of newFamNode.children) {
    if (!allowedTags.has(newChild.tag)) continue
    const origChild = node.children.find(
      (c) => c.tag === newChild.tag && c.value === newChild.value,
    )
    if (!origChild) {
      node.children.push({ ...newChild })
    } else {
      origChild.value = newChild.value
      origChild.children = newChild.children
    }
  }
  // Remove allowed tags not in newFamNode
  for (let i = node.children.length - 1; i >= 0; i--) {
    const origChild = node.children[i]
    if (
      allowedTags.has(origChild.tag) &&
      !newFamNode.children.some((c) => c.tag === origChild.tag && c.value === origChild.value)
    ) {
      node.children.splice(i, 1)
    }
  }
}

// Helper: Remove nodes by tag and xrefId set
function removeNodesByTagAndXrefId(nodes: GedcomNode[], tag: string, validIds: Set<string>) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (node.tag === tag && (!node.xrefId || !validIds.has(node.xrefId))) {
      nodes.splice(i, 1)
    }
  }
}

// Helper: Find last index of a tag
function findLastIndexByTag(nodes: GedcomNode[], tag: string): number {
  let lastIdx = -1
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].tag === tag) lastIdx = i
  }
  return lastIdx
}

// Helper: Add new nodes after last of tag
function addNewNodes(nodes: GedcomNode[], newNodes: GedcomNode[], tag: string) {
  if (newNodes.length === 0) return
  const lastIdx = findLastIndexByTag(nodes, tag)
  const insertIdx = lastIdx >= 0 ? lastIdx + 1 : Math.max(nodes.length - 1, 0)
  nodes.splice(insertIdx, 0, ...newNodes)
}

// Helper: Update existing nodes by tag and xrefId
function updateExistingNodes(
  nodes: GedcomNode[],
  newNodes: GedcomNode[],
  tag: string,
  updater: (node: GedcomNode, newNode: GedcomNode) => void,
) {
  for (const node of nodes) {
    if (node.tag === tag && node.xrefId) {
      const updated = newNodes.find((n) => n.xrefId === node.xrefId)
      if (updated) updater(node, updated)
    }
  }
}

// Helper: Get new nodes not in existing set
function getNewNodes(newNodes: GedcomNode[], existingIds: Set<string>, tag: string): GedcomNode[] {
  return newNodes.filter(
    (node) => node.tag === tag && node.xrefId && !existingIds.has(extractIdFromXref(node.xrefId)!),
  )
}

export default function mergeGedcomNodes(
  originalNodes: GedcomNode[],
  newPersons: Person[],
): GedcomNode[] {
  // Deep clone original nodes
  const result = JSON.parse(JSON.stringify(originalNodes)) as GedcomNode[]
  const originalPersons = gedcomNodesToPersons(originalNodes)
  const originalPersonMap = new Map(originalPersons.map((p) => [p.id, p]))
  const newPersonMap = new Map(newPersons.map((p) => [p.id, p]))
  const existingIds = new Set(originalPersons.map((p) => p.id))
  const newPersonIds = new Set(newPersons.map((p) => p.id))
  const newGedcomNodes = personsToGedcomNodes(newPersons, originalNodes)

  // Remove INDI nodes not in new persons
  for (let i = result.length - 1; i >= 0; i--) {
    const node = result[i]
    if (node.tag === 'INDI') {
      const id = extractIdFromXref(node.xrefId)
      if (!id || !newPersonIds.has(id)) {
        result.splice(i, 1)
      } else {
        // Update INDI node if changed
        const originalPerson = originalPersonMap.get(id)
        const newPerson = newPersonMap.get(id)
        const newGedcomIndiNode = newGedcomNodes.find(
          (n) => n.tag === 'INDI' && extractIdFromXref(n.xrefId) === id,
        )
        if (originalPerson && newPerson) {
          updateIndiNode(node, originalPerson, newPerson, newGedcomIndiNode)
        }
      }
    }
  }

  // Add new INDI nodes
  const newIndiNodes = getNewNodes(newGedcomNodes, existingIds, 'INDI')
  addNewNodes(result, newIndiNodes, 'INDI')

  // Update FAM nodes
  const newFamNodes = newGedcomNodes.filter((node) => node.tag === 'FAM')
  const newFamIds = new Set(newFamNodes.map((node) => node.xrefId).filter(Boolean) as string[])

  // Remove FAM nodes not in newFamIds
  removeNodesByTagAndXrefId(result, 'FAM', newFamIds)

  // Update existing FAM nodes
  updateExistingNodes(result, newFamNodes, 'FAM', (node, newNode) => {
    updateFamNode(node, newNode)
  })

  // Add new FAM nodes
  const existingFamIds = new Set(
    result
      .filter((n) => n.tag === 'FAM' && n.xrefId)
      .map((n) => extractIdFromXref(n.xrefId) as string),
  )
  const famsToAdd = getNewNodes(newFamNodes, existingFamIds, 'FAM')
  addNewNodes(result, famsToAdd, 'FAM')

  return result
}
