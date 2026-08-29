import { useEffect, useState } from 'react'

function screenLock() {
  const orientation = window.screen?.orientation as unknown as {
    lock: (orientation: string) => Promise<void>
    unlock: () => void
  } | undefined
  if (orientation && typeof orientation.lock === 'function') return orientation
  return null
}

function isPhoneLike() {
  return window.matchMedia('(pointer: coarse)').matches
    || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

async function lockLandscape() {
  try {
    await screenLock()?.lock('landscape')
  } catch {
    /* 브라우저 탭에서는 잠금이 막힐 수 있어, 그때는 회전 안내를 띄웁니다. */
  }
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation')
    await ScreenOrientation.lock({ orientation: 'landscape' })
  } catch {
    /* 웹 미리보기에서는 네이티브 플러그인이 없습니다. */
  }
}

async function unlockOrientation() {
  try {
    await screenLock()?.unlock()
  } catch {
    /* ignore */
  }
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation')
    await ScreenOrientation.unlock()
  } catch {
    /* ignore */
  }
}

export function useGameOrientation(active: boolean) {
  const [needsRotate, setNeedsRotate] = useState(false)

  useEffect(() => {
    const sync = () => {
      const portrait = window.matchMedia('(orientation: portrait)').matches
      setNeedsRotate(active && isPhoneLike() && portrait)
    }

    sync()
    if (active) void lockLandscape().then(sync)
    else void unlockOrientation().then(sync)

    window.addEventListener('orientationchange', sync)
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('orientationchange', sync)
      window.removeEventListener('resize', sync)
      if (active) void unlockOrientation()
    }
  }, [active])

  return { needsRotate }
}
