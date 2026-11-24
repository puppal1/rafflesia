// created: 2026-11-23T12:14:00-08:00
// updated: 2026-11-23T21:10:00-08:00 — phase5: text check, icons, home/post/play nav
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import { EmojiBar, insertEmojiAtCursor } from './lib/emojiBar'
import { fetchFollowCounts, fetchMyFollowingIds, toggleFollowRpc } from './lib/follows'
import { checkKidText, reportBlockedText } from './lib/textChecker'
import { iconEmoji, type IconDef } from './lib/iconPacks'
import { IconPicker } from './components/IconPicker'
import { TextBlocked } from './components/TextBlocked'

const logoSrc = `${import.meta.env.BASE_URL}logo.jpg`
import type { ChatRow, FollowListKind, MessageRow, PostRow, Profile, Tab } from './types'

type Props = {
  userId: string
  onLogout: () => void
}

export function HomeApp({ userId, onLogout }: Props) {
  // created: 2026-11-23T12:14:00-08:00
  // updated: 2026-11-23T21:10:00-08:00 — default Home tab
  const [tab, setTab] = useState<Tab>('home')
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
  // created: 2026-11-23T21:10:00-08:00 — phase5 UI state
  const [textBlockMsg, setTextBlockMsg] = useState<string | null>(null)
  const [posts, setPosts] = useState<PostRow[]>([])
  const [postKind, setPostKind] = useState<'text' | 'link' | 'picture' | 'video'>('text')
  const [postBody, setPostBody] = useState('')
  const [postMedia, setPostMedia] = useState('')
  // created: 2026-11-23T21:50:00-08:00 — upload vs paste link for pic/video
  const [postSource, setPostSource] = useState<'upload' | 'link'>('upload')
  const [postFileName, setPostFileName] = useState('')
  const [pickIconMode, setPickIconMode] = useState(false)

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

  const loadPosts = useCallback(async () => {
    // created: 2026-11-23T21:10:00-08:00
    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40)
    if (err) {
      setPosts([])
      return
    }
    setPosts((data || []) as PostRow[])
  }, [])

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
    try {
      await loadPosts()
    } catch {
      /* posts table may not exist until phase5 SQL */
    }
    if (problems.length) setError(problems.join(' | '))
  }, [loadMe, loadPeople, loadChats, loadPosts])

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
    // updated: 2026-11-23T21:10:00-08:00 — text checker on bio
    e.preventDefault()
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const check = await checkKidText(editBio)
      if (!check.ok) {
        await reportBlockedText('bio', editBio, check.matched)
        setTextBlockMsg(check.message)
        return
      }
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

  async function saveIcon(icon: IconDef) {
    // created: 2026-11-23T21:10:00-08:00
    setBusy(true)
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('set_my_icon', {
        p_pack: icon.pack,
        p_icon: icon.id,
      })
      if (err) throw err
      if (data) setMe(data as Profile)
      else await loadMe()
      setPickIconMode(false)
      setStatus('Icon saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save icon. Run sql/phase5-first-cut.sql in Supabase.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function uploadPostFile(file: File, kind: 'picture' | 'video') {
    // created: 2026-11-23T21:50:00-08:00
    if (kind === 'picture') {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image (jpg/png/webp/gif).')
      }
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('Picture must be under 4 MB.')
      }
    } else {
      if (!file.type.startsWith('video/')) {
        throw new Error('Please choose a video file (mp4/webm).')
      }
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('Video must be under 25 MB (free storage cap).')
      }
    }
    const ext = (file.name.split('.').pop() || (kind === 'picture' ? 'jpg' : 'mp4')).toLowerCase()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(path, file, {
      upsert: false,
      contentType: file.type,
    })
    if (upErr) {
      throw new Error(
        `${upErr.message}. If storage is missing, run sql/storage-posts.sql in Supabase.`,
      )
    }
    const { data } = supabase.storage.from('posts').getPublicUrl(path)
    return data.publicUrl
  }

  async function submitPost(e: FormEvent) {
    // created: 2026-11-23T21:10:00-08:00
    // updated: 2026-11-23T21:50:00-08:00 — icon modes + upload/link for pic & video
    e.preventDefault()
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const check = await checkKidText(postBody)
      if (!check.ok) {
        await reportBlockedText('post', postBody, check.matched)
        setTextBlockMsg(check.message)
        return
      }
      let mediaUrl = postMedia.trim() || null
      if (postKind === 'text') {
        if (!postBody.trim()) throw new Error('Write something to share.')
        mediaUrl = null
      } else if (postKind === 'link') {
        if (!mediaUrl) throw new Error('Paste a link.')
      } else if ((postKind === 'picture' || postKind === 'video') && postSource === 'link') {
        if (!mediaUrl) throw new Error(`Paste a ${postKind} URL.`)
      } else if ((postKind === 'picture' || postKind === 'video') && postSource === 'upload') {
        if (!mediaUrl) throw new Error(`Choose a ${postKind} file to upload first.`)
      }

      const { error: err } = await supabase.rpc('create_post', {
        p_kind: postKind,
        p_body: postBody.trim() || null,
        p_media_url: mediaUrl,
      })
      if (err) throw err
      setPostBody('')
      setPostMedia('')
      setPostFileName('')
      setPostSource('upload')
      setStatus('Posted!')
      setTab('home')
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post.')
    } finally {
      setBusy(false)
    }
  }

  async function onPickPostFile(file: File | undefined) {
    // created: 2026-11-23T21:50:00-08:00
    if (!file || (postKind !== 'picture' && postKind !== 'video')) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const url = await uploadPostFile(file, postKind)
      setPostMedia(url)
      setPostFileName(file.name)
      setStatus(`${postKind === 'picture' ? 'Picture' : 'Video'} ready to share.`)
    } catch (err) {
      setPostMedia('')
      setPostFileName('')
      setError(err instanceof Error ? err.message : 'Upload failed.')
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
    // updated: 2026-11-23T21:40:00-08:00 — text check on group title
    e.preventDefault()
    const title = groupTitle.trim()
    if (!title) return
    setBusy(true)
    setError('')
    try {
      const check = await checkKidText(title)
      if (!check.ok) {
        await reportBlockedText('group_title', title, check.matched)
        setTextBlockMsg(check.message)
        return
      }
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
    // updated: 2026-11-23T21:10:00-08:00 — calm text block before send
    e.preventDefault()
    if (!activeChat || !draft.trim()) return
    setBusy(true)
    setError('')
    const body = draft.trim()
    try {
      const check = await checkKidText(body)
      if (!check.ok) {
        await reportBlockedText('message', body, check.matched)
        setTextBlockMsg(check.message)
        return
      }
      const restr = await supabase.rpc('my_restrictions')
      if (!restr.error && restr.data && (restr.data as { block_message?: boolean }).block_message) {
        setError('Messaging is restricted by a teacher right now.')
        return
      }
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
          [userId]:
            prev[userId] ||
            me || {
              id: userId,
              username: 'me',
              display_name: 'You',
              bio: '',
              avatar_url: null,
              banner_url: null,
            },
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

  const needsIcon = Boolean(me && !me.icon_id)
  const showIconPicker = needsIcon || pickIconMode

  const matchFriends = useMemo(() => {
    // created: 2026-11-23T21:10:00-08:00
    if (!me?.icon_pack) return []
    return people.filter((p) => p.icon_pack && p.icon_pack === me.icon_pack)
  }, [me, people])

  const authorName = (authorId: string) => {
    // created: 2026-11-23T21:10:00-08:00
    if (authorId === userId) return niceName(me)
    const p = people.find((x) => x.id === authorId) || profilesById[authorId]
    return niceName(p)
  }

  if (showIconPicker && me) {
    return (
      <div>
        <div className="header-bar">
          <div>
            <img className="logo-sm" src={logoSrc} alt="" />
            <h1 className="brand">Pick your icon</h1>
          </div>
          {pickIconMode && me.icon_id ? (
            <button className="ghost" type="button" onClick={() => setPickIconMode(false)}>
              Cancel
            </button>
          ) : (
            <button className="ghost" type="button" onClick={onLogout}>
              Log out
            </button>
          )}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <IconPicker onPick={saveIcon} busy={busy} />
      </div>
    )
  }

  return (
    <div>
      <div className="header-bar">
        <div>
          <img className="logo-sm" src={logoSrc} alt="" />
          <h1 className="brand">Rafflesia Online</h1>
          <p className="tag" style={{ marginBottom: 0 }}>
            {iconEmoji(me?.icon_pack, me?.icon_id)} Hi {niceName(me)}
          </p>
        </div>
        <button className="ghost" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>

      {/* created: 2026-11-23T21:10:00-08:00 — A6 nav shell */}
      <div className="nav nav-shell">
        {(
          [
            ['home', 'Home'],
            ['post', 'Post'],
            ['chats', 'Messages'],
            ['play', 'Play'],
            ['people', 'People'],
            ['me', 'Me'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id && !viewProfile ? 'active' : ''}
            onClick={() => {
              closeFollowProfile()
              setActiveChat(null)
              setTab(id)
              if (id === 'home') loadPosts()
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      {textBlockMsg ? (
        <TextBlocked
          message={textBlockMsg}
          onEdit={() => setTextBlockMsg(null)}
          onOk={() => setTextBlockMsg(null)}
        />
      ) : null}

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
            {iconEmoji(viewProfile.icon_pack, viewProfile.icon_id)} {niceName(viewProfile)}
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

      {!viewProfile && !textBlockMsg && tab === 'home' && (
        <div>
          {/* created: 2026-11-23T21:10:00-08:00 */}
          <h2 className="panel-title">Home</h2>
          <p className="muted">Club posts from everyone</p>
          <div className="list">
            {posts.length === 0 ? (
              <p className="muted">No posts yet. Tap Post to share something.</p>
            ) : (
              posts.map((p) => (
                <div className="row post-row" key={p.id}>
                  <div className="row-main">
                    <p className="row-title">
                      {authorName(p.author_id)} ·{' '}
                      {p.kind === 'picture'
                        ? '🖼️ Picture'
                        : p.kind === 'video'
                          ? '🎬 Video'
                          : p.kind === 'link'
                            ? '🔗 Link'
                            : '✏️ Text'}
                    </p>
                    <p className="row-sub">{new Date(p.created_at).toLocaleString()}</p>
                    {p.body ? <p className="profile-bio">{p.body}</p> : null}
                    {p.kind === 'picture' && p.media_url ? (
                      <img className="post-media" src={p.media_url} alt="" />
                    ) : null}
                    {p.kind === 'video' && p.media_url ? (
                      <video className="post-media" src={p.media_url} controls playsInline />
                    ) : null}
                    {p.kind === 'link' && p.media_url ? (
                      <p className="row-sub">
                        <a href={p.media_url} target="_blank" rel="noreferrer">
                          Open link
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && !textBlockMsg && tab === 'post' && (
        <form className="form" onSubmit={submitPost}>
          {/* created: 2026-11-23T21:10:00-08:00 */}
          {/* updated: 2026-11-23T21:50:00-08:00 — C3 icon mode picker; upload+link for pic/video */}
          <h2 className="panel-title">New post</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Pick what you want to share
          </p>
          <div className="post-mode-grid" role="listbox" aria-label="Post type">
            {(
              [
                { id: 'text' as const, emoji: '✏️', label: 'Text' },
                { id: 'picture' as const, emoji: '🖼️', label: 'Picture' },
                { id: 'link' as const, emoji: '🔗', label: 'Link' },
                { id: 'video' as const, emoji: '🎬', label: 'Video' },
              ]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="option"
                aria-selected={postKind === mode.id}
                className={postKind === mode.id ? 'post-mode-tile sel' : 'post-mode-tile'}
                onClick={() => {
                  setPostKind(mode.id)
                  setPostMedia('')
                  setPostFileName('')
                  setPostSource(mode.id === 'link' ? 'link' : 'upload')
                  setError('')
                  setStatus('')
                }}
              >
                <span className="post-mode-emoji">{mode.emoji}</span>
                <span className="post-mode-label">{mode.label}</span>
              </button>
            ))}
          </div>

          {(postKind === 'picture' || postKind === 'video') && (
            <div className="post-source-row">
              <button
                type="button"
                className={postSource === 'upload' ? 'post-source-chip sel' : 'post-source-chip'}
                onClick={() => {
                  setPostSource('upload')
                  setPostMedia('')
                  setPostFileName('')
                }}
              >
                ⬆️ Upload
              </button>
              <button
                type="button"
                className={postSource === 'link' ? 'post-source-chip sel' : 'post-source-chip'}
                onClick={() => {
                  setPostSource('link')
                  setPostMedia('')
                  setPostFileName('')
                }}
              >
                🔗 Link
              </button>
            </div>
          )}

          {postKind === 'link' ||
          ((postKind === 'picture' || postKind === 'video') && postSource === 'link') ? (
            <label>
              {postKind === 'link' ? 'Website link' : `${postKind === 'picture' ? 'Picture' : 'Video'} URL`}
              <input
                value={postMedia}
                onChange={(e) => setPostMedia(e.target.value)}
                placeholder="https://…"
                inputMode="url"
              />
            </label>
          ) : null}

          {(postKind === 'picture' || postKind === 'video') && postSource === 'upload' ? (
            <label className="post-file-label">
              {postKind === 'picture' ? 'Choose picture' : 'Choose video'}
              <input
                type="file"
                accept={postKind === 'picture' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm'}
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  onPickPostFile(file)
                  e.target.value = ''
                }}
              />
              <span className="muted">
                {postFileName
                  ? `Ready: ${postFileName}`
                  : postKind === 'picture'
                    ? 'Under 4 MB · jpg/png/webp/gif'
                    : 'Under 25 MB · mp4/webm'}
              </span>
            </label>
          ) : null}

          <label>
            Caption
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Say something kind…"
            />
          </label>
          <button
            className="primary"
            type="submit"
            disabled={
              busy ||
              (postKind === 'text'
                ? !postBody.trim()
                : postKind === 'link'
                  ? !postMedia.trim()
                  : !postMedia.trim())
            }
          >
            Share
          </button>
        </form>
      )}

      {!viewProfile && !textBlockMsg && tab === 'play' && (
        <div>
          {/* created: 2026-11-23T21:10:00-08:00 */}
          <h2 className="panel-title">Play · Matches</h2>
          <p className="muted">
            Friends who picked the same icon pack as you
            {me?.icon_pack ? ` (${me.icon_pack})` : ''}
          </p>
          <div className="list">
            {matchFriends.length === 0 ? (
              <p className="muted">No matches yet. Ask friends to pick the same pack!</p>
            ) : (
              matchFriends.map((p) => (
                <div className="row" key={p.id}>
                  <button type="button" className="row-main linkish" onClick={() => openProfile(p)}>
                    <p className="row-title">
                      {iconEmoji(p.icon_pack, p.icon_id)} {niceName(p)}
                    </p>
                    <p className="row-sub">@{p.username}</p>
                  </button>
                  <div className="row-actions">
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

      {!viewProfile && !textBlockMsg && tab === 'me' && (
        <form className="form" onSubmit={saveProfile}>
          <h2 className="panel-title">My profile</h2>
          <p className="muted">
            {iconEmoji(me?.icon_pack, me?.icon_id)} @{me?.username}
          </p>
          <button
            className="ghost"
            type="button"
            style={{ marginBottom: 10 }}
            onClick={() => setPickIconMode(true)}
          >
            Change icon
          </button>
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

      {!viewProfile && !textBlockMsg && tab === 'people' && (
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
                    <p className="row-title">
                      {iconEmoji(p.icon_pack, p.icon_id)} {niceName(p)}
                    </p>
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

      {!viewProfile && !textBlockMsg && tab === 'chats' && !activeChat && (
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

      {!viewProfile && !textBlockMsg && tab === 'chats' && activeChat && (
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
