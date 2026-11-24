// created: 2026-11-24T14:10:00-08:00 — clean chat UI from scratch (one scroll, no nested bars)
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { CHAT_EMOJIS, insertEmojiAtCursor } from '../lib/emojiBar'
import { parsePostShare } from '../lib/postShare'
import { prepareChatImage } from '../lib/chatImage'
import { FaceAvatar } from './FaceAvatar'
import { MediaLightbox } from './MediaLightbox'
import { NameWithBadge } from './VerifiedBadge'
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = messagesEndRef || endRef
  const locked = busy || localBusy

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

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
        {headerExtra}
      </header>

      <div className="chat2-stream" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="chat2-empty">No messages yet. Say hi!</p>
        ) : (
          messages.map((m) => {
            const sender = profilesById[m.sender_id]
            const mine = m.sender_id === userId
            const shared = parsePostShare(m.body)
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
                {shared ? (
                  <div className="chat2-share">
                    <p className="chat2-share-label">Shared post</p>
                    {sharedPost ? (
                      <>
                        <p className="chat2-share-sub">
                          {sharedPost.kind} · {authorName(sharedPost.author_id)}
                        </p>
                        {sharedPost.body ? <p className="chat2-text">{sharedPost.body}</p> : null}
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
                    {shared.note ? <p className="chat2-text">{shared.note}</p> : null}
                  </div>
                ) : (
                  <>
                    {m.body && m.body !== '📷' ? <p className="chat2-text">{m.body}</p> : null}
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
                <button
                  type="button"
                  className={myLiked.has(m.id) ? 'chat2-like on' : 'chat2-like'}
                  onClick={() => onToggleLike(m.id)}
                >
                  ♥ {likes[m.id] || 0}
                </button>
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
            <div className="chat2-attach-preview">
              <img src={mediaUrl} alt="" />
              <span>{mediaName || 'Photo ready'}</span>
              <button
                type="button"
                className="chat2-tool"
                disabled={locked}
                onClick={() => {
                  setMediaUrl(null)
                  setMediaName('')
                }}
              >
                Remove
              </button>
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
            <input
              ref={inputRef}
              className="chat2-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
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
                    </span>
                    <span className="chat2-person-sub">
                      {p ? `@${p.username}` : '1:1 chat'}
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
