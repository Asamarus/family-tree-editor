import type { Person } from '@/types'

const PERSONS_KEY = 'familyTreePersons'
const TREE_NAME_KEY = 'familyTreeName'

export function setPersons(persons: Person[]) {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(persons))
}

export function getPersons(): Person[] {
  const data = localStorage.getItem(PERSONS_KEY)
  return data ? (JSON.parse(data) as Person[]) : []
}

export function setTreeName(name: string) {
  localStorage.setItem(TREE_NAME_KEY, name)
}

export function getTreeName(): string {
  return localStorage.getItem(TREE_NAME_KEY) || ''
}

export function clearLocalStorage() {
  localStorage.removeItem(PERSONS_KEY)
  localStorage.removeItem(TREE_NAME_KEY)
}
