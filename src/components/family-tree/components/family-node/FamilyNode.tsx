import { Handle, Position } from '@xyflow/react'
import { observer } from 'mobx-react-lite'
import familyTreeStore from '@/FamilyTreeStore'

import type { FamilyFlowNode } from '@/types'
import type { NodeProps } from '@xyflow/react'

import { FAMILY_NODE_RADIUS } from '@/config'

import styles from './FamilyNode.module.css'

const FamilyNode = observer(({ id, data }: NodeProps<FamilyFlowNode>) => {
  const { color } = data

  const isSelected = familyTreeStore.selectedFamilyId === id

  const handleClick = () => {
    familyTreeStore.setSelectedFamilyId(isSelected ? undefined : id)
  }

  const size = FAMILY_NODE_RADIUS * 2

  let backgroundColor = color ?? '#666'

  if (isSelected) {
    backgroundColor = '#ff6b35'
  }

  return (
    <div
      className={styles['wrapper']}
      onClick={handleClick}
      style={{ width: size, height: size, backgroundColor }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={styles['handle']}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={styles['handle']}
      />
    </div>
  )
})

export default FamilyNode
