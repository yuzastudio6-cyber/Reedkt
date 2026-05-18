import type { MusicMixPlanRecord } from '../../../types/audio-music'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import { formatMusicLabel } from './musicChatUiData'

type InlineMusicMixPlanCardProps = {
  mixPlan: MusicMixPlanRecord
}

export function InlineMusicMixPlanCard({ mixPlan }: InlineMusicMixPlanCardProps) {
  return (
    <InlinePlanCardShell
      className="music-inline-card music-mix-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{mixPlan.targetVolumeDb} dB</span>
          <span className="compact-summary-chip">{formatMusicLabel(mixPlan.duckingStrategy)}</span>
          <span className="compact-summary-chip">{formatMusicLabel(mixPlan.status)}</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Mix plan"
      priority="advanced_plan_detail"
      status={mixPlan.status === 'ready' ? 'ready' : 'warning'}
      title="Music mix and ducking plan"
    >
      <div className="music-info-grid">
        <span><strong>Volume target</strong>{mixPlan.targetVolumeDb} dB</span>
        <span><strong>Ducking strategy</strong>{formatMusicLabel(mixPlan.duckingStrategy)}</span>
        <span><strong>Ducking amount</strong>{mixPlan.duckingAmountDb} dB</span>
        <span><strong>Duck under speech</strong>{mixPlan.duckUnderSpeech ? 'Yes' : 'No'}</span>
        <span><strong>Intro fade</strong>{mixPlan.introFadeSeconds}s</span>
        <span><strong>Outro fade</strong>{mixPlan.outroFadeSeconds}s</span>
        <span><strong>Crossfade previous</strong>{mixPlan.crossfadeWithPreviousSeconds}s</span>
        <span><strong>Crossfade next</strong>{mixPlan.crossfadeWithNextSeconds}s</span>
        <span><strong>Ambient bridge</strong>{mixPlan.ambientBridgeNeeded ? 'Needed' : 'Not needed'}</span>
        <span><strong>SFX relationship</strong>{mixPlan.sfxRelationship}</span>
      </div>
      <details className="compact-card-details">
        <summary>Show mix notes</summary>
        <div className="music-issue-list">
          {[...mixPlan.beatSyncPoints, ...mixPlan.silenceMoments, ...mixPlan.mixNotes].map((note) => (
            <div key={note}>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
