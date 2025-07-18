import { useMemo } from 'react'
import { Spotlight, spotlight, type SpotlightSearchProps } from '@mantine/spotlight'
import { Text, Group, UnstyledButton, Tooltip, ActionIcon } from '@mantine/core'
import { FaSearch } from 'react-icons/fa'
import { observer } from 'mobx-react-lite'
import { formatDates, formatName } from '@/utils/common'
import OverlayManager from '@/utils/overlayManager'
import familyTreeStore from '@/FamilyTreeStore'

import styles from './Search.module.css'

const handleSpotlightOpen = () => {
  OverlayManager.push({
    id: 'search-spotlight',
    onClose: () => {
      spotlight.close()
      OverlayManager.removeById('search-spotlight')
    },
  })
}

const handleSpotlightClose = () => {
  OverlayManager.removeById('search-spotlight')
}

const searchProps: SpotlightSearchProps = {
  leftSection: <FaSearch size={16} />,
  placeholder: 'Search family members...',
}

const Search = observer(({ iconOnly = false }: { iconOnly?: boolean }) => {
  const { dataArray } = familyTreeStore

  const searchActions = useMemo(
    () =>
      dataArray.map((person) => ({
        id: person.id,
        label: formatName(person),
        description: `${formatDates(person) ?? ''} (ID: ${person.id})`,
        onClick: () => {
          familyTreeStore.setSelectedPersonId(person.id)
          familyTreeStore.zoomToNode(person.id)
        },
      })),
    [dataArray],
  )

  const trigger = iconOnly ? (
    <Tooltip label="Search">
      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={() => spotlight.open()}
        aria-label="Search"
      >
        <FaSearch size={18} />
      </ActionIcon>
    </Tooltip>
  ) : (
    <UnstyledButton
      className={styles['wrapper']}
      onClick={() => spotlight.open()}
    >
      <Group gap="xs">
        <FaSearch size={15} />
        <Text
          fz="sm"
          c="dimmed"
          pr={10}
        >
          Search family members
        </Text>
        <Text
          fw={700}
          className={styles['shortcut']}
        >
          Ctrl + K
        </Text>
      </Group>
    </UnstyledButton>
  )

  return (
    <>
      {trigger}
      <Spotlight
        actions={searchActions}
        nothingFound="No people found..."
        limit={7}
        highlightQuery
        searchProps={searchProps}
        onSpotlightOpen={handleSpotlightOpen}
        onSpotlightClose={handleSpotlightClose}
        closeOnClickOutside={true}
        closeOnEscape={true}
      />
    </>
  )
})

export default Search
