// created: 2026-11-23T22:15:00-08:00
import { useState } from 'react'
import { FaceAvatar } from '../components/FaceAvatar'
import { GAMES, type GameId } from '../lib/gameScores'
import type { Profile } from '../types'
import { BlocksGame } from './BlocksGame'
import { Game2048 } from './Game2048'
import { IconMatchGame } from './IconMatchGame'
import { SnakeGame } from './SnakeGame'
import { TapPartyGame } from './TapPartyGame'

type Props = {
  // created: 2026-11-23T22:15:00-08:00
  matchFriends: Profile[]
  onOpenProfile: (p: Profile) => void
  onMessage: (p: Profile) => void
  busy?: boolean
  niceName: (p?: Profile | null) => string
}

/** created: 2026-11-23T22:15:00-08:00 */
export function PlayHub({ matchFriends, onOpenProfile, onMessage, busy, niceName }: Props) {
  const [game, setGame] = useState<GameId | null>(null)

  if (game === 'iconmatch') {
    return (
      <div>
        <button className="ghost" type="button" onClick={() => setGame(null)} style={{ marginBottom: 10 }}>
          ← All games
        </button>
        <h2 className="panel-title">Icon Match</h2>
        <IconMatchGame />
      </div>
    )
  }
  if (game === 'snake') {
    return (
      <div>
        <button className="ghost" type="button" onClick={() => setGame(null)} style={{ marginBottom: 10 }}>
          ← All games
        </button>
        <h2 className="panel-title">Snake</h2>
        <SnakeGame />
      </div>
    )
  }
  if (game === 'blocks') {
    return (
      <div>
        <button className="ghost" type="button" onClick={() => setGame(null)} style={{ marginBottom: 10 }}>
          ← All games
        </button>
        <h2 className="panel-title">Block Stack</h2>
        <BlocksGame />
      </div>
    )
  }
  if (game === 'g2048') {
    return (
      <div>
        <button className="ghost" type="button" onClick={() => setGame(null)} style={{ marginBottom: 10 }}>
          ← All games
        </button>
        <h2 className="panel-title">2048</h2>
        <Game2048 />
      </div>
    )
  }
  if (game === 'tap') {
    return (
      <div>
        <button className="ghost" type="button" onClick={() => setGame(null)} style={{ marginBottom: 10 }}>
          ← All games
        </button>
        <h2 className="panel-title">Tap Party</h2>
        <TapPartyGame />
      </div>
    )
  }

  return (
    <div>
      <h2 className="panel-title">Play</h2>
      <p className="muted">Pick a game — each keeps your best + club top scores</p>
      <div className="game-pick-grid">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className="game-pick-tile" onClick={() => setGame(g.id)}>
            <span className="game-pick-emoji">{g.emoji}</span>
            <strong>{g.title}</strong>
            <span className="muted">{g.blurb}</span>
          </button>
        ))}
      </div>

      <h3 className="panel-title" style={{ fontSize: '1rem', marginTop: 18 }}>
        Matches
      </h3>
      <p className="muted">Friends on the same icon pack</p>
      <div className="list">
        {matchFriends.length === 0 ? (
          <p className="muted">No matches yet — ask friends to pick the same pack on Me.</p>
        ) : (
          matchFriends.map((p) => (
            <div className="row" key={p.id}>
              <button type="button" className="row-main linkish people-row" onClick={() => onOpenProfile(p)}>
                <FaceAvatar avatarUrl={p.avatar_url} iconPack={p.icon_pack} iconId={p.icon_id} size="sm" />
                <span>
                  <p className="row-title">{niceName(p)}</p>
                  <p className="row-sub">@{p.username}</p>
                </span>
              </button>
              <div className="row-actions">
                <button className="primary" type="button" disabled={busy} onClick={() => onMessage(p)}>
                  Message
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
