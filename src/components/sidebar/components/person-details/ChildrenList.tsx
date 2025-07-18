import PersonListItem from './PersonListItem'
import familyTreeStore from '@/FamilyTreeStore'
import { handleEditPerson } from './personDetailsHandlers'
import type { Person } from '@/types'

interface ChildrenListProps {
  person: Person
  childList: Person[]
  onRemove: (childId: string) => void
}

const ChildrenList = ({ person, childList, onRemove }: Readonly<ChildrenListProps>) => {
  return (
    <>
      {childList.map((child) => (
        <PersonListItem
          key={child.id}
          person={child}
          onView={() => {
            familyTreeStore.setSelectedPersonId(child.id)
            familyTreeStore.zoomToNode(child.id)
          }}
          onEdit={() => handleEditPerson(child.id)}
          onRemove={() => onRemove(child.id)}
          onViewFamily={() => {
            const familyNode = familyTreeStore.nodes.find(
              (node) =>
                node.type === 'family' &&
                node.data.childrenIds?.includes(child.id) &&
                node.data.spouseIds?.includes(person.id),
            )
            if (familyNode) {
              familyTreeStore.setSelectedFamilyId(familyNode.id)
            }
          }}
          removeLabel="Remove Child"
        />
      ))}
    </>
  )
}

export default ChildrenList
