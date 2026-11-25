// created: 2026-11-23T12:14:00-08:00
// updated: 2026-11-23T23:35:00-08:00 — show teacher verify badges
// updated: 2026-11-24T12:35:00-08:00 — PRD v2: FYP, comments, share, Siobhan, delete account
// updated: 2026-11-24T13:40:00-08:00 — Gotcha-style messaging + expandable photos
// updated: 2026-11-24T13:45:00-08:00 — modern attach on Share + Me (no Choose File)
// updated: 2026-11-24T14:30:00-08:00 — hide listed usernames from People / FYP / search
// updated: 2026-11-24T23:55:00-08:00 — change password on Me
// updated: 2026-11-25T00:20:00-08:00 — @mention open-profile from chat/comments
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import { isHiddenProfile, visibleProfiles } from './lib/hiddenUsers'
import { EmojiBar, insertEmojiAtCursor } from './lib/emojiBar'
import { fetchFollowCounts, fetchMyFollowingIds, toggleFollowRpc } from './lib/follows'
import { checkKidText, reportBlockedText } from './lib/textChecker'
import { iconEmoji, type IconDef } from './lib/iconPacks'
import { encodePostShare } from './lib/postShare'
import { IconPicker } from './components/IconPicker'
import { TextBlocked } from './components/TextBlocked'
import { FaceAvatar } from './components/FaceAvatar'
import { PostCard } from './components/PostCard'
import { SiobhanFeed } from './components/SiobhanFeed'
import { PhotoAttach } from './components/PhotoAttach'
import { PeoplePickGrid } from './components/PeoplePickGrid'
import { ChatPanel, ChatThread } from './components/ChatPanel'
import { ThemePicker } from './components/ThemePicker'
import { NameWithBadge, VerifiedBadge } from './components/VerifiedBadge'

import {
  WEBSITE_LINKS_MAX,
  cleanWebsiteLinksForSave,
  parseWebsiteLinks,
} from './lib/websiteLinks'

const logoSrc = `${import.meta.env.BASE_URL}logo.jpg`
import type { ChatRow, FollowListKind, MessageRow, PostRow, Profile, Tab, WebsiteLink } from './types'

type Props = {
  userId: string
  onLogout: () => void
}

export function HomeApp({ userId, onLogout }: Props) {
  // created: 2026-11-23T12:14:00-08:00
  // updated: 2026-11-23T21:10:00-08:00 — default Home tab
  const [tab, setTab] = useState<Tab>('fyp')
  // created: 2026-11-24T12:35:00-08:00 — FYP search + share pickers
  const [fypQuery, setFypQuery] = useState('')
  const [fypSearchOpen, setFypSearchOpen] = useState(false)
  const [sharePost, setSharePost] = useState<PostRow | null>(null)
  const [shareMode, setShareMode] = useState<'send' | 'share' | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  // created: 2026-11-24T23:55:00-08:00 — change own password
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
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
  // created: 2026-11-24T14:10:00-08:00 — chat composer state lives in ChatPanel
  const [groupTitle, setGroupTitle] = useState('')
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  // created: 2026-11-24T00:05:00-08:00 — profile website links editor
  const [editLinks, setEditLinks] = useState<WebsiteLink[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // created: 2026-11-23T20:30:00-08:00
  // updated: 2026-11-23T20:34:00-08:00 — refs for all emoji fields
  const groupTitleRef = useRef<HTMLInputElement | null>(null)
  const editNameRef = useRef<HTMLInputElement | null>(null)
  const editBioRef = useRef<HTMLTextAreaElement | null>(null)
  // updated: 2026-11-23T21:55:00-08:00 — emoji pickers closed by default
  const [showGroupEmoji, setShowGroupEmoji] = useState(false)
  const [showNameEmoji, setShowNameEmoji] = useState(false)
  const [showBioEmoji, setShowBioEmoji] = useState(false)
  // created: 2026-11-23T20:40:00-08:00 — prevent stuck / double-tap Follow
  const [followBusyId, setFollowBusyId] = useState<string | null>(null)
  // created: 2026-11-23T20:45:00-08:00 — group member pickers (create + add)
  const [createPickIds, setCreatePickIds] = useState<Set<string>>(new Set())
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [addPickIds, setAddPickIds] = useState<Set<string>>(new Set())
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(new Set())
  // created: 2026-11-23T22:05:00-08:00 — DM list needs “who”; group create behind toggle
  const [dmPeerByChatId, setDmPeerByChatId] = useState<Record<string, Profile>>({})
  const [showNewGroup, setShowNewGroup] = useState(false)
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
      setEditLinks(parseWebsiteLinks(row.website_links))
      return
    }
    setMe(data as Profile)
    setEditName(data.display_name)
    setEditBio(data.bio || '')
    setEditLinks(parseWebsiteLinks((data as Profile).website_links))
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
    // updated: 2026-11-24T14:30:00-08:00 — drop hidden usernames (e.g. pr123)
    const others = visibleProfiles((peopleRes.data || []) as Profile[])
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
    // updated: 2026-11-23T22:05:00-08:00 — resolve DM peer so list shows who
    const { data: memberships, error: memErr } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', userId)
    if (memErr) throw memErr
    const ids = (memberships || []).map((m) => m.chat_id as string)
    if (!ids.length) {
      setChats([])
      setDmPeerByChatId({})
      return
    }
    const { data, error: chatErr } = await supabase
      .from('chats')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
    if (chatErr) throw chatErr
    const list = (data || []) as ChatRow[]
    setChats(list)

    const dmIds = list.filter((c) => !c.is_group).map((c) => c.id)
    if (!dmIds.length) {
      setDmPeerByChatId({})
      return
    }
    const { data: edges } = await supabase
      .from('chat_members')
      .select('chat_id, user_id')
      .in('chat_id', dmIds)
    const peerIdByChat: Record<string, string> = {}
    ;(edges || []).forEach((e) => {
      const cid = String(e.chat_id)
      const uid = String(e.user_id)
      if (uid !== userId) peerIdByChat[cid] = uid
    })
    const peerIds = [...new Set(Object.values(peerIdByChat))]
    if (!peerIds.length) {
      setDmPeerByChatId({})
      return
    }
    const { data: peers } = await supabase.from('profiles').select('*').in('id', peerIds)
    const byId: Record<string, Profile> = {}
    ;(peers || []).forEach((p) => {
      byId[p.id] = p as Profile
    })
    const map: Record<string, Profile> = {}
    Object.entries(peerIdByChat).forEach(([cid, pid]) => {
      if (byId[pid]) map[cid] = byId[pid]
    })
    setDmPeerByChatId(map)
  }, [userId])

  const loadPosts = useCallback(async () => {
    // created: 2026-11-23T21:10:00-08:00
    // updated: 2026-11-23T22:25:00-08:00 — hide teacher soft-deleted posts
    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(40)
    if (err) {
      // older DBs without deleted_at column
      const fallback = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40)
      setPosts(((fallback.data || []) as PostRow[]).filter((p) => !p.deleted_at))
      return
    }
    setPosts((data || []) as PostRow[])
  }, [])

  // created: 2026-11-24T14:30:00-08:00 — posts from hidden authors stay off FYP
  const publicPosts = useMemo(() => {
    return posts.filter((p) => {
      if (p.author_id === userId) return true
      const author = people.find((x) => x.id === p.author_id) || profilesById[p.author_id]
      if (author) return !isHiddenProfile(author)
      return true
    })
  }, [posts, people, profilesById, userId])

  const refreshAll = useCallback(async () => {
    // created: 2026-11-23T12:14:00-08:00
    // updated: 2026-11-23T22:35:00-08:00 — join Everyone lounge before chat list
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
      await supabase.rpc('join_lounge_everyone')
      await supabase.rpc('join_lounge_announcements')
    } catch {
      /* lounge SQL may not be applied yet */
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
    // updated: 2026-11-24T00:05:00-08:00 — save website_links
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
      for (const link of editLinks) {
        const titleCheck = await checkKidText(link.title)
        if (!titleCheck.ok) {
          await reportBlockedText('website_title', link.title, titleCheck.matched)
          setTextBlockMsg(titleCheck.message)
          return
        }
      }
      const links = cleanWebsiteLinksForSave(editLinks)
      if (editLinks.some((l) => l.url.trim()) && links.length === 0) {
        throw new Error('Website links must start with http:// or https:// (or a normal site name).')
      }
      const { error: err } = await supabase
        .from('profiles')
        .update({
          display_name: editName.trim() || me?.username || 'Friend',
          bio: editBio,
          website_links: links,
        })
        .eq('id', userId)
      if (err) {
        if (/website_links|column/i.test(err.message)) {
          throw new Error('Website links need sql-profile-website-links.sql — run in Supabase.')
        }
        throw err
      }
      setStatus('Profile saved.')
      await loadMe()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  function updateEditLink(index: number, patch: Partial<WebsiteLink>) {
    // created: 2026-11-24T00:05:00-08:00
    setEditLinks((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addEditLink() {
    // created: 2026-11-24T00:05:00-08:00
    setEditLinks((prev) =>
      prev.length >= WEBSITE_LINKS_MAX ? prev : [...prev, { title: '', url: '' }],
    )
  }

  function removeEditLink(index: number) {
    // created: 2026-11-24T00:05:00-08:00
    setEditLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function changeMyPassword() {
    // created: 2026-11-24T23:55:00-08:00 — verify current then supabase.auth.updateUser
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const uname = (me?.username || '').trim().toLowerCase()
      if (!uname) throw new Error('Profile not loaded yet.')
      if (!pwCurrent) throw new Error('Enter your current password.')
      if (pwNew.length < 6) throw new Error('New password must be at least 6 characters.')
      if (pwNew !== pwConfirm) throw new Error('New password and confirmation do not match.')
      if (pwNew === pwCurrent) throw new Error('New password must be different.')
      const email = `${uname}@rafflesia.local`
      const { error: checkErr } = await supabase.auth.signInWithPassword({
        email,
        password: pwCurrent,
      })
      if (checkErr) throw new Error('Current password is wrong.')
      const { error: updErr } = await supabase.auth.updateUser({ password: pwNew })
      if (updErr) throw updErr
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setStatus('Password updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.')
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
      setTab('fyp')
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

  // created: 2026-11-24T14:20:00-08:00 — clear avatar/banner (SQL blank→null)
  async function clearProfileImage(kind: 'avatar' | 'banner') {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const bucket = kind === 'avatar' ? 'avatars' : 'banners'
      const { data: listed } = await supabase.storage.from(bucket).list(userId)
      const paths = (listed || [])
        .map((f) => `${userId}/${f.name}`)
        .filter((p) => p.includes(`/${kind}.`))
      if (paths.length) await supabase.storage.from(bucket).remove(paths)
      const { error } = await supabase.rpc('set_my_profile_image', {
        p_kind: kind,
        p_url: '',
      })
      if (error) throw error
      setStatus(kind === 'avatar' ? 'Profile picture removed.' : 'Banner removed.')
      await loadMe()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not remove.'
      setError(`Remove failed: ${msg}`)
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

  async function openUsername(username: string) {
    // created: 2026-11-25T00:20:00-08:00 — tap @mention → profile
    const u = username.trim().replace(/^@/, '').toLowerCase()
    if (!u) return
    const hit =
      people.find((p) => p.username.toLowerCase() === u) ||
      Object.values(profilesById).find((p) => p.username.toLowerCase() === u) ||
      (me && me.username.toLowerCase() === u ? me : null)
    if (hit) {
      await openProfile(hit)
      return
    }
    setBusy(true)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', u)
        .maybeSingle()
      if (err) throw err
      if (data) await openProfile(data as Profile)
      else setError(`No one named @${u}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open profile.')
    } finally {
      setBusy(false)
    }
  }

  async function openProfile(profile: Profile, kind: FollowListKind | null = null) {
    // updated: 2026-11-24T14:30:00-08:00 — refuse hidden usernames
    if (isHiddenProfile(profile) && profile.id !== userId) {
      setError('That profile is not available.')
      return
    }
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
    // updated: 2026-11-23T22:35:00-08:00 — groups live in Lounge
    closeFollowProfile()
    setTab('lounge')
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
    // updated: 2026-11-24T22:50:00-08:00 — close profile so Messages tab can show
    setBusy(true)
    setError('')
    try {
      const { data: chat, error: chatErr } = await supabase.rpc('start_dm', {
        p_other_user_id: other.id,
      })
      if (chatErr) throw chatErr
      if (!chat) throw new Error('Could not start chat.')
      closeFollowProfile()
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
    // updated: 2026-11-23T22:00:00-08:00 — always clickable; clear empty-name error
    e.preventDefault()
    const title = groupTitle.trim()
    if (!title) {
      setError('Type a group chat name first, then tap Create group chat.')
      return
    }
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
      setShowNewGroup(false)
      setShowAddFriends(false)
      setTab('lounge')
      setActiveChat(chat as ChatRow)
      await loadChats()
      await loadGroupMembers((chat as ChatRow).id)
      setStatus(
        memberIds.length
          ? `Lounge group ready with ${memberIds.length} friend${memberIds.length === 1 ? '' : 's'}.`
          : 'Lounge group ready. Open + Friends inside to invite people.',
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

  async function sendChatPayload(payload: { body: string; mediaUrl: string | null }) {
    // created: 2026-11-24T14:10:00-08:00 — used by ChatPanel / ChatThread
    if (!activeChat) throw new Error('No active chat.')
    const body = payload.body.trim()
    if (!body && !payload.mediaUrl) return
    if (body) {
      const check = await checkKidText(body)
      if (!check.ok) {
        await reportBlockedText('message', body, check.matched)
        setTextBlockMsg(check.message)
        throw new Error(check.message)
      }
    }
    const restr = await supabase.rpc('my_restrictions')
    if (!restr.error && restr.data && (restr.data as { block_message?: boolean }).block_message) {
      throw new Error('Messaging is restricted by a teacher right now.')
    }
    const { data, error: err } = await supabase.rpc('send_chat_message', {
      p_chat_id: activeChat.id,
      p_body: body || (payload.mediaUrl ? '📷' : ''),
      p_video_url: payload.mediaUrl,
    })
    if (err) throw err
    if (data && typeof data === 'object' && 'id' in data) {
      const row = data as MessageRow
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
    }
    await loadMessages(activeChat.id)
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
    // updated: 2026-11-23T22:40:00-08:00 — Everyone = lounge room title
    if (!activeChat) return ''
    if (activeChat.lounge_key === 'everyone') return 'Rafflesia Lounge'
    if (activeChat.lounge_key === 'announcements') return 'Announcements & Updates'
    if (activeChat.is_group) return activeChat.title || 'Group chat'
    const peer = dmPeerByChatId[activeChat.id]
    return peer ? niceName(peer) : 'Private chat'
  }, [activeChat, dmPeerByChatId])

  const needsIcon = Boolean(me && !me.icon_id)
  const showIconPicker = needsIcon || pickIconMode

  // created: 2026-11-23T22:35:00-08:00 — Messages = DMs; Lounge = club room + groups
  // updated: 2026-11-23T22:40:00-08:00 — Everyone is the Lounge room, not a group chat
  const dmChats = useMemo(() => {
    // updated: 2026-11-24T14:30:00-08:00 — hide DMs with hidden peers
    return chats.filter((c) => {
      if (c.is_group) return false
      const peer = dmPeerByChatId[c.id]
      if (peer && isHiddenProfile(peer)) return false
      return true
    })
  }, [chats, dmPeerByChatId])
  const everyoneRoom = useMemo(
    () => chats.find((c) => c.lounge_key === 'everyone') || null,
    [chats],
  )
  const announcementsRoom = useMemo(
    () => chats.find((c) => c.lounge_key === 'announcements') || null,
    [chats],
  )
  const loungeGroups = useMemo(
    () =>
      chats
        .filter(
          (c) =>
            c.is_group && c.lounge_key !== 'everyone' && c.lounge_key !== 'announcements',
        )
        .sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [chats],
  )
  const isEveryoneChat = activeChat?.lounge_key === 'everyone'
  const isAnnouncementsChat = activeChat?.lounge_key === 'announcements'

  const authorProfile = (authorId: string) => {
    // created: 2026-11-23T21:10:00-08:00
    // updated: 2026-11-23T23:35:00-08:00 — return profile for verify badge
    if (authorId === userId) return me
    return people.find((x) => x.id === authorId) || profilesById[authorId] || null
  }

  const authorName = (authorId: string) => niceName(authorProfile(authorId))

  const filteredPosts = useMemo(() => {
    // created: 2026-11-24T12:35:00-08:00 — FYP search
    // updated: 2026-11-24T14:30:00-08:00 — start from publicPosts (hidden authors out)
    const q = fypQuery.trim().toLowerCase()
    if (!q) return publicPosts
    return publicPosts.filter((p) => {
      const author = authorProfile(p.author_id)
      if (isHiddenProfile(author) && p.author_id !== userId) return false
      const hay = [
        p.body || '',
        p.media_url || '',
        p.kind,
        author?.username || '',
        author?.display_name || '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [publicPosts, fypQuery, people, profilesById, me, userId])

  const peopleSearchHits = useMemo(() => {
    const q = fypQuery.trim().toLowerCase()
    if (!q) return [] as Profile[]
    return people.filter(
      (p) =>
        !isHiddenProfile(p) &&
        (p.username.toLowerCase().includes(q) ||
          (p.display_name || '').toLowerCase().includes(q)),
    )
  }, [people, fypQuery])

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

  const mainNav = (
    // created: 2026-11-23T21:10:00-08:00 — A6 nav shell
    // updated: 2026-11-23T23:45:00-08:00 — right-hand rail
    // updated: 2026-11-24T12:35:00-08:00 — FYP + Siobhan
    <nav className="nav nav-shell nav-rail" aria-label="Main">
      {(
        [
          ['fyp', 'For You'],
          ['post', 'Post'],
          ['chats', 'Messages'],
          ['lounge', 'Lounge'],
          ['people', 'People'],
          ['me', 'Me'],
          ['siobhan', 'Siobhan'],
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
            if (id === 'fyp') loadPosts()
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  )

  async function deliverSharedPost(targetChatId: string, post: PostRow, note?: string) {
    // created: 2026-11-24T12:35:00-08:00
    const body = encodePostShare(post.id, note)
    // updated: 2026-11-24T13:05:00-08:00 — always pass p_video_url (overload ambiguity)
    const { error: err } = await supabase.rpc('send_chat_message', {
      p_chat_id: targetChatId,
      p_body: body,
      p_video_url: null,
    })
    if (err) throw err
  }

  async function onSendPost(post: PostRow) {
    setSharePost(post)
    setShareMode('send')
  }

  async function onSharePost(post: PostRow) {
    setSharePost(post)
    setShareMode('share')
  }

  async function confirmSendToPerson(other: Profile) {
    if (!sharePost) return
    setBusy(true)
    setError('')
    try {
      const { data: chat, error: chatErr } = await supabase.rpc('start_dm', {
        p_other_user_id: other.id,
      })
      if (chatErr) throw chatErr
      await deliverSharedPost((chat as ChatRow).id, sharePost)
      setSharePost(null)
      setShareMode(null)
      closeFollowProfile()
      setActiveChat(chat as ChatRow)
      setTab('chats')
      await loadChats()
      setStatus(`Sent post to ${niceName(other)}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmShareToGroup(chat: ChatRow) {
    if (!sharePost) return
    if (chat.lounge_key === 'announcements' && me?.username !== 'rafflesiaonline') {
      setError('Only @rafflesiaonline can post in Announcements.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await deliverSharedPost(chat.id, sharePost)
      setSharePost(null)
      setShareMode(null)
      setActiveChat(chat)
      setTab('lounge')
      setStatus('Shared to Lounge.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteMyAccount() {
    // created: 2026-11-24T12:35:00-08:00
    if (!me) return
    if (deleteConfirm.trim().toLowerCase() !== me.username.toLowerCase()) {
      setError('Type your username to confirm delete account.')
      return
    }
    if (!window.confirm('Delete your account forever? This cannot be undone.')) return
    setBusy(true)
    try {
      const { error: err } = await supabase.rpc('delete_my_account')
      if (err) throw err
      await onLogout()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete account. Run sql-delete-account.sql in Supabase.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-with-rail">
      <div className="app-main-col">
      {/* updated: 2026-11-24T00:00:00-08:00 — corner face opens My profile */}
      {/* updated: 2026-11-24T12:05:00-08:00 — Log out always in header */}
      <div className="header-bar">
        <div className="header-identity">
          <button
            type="button"
            className="header-face-btn"
            title="My profile"
            aria-label="Open my profile"
            onClick={() => {
              closeFollowProfile()
              setActiveChat(null)
              setTab('me')
            }}
          >
            <FaceAvatar
              avatarUrl={me?.avatar_url}
              iconPack={me?.icon_pack}
              iconId={me?.icon_id}
              size="md"
              className="header-face"
            />
          </button>
          <div>
            <h1 className="brand">Rafflesia Online</h1>
            <p className="tag" style={{ marginBottom: 0 }}>
              {iconEmoji(me?.icon_pack, me?.icon_id)} Hi{' '}
              <NameWithBadge name={niceName(me)} tier={me?.verify_tier} />
            </p>
          </div>
        </div>
        <button className="ghost header-logout" type="button" onClick={onLogout}>
          Log out
        </button>
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
          <div className="profile-face-row">
            <FaceAvatar
              avatarUrl={viewProfile.avatar_url}
              iconPack={viewProfile.icon_pack}
              iconId={viewProfile.icon_id}
              size="lg"
            />
            <div>
              <h2 className="panel-title" style={{ marginTop: 0, marginBottom: 2 }}>
                <NameWithBadge name={niceName(viewProfile)} tier={viewProfile.verify_tier} />
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                @{viewProfile.username} <VerifiedBadge tier={viewProfile.verify_tier} />
              </p>
            </div>
          </div>

          <p className="profile-bio">
            {(viewProfile.bio || '').trim() ? viewProfile.bio : 'No bio yet.'}
          </p>

          {parseWebsiteLinks(viewProfile.website_links).length > 0 ? (
            <div className="profile-links">
              <p className="friend-pick-heading">Websites</p>
              <ul className="profile-link-list">
                {parseWebsiteLinks(viewProfile.website_links).map((link) => (
                  <li key={`${link.title}-${link.url}`}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
                {busy ? 'Messaging…' : 'Message'}
              </button>
            </div>
          ) : null}

          <h2 className="panel-title">Lounge groups together</h2>
          <div className="list" style={{ marginBottom: 14 }}>
            {sharedGroups.length === 0 ? (
              <p className="muted">
                {viewProfile.id === userId
                  ? 'Your groups show under Rafflesia Lounge.'
                  : 'No shared Lounge groups yet.'}
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
                    <p className="row-title">
                      {g.lounge_key === 'everyone' ? 'Everyone' : g.title || 'Group'}
                    </p>
                    <p className="row-sub">
                      {g.lounge_key === 'everyone'
                        ? 'Club lounge room · tap to open'
                        : 'Group chat · tap to open'}
                    </p>
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
                        <p className="row-title">
                          <NameWithBadge name={niceName(p)} tier={p.verify_tier} />
                        </p>
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

      {!viewProfile && !textBlockMsg && tab === 'fyp' && (
        <div className="fyp-panel">
          {/* created: 2026-11-24T12:35:00-08:00 — FYP + search */}
          {/* updated: 2026-11-24T12:55:00-08:00 — search behind toggle */}
          <div className="fyp-header-row">
            <h2 className="panel-title">For You</h2>
            <button
              className="ghost btn-compact"
              type="button"
              aria-expanded={fypSearchOpen}
              onClick={() => {
                setFypSearchOpen((v) => {
                  if (v) setFypQuery('')
                  return !v
                })
              }}
            >
              {fypSearchOpen ? 'Close search' : 'Search'}
            </button>
          </div>
          {fypSearchOpen ? (
            <label className="fyp-search">
              Find friends or posts
              <input
                value={fypQuery}
                onChange={(e) => setFypQuery(e.target.value)}
                placeholder="Username, name, or caption…"
                autoFocus
              />
            </label>
          ) : null}
          {fypSearchOpen && peopleSearchHits.length > 0 ? (
            <div className="list fyp-people-hits">
              <p className="friend-pick-heading">People</p>
              {peopleSearchHits.slice(0, 8).map((p) => (
                <div className="row" key={`hit-${p.id}`}>
                  <button type="button" className="row-main linkish" onClick={() => openProfile(p)}>
                    <FaceAvatar avatarUrl={p.avatar_url} iconPack={p.icon_pack} iconId={p.icon_id} size="sm" />
                    <span>
                      <p className="row-title">
                        <NameWithBadge name={niceName(p)} tier={p.verify_tier} />
                      </p>
                      <p className="row-sub">@{p.username}</p>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="list fyp-feed">
            {filteredPosts.length === 0 ? (
              <p className="muted">No posts yet. Tap Post to share something.</p>
            ) : (
              filteredPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  userId={userId}
                  authorName={authorName(p.author_id)}
                  authorTier={authorProfile(p.author_id)?.verify_tier}
                  uploadPicture={(file) => uploadPostFile(file, 'picture')}
                  profilesById={{
                    ...profilesById,
                    ...Object.fromEntries(people.map((x) => [x.id, x])),
                    ...(me ? { [userId]: me } : {}),
                  }}
                  busy={busy}
                  onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                  onSend={onSendPost}
                  onShare={onSharePost}
                  onOpenAuthor={(aid) => {
                    const p = authorProfile(aid)
                    if (p) openProfile(p)
                  }}
                  onOpenUsername={openUsername}
                />
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && !textBlockMsg && tab === 'post' && (
        <form className="form form-compact" onSubmit={submitPost}>
          {/* created: 2026-11-23T21:10:00-08:00 */}
          {/* updated: 2026-11-23T21:50:00-08:00 — C3 icon mode picker; upload+link for pic/video */}
          {/* updated: 2026-11-24T12:15:00-08:00 — compact actions */}
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
            <PhotoAttach
              label={postKind === 'picture' ? 'Add picture' : 'Add video'}
              hint={
                postKind === 'picture'
                  ? 'Tap to upload · under 4 MB · jpg/png/webp/gif'
                  : 'Tap to upload · under 25 MB · mp4/webm'
              }
              accept={
                postKind === 'picture'
                  ? 'image/jpeg,image/png,image/webp,image/gif'
                  : 'video/mp4,video/webm'
              }
              mediaKind={postKind === 'video' ? 'video' : 'image'}
              icon={postKind === 'video' ? '🎬' : '🖼️'}
              readyLabel={postKind === 'picture' ? 'Picture ready' : 'Video ready'}
              previewUrl={postMedia || null}
              fileName={postFileName}
              busy={busy}
              onPick={(file) => onPickPostFile(file)}
              onClear={() => {
                setPostMedia('')
                setPostFileName('')
                setStatus('')
              }}
            />
          ) : null}

          <label>
            Caption
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Say something kind…"
            />
          </label>
          <div className="action-row">
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
          </div>
        </form>
      )}

      {!viewProfile && !textBlockMsg && tab === 'lounge' && !activeChat && (
        <div>
          {/* created: 2026-11-23T22:35:00-08:00 */}
          {/* updated: 2026-11-23T22:40:00-08:00 — Lounge room ≠ group chats */}
          <div className="messages-header-row">
            <div>
              <h2 className="panel-title" style={{ marginBottom: 2 }}>
                Rafflesia Lounge
              </h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Open the club room (everybody who signed up), or make smaller group chats.
              </p>
            </div>
            <button
              className={showNewGroup ? 'ghost' : 'primary'}
              type="button"
              onClick={() => setShowNewGroup((v) => !v)}
            >
              {showNewGroup ? 'Cancel' : '+ Group chat'}
            </button>
          </div>

          {everyoneRoom ? (
            <button
              className="row chat-list-row lounge-main-room"
              type="button"
              onClick={() => setActiveChat(everyoneRoom)}
              style={{ marginBottom: 10 }}
            >
              <span className="face-avatar face-emoji sm" aria-hidden>
                🌸
              </span>
              <div className="row-main">
                <p className="row-title">Everyone</p>
                <p className="row-sub">Club lounge room · all signups · not a group chat</p>
              </div>
            </button>
          ) : (
            <p className="muted">
              Run <strong>sql-lounge-everyone.sql</strong> in Supabase, then refresh to open the lounge
              room.
            </p>
          )}

          {announcementsRoom ? (
            <button
              className="row chat-list-row"
              type="button"
              onClick={() => setActiveChat(announcementsRoom)}
              style={{ marginBottom: 14 }}
            >
              <span className="face-avatar face-emoji sm" aria-hidden>
                📢
              </span>
              <div className="row-main">
                <p className="row-title">Announcements &amp; Updates</p>
                <p className="row-sub">Official club news · only @rafflesiaonline can post</p>
              </div>
            </button>
          ) : (
            <p className="muted">Run sql-announcements.sql for Announcements &amp; Updates.</p>
          )}

          {showNewGroup ? (
            <div className="group-create-card">
              <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                New group chat
              </h3>
              <p className="muted" style={{ marginTop: 0 }}>
                Smaller than the lounge — only the friends you invite.
              </p>
              <form className="form group-create-form" onSubmit={createGroup}>
                <label>
                  Name this group chat
                  <input
                    ref={groupTitleRef}
                    value={groupTitle}
                    onChange={(e) => {
                      setGroupTitle(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="e.g. Lunch table"
                    autoFocus
                  />
                </label>
                <EmojiBar
                  label="Emoji"
                  open={showGroupEmoji}
                  onToggle={() => setShowGroupEmoji((v) => !v)}
                  onPick={(emoji) =>
                    insertEmojiAtCursor(groupTitleRef.current, groupTitle, setGroupTitle, emoji)
                  }
                />
                <PeoplePickGrid
                  people={people}
                  selectedIds={createPickIds}
                  onToggle={toggleCreatePick}
                  niceName={niceName}
                  heading="Who should be in it?"
                  emptyText="No other people yet — create alone, invite later from inside."
                />
                <button className="primary" type="submit" disabled={busy}>
                  {busy
                    ? 'Creating…'
                    : `Create group chat${createPickIds.size ? ` · ${createPickIds.size} invited` : ''}`}
                </button>
              </form>
            </div>
          ) : null}

          <h3 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left', marginBottom: 6 }}>
            Group chats
          </h3>
          <div className="list">
            {loungeGroups.length === 0 ? (
              <p className="muted">No group chats yet. Tap + Group chat to make one with friends.</p>
            ) : (
              loungeGroups.map((c) => (
                <button
                  key={c.id}
                  className="row chat-list-row"
                  type="button"
                  onClick={() => setActiveChat(c)}
                >
                  <span className="face-avatar face-emoji sm" aria-hidden>
                    👥
                  </span>
                  <div className="row-main">
                    <p className="row-title">{c.title || 'Group chat'}</p>
                    <p className="row-sub">Group chat · invited friends only</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!viewProfile && !textBlockMsg && tab === 'me' && (
        <form className="form me-form" onSubmit={saveProfile}>
          <h2 className="panel-title">My profile</h2>
          <p className="muted">
            {iconEmoji(me?.icon_pack, me?.icon_id)} @{me?.username}{' '}
            <VerifiedBadge tier={me?.verify_tier} />
          </p>
          {/* created: 2026-11-24T11:50:00-08:00 — user pick stays until Auto */}
          <ThemePicker compact />
          <div className="me-actions-row">
            <button
              className="ghost"
              type="button"
              onClick={() => setPickIconMode(true)}
            >
              Change icon
            </button>
          </div>
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
          <div className="profile-face-row">
            <FaceAvatar
              avatarUrl={me?.avatar_url}
              iconPack={me?.icon_pack}
              iconId={me?.icon_id}
              size="lg"
            />
            <p className="muted" style={{ margin: 0 }}>
              Your face = photo, or your icon if no photo yet
            </p>
          </div>

          <div className="profile-upload-stack">
            <p className="friend-pick-heading" style={{ marginBottom: 6 }}>
              Profile picture
            </p>
            <PhotoAttach
              label="Update profile picture"
              hint="Tap to upload · under 4 MB · jpg/png/webp/gif"
              accept="image/jpeg,image/png,image/webp,image/gif"
              icon="😊"
              readyLabel="Profile photo"
              previewUrl={me?.avatar_url || null}
              busy={busy}
              onPick={(file) => uploadImage('avatar', file)}
              onClear={() => clearProfileImage('avatar')}
            />
            <p className="friend-pick-heading" style={{ margin: '14px 0 6px' }}>
              Banner
            </p>
            <PhotoAttach
              label="Update banner"
              hint="Tap to upload a wide cover photo · under 4 MB"
              accept="image/jpeg,image/png,image/webp,image/gif"
              icon="🌄"
              readyLabel="Banner"
              previewUrl={me?.banner_url || null}
              busy={busy}
              onPick={(file) => uploadImage('banner', file)}
              onClear={() => clearProfileImage('banner')}
            />
          </div>

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

          {/* created: 2026-11-24T00:05:00-08:00 — own website links */}
          <div className="profile-links-edit">
            <p className="friend-pick-heading">Your websites</p>
            <p className="muted" style={{ marginTop: 0 }}>
              Add links friends can open from your profile (up to {WEBSITE_LINKS_MAX}).
            </p>
            {editLinks.map((link, i) => (
              <div className="profile-link-edit-row" key={`link-${i}`}>
                <label>
                  Title
                  <input
                    value={link.title}
                    onChange={(e) => updateEditLink(i, { title: e.target.value.slice(0, 40) })}
                    placeholder="My site"
                  />
                </label>
                <label>
                  Link
                  <input
                    value={link.url}
                    onChange={(e) => updateEditLink(i, { url: e.target.value })}
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                </label>
                <button className="ghost" type="button" onClick={() => removeEditLink(i)}>
                  Remove
                </button>
              </div>
            ))}
            {editLinks.length < WEBSITE_LINKS_MAX ? (
              <button className="ghost btn-compact" type="button" onClick={addEditLink}>
                + Add website link
              </button>
            ) : null}
          </div>

          {/* updated: 2026-11-24T12:05:00-08:00 — compact save; logout lives in header */}
          <div className="me-actions-row">
            <button className="primary btn-compact" type="submit" disabled={busy}>
              Save profile
            </button>
          </div>

          {/* created: 2026-11-24T23:55:00-08:00 — change password */}
          <div className="profile-links-edit" style={{ marginTop: 16 }}>
            <p className="friend-pick-heading">Change password</p>
            <p className="muted" style={{ marginTop: 0 }}>
              Use your current password, then pick a new one (at least 6 characters).
            </p>
            <label>
              Current password
              <input
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <div className="me-actions-row">
              <button
                className="primary btn-compact"
                type="button"
                disabled={busy}
                onClick={() => changeMyPassword()}
              >
                Update password
              </button>
            </div>
          </div>

          {/* created: 2026-11-24T12:35:00-08:00 — delete account (PRD v2 B8) */}
          <div className="danger-zone">
            <p className="friend-pick-heading">Delete account</p>
            <p className="muted">Type your username ({me?.username}) to confirm.</p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="username"
              autoComplete="off"
            />
            <div className="action-row">
              <button className="danger btn-compact" type="button" disabled={busy} onClick={deleteMyAccount}>
                Delete account
              </button>
            </div>
          </div>
        </form>
      )}

      {!viewProfile && !textBlockMsg && tab === 'siobhan' && (
        // created: 2026-11-24T12:35:00-08:00 — PRD v2 B7
        // updated: 2026-11-24T13:10:00-08:00 — manga science scrolling feed
        <SiobhanFeed
          userId={userId}
          uploadPicture={(file) => uploadPostFile(file, 'picture')}
          profilesById={{
            ...profilesById,
            ...Object.fromEntries(people.map((x) => [x.id, x])),
            ...(me ? { [userId]: me } : {}),
          }}
          onProfiles={(rows) => {
            setProfilesById((prev) => {
              const next = { ...prev }
              for (const p of rows) next[p.id] = p
              return next
            })
          }}
          onOpenUsername={openUsername}
        />
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
                  <button type="button" className="row-main linkish people-row" onClick={() => openProfile(p)}>
                    <FaceAvatar
                      avatarUrl={p.avatar_url}
                      iconPack={p.icon_pack}
                      iconId={p.icon_id}
                      size="sm"
                    />
                    <span>
                      <p className="row-title">
                        <NameWithBadge name={niceName(p)} tier={p.verify_tier} />
                      </p>
                      <p className="row-sub">
                        @{p.username} · {followerCountById[p.id] || 0} followers ·{' '}
                        {followingCountById[p.id] || 0} following
                      </p>
                    </span>
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
                      {busy ? 'Messaging…' : 'Message'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* created: 2026-11-24T14:10:00-08:00 — ChatPanel v2 */}
      {!viewProfile && !textBlockMsg && tab === 'chats' && (
        <ChatPanel
          userId={userId}
          me={me}
          chats={dmChats}
          peersByChatId={dmPeerByChatId}
          activeChat={activeChat && !activeChat.is_group ? activeChat : null}
          onSelectChat={setActiveChat}
          messages={messages}
          profilesById={profilesById}
          posts={posts}
          likes={likes}
          myLiked={myLiked}
          busy={busy}
          onToggleLike={toggleLike}
          onSend={sendChatPayload}
          onUploadPhoto={(file) => uploadPostFile(file, 'picture')}
          authorName={authorName}
          mentionPeople={people}
          onOpenUsername={openUsername}
        />
      )}

      {!viewProfile && !textBlockMsg && tab === 'lounge' && activeChat && activeChat.is_group && (
        <div className="chat2-thread solo">
          {activeChat.is_group && !isEveryoneChat && !isAnnouncementsChat && showAddFriends ? (
            <div className="add-friends-panel" style={{ padding: 12 }}>
              <h3 className="panel-title" style={{ fontSize: '0.95rem' }}>
                Add friends to this group chat
              </h3>
              <PeoplePickGrid
                people={people.filter((p) => !groupMemberIds.has(p.id))}
                selectedIds={addPickIds}
                onToggle={toggleAddPick}
                niceName={niceName}
                heading="Who to add?"
                emptyText="Everyone you know is already in this group."
              />
              <button
                className="primary btn-compact"
                type="button"
                disabled={busy || addPickIds.size === 0}
                onClick={submitAddFriends}
              >
                Add to group chat{addPickIds.size ? ` (${addPickIds.size})` : ''}
              </button>
            </div>
          ) : null}
          <ChatThread
            userId={userId}
            me={me}
            title={chatLabel}
            messages={messages}
            profilesById={profilesById}
            posts={posts}
            likes={likes}
            myLiked={myLiked}
            busy={busy}
            readOnly={Boolean(isAnnouncementsChat && me?.username !== 'rafflesiaonline')}
            readOnlyHint="Read-only — only @rafflesiaonline can post here."
            backLabel="← Lounge"
            onBack={() => {
              setActiveChat(null)
              setShowAddFriends(false)
              setAddPickIds(new Set())
            }}
            headerExtra={
              activeChat.is_group && !isEveryoneChat && !isAnnouncementsChat ? (
                <button
                  className="chat2-tool"
                  type="button"
                  title="Add friends"
                  onClick={() => {
                    setShowAddFriends((v) => !v)
                    setAddPickIds(new Set())
                  }}
                >
                  +
                </button>
              ) : null
            }
            onToggleLike={toggleLike}
            onSend={sendChatPayload}
            onUploadPhoto={(file) => uploadPostFile(file, 'picture')}
            authorName={authorName}
            mentionPeople={people}
            onOpenUsername={openUsername}
          />
        </div>
      )}


      {sharePost && shareMode ? (
        <div className="share-picker-overlay">
          {/* created: 2026-11-24T12:35:00-08:00 */}
          <div className="share-picker-card">
            <h3 className="panel-title">{shareMode === 'send' ? 'Send post' : 'Share to Lounge'}</h3>
            <button
              className="ghost btn-compact"
              type="button"
              onClick={() => {
                setSharePost(null)
                setShareMode(null)
              }}
            >
              Cancel
            </button>
            {shareMode === 'send' ? (
              <div className="list">
                {people.length === 0 ? (
                  <p className="muted">No people to send to yet.</p>
                ) : (
                  people.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="row chat-list-row"
                      disabled={busy}
                      onClick={() => confirmSendToPerson(p)}
                    >
                      <FaceAvatar avatarUrl={p.avatar_url} iconPack={p.icon_pack} iconId={p.icon_id} size="sm" />
                      <div className="row-main">
                        <p className="row-title">{niceName(p)}</p>
                        <p className="row-sub">@{p.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="list">
                {[everyoneRoom, announcementsRoom, ...loungeGroups]
                  .filter(Boolean)
                  .map((c) => (
                    <button
                      key={(c as ChatRow).id}
                      type="button"
                      className="row chat-list-row"
                      disabled={busy}
                      onClick={() => confirmShareToGroup(c as ChatRow)}
                    >
                      <div className="row-main">
                        <p className="row-title">
                          {(c as ChatRow).lounge_key === 'everyone'
                            ? 'Everyone'
                            : (c as ChatRow).lounge_key === 'announcements'
                              ? 'Announcements & Updates'
                              : (c as ChatRow).title || 'Group'}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      </div>
      {mainNav}
    </div>
  )
}
