// created: 2026-11-23T12:14:00-08:00
// updated: 2026-11-23T20:45:00-08:00 — group create member picker + add friends (WF-G1/G3)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import { EmojiBar, insertEmojiAtCursor } from './lib/emojiBar'
import { fetchFollowCounts, fetchMyFollowingIds, toggleFollowRpc } from './lib/follows'

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
  // created: 2026-11-23T20:33:00-08:00 — groups both you and they are in
  const [sharedGroups, setSharedGroups] = useState<ChatRow[]>([])
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
  // created: 2026-11-23T20:30:00-08:00
  // updated: 2026-11-23T20:34:00-08:00 — refs for all emoji fields
  const draftInputRef = useRef<HTMLInputElement | null>(null)
  const groupTitleRef = useRef<HTMLInputElement | null>(null)
  const editNameRef = useRef<HTMLInputElement | null>(null)
  const editBioRef = useRef<HTMLTextAreaElement | null>(null)
  const [showEmojiBar, setShowEmojiBar] = useState(true)
  const [showGroupEmoji, setShowGroupEmoji] = useState(true)
  const [showNameEmoji, setShowNameEmoji] = useState(true)
  const [showBioEmoji, setShowBioEmoji] = useState(true)
  // created: 2026-11-23T20:40:00-08:00 — prevent stuck / double-tap Follow
  const [followBusyId, setFollowBusyId] = useState<string | null>(null)
  // created: 2026-11-23T20:45:00-08:00 — group member pickers (create + add)
  const [createPickIds, setCreatePickIds] = useState<Set<string>>(new Set())
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [addPickIds, setAddPickIds] = useState<Set<string>>(new Set())
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(new Set())

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
    // created: 2026-11-23T20:28:00-08:00
    // updated: 2026-11-23T20:40:00-08:00 — do not treat empty RLS [] as zero follows
    const ids = allProfiles.map((p) => p.id)
    const counts = await fetchFollowCounts(supabase, ids)
    setFollowerCountById(counts.followers)
    setFollowingCountById(counts.following)
  }, [])

  const loadPeople = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:40:00-08:00 — reliable followingIds + counts
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

    const [myFollowing] = await Promise.all([
      fetchMyFollowingIds(supabase, userId),
      loadFollowGraph(graphProfiles),
    ])
    setFollowingIds(myFollowing)
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
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:30:00-08:00 — realtime + 2s poll so chats update without refresh
    if (!activeChat) return
    const chatId = activeChat.id
    let cancelled = false

    const refresh = () => {
      if (cancelled) return
      loadMessages(chatId).catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load messages.')
      })
    }

    refresh()
    if (activeChat.is_group) {
      loadGroupMembers(chatId).catch(() => setGroupMemberIds(new Set([userId])))
    } else {
      setGroupMemberIds(new Set())
      setShowAddFriends(false)
      setAddPickIds(new Set())
    }

    const channel = supabase
      .channel(`messages-${chatId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_likes',
        },
        () => refresh(),
      )
      .subscribe()

    const pollMs = window.setInterval(refresh, 2000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(pollMs)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
    // loadGroupMembers / userId used inside; intentional deps on active chat only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, loadMessages, userId])

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

  async function loadSharedGroups(otherUserId: string) {
    // created: 2026-11-23T20:33:00-08:00 — invite-safe: only groups you both belong to
    if (otherUserId === userId) {
      const mine = chats.filter((c) => c.is_group)
      setSharedGroups(mine)
      return
    }
    const rpc = await supabase.rpc('list_shared_group_chats', { p_other_user_id: otherUserId })
    if (!rpc.error && Array.isArray(rpc.data)) {
      setSharedGroups(rpc.data as ChatRow[])
      return
    }
    const myGroupIds = chats.filter((c) => c.is_group).map((c) => c.id)
    if (!myGroupIds.length) {
      setSharedGroups([])
      return
    }
    const { data: edges, error } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', otherUserId)
      .in('chat_id', myGroupIds)
    if (error) {
      setSharedGroups([])
      return
    }
    const ids = new Set((edges || []).map((e) => String(e.chat_id)))
    setSharedGroups(chats.filter((c) => c.is_group && ids.has(c.id)))
  }

  async function openProfile(profile: Profile, kind: FollowListKind | null = null) {
    // created: 2026-11-23T20:33:00-08:00 — full account card + optional follow list
    setError('')
    setBusy(true)
    setFollowList([])
    setFollowListKind(kind)
    try {
      const { data: fresh, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle()
      if (pErr) throw pErr
      const full = (fresh as Profile | null) || profile
      setViewProfile(full)
      await loadSharedGroups(full.id)
      if (kind) await loadFollowListFor(full.id, kind)
    } catch (err) {
      setViewProfile(profile)
      await loadSharedGroups(profile.id)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not open profile.'
      setError(`Profile: ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  async function loadFollowListFor(profileId: string, kind: FollowListKind) {
    // created: 2026-11-23T20:28:00-08:00
    // updated: 2026-11-23T20:33:00-08:00 — split from openProfile
    const rpcName = kind === 'followers' ? 'list_user_followers' : 'list_user_following'
    const { data, error: err } = await supabase.rpc(rpcName, { p_user_id: profileId })
    if (!err && Array.isArray(data)) {
      setFollowList(data as Profile[])
      return
    }
    if (kind === 'followers') {
      const { data: edges, error: e2 } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profileId)
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
        .eq('follower_id', profileId)
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
  }

  async function openFollowList(profile: Profile, kind: FollowListKind) {
    // created: 2026-11-23T20:28:00-08:00
    // updated: 2026-11-23T20:33:00-08:00 — route through full profile
    await openProfile(profile, kind)
  }

  function closeFollowProfile() {
    // created: 2026-11-23T20:28:00-08:00
    // updated: 2026-11-23T20:33:00-08:00
    setViewProfile(null)
    setFollowListKind(null)
    setFollowList([])
    setSharedGroups([])
  }

  async function openSharedGroup(chat: ChatRow) {
    // created: 2026-11-23T20:33:00-08:00
    closeFollowProfile()
    setTab('chats')
    setActiveChat(chat)
  }

  async function toggleFollow(targetId: string) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:40:00-08:00 — busy lock + refresh counts from server
    if (followBusyId) return
    setError('')
    setFollowBusyId(targetId)
    const wasFollowing = followingIds.has(targetId)
    // Optimistic UI so the button never feels stuck
    setFollowingIds((prev) => {
      const next = new Set(prev)
      if (wasFollowing) next.delete(targetId)
      else next.add(targetId)
      return next
    })
    setFollowerCountById((prev) => ({
      ...prev,
      [targetId]: Math.max(0, (prev[targetId] || 0) + (wasFollowing ? -1 : 1)),
    }))
    setFollowingCountById((prev) => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + (wasFollowing ? -1 : 1)),
    }))
    try {
      const result = await toggleFollowRpc(supabase, targetId)
      const followed = result === 'followed'
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (followed) next.add(targetId)
        else next.delete(targetId)
        return next
      })
      // Reconcile counts for everyone (cross-user)
      const meRow = me
      const graph = meRow ? [meRow, ...people] : people
      if (viewProfile && !graph.some((p) => p.id === viewProfile.id)) {
        graph.push(viewProfile)
      }
      await loadFollowGraph(graph.length ? graph : [{ id: userId } as Profile, { id: targetId } as Profile])
      if (viewProfile && followListKind) {
        await loadFollowListFor(viewProfile.id, followListKind)
      }
    } catch (err) {
      // Roll back optimistic flip
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (wasFollowing) next.add(targetId)
        else next.delete(targetId)
        return next
      })
      setFollowerCountById((prev) => ({
        ...prev,
        [targetId]: Math.max(0, (prev[targetId] || 0) + (wasFollowing ? 1 : -1)),
      }))
      setFollowingCountById((prev) => ({
        ...prev,
        [userId]: Math.max(0, (prev[userId] || 0) + (wasFollowing ? 1 : -1)),
      }))
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Follow failed.'
      setError(
        `Follow failed: ${msg}. If counts stay at 0, run sql/fix-follows-rls.sql in Supabase.`,
      )
    } finally {
      setFollowBusyId(null)
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

  function toggleCreatePick(id: string) {
    // created: 2026-11-23T20:45:00-08:00
    setCreatePickIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAddPick(id: string) {
    // created: 2026-11-23T20:45:00-08:00
    setAddPickIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function loadGroupMembers(chatId: string) {
    // created: 2026-11-23T20:45:00-08:00
    const rpc = await supabase.rpc('list_group_member_ids', { p_chat_id: chatId })
    if (!rpc.error && Array.isArray(rpc.data)) {
      setGroupMemberIds(new Set((rpc.data as string[]).map(String)))
      return
    }
    const { data, error } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chatId)
    if (error) {
      setGroupMemberIds(new Set([userId]))
      return
    }
    setGroupMemberIds(new Set((data || []).map((r) => String(r.user_id))))
  }

  async function createGroup(e: FormEvent) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:45:00-08:00 — pass selected friend ids (WF-G1)
    e.preventDefault()
    const title = groupTitle.trim()
    if (!title) return
    setBusy(true)
    setError('')
    try {
      const memberIds = [...createPickIds]
      const { data: chat, error: chatErr } = await supabase.rpc('create_group_chat', {
        p_title: title,
        p_member_ids: memberIds,
      })
      if (chatErr) throw chatErr
      if (!chat) throw new Error('Could not create group.')
      setGroupTitle('')
      setCreatePickIds(new Set())
      setShowAddFriends(false)
      setActiveChat(chat as ChatRow)
      await loadChats()
      await loadGroupMembers((chat as ChatRow).id)
      setStatus(
        memberIds.length
          ? `Group created with ${memberIds.length} friend${memberIds.length === 1 ? '' : 's'}.`
          : 'Group created. Add friends from inside the chat.',
      )
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not create group.'
      setError(
        `Group failed: ${msg}. If this mentions create_group_chat, run sql/fix-group-members.sql in Supabase.`,
      )
    } finally {
      setBusy(false)
    }
  }

  async function submitAddFriends() {
    // created: 2026-11-23T20:45:00-08:00 — WF-G3
    if (!activeChat?.is_group || addPickIds.size === 0) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await supabase.rpc('add_group_members', {
        p_chat_id: activeChat.id,
        p_member_ids: [...addPickIds],
      })
      if (err) throw err
      setAddPickIds(new Set())
      setShowAddFriends(false)
      await loadGroupMembers(activeChat.id)
      setStatus('Friends added to the group.')
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not add friends.'
      setError(
        `Add friends failed: ${msg}. Run sql/fix-group-members.sql in Supabase if needed.`,
      )
    } finally {
      setBusy(false)
    }
  }

  function insertEmoji(emoji: string) {
    // created: 2026-11-23T20:30:00-08:00
    // updated: 2026-11-23T20:34:00-08:00 — shared helper
    insertEmojiAtCursor(draftInputRef.current, draft, setDraft, emoji)
  }

  async function sendMessage(e: FormEvent) {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T20:30:00-08:00 — show sent message immediately
    e.preventDefault()
    if (!activeChat || !draft.trim()) return
    setBusy(true)
    setError('')
    const body = draft.trim()
    try {
      const { data, error: err } = await supabase.rpc('send_chat_message', {
        p_chat_id: activeChat.id,
        p_body: body,
      })
      if (err) throw err
      setDraft('')
      if (data && typeof data === 'object' && 'id' in data) {
        const row = data as MessageRow
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        setProfilesById((prev) => ({
          ...prev,
          [userId]: prev[userId] || me || { id: userId, username: 'me', display_name: 'You', bio: '', avatar_url: null, banner_url: null },
        }))
      }
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
          {/* created: 2026-11-23T20:28:00-08:00 */}
          {/* updated: 2026-11-23T20:33:00-08:00 — full account: bio, pics, shared groups */}
          <div className="toolbar" style={{ marginBottom: 10 }}>
            <button className="ghost" type="button" onClick={closeFollowProfile}>
              ← Back
            </button>
            <strong>{viewProfile.id === userId ? 'My profile' : 'Profile'}</strong>
          </div>

          {viewProfile.banner_url ? (
            <img className="banner-preview" src={viewProfile.banner_url} alt="Banner" />
          ) : (
            <div className="banner-preview placeholder">No banner yet</div>
          )}
          {viewProfile.avatar_url ? (
            <img className="avatar-preview" src={viewProfile.avatar_url} alt="Profile" />
          ) : (
            <div className="avatar-preview placeholder">No picture</div>
          )}

          <h2 className="panel-title" style={{ marginTop: 8 }}>
            {niceName(viewProfile)}
          </h2>
          <p className="muted">@{viewProfile.username}</p>
          <p className="profile-bio">
            {(viewProfile.bio || '').trim() ? viewProfile.bio : 'No bio yet.'}
          </p>

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
              <button
                className="ghost"
                type="button"
                disabled={followBusyId === viewProfile.id}
                onClick={() => toggleFollow(viewProfile.id)}
              >
                {followBusyId === viewProfile.id
                  ? '…'
                  : followingIds.has(viewProfile.id)
                    ? 'Unfollow'
                    : 'Follow'}
              </button>
              <button className="primary" type="button" disabled={busy} onClick={() => startDm(viewProfile)}>
                Message
              </button>
            </div>
          ) : null}

          <h2 className="panel-title">Group chats together</h2>
          <div className="list" style={{ marginBottom: 14 }}>
            {sharedGroups.length === 0 ? (
              <p className="muted">
                {viewProfile.id === userId
                  ? 'Your groups show under Chats. Create one and add friends.'
                  : 'No shared groups yet. Create a group in Chats and add them.'}
              </p>
            ) : (
              sharedGroups.map((g) => (
                <button
                  key={g.id}
                  className="row"
                  type="button"
                  style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => openSharedGroup(g)}
                >
                  <div className="row-main">
                    <p className="row-title">{g.title || 'Group'}</p>
                    <p className="row-sub">Group chat · tap to open</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {followListKind ? (
            <>
              <h2 className="panel-title">
                {followListKind === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <div className="list">
                {followList.length === 0 ? (
                  <p className="muted">
                    {followListKind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                  </p>
                ) : (
                  followList.map((p) => (
                    <div className="row" key={p.id}>
                      <button
                        type="button"
                        className="row-main linkish"
                        onClick={() => openProfile(p)}
                      >
                        <p className="row-title">{niceName(p)}</p>
                        <p className="row-sub">@{p.username}</p>
                      </button>
                      {p.id !== userId ? (
                        <div className="row-actions">
                          <button
                            className="ghost"
                            type="button"
                            disabled={followBusyId === p.id}
                            onClick={() => toggleFollow(p.id)}
                          >
                            {followBusyId === p.id
                              ? '…'
                              : followingIds.has(p.id)
                                ? 'Unfollow'
                                : 'Follow'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="muted">Tap followers or following to see those lists.</p>
          )}
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
            <input
              ref={editNameRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>
          {/* created: 2026-11-23T20:34:00-08:00 */}
          <EmojiBar
            label="Emoji"
            open={showNameEmoji}
            onToggle={() => setShowNameEmoji((v) => !v)}
            onPick={(emoji) =>
              insertEmojiAtCursor(editNameRef.current, editName, setEditName, emoji)
            }
          />
          <label>
            Bio
            <textarea
              ref={editBioRef}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />
          </label>
          <EmojiBar
            label="Emoji"
            open={showBioEmoji}
            onToggle={() => setShowBioEmoji((v) => !v)}
            onPick={(emoji) => insertEmojiAtCursor(editBioRef.current, editBio, setEditBio, emoji)}
          />
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
                  <button type="button" className="row-main linkish" onClick={() => openProfile(p)}>
                    <p className="row-title">{niceName(p)}</p>
                    <p className="row-sub">
                      @{p.username} · {followerCountById[p.id] || 0} followers · {followingCountById[p.id] || 0}{' '}
                      following
                    </p>
                  </button>
                  {/* updated: 2026-11-23T19:55:00-08:00 — fixed action column so long names wrap */}
                  <div className="row-actions">
                    <button
                      className="ghost"
                      type="button"
                      disabled={followBusyId === p.id}
                      onClick={() => toggleFollow(p.id)}
                    >
                      {followBusyId === p.id
                        ? '…'
                        : followingIds.has(p.id)
                          ? 'Unfollow'
                          : 'Follow'}
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
                ref={groupTitleRef}
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="My group 🎉"
              />
            </label>
            {/* created: 2026-11-23T20:34:00-08:00 — emoji for group titles */}
            <EmojiBar
              label="Emoji"
              open={showGroupEmoji}
              onToggle={() => setShowGroupEmoji((v) => !v)}
              onPick={(emoji) =>
                insertEmojiAtCursor(groupTitleRef.current, groupTitle, setGroupTitle, emoji)
              }
            />
            {/* created: 2026-11-23T20:45:00-08:00 — WF-G1 member picker */}
            <h3 className="panel-title" style={{ marginTop: 8, fontSize: '0.95rem' }}>
              Add friends now
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Invite-only — they will see this group in Chats. You can add more later.
            </p>
            <div className="member-pick-list">
              {people.length === 0 ? (
                <p className="muted">No other people yet. Create the group alone, then add friends later.</p>
              ) : (
                people.map((p) => (
                  <label className="member-check" key={p.id}>
                    <input
                      type="checkbox"
                      checked={createPickIds.has(p.id)}
                      onChange={() => toggleCreatePick(p.id)}
                    />
                    <span>
                      <strong>{niceName(p)}</strong>
                      <span className="muted"> @{p.username}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <button className="primary" type="submit" disabled={busy || !groupTitle.trim()}>
              Create group
              {createPickIds.size ? ` (${createPickIds.size})` : ''}
            </button>
          </form>
          <div className="list">
            {chats.length === 0 ? (
              <p className="muted">
                No chats yet. Message someone in People for a DM, or create a group and add friends.
              </p>
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
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setActiveChat(null)
                setShowAddFriends(false)
                setAddPickIds(new Set())
              }}
            >
              ← Back
            </button>
            <strong className="chat-title">{chatLabel}</strong>
            {activeChat.is_group ? (
              <button
                className="ghost"
                type="button"
                onClick={() => {
                  setShowAddFriends((v) => !v)
                  setAddPickIds(new Set())
                }}
              >
                {showAddFriends ? 'Hide add' : '+ Friends'}
              </button>
            ) : null}
          </div>
          {activeChat.is_group ? (
            <p className="muted" style={{ textAlign: 'left' }}>
              {groupMemberIds.size || 1} member{(groupMemberIds.size || 1) === 1 ? '' : 's'}
            </p>
          ) : null}
          {/* created: 2026-11-23T20:45:00-08:00 — WF-G3 Add friends */}
          {activeChat.is_group && showAddFriends ? (
            <div className="add-friends-panel">
              <h3 className="panel-title" style={{ fontSize: '0.95rem' }}>
                Add friends to group
              </h3>
              <div className="member-pick-list">
                {people.filter((p) => !groupMemberIds.has(p.id)).length === 0 ? (
                  <p className="muted">Everyone you know is already in this group.</p>
                ) : (
                  people
                    .filter((p) => !groupMemberIds.has(p.id))
                    .map((p) => (
                      <label className="member-check" key={p.id}>
                        <input
                          type="checkbox"
                          checked={addPickIds.has(p.id)}
                          onChange={() => toggleAddPick(p.id)}
                        />
                        <span>
                          <strong>{niceName(p)}</strong>
                          <span className="muted"> @{p.username}</span>
                        </span>
                      </label>
                    ))
                )}
              </div>
              <button
                className="primary"
                type="button"
                disabled={busy || addPickIds.size === 0}
                onClick={submitAddFriends}
              >
                Add{addPickIds.size ? ` (${addPickIds.size})` : ''}
              </button>
            </div>
          ) : null}
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
          {/* created: 2026-11-23T20:30:00-08:00 — emoji bar */}
          <EmojiBar
            label="Emoji"
            open={showEmojiBar}
            onToggle={() => setShowEmojiBar((v) => !v)}
            onPick={insertEmoji}
          />
          <form className="composer" onSubmit={sendMessage}>
            <input
              ref={draftInputRef}
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
