import { notifications } from '@mantine/notifications'

import { openOverlayModal } from '@/utils/overlayModal'
import familyTreeStore from '@/FamilyTreeStore'
import parseGedcom from '@/utils/parseGedcom'
import gedcomNodesToPersons from '@/utils/gedcomToPersons'
import exportGedcom from '@/utils/exportGedcom'
import personsToGedcomNodes from '@/utils/personsToGedcom'
import mergeGedcomNodes from '@/utils/mergeGedcomNodes'
import { confirmDestructive } from './common'
import FileNameModal from '@/components/file-name-modal'

import type { GedcomNode } from '@/types'
import { modals } from '@mantine/modals'

export function importGedcomWithConfirm() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.ged'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const doImport = () => {
      familyTreeStore.setIsLoading(true)
      familyTreeStore.clearData()
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const gedcomText = ev.target?.result as string
          const gedcomNodes = parseGedcom(gedcomText)
          familyTreeStore.setOriginalGedcomNodes(gedcomNodes)
          familyTreeStore.setFamilyTreeName(file.name.replace(/\.[^.]+$/, ''))
          const persons = gedcomNodesToPersons(gedcomNodes)
          familyTreeStore.setData(persons)
        } catch (error) {
          console.error('Error importing GEDCOM file:', error)
          notifications.show({
            title: 'Family Tree Error',
            message: 'Failed to import Family Tree.',
            color: 'red',
          })
        }
      }
      reader.readAsText(file)
    }

    if (familyTreeStore.hasUnsavedChanges) {
      confirmDestructive(doImport, 'Importing a GEDCOM file will replace your current tree.')
    } else {
      doImport()
    }
  }
  input.click()
}

export function exportGedcomWithModal() {
  openOverlayModal({
    title: 'Export Family Tree',
    children: (
      <FileNameModal
        onClose={() => {
          modals.closeAll()
        }}
        onSubmit={(fileName: string) => {
          try {
            familyTreeStore.setIsLoading(true)
            familyTreeStore.setFamilyTreeName(fileName)
            const persons = familyTreeStore.dataArray
            let gedcomNodes: GedcomNode[] = []
            let includeGedcomEnvelope = true

            if (familyTreeStore.originalGedcomNodes) {
              gedcomNodes = mergeGedcomNodes(familyTreeStore.originalGedcomNodes, persons)
              includeGedcomEnvelope = false
            } else {
              gedcomNodes = personsToGedcomNodes(persons)
            }
            const gedcomContent = exportGedcom(gedcomNodes, includeGedcomEnvelope)
            const blob = new Blob([gedcomContent], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${fileName}.ged`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            familyTreeStore.setHasUnsavedChanges(false)
          } catch (error) {
            console.error('Error exporting GEDCOM file:', error)
            notifications.show({
              title: 'Family Tree Error',
              message: 'Failed to export Family Tree.',
              color: 'red',
            })
          } finally {
            familyTreeStore.setIsLoading(false)
          }
        }}
      />
    ),
  })
}
