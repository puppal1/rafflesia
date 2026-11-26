// created: 2026-11-25T20:40:00-08:00 — PRD v5 Jitsi voice/video call sheet
// updated: 2026-11-25T20:45:00-08:00 — voice-only (camera off, no video toolbar)
import { useEffect, useRef, useState } from 'react'
import { endChatCall, jitsiRoomName, type CallSession } from '../lib/calls'

type Props = {
  // created: 2026-11-25T20:40:00-08:00
  call: CallSession
  displayName: string
  onClose: () => void
  onEnded?: () => void
}

type JitsiAPI = {
  dispose: () => void
  executeCommand: (cmd: string, ...args: unknown[]) => void
  addListener: (event: string, fn: () => void) => void
}

declare global {
  interface Window {
    // created: 2026-11-25T20:40:00-08:00
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiAPI
  }
}

let jitsiLoader: Promise<void> | null = null

/** created: 2026-11-25T20:40:00-08:00 */
function loadJitsiScript(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  if (jitsiLoader) return jitsiLoader
  jitsiLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://meet.jit.si/external_api.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load call engine (meet.jit.si). School Wi‑Fi may block it.'))
    document.body.appendChild(s)
  })
  return jitsiLoader
}

/** created: 2026-11-25T20:40:00-08:00 */
export function CallModal({ call, displayName, onClose, onEnded }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<JitsiAPI | null>(null)
  const [err, setErr] = useState('')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadJitsiScript()
        if (cancelled || !hostRef.current || !window.JitsiMeetExternalAPI) return
        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: jitsiRoomName(call.room_slug),
          parentNode: hostRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: displayName || 'Friend' },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            startAudioOnly: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            toolbarButtons: ['microphone', 'hangup', 'fullscreen'],
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'hangup', 'fullscreen'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        })
        apiRef.current = api
        api.addListener('readyToClose', () => {
          hangUp(false).catch(() => undefined)
        })
        api.addListener('videoConferenceLeft', () => {
          hangUp(false).catch(() => undefined)
        })
        setBooting(false)
      } catch (ex) {
        if (!cancelled) {
          setErr(ex instanceof Error ? ex.message : 'Could not start call.')
          setBooting(false)
        }
      }
    })().catch(() => undefined)

    return () => {
      cancelled = true
      try {
        apiRef.current?.dispose()
      } catch {
        /* ignore */
      }
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.id, call.room_slug, displayName])

  async function hangUp(endSession: boolean) {
    try {
      apiRef.current?.dispose()
    } catch {
      /* ignore */
    }
    apiRef.current = null
    if (endSession) {
      try {
        await endChatCall(call.id)
      } catch {
        /* ignore */
      }
      onEnded?.()
    }
    onClose()
  }

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-label="Voice call">
      <div className="call-sheet">
        <header className="call-sheet-head">
          <div>
            <p className="call-kicker">Group voice call</p>
            <h2 className="call-title">Rafflesia call</h2>
          </div>
          <div className="call-head-actions">
            <button className="ghost btn-compact" type="button" onClick={() => hangUp(false)}>
              Minimize
            </button>
            <button className="danger btn-compact" type="button" onClick={() => hangUp(true)}>
              End for everyone
            </button>
          </div>
        </header>
        {err ? <p className="error call-err">{err}</p> : null}
        {booting && !err ? <p className="muted call-boot">Connecting… allow microphone if asked.</p> : null}
        <div className="call-stage" ref={hostRef} />
        <p className="muted call-foot">
          Voice only — no camera. Don’t use during class. If this stays blank, school Wi‑Fi may block meet.jit.si.
        </p>
      </div>
    </div>
  )
}
