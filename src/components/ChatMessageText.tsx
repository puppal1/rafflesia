// created: 2026-11-24T13:55:00-08:00 — wrap long chat pastes so they stay in the bubble
// updated: 2026-11-24T14:00:00-08:00 — no hard truncate; scroll inside bubble instead
// updated: 2026-11-25T00:20:00-08:00 — highlight @mentions
import { MentionText } from './MentionText'
import type { Profile } from '../types'

type Props = {
  // created: 2026-11-24T13:55:00-08:00
  // updated: 2026-11-25T00:20:00-08:00
  text: string
  profilesById?: Record<string, Profile>
  onOpenUsername?: (username: string) => void
}

/** created: 2026-11-24T13:55:00-08:00 */
/** updated: 2026-11-25T00:20:00-08:00 */
export function ChatMessageText({ text, profilesById, onOpenUsername }: Props) {
  return (
    <div className="chat-msg-text">
      <MentionText text={text} profilesById={profilesById} onOpenUsername={onOpenUsername} />
    </div>
  )
}
