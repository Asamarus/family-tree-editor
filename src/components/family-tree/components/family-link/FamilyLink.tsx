import { BaseEdge, getSmoothStepPath, Position } from '@xyflow/react'
import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'
import clsx from 'clsx'

import type { EdgeProps } from '@xyflow/react'
import type { FamilyFlowEdge } from '@/types'

import styles from './FamilyLink.module.css'

// Adjusts sourceY and targetY based on the link type
const adjustment = 4
function adjustLinkY(sourceY: number, targetY: number, type: 'spouse' | 'child') {
  if (type === 'child') {
    return { sourceY: sourceY + adjustment, targetY: targetY - adjustment }
  } else if (type === 'spouse') {
    return { sourceY: sourceY - adjustment, targetY: targetY + adjustment }
  }
  return { sourceY, targetY }
}

const FamilyLink = observer(
  ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<FamilyFlowEdge>) => {
    if (!data) return null

    const selectePersondId = familyTreeStore.selectedPersonId
    const selectedFamilyMemberNode = familyTreeStore.selectedFamilyMemberNode
    const selectedPerson = familyTreeStore.selectedPerson
    const selectedFamilyId = familyTreeStore.selectedFamilyId

    const isSelectedPersonChild =
      selectedPerson && data.type === 'child' && data.childId === selectedPerson.id

    const isSelectedPersonParent =
      selectedPerson &&
      data.type === 'spouse' &&
      data.familyId === selectedFamilyMemberNode?.data.parentFamilyId

    const isSelectedFamilyLink = selectedFamilyId && data.familyId === selectedFamilyId
    const highlighted = isSelectedPersonChild || isSelectedPersonParent || isSelectedFamilyLink
    const familyColor = data?.color ?? '#666'

    const adjustedY = adjustLinkY(sourceY, targetY, data.type)
    const [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY: adjustedY.sourceY,
      sourcePosition: data.type === 'child' ? Position.Top : Position.Bottom,
      targetX,
      targetY: adjustedY.targetY,
      borderRadius: 10,
      targetPosition: data.type === 'child' ? Position.Bottom : Position.Top,
    })

    const hasSelection = !!selectePersondId || !!selectedFamilyId

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        className={clsx(
          styles['edge'],
          highlighted && styles['highlighted'],
          hasSelection && !highlighted && styles['faded'],
        )}
        style={{
          stroke: highlighted ? '#ff6b35' : familyColor,
        }}
      />
    )
  },
)

export default FamilyLink
