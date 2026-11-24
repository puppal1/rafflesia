// created: 2026-11-23T22:15:00-08:00
// Soft Tetris-like: I/O/T/L pieces, line clear, score
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScoreBoard } from './ScoreBoard'
import { useGameScores } from './useGameScores'

const W = 10
const H = 16
const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
]

type Piece = { shape: number[][]; x: number; y: number }

function emptyBoard(): number[][] {
  return Array.from({ length: H }, () => Array(W).fill(0))
}

function randPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)].map((r) => [...r])
  return { shape, x: 3, y: 0 }
}

function collides(board: number[][], p: Piece) {
  for (let r = 0; r < p.shape.length; r++) {
    for (let c = 0; c < p.shape[r].length; c++) {
      if (!p.shape[r][c]) continue
      const x = p.x + c
      const y = p.y + r
      if (x < 0 || x >= W || y >= H) return true
      if (y >= 0 && board[y][x]) return true
    }
  }
  return false
}

function merge(board: number[][], p: Piece) {
  const next = board.map((row) => [...row])
  p.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return
      const y = p.y + r
      const x = p.x + c
      if (y >= 0 && y < H && x >= 0 && x < W) next[y][x] = 1
    }),
  )
  return next
}

function clearLines(board: number[][]) {
  const kept = board.filter((row) => row.some((c) => !c))
  const cleared = H - kept.length
  while (kept.length < H) kept.unshift(Array(W).fill(0))
  return { board: kept, cleared }
}

function rotate(shape: number[][]) {
  const rows = shape.length
  const cols = shape[0].length
  const out = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c]
  return out
}

/** created: 2026-11-23T22:15:00-08:00 */
export function BlocksGame() {
  const { myBest, club, status, record } = useGameScores('blocks')
  const [board, setBoard] = useState(emptyBoard)
  const [piece, setPiece] = useState<Piece>(randPiece)
  const [score, setScore] = useState(0)
  const [alive, setAlive] = useState(true)
  const pieceRef = useRef(piece)
  const boardRef = useRef(board)
  const scoreRef = useRef(0)

  useEffect(() => {
    pieceRef.current = piece
  }, [piece])
  useEffect(() => {
    boardRef.current = board
  }, [board])
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const hardDropLock = useCallback(() => {
    let p = pieceRef.current
    while (!collides(boardRef.current, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 }
    let nextBoard = merge(boardRef.current, p)
    const cleared = clearLines(nextBoard)
    nextBoard = cleared.board
    const add = cleared.cleared * 100 + 5
    const nextScore = scoreRef.current + add
    setScore(nextScore)
    setBoard(nextBoard)
    const np = randPiece()
    if (collides(nextBoard, np)) {
      setAlive(false)
      record(nextScore).catch(() => undefined)
    } else setPiece(np)
  }, [record])

  useEffect(() => {
    if (!alive) return
    const id = window.setInterval(() => {
      const p = pieceRef.current
      const b = boardRef.current
      const moved = { ...p, y: p.y + 1 }
      if (!collides(b, moved)) setPiece(moved)
      else hardDropLock()
    }, 500)
    return () => window.clearInterval(id)
  }, [alive, hardDropLock])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!alive) return
      const p = pieceRef.current
      const b = boardRef.current
      if (e.key === 'ArrowLeft') {
        const n = { ...p, x: p.x - 1 }
        if (!collides(b, n)) setPiece(n)
      }
      if (e.key === 'ArrowRight') {
        const n = { ...p, x: p.x + 1 }
        if (!collides(b, n)) setPiece(n)
      }
      if (e.key === 'ArrowDown') {
        const n = { ...p, y: p.y + 1 }
        if (!collides(b, n)) setPiece(n)
        else hardDropLock()
      }
      if (e.key === 'ArrowUp') {
        const n = { ...p, shape: rotate(p.shape) }
        if (!collides(b, n)) setPiece(n)
      }
      if (e.key === ' ') {
        e.preventDefault()
        hardDropLock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alive, hardDropLock])

  function restart() {
    setBoard(emptyBoard())
    setPiece(randPiece())
    setScore(0)
    setAlive(true)
  }

  const view = board.map((row) => [...row])
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return
      const y = piece.y + r
      const x = piece.x + c
      if (y >= 0 && y < H && x >= 0 && x < W) view[y][x] = 2
    }),
  )

  return (
    <div className="game-panel">
      <ScoreBoard myBest={myBest} club={club} liveScore={score} />
      <p className="muted">{alive ? '← → move · ↑ rotate · ↓/space drop' : 'Topped out — score saved'}</p>
      <div className="blocks-board">
        {view.map((row, y) => (
          <div className="blocks-row" key={y}>
            {row.map((cell, x) => (
              <span key={x} className={cell === 2 ? 'blocks-cell active' : cell ? 'blocks-cell filled' : 'blocks-cell'} />
            ))}
          </div>
        ))}
      </div>
      <div className="game-pad">
        <button type="button" className="ghost" onClick={() => {
          const n = { ...piece, x: piece.x - 1 }
          if (!collides(board, n)) setPiece(n)
        }}>←</button>
        <button type="button" className="ghost" onClick={() => {
          const n = { ...piece, shape: rotate(piece.shape) }
          if (!collides(board, n)) setPiece(n)
        }}>↻</button>
        <button type="button" className="ghost" onClick={() => {
          const n = { ...piece, x: piece.x + 1 }
          if (!collides(board, n)) setPiece(n)
        }}>→</button>
        <button type="button" className="ghost" onClick={hardDropLock}>Drop</button>
      </div>
      <button className="primary" type="button" onClick={restart}>Play again</button>
      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}
