// created: 2026-11-24T14:05:00-08:00 — standard comment panel: emoji + text + link + photo
// updated: 2026-11-24T14:15:00-08:00 — dock variant: one compact row, feed stays visible
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CHAT_EMOJIS, EmojiBar, insertEmojiAtCursor } from '../lib/emojiBar'
import { prepareChatImage } from '../lib/chatImage'
import { PhotoAttach } from './PhotoAttach'

export type CommentPayload = {
  // created: 2026-11-24T14:05:00-08:00
  body: string
  mediaUrl: string | null
}

type Props = {
  // created: 2026-11-24T14:05:00-08:00
  // updated: 2026-11-24T14:15:00-08:00
  busy?: boolean
  submitLabel?: string
  placeholder?: string
  variant?: 'stack' | 'dock'
  uploadPicture?: (file: File) => Promise<string>
  onSubmit: (payload: CommentPayload) => Promise<void>
}

/** created: 2026-11-24T14:05:00-08:00 — shared For You / Siobhan comment composer */
/** updated: 2026-11-24T14:15:00-08:00 */
export function CommentComposer({
  busy,
  submitLabel = 'Comment',
  placeholder = 'Say hi… emoji, link, or photo',
  variant = 'stack',
  uploadPicture,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState('')
  const [link, setLink] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const draftRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const locked = busy || localBusy

  async function onPickPhoto(file: File) {
    if (!uploadPicture) return
    setLocalBusy(true)
    setErr('')
    try {
      const prepared = await prepareChatImage(file)
      const url = await uploadPicture(prepared)
      setMediaUrl(url)
      setFileName(prepared.name)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Photo upload failed.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    const url = link.trim()
    if (url && !/^https?:\/\//i.test(url)) {
      setErr('Link must start with http:// or https://')
      return
    }
    const parts = [text]
    if (url) parts.push(url)
    const body = parts.filter(Boolean).join('\n')
    if (!body && !mediaUrl) return
    setLocalBusy(true)
    setErr('')
    try {
      await onSubmit({ body: body || '📷', mediaUrl })
      setDraft('')
      setLink('')
      setLinkOpen(false)
      setMediaUrl(null)
      setFileName('')
      setShowEmoji(false)
    } catch (ex) {
      const msg =
        ex && typeof ex === 'object' && 'message' in ex && typeof (ex as { message: unknown }).message === 'string'
          ? (ex as { message: string }).message
          : 'Could not comment.'
      setErr(msg)
    } finally {
      setLocalBusy(false)
    }
  }

  if (variant === 'dock') {
    return (
      <form className="comment-dock-form" onSubmit={submit}>
        {showEmoji ? (
          <div className="comment-dock-emojis" role="listbox" aria-label="Emoji">
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="comment-dock-emoji"
                onClick={() => insertEmojiAtCursor(draftRef.current, draft, setDraft, emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        {mediaUrl ? (
          <div className="comment-dock-preview" title={fileName || 'Photo ready'}>
            <img src={mediaUrl} alt="" />
            <button
              type="button"
              className="comment-dock-x"
              disabled={locked}
              aria-label="Remove photo"
              onClick={() => {
                setMediaUrl(null)
                setFileName('')
              }}
            >
              ×
            </button>
            <span>Photo ready</span>
          </div>
        ) : null}
        {linkOpen ? (
          <input
            className="comment-dock-link"
            value={link}
            disabled={locked}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
            inputMode="url"
          />
        ) : null}
        <div className="comment-dock-row">
          <button
            type="button"
            className={showEmoji ? 'comment-dock-tool on' : 'comment-dock-tool'}
            disabled={locked}
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
          >
            😊
          </button>
          {uploadPicture ? (
            <>
              <input
                ref={fileRef}
                className="comment-dock-file"
                type="file"
                accept="image/*"
                disabled={locked}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) onPickPhoto(f).catch(() => undefined)
                }}
              />
              <button
                type="button"
                className="comment-dock-tool"
                disabled={locked}
                title="Photo"
                onClick={() => fileRef.current?.click()}
              >
                📷
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={linkOpen ? 'comment-dock-tool on' : 'comment-dock-tool'}
            disabled={locked}
            title="Link"
            onClick={() => setLinkOpen((v) => !v)}
          >
            🔗
          </button>
          <input
            ref={draftRef}
            className="comment-dock-input"
            value={draft}
            maxLength={500}
            disabled={locked}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
          <button
            className="primary btn-compact comment-dock-send"
            type="submit"
            disabled={locked || (!draft.trim() && !link.trim() && !mediaUrl)}
          >
            {submitLabel}
          </button>
        </div>
        {err ? <p className="error">{err}</p> : null}
      </form>
    )
  }

  return (
    <form className="form form-compact comment-form comment-composer" onSubmit={submit}>
      <EmojiBar
        label="Emoji"
        open={showEmoji}
        onToggle={() => setShowEmoji((v) => !v)}
        onPick={(emoji) => insertEmojiAtCursor(draftRef.current, draft, setDraft, emoji)}
      />
      <label>
        Comment
        <input
          ref={draftRef}
          value={draft}
          maxLength={500}
          disabled={locked}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      <label className="composer-link">
        Link (optional)
        <input
          value={link}
          disabled={locked}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
      </label>
      {uploadPicture ? (
        <PhotoAttach
          label="Add photo to comment"
          hint="Optional · tap to attach a picture"
          previewUrl={mediaUrl}
          fileName={fileName}
          busy={locked}
          onPick={onPickPhoto}
          onClear={() => {
            setMediaUrl(null)
            setFileName('')
          }}
        />
      ) : null}
      <div className="action-row">
        <button
          className="primary btn-compact"
          type="submit"
          disabled={locked || (!draft.trim() && !link.trim() && !mediaUrl)}
        >
          {submitLabel}
        </button>
      </div>
      {err ? <p className="error">{err}</p> : null}
    </form>
  )
}
