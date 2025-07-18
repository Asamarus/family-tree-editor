import { theme } from './theme'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'
import { getPersons, getTreeName } from '@/utils/localstorageHelper'

import './App.css'
import '@mantine/core/styles.css'
import '@mantine/spotlight/styles.css'
import '@mantine/notifications/styles.css'

import FamilyTree from '@/components/family-tree'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import ErrorBoundary from '@/components/header/components/error-boundary'
import OverlayManager from '@/utils/overlayManager'

import WelcomeCard from '@/components/welcome-card'

function App() {
  // On mount, load data and tree name from localStorage if available
  useEffect(() => {
    const treeName = getTreeName()
    if (treeName) {
      familyTreeStore.setFamilyTreeName(treeName)
    }
    const persons = getPersons()
    if (persons.length > 0) {
      familyTreeStore.setData(persons, true)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      if (!OverlayManager.isEmpty()) {
        OverlayManager.pop()
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
    >
      <Notifications position="top-center" />
      <ErrorBoundary>
        <ModalsProvider>
          <Content />
        </ModalsProvider>
      </ErrorBoundary>
    </MantineProvider>
  )
}

const Content = observer(() => {
  const isEmpty = familyTreeStore.dataIds.length === 0
  const isCalculating = familyTreeStore.isLoading

  return (
    <div className="app-container">
      <Header />
      <div className="familytree-wrapper">
        {isEmpty && !isCalculating && <WelcomeCard />}
        {!isEmpty && <FamilyTree />}
      </div>
      <Sidebar />
    </div>
  )
})

export default App
