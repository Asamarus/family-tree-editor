interface Overlay {
  id: string
  onClose: () => void
}

const overlayStack: Overlay[] = []

const OverlayManager = {
  push(overlay: Overlay) {
    overlayStack.push(overlay)
    history.pushState({ overlayId: overlay.id }, '')
  },

  pop() {
    const overlay = overlayStack.pop()
    if (overlay) overlay.onClose()
  },

  peek(): Overlay | undefined {
    return overlayStack[overlayStack.length - 1]
  },

  removeById(id: string) {
    const index = overlayStack.findIndex((o) => o.id === id)
    if (index !== -1) overlayStack.splice(index, 1)
  },

  isEmpty() {
    return overlayStack.length === 0
  },
}

export default OverlayManager
