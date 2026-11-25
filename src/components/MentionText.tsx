// created: 2026-11-25T00:20:00-08:00 — render @username highlights in chat/comments
import { splitMentionText } from '../lib/mentions'
import type { Profile } from '../types'

type Props = {
  // created: 2026-11-25T00:20:00-08:00
  text: string
  profilesById?: Record<string, Profile>
  /** Prefer username lookup map when profiles keyed by id */
  people?: Profile[]
  className?: string
  onOpenUsername?: (username: string) => void
}

function resolveProfile(
  username: string,
  profilesById?: Record<string, Profile>,
  people?: Profile[],
): Profile | undefined {
  const u = username.toLowerCase()
  if (people) {
    const hit = people.find((p) => p.username.toLowerCase() === u)
    if (hit) return hit
  }
  if (profilesById) {
    return Object.values(profilesById).find((p) => p.username.toLowerCase() === u)
  }
  return undefined
}

/** created: 2026-11-25T00:20:00-08:00 */
export function MentionText({
  text,
  profilesById,
  people,
  className,
  onOpenUsername,
}: Props) {
  const pieces = splitMentionText(text)
  return (
    <span className={className || 'mention-text'}>
      {pieces.map((p, i) => {
        if (p.kind === 'text') {
          return <span key={`t-${i}`}>{p.value}</span>
        }
        const known = resolveProfile(p.username, profilesById, people)
        if (!known) {
          return (
            <span key={`m-${i}`} className="mention-token plain">
              {p.value}
            </span>
          )
        }
        return (
          <button
            key={`m-${i}`}
            type="button"
            className="mention-token known"
            title={`@${known.username}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenUsername?.(known.username)
            }}
          >
            @{known.username}
          </button>
        )
      })}
    </span>
  )
}
