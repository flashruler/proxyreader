"use client"

import { useEffect } from "react"

type HotkeyConfig = {
  key: string
  callback: () => void
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        if (
          event.key === hotkey.key &&
          (hotkey.ctrlKey === undefined || event.ctrlKey === hotkey.ctrlKey) &&
          (hotkey.altKey === undefined || event.altKey === hotkey.altKey) &&
          (hotkey.shiftKey === undefined || event.shiftKey === hotkey.shiftKey)
        ) {
          event.preventDefault()
          hotkey.callback()
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [hotkeys])
}
