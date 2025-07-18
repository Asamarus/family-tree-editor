import { observer } from 'mobx-react-lite'
import { Button, Card, Stack, Text } from '@mantine/core'
import { importGedcomWithConfirm } from '@/utils/fileImportExport'
import { addNewPerson, loadDemoData, openSearchWikiDataModal } from '@/utils/common'
import familyTreeStore from '@/FamilyTreeStore'

import styles from './WelcomeCard.module.css'

const WelcomeCard = observer(() => {
  return (
    <div className={styles['wrapper']}>
      <div className={styles['content']}>
        <Card>
          <Text
            size="xl"
            fw={700}
            mb="md"
            ta="center"
          >
            Welcome to Family Tree Editor
          </Text>
          <Text
            mb="lg"
            c="dimmed"
          >
            Get started by adding your first person, importing a GEDCOM file, searching for a
            notable person, or loading demo family tree.
          </Text>
          <Stack
            gap="md"
            align="center"
          >
            <Button
              fullWidth
              onClick={addNewPerson}
              disabled={familyTreeStore.isLoading}
            >
              Add New Person
            </Button>
            <Button
              fullWidth
              onClick={importGedcomWithConfirm}
              disabled={familyTreeStore.isLoading}
            >
              Import GEDCOM File
            </Button>
            <Button
              fullWidth
              onClick={openSearchWikiDataModal}
              disabled={familyTreeStore.isLoading}
            >
              Search Notable Person (WikiData)
            </Button>
            <Button
              fullWidth
              onClick={loadDemoData}
              disabled={familyTreeStore.isLoading}
            >
              Load Demo Family Tree
            </Button>
          </Stack>
        </Card>
      </div>
    </div>
  )
})

export default WelcomeCard
