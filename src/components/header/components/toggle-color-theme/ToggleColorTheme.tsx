import { Tooltip, ActionIcon, useMantineColorScheme } from '@mantine/core'
import { MdDarkMode, MdLightMode } from 'react-icons/md'

const ToggleColorTheme = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Tooltip label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={() => toggleColorScheme()}
      >
        {isDark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
      </ActionIcon>
    </Tooltip>
  )
}

export default ToggleColorTheme
