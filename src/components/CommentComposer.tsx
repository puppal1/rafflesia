// created: 2026-11-24T14:05:00-08:00 — standard comment panel: emoji + text + link + photo
// updated: 2026-11-24T14:15:00-08:00 — dock variant: one compact row, feed stays visible
// updated: 2026-11-25T00:20:00-08:00 — @mention autocomplete + draft seed for soft Reply
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react'
import { CHAT_EMOJIS, EmojiBar, insertEmojiAtCursor } from '../lib/emojiBar'
import { prepareChatImage } from '../lib/chatImage'
import {
  filterMentionPeople,
  getActiveMention,
  insertMentionAt,
} from '../lib/mentions'
import { PhotoAttach } from './PhotoAttach'
import { MentionTypeahead } from './MentionTypeahead'
import type { Profile } from '../types'

export type CommentPayload = {
  // created: 2026-11-24T14:05:00-08:00
  body: string
  mediaUrl: string | null
}

type Props = {
  // created: 2026-11-24T14:05:00-08:00
  // updated: 2026-11-24T14:15:00-08:00
  // updated: 2026-11-25T00:20:00-08:00 — people + draftSeed
  busy?: boolean
  submitLabel?: string
  placeholder?: string
  variant?: 'stack' | 'dock'
  uploadPicture?: (file: File) => Promise<string>
  onSubmit: (payload: CommentPayload) => Promise<void>
  people?: Profile[]
  /** Soft reply: parent sets `@user ` then clears after consume */
  draftSeed?: string | null
  onDraftSeedConsumed?: () => void
}

/** created: 2026-11-24T14:05:00-08:00 — shared For You / Siobhan comment composer */
/** updated: 2026-11-25T00:20:00-08:00 */
export function CommentComposer({
  busy,
  submitLabel = 'Comment',
  placeholder = 'Say hi… use @ to tag someone',
  variant = 'stack',
  uploadPicture,
  onSubmit,
  people = [],
  draftSeed,
  onDraftSeedConsumed,
}: Props) {
  const [draft, setDraft] = useState('')
  const [link, setLink] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const [cursor, setCursor] = useState(0)
  const draftRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const locked = busy || localBusy

  useEffect(() => {
    // created: 2026-11-25T00:20:00-08:00 — apply soft Reply seed
    if (draftSeed == null || draftSeed === '') return
    setDraft(draftSeed)
    setCursor(draftSeed.length)
    onDraftSeedConsumed?.()
    requestAnimationFrame(() => {
      const el = draftRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(draftSeed.length, draftSeed.length)
    })
  }, [draftSeed, onDraftSeedConsumed])

  const active = getActiveMention(draft, cursor)
  const mentionHits =
    active && people.length > 0 ? filterMentionPeople(people, active.query) : []

  function pickMention(p: Profile) {
    if (!active) return
    const next = insertMentionAt(draft, cursor, active.start, p.username)
    setDraft(next.text)
    setCursor(next.cursor)
    requestAnimationFrame(() => {
      const el = draftRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.cursor, next.cursor)
    })
  }

  function onDraftChange(value: string, sel: number) {
    setDraft(value)
    setCursor(sel)
  }

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
      setCursor(0)
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

  const inputHandlers = {
    value: draft,
    maxLength: 500 as const,
    disabled: locked,
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      onDraftChange(e.target.value, e.target.selectionStart ?? e.target.value.length),
    onSelect: (e: SyntheticEvent<HTMLInputElement>) =>
      setCursor(e.currentTarget.selectionStart ?? 0),
    onKeyUp: (e: KeyboardEvent<HTMLInputElement>) =>
      setCursor(e.currentTarget.selectionStart ?? 0),
    onClick: (e: MouseEvent<HTMLInputElement>) =>
      setCursor(e.currentTarget.selectionStart ?? 0),
    placeholder,
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
        <MentionTypeahead hits={mentionHits} onPick={pickMention} />
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
          <input ref={draftRef} className="comment-dock-input" {...inputHandlers} />
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
      <label className="mention-field">
        Comment
        <input ref={draftRef} {...inputHandlers} />
        <MentionTypeahead hits={mentionHits} onPick={pickMention} />
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
