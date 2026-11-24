// created: 2026-11-24T11:45:00-08:00 — pastel theme swatch picker
// updated: 2026-11-24T11:50:00-08:00 — lock note + Auto rotate unlock
import { useEffect, useState } from 'react'
import { THEMES, type ThemeId } from '../lib/themes'
import {
  clearThemeLock,
  getCurrentThemeId,
  isThemeLocked,
  setUserTheme,
} from '../lib/themeEngine'

type Props = {
  // created: 2026-11-24T11:45:00-08:00
  compact?: boolean
  onPicked?: (id: ThemeId) => void
}

/** created: 2026-11-24T11:45:00-08:00 */
/** updated: 2026-11-24T11:50:00-08:00 */
export function ThemePicker({ compact, onPicked }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<ThemeId>(THEMES[0].id)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setActive(getCurrentThemeId())
    setLocked(isThemeLocked())
  }, [open])

  function pick(id: ThemeId) {
    // created: 2026-11-24T11:45:00-08:00 — locks so hourly rotate won't override
    setUserTheme(id)
    setActive(id)
    setLocked(true)
    onPicked?.(id)
    setOpen(false)
  }

  function useAuto() {
    // created: 2026-11-24T11:50:00-08:00
    const theme = clearThemeLock()
    setActive(theme.id)
    setLocked(false)
    onPicked?.(theme.id)
    setOpen(false)
  }

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
        <div className="theme-picker-panel" role="listbox" aria-label="Pastel themes">
          <p className="theme-picker-hint">
            {locked
              ? 'Your pick stays — hourly rotate is off until Auto.'
              : 'Auto changes every hour · no repeats until all 12 show.'}
          </p>
          <button className="theme-auto-btn" type="button" onClick={useAuto}>
            {locked ? 'Use Auto rotate' : 'Auto is on'}
          </button>
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
        </div>
      ) : null}
    </div>
  )
}
