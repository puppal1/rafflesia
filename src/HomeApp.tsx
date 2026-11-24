// created: 2026-11-23T12:14:00-08:00
// updated: 2026-11-23T20:28:00-08:00 — public followers / following lists on Me + People profiles
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'

const logoSrc = `${import.meta.env.BASE_URL}logo.jpg`
import type { ChatRow, FollowListKind, MessageRow, Profile, Tab } from './types'

type Props = {
  userId: string
  onLogout: () => void
}

export function HomeApp({ userId, onLogout }: Props) {
  // created: 2026-11-23T12:14:00-08:00
  const [tab, setTab] = useState<Tab>('chats')
  const [me, setMe] = useState<Profile | null>(null)
  const [people, setPeople] = useState<Profile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  // created: 2026-11-23T20:28:00-08:00 — follower/following counts + open profile lists
  const [followerCountById, setFollowerCountById] = useState<Record<string, number>>({})
  const [followingCountById, setFollowingCountById] = useState<Record<string, number>>({})
  const [viewProfile, setViewProfile] = useState<Profile | null>(null)
  const [followListKind, setFollowListKind] = useState<FollowListKind | null>(null)
  const [followList, setFollowList] = useState<Profile[]>([])
  const [chats, setChats] = useState<ChatRow[]>([])
  const [activeChat, setActiveChat] = useState<ChatRow | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [myLiked, setMyLiked] = useState<Set<string>>(new Set())
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({})
  const [draft, setDraft] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadMe = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T12:30:00-08:00 — use ensure_my_profile RPC when row missing
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (err) throw err
    if (!data) {
      const fallbackUser = `user${userId.replace(/-/g, '').slice(0, 8)}`
      const { data: created, error: createErr } = await supabase.rpc('ensure_my_profile', {
        p_username: fallbackUser,
        p_display_name: 'Friend',
      })
      if (createErr) throw createErr
      const row = created as Profile
      setMe(row)
      setEditName(row.display_name)
      setEditBio(row.bio || '')
      return
    }
    setMe(data as Profile)
    setEditName(data.display_name)
    setEditBio(data.bio || '')
  }, [userId])

  const loadFollowGraph = useCallback(async (allProfiles: Profile[]) => {
    // created: 2026-11-23T20:28:00-08:00 — counts for Me + People (needs follows SELECT or RPCs)
    const ids = allProfiles.map((p) => p.id)
    const followers: Record<string, number> = {}
    const following: Record<string, number> = {}
    for (const id of ids) {
      followers[id] = 0
      following[id] = 0
    }

    const edges = await supabase.from('follows').select('follower_id, following_id')
    if (!edges.error && edges.data) {
      for (const row of edges.data) {
        const a = String(row.follower_id)
        const b = String(row.following_id)
        if (following[a] !== undefined) following[a] += 1
        else following[a] = 1
        if (followers[b] !== undefined) followers[b] += 1
        else followers[b] = 1
      }
      setFollowerCountById(followers)
      setFollowingCountById(following)
      return
    }

    // Fallback: RPC per profile (after sql/fix-follows-rls.sql)
    await Promise.all(
      ids.map(async (id) => {
        const [fol, fing] = await Promise.all([
          supabase.rpc('list_user_followers', { p_user_id: id }),
          supabase.rpc('list_user_following', { p_user_id: id }),
        ])
        followers[id] = Array.isArray(fol.data) ? fol.data.length : 0
        following[id] = Array.isArray(fing.data) ? fing.data.length : 0
      }),
    )
    setFollowerCountById(followers)
    setFollowingCountById(following)
  }, [])

  const loadPeople = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:28:00-08:00 — load my following + everyone's follow counts
    const peopleRes = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .order('username')
    if (peopleRes.error) throw peopleRes.error
    const others = (peopleRes.data || []) as Profile[]
    setPeople(others)

    const meRes = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    const meRow = (meRes.data as Profile | null) || null
    const graphProfiles = meRow ? [meRow, ...others] : others
    await loadFollowGraph(graphProfiles)

    const rpcRes = await supabase.rpc('list_my_following')
    if (!rpcRes.error && Array.isArray(rpcRes.data)) {
      setFollowingIds(new Set((rpcRes.data as string[]).map(String)))
      return
    }

    const followsRes = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
    if (followsRes.error) throw followsRes.error
    setFollowingIds(new Set((followsRes.data || []).map((f) => f.following_id as string)))
  }, [userId, loadFollowGraph])

  const loadChats = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    const { data: memberships, error: memErr } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', userId)
    if (memErr) throw memErr
    const ids = (memberships || []).map((m) => m.chat_id as string)
    if (!ids.length) {
      setChats([])
      return
    }
    const { data, error: chatErr } = await supabase
      .from('chats')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
    if (chatErr) throw chatErr
    setChats((data || []) as ChatRow[])
  }, [userId])

  const refreshAll = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T12:25:00-08:00 — load each part separately so one failure does not hide people
    setError('')
    const problems: string[] = []
    try {
      await loadMe()
    } catch (err) {
      problems.push(err instanceof Error ? err.message : 'Profile load failed.')
    }
    try {
      await loadPeople()
    } catch (err) {
      problems.push(err instanceof Error ? err.message : 'People load failed.')
    }
    try {
      await loadChats()
    } catch (err) {
      problems.push(err instanceof Error ? err.message : 'Chats load failed.')
    }
    if (problems.length) setError(problems.join(' | '))
  }, [loadMe, loadPeople, loadChats])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const loadMessages = useCallback(
    async (chatId: string) => {
      // created: 2026-11-23T12:14:00-08:00
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
      if (msgErr) throw msgErr
      const list = (msgs || []) as MessageRow[]
      setMessages(list)

      const senderIds = [...new Set(list.map((m) => m.sender_id))]
      if (senderIds.length) {
        const { data: senders } = await supabase.from('profiles').select('*').in('id', senderIds)
        const map: Record<string, Profile> = {}
        ;(senders || []).forEach((p) => {
          map[p.id] = p as Profile
        })
        setProfilesById((prev) => ({ ...prev, ...map }))
      }

      const msgIds = list.map((m) => m.id)
      if (!msgIds.length) {
        setLikes({})
        setMyLiked(new Set())
        return
      }
      const { data: likeRows } = await supabase
        .from('message_likes')
        .select('message_id, user_id')
        .in('message_id', msgIds)
      const counts: Record<string, number> = {}
      const mine = new Set<string>()
      ;(likeRows || []).forEach((row) => {
        const id = row.message_id as string
        counts[id] = (counts[id] || 0) + 1
        if (row.user_id === userId) mine.add(id)
      })
      setLikes(counts)
      setMyLiked(mine)
    },
    [userId],
  )

  useEffect(() => {
    if (!activeChat) return
    loadMessages(activeChat.id).catch((err) =>
      setError(err instanceof Error ? err.message : 'Could not load messages.'),
    )
    const channel = supabase
      .channel(`messages-${activeChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChat.id}`,
        },
        () => {
          loadMessages(activeChat.id)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat, loadMessages])

  async function saveProfile(e: FormEvent) {
    // created: 2026-11-23T12:14:00-08:00
    e.preventDefault()
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          display_name: editName.trim() || me?.username || 'Friend',
          bio: editBio,
        })
        .eq('id', userId)
      if (err) throw err
      setStatus('Profile saved.')
      await loadMe()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadImage(kind: 'avatar' | 'banner', file: File) {
    // created: 2026-11-23T12:18:00-08:00
    // updated: 2026-11-23T12:25:00-08:00 — clearer errors + remove-then-upload
    setBusy(true)
    setError('')
    setStatus('')
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image file (jpg/png/webp/gif).')
      }
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('Image is too big. Use a file under 4 MB.')
      }
      const bucket = kind === 'avatar' ? 'avatars' : 'banners'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${userId}/${kind}.${ext}`
      await supabase.storage.from(bucket).remove([path])
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`
      const { error: profileErr } = await supabase.rpc('set_my_profile_image', {
        p_kind: kind,
        p_url: publicUrl,
      })
      if (profileErr) throw profileErr
      setStatus(kind === 'avatar' ? 'Profile picture updated.' : 'Banner updated.')
      await loadMe()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Upload failed.'
      setError(`Upload failed: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  function niceName(p?: Profile | null) {
    // created: 2026-11-23T12:42:00-08:00
    if (!p) return 'User'
    const d = (p.display_name || '').trim()
    if (d && d.toLowerCase() !== 'friend') return d
    return p.username || 'User'
  }

  async function openFollowList(profile: Profile, kind: FollowListKind) {
    // created: 2026-11-23T20:28:00-08:00 — show someone's followers or following
    setError('')
    setBusy(true)
    setViewProfile(profile)
    setFollowListKind(kind)
    setFollowList([])
    try {
      const rpcName = kind === 'followers' ? 'list_user_followers' : 'list_user_following'
      const { data, error: err } = await supabase.rpc(rpcName, { p_user_id: profile.id })
      if (!err && Array.isArray(data)) {
        setFollowList(data as Profile[])
        return
      }

      // Table fallback once follows SELECT is public
      if (kind === 'followers') {
        const { data: edges, error: e2 } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.id)
        if (e2) throw err || e2
        const ids = (edges || []).map((r) => String(r.follower_id))
        if (!ids.length) {
          setFollowList([])
          return
        }
        const { data: rows, error: e3 } = await supabase.from('profiles').select('*').in('id', ids)
        if (e3) throw e3
        setFollowList((rows || []) as Profile[])
      } else {
        const { data: edges, error: e2 } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
        if (e2) throw err || e2
        const ids = (edges || []).map((r) => String(r.following_id))
        if (!ids.length) {
          setFollowList([])
          return
        }
        const { data: rows, error: e3 } = await supabase.from('profiles').select('*').in('id', ids)
        if (e3) throw e3
        setFollowList((rows || []) as Profile[])
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not load list.'
      setError(
        `Follow list failed: ${msg}. Run sql/fix-follows-rls.sql in Supabase if this keeps happening.`,
      )
    } finally {
      setBusy(false)
    }
  }

  function closeFollowProfile() {
    // created: 2026-11-23T20:28:00-08:00
    setViewProfile(null)
    setFollowListKind(null)
    setFollowList([])
  }

  async function toggleFollow(targetId: string) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:28:00-08:00 — update counts + refresh open list
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('toggle_follow', {
        p_other_user_id: targetId,
      })
      if (err) throw err
      const result = String(data || '')
      const followed = result !== 'unfollowed'
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (followed) next.add(targetId)
        else next.delete(targetId)
        return next
      })
      setFollowerCountById((prev) => ({
        ...prev,
        [targetId]: Math.max(0, (prev[targetId] || 0) + (followed ? 1 : -1)),
      }))
      setFollowingCountById((prev) => ({
        ...prev,
        [userId]: Math.max(0, (prev[userId] || 0) + (followed ? 1 : -1)),
      }))
      if (viewProfile && followListKind) {
        await openFollowList(viewProfile, followListKind)
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Follow failed.'
      setError(`Follow failed: ${msg}`)
    }
  }

  async function startDm(other: Profile) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T12:35:00-08:00 — use start_dm RPC (avoids chat RLS failures)
    setBusy(true)
    setError('')
    try {
      const { data: chat, error: chatErr } = await supabase.rpc('start_dm', {
        p_other_user_id: other.id,
      })
      if (chatErr) throw chatErr
      if (!chat) throw new Error('Could not start chat.')
      setActiveChat(chat as ChatRow)
      setTab('chats')
      await loadChats()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not start chat.'
      setError(`Chat failed: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  async function createGroup(e: FormEvent) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T12:42:00-08:00 — use create_group_chat RPC
    e.preventDefault()
    const title = groupTitle.trim()
    if (!title) return
    setBusy(true)
    setError('')
    try {
      const { data: chat, error: chatErr } = await supabase.rpc('create_group_chat', {
        p_title: title,
      })
      if (chatErr) throw chatErr
      if (!chat) throw new Error('Could not create group.')
      setGroupTitle('')
      setActiveChat(chat as ChatRow)
      await loadChats()
      setStatus('Group created.')
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not create group.'
      setError(`Group failed: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage(e: FormEvent) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T12:42:00-08:00 — use send_chat_message RPC
    e.preventDefault()
    if (!activeChat || !draft.trim()) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await supabase.rpc('send_chat_message', {
        p_chat_id: activeChat.id,
        p_body: draft.trim(),
      })
      if (err) throw err
      setDraft('')
      await loadMessages(activeChat.id)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not send.'
      setError(`Send failed: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  async function toggleLike(messageId: string) {
    // created: 2026-11-23T12:14:00-08:00
    try {
      if (myLiked.has(messageId)) {
        await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId)
      } else {
        await supabase.from('message_likes').insert({
          message_id: messageId,
          user_id: userId,
        })
      }
      if (activeChat) await loadMessages(activeChat.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Like failed.')
    }
  }

  const chatLabel = useMemo(() => {
    // created: 2026-11-23T12:14:00-08:00
    if (!activeChat) return ''
    if (activeChat.is_group) return activeChat.title || 'Group'
    return 'Direct message'
  }, [activeChat])

  return (
    <div>
      <div className="header-bar">
        <div>
          <img className="logo-sm" src={logoSrc} alt="" />
          <h1 className="brand">Rafflesia Online</h1>
          <p className="tag" style={{ marginBottom: 0 }}>
            Hi {niceName(me)}
          </p>
        </div>
        <button className="ghost" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>

      <div className="nav">
        <button
          type="button"
          className={tab === 'chats' && !viewProfile ? 'active' : ''}
          onClick={() => {
            closeFollowProfile()
            setTab('chats')
          }}
        >
          Chats
        </button>
        <button
          type="button"
          className={tab === 'people' && !viewProfile ? 'active' : ''}
          onClick={() => {
            closeFollowProfile()
            setTab('people')
          }}
        >
          People
        </button>
        <button
          type="button"
          className={tab === 'me' && !viewProfile ? 'active' : ''}
          onClick={() => {
            closeFollowProfile()
            setTab('me')
          }}
        >
          Me
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      {viewProfile && (
        <div className="follow-panel">
          {/* created: 2026-11-23T20:28:00-08:00 — anyone can open followers / following */}
          <div className="toolbar" style={{ marginBottom: 10 }}>
            <button className="ghost" type="button" onClick={closeFollowProfile}>
              ← Back
            </button>
            <strong>{niceName(viewProfile)}</strong>
          </div>
          <p className="muted">@{viewProfile.username}</p>
          <div className="follow-counts">
            <button
              type="button"
              className={followListKind === 'followers' ? 'count-btn active' : 'count-btn'}
              onClick={() => openFollowList(viewProfile, 'followers')}
            >
              {followerCountById[viewProfile.id] || 0} followers
            </button>
            <button
              type="button"
              className={followListKind === 'following' ? 'count-btn active' : 'count-btn'}
              onClick={() => openFollowList(viewProfile, 'following')}
            >
              {followingCountById[viewProfile.id] || 0} following
            </button>
          </div>
          {viewProfile.id !== userId ? (
            <div className="row-actions" style={{ marginBottom: 12 }}>
              <button className="ghost" type="button" onClick={() => toggleFollow(viewProfile.id)}>
                {followingIds.has(viewProfile.id) ? 'Unfollow' : 'Follow'}
              </button>
              <button className="primary" type="button" disabled={busy} onClick={() => startDm(viewProfile)}>
                Message
              </button>
            </div>
          ) : null}
          <h2 className="panel-title">
            {followListKind === 'followers' ? 'Followers' : followListKind === 'following' ? 'Following' : 'Lists'}
          </h2>
          <div className="list">
            {!followListKind ? (
              <p className="muted">Tap followers or following above.</p>
            ) : followList.length === 0 ? (
              <p className="muted">
                {followListKind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </p>
            ) : (
              followList.map((p) => (
                <div className="row" key={p.id}>
                  <button
                    type="button"
                    className="row-main linkish"
                    onClick={() => openFollowList(p, 'followers')}
                  >
                    <p className="row-title">{niceName(p)}</p>
                    <p className="row-sub">@{p.username}</p>
                  </button>
                  {p.id !== userId ? (
                    <div className="row-actions">
                      <button className="ghost" type="button" onClick={() => toggleFollow(p.id)}>
                        {followingIds.has(p.id) ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && tab === 'me' && (
        <form className="form" onSubmit={saveProfile}>
          <h2 className="panel-title">My profile</h2>
          <p className="muted">@{me?.username}</p>
          <div className="follow-counts">
            <button
              type="button"
              className="count-btn"
              onClick={() => me && openFollowList(me, 'followers')}
            >
              {followerCountById[userId] || 0} followers
            </button>
            <button
              type="button"
              className="count-btn"
              onClick={() => me && openFollowList(me, 'following')}
            >
              {followingCountById[userId] || 0} following
            </button>
          </div>

          {me?.banner_url ? (
            <img className="banner-preview" src={me.banner_url} alt="Banner" />
          ) : (
            <div className="banner-preview placeholder">No banner yet</div>
          )}
          {me?.avatar_url ? (
            <img className="avatar-preview" src={me.avatar_url} alt="Profile" />
          ) : (
            <div className="avatar-preview placeholder">No picture</div>
          )}

          <label>
            Profile picture
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage('avatar', file)
                e.target.value = ''
              }}
            />
          </label>
          <label>
            Banner
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage('banner', file)
                e.target.value = ''
              }}
            />
          </label>

          <label>
            Display name
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </label>
          <label>
            Bio
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
          </label>
          <button className="primary" type="submit" disabled={busy}>
            Save profile
          </button>
        </form>
      )}

      {!viewProfile && tab === 'people' && (
        <div>
          <h2 className="panel-title">People</h2>
          <p className="muted">Follow friends or start a chat. Tap a name to see their lists.</p>
          <div className="list">
            {people.length === 0 ? (
              <p className="muted">No other users yet. Make a second account to test.</p>
            ) : (
              people.map((p) => (
                <div className="row" key={p.id}>
                  <button type="button" className="row-main linkish" onClick={() => openFollowList(p, 'followers')}>
                    <p className="row-title">{niceName(p)}</p>
                    <p className="row-sub">
                      @{p.username} · {followerCountById[p.id] || 0} followers · {followingCountById[p.id] || 0}{' '}
                      following
                    </p>
                  </button>
                  {/* updated: 2026-11-23T19:55:00-08:00 — fixed action column so long names wrap */}
                  <div className="row-actions">
                    <button className="ghost" type="button" onClick={() => toggleFollow(p.id)}>
                      {followingIds.has(p.id) ? 'Unfollow' : 'Follow'}
                    </button>
                    <button className="primary" type="button" disabled={busy} onClick={() => startDm(p)}>
                      Message
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && tab === 'chats' && !activeChat && (
        <div>
          <h2 className="panel-title">Chats</h2>
          <form className="form" onSubmit={createGroup} style={{ marginBottom: 12 }}>
            <label>
              New group name
              <input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="My group"
              />
            </label>
            <button className="primary" type="submit" disabled={busy || !groupTitle.trim()}>
              Create group
            </button>
          </form>
          <div className="list">
            {chats.length === 0 ? (
              <p className="muted">No chats yet. Go to People and tap Message.</p>
            ) : (
              chats.map((c) => (
                <button
                  key={c.id}
                  className="row"
                  type="button"
                  style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => setActiveChat(c)}
                >
                  <div className="row-main">
                    <p className="row-title">{c.is_group ? c.title || 'Group' : 'Direct message'}</p>
                    <p className="row-sub">{c.is_group ? 'Group chat' : 'Private chat'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && tab === 'chats' && activeChat && (
        <div>
          <div className="toolbar">
            <button className="ghost" type="button" onClick={() => setActiveChat(null)}>
              ← Back
            </button>
            <strong style={{ color: '#f2f8ff' }}>{chatLabel}</strong>
          </div>
          <div className="messages">
            {messages.map((m) => {
              const sender = profilesById[m.sender_id]
              const mine = m.sender_id === userId
              return (
                <div className={`bubble ${mine ? 'mine' : ''}`} key={m.id}>
                  <div className="bubble-meta">
                    {niceName(sender)} ·{' '}
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                  <div>{m.body}</div>
                  <button
                    type="button"
                    className={`like-btn ${myLiked.has(m.id) ? 'on' : ''}`}
                    onClick={() => toggleLike(m.id)}
                  >
                    ♥ {likes[m.id] || 0}
                  </button>
                </div>
              )
            })}
          </div>
          <form className="composer" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message"
            />
            <button className="primary" type="submit" disabled={busy || !draft.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
