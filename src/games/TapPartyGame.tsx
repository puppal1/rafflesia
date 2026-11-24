// created: 2026-11-23T22:15:00-08:00
import { useEffect, useRef, useState } from 'react'
import { allIcons } from '../lib/iconPacks'
import { ScoreBoard } from './ScoreBoard'
import { useGameScores } from './useGameScores'

type Target = { id: number; emoji: string; x: number; y: number }

/** created: 2026-11-23T22:15:00-08:00 */
export function TapPartyGame() {
  const { myBest, club, status, record } = useGameScores('tap')
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(30)
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState<Target | null>(null)
  const scoreRef = useRef(0)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  function spawn() {
    const icons = allIcons()
    const icon = icons[Math.floor(Math.random() * icons.length)]
    setTarget({
      id: Date.now(),
      emoji: icon.emoji,
      x: 10 + Math.random() * 70,
      y: 10 + Math.random() * 60,
    })
  }

  function start() {
    setScore(0)
    setLeft(30)
    setRunning(true)
    spawn()
  }

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(t)
          setRunning(false)
          setTarget(null)
          record(scoreRef.current).catch(() => undefined)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [running, record])

  return (
    <div className="game-panel">
      <ScoreBoard myBest={myBest} club={club} liveScore={score} />
      <p className="muted">{running ? `Time ${left}s — tap the icon!` : left === 0 ? 'Time’s up — score saved' : '30-second tap rush'}</p>
      <div className="tap-arena">
        {target ? (
          <button
            type="button"
            className="tap-target"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            onClick={() => {
              if (!running) return
              setScore((s) => s + 1)
              spawn()
            }}
          >
            {target.emoji}
          </button>
        ) : (
          <span className="muted">Ready?</span>
        )}
      </div>
      <button className="primary" type="button" onClick={start} disabled={running}>
        {running ? 'Go!' : 'Start 30s'}
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}
