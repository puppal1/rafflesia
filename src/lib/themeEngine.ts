// created: 2026-11-24T11:45:00-08:00 — hourly no-repeat pastel rotation + user picks
// updated: 2026-11-24T11:50:00-08:00 — user pick locks; no auto-rotate until Auto
import { THEMES, themeById, type ThemeDef, type ThemeId } from './themes'

const KEY_CURRENT = 'rafflesia_theme_id'
const KEY_USED = 'rafflesia_theme_used'
const KEY_HOUR = 'rafflesia_theme_hour'
const KEY_LOCKED = 'rafflesia_theme_locked' // '1' when user chose; skip hourly rotate

/** created: 2026-11-24T11:45:00-08:00 — bucket = calendar hour */
export function currentHourKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}`
}

/** created: 2026-11-24T11:50:00-08:00 */
export function isThemeLocked(): boolean {
  return localStorage.getItem(KEY_LOCKED) === '1'
}

/** created: 2026-11-24T11:45:00-08:00 */
function readUsed(): ThemeId[] {
  try {
    const raw = localStorage.getItem(KEY_USED)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(arr)) return []
    const ids = new Set(THEMES.map((t) => t.id))
    return arr.filter((x): x is ThemeId => typeof x === 'string' && ids.has(x as ThemeId))
  } catch {
    return []
  }
}

/** created: 2026-11-24T11:45:00-08:00 */
function writeUsed(used: ThemeId[]) {
  localStorage.setItem(KEY_USED, JSON.stringify(used))
}

/** created: 2026-11-24T11:45:00-08:00 */
export function applyTheme(theme: ThemeDef) {
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.style.setProperty('--wash-top', theme.washTop)
  root.style.setProperty('--wash-mid', theme.washMid)
  root.style.setProperty('--wash-edge', theme.washEdge)
  root.style.setProperty('--text', theme.text)
  root.style.setProperty('--muted', theme.muted)
  root.style.setProperty('--card-bg', theme.cardBg)
  root.style.setProperty('--card-border', theme.cardBorder)
  root.style.setProperty('--btn-primary', theme.btnPrimary)
  root.style.setProperty('--btn-primary-end', theme.btnPrimaryEnd)
  root.style.setProperty('--btn-ghost-bg', theme.btnGhostBg)
  root.style.setProperty('--btn-ghost-border', theme.btnGhostBorder)
  root.style.setProperty('--btn-ghost-text', theme.btnGhostText)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--input-border', theme.inputBorder)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.washMid)
  document.body.style.backgroundColor = theme.washMid
}

/** created: 2026-11-24T11:45:00-08:00 — rotate each hour unless user locked a pick */
export function ensureHourlyTheme(): ThemeDef {
  const savedId = localStorage.getItem(KEY_CURRENT)

  // User-chosen theme stays until they turn Auto back on
  if (isThemeLocked() && savedId) {
    const theme = themeById(savedId)
    applyTheme(theme)
    return theme
  }

  const hour = currentHourKey()
  const savedHour = localStorage.getItem(KEY_HOUR)
  if (savedHour === hour && savedId) {
    const theme = themeById(savedId)
    applyTheme(theme)
    return theme
  }

  let used = readUsed()
  let available = THEMES.map((t) => t.id).filter((id) => !used.includes(id))
  if (available.length === 0) {
    used = []
    writeUsed([])
    available = THEMES.map((t) => t.id)
  }
  const next = available[Math.floor(Math.random() * available.length)]
  writeUsed([...used, next])
  localStorage.setItem(KEY_CURRENT, next)
  localStorage.setItem(KEY_HOUR, hour)
  localStorage.removeItem(KEY_LOCKED)
  const theme = themeById(next)
  applyTheme(theme)
  return theme
}

/** created: 2026-11-24T11:45:00-08:00 — manual pick locks auto-rotate */
/** updated: 2026-11-24T11:50:00-08:00 */
export function setUserTheme(id: ThemeId): ThemeDef {
  const theme = themeById(id)
  let used = readUsed()
  if (!used.includes(id)) used = [...used, id]
  if (used.length >= THEMES.length) used = [id]
  writeUsed(used)
  localStorage.setItem(KEY_CURRENT, theme.id)
  localStorage.setItem(KEY_HOUR, currentHourKey())
  localStorage.setItem(KEY_LOCKED, '1')
  applyTheme(theme)
  return theme
}

/** created: 2026-11-24T11:50:00-08:00 — resume hourly rotation from next hour */
export function clearThemeLock(): ThemeDef {
  localStorage.removeItem(KEY_LOCKED)
  // force a fresh pick for this hour
  localStorage.removeItem(KEY_HOUR)
  return ensureHourlyTheme()
}

/** created: 2026-11-24T11:45:00-08:00 */
export function getCurrentThemeId(): ThemeId {
  return (localStorage.getItem(KEY_CURRENT) as ThemeId) || THEMES[0].id
}
