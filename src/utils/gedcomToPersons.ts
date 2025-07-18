import type { GedcomNode, Person, Gender } from '@/types'

// Regex for extracting custom fields from NOTE
const GEDCOM_NOTE_KV_REGEX = /(?:^|;\s*)(wikiId|wikiLoaded|avatar):([^;]+)/g

interface ParsedFamily {
  id: string
  husbandId?: string
  wifeId?: string
  childrenIds: string[]
}

function extractValue(node: GedcomNode): string {
  return node.value ?? ''
}

function extractXrefId(value: string): string {
  return value.replace(/@/g, '')
}

function parseNameValue(nameValue: string): {
  firstName: string
  lastName?: string
  suffix?: string
} {
  // Example: Robert Sargent "Bobby" /Shriver/ III
  const slashIdx = nameValue.indexOf('/')
  let firstName = ''
  let lastName: string | undefined
  let suffix: string | undefined
  if (slashIdx !== -1) {
    firstName = nameValue.slice(0, slashIdx).trim()
    // Find closing slash for lastName
    const lastSlashIdx = nameValue.indexOf('/', slashIdx + 1)
    if (lastSlashIdx !== -1) {
      lastName = nameValue.slice(slashIdx + 1, lastSlashIdx).trim()
      // Suffix is everything after '/ ' (slash and space)
      const afterSlash = nameValue.slice(lastSlashIdx + 1).trim()
      if (afterSlash) {
        suffix = afterSlash
      }
    } else {
      lastName = nameValue.slice(slashIdx + 1).trim()
    }
  } else {
    firstName = nameValue.trim()
  }
  return { firstName, lastName, suffix }
}

function parseNoteFields(
  noteValue: string,
  data: Person['data'],
): { wikiId?: string; wikiLoaded?: boolean } {
  let wikiId: string | undefined
  let wikiLoaded: boolean | undefined
  const toRemove: { key: string; value: string }[] = []
  let match
  while ((match = GEDCOM_NOTE_KV_REGEX.exec(noteValue)) !== null) {
    const key = match[1]
    const value = match[2].trim()
    if (key === 'wikiId') wikiId = value
    if (key === 'wikiLoaded') wikiLoaded = value === 'true'
    if (key === 'avatar') data.avatar = value
    toRemove.push({ key, value })
  }
  // Remove extracted key-value pairs from note
  let cleanedNote = noteValue
  for (const rem of toRemove) {
    // Escape special regex characters in value
    const escapedValue = rem.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(?:^|;\\s*)${rem.key}:${escapedValue}`)
    cleanedNote = cleanedNote.replace(regex, '').trim()
  }
  // Remove leading/trailing semicolons and whitespace
  cleanedNote = cleanedNote.replace(/(^;+)|(;+$)/g, '').trim()
  data.note = cleanedNote || undefined
  return { wikiId, wikiLoaded }
}

function getFullNoteValue(noteNode: GedcomNode): string {
  let note = extractValue(noteNode)
  for (const child of noteNode.children) {
    if (child.tag === 'CONC') {
      note += extractValue(child)
    } else if (child.tag === 'CONT') {
      note += '\n' + extractValue(child)
    }
  }
  return note
}

function extractDateFromNode(node: GedcomNode, tag: string): string | undefined {
  const dateNode = node.children.find((c) => c.tag === tag)
  return dateNode ? extractValue(dateNode) : undefined
}

function handleNameTag(child: GedcomNode, data: Person['data']) {
  const nameData = parseNameValue(extractValue(child))
  Object.assign(data, nameData)
}

function handleSexTag(child: GedcomNode, data: Person['data']) {
  data.gender = extractValue(child) as Gender
}

function handleBirthTag(child: GedcomNode, data: Person['data']) {
  data.birthDay = extractDateFromNode(child, 'DATE')
}

function handleDeathTag(child: GedcomNode, data: Person['data']) {
  data.deathDay = extractDateFromNode(child, 'DATE')
}

function handleNoteTag(child: GedcomNode, data: Person['data']) {
  const noteValue = getFullNoteValue(child)
  if (!noteValue) return {}
  return parseNoteFields(noteValue, data)
}

function parsePersonNode(node: GedcomNode): Omit<Person, 'rels'> {
  const id = extractXrefId(node.xrefId ?? '')
  const data: Person['data'] = { firstName: '' }
  let wikiId: string | undefined
  let wikiLoaded: boolean | undefined

  const tagHandlers: Record<
    string,
    (child: GedcomNode, data: Person['data']) => void | { wikiId?: string; wikiLoaded?: boolean }
  > = {
    NAME: handleNameTag,
    SEX: handleSexTag,
    BIRT: handleBirthTag,
    DEAT: handleDeathTag,
    NOTE: handleNoteTag,
  }

  for (const child of node.children) {
    const handler = tagHandlers[child.tag]
    if (handler) {
      const result = handler(child, data)
      if (child.tag === 'NOTE' && result) {
        if (result.wikiId) wikiId = result.wikiId
        if (typeof result.wikiLoaded !== 'undefined') wikiLoaded = result.wikiLoaded
      }
    }
  }

  return { id, data, wikiId, wikiLoaded }
}

function parseFamilyNode(node: GedcomNode): ParsedFamily {
  const id = extractXrefId(node.xrefId ?? '')
  const family: ParsedFamily = { id, childrenIds: [] }

  for (const child of node.children) {
    if (child.tag === 'HUSB') family.husbandId = extractXrefId(extractValue(child))
    else if (child.tag === 'WIFE') family.wifeId = extractXrefId(extractValue(child))
    else if (child.tag === 'CHIL') family.childrenIds.push(extractXrefId(extractValue(child)))
  }

  return family
}

function setChildrenRelationship(
  persons: Map<string, Person>,
  parentId: string | undefined,
  childId: string,
) {
  if (!parentId) return
  const parent = persons.get(parentId)
  if (parent) {
    parent.rels.children = parent.rels.children || []
    if (!parent.rels.children.includes(childId)) {
      parent.rels.children.push(childId)
    }
  }
}

function setSpouseRelationship(
  persons: Map<string, Person>,
  spouseAId: string,
  spouseBId: string,
  childrenIds: string[],
) {
  const spouseA = persons.get(spouseAId)
  if (spouseA) {
    spouseA.rels.spouses = spouseA.rels.spouses ?? []
    if (!spouseA.rels.spouses.includes(spouseBId)) {
      spouseA.rels.spouses.push(spouseBId)
    }
    spouseA.rels.children = childrenIds.length > 0 ? childrenIds : undefined
  }
}

function setParentChildRelationships(persons: Map<string, Person>, family: ParsedFamily): void {
  for (const childId of family.childrenIds) {
    const child = persons.get(childId)
    if (child) {
      child.rels.father = family.husbandId
      child.rels.mother = family.wifeId
      setChildrenRelationship(persons, family.husbandId, childId)
      setChildrenRelationship(persons, family.wifeId, childId)
    }
  }
}

function setSpouseRelationships(persons: Map<string, Person>, family: ParsedFamily): void {
  if (!family.husbandId || !family.wifeId) return
  setSpouseRelationship(persons, family.husbandId, family.wifeId, family.childrenIds)
  setSpouseRelationship(persons, family.wifeId, family.husbandId, family.childrenIds)
}

function buildPersonRelationships(persons: Map<string, Person>, families: ParsedFamily[]): void {
  for (const family of families) {
    setParentChildRelationships(persons, family)
    setSpouseRelationships(persons, family)
  }
}

export default function gedcomNodesToPersons(gedcomNodes: GedcomNode[]): Person[] {
  const personNodes = gedcomNodes.filter((node) => node.tag === 'INDI')
  const familyNodes = gedcomNodes.filter((node) => node.tag === 'FAM')

  const persons = new Map<string, Person>()
  for (const personNode of personNodes) {
    const parsedPerson = parsePersonNode(personNode)
    const person: Person = {
      ...parsedPerson,
      rels: {},
    }
    persons.set(person.id, person)
  }

  const families = familyNodes.map(parseFamilyNode)

  buildPersonRelationships(persons, families)

  return Array.from(persons.values())
}
