// created: 2026-11-23T20:34:00-08:00
// Shared school-safe emoji bar for chat, group names, bios, display names

/** created: 2026-11-23T20:30:00-08:00 */
export const CHAT_EMOJIS = [
  '😀',
  '😂',
  '🥰',
  '😎',
  '🤩',
  '🙌',
  '👍',
  '👏',
  '❤️',
  '🔥',
  '⭐',
  '🎉',
  '🌈',
  '🌸',
  '🍕',
  '🎮',
  '🏀',
  '🐱',
  '🐶',
  '✨',
]

/** created: 2026-11-23T20:34:00-08:00 */
export function insertEmojiAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  setValue: (next: string) => void,
  emoji: string,
) {
  if (!el) {
    setValue(value + emoji)
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? value.length
  const next = value.slice(0, start) + emoji + value.slice(end)
  setValue(next)
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + emoji.length
    el.setSelectionRange(pos, pos)
  })
}

type EmojiBarProps = {
  // created: 2026-11-23T20:34:00-08:00
  label?: string
  open: boolean
  onToggle: () => void
  onPick: (emoji: string) => void
}

/** created: 2026-11-23T20:34:00-08:00 */
export function EmojiBar({ label = 'Emoji', open, onToggle, onPick }: EmojiBarProps) {
  return (
    <div className="emoji-bar-wrap">
      <button className="ghost emoji-toggle" type="button" onClick={onToggle}>
        {open ? `Hide ${label.toLowerCase()}` : label}
      </button>
      {open ? (
        <div className="emoji-bar" role="listbox" aria-label={label}>
          {CHAT_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" className="emoji-btn" onClick={() => onPick(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
