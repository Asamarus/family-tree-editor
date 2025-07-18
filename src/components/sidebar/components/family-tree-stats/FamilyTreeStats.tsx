import { observer } from 'mobx-react-lite'
import { Title, Text, Group, Stack, Button, Card } from '@mantine/core'
import { FaPlus, FaMale, FaFemale, FaUserSecret, FaRing, FaChild } from 'react-icons/fa'
import { HiOutlineUsers } from 'react-icons/hi'
import familyTreeStore from '@/FamilyTreeStore'
import { addNewPerson } from '@/utils/common'

import styles from './FamilyTreeStats.module.css'
import { MdOutlineFamilyRestroom } from 'react-icons/md'

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  color?: string
}) => (
  <Card className={styles['stat-card']}>
    <Group justify="space-between">
      <Group gap="xs">
        {icon}
        <Text fw={500}>{label}</Text>
      </Group>
      <Text
        fw={700}
        size="lg"
        {...(color ? { c: color } : {})}
      >
        {value}
      </Text>
    </Group>
  </Card>
)

const FamilyTreeStats = observer(({ showImportLabel }: { showImportLabel?: boolean } = {}) => {
  return (
    <Stack gap="md">
      <Group
        justify="space-between"
        align="center"
      >
        <Title order={3}>Family Tree Statistics</Title>
        <Button
          leftSection={<FaPlus size={16} />}
          size="sm"
          onClick={addNewPerson}
          disabled={familyTreeStore.isLoading}
        >
          Add Person
        </Button>
      </Group>
      {showImportLabel && familyTreeStore.familyTreeName && (
        <Text
          size="sm"
          c="dimmed"
          style={{ marginBottom: 8 }}
        >
          <strong>Imported file:</strong> {familyTreeStore.familyTreeName}
        </Text>
      )}
      <Stack gap="xs">
        <StatCard
          icon={<HiOutlineUsers size={20} />}
          label="Total Persons"
          value={familyTreeStore.totalPersons}
        />
        <StatCard
          icon={<MdOutlineFamilyRestroom size={20} />}
          label="Families"
          value={familyTreeStore.totalFamilies}
        />
        <StatCard
          icon={<FaMale size={20} />}
          label="Males"
          value={familyTreeStore.totalMales}
          color="blue"
        />
        <StatCard
          icon={<FaFemale size={20} />}
          label="Females"
          value={familyTreeStore.totalFemales}
          color="pink"
        />
        {familyTreeStore.totalUnknownPersons > 0 && (
          <StatCard
            icon={<FaUserSecret size={20} />}
            label="Unknown Gender"
            value={familyTreeStore.totalUnknownPersons}
            color="gray"
          />
        )}
        <StatCard
          icon={<FaRing size={20} />}
          label="Spouse Relationships"
          value={Math.floor(familyTreeStore.totalSpouses)}
        />
        <StatCard
          icon={<FaChild size={20} />}
          label="Children"
          value={familyTreeStore.totalChildren}
        />
      </Stack>
    </Stack>
  )
})

export default FamilyTreeStats
