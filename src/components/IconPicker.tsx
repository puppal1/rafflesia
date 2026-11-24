// created: 2026-11-23T21:00:00-08:00
import { useState } from 'react'
import { ICON_PACKS, type IconDef } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-23T21:00:00-08:00
  title?: string
  onPick: (icon: IconDef) => void
  busy?: boolean
}

/** created: 2026-11-23T21:00:00-08:00 */
export function IconPicker({ title = 'Pick your icon', onPick, busy }: Props) {
  const [selected, setSelected] = useState<IconDef | null>(null)

  return (
    <div className="icon-picker">
      <h2 className="panel-title">{title}</h2>
      <p className="muted">Same pack = Matches friends</p>
      {ICON_PACKS.map((pack) => (
        <div key={pack.id} className="icon-pack-block">
          <h3 className="pack-title">{pack.title}</h3>
          <div className="icon-grid">
            {pack.icons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className={selected?.id === icon.id ? 'icon-tile sel' : 'icon-tile'}
                onClick={() => setSelected(icon)}
                disabled={busy}
              >
                {icon.src ? (
                  <img
                    className="icon-img"
                    src={icon.src}
                    alt={icon.label}
                    onError={(e) => {
                      // created: 2026-11-23T21:40:00-08:00 — fall back to emoji if PNG missing
                      e.currentTarget.style.display = 'none'
                      const sib = e.currentTarget.nextElementSibling as HTMLElement | null
                      if (sib) sib.style.display = 'inline'
                    }}
                  />
                ) : null}
                <span className="icon-emoji" style={icon.src ? { display: 'none' } : undefined}>
                  {icon.emoji}
                </span>
                <span className="icon-label">{icon.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        className="primary block"
        type="button"
        disabled={!selected || busy}
        onClick={() => selected && onPick(selected)}
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}
