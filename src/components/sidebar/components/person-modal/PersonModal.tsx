import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'
import type { Person } from '@/types'
import PersonForm from '../person-form'

interface PersonModalProps {
  personId?: string
  onClose: () => void
}

const PersonModal = observer(({ personId, onClose }: PersonModalProps) => {
  const handleSubmit = (personData: Person) => {
    const isEditing = !!personId
    if (isEditing) {
      familyTreeStore.updatePerson(personId, personData)
    } else {
      familyTreeStore.addPerson(personData)
    }

    // If adding (not editing), select the new person
    if (!personId && personData?.id) {
      familyTreeStore.setSelectedPersonId(personData.id)

      setTimeout(() => {
        familyTreeStore.zoomToNode(personData.id)
      }, 1000) // Allow time for selection to update
    }
    onClose()
  }

  return (
    <PersonForm
      personId={personId}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  )
})

export default PersonModal
