import { observer } from 'mobx-react-lite'
import { Box, ScrollArea, Drawer } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import familyTreeStore from '@/FamilyTreeStore'
import FamilyTreeStats from './components/family-tree-stats'
import PersonDetails from './components/person-details'
import FamilyDetails from './components/family-details'
import { BREAKPOINT_SM } from '@/config'

import styles from './Sidebar.module.css'

const Sidebar = observer(() => {
  const isSm = useMediaQuery(BREAKPOINT_SM)
  const isDrawerOpened = familyTreeStore.isDrawerOpened
  const showDrawer = !!(isSm && isDrawerOpened)

  const renderContent = (isDrawer = false) => {
    if (familyTreeStore.selectedPersonId) {
      return <PersonDetails personId={familyTreeStore.selectedPersonId} />
    }
    if (familyTreeStore.selectedFamilyId) {
      return <FamilyDetails familyId={familyTreeStore.selectedFamilyId} />
    }
    if (isDrawer) {
      return <FamilyTreeStats showImportLabel />
    }
    return <FamilyTreeStats />
  }

  // Desktop sidebar
  if (!isSm) {
    return (
      <Box className={styles['sidebar']}>
        <ScrollArea
          h="100%"
          scrollbarSize={8}
        >
          <Box p="md">{renderContent()}</Box>
        </ScrollArea>
      </Box>
    )
  }

  // Drawer for small screens
  return (
    <Drawer
      opened={showDrawer}
      onClose={() => {
        familyTreeStore.closeDrawer()
      }}
      position="bottom"
      size="60%"
      withCloseButton={true}
      padding="md"
      zIndex={100}
    >
      {renderContent(true)}
    </Drawer>
  )
})

export default Sidebar
