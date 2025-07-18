import { Group, Text } from '@mantine/core'
import PersonMenu from './PersonMenu'
import { formatName } from '@/utils/common'
import type { Person } from '@/types'

interface PersonListItemProps {
  person: Person
  subtitle?: string
  onView?: () => void
  onEdit?: () => void
  onRemove?: () => void
  onViewFamily?: (() => void) | null
  removeLabel?: string
}

const PersonListItem = ({
  person,
  subtitle,
  onView,
  onEdit,
  onRemove,
  onViewFamily,
  removeLabel,
}: Readonly<PersonListItemProps>) => {
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
    >
      <div>
        <Text fw={500}>{formatName(person)}</Text>
        <Text
          size="sm"
          c="dimmed"
        >
          {subtitle ? `${subtitle} • ${person.id}` : person.id}
        </Text>
      </div>
      <PersonMenu
        onView={onView}
        onEdit={onEdit}
        onRemove={onRemove}
        onViewFamily={onViewFamily}
        removeLabel={removeLabel}
      />
    </Group>
  )
}

export default PersonListItem
