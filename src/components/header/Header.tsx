import { Group, Title, ActionIcon, Tooltip, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { GiFamilyTree } from 'react-icons/gi'
import familyTreeStore from '@/FamilyTreeStore'
import { observer } from 'mobx-react-lite'
import Menu from './components/menu'
import Search from './components/search'
import ToggleColorTheme from './components/toggle-color-theme'
import { FaGithub } from 'react-icons/fa'
import { BREAKPOINT_SM, BREAKPOINT_XS } from '@/config'

import styles from './Header.module.css'

const Header = observer(() => {
  const familyTreeName = familyTreeStore.familyTreeName
  const isSm = useMediaQuery(BREAKPOINT_SM)
  const isXs = useMediaQuery(BREAKPOINT_XS)
  let importLabel = null
  if (familyTreeName && !isSm) {
    importLabel = (
      <Text
        size="lg"
        c="dimmed"
        fw={700}
      >
        {familyTreeName}
      </Text>
    )
  }
  return (
    <div className={styles['wrapper']}>
      <Group
        justify="space-between"
        align="center"
      >
        <Group
          align="center"
          gap="md"
        >
          <GiFamilyTree
            size={24}
            color="var(--mantine-primary-color-filled)"
          />
          {!isXs && (
            <>
              <Title
                order={3}
                size="h4"
              >
                Family Tree Editor
              </Title>
              {importLabel}
            </>
          )}
        </Group>

        <Group>
          <Menu />
          <Search iconOnly={isSm} />
          <ToggleColorTheme />
          <Tooltip label="View on GitHub">
            <a
              href="https://github.com/Asamarus/family-tree-editor"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <ActionIcon
                variant="subtle"
                size="lg"
              >
                <FaGithub size={18} />
              </ActionIcon>
            </a>
          </Tooltip>
        </Group>
      </Group>
    </div>
  )
})

export default Header
