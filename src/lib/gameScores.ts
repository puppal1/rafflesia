// created: 2026-11-23T22:15:00-08:00
import { supabase } from './supabase'

export type GameId = 'iconmatch' | 'snake' | 'blocks' | 'g2048' | 'tap'

export type ClubScore = {
  // created: 2026-11-23T22:15:00-08:00
  username: string
  display_name: string
  score: number
  created_at: string
}

/** created: 2026-11-23T22:15:00-08:00 */
export const GAMES: {
  id: GameId
  title: string
  blurb: string
  emoji: string
}[] = [
  { id: 'iconmatch', title: 'Icon Match', blurb: 'Flip cards — match icon pairs', emoji: '🃏' },
  { id: 'snake', title: 'Snake', blurb: 'Eat dots — don’t hit the wall', emoji: '🐍' },
  { id: 'blocks', title: 'Block Stack', blurb: 'Stack falling blocks (Tetris-like)', emoji: '🧱' },
  { id: 'g2048', title: '2048', blurb: 'Slide tiles — merge to 2048', emoji: '🔢' },
  { id: 'tap', title: 'Tap Party', blurb: 'Tap the icons before time’s up', emoji: '🎯' },
]

/** created: 2026-11-23T22:15:00-08:00 */
export async function submitScore(gameId: GameId, score: number) {
  const { error } = await supabase.rpc('submit_game_score', {
    p_game_id: gameId,
    p_score: Math.max(0, Math.floor(score)),
  })
  if (error) throw error
}

/** created: 2026-11-23T22:15:00-08:00 */
export async function fetchMyBest(gameId: GameId): Promise<number> {
  const { data, error } = await supabase.rpc('my_best_game_score', { p_game_id: gameId })
  if (error) return 0
  return Number(data) || 0
}

/** created: 2026-11-23T22:15:00-08:00 */
export async function fetchClubTop(gameId: GameId, limit = 10): Promise<ClubScore[]> {
  const { data, error } = await supabase.rpc('club_top_game_scores', {
    p_game_id: gameId,
    p_limit: limit,
  })
  if (error) return []
  return (data || []) as ClubScore[]
}
