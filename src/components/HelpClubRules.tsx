// created: 2026-11-25T01:25:00-08:00 — PRD v4 J8 Help / club rules
import { TOS_PRIVACY_TEXT } from '../lib/tosCopy'

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  onBack: () => void
}

/** created: 2026-11-25T01:25:00-08:00 */
export function HelpClubRules({ onBack }: Props) {
  return (
    <div className="help-page">
      <button className="ghost btn-compact" type="button" onClick={onBack}>
        ← Back
      </button>
      <h2 className="panel-title">Help & club rules</h2>
      <p className="muted">Kid-readable tips for Rafflesia Online. This does not make you agree again.</p>

      <section className="help-section">
        <h3>Be kind</h3>
        <p>Talk like you would in class. No threats, bullying, or mean pile-ons.</p>
      </section>
      <section className="help-section">
        <h3>Reports</h3>
        <p>
          See something wrong? Use <strong>Report</strong> on a post, comment, or profile. Teachers see it — the other
          kid does not see your name.
        </p>
      </section>
      <section className="help-section">
        <h3>Messages</h3>
        <p>
          Private Messages are 1:1. Lounge is for Everyone, groups, and Announcements. The bell inbox is for club /
          social news — not private DMs (those badge Messages).
        </p>
      </section>
      <section className="help-section">
        {/* created: 2026-11-25T20:45:00-08:00 */}
        <h3>Group voice calls</h3>
        <p>
          Invite group chats can start a <strong>voice</strong> call (no video, no private DMs, not Everyone). Don’t use
          during class — school Chromebook rules still apply. Others could still record; leave anytime.
        </p>
      </section>
      <section className="help-section">
        <h3>Your media</h3>
        <p>Pictures and videos you post are your responsibility. Only share what you are OK with friends seeing.</p>
      </section>
      <section className="help-section">
        <h3>Passwords</h3>
        <p>
          Change your password on Me anytime. If you forget it, ask a teacher — they can set a temporary one. There is no
          email reset.
        </p>
      </section>
      <section className="help-section">
        <h3>Terms & privacy</h3>
        <pre className="help-tos">{TOS_PRIVACY_TEXT}</pre>
      </section>
    </div>
  )
}
