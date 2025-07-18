import { observer } from 'mobx-react-lite'
import clsx from 'clsx'
import { Title, Text, Group, Stack, Button, Image, Card, Badge, ActionIcon } from '@mantine/core'
import { openOverlayConfirmModal } from '@/utils/overlayModal'
import familyTreeStore from '@/FamilyTreeStore'
import { formatName, formatDates } from '@/utils/common'
import ParentList from './ParentList'
import ChildrenList from './ChildrenList'
import RelationCard from './RelationCard'
import { MdAdd, MdDelete, MdDownload, MdEdit } from 'react-icons/md'
import {
  handleEditPerson,
  handleDeletePerson,
  handleAddRelationship,
  handleLoadFamily,
} from './personDetailsHandlers'
import PersonListItem from './PersonListItem'

import type { Person } from '@/types'

import styles from './PersonDetails.module.css'

interface PersonDetailsProps {
  personId: string
}

const PersonDetails = observer(({ personId }: PersonDetailsProps) => {
  const person = familyTreeStore.data.get(personId)
  if (!person) {
    return <Text c="red">Person not found</Text>
  }
  const spouses = familyTreeStore.getSpouses(personId)
  const familyGroups = familyTreeStore.getFamilyGroups(personId)
  const singleParentChildren = familyTreeStore.getSingleParentChildren(personId)
  const father = familyTreeStore.getFather(personId)
  const mother = familyTreeStore.getMother(personId)
  const canLoadFamily =
    person.wikiId && (person.wikiLoaded === false || person.wikiLoaded === undefined)

  let genderColor = 'gray'
  let genderLabel = 'Unknown'
  if (person.data.gender === 'M') {
    genderColor = 'blue'
    genderLabel = 'Male'
  } else if (person.data.gender === 'F') {
    genderColor = 'pink'
    genderLabel = 'Female'
  }

  return (
    <Stack gap="md">
      <Group
        justify="space-between"
        align="center"
      >
        <Title order={3}>Person Details</Title>
        <Button
          size="sm"
          variant="light"
          onClick={() => familyTreeStore.setSelectedPersonId()}
          disabled={familyTreeStore.isLoading}
        >
          Back to Tree
        </Button>
      </Group>
      <div>
        <Title
          order={3}
          className={clsx(styles['person-name'], 'break-word')}
        >
          {formatName(person)}
        </Title>
        <Group
          gap="xs"
          mt="xs"
          wrap="nowrap"
        >
          <Badge
            color={genderColor}
            variant="light"
          >
            {genderLabel}
          </Badge>
          <Text
            size="sm"
            c="dimmed"
            truncate="end"
          >
            {person.id}
          </Text>
        </Group>
      </div>
      <Group
        gap="xs"
        wrap="nowrap"
      >
        <ActionIcon
          variant="light"
          size="lg"
          onClick={() => handleEditPerson(personId)}
        >
          <MdEdit size={18} />
        </ActionIcon>
        <ActionIcon
          variant="light"
          color="red"
          size="lg"
          onClick={() => handleDeletePerson(person)}
        >
          <MdDelete size={18} />
        </ActionIcon>
        {canLoadFamily && (
          <Button
            size="sm"
            variant="light"
            leftSection={<MdDownload size={18} />}
            onClick={() => handleLoadFamily(person)}
            loading={familyTreeStore.isLoading}
            disabled={familyTreeStore.isLoading}
          >
            Load Family
          </Button>
        )}
      </Group>
      {person.data.avatar && (
        <Card className={styles['avatar-card']}>
          <Image
            src={person.data.avatar}
            alt={formatName(person)}
            w={120}
            h={120}
            radius="md"
            mx="auto"
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik02MCA2MEM2OS45NDExIDYwIDc4IDUxLjk0MTEgNzggNDJDNzggMzIuMDU4OSA2OS45NDExIDI0IDYwIDI0QzUwLjA1ODkgMjQgNDIgMzIuMDU4OSA0MiA0MkM0MiA1MS45NDExIDUwLjA1ODkgNjAgNjAgNjBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik0zMCA5NkMzMCA4Mi43NDUyIDQwLjc0NTIgNzIgNTQgNzJINjZDNzguMjU0OCA3MiA5MCA4Mi43NDUyIDkwIDk2VjEwMkgzMFY5NloiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+Cg=="
          />
        </Card>
      )}
      {formatDates(person) && (
        <Card className={styles['info-card']}>
          <Text
            fw={500}
            size="sm"
          >
            {formatDates(person)}
          </Text>
        </Card>
      )}
      {person.data.note && (
        <Card className={styles['info-card']}>
          <Text
            size="sm"
            className="break-word"
          >
            {person.data.note}
          </Text>
        </Card>
      )}
      {/* Parents */}
      <RelationCard title="Parents">
        <Stack gap="xs">
          <ParentList
            person={person}
            parent={father}
            label="Father"
          />
          <ParentList
            person={person}
            parent={mother}
            label="Mother"
          />
        </Stack>
      </RelationCard>

      {/* Spouses Section */}
      <RelationCard title={`Spouses (${spouses.length})`}>
        {spouses.map((spouse) =>
          spouse ? (
            <PersonListItem
              key={spouse.id}
              person={spouse}
              onView={() => {
                familyTreeStore.setSelectedPersonId(spouse.id)
                familyTreeStore.zoomToNode(spouse.id)
              }}
              onEdit={() => handleEditPerson(spouse.id)}
              onRemove={() => {
                openOverlayConfirmModal({
                  title: 'Remove Spouse',
                  children: (
                    <Text>
                      Are you sure you want to remove the spouse relationship between{' '}
                      <strong>{formatName(person)}</strong> and{' '}
                      <strong>{formatName(spouse)}</strong>? This will not delete either person,
                      only the marriage relationship.
                    </Text>
                  ),
                  labels: { confirm: 'Remove', cancel: 'Cancel' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => {
                    familyTreeStore.removeSpouse(personId, spouse.id)
                  },
                })
              }}
              onViewFamily={() => {
                const familyNode = familyTreeStore.nodes.find(
                  (node) =>
                    node.type === 'family' &&
                    node.data.spouseIds?.includes(spouse.id) &&
                    node.data.spouseIds?.includes(personId),
                )
                if (familyNode) {
                  familyTreeStore.setSelectedFamilyId(familyNode.id)
                }
              }}
              removeLabel="Remove Spouse"
            />
          ) : null,
        )}
        <Group
          justify="center"
          mt="md"
        >
          <Button
            size="sm"
            variant="light"
            onClick={() => handleAddRelationship(personId, 'spouse')}
            leftSection={<MdAdd size={18} />}
            disabled={familyTreeStore.isLoading}
          >
            Add Spouse
          </Button>
        </Group>
      </RelationCard>

      {/* Family Groups (children with spouses) */}
      {familyGroups
        .filter((fg) => fg.spouse)
        .map((familyGroup) => (
          <RelationCard
            key={familyGroup.spouse!.id}
            title={`Children with ${formatName(familyGroup.spouse!)} (${
              familyGroup.children.filter(Boolean).length
            })`}
          >
            <ChildrenList
              person={person}
              childList={familyGroup.children.filter(Boolean) as Person[]}
              onRemove={(childId) => {
                openOverlayConfirmModal({
                  title: 'Remove Child',
                  children: (
                    <Text>
                      Are you sure you want to remove the parent-child relationship between{' '}
                      <strong>{formatName(person)}</strong> and <strong>{childId}</strong>? This
                      will not delete either person, only the parent-child relationship.
                    </Text>
                  ),
                  labels: { confirm: 'Remove', cancel: 'Cancel' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => {
                    familyTreeStore.removeChild(personId, childId)
                  },
                })
              }}
            />
            <Group
              justify="center"
              mt="md"
            >
              <Button
                size="sm"
                variant="light"
                onClick={() => handleAddRelationship(personId, 'child', familyGroup.spouse!.id)}
                leftSection={<MdAdd size={18} />}
                disabled={familyTreeStore.isLoading}
              >
                Add Child
              </Button>
            </Group>
          </RelationCard>
        ))}

      {/* Single Parent Children */}
      {singleParentChildren.length > 0 && (
        <RelationCard title={`Children (Single Parent) (${singleParentChildren.length})`}>
          <ChildrenList
            person={person}
            childList={singleParentChildren.filter(Boolean) as Person[]}
            onRemove={(childId) => {
              openOverlayConfirmModal({
                title: 'Remove Child',
                children: (
                  <Text>
                    Are you sure you want to remove the parent-child relationship between{' '}
                    <strong>{formatName(person)}</strong> and <strong>{childId}</strong>? This will
                    not delete either person, only the parent-child relationship.
                  </Text>
                ),
                labels: { confirm: 'Remove', cancel: 'Cancel' },
                confirmProps: { color: 'red' },
                onConfirm: () => {
                  familyTreeStore.removeChild(personId, childId)
                },
              })
            }}
          />
          <Group
            justify="center"
            mt="md"
          >
            <Button
              size="sm"
              variant="light"
              onClick={() => handleAddRelationship(personId, 'child')}
              leftSection={<MdAdd size={18} />}
              disabled={familyTreeStore.isLoading}
            >
              Add Child
            </Button>
          </Group>
        </RelationCard>
      )}

      {/* Add Child Section for persons with no family groups */}
      {spouses.length === 0 && singleParentChildren.length === 0 && (
        <RelationCard title="Children">
          <Text
            size="sm"
            c="dimmed"
            mb="md"
          >
            No children
          </Text>
          <Group justify="center">
            <Button
              size="sm"
              variant="light"
              onClick={() => handleAddRelationship(personId, 'child')}
              leftSection={<MdAdd size={18} />}
              disabled={familyTreeStore.isLoading}
            >
              Add Child
            </Button>
          </Group>
        </RelationCard>
      )}

      {/* Show Add Child (Single Parent) button only if there are no single-parent children */}
      {singleParentChildren.length === 0 &&
        !(spouses.length === 0 && singleParentChildren.length === 0) && (
          <Group justify="center">
            <Button
              size="sm"
              variant="light"
              onClick={() => handleAddRelationship(personId, 'child')}
              leftSection={<MdAdd size={18} />}
              disabled={familyTreeStore.isLoading}
            >
              Add Child (Single Parent)
            </Button>
          </Group>
        )}
    </Stack>
  )
})

export default PersonDetails
