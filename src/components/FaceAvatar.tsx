// created: 2026-11-23T22:00:00-08:00
// updated: 2026-11-23T23:55:00-08:00 — avatar photo or emoji (no AI icon images)
// updated: 2026-11-24T12:40:00-08:00 — manga icon imageUrl platter (PRD v2 C3)
import { iconEmoji, iconImageUrl } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-23T22:00:00-08:00
  avatarUrl?: string | null
  iconPack?: string | null
  iconId?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** created: 2026-11-23T22:00:00-08:00 */
/** updated: 2026-11-23T23:55:00-08:00 */
/** updated: 2026-11-24T12:40:00-08:00 */
export function FaceAvatar({
  avatarUrl,
  iconPack,
  iconId,
  size = 'sm',
  className = '',
}: Props) {
  const dim = size === 'lg' ? 88 : size === 'md' ? 48 : 36
  const mangaUrl = iconImageUrl(iconPack, iconId)

  if (avatarUrl) {
    return (
      <img
        className={`face-avatar ${size} ${className}`.trim()}
        src={avatarUrl}
        alt=""
        width={dim}
        height={dim}
      />
    )
  }
  if (mangaUrl) {
    return (
      <img
        className={`face-avatar face-manga ${size} ${className}`.trim()}
        src={mangaUrl}
        alt=""
        width={dim}
        height={dim}
      />
    )
  }
  return (
    <span
      className={`face-avatar face-emoji ${size} ${className}`.trim()}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {iconEmoji(iconPack, iconId)}
    </span>
  )
}
