// created: 2026-11-25T00:20:00-08:00 — @people picker under composers
import { iconEmoji } from '../lib/iconPacks'
import type { Profile } from '../types'

type Props = {
  // created: 2026-11-25T00:20:00-08:00
  hits: Profile[]
  onPick: (p: Profile) => void
}

/** created: 2026-11-25T00:20:00-08:00 */
export function MentionTypeahead({ hits, onPick }: Props) {
  if (hits.length === 0) return null
  return (
    <ul className="mention-typeahead" role="listbox" aria-label="Mention someone">
      {hits.map((h) => (
        <li key={h.id}>
          <button
            type="button"
            className="mention-typeahead-item"
            onMouseDown={(e) => {
              // mousedown so input doesn't blur before pick
              e.preventDefault()
              onPick(h)
            }}
          >
            <span>
              {iconEmoji(h.icon_pack, h.icon_id)} <strong>@{h.username}</strong>
            </span>
            <span className="muted">{h.display_name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
