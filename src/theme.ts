import { createTheme, Textarea, Tooltip, Modal } from '@mantine/core'

export const theme = createTheme({
  cursorType: 'pointer',
  primaryColor: 'indigo',
  components: {
    Textarea: Textarea.extend({
      defaultProps: {
        autosize: true,
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        openDelay: 1000,
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        closeOnClickOutside: false,
        closeOnEscape: false,
      },
    }),
  },
})
