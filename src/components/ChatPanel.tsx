// created: 2026-11-24T14:10:00-08:00 — clean chat UI from scratch (one scroll, no nested bars)
// updated: 2026-11-24T14:05:00-08:00 — scroll the stream itself; don’t scrollIntoView the page
// updated: 2026-11-25T00:20:00-08:00 — @mention autocomplete + highlighted message text
// updated: 2026-11-25T01:25:00-08:00 — PRD v4 stickers, polls, DM unread badges
// updated: 2026-11-25T01:45:00-08:00 — poll sheet UX (tool button + PollComposer)
// updated: 2026-11-25T20:40:00-08:00 — PRD v5 voice/video call controls
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { CHAT_EMOJIS, insertEmojiAtCursor } from '../lib/emojiBar'
import {
  filterMentionPeople,
  getActiveMention,
  insertMentionAt,
} from '../lib/mentions'
import { parsePostShare } from '../lib/postShare'
import { prepareChatImage } from '../lib/chatImage'
import { parsePollMessage } from '../lib/polls'
import { encodeStickerBody, parseStickerBody } from '../lib/stickers'
import { parseCallMessage, type CallMode } from '../lib/calls'
import type { IconDef } from '../lib/iconPacks'
import { FaceAvatar } from './FaceAvatar'
import { MediaLightbox } from './MediaLightbox'
import { MentionText } from './MentionText'
import { MentionTypeahead } from './MentionTypeahead'
import { NameWithBadge } from './VerifiedBadge'
import { PollCard } from './PollCard'
import { PollComposer } from './PollComposer'
import { StickerPicker } from './StickerPicker'
import type { ChatRow, MessageRow, PostRow, Profile } from '../types'

function niceName(p: Profile | null | undefined) {
  // created: 2026-11-24T14:10:00-08:00
  if (!p) return 'Friend'
  return (p.display_name || '').trim() || p.username
}

function isChatImage(url: string) {
  // created: 2026-11-24T14:10:00-08:00
  return (
    /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) ||
    url.includes('/storage/v1/object/public/posts/')
  )
}

type ThreadProps = {
  // created: 2026-11-24T14:10:00-08:00
  userId: string
  me: Profile | null
  title: string
  peer?: Profile | null
  messages: MessageRow[]
  profilesById: Record<string, Profile>
  posts: PostRow[]
  likes: Record<string, number>
  myLiked: Set<string>
  busy?: boolean
  readOnly?: boolean
  readOnlyHint?: string
  backLabel?: string
  onBack?: () => void
  headerExtra?: ReactNode
  onToggleLike: (messageId: string) => void
  onSend: (payload: { body: string; mediaUrl: string | null }) => Promise<void>
  onUploadPhoto: (file: File) => Promise<string>
  authorName: (id: string) => string
  messagesEndRef?: RefObject<HTMLDivElement | null>
  /** created: 2026-11-25T00:20:00-08:00 */
  mentionPeople?: Profile[]
  onOpenUsername?: (username: string) => void
  /** created: 2026-11-25T01:25:00-08:00 — lounge polls */
  allowPolls?: boolean
  onCreatePoll?: (question: string, options: string[]) => Promise<void>
  /** created: 2026-11-25T20:40:00-08:00 — voice/video */
  /** updated: 2026-11-25T20:45:00-08:00 — voice-only group calls */
  allowCalls?: boolean
  onStartCall?: () => void
  onJoinCallFromMessage?: (callId: string, mode: CallMode) => void
}

/** created: 2026-11-24T14:10:00-08:00 — conversation + composer only */
export function ChatThread({
  userId,
  me,
  title,
  peer,
  messages,
  profilesById,
  posts,
  likes,
  myLiked,
  busy,
  readOnly,
  readOnlyHint,
  backLabel = '← Back',
  onBack,
  headerExtra,
  onToggleLike,
  onSend,
  onUploadPhoto,
  authorName,
  messagesEndRef,
  mentionPeople,
  onOpenUsername,
  allowPolls,
  onCreatePoll,
  allowCalls,
  onStartCall,
  onJoinCallFromMessage,
}: ThreadProps) {
  const [draft, setDraft] = useState('')
  const [link, setLink] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaName, setMediaName] = useState('')
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [pollOpen, setPollOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<HTMLDivElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = messagesEndRef || endRef
  const locked = busy || localBusy
  const lastMsgId = messages.length ? messages[messages.length - 1]?.id : ''
  const people = useMemo(
    () => mentionPeople || Object.values(profilesById),
    [mentionPeople, profilesById],
  )
  const activeMention = getActiveMention(draft, cursor)
  const mentionHits =
    activeMention && !readOnly ? filterMentionPeople(people, activeMention.query) : []

  async function sendSticker(icon: IconDef) {
    // created: 2026-11-25T01:25:00-08:00
    setLocalBusy(true)
    setErr('')
    try {
      await onSend({
        body: encodeStickerBody(icon),
        mediaUrl: icon.imageUrl || null,
      })
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not send sticker.')
    } finally {
      setLocalBusy(false)
    }
  }

  function pickMention(p: Profile) {
    if (!activeMention) return
    const next = insertMentionAt(draft, cursor, activeMention.start, p.username)
    setDraft(next.text)
    setCursor(next.cursor)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.cursor, next.cursor)
    })
  }

  // created: 2026-11-24T14:05:00-08:00 — pin to latest inside .chat2-stream only
  useEffect(() => {
    const stream = streamRef.current
    if (!stream) return
    stream.scrollTop = stream.scrollHeight
    bottomRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, lastMsgId])

  async function pickPhoto(file: File) {
    setLocalBusy(true)
    setErr('')
    try {
      const prepared = await prepareChatImage(file)
      const url = await onUploadPhoto(prepared)
      setMediaUrl(url)
      setMediaName(prepared.name)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Photo upload failed.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (readOnly) return
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
      await onSend({ body: body || (mediaUrl ? '📷' : ''), mediaUrl })
      setDraft('')
      setLink('')
      setLinkOpen(false)
      setMediaUrl(null)
      setMediaName('')
      setEmojiOpen(false)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not send.')
    } finally {
      setLocalBusy(false)
    }
  }

  return (
    <div className="chat2-thread">
      <header className="chat2-head">
        {onBack ? (
          <button type="button" className="chat2-back" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
        <div className="chat2-peer">
          {peer ? (
            <FaceAvatar
              avatarUrl={peer.avatar_url}
              iconPack={peer.icon_pack}
              iconId={peer.icon_id}
              size="sm"
            />
          ) : null}
          <strong>{title}</strong>
        </div>
        <div className="chat2-head-tools">
          {allowCalls && onStartCall ? (
            <button
              type="button"
              className="chat2-tool"
              title="Start voice call"
              onClick={() => onStartCall()}
            >
              📞
            </button>
          ) : null}
          {headerExtra}
        </div>
      </header>

      <div className="chat2-stream" role="log" aria-live="polite" ref={streamRef}>
        {messages.length === 0 ? (
          <p className="chat2-empty">No messages yet. Say hi!</p>
        ) : (
          messages.map((m) => {
            const sender = profilesById[m.sender_id]
            const mine = m.sender_id === userId
            const pollId = parsePollMessage(m.body)
            const sticker = parseStickerBody(m.body)
            const callMsg = parseCallMessage(m.body)
            const shared = pollId || sticker || callMsg ? null : parsePostShare(m.body)
            const sharedPost = shared ? posts.find((p) => p.id === shared.postId) : null
            const media = m.video_url
            const img = media && isChatImage(media)
            return (
              <article key={m.id} className={mine ? 'chat2-bubble mine' : 'chat2-bubble'}>
                <div className="chat2-meta">
                  <NameWithBadge
                    name={niceName(mine ? me : sender)}
                    tier={(mine ? me : sender)?.verify_tier}
                  />
                  <span>· {new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                {pollId ? (
                  <PollCard pollId={pollId} userId={userId} canClose={mine} />
                ) : callMsg ? (
                  <div className="chat2-call-card">
                    <p className="chat2-call-label">
                      {callMsg.mode === 'voice' ? '📞 Voice call' : '📹 Video call'}
                    </p>
                    <p className="chat2-text">
                      {(m.body || '')
                        .replace(/^@@call:[0-9a-f-]+:(?:voice|video)@@\s*/i, '')
                        .trim() || 'Call started'}
                    </p>
                    {onJoinCallFromMessage ? (
                      <button
                        className="primary btn-compact"
                        type="button"
                        onClick={() => onJoinCallFromMessage(callMsg.callId, callMsg.mode)}
                      >
                        Join call
                      </button>
                    ) : null}
                  </div>
                ) : sticker ? (
                  <div className="chat2-sticker">
                    {sticker.imageUrl ? (
                      <img src={sticker.imageUrl} alt={sticker.label} />
                    ) : (
                      <span className="chat2-sticker-emoji">{sticker.emoji}</span>
                    )}
                    <span className="chat2-muted">{sticker.label}</span>
                  </div>
                ) : shared ? (
                  <div className="chat2-share">
                    <p className="chat2-share-label">Shared post</p>
                    {sharedPost ? (
                      <>
                        <p className="chat2-share-sub">
                          {sharedPost.kind} · {authorName(sharedPost.author_id)}
                        </p>
                        {sharedPost.body ? (
                          <p className="chat2-text">
                            <MentionText
                              text={sharedPost.body}
                              profilesById={profilesById}
                              onOpenUsername={onOpenUsername}
                            />
                          </p>
                        ) : null}
                        {sharedPost.kind === 'picture' && sharedPost.media_url ? (
                          <button
                            type="button"
                            className="chat2-pic"
                            onClick={() => setLightbox(sharedPost.media_url!)}
                          >
                            <img src={sharedPost.media_url} alt="" />
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className="chat2-muted">Post preview…</p>
                    )}
                    {shared.note ? (
                      <p className="chat2-text">
                        {/* updated: 2026-11-25T20:25:00-08:00 — note links clickable */}
                        <MentionText
                          text={shared.note}
                          profilesById={profilesById}
                          onOpenUsername={onOpenUsername}
                        />
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {m.body && m.body !== '📷' ? (
                      <p className="chat2-text">
                        <MentionText
                          text={m.body}
                          profilesById={profilesById}
                          onOpenUsername={onOpenUsername}
                        />
                      </p>
                    ) : null}
                    {media ? (
                      img ? (
                        <button
                          type="button"
                          className="chat2-pic"
                          onClick={() => setLightbox(media)}
                        >
                          <img src={media} alt="" />
                        </button>
                      ) : (
                        <video className="chat2-vid" src={media} controls playsInline />
                      )
                    ) : null}
                  </>
                )}
                {!pollId && !callMsg ? (
                  <button
                    type="button"
                    className={myLiked.has(m.id) ? 'chat2-like on' : 'chat2-like'}
                    onClick={() => onToggleLike(m.id)}
                  >
                    ♥ {likes[m.id] || 0}
                  </button>
                ) : null}
              </article>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {readOnly ? (
        <p className="chat2-readonly">{readOnlyHint || 'Read-only'}</p>
      ) : (
        <div className="chat2-composer">
          {emojiOpen ? (
            <div className="chat2-emojis" role="listbox" aria-label="Emoji">
              {CHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="chat2-emoji"
                  onClick={() =>
                    insertEmojiAtCursor(inputRef.current, draft, setDraft, emoji)
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
          {mediaUrl ? (
            <div className="chat2-attach-preview" title={mediaName || 'Photo ready'}>
              {/* updated: 2026-11-24T14:12:00-08:00 — thumb + ✕ only; no long name overlap */}
              <div className="chat2-attach-thumb">
                <img src={mediaUrl} alt={mediaName || 'Attached photo'} />
                <button
                  type="button"
                  className="chat2-attach-x"
                  disabled={locked}
                  aria-label="Remove photo"
                  title="Remove"
                  onClick={() => {
                    setMediaUrl(null)
                    setMediaName('')
                  }}
                >
                  ×
                </button>
              </div>
              <span className="chat2-attach-name">Photo ready</span>
            </div>
          ) : null}
          {linkOpen ? (
            <input
              className="chat2-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          ) : null}
          {err ? <p className="chat2-err">{err}</p> : null}
          <StickerPicker disabled={locked} onPick={sendSticker} />
          {allowPolls && onCreatePoll ? (
            <PollComposer
              open={pollOpen}
              busy={locked}
              onClose={() => setPollOpen(false)}
              onSubmit={async (question, options) => {
                // created: 2026-11-25T01:45:00-08:00
                await onCreatePoll(question, options)
              }}
            />
          ) : null}
          <MentionTypeahead hits={mentionHits} onPick={pickMention} />
          <form className="chat2-row" onSubmit={submit}>
            <input
              ref={fileRef}
              className="chat2-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={locked}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) pickPhoto(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="chat2-tool"
              title="Emoji"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              😊
            </button>
            <button
              type="button"
              className="chat2-tool"
              title="Photo"
              disabled={locked}
              onClick={() => fileRef.current?.click()}
            >
              📷
            </button>
            <button
              type="button"
              className={linkOpen ? 'chat2-tool on' : 'chat2-tool'}
              title="Link"
              onClick={() => setLinkOpen((v) => !v)}
            >
              🔗
            </button>
            {allowPolls && onCreatePoll ? (
              <button
                type="button"
                className={pollOpen ? 'chat2-tool on' : 'chat2-tool'}
                title="Club vote"
                disabled={locked}
                onClick={() => {
                  setEmojiOpen(false)
                  setLinkOpen(false)
                  setPollOpen(true)
                }}
              >
                📊
              </button>
            ) : null}
            <input
              ref={inputRef}
              className="chat2-input"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setCursor(e.target.selectionStart ?? e.target.value.length)
              }}
              onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
              onKeyUp={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
              onClick={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
              placeholder="Message… type @ to tag"
              disabled={locked}
            />
            <button
              className="chat2-send"
              type="submit"
              disabled={locked || (!draft.trim() && !mediaUrl && !link.trim())}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <MediaLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}

type PanelProps = {
  // created: 2026-11-24T14:10:00-08:00
  userId: string
  me: Profile | null
  chats: ChatRow[]
  peersByChatId: Record<string, Profile>
  activeChat: ChatRow | null
  onSelectChat: (chat: ChatRow | null) => void
  messages: MessageRow[]
  profilesById: Record<string, Profile>
  posts: PostRow[]
  likes: Record<string, number>
  myLiked: Set<string>
  busy?: boolean
  onToggleLike: (messageId: string) => void
  onSend: (payload: { body: string; mediaUrl: string | null }) => Promise<void>
  onUploadPhoto: (file: File) => Promise<string>
  authorName: (id: string) => string
  /** created: 2026-11-25T00:20:00-08:00 */
  mentionPeople?: Profile[]
  onOpenUsername?: (username: string) => void
  /** created: 2026-11-25T01:25:00-08:00 — DM unread only */
  unreadByChatId?: Record<string, number>
  /** created: 2026-11-25T20:40:00-08:00 */
  /** updated: 2026-11-25T20:45:00-08:00 — voice-only */
  allowCalls?: boolean
  onStartCall?: () => void
  onJoinCallFromMessage?: (callId: string, mode: CallMode) => void
}

/** created: 2026-11-24T14:10:00-08:00 — inbox + thread shell */
export function ChatPanel({
  userId,
  me,
  chats,
  peersByChatId,
  activeChat,
  onSelectChat,
  messages,
  profilesById,
  posts,
  likes,
  myLiked,
  busy,
  onToggleLike,
  onSend,
  onUploadPhoto,
  authorName,
  mentionPeople,
  onOpenUsername,
  unreadByChatId,
  allowCalls,
  onStartCall,
  onJoinCallFromMessage,
}: PanelProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = !q
    ? chats
    : chats.filter((c) => {
        const p = peersByChatId[c.id]
        if (!p) return false
        return (
          p.username.toLowerCase().includes(q) ||
          (p.display_name || '').toLowerCase().includes(q)
        )
      })
  const peer = activeChat ? peersByChatId[activeChat.id] : null
  const title = peer ? niceName(peer) : 'Chat'

  return (
    <div className={`chat2 ${activeChat ? 'has-thread' : ''}`}>
      <aside className="chat2-inbox">
        <div className="chat2-inbox-head">
          <h2 className="chat2-title">Messages</h2>
          <p className="chat2-sub">Private chats · groups are in Lounge</p>
          {chats.length > 4 ? (
            <input
              className="chat2-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search chats"
            />
          ) : null}
        </div>
        <div className="chat2-inbox-list">
          {chats.length === 0 ? (
            <p className="chat2-empty">No chats yet. People → Message someone.</p>
          ) : list.length === 0 ? (
            <p className="chat2-empty">No matches.</p>
          ) : (
            list.map((c) => {
              const p = peersByChatId[c.id]
              const on = activeChat?.id === c.id
              const unread = unreadByChatId?.[c.id] || 0
              return (
                <button
                  key={c.id}
                  type="button"
                  className={on ? 'chat2-person on' : 'chat2-person'}
                  onClick={() => onSelectChat(c)}
                >
                  <FaceAvatar
                    avatarUrl={p?.avatar_url}
                    iconPack={p?.icon_pack}
                    iconId={p?.icon_id}
                    size="sm"
                  />
                  <span className="chat2-person-text">
                    <span className="chat2-person-name">
                      {p ? (
                        <NameWithBadge name={niceName(p)} tier={p.verify_tier} />
                      ) : (
                        'Private chat'
                      )}
                      {unread > 0 ? (
                        <span className="nav-unread-badge" aria-label={`${unread} unread`}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      ) : null}
                    </span>
                    <span className="chat2-person-sub">
                      {p ? `@${p.username}` : '1:1 chat'}
                      {unread > 0 ? ' · new' : ''}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <div className="chat2-main">
        {activeChat && !activeChat.is_group ? (
          <ChatThread
            userId={userId}
            me={me}
            title={title}
            peer={peer}
            messages={messages}
            profilesById={profilesById}
            posts={posts}
            likes={likes}
            myLiked={myLiked}
            busy={busy}
            backLabel="← Inbox"
            onBack={() => onSelectChat(null)}
            onToggleLike={onToggleLike}
            onSend={onSend}
            onUploadPhoto={onUploadPhoto}
            authorName={authorName}
            mentionPeople={mentionPeople}
            onOpenUsername={onOpenUsername}
            allowCalls={allowCalls}
            onStartCall={onStartCall}
            onJoinCallFromMessage={onJoinCallFromMessage}
          />
        ) : (
          <div className="chat2-placeholder">
            <p className="chat2-title">Pick a chat</p>
            <p className="chat2-muted">Choose someone on the left.</p>
          </div>
        )}
      </div>
    </div>
  )
}
