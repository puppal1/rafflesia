// created: 2026-11-25T01:25:00-08:00 — PRD v4 J7 sticker tray
import { useMemo, useState } from 'react'
import { stickerIcons } from '../lib/stickers'
import type { IconDef } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  onPick: (icon: IconDef) => void
  disabled?: boolean
}

/** created: 2026-11-25T01:25:00-08:00 */
export function StickerPicker({ onPick, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const icons = useMemo(() => stickerIcons(), [])

  return (
    <div className="sticker-picker">
      <button
        className="ghost btn-compact"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide stickers' : 'Stickers'}
      </button>
      {open ? (
        <div className="sticker-tray" role="listbox" aria-label="Stickers">
          {icons.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className="sticker-cell"
              disabled={disabled}
              title={icon.label}
              onClick={() => {
                onPick(icon)
                setOpen(false)
              }}
            >
              {icon.imageUrl ? (
                <img src={icon.imageUrl} alt={icon.label} />
              ) : (
                <span>{icon.emoji}</span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
