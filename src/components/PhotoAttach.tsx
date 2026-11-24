// created: 2026-11-24T13:50:00-08:00 — modern photo attach (no native Choose File chrome)
// updated: 2026-11-24T13:40:00-08:00 — compact toolbar chip for chat composer
// updated: 2026-11-24T13:45:00-08:00 — accept/video + profile/share drop zones
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
  /** created: 2026-11-24T13:45:00-08:00 */
  accept?: string
  /** created: 2026-11-24T13:45:00-08:00 — image thumb vs video thumb */
  mediaKind?: 'image' | 'video'
  icon?: string
  readyLabel?: string
  onPick: (file: File) => void
  onClear?: () => void
}

/** created: 2026-11-24T13:50:00-08:00 */
/** updated: 2026-11-24T13:45:00-08:00 */
export function PhotoAttach({
  label = 'Add photo',
  hint = 'Tap to attach a picture',
  previewUrl,
  fileName,
  busy,
  variant = 'drop',
  accept = 'image/*',
  mediaKind = 'image',
  icon,
  readyLabel,
  onPick,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const glyph = icon || (mediaKind === 'video' ? '🎬' : '📷')
  const ready = readyLabel || (mediaKind === 'video' ? 'Video ready' : 'Photo ready')

  return (
    <div className={variant === 'compact' ? 'photo-attach photo-attach-compact' : 'photo-attach'}>
      <input
        ref={inputRef}
        className="photo-attach-input"
        type="file"
        accept={accept}
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
      {previewUrl ? (
        <div className="photo-attach-preview">
          {mediaKind === 'video' ? (
            <video className="photo-attach-thumb" src={previewUrl} muted playsInline />
          ) : (
            <img className="photo-attach-thumb" src={previewUrl} alt="" />
          )}
          <div className="photo-attach-preview-meta">
            <p className="photo-attach-ready">
              {ready}
              {fileName ? ` · ${fileName}` : ''}
            </p>
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
          {glyph}
        </button>
      ) : (
        <button
          type="button"
          className="photo-attach-drop"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <span className="photo-attach-icon" aria-hidden>
            {glyph}
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
