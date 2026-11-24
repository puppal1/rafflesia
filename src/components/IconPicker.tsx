// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T23:55:00-08:00 — emoji tiles only
import { useState } from 'react'
import { ICON_PACKS, type IconDef } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-23T21:00:00-08:00
  title?: string
  onPick: (icon: IconDef) => void
  busy?: boolean
}

/** created: 2026-11-23T21:00:00-08:00 */
/** updated: 2026-11-23T23:55:00-08:00 */
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
                <span className="icon-emoji">{icon.emoji}</span>
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
