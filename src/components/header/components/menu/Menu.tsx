import { useState } from 'react'
import { Menu as MantineMenu, ActionIcon } from '@mantine/core'
import { observer } from 'mobx-react-lite'
import {
  MdFileUpload,
  MdFileDownload,
  MdDelete,
  MdSearch,
  MdBarChart,
  MdPersonAdd,
} from 'react-icons/md'
import { useMediaQuery } from '@mantine/hooks'
import { BREAKPOINT_SM } from '@/config'
import familyTreeStore from '@/FamilyTreeStore'
import { importGedcomWithConfirm, exportGedcomWithModal } from '@/utils/fileImportExport'
import {
  addNewPerson,
  confirmDestructive,
  loadDemoData,
  openSearchWikiDataModal,
} from '@/utils/common'
import { FaBars } from 'react-icons/fa'
import { GiFamilyTree } from 'react-icons/gi'

const Menu = observer(() => {
  const [opened, setOpened] = useState(false)
  const isSm = useMediaQuery(BREAKPOINT_SM)

  const familyTreeIsEmpty = familyTreeStore.dataIds.length === 0

  return (
    <MantineMenu
      opened={opened}
      onChange={setOpened}
    >
      <MantineMenu.Target>
        <ActionIcon
          variant="subtle"
          size="lg"
          loading={familyTreeStore.isLoading}
        >
          <FaBars size={16} />
        </ActionIcon>
      </MantineMenu.Target>
      <MantineMenu.Dropdown>
        <MantineMenu.Item
          leftSection={<MdPersonAdd size={18} />}
          disabled={familyTreeStore.isLoading}
          onClick={addNewPerson}
        >
          Add Person
        </MantineMenu.Item>
        <MantineMenu.Item
          leftSection={<MdFileUpload size={18} />}
          disabled={familyTreeStore.isLoading}
          onClick={importGedcomWithConfirm}
        >
          Import GEDCOM
        </MantineMenu.Item>
        <MantineMenu.Item
          leftSection={<MdFileDownload size={18} />}
          disabled={familyTreeStore.isLoading || familyTreeIsEmpty}
          onClick={exportGedcomWithModal}
        >
          Export GEDCOM
        </MantineMenu.Item>
        <MantineMenu.Item
          leftSection={<MdSearch size={18} />}
          disabled={familyTreeStore.isLoading}
          onClick={openSearchWikiDataModal}
        >
          Search WikiData
        </MantineMenu.Item>
        <MantineMenu.Item
          leftSection={<GiFamilyTree size={18} />}
          disabled={familyTreeStore.isLoading}
          onClick={loadDemoData}
        >
          Load Demo Family Tree
        </MantineMenu.Item>
        {isSm && (
          <MantineMenu.Item
            leftSection={<MdBarChart size={18} />}
            disabled={familyTreeStore.isLoading}
            onClick={() => {
              familyTreeStore.setSelectedPersonId()
              familyTreeStore.setSelectedFamilyId()
              familyTreeStore.openDrawer()
            }}
          >
            Show Family Tree Stats
          </MantineMenu.Item>
        )}

        {!familyTreeIsEmpty && (
          <>
            <MantineMenu.Divider />
            <MantineMenu.Item
              color="red"
              disabled={familyTreeStore.isLoading}
              leftSection={<MdDelete size={18} />}
              onClick={() => {
                confirmDestructive(
                  () => familyTreeStore.clearData(),
                  'Clearing the family tree will remove all data.',
                )
              }}
            >
              Clear Family Tree
            </MantineMenu.Item>
          </>
        )}
      </MantineMenu.Dropdown>
    </MantineMenu>
  )
})

export default Menu
