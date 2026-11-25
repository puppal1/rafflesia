// created: 2026-11-24T11:45:00-08:00 — pastel theme swatch picker
// updated: 2026-11-24T11:50:00-08:00 — lock note + Auto rotate unlock
// updated: 2026-11-24T12:55:00-08:00 — color palettes + manga hero/villain BGs
// updated: 2026-11-24T13:50:00-08:00 — character stickers as theme BGs
// updated: 2026-11-24T13:30:00-08:00 — None clears manga for real (no villain-night default)
// updated: 2026-11-24T22:30:00-08:00 — faith + civic manga character sections
// updated: 2026-11-25T01:10:00-08:00 — modal + category tabs; sticky Auto/Close (no endless scroll)
import { useEffect, useMemo, useState } from 'react'
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

type ThemeTab = 'colors' | 'scenes' | 'characters' | 'faith' | 'civic'

const baseUrl = import.meta.env.BASE_URL || '/'

const TABS: { id: ThemeTab; label: string }[] = [
  // created: 2026-11-25T01:10:00-08:00
  { id: 'colors', label: 'Colors' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'characters', label: 'Chars' },
  { id: 'faith', label: 'Faith' },
  { id: 'civic', label: 'Civic' },
]

/** created: 2026-11-24T11:45:00-08:00 */
/** updated: 2026-11-25T01:10:00-08:00 */
export function ThemePicker({ compact, onPicked }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ThemeTab>('colors')
  const [active, setActive] = useState<ThemeId>(THEMES[0].id)
  const [bgId, setBgId] = useState<MangaBgId>('none')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!open) return
    setActive(getCurrentThemeId())
    setBgId(getMangaBgId())
    setLocked(isThemeLocked())
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const scenes = useMemo(
    () =>
      MANGA_BGS.filter(
        (b) => b.group === 'off' || b.group === 'hero' || b.group === 'villain' || b.group === 'neutral',
      ),
    [],
  )
  const characters = useMemo(() => MANGA_BGS.filter((b) => b.group === 'character'), [])
  const faithChars = useMemo(() => MANGA_BGS.filter((b) => b.group === 'faith'), [])
  const civicChars = useMemo(() => MANGA_BGS.filter((b) => b.group === 'civic'), [])

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

  function renderBgGrid(items: typeof MANGA_BGS, includeNone: boolean) {
    return (
      <div className="theme-bg-grid">
        {includeNone ? (
          <button
            type="button"
            className={bgId === 'none' ? 'theme-bg-tile on' : 'theme-bg-tile'}
            onClick={() => pickBg('none')}
          >
            <span className="theme-bg-none">None</span>
            <span className="theme-swatch-name">No picture</span>
          </button>
        ) : null}
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            className={bgId === b.id ? 'theme-bg-tile on' : 'theme-bg-tile'}
            onClick={() => pickBg(b.id)}
          >
            {b.file ? (
              <img
                className={
                  b.group === 'character' || b.group === 'faith' || b.group === 'civic'
                    ? 'theme-bg-thumb theme-bg-char'
                    : 'theme-bg-thumb'
                }
                src={`${baseUrl}${b.folder}/${b.file}`}
                alt=""
              />
            ) : (
              <span className="theme-bg-none">None</span>
            )}
            <span className="theme-swatch-name">{b.name}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={compact ? 'theme-picker compact' : 'theme-picker'}>
      <button
        className="theme-picker-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Theme{locked ? ' · yours' : ''}
      </button>

      {open ? (
        <div
          className="theme-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Theme"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="theme-sheet">
            <header className="theme-sheet-head">
              <div className="theme-sheet-head-text">
                <h2 className="theme-sheet-title">Theme</h2>
                <p className="theme-picker-hint" style={{ margin: 0 }}>
                  {locked
                    ? 'Your color stays until Auto.'
                    : 'Auto rotates colors hourly. Pick a picture any time.'}
                </p>
              </div>
              <div className="theme-sheet-head-actions">
                <button
                  className={locked ? 'theme-auto-btn compact' : 'theme-auto-btn compact on'}
                  type="button"
                  onClick={useAuto}
                >
                  {locked ? 'Auto' : 'Auto on'}
                </button>
                <button className="ghost btn-compact" type="button" onClick={() => setOpen(false)}>
                  Done
                </button>
              </div>
            </header>

            <nav className="theme-sheet-tabs" aria-label="Theme sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tab === t.id ? 'theme-sheet-tab on' : 'theme-sheet-tab'}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="theme-sheet-body soft-scroll">
              {tab === 'colors' ? (
                <>
                  <p className="theme-picker-hint">Tap a palette to lock it.</p>
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
                </>
              ) : null}

              {tab === 'scenes' ? (
                <>
                  <p className="theme-picker-hint">
                    {bgId === 'none'
                      ? 'No picture — colors only.'
                      : 'Tap No picture to clear manga.'}
                  </p>
                  {renderBgGrid(scenes, false)}
                </>
              ) : null}

              {tab === 'characters' ? (
                <>
                  <p className="theme-picker-hint">Character stickers as full-screen background.</p>
                  {renderBgGrid(characters, true)}
                </>
              ) : null}

              {tab === 'faith' ? (
                <>
                  <p className="theme-picker-hint">Peaceful inclusive stickers.</p>
                  {renderBgGrid(faithChars, true)}
                </>
              ) : null}

              {tab === 'civic' ? (
                <>
                  <p className="theme-picker-hint">Classroom civics (non-partisan).</p>
                  {renderBgGrid(civicChars, true)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
