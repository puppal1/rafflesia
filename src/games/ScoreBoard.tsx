// created: 2026-11-23T22:15:00-08:00
import type { ClubScore } from '../lib/gameScores'

type Props = {
  // created: 2026-11-23T22:15:00-08:00
  myBest: number
  club: ClubScore[]
  liveScore?: number
}

/** created: 2026-11-23T22:15:00-08:00 */
export function ScoreBoard({ myBest, club, liveScore }: Props) {
  return (
    <div className="score-board">
      <div className="score-pills">
        {liveScore != null ? <span className="score-pill">Now: {liveScore}</span> : null}
        <span className="score-pill mine">Your best: {myBest}</span>
        <span className="score-pill club">Club #1: {club[0]?.score ?? 0}</span>
      </div>
      <div className="club-top soft-scroll">
        <p className="friend-pick-heading">Club top scores</p>
        {club.length === 0 ? (
          <p className="muted">No club scores yet — be first!</p>
        ) : (
          <ol className="club-top-list">
            {club.map((row, i) => (
              <li key={`${row.username}-${row.created_at}-${i}`}>
                <strong>
                  #{i + 1} {row.display_name || row.username}
                </strong>
                <span className="muted"> @{row.username}</span>
                <span className="score-val">{row.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
