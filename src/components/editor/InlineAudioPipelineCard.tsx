import { Badge } from '../Badge'
import type {
  AudioOperationPlan,
  ChatPlanningCardDescriptor,
  EditPlan,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineAudioPipelineCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function OperationList({ operations }: { operations: AudioOperationPlan[] }) {
  return (
    <div className="audio-operation-list">
      {operations.slice(0, 8).map((operation) => (
        <span className="audio-operation-item" key={operation.id}>
          <strong>{operation.label}</strong>
          {label(operation.toolId)} / {label(operation.status)}
        </span>
      ))}
    </div>
  )
}

export function InlineAudioPipelineCard({ descriptor, plan }: InlineAudioPipelineCardProps) {
  const audioPipelinePlan = plan.audioPipelinePlan

  if (!audioPipelinePlan) {
    return null
  }

  const clipPlans = audioPipelinePlan.clipPlans.slice(0, 4)
  const cues = audioPipelinePlan.soundSyncCues.slice(0, 6)

  return (
    <InlinePlanCardShell
      className="audio-pipeline-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{label(audioPipelinePlan.soundStyle)}</span>
          <span className="compact-summary-chip">{label(audioPipelinePlan.audioIntensity)}</span>
          <span className="compact-summary-chip">{audioPipelinePlan.clipPlans.length} clips</span>
          <span className="compact-summary-chip">{audioPipelinePlan.soundSyncCues.length} cues</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Professional audio planning"
      helper="Every ReeditPro edit gets a professional audio plan. Basic gets clean voice and loudness; Pro and Premium add deeper SoundSync, ducking, SFX, and timing where useful."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Audio + SoundSync"
    >
      <div className="audio-summary-grid">
        <span><strong>{label(audioPipelinePlan.soundStyle)}</strong>sound style</span>
        <span><strong>{label(audioPipelinePlan.audioIntensity)}</strong>intensity</span>
        <span><strong>{audioPipelinePlan.stages.length}</strong>stages</span>
        <span><strong>{audioPipelinePlan.toolsPlanned.length}</strong>tools planned</span>
        <span><strong>{audioPipelinePlan.clipPlans.length}</strong>clip plans</span>
        <span><strong>{audioPipelinePlan.soundSyncCues.length}</strong>SoundSync cues</span>
        <span><strong>{label(audioPipelinePlan.musicBedPlan.policy)}</strong>music policy</span>
        <span><strong>{label(audioPipelinePlan.sfxPlan.policy)}</strong>SFX policy</span>
      </div>

      <div className="understanding-chip-row">
        <span className="sound-style-badge">{label(audioPipelinePlan.soundStyle)}</span>
        <span className="audio-intensity-badge">{label(audioPipelinePlan.audioIntensity)}</span>
        <span className="voice-cleanup-badge">Voice cleanup</span>
        <span className="voice-cleanup-badge">Loudness</span>
        {audioPipelinePlan.musicBedPlan.duckingEnabled && <span className="ducking-badge">Ducking</span>}
        {audioPipelinePlan.sfxPlan.policy !== 'none' && <span className="sfx-policy-badge">SFX justified</span>}
        {audioPipelinePlan.beatSyncPlan.strategy !== 'none' && <span className="beat-sync-badge">Beat sync</span>}
        <span className="audio-tool-note">Planning only</span>
      </div>

      <div className="audio-stage-list">
        {audioPipelinePlan.stages.map((stage) => (
          <span key={stage}>{label(stage)}</span>
        ))}
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Project audio plan</summary>
        <p>{audioPipelinePlan.summary}</p>
        <OperationList operations={audioPipelinePlan.projectOperations} />
        <div className="audio-qa-list">
          {audioPipelinePlan.qaChecks.slice(0, 6).map((qaCheck) => (
            <span key={qaCheck}>{qaCheck}</span>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Clip audio plans</summary>
        <div className="clip-audio-plan-list">
          {clipPlans.map((clipPlan) => (
            <article className="clip-audio-plan-item" key={clipPlan.id}>
              <div>
                <span className="section-eyebrow">{label(clipPlan.voiceClarity)} voice</span>
                <h4>{clipPlan.clipLabel}</h4>
              </div>
              <div className="understanding-chip-row">
                {clipPlan.audioIssues.map((issue) => (
                  <span className="quality-issue-badge" key={issue}>{label(issue)}</span>
                ))}
              </div>
              <OperationList operations={[...clipPlan.cleanupOperations, ...clipPlan.loudnessOperations]} />
              <ul>
                {[...clipPlan.musicAndDuckingNotes, ...clipPlan.sfxNotes].slice(0, 3).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Music bed plan</summary>
        <article className="music-bed-plan">
          <div className="understanding-chip-row">
            <Badge accent="cyan">{label(audioPipelinePlan.musicBedPlan.policy)}</Badge>
            <span className="ducking-badge">{label(audioPipelinePlan.musicBedPlan.duckingStrength)} ducking</span>
          </div>
          <p>{audioPipelinePlan.musicBedPlan.reason}</p>
          <div className="layout-mode-meta">
            <span><strong>Energy</strong>{label(audioPipelinePlan.musicBedPlan.energy)}</span>
            <span><strong>Fade in/out</strong>{audioPipelinePlan.musicBedPlan.fadeInSeconds}s / {audioPipelinePlan.musicBedPlan.fadeOutSeconds}s</span>
            <span><strong>Avoid</strong>{audioPipelinePlan.musicBedPlan.avoidRules.join(' ')}</span>
            <span><strong>QA</strong>{audioPipelinePlan.musicBedPlan.qaChecks.join(' ')}</span>
          </div>
        </article>
      </details>

      <details className="understanding-section">
        <summary>SFX plan</summary>
        <article className="sfx-plan">
          <div className="understanding-chip-row">
            <span className="sfx-policy-badge">{label(audioPipelinePlan.sfxPlan.policy)}</span>
            <span className="audio-intensity-badge">{label(audioPipelinePlan.sfxPlan.intensity)}</span>
            <span className="audio-tool-note">{audioPipelinePlan.sfxPlan.maxSfxPerMinute}/min max</span>
          </div>
          <div className="audio-qa-list">
            {audioPipelinePlan.sfxPlan.allowedSfxTypes.map((sfxType) => (
              <span key={sfxType}>{sfxType}</span>
            ))}
          </div>
          <p>{audioPipelinePlan.sfxPlan.cues.join(' ') || 'No SFX planned unless the user requests it later.'}</p>
        </article>
      </details>

      <details className="understanding-section">
        <summary>SoundSync cues</summary>
        <div className="soundsync-cue-list">
          {cues.map((cue) => (
            <article className="soundsync-cue-item" key={cue.id}>
              <div>
                <span className="section-eyebrow">{label(cue.cueType)} / {cue.timeSeconds}s</span>
                <h4>{cue.linkedSegmentId ?? cue.linkedVisualAssetId ?? cue.id}</h4>
                <p>{cue.reason}</p>
              </div>
              <div className="understanding-chip-row">
                <span className="audio-intensity-badge">{label(cue.intensity)}</span>
                <span className="sound-style-badge">{label(cue.soundStyle)}</span>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Tool notes and limitations</summary>
        <div className="layout-mode-meta">
          <span><strong>Tools</strong>{audioPipelinePlan.toolsPlanned.map(label).join(', ')}</span>
          <span><strong>Tier notes</strong>{audioPipelinePlan.tierNotes.join(' ')}</span>
          <span><strong>Limitations</strong>{audioPipelinePlan.limitations.join(' ')}</span>
        </div>
        <p className="audio-tool-note">FFmpeg/Essentia/librosa/Rubber Band/whisper.cpp are future-worker planning responsibilities only. No tools execute in this demo.</p>
      </details>
    </InlinePlanCardShell>
  )
}
