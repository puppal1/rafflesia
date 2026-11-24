// created: 2026-11-24T13:55:00-08:00 — wrap + collapse long chat pastes so they stay in the bubble
import { useState } from 'react'

const COLLAPSE_AT = 700

type Props = {
  // created: 2026-11-24T13:55:00-08:00
  text: string
}

/** created: 2026-11-24T13:55:00-08:00 */
export function ChatMessageText({ text }: Props) {
  const [open, setOpen] = useState(false)
  const long = text.length > COLLAPSE_AT
  const shown = !long || open ? text : `${text.slice(0, COLLAPSE_AT)}…`

  return (
    <div className="chat-msg-text">
      {shown}
      {long ? (
        <button
          type="button"
          className="chat-msg-more"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}
