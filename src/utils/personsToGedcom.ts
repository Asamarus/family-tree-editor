import type { GedcomNode, Person } from '@/types'

interface FamilyRecord {
  id: string
  husbandId?: string
  wifeId?: string
  childrenIds: string[]
}

const createFamilyKey = (spouseIds: (string | undefined)[]) => {
  const filteredSpouseIds = spouseIds.filter(Boolean) as string[]
  const sortedSpouseIds = filteredSpouseIds.slice().sort((a, b) => a.localeCompare(b))
  return sortedSpouseIds.join('|')
}

function createPersonNode(person: Person): GedcomNode {
  const children: GedcomNode[] = []

  // Add name
  if (person.data.firstName || person.data.lastName) {
    let nameValue = `${person.data.firstName ?? ''}`
    nameValue += ` /${person.data.lastName ?? ''}/`
    if (person.data.suffix) {
      nameValue += ` ${person.data.suffix}`
    }
    nameValue = nameValue.trim()
    children.push({
      level: 1,
      tag: 'NAME',
      value: nameValue,
      children: [],
    })
  }

  // Add gender
  if (person.data.gender) {
    children.push({
      level: 1,
      tag: 'SEX',
      value: person.data.gender,
      children: [],
    })
  }

  // Add birth date
  if (person.data.birthDay) {
    children.push({
      level: 1,
      tag: 'BIRT',
      children: [
        {
          level: 2,
          tag: 'DATE',
          value: person.data.birthDay,
          children: [],
        },
      ],
    })
  }

  // Add death date
  if (person.data.deathDay) {
    children.push({
      level: 1,
      tag: 'DEAT',
      children: [
        {
          level: 2,
          tag: 'DATE',
          value: person.data.deathDay,
          children: [],
        },
      ],
    })
  }

  // Compose note
  const noteParts: string[] = []
  if (person.data.note) noteParts.push(person.data.note.replace(/\r?\n/g, ' '))
  if (person.wikiId) noteParts.push(`wikiId:${person.wikiId}`)
  if (typeof person.wikiLoaded !== 'undefined') noteParts.push(`wikiLoaded:${person.wikiLoaded}`)
  if (person.data.avatar) noteParts.push(`avatar:${person.data.avatar}`)
  if (noteParts.length > 0) {
    children.push({
      level: 1,
      tag: 'NOTE',
      value: noteParts.join('; '),
      children: [],
    })
  }

  return {
    level: 0,
    xrefId: `@${person.id}@`,
    tag: 'INDI',
    children,
  }
}

function createParentChildFamilies(persons: Person[], familyMap: Map<string, FamilyRecord>): void {
  for (const person of persons) {
    if (person.rels.father || person.rels.mother) {
      const parentIds = [person.rels.father, person.rels.mother]
      const familyKey = createFamilyKey(parentIds)

      if (!familyMap.has(familyKey)) {
        familyMap.set(familyKey, {
          id: `F${familyMap.size}`,
          husbandId: person.rels.father,
          wifeId: person.rels.mother,
          childrenIds: [],
        })
      }

      const family = familyMap.get(familyKey)!
      if (!family.childrenIds.includes(person.id)) {
        family.childrenIds.push(person.id)
      }
    }
  }
}

function createSpouseFamily(
  person: Person,
  spouseId: string,
  familyMap: Map<string, FamilyRecord>,
): void {
  const familyKey = createFamilyKey([person.id, spouseId])

  if (!familyMap.has(familyKey)) {
    const isHusband = person.data.gender === 'M'
    familyMap.set(familyKey, {
      id: `F${familyMap.size}`,
      husbandId: isHusband ? person.id : spouseId,
      wifeId: isHusband ? spouseId : person.id,
      childrenIds: person.rels.children ?? [],
    })
  }
}

function createSpouseFamilies(persons: Person[], familyMap: Map<string, FamilyRecord>): void {
  for (const person of persons) {
    if (person.rels.spouses && person.rels.spouses.length > 0) {
      for (const spouseId of person.rels.spouses) {
        createSpouseFamily(person, spouseId, familyMap)
      }
    }
  }
}

function extractFamilies(persons: Person[]): FamilyRecord[] {
  const familyMap = new Map<string, FamilyRecord>()

  createParentChildFamilies(persons, familyMap)
  createSpouseFamilies(persons, familyMap)

  return Array.from(familyMap.values())
}

function extractExistingFamilyIdMap(originalGedcomNodes: GedcomNode[]): Map<string, string> {
  const famIdMap = new Map<string, string>()
  for (const node of originalGedcomNodes) {
    if (node.tag === 'FAM' && node.xrefId) {
      let husbandId: string | undefined
      let wifeId: string | undefined
      for (const child of node.children) {
        if (child.tag === 'HUSB') husbandId = child.value?.replace(/@/g, '')
        if (child.tag === 'WIFE') wifeId = child.value?.replace(/@/g, '')
      }
      const familyKey = createFamilyKey([husbandId, wifeId])
      famIdMap.set(familyKey, node.xrefId)
    }
  }
  return famIdMap
}

function getUsedFamIds(originalGedcomNodes: GedcomNode[]): Set<string> {
  const used = new Set<string>()
  for (const node of originalGedcomNodes) {
    if (node.tag === 'FAM' && node.xrefId) {
      used.add(node.xrefId)
    }
  }
  return used
}

function assignFamilyIds(
  families: FamilyRecord[],
  originalGedcomNodes: GedcomNode[] = [],
): Map<string, string> {
  const famIdMap = extractExistingFamilyIdMap(originalGedcomNodes)
  const usedFamIds = getUsedFamIds(originalGedcomNodes)
  let maxFamNum = 0
  const famIdRegex = /^@F(\d+)@$/
  for (const famId of usedFamIds) {
    const match = famIdRegex.exec(famId)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxFamNum) maxFamNum = num
    }
  }
  const assigned = new Map<string, string>()
  for (const fam of families) {
    const familyKey = createFamilyKey([fam.husbandId, fam.wifeId])
    if (famIdMap.has(familyKey)) {
      assigned.set(fam.id, famIdMap.get(familyKey)!)
    } else {
      let newId: string
      do {
        newId = `@F${++maxFamNum}@`
      } while (usedFamIds.has(newId))
      usedFamIds.add(newId)
      assigned.set(fam.id, newId)
    }
  }
  return assigned
}

function createFamilyNodeWithId(family: FamilyRecord, famId: string): GedcomNode {
  const children: GedcomNode[] = []

  if (family.husbandId) {
    children.push({
      level: 1,
      tag: 'HUSB',
      value: `@${family.husbandId}@`,
      children: [],
    })
  }
  if (family.wifeId) {
    children.push({
      level: 1,
      tag: 'WIFE',
      value: `@${family.wifeId}@`,
      children: [],
    })
  }
  for (const childId of family.childrenIds) {
    children.push({
      level: 1,
      tag: 'CHIL',
      value: `@${childId}@`,
      children: [],
    })
  }
  return {
    level: 0,
    xrefId: famId,
    tag: 'FAM',
    children,
  }
}

function addFamilyReferencesToPersonsWithFamIds(
  persons: Person[],
  families: FamilyRecord[],
  famIdMap: Map<string, string>,
): GedcomNode[] {
  const personNodes = persons.map(createPersonNode)

  function getFamcIds(personId: string): string[] {
    return families
      .filter((fam) => fam.childrenIds.includes(personId))
      .map((fam) => famIdMap.get(fam.id)!)
      .filter(Boolean)
  }

  function getFamsIds(personId: string): string[] {
    return families
      .filter((fam) => fam.husbandId === personId || fam.wifeId === personId)
      .map((fam) => famIdMap.get(fam.id)!)
      .filter(Boolean)
  }

  for (let i = 0; i < persons.length; i++) {
    const person = persons[i]
    const personNode = personNodes[i]

    // Add FAMC (family as child)
    for (const famId of getFamcIds(person.id)) {
      personNode.children.push({
        level: 1,
        tag: 'FAMC',
        value: famId,
        children: [],
      })
    }

    // Add FAMS (family as spouse)
    for (const famId of getFamsIds(person.id)) {
      personNode.children.push({
        level: 1,
        tag: 'FAMS',
        value: famId,
        children: [],
      })
    }
  }
  return personNodes
}

export default function personsToGedcomNodes(
  persons: Person[],
  originalGedcomNodes: GedcomNode[] = [],
): GedcomNode[] {
  if (persons.length === 0) return []
  const families = extractFamilies(persons)
  const famIdMap = assignFamilyIds(families, originalGedcomNodes)
  const personNodes = addFamilyReferencesToPersonsWithFamIds(persons, families, famIdMap)
  const familyNodes = families.map((fam) => createFamilyNodeWithId(fam, famIdMap.get(fam.id)!))
  return [...personNodes, ...familyNodes]
}
