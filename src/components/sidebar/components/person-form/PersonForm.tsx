import { memo } from 'react'
import { TextInput, Group, Select, Stack, Button, Text, Image, Box, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'

import type { Person } from '@/types'

import styles from './PersonForm.module.css'

interface PersonFormProps {
  personId?: string
  onSubmit?: (personData: Person) => void
  onCancel?: () => void
  initialValues?: {
    firstName?: string
    lastName?: string
    suffix?: string
    birthDay?: string
    deathDay?: string
    gender?: 'M' | 'F' | 'U'
    avatar?: string
    note?: string
  }
}

const PersonForm = observer(({ personId, onSubmit, onCancel, initialValues }: PersonFormProps) => {
  const isEditing = !!personId
  const existingPerson = isEditing ? familyTreeStore.data.get(personId) : undefined

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      firstName: initialValues?.firstName || existingPerson?.data.firstName || '',
      lastName: initialValues?.lastName || existingPerson?.data.lastName || '',
      suffix: initialValues?.suffix || existingPerson?.data.suffix || '',
      birthDay: initialValues?.birthDay || existingPerson?.data.birthDay || '',
      deathDay: initialValues?.deathDay || existingPerson?.data.deathDay || '',
      gender: initialValues?.gender || existingPerson?.data.gender || 'U',
      avatar: initialValues?.avatar || existingPerson?.data.avatar || '',
      note: initialValues?.note || existingPerson?.data.note || '',
    },
    validate: {
      firstName: (value) => (value.trim().length === 0 ? 'First name is required' : null),
      avatar: (value) => {
        if (!value.trim()) return null
        try {
          new URL(value.trim())
          return null
        } catch {
          return 'Avatar must be a valid URL'
        }
      },
    },
  })

  const handleSubmit = (values: typeof form.values) => {
    const personData: Person = {
      id: personId || familyTreeStore.getNewPersonId(),
      rels: {
        spouses: existingPerson?.rels.spouses || [],
        father: existingPerson?.rels.father,
        mother: existingPerson?.rels.mother,
        children: existingPerson?.rels.children || [],
      },
      data: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim() || undefined,
        suffix: values.suffix.trim() || undefined,
        birthDay: values.birthDay.trim() || undefined,
        deathDay: values.deathDay.trim() || undefined,
        gender: values.gender,
        avatar: values.avatar.trim() || undefined,
        note: values.note.trim() || undefined,
      },
    }

    onSubmit?.(personData)
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Group grow>
          <TextInput
            label="First Name"
            placeholder="Enter first name"
            withAsterisk
            key={form.key('firstName')}
            {...form.getInputProps('firstName')}
          />
          <TextInput
            label="Last Name"
            placeholder="Enter last name"
            key={form.key('lastName')}
            {...form.getInputProps('lastName')}
          />
        </Group>
        <Group grow>
          <Select
            label="Gender"
            data={[
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'U', label: 'Unknown' },
            ]}
            key={form.key('gender')}
            {...form.getInputProps('gender')}
          />
          <TextInput
            label="Suffix"
            placeholder="Enter suffix (e.g. Jr, III)"
            key={form.key('suffix')}
            {...form.getInputProps('suffix')}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Birth Date"
            key={form.key('birthDay')}
            {...form.getInputProps('birthDay')}
          />
          <TextInput
            label="Death Date"
            key={form.key('deathDay')}
            {...form.getInputProps('deathDay')}
          />
        </Group>
        <TextInput
          label="Avatar URL"
          placeholder="Enter image URL"
          key={form.key('avatar')}
          {...form.getInputProps('avatar')}
        />

        <Textarea
          label="Note"
          placeholder="Enter notes about this person"
          key={form.key('note')}
          {...form.getInputProps('note')}
          autosize
          minRows={2}
        />

        {form.values.avatar && (
          <Box className={styles['avatar-preview']}>
            <Text
              size="sm"
              mb="xs"
            >
              Avatar Preview:
            </Text>
            <Image
              src={form.values.avatar}
              alt="Avatar preview"
              w={80}
              h={80}
              radius="md"
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik00MCA0MEM0Ni42Mjc0IDQwIDUyIDM0LjYyNzQgNTIgMjhDNTIgMjEuMzcyNiA0Ni42Mjc0IDE2IDQwIDE2QzMzLjM3MjYgMTYgMjggMjEuMzcyNiAyOCAyOEMyOCAzNC42Mjc0IDMzLjM3MjYgNDAgNDAgNDBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA2NEMyMCA1NS4xNjMgMjcuMTYzIDQ4IDM2IDQ4SDQ0QzUyLjgzNyA0OCA2MCA1NS4xNjMgNjAgNjRWNjhIMjBWNjRaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo="
            />
          </Box>
        )}

        <Group
          justify="flex-end"
          mt="md"
        >
          {onCancel && (
            <Button
              variant="light"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit">{isEditing ? 'Update' : 'Add'} Person</Button>
        </Group>
      </Stack>
    </form>
  )
})

export default memo(PersonForm) as typeof PersonForm
