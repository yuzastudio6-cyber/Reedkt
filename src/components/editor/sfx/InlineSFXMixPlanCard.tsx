import { Badge } from '../../Badge'
import type { SFXMixPlanRecord } from '../../../types'
import { formatSFXLabel, formatSFXMs } from './sfxChatUiData'

type InlineSFXMixPlanCardProps = {
  mixPlan: SFXMixPlanRecord
  warnings: string[]
}

export function InlineSFXMixPlanCard({ mixPlan, warnings }: InlineSFXMixPlanCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-mix-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Volume / mix / ducking</span>
          <h3>{formatSFXLabel(mixPlan.volumeProfile)} mix</h3>
        </div>
        <Badge accent={mixPlan.duckUnderVoice ? 'success' : 'cyan'}>{mixPlan.duckUnderVoice ? 'Voice-first' : 'Planned mix'}</Badge>
      </div>

      {mixPlan.voicePresent && mixPlan.duckUnderVoice && (
        <p className="sfx-success">Voice-first mix: this SFX will stay under the speaker.</p>
      )}

      <div className="sfx-score-grid">
        <span><strong>Target gain hint</strong>{mixPlan.targetGainDb} dB</span>
        <span><strong>Duck under voice</strong>{formatSFXLabel(mixPlan.duckUnderVoice)}</span>
        <span><strong>Duck under music</strong>{formatSFXLabel(mixPlan.duckUnderMusic)}</span>
        <span><strong>Sidechain voice</strong>{formatSFXLabel(mixPlan.sidechainToVoice)}</span>
        <span><strong>Sidechain music</strong>{formatSFXLabel(mixPlan.sidechainToMusic)}</span>
        <span><strong>Fade in/out</strong>{formatSFXMs(mixPlan.fadeInMs)} / {formatSFXMs(mixPlan.fadeOutMs)}</span>
        <span><strong>Stereo width</strong>{mixPlan.stereoWidth}%</span>
        <span><strong>Priority</strong>{formatSFXLabel(mixPlan.mixPriority)}</span>
        <span><strong>Voice</strong>{formatSFXLabel(mixPlan.voicePresent)}</span>
        <span><strong>Music</strong>{formatSFXLabel(mixPlan.musicPresent)}</span>
        <span><strong>Ambience</strong>{formatSFXLabel(mixPlan.ambienceImportant)}</span>
        <span><strong>Status</strong>{formatSFXLabel(mixPlan.status)}</span>
      </div>

      <details className="sfx-details">
        <summary>EQ, reverb, and room match</summary>
        <ul className="sfx-compact-list">
          {mixPlan.eqNotes.map((note) => <li key={note}>{note}</li>)}
          <li>Reverb: {mixPlan.reverbMatch}</li>
          <li>Room: {mixPlan.roomMatch}</li>
        </ul>
      </details>

      {warnings.length > 0 && <p className="sfx-warning">{warnings.slice(0, 2).join(' ')}</p>}
    </section>
  )
}
