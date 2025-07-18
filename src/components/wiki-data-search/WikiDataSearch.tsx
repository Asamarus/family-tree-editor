import { useState, useCallback } from 'react'
import {
  Text,
  TextInput,
  Loader,
  Group,
  Stack,
  ScrollArea,
  Paper,
  Button,
  Box,
  Avatar,
  UnstyledButton,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { FaSearch } from 'react-icons/fa'
import familyTreeStore from '@/FamilyTreeStore'
import { searchWikiData, loadImmediateFamily } from '@/utils/wikiDataUtils'

import type { WikiDataPerson } from '@/utils/wikiDataUtils'
import { observer } from 'mobx-react-lite'
import { confirmDestructive } from '@/utils/common'

const WikiDataSearch = observer(() => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WikiDataPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showSearch, setShowSearch] = useState(true)
  const [lastQuery, setLastQuery] = useState('')

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setError(null)
      setHasSearched(true)
      return
    }
    setLoading(true)
    setError(null)
    setHasSearched(true)
    setLastQuery(searchQuery)
    try {
      const persons = await searchWikiData(searchQuery)
      setResults(persons)
    } catch (error) {
      console.error('Error searching WikiData:', error)
      setResults([])
      setError('Failed to search WikiData. Please try again.')
    } finally {
      setLoading(false)
      setShowSearch(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value)
  }

  const handleSearchButton = () => {
    handleSearch(query)
  }

  const handleSearchAnother = () => {
    setShowSearch(true)
    setResults([])
    setError(null)
    setQuery(lastQuery)
    setHasSearched(false)
  }

  const loadFamilyTree = async (person: WikiDataPerson) => {
    const doLoad = async () => {
      setLoadingFamily(true)
      setError(null)
      try {
        familyTreeStore.setIsLoading(true)
        familyTreeStore.clearData()
        await loadImmediateFamily(person)
        familyTreeStore.setFamilyTreeName(person.label) // Set familyTreeName to WikiData label

        modals.closeAll()
      } catch (error) {
        console.error('Error loading family tree:', error)
        setError('Failed to load family tree. Please try again.')
      } finally {
        setLoadingFamily(false)
      }
    }
    confirmDestructive(doLoad, 'Loading a WikiData person will replace your current tree.')
  }

  if (loadingFamily || familyTreeStore.isLoading) {
    return (
      <Box ta="center">
        <Loader size="lg" />
        <Text
          size="sm"
          mt="xs"
        >
          Loading family tree...
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap="md">
      <Text
        c="dimmed"
        size="sm"
      >
        Search for a person in WikiData by name. This will look up real historical or notable people
        and allow you to import their family tree. Only public figures and well-documented persons
        are available. Select a person from the results to load their family tree.
      </Text>
      {showSearch && (
        <>
          <TextInput
            placeholder="Search for a person..."
            value={query}
            onChange={handleInputChange}
            leftSection={<FaSearch size={14} />}
            disabled={loadingFamily}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchButton()
            }}
          />
          <Button
            leftSection={<FaSearch size={14} />}
            onClick={handleSearchButton}
            loading={loading}
            disabled={loadingFamily || !query.trim()}
          >
            Search person
          </Button>
        </>
      )}
      {error && (
        <Paper
          p="sm"
          withBorder
        >
          <Text
            size="sm"
            c="red"
          >
            {error}
          </Text>
        </Paper>
      )}
      {!showSearch &&
        (results.length > 0 ? (
          <ScrollArea h={Math.min(300, results.length * 100)}>
            <Stack gap="xs">
              {results.map((person: WikiDataPerson) => (
                <UnstyledButton
                  key={person.id}
                  onClick={() => loadFamilyTree(person)}
                  disabled={loadingFamily}
                >
                  <Paper
                    p="md"
                    withBorder
                  >
                    <Group gap="md">
                      {person.image ? (
                        <Avatar
                          src={person.image}
                          alt={person.label}
                          size={60}
                          radius="md"
                        />
                      ) : (
                        <Avatar
                          size={60}
                          radius={8}
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
                      <Box flex={1}>
                        <Text fw={500}>{person.label}</Text>
                        {person.description && (
                          <Text
                            size="sm"
                            c="dimmed"
                            lineClamp={2}
                          >
                            {person.description}
                          </Text>
                        )}
                        {(person.birthDate || person.deathDate) && (
                          <Text
                            size="xs"
                            c="dimmed"
                          >
                            {person.birthDate && `Born: ${person.birthDate}`}
                            {person.birthDate && person.deathDate && ' • '}
                            {person.deathDate && `Died: ${person.deathDate}`}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Paper>
                </UnstyledButton>
              ))}
            </Stack>
          </ScrollArea>
        ) : (
          hasSearched &&
          !loading &&
          !error && (
            <Text
              ta="center"
              c="dimmed"
              py="xl"
            >
              Nothing found for "{lastQuery}"
            </Text>
          )
        ))}
      {!showSearch && (
        <Button
          mt="md"
          variant="light"
          onClick={handleSearchAnother}
        >
          Search another person
        </Button>
      )}
    </Stack>
  )
})

export default WikiDataSearch
