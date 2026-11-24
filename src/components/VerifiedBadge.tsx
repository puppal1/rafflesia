// created: 2026-11-23T23:35:00-08:00
import type { VerifyTier } from '../types'

const LABELS: Record<Exclude<VerifyTier, null>, string> = {
  pink: 'Pink verified — Rafflesia Online creator',
  gold: 'Gold verified — honour / brand',
  blue: 'Blue verified',
}

type Props = {
  // created: 2026-11-23T23:35:00-08:00
  tier?: VerifyTier | string | null
  className?: string
}

/** created: 2026-11-23T23:35:00-08:00 — teacher-assigned verify check */
export function VerifiedBadge({ tier, className }: Props) {
  const t = tier === 'pink' || tier === 'gold' || tier === 'blue' ? tier : null
  if (!t) return null
  return (
    <span
      className={`verified-badge verified-${t}${className ? ` ${className}` : ''}`}
      title={LABELS[t]}
      aria-label={LABELS[t]}
      role="img"
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M7.2 12.4l2.8 2.8 6.8-6.8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/** created: 2026-11-23T23:35:00-08:00 */
export function NameWithBadge({
  name,
  tier,
  className,
}: {
  name: string
  tier?: VerifyTier | string | null
  className?: string
}) {
  return (
    <span className={className ? `name-with-badge ${className}` : 'name-with-badge'}>
      {name}
      <VerifiedBadge tier={tier} />
    </span>
  )
}
