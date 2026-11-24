// created: 2026-11-23T12:14:00-08:00
// updated: 2026-11-23T21:05:00-08:00 — icons, posts, home/post/play tabs
export type Profile = {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string | null
  banner_url: string | null
  // created: 2026-11-23T21:05:00-08:00
  icon_pack?: string | null
  icon_id?: string | null
}

/** created: 2026-11-23T20:28:00-08:00 — which list is open on a profile */
export type FollowListKind = 'followers' | 'following'

export type ChatRow = {
  id: string
  is_group: boolean
  title: string | null
  created_by: string | null
}

export type MessageRow = {
  id: string
  chat_id: string
  sender_id: string
  body: string | null
  video_url: string | null
  created_at: string
}

/** created: 2026-11-23T21:05:00-08:00 */
export type PostRow = {
  id: string
  author_id: string
  kind: 'text' | 'link' | 'picture' | 'video'
  body: string | null
  media_url: string | null
  created_at: string
}

/** created: 2026-11-23T21:05:00-08:00 — A6 nav shell */
export type Tab = 'home' | 'post' | 'chats' | 'play' | 'people' | 'me'
