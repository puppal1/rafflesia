// created: 2026-11-25T01:25:00-08:00 — PRD v4 J6 profile media grid
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MediaLightbox } from './MediaLightbox'
import type { PostRow } from '../types'

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  authorId: string
  onOpenPost?: (post: PostRow) => void
}

/** created: 2026-11-25T01:25:00-08:00 */
export function ProfileMediaGrid({ authorId, onOpenPost }: Props) {
  const [items, setItems] = useState<PostRow[]>([])
  const [err, setErr] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr('')
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', authorId)
        .in('kind', ['picture', 'video'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(60)
      if (cancelled) return
      if (error) {
        setErr(error.message)
        return
      }
      setItems((data || []) as PostRow[])
    })().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [authorId])

  return (
    <div className="profile-media-grid-wrap">
      <h3 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left' }}>
        Pictures & videos
      </h3>
      {err ? <p className="error">{err}</p> : null}
      {items.length === 0 ? (
        <p className="muted">No pictures or videos yet.</p>
      ) : (
        <div className="profile-media-grid">
          {items.map((p) => (
            <button
              key={p.id}
              type="button"
              className="profile-media-cell"
              onClick={() => {
                if (p.kind === 'picture' && p.media_url) setLightbox(p.media_url)
                onOpenPost?.(p)
              }}
              aria-label={p.kind === 'video' ? 'Open video' : 'Open picture'}
            >
              {p.kind === 'video' ? (
                p.media_url ? (
                  <video src={p.media_url} muted playsInline preload="metadata" />
                ) : (
                  <span>🎬</span>
                )
              ) : p.media_url ? (
                <img src={p.media_url} alt="" loading="lazy" />
              ) : (
                <span>🖼️</span>
              )}
            </button>
          ))}
        </div>
      )}
      <MediaLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}
