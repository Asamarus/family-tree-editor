import { observer } from 'mobx-react-lite'
import { TextInput, Group, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import familyTreeStore from '@/FamilyTreeStore'

interface FileNameModalProps {
  onClose: () => void
  onSubmit: (fileName: string) => void
}

const FileNameModal = observer(({ onClose, onSubmit }: FileNameModalProps) => {
  const initialName = familyTreeStore.familyTreeName || ''
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { fileName: initialName },
    validate: {
      fileName: (value) => (value.trim().length === 0 ? 'File name is required' : null),
    },
  })

  const handleSubmit = (values: typeof form.values) => {
    onSubmit(values.fileName)
    onClose()
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="File Name"
          placeholder="Enter file name"
          withAsterisk
          key={form.key('fileName')}
          {...form.getInputProps('fileName')}
        />
        <Group justify="flex-end">
          <Button
            variant="light"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button type="submit">Export</Button>
        </Group>
      </Stack>
    </form>
  )
})

export default FileNameModal
