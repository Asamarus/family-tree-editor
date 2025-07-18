import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { openOverlayModal, openOverlayConfirmModal } from '@/utils/overlayModal'
import familyTreeStore from '@/FamilyTreeStore'
import { formatName } from '@/utils/common'
import { loadImmediateFamily, type WikiDataPerson } from '@/utils/wikiDataUtils'
import PersonModal from '../person-modal'
import AddRelationshipModal from '../add-relationship-modal'
import type { Person } from '@/types'
import { Text } from '@mantine/core'

export function handleEditPerson(personId: string) {
  openOverlayModal({
    title: `Edit Person (${personId})`,
    children: (
      <PersonModal
        personId={personId}
        onClose={() => modals.closeAll()}
      />
    ),
    size: 'lg',
    centered: true,
  })
}

export function handleDeletePerson(person: Person) {
  openOverlayConfirmModal({
    title: 'Delete Person',
    children: (
      <Text>
        Are you sure you want to delete{' '}
        <strong>
          {person.data.firstName} {person.data.lastName}
        </strong>
        ? This action cannot be undone and will remove all relationships.
      </Text>
    ),
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => {
      familyTreeStore.deletePerson(person.id)
    },
  })
}

export function handleAddRelationship(
  personId: string,
  relationshipType: 'spouse' | 'father' | 'mother' | 'child',
  spouseId?: string,
) {
  let title = 'Add Child'
  if (relationshipType === 'spouse') title = 'Add Spouse'
  else if (relationshipType === 'father') title = 'Add Father'
  else if (relationshipType === 'mother') title = 'Add Mother'
  openOverlayModal({
    title,
    children: (
      <AddRelationshipModal
        personId={personId}
        relationshipType={relationshipType}
        spouseId={spouseId}
        onClose={() => modals.closeAll()}
      />
    ),
    size: 'lg',
    centered: true,
  })
}

export async function handleLoadFamily(person: Person) {
  if (!person.wikiId) return
  try {
    familyTreeStore.setIsLoading(true)
    const beforeIds = new Set(familyTreeStore.dataIds)
    const wikiDataPerson: WikiDataPerson = {
      id: person.wikiId,
      label: formatName(person),
      description: person.data.note ?? '',
      birthDate: person.data.birthDay,
      deathDate: person.data.deathDay,
      gender: person.data.gender as 'M' | 'F' | 'U',
      image: person.data.avatar,
    }
    await loadImmediateFamily(wikiDataPerson, false)
    familyTreeStore.setHasUnsavedChanges(true)
    const afterIds = new Set(familyTreeStore.dataIds)
    const newIds = Array.from(afterIds).filter((id) => !beforeIds.has(id))
    const newPersons = newIds
      .map((id) => familyTreeStore.data.get(id))
      .filter((p): p is Person => Boolean(p))
    if (newPersons.length > 0) {
      notifications.show({
        title: 'Family Loaded',
        message: `Loaded: ${newPersons.map((p) => formatName(p)).join(', ')}`,
        color: 'green',
        autoClose: 5000,
      })
    } else {
      notifications.show({
        title: 'Family Loaded',
        message: 'No new persons were added.',
        color: 'yellow',
      })
    }
  } catch (error) {
    console.error('Error loading WikiData family:', error)
    openOverlayConfirmModal({
      title: 'Error',
      children: <Text>Failed to load family data from WikiData. Please try again.</Text>,
      labels: { confirm: 'OK', cancel: 'Cancel' },
    })
  } finally {
    familyTreeStore.setIsLoading(false)
  }
}
