// created: 2026-11-24T13:35:00-08:00 — emoji likes for posts/comments
// updated: 2026-11-24T14:20:00-08:00 — news article reactions

/** created: 2026-11-24T13:35:00-08:00 */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '⭐'] as const

export type ReactionTarget = 'post' | 'comment' | 'news'

export type ReactionRow = {
  // created: 2026-11-24T13:35:00-08:00
  target_type: ReactionTarget
  target_id: string
  user_id: string
  emoji: string
}

export type NewsReactionRow = {
  // created: 2026-11-24T14:20:00-08:00
  article_key: string
  user_id: string
  emoji: string
}

/** created: 2026-11-24T14:20:00-08:00 — map news rows into ReactionBar shape */
export function newsRowsAsReactions(rows: NewsReactionRow[]): ReactionRow[] {
  return rows.map((r) => ({
    target_type: 'news' as const,
    target_id: r.article_key,
    user_id: r.user_id,
    emoji: r.emoji,
  }))
}

/** created: 2026-11-24T13:35:00-08:00 */
export function tallyReactions(
  rows: ReactionRow[],
  targetType: ReactionTarget,
  targetId: string,
): { emoji: string; count: number; mine: boolean }[] {
  const map = new Map<string, { count: number; mine: boolean }>()
  for (const r of rows) {
    if (r.target_type !== targetType || r.target_id !== targetId) continue
    const cur = map.get(r.emoji) || { count: 0, mine: false }
    cur.count += 1
    map.set(r.emoji, cur)
  }
  return [...map.entries()]
    .map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
    .sort((a, b) => b.count - a.count)
}

/** created: 2026-11-24T13:35:00-08:00 */
export function myReactionEmoji(
  rows: ReactionRow[],
  targetType: ReactionTarget,
  targetId: string,
  userId: string,
): string | null {
  return rows.find((r) => r.target_type === targetType && r.target_id === targetId && r.user_id === userId)
    ?.emoji || null
}
