// created: 2026-11-23T20:40:00-08:00
// Follow graph helpers — prefer security-definer RPCs; never trust empty RLS SELECT as “no follows”

import type { SupabaseClient } from '@supabase/supabase-js'

export type FollowCounts = {
  followers: Record<string, number>
  following: Record<string, number>
}

/** created: 2026-11-23T20:40:00-08:00 */
export async function fetchMyFollowingIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const rpc = await supabase.rpc('list_my_following')
  if (!rpc.error && Array.isArray(rpc.data)) {
    return new Set((rpc.data as string[]).map(String))
  }

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (error) throw error
  return new Set((data || []).map((r) => String(r.following_id)))
}

/** created: 2026-11-23T20:40:00-08:00 */
export async function fetchFollowCounts(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<FollowCounts> {
  const followers: Record<string, number> = {}
  const following: Record<string, number> = {}
  for (const id of profileIds) {
    followers[id] = 0
    following[id] = 0
  }

  // 1) Bulk RPC (works even when table SELECT is blocked)
  const rpc = await supabase.rpc('get_follow_counts')
  if (!rpc.error && rpc.data && typeof rpc.data === 'object') {
    const obj = rpc.data as Record<string, { followers?: number; following?: number }>
    for (const [id, row] of Object.entries(obj)) {
      followers[id] = Number(row?.followers || 0)
      following[id] = Number(row?.following || 0)
    }
    return { followers, following }
  }

  // 2) Direct table — only if we actually get rows (empty [] often means RLS, not zero follows)
  const edges = await supabase.from('follows').select('follower_id, following_id')
  if (!edges.error && edges.data && edges.data.length > 0) {
    for (const row of edges.data) {
      const a = String(row.follower_id)
      const b = String(row.following_id)
      following[a] = (following[a] || 0) + 1
      followers[b] = (followers[b] || 0) + 1
    }
    return { followers, following }
  }

  // 3) Per-user list RPCs
  await Promise.all(
    profileIds.map(async (id) => {
      const [fol, fing] = await Promise.all([
        supabase.rpc('list_user_followers', { p_user_id: id }),
        supabase.rpc('list_user_following', { p_user_id: id }),
      ])
      if (!fol.error && Array.isArray(fol.data)) followers[id] = fol.data.length
      if (!fing.error && Array.isArray(fing.data)) following[id] = fing.data.length
    }),
  )
  return { followers, following }
}

/** created: 2026-11-23T20:40:00-08:00 */
export async function toggleFollowRpc(
  supabase: SupabaseClient,
  otherUserId: string,
): Promise<'followed' | 'unfollowed'> {
  const { data, error } = await supabase.rpc('toggle_follow', {
    p_other_user_id: otherUserId,
  })
  if (error) throw error
  const result = String(data || '')
  if (result === 'unfollowed') return 'unfollowed'
  return 'followed'
}
