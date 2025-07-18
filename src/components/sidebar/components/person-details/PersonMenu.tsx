import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'
import { ActionIcon, Menu } from '@mantine/core'
import {
  MdDelete,
  MdEdit,
  MdOutlineFamilyRestroom,
  MdMoreVert,
  MdRemoveRedEye,
} from 'react-icons/md'

interface PersonMenuProps {
  onView?: () => void
  onEdit?: () => void
  onRemove?: () => void
  onViewFamily?: (() => void) | null
  removeLabel?: string
}

const PersonMenu = observer(
  ({
    onView,
    onEdit,
    onRemove,
    onViewFamily,
    removeLabel = 'Remove',
  }: PersonMenuProps) => (
    <Menu
      shadow="md"
      width={200}
    >
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          loading={familyTreeStore.isLoading}
        >
          <MdMoreVert size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {onViewFamily && (
          <Menu.Item
            leftSection={<MdOutlineFamilyRestroom size={18} />}
            onClick={onViewFamily}
          >
            View Family
          </Menu.Item>
        )}
        {onView && (
          <Menu.Item
            leftSection={<MdRemoveRedEye size={18} />}
            onClick={onView}
          >
            View
          </Menu.Item>
        )}
        {onEdit && (
          <Menu.Item
            leftSection={<MdEdit size={18} />}
            onClick={onEdit}
            disabled={familyTreeStore.isLoading}
          >
            Edit
          </Menu.Item>
        )}
        {(onView || onEdit || onViewFamily) && <Menu.Divider />}
        {onRemove && (
          <Menu.Item
            color="red"
            leftSection={<MdDelete size={18} />}
            onClick={onRemove}
            disabled={familyTreeStore.isLoading}
          >
            {removeLabel}
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  ),
)

export default PersonMenu
