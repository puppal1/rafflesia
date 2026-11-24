// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T23:55:00-08:00 — emoji tiles only
// updated: 2026-11-24T12:40:00-08:00 — manga image tiles + compact continue (PRD v2 C3)
// updated: 2026-11-24T12:55:00-08:00 — sticky Continue + denser tiles
// updated: 2026-11-24T13:45:00-08:00 — large selected preview frame
import { useState } from 'react'
import { ICON_PACKS, type IconDef } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-23T21:00:00-08:00
  title?: string
  onPick: (icon: IconDef) => void
  busy?: boolean
}

/** created: 2026-11-23T21:00:00-08:00 */
/** updated: 2026-11-24T13:45:00-08:00 */
export function IconPicker({ title = 'Pick your icon', onPick, busy }: Props) {
  const [selected, setSelected] = useState<IconDef | null>(null)

  return (
    <div className="icon-picker">
      <h2 className="panel-title">{title}</h2>
      <p className="muted">Tap one · big preview · Continue stays at the bottom</p>

      <div className="icon-preview-frame" aria-live="polite">
        {selected ? (
          <>
            {selected.imageUrl ? (
              <img className="icon-preview-img" src={selected.imageUrl} alt="" />
            ) : (
              <span className="icon-preview-emoji" aria-hidden>
                {selected.emoji}
              </span>
            )}
            <p className="icon-preview-name">{selected.label}</p>
            <p className="icon-preview-pack muted">{selected.pack.replace(/-/g, ' ')}</p>
          </>
        ) : (
          <p className="muted icon-preview-empty">Your pick shows up large here</p>
        )}
      </div>

      <div className="icon-picker-scroll">
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
                  {icon.imageUrl ? (
                    <img className="icon-manga-thumb" src={icon.imageUrl} alt="" />
                  ) : (
                    <span className="icon-emoji">{icon.emoji}</span>
                  )}
                  <span className="icon-label">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="icon-picker-footer">
        {selected ? (
          <p className="icon-picker-choice muted">Selected: {selected.label}</p>
        ) : (
          <p className="icon-picker-choice muted">Pick an icon to continue</p>
        )}
        <button
          className="primary btn-compact"
          type="button"
          disabled={!selected || busy}
          onClick={() => selected && onPick(selected)}
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
