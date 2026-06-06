import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import {
  buildSoundMusicAudioAccessSafety,
  buildSoundMusicAudioCueGroups,
  buildSoundMusicAudioHandoffItems,
  buildSoundMusicAudioLyriaPlanningMetadata,
  buildSoundMusicAudioPlanSummary,
  buildSoundMusicAudioProviderSummaries,
  buildSoundMusicAudioQaNotes,
  buildSoundMusicAudioRuntimeSummaries,
  buildSoundMusicAudioSoundSyncNotes,
  type SoundMusicAudioCueGroups,
  type SoundMusicAudioPlanCardProps,
} from './buildSoundMusicAudioPlanCardProps'
import type { SoundCuePlan } from '../../../types/audio-music'

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function timeLabel(cue: SoundCuePlan): string {
  return `${cue.startTimeSeconds.toFixed(2)}s-${cue.endTimeSeconds.toFixed(2)}s / ${cue.durationSeconds.toFixed(2)}s`
}

function CueList({
  cues,
  emptyLabel,
  onRemoveCueMock,
}: {
  cues: SoundCuePlan[]
  emptyLabel: string
  onRemoveCueMock?: (cueId: string) => void
}) {
  if (!cues.length) {
    return <p className="audio-tool-note">{emptyLabel}</p>
  }

  return (
    <div className="soundsync-cue-list">
      {cues.map((cue) => (
        <article className="soundsync-cue-item" key={cue.cueId}>
          <div>
            <span className="section-eyebrow">{label(cue.family)} / {timeLabel(cue)}</span>
            <h4>{label(cue.role)}</h4>
            <p>{cue.visualOrStoryReason}</p>
            <p className="audio-tool-note">{cue.promptIntent}</p>
            {cue.negativePromptIntent && <p className="audio-tool-note">Avoid: {cue.negativePromptIntent}</p>}
          </div>
          <div className="layout-mode-meta">
            <span><strong>Provider</strong>{cue.providerCandidate}</span>
            <span><strong>Provider status</strong>{label(cue.providerPolicyStatus)}</span>
            <span><strong>Runtime</strong>{label(cue.runtimeTarget)}</span>
            <span><strong>Anchor</strong>{label(cue.anchorType)}</span>
            <span><strong>Speech overlap</strong>{label(cue.speechOverlap)}</span>
            <span><strong>Ducking</strong>{cue.duckingRequired ? 'required' : 'not required'}</span>
            <span><strong>QA</strong>{label(cue.qaStatus)}</span>
            <span><strong>Approval</strong>{label(cue.approvalState)}</span>
          </div>
          <div className="understanding-chip-row">
            {cue.blockedReasons.map((reason) => <span className="quality-issue-badge" key={reason}>{label(reason)}</span>)}
            {cue.providerBlockedReasons.map((reason) => <span className="quality-issue-badge" key={reason}>{label(reason)}</span>)}
            {!cue.blockedReasons.length && !cue.providerBlockedReasons.length && <span className="voice-cleanup-badge">metadata only</span>}
          </div>
          {onRemoveCueMock && (
            <div className="inline-card-actions">
              <Button onClick={() => onRemoveCueMock(cue.cueId)} size="sm" variant="ghost">Remove cue</Button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function CueSections({
  groups,
  onRemoveCueMock,
}: {
  groups: SoundMusicAudioCueGroups
  onRemoveCueMock?: (cueId: string) => void
}) {
  return (
    <>
      <details className="understanding-section" open>
        <summary>Action/Foley SFX</summary>
        <p className="audio-tool-note">Transition sounds, whooshes, hits, risers, object motion, gesture, and title-card accents. No Lyria routing appears here.</p>
        <CueList
          cues={groups.actionFoley}
          emptyLabel="No action/foley SFX cues in this mock plan."
          onRemoveCueMock={onRemoveCueMock}
        />
      </details>

      <details className="understanding-section" open>
        <summary>Ambient / Everyday Soundscape</summary>
        <p className="audio-tool-note">Room tone, city, cafe, rain, nature, ambience matching, and audio beds stay subtle/background under speech.</p>
        <CueList
          cues={groups.ambience}
          emptyLabel="No ambience/everyday soundscape cues in this mock plan."
          onRemoveCueMock={onRemoveCueMock}
        />
      </details>

      <details className="understanding-section" open>
        <summary>Music / Soundtrack / Google Lyria planning</summary>
        <p className="audio-tool-note">Google Lyria is music/song/soundtrack planning metadata only. Provider Gateway is required, and generation is disabled.</p>
        <CueList
          cues={groups.music}
          emptyLabel="No music or soundtrack cue in this mock plan."
          onRemoveCueMock={onRemoveCueMock}
        />
      </details>
    </>
  )
}

export function SoundMusicAudioPlanCard(props: SoundMusicAudioPlanCardProps) {
  const cueGroups = props.cueGroups ?? buildSoundMusicAudioCueGroups(props.plan)
  const summary = props.summary ?? buildSoundMusicAudioPlanSummary({
    plan: props.plan,
    cueGroups,
    draftCreditEstimate: props.draftCreditEstimate,
    executionGateResults: props.executionGateResults,
    privateArtifactManifest: props.privateArtifactManifest,
  })
  const providerSummaries = props.providerSummaries ?? buildSoundMusicAudioProviderSummaries(props.plan)
  const runtimeSummaries = props.runtimeSummaries ?? buildSoundMusicAudioRuntimeSummaries(props.plan)
  const lyriaPlanning = props.lyriaPlanning ?? buildSoundMusicAudioLyriaPlanningMetadata({ cueGroups, providerSummaries })
  const handoffItems = props.handoffItems ?? buildSoundMusicAudioHandoffItems(props.handoffReadiness ?? props.plan.readiness)
  const qaNotes = props.qaNotes ?? buildSoundMusicAudioQaNotes({ plan: props.plan, qaWarnings: [] })
  const soundSyncNotes = props.soundSyncNotes ?? buildSoundMusicAudioSoundSyncNotes({
    timingManifest: props.timingManifest,
    toolRequests: props.toolRequests,
  })
  const accessSafety = props.accessSafety ?? buildSoundMusicAudioAccessSafety(props.privateArtifactManifest)
  const mode = props.mode ?? 'planning_only'

  return (
    <InlinePlanCardShell
      className="audio-pipeline-card sound-music-audio-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{summary.cueCount} cues</span>
          <span className="compact-summary-chip">{summary.actionFoleyCueCount} SFX</span>
          <span className="compact-summary-chip">{summary.ambienceCueCount} ambience</span>
          <span className="compact-summary-chip">{summary.musicCueCount} music</span>
          <span className="compact-summary-chip">{summary.duckingCueCount} ducking</span>
          <span className="compact-summary-chip">noSpendOccurred={label(summary.noSpendOccurred)}</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="SOUND_MUSIC_AUDIO"
      helper="Mock planning only. No provider call, worker dispatch, credit spend, storage write, generated asset, Supabase mutation, signed URL, provider secret, or service-role key is created."
      priority="developer_detail"
      status="warning"
      title="Sound/Music/Audio plan"
    >
      <div className="renderer-badge-row">
        <Badge accent="warning">Mock planning only</Badge>
        <Badge accent="danger">Real generation blocked</Badge>
        <Badge accent="cyan">{props.plan.workstreamId}</Badge>
        <Badge accent="muted">{label(mode)}</Badge>
      </div>

      <div className="audio-summary-grid">
        <span><strong>{summary.cueCount}</strong>total cues</span>
        <span><strong>{summary.actionFoleyCueCount}</strong>action/foley SFX</span>
        <span><strong>{summary.ambienceCueCount}</strong>ambience cues</span>
        <span><strong>{summary.musicCueCount}</strong>music cues</span>
        <span><strong>{summary.duckingCueCount}</strong>ducking required</span>
        <span><strong>{summary.blockedCueCount}</strong>blocked cues</span>
        <span><strong>{summary.estimatedCreditsMin ?? 0}-{summary.estimatedCreditsMax ?? 0}</strong>draft credits</span>
        <span><strong>{label(summary.noSpendOccurred)}</strong>noSpendOccurred</span>
      </div>

      <CueSections groups={cueGroups} onRemoveCueMock={props.onRemoveCueMock} />

      <details className="understanding-section" open={lyriaPlanning.present}>
        <summary>Google Lyria planning metadata</summary>
        <div className="layout-mode-meta">
          <span><strong>Provider</strong>{lyriaPlanning.providerId}</span>
          <span><strong>Families</strong>{lyriaPlanning.allowedFamilies.map(label).join(', ')}</span>
          <span><strong>Used for SFX/foley/ambience</strong>{label(lyriaPlanning.usedForSfxFoleyAmbience)}</span>
          <span><strong>Provider Gateway</strong>{lyriaPlanning.providerGatewayRequired ? 'required' : 'not required'}</span>
          <span><strong>Generation</strong>{lyriaPlanning.generationEnabled ? 'enabled' : 'disabled'}</span>
          <span><strong>Commercial/export</strong>{lyriaPlanning.commercialExportAllowed ? 'allowed' : 'blocked'}</span>
        </div>
        <div className="audio-qa-list">
          {lyriaPlanning.notes.map((note) => <span key={note}>{note}</span>)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Timing / SoundSync</summary>
        <div className="layout-mode-meta">
          <span><strong>Manifest</strong>{props.timingManifest?.cueManifestId ?? 'metadata pending'}</span>
          <span><strong>Anchors</strong>{props.timingManifest?.timingAnchors.map(label).join(', ') ?? 'none'}</span>
          <span><strong>Track A final render</strong>{props.timingManifest?.trackAFinalRenderReady ? 'ready' : 'not ready'}</span>
          <span><strong>Provider execution</strong>{props.timingManifest?.providerExecutionReady ? 'ready' : 'blocked'}</span>
          <span><strong>Worker execution</strong>{props.timingManifest?.workerExecutionReady ? 'ready' : 'blocked'}</span>
        </div>
        <ul className="sfx-compact-list">
          {soundSyncNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </details>

      <details className="understanding-section">
        <summary>QA / speech / ducking</summary>
        <div className="audio-qa-list">
          {qaNotes.map((note) => <span key={note}>{note}</span>)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Provider / license readiness</summary>
        <div className="clip-audio-plan-list">
          {providerSummaries.map((provider) => (
            <article className="clip-audio-plan-item" key={provider.providerId}>
              <div>
                <span className="section-eyebrow">{label(provider.planningRole)}</span>
                <h4>{provider.providerId}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Status</strong>{label(provider.status)}</span>
                <span><strong>Runtime</strong>{label(provider.runtimeTarget)}</span>
                <span><strong>Generation</strong>{provider.generationEnabled ? 'enabled' : 'disabled'}</span>
                <span><strong>Planning</strong>{provider.allowedForPlanning ? 'allowed' : 'blocked'}</span>
                <span><strong>License</strong>{label(provider.licenseStatus)}</span>
                <span><strong>Commercial/export</strong>{label(provider.commercialExportAllowed)}</span>
                <span><strong>Provider Gateway</strong>{provider.providerGatewayRequired ? 'required' : 'not required'}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="audio-tool-note">mayCallProvider={label(summary.mayCallProvider)}</p>
      </details>

      <details className="understanding-section">
        <summary>Runtime gates</summary>
        <div className="clip-audio-plan-list">
          {runtimeSummaries.map((runtime) => (
            <article className="clip-audio-plan-item" key={runtime.policyKey}>
              <div>
                <span className="section-eyebrow">{label(runtime.runtimeTarget)}</span>
                <h4>{runtime.policyKey}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Planning</strong>{runtime.planningAllowed ? 'allowed' : 'blocked'}</span>
                <span><strong>Generation</strong>{runtime.generationAllowed ? 'enabled' : 'disabled'}</span>
                <span><strong>Provider call</strong>{label(runtime.mayCallProvider)}</span>
                <span><strong>Worker dispatch</strong>{label(runtime.mayDispatchWorker)}</span>
                <span><strong>Generated asset</strong>{label(runtime.mayCreateGeneratedAsset)}</span>
                <span><strong>Handoffs</strong>{runtime.requiredHandoffs.join(', ') || 'none'}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="audio-tool-note">CPU metadata covers planning, QA, and mix/readiness. GPU metadata is future generation-candidate metadata only. mayDispatchWorker={label(summary.mayDispatchWorker)}; mayCreateGeneratedAsset={label(summary.mayCreateGeneratedAsset)}.</p>
      </details>

      <details className="understanding-section">
        <summary>Private manifests</summary>
        <div className="layout-mode-meta">
          <span><strong>Private artifact manifest</strong>{props.privateArtifactManifest?.manifestId ?? 'metadata pending'}</span>
          <span><strong>Timing cue manifest</strong>{props.timingManifest?.cueManifestId ?? 'metadata pending'}</span>
          <span><strong>Storage scope</strong>{label(accessSafety.storageScope)}</span>
          <span><strong>Public artifact allowed</strong>{label(accessSafety.publicArtifactAllowed)}</span>
          <span><strong>Signed URLs</strong>{accessSafety.signedUrlExposure ? 'present' : 'none'}</span>
          <span><strong>Provider secrets</strong>{accessSafety.providerSecretExposure ? 'present' : 'none'}</span>
          <span><strong>Service-role keys</strong>{accessSafety.serviceRoleKeyExposure ? 'present' : 'none'}</span>
        </div>
        <p className="audio-tool-note">{props.privateArtifactManifest?.provenanceSummary ?? 'No generated audio, storage object, public artifact, or provider call exists.'}</p>
      </details>

      <details className="understanding-section">
        <summary>Blocked uses</summary>
        <div className="audio-qa-list">
          {props.plan.blockedUses.map((reason) => <span key={reason}>{label(reason)}</span>)}
          {!props.plan.blockedUses.length && <span>Real generation remains fail-closed until future handoffs are complete.</span>}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Handoff readiness</summary>
        <div className="clip-audio-plan-list">
          {handoffItems.map((item) => (
            <article className="clip-audio-plan-item" key={item.label}>
              <div>
                <span className="section-eyebrow">{item.workstream ?? 'SOUND_MUSIC_AUDIO'}</span>
                <h4>{item.label}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Status</strong>{label(item.status)}</span>
                {item.finalExportReady === false && <span><strong>Final export</strong>not ready</span>}
                <span><strong>Evidence</strong>{item.requiredEvidence.join(', ') || 'future handoff evidence required'}</span>
              </div>
              <ul className="sfx-compact-list">
                {item.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </details>

      <div className="inline-card-actions">
        <Button disabled={!props.onApproveMock} onClick={props.onApproveMock} variant="primary">Approve plan preview</Button>
        <Button disabled={!props.onReviseMock} onClick={props.onReviseMock} variant="secondary">Revise sound plan</Button>
        <Button disabled={!props.onViewHandoffDetailsMock} onClick={props.onViewHandoffDetailsMock} variant="ghost">View handoff details</Button>
      </div>
    </InlinePlanCardShell>
  )
}
