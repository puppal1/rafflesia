// created: 2026-11-25T01:25:00-08:00 — PRD v4 J3 report control
import { useState } from 'react'
import { checkKidText, reportBlockedText } from '../lib/textChecker'
import { createContentReport, type ReportTarget } from '../lib/reports'

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  targetType: ReportTarget
  targetId: string
  busy?: boolean
  className?: string
}

/** created: 2026-11-25T01:25:00-08:00 */
export function ReportButton({ targetType, targetId, busy, className }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setLocalBusy(true)
    setErr('')
    try {
      const check = await checkKidText(reason)
      if (!check.ok) {
        await reportBlockedText('report', reason, check.matched)
        throw new Error(check.message)
      }
      await createContentReport(targetType, targetId, reason.trim())
      setDone(true)
      setReason('')
      setOpen(false)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not send report.')
    } finally {
      setLocalBusy(false)
    }
  }

  if (done) {
    return <span className="muted" style={{ fontSize: '0.85rem' }}>Reported — thanks</span>
  }

  return (
    <span className={className || ''} style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      {!open ? (
        <button
          className="ghost btn-compact"
          type="button"
          disabled={busy || localBusy}
          onClick={() => setOpen(true)}
        >
          Report
        </button>
      ) : (
        <div className="report-box">
          <label>
            Why report?
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 400))}
              placeholder="Short reason for a teacher"
              disabled={localBusy}
            />
          </label>
          <div className="row-actions" style={{ gap: 6 }}>
            <button
              className="danger btn-compact"
              type="button"
              disabled={localBusy || reason.trim().length < 3}
              onClick={submit}
            >
              Send report
            </button>
            <button className="ghost btn-compact" type="button" disabled={localBusy} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
          {err ? <p className="error">{err}</p> : null}
        </div>
      )}
    </span>
  )
}
