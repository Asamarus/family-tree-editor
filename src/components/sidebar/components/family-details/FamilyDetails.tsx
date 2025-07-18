import { observer } from 'mobx-react-lite'
import { Title, Text, Group, Stack, Button, Card, Avatar, UnstyledButton } from '@mantine/core'
import { FaChild, FaRing } from 'react-icons/fa'
import familyTreeStore from '@/FamilyTreeStore'
import type { Person } from '@/types'
import { formatName, formatDates } from '@/utils/common'

import clsx from 'clsx'

import styles from './FamilyDetails.module.css'
import { MdOutlineFamilyRestroom } from 'react-icons/md'

interface FamilyDetailsProps {
  familyId: string
}

const FamilyMemberCard = ({ person, onView }: { person: Person; onView: () => void }) => {
  let genderClass = styles['unknown']
  if (person.data.gender === 'M') {
    genderClass = styles['male']
  } else if (person.data.gender === 'F') {
    genderClass = styles['female']
  }
  return (
    <UnstyledButton onClick={onView}>
      <Card
        className={clsx(styles['person-card'], genderClass)}
        padding="xs"
      >
        <Group gap="md">
          {person.data.avatar ? (
            <Avatar
              src={person.data.avatar}
              alt={formatName(person)}
              size="lg"
              className={styles['avatar']}
            />
          ) : (
            <Avatar
              size="lg"
              className={clsx(styles['avatar'], styles['avatar-placeholder'])}
              radius={0}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 512 512"
                fill="#868e96"
              >
                <path d="M256 288c79.5 0 144-64.5 144-144S335.5 0 256 0 112 64.5 112 144s64.5 144 144 144zm128 32h-55.1c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16H128C57.3 320 0 377.3 0 448v16c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48v-16c0-70.7-57.3-128-128-128z" />
              </svg>
            </Avatar>
          )}
          <div className="flex-grow">
            <Text className={styles['full-name']}>{formatName(person)}</Text>
            {formatDates(person) && <Text className={styles['dates']}>{formatDates(person)}</Text>}
            <Text className={styles['id']}>{person.id}</Text>
          </div>
        </Group>
      </Card>
    </UnstyledButton>
  )
}

const FamilyDetails = observer(({ familyId }: FamilyDetailsProps) => {
  const family = familyTreeStore.nodes.find((n) => n.id === familyId)

  if (!family || family.type !== 'family') {
    return <Text c="red">Family not found</Text>
  }

  const spouses = (family.data.spouseIds || [])
    .map((id) => familyTreeStore.data.get(id))
    .filter(Boolean) as Person[]

  const children = (family.data.childrenIds || [])
    .map((id) => familyTreeStore.data.get(id))
    .filter(Boolean) as Person[]

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Family Details</Title>
        <Button
          size="sm"
          variant="light"
          onClick={() => familyTreeStore.setSelectedFamilyId()}
        >
          Back to Tree
        </Button>
      </Group>
      <Card
        className={styles['family-card']}
        style={{ backgroundColor: family.data.color + '20', borderColor: family.data.color }}
      >
        <Group
          gap="xs"
          mb="sm"
        >
          <MdOutlineFamilyRestroom
            style={{ color: family.data.color }}
            size={16}
          />
          <Text
            fw={500}
            size="sm"
            style={{ color: family.data.color }}
          >
            Family ID: {familyId}
          </Text>
        </Group>
        <Text
          size="sm"
          c="#666"
        >
          {spouses.length} spouse{spouses.length !== 1 ? 's' : ''} • {children.length} child
          {children.length !== 1 ? 'ren' : ''}
        </Text>
      </Card>
      {/* Spouses */}
      {spouses.length > 0 && (
        <div>
          <Group
            gap="xs"
            mb="sm"
          >
            <FaRing size={16} />
            <Title order={5}>Spouses</Title>
          </Group>
          <Stack gap="xs">
            {spouses.map((spouse) => (
              <FamilyMemberCard
                key={spouse.id}
                person={spouse}
                onView={() => {
                  familyTreeStore.setSelectedPersonId(spouse.id)
                  familyTreeStore.zoomToNode(spouse.id)
                }}
              />
            ))}
          </Stack>
        </div>
      )}
      {/* Children */}
      {children.length > 0 && (
        <div>
          <Group
            gap="xs"
            mb="sm"
          >
            <FaChild size={16} />
            <Title order={5}>Children</Title>
          </Group>
          <Stack gap="xs">
            {children.map((child) => (
              <FamilyMemberCard
                key={child.id}
                person={child}
                onView={() => {
                  familyTreeStore.setSelectedPersonId(child.id)
                  familyTreeStore.zoomToNode(child.id)
                }}
              />
            ))}
          </Stack>
        </div>
      )}
      {spouses.length === 0 && children.length === 0 && (
        <Card className={styles['empty-card']}>
          <Text
            ta="center"
            c="dimmed"
          >
            This family has no members
          </Text>
        </Card>
      )}
    </Stack>
  )
})

export default FamilyDetails
