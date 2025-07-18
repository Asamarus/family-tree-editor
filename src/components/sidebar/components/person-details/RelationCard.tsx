import { Card, Title, Group } from '@mantine/core'
import styles from './PersonDetails.module.css'

interface RelationCardProps {
  title: React.ReactNode
  children: React.ReactNode
}

const RelationCard = ({ title, children }: Readonly<RelationCardProps>) => (
  <Card className={styles['relation-card']}>
    <Group
      justify="space-between"
      mb="sm"
    >
      <Title order={5}>{title}</Title>
    </Group>
    {children}
  </Card>
)

export default RelationCard
