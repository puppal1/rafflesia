// created: 2026-11-24T13:35:00-08:00 — tap-to-expand chat/post photos
import { useEffect } from 'react'

type Props = {
  // created: 2026-11-24T13:35:00-08:00
  src: string | null
  onClose: () => void
}

/** created: 2026-11-24T13:35:00-08:00 — full-screen photo viewer */
export function MediaLightbox({ src, onClose }: Props) {
  useEffect(() => {
    if (!src) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      className="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      onClick={onClose}
    >
      <button className="media-lightbox-close" type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
      <img
        className="media-lightbox-img"
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
      <p className="media-lightbox-hint">Tap outside or press Esc to close</p>
    </div>
  )
}
