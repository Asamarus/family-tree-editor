import { modals } from '@mantine/modals'
import OverlayManager from '@/utils/overlayManager'

export function openOverlayModal(options: Parameters<typeof modals.open>[0]) {
  const modalId = modals.open({
    ...options,
    onClose: () => {
      options.onClose?.()
      OverlayManager.removeById(modalId)
    },
  })
  OverlayManager.push({
    id: modalId,
    onClose: () => modals.close(modalId),
  })
  return modalId
}

export function openOverlayConfirmModal(options: Parameters<typeof modals.openConfirmModal>[0]) {
  const modalId = modals.openConfirmModal({
    ...options,
    onClose: () => {
      options.onClose?.()
      OverlayManager.removeById(modalId)
    },
  })
  OverlayManager.push({
    id: modalId,
    onClose: () => modals.close(modalId),
  })
  return modalId
}
