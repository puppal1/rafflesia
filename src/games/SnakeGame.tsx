// created: 2026-11-23T22:15:00-08:00
import { useEffect, useRef, useState } from 'react'
import { ScoreBoard } from './ScoreBoard'
import { useGameScores } from './useGameScores'

const SIZE = 16
const CELL = 18

type Pt = { x: number; y: number }

/** created: 2026-11-23T22:15:00-08:00 */
export function SnakeGame() {
  const { myBest, club, status, record } = useGameScores('snake')
  const [snake, setSnake] = useState<Pt[]>([{ x: 8, y: 8 }])
  const [dir, setDir] = useState<Pt>({ x: 1, y: 0 })
  const [food, setFood] = useState<Pt>({ x: 4, y: 4 })
  const [alive, setAlive] = useState(true)
  const [score, setScore] = useState(0)
  const dirRef = useRef(dir)
  const running = useRef(true)

  useEffect(() => {
    dirRef.current = dir
  }, [dir])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = dirRef.current
      if (e.key === 'ArrowUp' && d.y !== 1) setDir({ x: 0, y: -1 })
      if (e.key === 'ArrowDown' && d.y !== -1) setDir({ x: 0, y: 1 })
      if (e.key === 'ArrowLeft' && d.x !== 1) setDir({ x: -1, y: 0 })
      if (e.key === 'ArrowRight' && d.x !== -1) setDir({ x: 1, y: 0 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    running.current = true
    const tick = window.setInterval(() => {
      if (!running.current) return
      setSnake((prev) => {
        if (!alive) return prev
        const d = dirRef.current
        const head = { x: prev[0].x + d.x, y: prev[0].y + d.y }
        if (head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE) {
          running.current = false
          setAlive(false)
          record(score).catch(() => undefined)
          return prev
        }
        if (prev.some((p) => p.x === head.x && p.y === head.y)) {
          running.current = false
          setAlive(false)
          record(score).catch(() => undefined)
          return prev
        }
        const next = [head, ...prev]
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10)
          setFood({
            x: Math.floor(Math.random() * SIZE),
            y: Math.floor(Math.random() * SIZE),
          })
        } else next.pop()
        return next
      })
    }, 140)
    return () => window.clearInterval(tick)
  }, [alive, food.x, food.y, record, score])

  function restart() {
    setSnake([{ x: 8, y: 8 }])
    setDir({ x: 1, y: 0 })
    setFood({ x: 4, y: 4 })
    setScore(0)
    setAlive(true)
    running.current = true
  }

  return (
    <div className="game-panel">
      <ScoreBoard myBest={myBest} club={club} liveScore={score} />
      <p className="muted">{alive ? 'Arrow keys to move' : 'Game over — score saved'}</p>
      <div
        className="snake-board"
        style={{ width: SIZE * CELL, height: SIZE * CELL }}
      >
        {snake.map((p, i) => (
          <span
            key={`${p.x}-${p.y}-${i}`}
            className={i === 0 ? 'snake-cell head' : 'snake-cell'}
            style={{ left: p.x * CELL, top: p.y * CELL, width: CELL - 1, height: CELL - 1 }}
          />
        ))}
        <span
          className="snake-food"
          style={{ left: food.x * CELL, top: food.y * CELL, width: CELL - 1, height: CELL - 1 }}
        />
      </div>
      <div className="game-pad">
        <button type="button" className="ghost" onClick={() => setDir({ x: 0, y: -1 })}>↑</button>
        <div>
          <button type="button" className="ghost" onClick={() => setDir({ x: -1, y: 0 })}>←</button>
          <button type="button" className="ghost" onClick={() => setDir({ x: 1, y: 0 })}>→</button>
        </div>
        <button type="button" className="ghost" onClick={() => setDir({ x: 0, y: 1 })}>↓</button>
      </div>
      <button className="primary" type="button" onClick={restart}>
        Play again
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}
