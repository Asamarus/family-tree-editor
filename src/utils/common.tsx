import PersonModal from '@/components/sidebar/components/person-modal'
import { openOverlayModal, openOverlayConfirmModal } from './overlayModal'
import { modals } from '@mantine/modals'
import familyTreeStore from '@/FamilyTreeStore'
import { Text } from '@mantine/core'
import { data } from '@/example/data'
import WikiDataSearch from '@/components/wiki-data-search'
import type { Person } from '@/types'

export function formatName(person: Person) {
  return `${person.data.firstName} ${person.data.lastName ?? ''}${
    person.data.suffix ? ' ' + person.data.suffix : ''
  }`.trim()
}

export function formatDates(person: Person) {
  const birthDay = person.data.birthDay
  const deathDay = person.data.deathDay

  if (birthDay && deathDay) return `${birthDay} - ${deathDay}`
  if (birthDay) return `Born: ${birthDay}`
  if (deathDay) return `Died: ${deathDay}`
  return null
}

export function getPersonGenderColor(person: Person) {
  if (person.data.gender === 'M') return '#87ceeb' // light blue
  if (person.data.gender === 'F') return '#ffb6c1' // light pink
  return '#e6e6fa' // lavender for unknown
}

export function addNewPerson() {
  openOverlayModal({
    title: 'Add New Person',
    children: <PersonModal onClose={() => modals.closeAll()} />,
    size: 'lg',
    centered: true,
  })
}

export function confirmDestructive(action: () => void, message: string) {
  if (familyTreeStore.hasUnsavedChanges) {
    openOverlayConfirmModal({
      title: 'Unsaved Changes',
      children: (
        <Text>
          {message}
          <br />
          <strong>You have unsaved changes. Export your tree if you want to keep them.</strong>
        </Text>
      ),
      labels: { confirm: 'Proceed', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: action,
    })
  } else {
    action()
  }
}

export function loadDemoData() {
  if (familyTreeStore.hasUnsavedChanges) {
    confirmDestructive(() => {
      familyTreeStore.clearData()
      familyTreeStore.setData(data)
    }, 'Loading demo data will replace your current tree.')
  } else {
    familyTreeStore.setIsLoading(true)
    familyTreeStore.clearData()
    familyTreeStore.setData(data)
  }
}

export function openSearchWikiDataModal() {
  openOverlayModal({
    title: 'Search WikiData',
    children: <WikiDataSearch />,
    size: 'lg',
  })
}
