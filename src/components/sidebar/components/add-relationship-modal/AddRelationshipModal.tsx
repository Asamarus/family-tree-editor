import { useState, useMemo, useCallback, memo } from 'react'
import { Stack, Group, Button, Radio, Text, Divider } from '@mantine/core'
import { createSpotlight, Spotlight } from '@mantine/spotlight'
import { FaSearch } from 'react-icons/fa'
import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'
import type { Gender, Person } from '@/types'
import PersonForm from '../person-form'
import { formatDates, formatName } from '@/utils/common'
import OverlayManager from '@/utils/overlayManager'
import type { SpotlightStore } from '@mantine/spotlight'

interface AddRelationshipModalProps {
  personId: string
  relationshipType: 'spouse' | 'child' | 'father' | 'mother'
  spouseId?: string
  onClose: () => void
}

const getInitialValues = (relationshipType: string, person?: Person) => {
  if (relationshipType === 'father') return { gender: 'M' as Gender }
  if (relationshipType === 'mother') return { gender: 'F' as Gender }
  if (relationshipType === 'spouse' && person?.data.gender) {
    let gender: Gender
    if (person.data.gender === 'M') {
      gender = 'F'
    } else if (person.data.gender === 'F') {
      gender = 'M'
    } else {
      gender = 'U'
    }
    return {
      gender,
    }
  }
  return undefined
}

// Local type for spotlight actions
interface SpotlightActionItem {
  id: string
  label: string
  description: string
  onClick: () => void
}

const ExistingPersonSelector = memo(
  ({
    availablePersons,
    relationshipType,
    spotlightStore,
    spotlightInstance,
    spotlightActions,
    onSpotlightOpen,
    onSpotlightClose,
  }: {
    availablePersons: Person[]
    relationshipType: string
    spotlightStore: SpotlightStore
    spotlightInstance: ReturnType<typeof createSpotlight>[1]
    spotlightActions: SpotlightActionItem[]
    onSpotlightOpen: () => void
    onSpotlightClose: () => void
  }) => (
    <Stack gap="md">
      <Text
        size="sm"
        c="dimmed"
      >
        Search and select from existing persons in the family tree
      </Text>
      <Button
        leftSection={<FaSearch size={16} />}
        variant="light"
        fullWidth
        onClick={() => spotlightInstance.open()}
        disabled={availablePersons.length === 0}
      >
        {availablePersons.length === 0
          ? `No available persons for ${relationshipType} relationship`
          : `Search ${availablePersons.length} available persons`}
      </Button>
      <Spotlight
        store={spotlightStore}
        actions={spotlightActions}
        nothingFound="No persons found"
        highlightQuery
        limit={7}
        searchProps={{
          leftSection: <FaSearch size={16} />,
          placeholder: `Search persons to add as ${relationshipType}...`,
        }}
        onSpotlightOpen={onSpotlightOpen}
        onSpotlightClose={onSpotlightClose}
        closeOnClickOutside={true}
        closeOnEscape={true}
      />
    </Stack>
  ),
)

const NewPersonForm = memo(
  ({
    relationshipType,
    person,
    onSubmit,
    onCancel,
  }: {
    relationshipType: string
    person?: Person
    onSubmit: (personData: Person) => void
    onCancel: () => void
  }) => (
    <Stack gap="md">
      <Text
        size="sm"
        c="dimmed"
      >
        Create a new person and add them as {relationshipType}
      </Text>
      <PersonForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        initialValues={getInitialValues(relationshipType, person)}
      />
    </Stack>
  ),
)

const AddRelationshipModal = observer(
  ({ personId, relationshipType, spouseId, onClose }: AddRelationshipModalProps) => {
    const [mode, setMode] = useState<'existing' | 'new'>('existing')
    const [spotlightStore, spotlightInstance] = createSpotlight()

    const person = familyTreeStore.data.get(personId)
    const availablePersons = familyTreeStore.getAvailablePersons(personId, relationshipType)

    const handleSelectExisting = useCallback(
      (selectedPersonId: string) => {
        if (relationshipType === 'spouse') {
          familyTreeStore.addSpouse(personId, selectedPersonId)
        } else if (relationshipType === 'child') {
          if (person) {
            familyTreeStore.addChild(selectedPersonId, personId, spouseId)
          }
        } else if (relationshipType === 'father') {
          familyTreeStore.addFather(personId, selectedPersonId)
        } else if (relationshipType === 'mother') {
          familyTreeStore.addMother(personId, selectedPersonId)
        }
        onClose()
      },
      [relationshipType, personId, spouseId, person, onClose],
    )

    const spotlightActions = useMemo(
      () =>
        availablePersons.map((p) => ({
          id: p.id,
          label: formatName(p),
          description: `${formatDates(p) || ''} (ID: ${p.id})`,
          onClick: () => handleSelectExisting(p.id),
        })),
      [availablePersons, handleSelectExisting],
    )

    const handleCreateNew = useCallback(
      (personData: Person) => {
        if (relationshipType === 'father') {
          personData.data.gender = 'M'
        } else if (relationshipType === 'mother') {
          personData.data.gender = 'F'
        }
        familyTreeStore.addPerson(personData, false)
        if (relationshipType === 'spouse') {
          personData.rels.spouses = [personId]
          familyTreeStore.addSpouse(personId, personData.id)
        } else if (relationshipType === 'child') {
          if (person) {
            personData.rels.father = undefined
            personData.rels.mother = undefined
            familyTreeStore.addChild(personData.id, personId, spouseId)
          }
        } else if (relationshipType === 'father') {
          familyTreeStore.addFather(personId, personData.id)
        } else if (relationshipType === 'mother') {
          familyTreeStore.addMother(personId, personData.id)
        }
        onClose()
      },
      [relationshipType, personId, spouseId, person, onClose],
    )

    const handleSpotlightOpen = useCallback(() => {
      OverlayManager.push({
        id: 'relationship-search-spotlight',
        onClose: () => {
          spotlightInstance.close()
          OverlayManager.removeById('relationship-search-spotlight')
        },
      })
    }, [spotlightInstance])

    const handleSpotlightClose = useCallback(() => {
      OverlayManager.removeById('relationship-search-spotlight')
    }, [])

    return (
      <Stack gap="md">
        <Text
          size="lg"
          fw={500}
        >
          Add {relationshipType} to {person ? formatName(person) : 'Unknown Person'}
        </Text>
        <Radio.Group
          value={mode}
          onChange={(value) => setMode(value as 'existing' | 'new')}
          label="Choose option"
          withAsterisk
        >
          <Group mt="xs">
            <Radio
              value="existing"
              label="Select existing person"
            />
            <Radio
              value="new"
              label="Create new person"
            />
          </Group>
        </Radio.Group>
        <Divider />
        {mode === 'existing' ? (
          <ExistingPersonSelector
            availablePersons={availablePersons}
            relationshipType={relationshipType}
            spotlightStore={spotlightStore}
            spotlightInstance={spotlightInstance}
            spotlightActions={spotlightActions}
            onSpotlightOpen={handleSpotlightOpen}
            onSpotlightClose={handleSpotlightClose}
          />
        ) : (
          <NewPersonForm
            relationshipType={relationshipType}
            person={person}
            onSubmit={handleCreateNew}
            onCancel={onClose}
          />
        )}
        {mode === 'existing' && (
          <Group
            justify="flex-end"
            mt="md"
          >
            <Button
              variant="light"
              onClick={onClose}
            >
              Cancel
            </Button>
          </Group>
        )}
      </Stack>
    )
  },
)

export default AddRelationshipModal
