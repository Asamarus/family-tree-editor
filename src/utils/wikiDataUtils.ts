import familyTreeStore from '@/FamilyTreeStore'

import type { Gender, Person } from '@/types'

export interface WikiDataPerson {
  id: string
  label: string
  description: string
  image?: string
  birthDate?: string
  deathDate?: string
  gender?: string
}

export interface WikiDataFamily {
  father?: WikiDataPerson
  mother?: WikiDataPerson
  spouses?: WikiDataPerson[]
  children?: Array<{
    child: WikiDataPerson
    otherParent?: WikiDataPerson
  }>
  siblings?: Array<{
    sibling: WikiDataPerson
    father?: WikiDataPerson
    mother?: WikiDataPerson
  }>
}

interface SparqlBinding {
  item?: { value: string }
  itemLabel?: { value: string }
  itemDescription?: { value: string }
  image?: { value: string }
  birthDate?: { value: string }
  deathDate?: { value: string }
  gender?: { value: string }
  relation?: { value: string }
  person?: { value: string }
  personLabel?: { value: string }
  personDescription?: { value: string }
  otherParent?: { value: string }
  otherParentLabel?: { value: string }
  otherParentDescription?: { value: string }
  otherParentImage?: { value: string }
  otherParentBirthDate?: { value: string }
  otherParentDeathDate?: { value: string }
  otherParentGender?: { value: string }
  siblingFather?: { value: string }
  siblingFatherLabel?: { value: string }
  siblingFatherDescription?: { value: string }
  siblingFatherImage?: { value: string }
  siblingFatherBirthDate?: { value: string }
  siblingFatherDeathDate?: { value: string }
  siblingFatherGender?: { value: string }
  siblingMother?: { value: string }
  siblingMotherLabel?: { value: string }
  siblingMotherDescription?: { value: string }
  siblingMotherImage?: { value: string }
  siblingMotherBirthDate?: { value: string }
  siblingMotherDeathDate?: { value: string }
  siblingMotherGender?: { value: string }
}

// Utility to map WikiData gender Q-codes to 'M', 'F', or 'U'
function mapWikiGender(genderValue?: string): 'M' | 'F' | 'U' {
  if (!genderValue) return 'U'
  if (genderValue.includes('Q6581097')) return 'M'
  if (genderValue.includes('Q6581072')) return 'F'
  return 'U'
}

// Utility to validate and format date strings
function getValidDate(val?: string): string | undefined {
  if (!val) return undefined
  let datePart = val.split('T')[0]
  // Handle negative years (BCE)
  let isBCE = false
  if (datePart.startsWith('-')) {
    isBCE = true
    // Remove leading minus and leading zeros in year
    const bceRegex = /-(\d+)-(\d{2})-(\d{2})/
    const match = bceRegex.exec(datePart)
    if (match) {
      // Remove leading zeros from year
      const year = String(Number(match[1]))
      datePart = `${year}-${match[2]}-${match[3]}`
    }
  } else {
    // Remove leading zeros from year if any
    const dateRegex = /(\d+)-(\d{2})-(\d{2})/
    const match = dateRegex.exec(datePart)
    if (match) {
      const year = String(Number(match[1]))
      datePart = `${year}-${match[2]}-${match[3]}`
    }
  }
  if (/^\d{1,4}-\d{2}-\d{2}$/.test(datePart)) {
    return isBCE ? `${datePart} BCE` : datePart
  }
  return undefined
}

// Helper to get a 120px wide Wikimedia Commons image
function getWikiThumbnail(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined
  // Only append if not already present
  return imageUrl.includes('?width=') ? imageUrl : `${imageUrl}?width=120`
}

export const searchWikiData = async (searchQuery: string): Promise<WikiDataPerson[]> => {
  if (!searchQuery.trim()) return []
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    searchQuery,
  )}&language=en&type=item&limit=10&format=json&origin=*`

  const searchResponse = await fetch(searchUrl)
  const searchData = await searchResponse.json()
  const personIds = searchData.search?.map((item: { id: string }) => item.id) ?? []

  if (personIds.length === 0) return []

  const sparqlQuery = `
    SELECT ?item ?itemLabel ?itemDescription ?image ?birthDate ?deathDate ?gender WHERE {
      VALUES ?item { ${personIds.map((id: string) => `wd:${id}`).join(' ')} }
      ?item wdt:P31 ?instanceType .
      FILTER(?instanceType IN (wd:Q5, wd:Q95074, wd:Q15632617, wd:Q22989102))
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?item wdt:P569 ?birthDate . }
      OPTIONAL { ?item wdt:P570 ?deathDate . }
      OPTIONAL { ?item wdt:P21 ?gender . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
  `
  const sparqlUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
    sparqlQuery,
  )}&format=json`

  const detailResponse = await fetch(sparqlUrl)
  const detailData = await detailResponse.json()
  let persons: WikiDataPerson[] =
    detailData.results?.bindings
      ?.map((binding: SparqlBinding) => {
        const label = binding.itemLabel?.value ?? ''
        if (!label || label.startsWith('http')) return undefined
        return {
          id: binding.item?.value.split('/').pop() ?? '',
          label,
          description: binding.itemDescription?.value ?? '',
          image: getWikiThumbnail(binding.image?.value),
          birthDate: getValidDate(binding.birthDate?.value),
          deathDate: getValidDate(binding.deathDate?.value),
          gender: mapWikiGender(binding.gender?.value),
        }
      })
      ?.filter(Boolean) ?? []

  const seen = new Set<string>()
  persons = persons.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  return persons
}

interface FamilyRelations {
  fathers: string[]
  mothers: string[]
  spouses: string[]
  children: Array<{ childId: string; otherParentId?: string }>
  siblings: Array<{ siblingId: string; fatherId?: string; motherId?: string }>
}

interface RelationBinding {
  person?: { value: string }
  relation?: { value: string }
  otherParent?: { value: string }
  siblingFather?: { value: string }
  siblingMother?: { value: string }
}

interface PersonDataBinding {
  item?: { value: string }
  itemLabel?: { value: string }
  itemDescription?: { value: string }
  image?: { value: string }
  birthDate?: { value: string }
  deathDate?: { value: string }
  gender?: { value: string }
}

interface SparqlResponse {
  results?: {
    bindings?: RelationBinding[]
  }
}

function addRelation(
  relations: FamilyRelations,
  allPersonIds: Set<string>,
  binding: RelationBinding,
): void {
  const personId = binding.person?.value.split('/').pop() ?? ''
  const relation = binding.relation?.value

  if (!personId) return
  allPersonIds.add(personId)

  switch (relation) {
    case 'father':
      if (!relations.fathers.includes(personId)) {
        relations.fathers.push(personId)
      }
      break
    case 'mother':
      if (!relations.mothers.includes(personId)) {
        relations.mothers.push(personId)
      }
      break
    case 'spouse':
      if (!relations.spouses.includes(personId)) {
        relations.spouses.push(personId)
      }
      break
    case 'child':
      addChildRelation(relations, allPersonIds, binding, personId)
      break
    case 'sibling':
      addSiblingRelation(relations, allPersonIds, binding, personId)
      break
  }
}

function addChildRelation(
  relations: FamilyRelations,
  allPersonIds: Set<string>,
  binding: RelationBinding,
  personId: string,
): void {
  const otherParentId = binding.otherParent?.value?.split('/').pop()
  if (otherParentId) {
    allPersonIds.add(otherParentId)
  }
  if (!relations.children.some((c) => c.childId === personId)) {
    relations.children.push({ childId: personId, otherParentId })
  }
}

function addSiblingRelation(
  relations: FamilyRelations,
  allPersonIds: Set<string>,
  binding: RelationBinding,
  personId: string,
): void {
  const fatherId = binding.siblingFather?.value?.split('/').pop()
  const motherId = binding.siblingMother?.value?.split('/').pop()
  if (fatherId) allPersonIds.add(fatherId)
  if (motherId) allPersonIds.add(motherId)
  if (!relations.siblings.some((s) => s.siblingId === personId)) {
    relations.siblings.push({ siblingId: personId, fatherId, motherId })
  }
}

function processRelationBindings(relationsData: SparqlResponse): {
  relations: FamilyRelations
  allPersonIds: Set<string>
} {
  const relations: FamilyRelations = {
    fathers: [],
    mothers: [],
    spouses: [],
    children: [],
    siblings: [],
  }
  const allPersonIds = new Set<string>()

  relationsData.results?.bindings?.forEach((binding: RelationBinding) => {
    addRelation(relations, allPersonIds, binding)
  })

  return { relations, allPersonIds }
}

export const loadPersonFamily = async (personId: string): Promise<WikiDataFamily> => {
  // First request: Get person IDs and their relationships
  const relationsQuery = `
    SELECT ?relation ?person ?otherParent ?siblingFather ?siblingMother
    WHERE {
      {
        wd:${personId} wdt:P22 ?person .
        BIND("father" as ?relation)
      } UNION {
        wd:${personId} wdt:P25 ?person .
        BIND("mother" as ?relation)
      } UNION {
        wd:${personId} wdt:P26 ?person .
        BIND("spouse" as ?relation)
      } UNION {
        wd:${personId} p:P40 ?childStatement .
        ?childStatement ps:P40 ?person .
        BIND("child" as ?relation)
        OPTIONAL {
          ?person wdt:P22 ?father .
          ?person wdt:P25 ?mother .
          BIND(IF(?father = wd:${personId}, ?mother, ?father) as ?otherParent)
        }
      } UNION {
        ?person wdt:P22 ?sharedFather .
        wd:${personId} wdt:P22 ?sharedFather .
        FILTER(?person != wd:${personId})
        BIND("sibling" as ?relation)
        OPTIONAL { ?person wdt:P22 ?siblingFather . }
        OPTIONAL { ?person wdt:P25 ?siblingMother . }
      } UNION {
        ?person wdt:P25 ?sharedMother .
        wd:${personId} wdt:P25 ?sharedMother .
        FILTER(?person != wd:${personId})
        BIND("sibling" as ?relation)
        OPTIONAL { ?person wdt:P22 ?siblingFather . }
        OPTIONAL { ?person wdt:P25 ?siblingMother . }
      }
    }
  `

  const relationsUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
    relationsQuery,
  )}&format=json`
  const relationsResponse = await fetch(relationsUrl)
  const relationsData = await relationsResponse.json()

  // Process relationships and collect all person IDs
  const { relations, allPersonIds } = processRelationBindings(relationsData)

  // Second request: Get person data for all collected IDs
  const personDataMap = new Map<string, WikiDataPerson>()

  if (allPersonIds.size > 0) {
    const personIds = Array.from(allPersonIds)
    const dataQuery = `
      SELECT ?item ?itemLabel ?itemDescription ?image ?birthDate ?deathDate ?gender WHERE {
        VALUES ?item { ${personIds.map((id) => `wd:${id}`).join(' ')} }
        OPTIONAL { ?item wdt:P18 ?image . }
        OPTIONAL { ?item wdt:P569 ?birthDate . }
        OPTIONAL { ?item wdt:P570 ?deathDate . }
        OPTIONAL { ?item wdt:P21 ?gender . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `

    const dataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
      dataQuery,
    )}&format=json`
    const dataResponse = await fetch(dataUrl)
    const data = await dataResponse.json()

    data.results?.bindings?.forEach((binding: PersonDataBinding) => {
      const id = binding.item?.value.split('/').pop() ?? ''
      const label = binding.itemLabel?.value ?? ''

      if (!id || !label || label.startsWith('http')) return

      personDataMap.set(id, {
        id,
        label,
        description: binding.itemDescription?.value ?? '',
        image: getWikiThumbnail(binding.image?.value),
        birthDate: getValidDate(binding.birthDate?.value),
        deathDate: getValidDate(binding.deathDate?.value),
        gender: mapWikiGender(binding.gender?.value),
      })
    })
  }

  const family: WikiDataFamily = {
    spouses: [],
    children: [],
    siblings: [],
  }

  if (relations.fathers.length > 0) {
    family.father = personDataMap.get(relations.fathers[0])
  }
  if (relations.mothers.length > 0) {
    family.mother = personDataMap.get(relations.mothers[0])
  }

  family.spouses = relations.spouses
    .map((id: string) => personDataMap.get(id))
    .filter(Boolean) as WikiDataPerson[]

  family.children = relations.children
    .map(({ childId, otherParentId }: { childId: string; otherParentId?: string }) => {
      const child = personDataMap.get(childId)
      const otherParent = otherParentId ? personDataMap.get(otherParentId) : undefined
      return child ? { child, otherParent } : null
    })
    .filter(Boolean) as Array<{ child: WikiDataPerson; otherParent?: WikiDataPerson }>

  family.siblings = relations.siblings
    .map(
      ({
        siblingId,
        fatherId,
        motherId,
      }: {
        siblingId: string
        fatherId?: string
        motherId?: string
      }) => {
        const sibling = personDataMap.get(siblingId)
        const father = fatherId ? personDataMap.get(fatherId) : undefined
        const mother = motherId ? personDataMap.get(motherId) : undefined
        return sibling ? { sibling, father, mother } : null
      },
    )
    .filter(Boolean) as Array<{
    sibling: WikiDataPerson
    father?: WikiDataPerson
    mother?: WikiDataPerson
  }>

  return family
}

export const convertWikiDataToPerson = (
  wikiPerson: WikiDataPerson,
  existingPersons: Person[],
): Person => {
  const existingPerson = existingPersons.find((p) => p.wikiId === wikiPerson.id)
  if (existingPerson) {
    return existingPerson
  }

  let note = wikiPerson.description ? wikiPerson.description + '\n' : ''
  note += `WikiData: https://www.wikidata.org/wiki/${wikiPerson.id}`

  const person: Person = {
    id: wikiPerson.id,
    wikiId: wikiPerson.id,
    rels: {
      spouses: [],
      children: [],
    },
    data: {
      firstName: wikiPerson.label.split(' ')[0] || '',
      lastName: wikiPerson.label.split(' ').slice(1).join(' ') || '',
      birthDay: wikiPerson.birthDate,
      deathDay: wikiPerson.deathDate,
      gender: (wikiPerson.gender as Gender) || 'U',
      avatar: getWikiThumbnail(wikiPerson.image),
      note,
    },
  }

  existingPersons.push(person)

  return person
}

function addSpouseRelation(personA: Person, personB: Person) {
  personA.rels.spouses ??= []
  personB.rels.spouses ??= []
  if (!personA.rels.spouses.includes(personB.id)) {
    personA.rels.spouses.push(personB.id)
  }
  if (!personB.rels.spouses.includes(personA.id)) {
    personB.rels.spouses.push(personA.id)
  }
}

function addChildToParent(parent: Person, child: Person, isFather: boolean) {
  parent.rels.children ??= []
  if (!parent.rels.children.includes(child.id)) {
    parent.rels.children.push(child.id)
  }
  if (isFather) {
    child.rels.father = parent.id
  } else {
    child.rels.mother = parent.id
  }
}

function processParents(family: WikiDataFamily, rootPerson: Person, persons: Person[]) {
  let father: Person | undefined
  let mother: Person | undefined
  if (family.father) {
    father = convertWikiDataToPerson(family.father, persons)
    addChildToParent(father, rootPerson, true)
  }
  if (family.mother) {
    mother = convertWikiDataToPerson(family.mother, persons)
    addChildToParent(mother, rootPerson, false)
  }
  if (father && mother) {
    addSpouseRelation(father, mother)
  }
}

function processSpouses(family: WikiDataFamily, rootPerson: Person, persons: Person[]) {
  if (family.spouses) {
    for (const spouseData of family.spouses) {
      const spouse = convertWikiDataToPerson(spouseData, persons)
      addSpouseRelation(rootPerson, spouse)
    }
  }
}

function processChildren(family: WikiDataFamily, rootPerson: Person, persons: Person[]) {
  if (family.children) {
    for (const childData of family.children) {
      const child = convertWikiDataToPerson(childData.child, persons)

      // Add root person as parent based on their gender
      const isRootFather = rootPerson.data.gender === 'M'
      addChildToParent(rootPerson, child, isRootFather)

      // If we have the other parent information, add them too
      if (childData.otherParent) {
        const otherParent = convertWikiDataToPerson(childData.otherParent, persons)
        const isOtherFather = otherParent.data.gender === 'M'
        addChildToParent(otherParent, child, isOtherFather)

        // Add spouse relationship between parents
        if (rootPerson.id !== otherParent.id) {
          addSpouseRelation(rootPerson, otherParent)
        }
      }
    }
  }
}

function processSiblings(family: WikiDataFamily, existingPersons: Person[]) {
  if (!family.siblings) return

  for (const siblingData of family.siblings) {
    const sibling = convertWikiDataToPerson(siblingData.sibling, existingPersons)

    let father: Person | undefined
    let mother: Person | undefined
    if (siblingData.father) {
      father = convertWikiDataToPerson(siblingData.father, existingPersons)
      addChildToParent(father, sibling, true)
    }
    if (siblingData.mother) {
      mother = convertWikiDataToPerson(siblingData.mother, existingPersons)
      addChildToParent(mother, sibling, false)
    }
    if (father && mother && father.id !== mother.id) {
      addSpouseRelation(father, mother)
    }
  }
}

export const loadImmediateFamily = async (
  rootWikiPerson: WikiDataPerson,
  autoCenter: boolean = true,
) => {
  const family = await loadPersonFamily(rootWikiPerson.id)

  let existingPersons = Array.from(familyTreeStore.data.values())
  existingPersons = JSON.parse(JSON.stringify(existingPersons)) // Deep clone to avoid mutation issues

  const rootPerson = convertWikiDataToPerson(rootWikiPerson, existingPersons)
  rootPerson.wikiLoaded = true

  processParents(family, rootPerson, existingPersons)
  processSpouses(family, rootPerson, existingPersons)
  processChildren(family, rootPerson, existingPersons)
  processSiblings(family, existingPersons)

  await familyTreeStore.setData(existingPersons, autoCenter)
}
