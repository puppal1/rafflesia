// created: 2026-11-24T13:50:00-08:00 — modern photo attach (no native Choose File chrome)
// updated: 2026-11-24T13:40:00-08:00 — compact toolbar chip for chat composer
import { useRef } from 'react'

type Props = {
  // created: 2026-11-24T13:50:00-08:00
  label?: string
  hint?: string
  previewUrl?: string | null
  fileName?: string
  busy?: boolean
  /** created: 2026-11-24T13:40:00-08:00 — drop zone vs icon button */
  variant?: 'drop' | 'compact'
  onPick: (file: File) => void
  onClear?: () => void
}

/** created: 2026-11-24T13:50:00-08:00 */
/** updated: 2026-11-24T13:40:00-08:00 */
export function PhotoAttach({
  label = 'Add photo',
  hint = 'Tap to attach a picture with your message',
  previewUrl,
  fileName,
  busy,
  variant = 'drop',
  onPick,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className={variant === 'compact' ? 'photo-attach photo-attach-compact' : 'photo-attach'}>
      <input
        ref={inputRef}
        className="photo-attach-input"
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
      {previewUrl ? (
        <div className="photo-attach-preview">
          <img src={previewUrl} alt="" />
          <div className="photo-attach-preview-meta">
            <p className="photo-attach-ready">Photo ready{fileName ? ` · ${fileName}` : ''}</p>
            <div className="action-row">
              <button
                type="button"
                className="ghost btn-compact"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                Swap
              </button>
              {onClear ? (
                <button type="button" className="ghost btn-compact" disabled={busy} onClick={onClear}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : variant === 'compact' ? (
        <button
          type="button"
          className="photo-attach-icon-btn"
          disabled={busy}
          title={label}
          aria-label={label}
          onClick={() => inputRef.current?.click()}
        >
          📷
        </button>
      ) : (
        <button
          type="button"
          className="photo-attach-drop"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <span className="photo-attach-icon" aria-hidden>
            📷
          </span>
          <span className="photo-attach-copy">
            <strong>{label}</strong>
            <span className="muted">{hint}</span>
          </span>
        </button>
      )}
    </div>
  )
}
