// Predefined color palette with distinct, accessible colors
const FAMILY_COLORS = [
  '#E57373', // Red
  '#81C784', // Green
  '#64B5F6', // Blue
  '#FFB74D', // Orange
  '#BA68C8', // Purple
  '#4DB6AC', // Teal
  '#F06292', // Pink
  '#90A4AE', // Blue Grey
  '#A1887F', // Brown
  //'#FFF176', // Yellow
  '#FF8A65', // Deep Orange
  '#9575CD', // Deep Purple
  '#4FC3F7', // Light Blue
  '#AED581', // Light Green
  '#FFCC02', // Amber
  '#26A69A', // Teal
  '#EF5350', // Red
  '#66BB6A', // Green
  '#42A5F5', // Blue
  '#FF7043', // Deep Orange
]

// Generate a unique color based on family ID
export const getFamilyColor = (familyId: string): string => {
  // Use a hash function to generate consistent color selection
  let hash = 0
  for (let i = 0; i < familyId.length; i++) {
    hash = familyId.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Get color from predefined palette
  const colorIndex = Math.abs(hash) % FAMILY_COLORS.length
  return FAMILY_COLORS[colorIndex]
}
