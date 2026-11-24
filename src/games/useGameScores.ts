// created: 2026-11-23T22:15:00-08:00
import { useCallback, useEffect, useState } from 'react'
import {
  fetchClubTop,
  fetchMyBest,
  submitScore,
  type ClubScore,
  type GameId,
} from '../lib/gameScores'

/** created: 2026-11-23T22:15:00-08:00 */
export function useGameScores(gameId: GameId) {
  const [myBest, setMyBest] = useState(0)
  const [club, setClub] = useState<ClubScore[]>([])
  const [status, setStatus] = useState('')

  const refresh = useCallback(async () => {
    const [mine, top] = await Promise.all([fetchMyBest(gameId), fetchClubTop(gameId)])
    setMyBest(mine)
    setClub(top)
  }, [gameId])

  useEffect(() => {
    refresh().catch(() => setStatus('Scores need sql-game-scores.sql in Supabase.'))
  }, [refresh])

  const record = useCallback(
    async (score: number) => {
      try {
        await submitScore(gameId, score)
        await refresh()
        if (score > myBest) setStatus(`New personal best: ${score}!`)
        else setStatus(`Score saved: ${score}`)
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Could not save score.')
      }
    },
    [gameId, myBest, refresh],
  )

  return { myBest, club, status, setStatus, record, refresh }
}
