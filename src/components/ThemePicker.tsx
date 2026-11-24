// created: 2026-11-24T11:45:00-08:00 — pastel theme swatch picker
// updated: 2026-11-24T11:50:00-08:00 — lock note + Auto rotate unlock
// updated: 2026-11-24T12:55:00-08:00 — color palettes + manga hero/villain BGs
// updated: 2026-11-24T13:50:00-08:00 — character stickers as theme BGs
import { useEffect, useState } from 'react'
import { THEMES, type ThemeId } from '../lib/themes'
import { MANGA_BGS, type MangaBgId } from '../lib/mangaBgs'
import {
  clearThemeLock,
  getCurrentThemeId,
  getMangaBgId,
  isThemeLocked,
  setMangaBg,
  setUserTheme,
} from '../lib/themeEngine'

type Props = {
  // created: 2026-11-24T11:45:00-08:00
  compact?: boolean
  onPicked?: (id: ThemeId) => void
}

const baseUrl = import.meta.env.BASE_URL || '/'

/** created: 2026-11-24T11:45:00-08:00 */
/** updated: 2026-11-24T13:50:00-08:00 */
export function ThemePicker({ compact, onPicked }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<ThemeId>(THEMES[0].id)
  const [bgId, setBgId] = useState<MangaBgId>('none')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setActive(getCurrentThemeId())
    setBgId(getMangaBgId())
    setLocked(isThemeLocked())
  }, [open])

  function pick(id: ThemeId) {
    setUserTheme(id)
    setActive(id)
    setLocked(true)
    onPicked?.(id)
  }

  function pickBg(id: MangaBgId) {
    setMangaBg(id)
    setBgId(id)
  }

  function useAuto() {
    const theme = clearThemeLock()
    setActive(theme.id)
    setLocked(false)
    onPicked?.(theme.id)
  }

  const scenes = MANGA_BGS.filter((b) => b.group !== 'character')
  const characters = MANGA_BGS.filter((b) => b.group === 'character')

  return (
    <div className={compact ? 'theme-picker compact' : 'theme-picker'}>
      <button
        className="theme-picker-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Theme{locked ? ' · yours' : ''}
      </button>
      {open ? (
        <div className="theme-picker-panel" role="listbox" aria-label="Theme colors and backgrounds">
          <p className="theme-picker-hint">
            {locked
              ? 'Your color stays — hourly rotate is off until Auto.'
              : 'Auto changes colors every hour. Pick a manga scene or character any time.'}
          </p>
          <button className="theme-auto-btn" type="button" onClick={useAuto}>
            {locked ? 'Use Auto rotate' : 'Auto is on'}
          </button>

          <h3 className="theme-section-title">Colors</h3>
          <div className="theme-swatch-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={active === t.id}
                className={active === t.id ? 'theme-swatch on' : 'theme-swatch'}
                title={t.name}
                onClick={() => pick(t.id)}
              >
                <span
                  className="theme-swatch-colors"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 55%, ${t.swatch[2]} 100%)`,
                  }}
                />
                <span className="theme-swatch-name">{t.name}</span>
              </button>
            ))}
          </div>

          <h3 className="theme-section-title">Manga scenes</h3>
          <p className="theme-picker-hint">Hero · Villain · Neutral scenes</p>
          <div className="theme-bg-grid">
            {scenes.map((b) => (
              <button
                key={b.id}
                type="button"
                className={bgId === b.id ? 'theme-bg-tile on' : 'theme-bg-tile'}
                onClick={() => pickBg(b.id)}
              >
                {b.file ? (
                  <img className="theme-bg-thumb" src={`${baseUrl}${b.folder}/${b.file}`} alt="" />
                ) : (
                  <span className="theme-bg-none">None</span>
                )}
                <span className="theme-swatch-name">{b.name}</span>
              </button>
            ))}
          </div>

          <h3 className="theme-section-title">Manga characters</h3>
          <p className="theme-picker-hint">Same stickers as icons — use as full-screen background</p>
          <div className="theme-bg-grid">
            {characters.map((b) => (
              <button
                key={b.id}
                type="button"
                className={bgId === b.id ? 'theme-bg-tile on' : 'theme-bg-tile'}
                onClick={() => pickBg(b.id)}
              >
                <img className="theme-bg-thumb theme-bg-char" src={`${baseUrl}${b.folder}/${b.file}`} alt="" />
                <span className="theme-swatch-name">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
