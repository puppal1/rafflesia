// created: 2026-11-24T14:05:00-08:00 — standard comment panel: emoji + text + link + photo
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EmojiBar, insertEmojiAtCursor } from '../lib/emojiBar'
import { PhotoAttach } from './PhotoAttach'

export type CommentPayload = {
  // created: 2026-11-24T14:05:00-08:00
  body: string
  mediaUrl: string | null
}

type Props = {
  // created: 2026-11-24T14:05:00-08:00
  busy?: boolean
  submitLabel?: string
  placeholder?: string
  uploadPicture?: (file: File) => Promise<string>
  onSubmit: (payload: CommentPayload) => Promise<void>
}

/** created: 2026-11-24T14:05:00-08:00 — shared For You / Siobhan comment composer */
export function CommentComposer({
  busy,
  submitLabel = 'Comment',
  placeholder = 'Say hi… add emoji, a link, or a photo',
  uploadPicture,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState('')
  const [link, setLink] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const draftRef = useRef<HTMLInputElement | null>(null)
  const locked = busy || localBusy

  async function onPickPhoto(file: File) {
    if (!uploadPicture) return
    setLocalBusy(true)
    setErr('')
    try {
      const url = await uploadPicture(file)
      setMediaUrl(url)
      setFileName(file.name)
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
