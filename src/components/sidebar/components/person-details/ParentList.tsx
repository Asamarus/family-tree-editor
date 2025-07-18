import { Group, Button, Text } from '@mantine/core'
import PersonListItem from './PersonListItem'
import { openOverlayConfirmModal } from '@/utils/overlayModal'
import familyTreeStore from '@/FamilyTreeStore'
import { formatName } from '@/utils/common'
import { MdAdd } from 'react-icons/md'
import { handleAddRelationship, handleEditPerson } from './personDetailsHandlers'
import type { Person } from '@/types'

interface ParentListProps {
  person: Person
  parent: Person | null
  label: string
}

const ParentList = ({ person, parent, label }: Readonly<ParentListProps>) => {
  if (!parent) {
    return (
      <Group justify="space-between">
        <Text c="dimmed">No {label.toLowerCase()}</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<MdAdd size={18} />}
          onClick={() =>
            handleAddRelationship(person.id, label.toLowerCase() as 'father' | 'mother')
          }
          w={120}
          disabled={familyTreeStore.isLoading}
        >
          Add {label}
        </Button>
      </Group>
    )
  }
  return (
    <PersonListItem
      person={parent}
      subtitle={label}
      onView={() => {
        familyTreeStore.setSelectedPersonId(parent.id)
        familyTreeStore.zoomToNode(parent.id)
      }}
      onEdit={() => handleEditPerson(parent.id)}
      onRemove={() => {
        openOverlayConfirmModal({
          title: `Remove ${label}`,
          children: (
            <Text>
              Are you sure you want to remove the {label.toLowerCase()} relationship between{' '}
              <strong>{formatName(person)}</strong> and <strong>{formatName(parent)}</strong>? This
              will only remove the parent relationship, not delete the person.
            </Text>
          ),
          labels: { confirm: 'Remove', cancel: 'Cancel' },
          confirmProps: { color: 'red' },
          onConfirm: () => {
            familyTreeStore.removeChild(parent.id, person.id)
          },
        })
      }}
      onViewFamily={() => {
        const familyNode = familyTreeStore.nodes.find(
          (node) =>
            node.type === 'family' &&
            node.data.spouseIds?.includes(parent.id) &&
            node.data.childrenIds?.includes(person.id),
        )
        if (familyNode) {
          familyTreeStore.setSelectedFamilyId(familyNode.id)
        }
      }}
      removeLabel={`Remove ${label}`}
    />
  )
}

export default ParentList
