// created: 2026-11-24T13:55:00-08:00 — wrap long chat pastes so they stay in the bubble
// updated: 2026-11-24T14:00:00-08:00 — no hard truncate; scroll inside bubble instead
type Props = {
  // created: 2026-11-24T13:55:00-08:00
  text: string
}

/** created: 2026-11-24T13:55:00-08:00 */
/** updated: 2026-11-24T14:00:00-08:00 — always keep full message text */
export function ChatMessageText({ text }: Props) {
  return <div className="chat-msg-text">{text}</div>
}
