import { calculateTreeData } from '@/utils/calculateTreeData'
import { makeAutoObservable, runInAction, toJS } from 'mobx'
import OverlayManager from '@/utils/overlayManager'
import { notifications } from '@mantine/notifications'
import { clearLocalStorage, setPersons, setTreeName } from '@/utils/localstorageHelper'

import type {
  Person,
  FamilyMemberFlowNode,
  FamilyFlowNode,
  FamilyFlowEdge,
  GedcomNode,
  FamilyTreeRef,
} from '@/types'

declare global {
  interface Window {
    __FAMILY_TREE_STORE__?: FamilyTreeStore
  }
}

/**
 * MobX store for managing the state and operations of a family tree visualization application.
 *
 * The `FamilyTreeStore` class encapsulates all logic for manipulating person and family data,
 * handling selections, managing relationships (spouses, parents, children), and recalculating
 * the tree structure for visualization. It also provides utility methods for centering and zooming
 * the tree, tracking unsaved changes, and managing GEDCOM import/export state.
 *
 * @remarks
 * - Uses MobX for observable state management.
 * - Exposes the store globally as `window.__FAMILY_TREE_STORE__` for debugging.
 * - Handles asynchronous recalculation of tree data after mutations.
 *
 * @example
 * ```typescript
 * const store = new FamilyTreeStore();
 * store.addPerson({ id: '@I1@', data: { name: 'John', gender: 'M' }, rels: {} });
 * store.setSelectedId('@I1@');
 * store.addSpouse('@I1@', '@I2@');
 * ```
 */
export class FamilyTreeStore {
  /** Map of person IDs to Person objects. */
  data = new Map<string, Person>()
  /** Array of all person IDs in the tree. */
  dataIds: string[] = []
  /** Currently selected person ID. */
  selectedPersonId?: string
  /** Currently selected family node ID. */
  selectedFamilyId?: string
  /** React ref to the tree visualization component. */
  treeRef?: React.RefObject<FamilyTreeRef | null>
  /** React Flow nodes for rendering. */
  private _reactFlowNodes: (FamilyMemberFlowNode | FamilyFlowNode)[] = []
  /** React Flow edges for rendering. */
  private _reactFlowEdges: FamilyFlowEdge[] = []
  /** Whether the tree is loading. */
  isLoading = false
  /** Whether there are unsaved changes in the store. */
  hasUnsavedChanges = false
  /** Name of the current family tree. */
  familyTreeName: string | null = null
  /** Original GEDCOM tree data for export/merge. */
  originalGedcomNodes: GedcomNode[] | null = null
  /** Whether the FamilyTreeStats drawer is opened. */
  isDrawerOpened = false

  constructor() {
    makeAutoObservable(this)
    window.__FAMILY_TREE_STORE__ = this // Expose store globally for debugging
  }

  /** Sets the tree reference used for zooming and centering operations. */
  setTreeRef(ref: React.RefObject<FamilyTreeRef | null>) {
    this.treeRef = ref
  }

  /** Loads and sets the family tree data, recalculates tree structure, and auto-centers the tree. */
  async setData(data: Person[], autoCenter: boolean = true) {
    this.data = new Map(data.map((person) => [person.id, person]))
    this.dataIds = data.map((person) => person.id)
    this.isLoading = true

    setPersons(data)

    try {
      const treeData = await calculateTreeData(this.data)
      runInAction(() => {
        this._reactFlowNodes = treeData.reactFlowNodes
        this._reactFlowEdges = treeData.reactFlowEdges
        this.isLoading = false
      })

      if (autoCenter) {
        // Auto-center tree after data is loaded
        setTimeout(() => {
          this.centerTree()
        }, 100)
      }
    } catch (error) {
      console.error('Error calculating tree data:', error)
      notifications.show({
        title: 'Family Tree Error',
        message: 'Failed to calculate Family Tree.',
        color: 'red',
      })
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  /** Clears all data and selections from the store. */
  clearData() {
    this.data.clear()
    this.dataIds = []
    this.selectedPersonId = undefined
    this.selectedFamilyId = undefined
    this._reactFlowNodes = []
    this._reactFlowEdges = []
    this.hasUnsavedChanges = false
    this.familyTreeName = null
    this.originalGedcomNodes = null
    clearLocalStorage()
  }

  /** Sets the selected person by ID and clears selected family. */
  setSelectedPersonId(id?: string) {
    this.selectedPersonId = id
    // Clear family selection when person is selected
    if (id) {
      this.selectedFamilyId = undefined
      this.openDrawer()
    } else {
      this.closeDrawer()
    }
  }

  /** Sets the selected family by ID and clears selected person. */
  setSelectedFamilyId(familyId?: string) {
    this.selectedFamilyId = familyId
    // Clear person selection when family is selected
    if (familyId) {
      this.selectedPersonId = undefined
      this.openDrawer()
    } else {
      this.closeDrawer()
    }
  }
  /** Returns the currently selected person object, if any. */
  get selectedPerson() {
    return this.selectedPersonId ? this.data.get(this.selectedPersonId) : undefined
  }

  /** Returns the currently selected family member node in the tree, if any. */
  get selectedFamilyMemberNode() {
    return this._reactFlowNodes.find((node) => node.id === this.selectedPersonId)
  }

  /** Returns the currently selected family node in the tree, if any. */
  get selectedFamilyNode() {
    return this._reactFlowNodes.find((node) => node.id === this.selectedFamilyId)
  }

  /** Returns the React Flow nodes for rendering. */
  get nodes() {
    return this._reactFlowNodes
  }

  /** Returns the React Flow edges for rendering. */
  get edges() {
    return this._reactFlowEdges
  }

  /** Returns all persons as an array. */
  get dataArray(): Person[] {
    return Array.from(this.data.values())
  }

  /** Total number of persons in the tree. */
  get totalPersons() {
    return this.dataArray.length
  }

  /** Total number of families in the tree. */
  get totalFamilies() {
    return this.nodes.filter((n) => n.type === 'family').length
  }

  /** Total number of males in the tree. */
  get totalMales() {
    return this.dataArray.filter((p) => p.data.gender === 'M').length
  }

  /** Total number of females in the tree. */
  get totalFemales() {
    return this.dataArray.filter((p) => p.data.gender === 'F').length
  }

  /** Total number of persons with unknown gender in the tree. */
  get totalUnknownPersons() {
    return this.totalPersons - this.totalMales - this.totalFemales
  }

  /** Total number of spouse relationships in the tree. */
  get totalSpouses() {
    return this.dataArray.reduce((acc, person) => acc + (person.rels.spouses?.length ?? 0), 0) / 2
  }

  /** Total number of children in the tree. */
  get totalChildren() {
    return this.dataArray.filter((p) => p.rels.father ?? p.rels.mother).length
  }

  /** Centers the tree visualization. */
  centerTree() {
    this.treeRef?.current?.centerTree()
  }

  /** Zooms the tree visualization to a specific node. */
  zoomToNode(nodeId: string) {
    this.treeRef?.current?.zoomToNode(nodeId)
  }

  /** Common method to handle post-operation updates */
  private triggerUpdate() {
    this.recalculateTreeData()
    this.hasUnsavedChanges = true
    setPersons(this.dataArray)
  }

  /** Helper method to update a person's relationships */
  private updatePersonRelationships(
    personId: string,
    relationshipUpdates: Partial<Person['rels']>,
  ) {
    const person = this.data.get(personId)
    if (person) {
      this.data.set(personId, {
        ...person,
        rels: { ...person.rels, ...relationshipUpdates },
      })
    }
  }

  /** Helper method to add/remove items from a relationship array */
  private updateRelationshipArray(
    personId: string,
    relationshipKey: 'spouses' | 'children',
    itemId: string,
    operation: 'add' | 'remove',
  ) {
    const person = this.data.get(personId)
    if (!person) return

    const currentArray = person.rels[relationshipKey] || []
    let updatedArray: string[]

    if (operation === 'add' && !currentArray.includes(itemId)) {
      updatedArray = [...currentArray, itemId]
    } else if (operation === 'remove') {
      updatedArray = currentArray.filter((id) => id !== itemId)
    } else {
      return // No change needed
    }

    this.updatePersonRelationships(personId, { [relationshipKey]: updatedArray })
  }

  /** Helper method to create bidirectional spouse relationship */
  private createSpouseRelationship(personId: string, spouseId: string) {
    this.updateRelationshipArray(personId, 'spouses', spouseId, 'add')
    this.updateRelationshipArray(spouseId, 'spouses', personId, 'add')
  }

  /** Helper method to remove bidirectional spouse relationship */
  private removeSpouseRelationship(personId: string, spouseId: string) {
    this.updateRelationshipArray(personId, 'spouses', spouseId, 'remove')
    this.updateRelationshipArray(spouseId, 'spouses', personId, 'remove')
  }

  /** Adds a new person to the tree and optionally recalculates tree data. */
  addPerson(person: Person, recalculate: boolean = true) {
    this.data.set(person.id, person)
    this.dataIds.push(person.id)

    if (recalculate) {
      this.triggerUpdate()
    } else {
      this.hasUnsavedChanges = true
      setPersons(this.dataArray)
    }
  }

  /** Updates an existing person with new data and recalculates tree data. */
  updatePerson(id: string, updates: Partial<Person>) {
    const existingPerson = this.data.get(id)
    if (existingPerson) {
      const updatedPerson = { ...existingPerson, ...updates }
      this.data.set(id, updatedPerson)
      this.triggerUpdate()
    }
  }

  /** Deletes a person and removes all references to them from other persons. */
  deletePerson(id: string) {
    // Remove person from data
    this.data.delete(id)
    this.dataIds = this.dataIds.filter((personId: string) => personId !== id)

    // Clear selection if deleted person was selected
    if (this.selectedPersonId === id) {
      this.selectedPersonId = undefined
    }

    // Remove references to this person from other people's relationships
    this.data.forEach((person: Person) => {
      // Remove from spouses
      if (person.rels.spouses?.includes(id)) {
        this.updateRelationshipArray(person.id, 'spouses', id, 'remove')
      }

      // Remove from father/mother
      if (person.rels.father === id) {
        this.updatePersonRelationships(person.id, { father: undefined })
      }
      if (person.rels.mother === id) {
        this.updatePersonRelationships(person.id, { mother: undefined })
      }

      // Remove from children
      if (person.rels.children?.includes(id)) {
        this.updateRelationshipArray(person.id, 'children', id, 'remove')
      }
    })

    this.triggerUpdate()
  }

  /** Adds a spouse relationship between two persons. */
  addSpouse(personId: string, spouseId: string) {
    const person = this.data.get(personId)
    const spouse = this.data.get(spouseId)

    if (person && spouse) {
      this.createSpouseRelationship(personId, spouseId)
      this.triggerUpdate()
    }
  }

  /** Removes a spouse relationship between two persons. */
  removeSpouse(personId: string, spouseId: string) {
    const person = this.data.get(personId)
    const spouse = this.data.get(spouseId)

    if (person && spouse) {
      this.removeSpouseRelationship(personId, spouseId)
      this.triggerUpdate()
    }
  }

  /** Add a child to the tree, determining father/mother based on parent genders. */
  addChild(childId: string, parent1Id: string, parent2Id?: string) {
    const child = this.data.get(childId)
    const parent1 = this.data.get(parent1Id)
    const parent2 = parent2Id ? this.data.get(parent2Id) : undefined

    if (!child || !parent1) {
      return
    }

    const { fatherId, motherId } = this.determineParents(child, parent1, parent2)

    this.updateChildParents(childId, fatherId, motherId)
    this.addChildToParent(fatherId, childId)
    this.addChildToParent(motherId, childId)

    this.triggerUpdate()
  }

  private determineParents(
    child: Person,
    parent1: Person,
    parent2?: Person,
  ): { fatherId?: string; motherId?: string } {
    let fatherId: string | undefined = child.rels.father
    let motherId: string | undefined = child.rels.mother

    if (parent2) {
      const result = this.determineParentsWithTwoParents(parent1, parent2, fatherId, motherId)
      fatherId = result.fatherId
      motherId = result.motherId
    } else {
      const result = this.determineParentsWithOneParent(parent1, fatherId, motherId)
      fatherId = result.fatherId
      motherId = result.motherId
    }
    return { fatherId, motherId }
  }

  /**
   * Determines father and mother IDs when both parents are provided.
   */
  private determineParentsWithTwoParents(
    parent1: Person,
    parent2: Person,
    fatherId?: string,
    motherId?: string,
  ): { fatherId?: string; motherId?: string } {
    const gender1 = parent1.data.gender
    const gender2 = parent2.data.gender

    // Assign based on explicit gender
    if (gender1 === 'M' && gender2 === 'F') {
      return { fatherId: parent1.id, motherId: parent2.id }
    }
    if (gender1 === 'F' && gender2 === 'M') {
      return { fatherId: parent2.id, motherId: parent1.id }
    }
    if (gender1 === 'M') {
      return { fatherId: parent1.id, motherId: motherId ?? parent2.id }
    }
    if (gender1 === 'F') {
      return { fatherId: fatherId ?? parent2.id, motherId: parent1.id }
    }
    // If gender is unknown, fill missing slots
    if (!fatherId) {
      return { fatherId: parent1.id, motherId: motherId ?? parent2.id }
    }
    if (!motherId) {
      return { fatherId, motherId: parent1.id }
    }
    return { fatherId, motherId }
  }

  /**
   * Determines father and mother IDs when only one parent is provided.
   */
  private determineParentsWithOneParent(
    parent1: Person,
    fatherId?: string,
    motherId?: string,
  ): { fatherId?: string; motherId?: string } {
    const gender = parent1.data.gender

    if (gender === 'M') {
      return { fatherId: parent1.id, motherId }
    }
    if (gender === 'F') {
      return { fatherId, motherId: parent1.id }
    }
    // If gender is unknown, fill missing slot
    if (!fatherId) {
      return { fatherId: parent1.id, motherId }
    }
    if (!motherId) {
      return { fatherId, motherId: parent1.id }
    }
    return { fatherId, motherId }
  }

  private updateChildParents(childId: string, fatherId?: string, motherId?: string) {
    this.updatePersonRelationships(childId, { father: fatherId, mother: motherId })
  }

  private addChildToParent(parentId: string | undefined, childId: string) {
    if (!parentId) return
    this.updateRelationshipArray(parentId, 'children', childId, 'add')
  }

  /** Removes a child relationship between a parent and a child. */
  removeChild(parentId: string, childId: string) {
    const parent = this.data.get(parentId)
    const child = this.data.get(childId)

    if (parent && child) {
      // Remove child from parent's children array
      this.updateRelationshipArray(parentId, 'children', childId, 'remove')

      // Remove only this specific parent from child's father/mother reference
      if (child.rels.father === parentId) {
        this.updatePersonRelationships(childId, { father: undefined })
      }
      if (child.rels.mother === parentId) {
        this.updatePersonRelationships(childId, { mother: undefined })
      }

      this.triggerUpdate()
    }
  }

  /** Adds a father to a child, updates both records, and recalculates tree data. */
  addFather(childId: string, fatherId: string) {
    const child = this.data.get(childId)
    const father = this.data.get(fatherId)
    if (!child || !father) return

    // Update child's father
    this.updatePersonRelationships(childId, { father: fatherId })

    // Add child to father's children array if not present
    this.updateRelationshipArray(fatherId, 'children', childId, 'add')

    // If mother exists, create spouse relationship between father and mother
    if (child.rels.mother) {
      this.createSpouseRelationship(fatherId, child.rels.mother)
    }

    this.triggerUpdate()
  }

  /** Adds a mother to a child, updates both records, and recalculates tree data. */
  addMother(childId: string, motherId: string) {
    const child = this.data.get(childId)
    const mother = this.data.get(motherId)
    if (!child || !mother) return

    // Update child's mother
    this.updatePersonRelationships(childId, { mother: motherId })

    // Add child to mother's children array if not present
    this.updateRelationshipArray(motherId, 'children', childId, 'add')

    // If father exists, create spouse relationship between mother and father
    if (child.rels.father) {
      this.createSpouseRelationship(motherId, child.rels.father)
    }

    this.triggerUpdate()
  }
  /** Recalculates the tree data structure asynchronously. */
  private async recalculateTreeData() {
    this.isLoading = true

    try {
      const treeData = await calculateTreeData(this.data)
      runInAction(() => {
        this._reactFlowNodes = treeData.reactFlowNodes
        this._reactFlowEdges = treeData.reactFlowEdges
        this.isLoading = false
      })
    } catch (error) {
      console.error('Error recalculating tree data:', error)

      notifications.show({
        title: 'Family Tree Error',
        message: 'Failed to recalculate Family Tree.',
        color: 'red',
      })
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  /** Generates a new unique person ID in Gedcom format. */
  getNewPersonId(): string {
    // Gedcom format: @I{number}@
    let maxId = 0
    const idRegex = /^I(\d+)$/
    for (const id of this.data.keys()) {
      const match = idRegex.exec(id)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxId) {
          maxId = num
        }
      }
    }
    return `I${maxId + 1}`
  }
  /**
   * Prints all data in the store to the console for debugging.
   */
  printAllData() {
    const rawData = toJS({
      data: Array.from(this.data.entries()),
      dataIds: this.dataIds,
      selectedPersonId: this.selectedPersonId,
      selectedFamilyId: this.selectedFamilyId,
      treeData: {
        reactFlowNodes: this._reactFlowNodes,
        reactFlowEdges: this._reactFlowEdges,
      },
      isLoading: this.isLoading,
      hasUnsavedChanges: this.hasUnsavedChanges,
      familyTreeName: this.familyTreeName,
      originalGedcomNodes: this.originalGedcomNodes,
      isDrawerOpened: this.isDrawerOpened,
    })

    // Convert to JSON and back to ensure complete serialization and remove any MobX proxies
    const jsonData = JSON.parse(JSON.stringify(rawData))
    console.log('FamilyTreeStore data (raw):', jsonData)
  }

  /**
   * Sets the unsaved changes flag.
   * @param value - Boolean indicating if there are unsaved changes
   */
  setHasUnsavedChanges(value: boolean) {
    this.hasUnsavedChanges = value
  }

  /**
   * Sets the family tree name (from GEDCOM file or WikiData person).
   * @param name - Name of the family tree
   */
  setFamilyTreeName(name: string | null) {
    this.familyTreeName = name

    setTreeName(name || '')
  }

  /**
   * Sets the original imported GEDCOM nodes for later export merging.
   */
  setOriginalGedcomNodes(nodes: GedcomNode[] | null) {
    this.originalGedcomNodes = nodes
  }

  /**
   * Open the drawer (for small screens)
   */
  openDrawer() {
    this.isDrawerOpened = true
    OverlayManager.push({
      id: 'sidebar-drawer',
      onClose: () => this.closeDrawer(),
    })
  }
  /**
   * Close the drawer (for small screens)
   */
  closeDrawer() {
    this.isDrawerOpened = false
    OverlayManager.removeById('sidebar-drawer')
  }

  /**
   * Set whether the tree is loading
   * */
  setIsLoading(value: boolean) {
    this.isLoading = value
  }

  /** Get spouses for a given personId */
  getSpouses(personId: string) {
    const person = this.data.get(personId)
    if (!person) return []
    return (person.rels.spouses || []).map((id) => this.data.get(id)).filter(Boolean)
  }

  /** Get children for a given personId */
  getChildren(personId: string) {
    const person = this.data.get(personId)
    if (!person) return []
    return (person.rels.children || []).map((id) => this.data.get(id)).filter(Boolean)
  }

  /** Get family groups (spouse + shared children) for a given personId */
  getFamilyGroups(personId: string) {
    const spouses = this.getSpouses(personId)
    const children = this.getChildren(personId)
    return spouses.map((spouse) => {
      const sharedChildren = children.filter((child) => {
        return (
          (child!.rels.father === personId && child!.rels.mother === spouse!.id) ||
          (child!.rels.mother === personId && child!.rels.father === spouse!.id)
        )
      })
      return {
        spouse,
        children: sharedChildren,
      }
    })
  }

  /** Get single parent children for a given personId */
  getSingleParentChildren(personId: string) {
    const spouses = this.getSpouses(personId)
    const children = this.getChildren(personId)
    return children.filter((child) => {
      const hasOtherParent = spouses.some(
        (spouse) =>
          (child!.rels.father === personId && child!.rels.mother === spouse!.id) ||
          (child!.rels.mother === personId && child!.rels.father === spouse!.id),
      )
      return !hasOtherParent
    })
  }

  /** Get father for a given personId */
  getFather(personId: string) {
    const person = this.data.get(personId)
    if (!person?.rels.father) return null
    return this.data.get(person.rels.father) || null
  }

  /** Get mother for a given personId */
  getMother(personId: string) {
    const person = this.data.get(personId)
    if (!person?.rels.mother) return null
    return this.data.get(person.rels.mother) || null
  }

  /** Get available persons for a given personId and relationship type */
  getAvailablePersons(personId: string, relationshipType: 'spouse' | 'child' | 'father' | 'mother') {
    const person = this.data.get(personId)
    if (!person) return []
    return this.dataArray.filter((p) => {
      if (p.id === personId) return false
      if (relationshipType === 'spouse') {
        return !(person.rels.spouses || []).includes(p.id)
      } else if (relationshipType === 'child') {
        return !(person.rels.children || []).includes(p.id)
      } else if (relationshipType === 'father') {
        return !person.rels.father && p.data.gender === 'M'
      } else if (relationshipType === 'mother') {
        return !person.rels.mother && p.data.gender === 'F'
      }
      return false
    })
  }
}
const familyTreeStore = new FamilyTreeStore()
export default familyTreeStore
