import { Handle, Position } from '@xyflow/react'
import { observer } from 'mobx-react-lite'
import { Avatar, Text, Tooltip } from '@mantine/core'
import clsx from 'clsx'
import familyTreeStore from '@/FamilyTreeStore'
import { formatDates, formatName } from '@/utils/common'

import type { FamilyMemberFlowNode } from '@/types'
import type { NodeProps } from '@xyflow/react'

import { NODE_HEIGHT, NODE_WIDTH } from '@/config'

import styles from './FamilyMember.module.css'
import { MdDownload } from 'react-icons/md'

const FamilyMember = observer(({ id }: NodeProps<FamilyMemberFlowNode>) => {
  const person = familyTreeStore.data.get(id)
  if (!person) {
    return null
  }

  const isSelected = familyTreeStore.selectedPersonId === id
  const selectedFamilyNode = familyTreeStore.selectedFamilyNode
  const isInSelectedFamily =
    selectedFamilyNode?.type === 'family' &&
    (selectedFamilyNode.data.spouseIds?.includes(id) ||
      selectedFamilyNode.data.childrenIds?.includes(id))

  let genderClass = styles['unknown']
  if (person.data.gender === 'M') {
    genderClass = styles['male']
  } else if (person.data.gender === 'F') {
    genderClass = styles['female']
  }

  const displayId = person.id
  const fullName = formatName(person)
  const formattedDates = formatDates(person) ?? ''

  const handleClick = () => {
    familyTreeStore.setSelectedPersonId(isSelected ? undefined : id)
  }

  const canLoadFamily =
    person.wikiId && (person.wikiLoaded === false || person.wikiLoaded === undefined)

  return (
    <div
      className={clsx(styles.wrapper, genderClass, {
        [styles['wrapper-selected']]: isSelected || isInSelectedFamily,
      })}
      onClick={handleClick}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={styles['handle']}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={styles['handle']}
      />
      {canLoadFamily && (
        <Tooltip label="You can load family from WikiData for this person">
          <span className={styles['download-icon']}>
            <MdDownload size={16} />
          </span>
        </Tooltip>
      )}
      {person.data.avatar ? (
        <Avatar
          src={person.data.avatar}
          alt={fullName}
          size={NODE_HEIGHT - 15}
          className={styles['avatar']}
        />
      ) : (
        <Avatar
          size={NODE_HEIGHT - 15}
          className={clsx(styles['avatar'], styles['avatar-placeholder'])}
          radius={0}
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

      <div>
        <Text
          className={styles['full-name']}
          truncate
        >
          {fullName}
        </Text>
        {formattedDates && (
          <Text
            className={styles['dates']}
            truncate
          >
            {formattedDates}
          </Text>
        )}

        <Text
          className={styles['id']}
          truncate
        >
          {displayId}
        </Text>
      </div>
    </div>
  )
})

export default FamilyMember
