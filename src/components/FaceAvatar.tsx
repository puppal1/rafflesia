// created: 2026-11-23T22:00:00-08:00
// Avatar photo, else pack icon image, else emoji — used as face everywhere
import { iconEmoji, iconSrcOrEmpty } from '../lib/iconPacks'

type Props = {
  // created: 2026-11-23T22:00:00-08:00
  avatarUrl?: string | null
  iconPack?: string | null
  iconId?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** created: 2026-11-23T22:00:00-08:00 */
export function FaceAvatar({
  avatarUrl,
  iconPack,
  iconId,
  size = 'sm',
  className = '',
}: Props) {
  const iconSrc = iconSrcOrEmpty(iconPack, iconId)
  const dim = size === 'lg' ? 88 : size === 'md' ? 48 : 36

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
  if (iconSrc) {
    return (
      <img
        className={`face-avatar face-icon ${size} ${className}`.trim()}
        src={iconSrc}
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
