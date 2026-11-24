// created: 2026-11-23T22:15:00-08:00
import { useEffect, useState } from 'react'
import { ScoreBoard } from './ScoreBoard'
import { useGameScores } from './useGameScores'

type Grid = number[][]

function empty(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(0))
}

function spawn(g: Grid): Grid {
  const next = g.map((r) => [...r])
  const spots: { x: number; y: number }[] = []
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!next[y][x]) spots.push({ x, y })
  if (!spots.length) return next
  const s = spots[Math.floor(Math.random() * spots.length)]
  next[s.y][s.x] = Math.random() < 0.9 ? 2 : 4
  return next
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((n) => n)
  let gained = 0
  const out: number[] = []
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === nums[i + 1]) {
      out.push(nums[i] * 2)
      gained += nums[i] * 2
      i++
    } else out.push(nums[i])
  }
  while (out.length < 4) out.push(0)
  return { row: out, gained }
}

function move(g: Grid, dir: 'L' | 'R' | 'U' | 'D'): { grid: Grid; gained: number; moved: boolean } {
  let gained = 0
  let next = g.map((r) => [...r])
  const apply = (get: (i: number) => number[], set: (i: number, row: number[]) => void) => {
    for (let i = 0; i < 4; i++) {
      const { row, gained: g2 } = slideRow(get(i))
      set(i, row)
      gained += g2
    }
  }
  if (dir === 'L') apply((i) => next[i], (i, row) => { next[i] = row })
  if (dir === 'R') apply((i) => [...next[i]].reverse(), (i, row) => { next[i] = [...row].reverse() })
  if (dir === 'U') apply((i) => next.map((r) => r[i]), (i, row) => row.forEach((v, y) => { next[y][i] = v }))
  if (dir === 'D')
    apply(
      (i) => next.map((r) => r[i]).reverse(),
      (i, row) => [...row].reverse().forEach((v, y) => { next[y][i] = v }),
    )
  const moved = JSON.stringify(next) !== JSON.stringify(g)
  if (moved) next = spawn(next)
  return { grid: next, gained, moved }
}

function canMove(g: Grid) {
  for (const d of ['L', 'R', 'U', 'D'] as const) if (move(g, d).moved) return true
  return false
}

/** created: 2026-11-23T22:15:00-08:00 */
export function Game2048() {
  const { myBest, club, status, record } = useGameScores('g2048')
  const [grid, setGrid] = useState(() => spawn(spawn(empty())))
  const [score, setScore] = useState(0)
  const [alive, setAlive] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!alive) return
      const map: Record<string, 'L' | 'R' | 'U' | 'D'> = {
        ArrowLeft: 'L',
        ArrowRight: 'R',
        ArrowUp: 'U',
        ArrowDown: 'D',
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      setGrid((g) => {
        const res = move(g, dir)
        if (!res.moved) return g
        const nextScore = score + res.gained
        setScore(nextScore)
        if (!canMove(res.grid)) {
          setAlive(false)
          record(nextScore).catch(() => undefined)
        }
        return res.grid
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alive, record, score])

  function go(dir: 'L' | 'R' | 'U' | 'D') {
    if (!alive) return
    setGrid((g) => {
      const res = move(g, dir)
      if (!res.moved) return g
      const nextScore = score + res.gained
      setScore(nextScore)
      if (!canMove(res.grid)) {
        setAlive(false)
        record(nextScore).catch(() => undefined)
      }
      return res.grid
    })
  }

  function restart() {
    setGrid(spawn(spawn(empty())))
    setScore(0)
    setAlive(true)
  }

  return (
    <div className="game-panel">
      <ScoreBoard myBest={myBest} club={club} liveScore={score} />
      <p className="muted">{alive ? 'Arrow keys / buttons to slide' : 'No moves left — score saved'}</p>
      <div className="g2048-board">
        {grid.map((row, y) =>
          row.map((n, x) => (
            <div key={`${y}-${x}`} className={`g2048-cell n${n}`}>
              {n || ''}
            </div>
          )),
        )}
      </div>
      <div className="game-pad">
        <button type="button" className="ghost" onClick={() => go('U')}>↑</button>
        <div>
          <button type="button" className="ghost" onClick={() => go('L')}>←</button>
          <button type="button" className="ghost" onClick={() => go('R')}>→</button>
        </div>
        <button type="button" className="ghost" onClick={() => go('D')}>↓</button>
      </div>
      <button className="primary" type="button" onClick={restart}>New game</button>
      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}
