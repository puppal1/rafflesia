// created: 2026-11-24T14:15:00-08:00 — compact searchable people picker for huge lists
import { useMemo, useState } from 'react'
import { FaceAvatar } from './FaceAvatar'
import { NameWithBadge } from './VerifiedBadge'
import type { Profile } from '../types'

type Props = {
  // created: 2026-11-24T14:15:00-08:00
  people: Profile[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  niceName: (p: Profile | null | undefined) => string
  heading?: string
  emptyText?: string
}

/** created: 2026-11-24T14:15:00-08:00 */
export function PeoplePickGrid({
  people,
  selectedIds,
  onToggle,
  niceName,
  heading = 'Who should be in it?',
  emptyText = 'No other people yet.',
}: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const hay = `${p.username} ${p.display_name || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [people, query])

  const selectedPeople = useMemo(
    () => people.filter((p) => selectedIds.has(p.id)),
    [people, selectedIds],
  )

  function selectAllVisible() {
    for (const p of filtered) {
      if (!selectedIds.has(p.id)) onToggle(p.id)
    }
  }

  function clearAll() {
    for (const id of [...selectedIds]) onToggle(id)
  }

  return (
    <div className="people-pick">
      <div className="people-pick-head">
        <p className="friend-pick-heading">{heading}</p>
        <p className="muted people-pick-count">
          {selectedIds.size ? `${selectedIds.size} selected` : 'Tap faces to invite'}
        </p>
      </div>

      {selectedPeople.length > 0 ? (
        <div className="people-pick-chips" aria-label="Selected friends">
          {selectedPeople.map((p) => (
            <button
              key={`chip-${p.id}`}
              type="button"
              className="people-pick-chip"
              onClick={() => onToggle(p.id)}
              title={`Remove @${p.username}`}
            >
              <FaceAvatar avatarUrl={p.avatar_url} iconPack={p.icon_pack} iconId={p.icon_id} size="sm" />
              <span>{niceName(p)}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}

      <label className="people-pick-search">
        Search
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or @username…"
        />
      </label>

      <div className="people-pick-tools action-row">
        <button className="ghost btn-compact" type="button" onClick={selectAllVisible} disabled={!filtered.length}>
          Select all{query.trim() ? ' shown' : ''}
        </button>
        <button className="ghost btn-compact" type="button" onClick={clearAll} disabled={!selectedIds.size}>
          Clear
        </button>
      </div>

      {people.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : filtered.length === 0 ? (
        <p className="muted">No matches for “{query.trim()}”.</p>
      ) : (
        <div className="people-pick-grid soft-scroll" role="listbox" aria-multiselectable="true">
          {filtered.map((p) => {
            const on = selectedIds.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={on}
                className={on ? 'people-pick-tile on' : 'people-pick-tile'}
                onClick={() => onToggle(p.id)}
              >
                <span className={on ? 'people-pick-tick on' : 'people-pick-tick'} aria-hidden>
                  {on ? '✓' : ''}
                </span>
                <FaceAvatar avatarUrl={p.avatar_url} iconPack={p.icon_pack} iconId={p.icon_id} size="md" />
                <span className="people-pick-name">
                  <NameWithBadge name={niceName(p)} tier={p.verify_tier} />
                </span>
                <span className="people-pick-user">@{p.username}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
