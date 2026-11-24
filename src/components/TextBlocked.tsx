// created: 2026-11-23T21:00:00-08:00
type Props = {
  // created: 2026-11-23T21:00:00-08:00
  message: string
  onEdit: () => void
  onOk: () => void
}

/** created: 2026-11-23T21:00:00-08:00 — calm D5 */
export function TextBlocked({ message, onEdit, onOk }: Props) {
  return (
    <div className="text-blocked">
      <div className="alert">
        <strong>Let&apos;s keep it kind.</strong>
        <p>{message}</p>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="ghost grow" type="button" onClick={onEdit}>
          Edit message
        </button>
        <button className="primary grow" type="button" onClick={onOk}>
          OK
        </button>
      </div>
    </div>
  )
}
