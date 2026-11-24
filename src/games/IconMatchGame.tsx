// created: 2026-11-23T22:15:00-08:00
import { useMemo, useState } from 'react'
import { allIcons } from '../lib/iconPacks'
import { ScoreBoard } from './ScoreBoard'
import { useGameScores } from './useGameScores'

type Card = { id: number; key: string; emoji: string; src?: string; open: boolean; done: boolean }

/** created: 2026-11-23T22:15:00-08:00 — higher score = fewer moves */
function buildDeck(): Card[] {
  const picks = allIcons().slice(0, 6)
  const pairs = [...picks, ...picks].map((icon, i) => ({
    id: i,
    key: icon.id,
    emoji: icon.emoji,
    src: icon.src,
    open: false,
    done: false,
  }))
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

/** created: 2026-11-23T22:15:00-08:00 */
export function IconMatchGame() {
  const { myBest, club, status, record } = useGameScores('iconmatch')
  const [cards, setCards] = useState<Card[]>(() => buildDeck())
  const [pick, setPick] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const done = useMemo(() => cards.every((c) => c.done), [cards])
  const score = done ? Math.max(0, 1200 - moves * 40) : 0

  function reset() {
    setCards(buildDeck())
    setPick([])
    setMoves(0)
    setLock(false)
  }

  async function flip(i: number) {
    if (lock || cards[i].open || cards[i].done || pick.includes(i)) return
    const next = cards.map((c, idx) => (idx === i ? { ...c, open: true } : c))
    const nextPick = [...pick, i]
    setCards(next)
    if (nextPick.length < 2) {
      setPick(nextPick)
      return
    }
    setMoves((m) => m + 1)
    setPick([])
    setLock(true)
    const [a, b] = nextPick
    if (next[a].key === next[b].key) {
      const matched = next.map((c, idx) =>
        idx === a || idx === b ? { ...c, done: true, open: true } : c,
      )
      setCards(matched)
      setLock(false)
      if (matched.every((c) => c.done)) {
        const s = Math.max(0, 1200 - (moves + 1) * 40)
        await record(s)
      }
    } else {
      window.setTimeout(() => {
        setCards((cur) =>
          cur.map((c, idx) => (idx === a || idx === b ? { ...c, open: false } : c)),
        )
        setLock(false)
      }, 550)
    }
  }

  return (
    <div className="game-panel">
      <ScoreBoard myBest={myBest} club={club} liveScore={done ? score : undefined} />
      <p className="muted">Moves: {moves}{done ? ` · Score ${score}` : ''}</p>
      <div className="match-grid">
        {cards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={c.done ? 'match-card done' : c.open ? 'match-card open' : 'match-card'}
            onClick={() => flip(i)}
            disabled={lock || c.done}
          >
            {c.open || c.done ? (
              c.src ? <img src={c.src} alt="" /> : <span>{c.emoji}</span>
            ) : (
              <span>?</span>
            )}
          </button>
        ))}
      </div>
      <button className="ghost" type="button" onClick={reset}>
        New round
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}
