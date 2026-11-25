// created: 2026-11-25T00:20:00-08:00 — render @username highlights in chat/comments
// updated: 2026-11-25T00:25:00-08:00 — always highlight @handles; tap tries open even if not in local map
import { splitMentionText } from '../lib/mentions'
import type { Profile } from '../types'

type Props = {
  // created: 2026-11-25T00:20:00-08:00
  text: string
  profilesById?: Record<string, Profile>
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
/** updated: 2026-11-25T00:25:00-08:00 — every @token is a visible, tappable mention */
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
        const handle = known?.username || p.username
        return (
          <button
            key={`m-${i}`}
            type="button"
            className={known ? 'mention-token known' : 'mention-token linkish'}
            title={`@${handle}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenUsername?.(handle)
            }}
          >
            @{handle}
          </button>
        )
      })}
    </span>
  )
}
