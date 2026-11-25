// created: 2026-11-25T01:25:00-08:00 — PRD v4 J7 chat stickers from icon packs
import { ICON_PACKS, type IconDef } from './iconPacks'

/** created: 2026-11-25T01:25:00-08:00 — packs that have PNG/SVG art */
export function stickerIcons(): IconDef[] {
  const out: IconDef[] = []
  for (const pack of ICON_PACKS) {
    for (const icon of pack.icons) {
      if (icon.imageUrl) out.push(icon)
    }
  }
  return out
}

/** created: 2026-11-25T01:25:00-08:00 */
export function encodeStickerBody(icon: IconDef): string {
  return `@@sticker:${icon.pack}/${icon.id}@@`
}

const STICKER_RE = /^@@sticker:([^/\s]+)\/([^\s@]+)@@$/i

/** created: 2026-11-25T01:25:00-08:00 */
export function parseStickerBody(body: string | null | undefined): IconDef | null {
  if (!body) return null
  const m = body.trim().match(STICKER_RE)
  if (!m) return null
  const pack = m[1]
  const id = m[2]
  for (const p of ICON_PACKS) {
    if (p.id !== pack) continue
    const hit = p.icons.find((i) => i.id === id)
    if (hit) return hit
  }
  return null
}
