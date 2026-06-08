import { Badge } from '../../Badge'
import type { SoundMusicAudioOwnerAcceptanceChecklistDisplay } from './buildSoundMusicAudioOwnerAcceptanceChecklist'

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function listLabel(values: string[]): string {
  return values.length ? values.map(label).join(', ') : 'none'
}

export function SoundMusicAudioOwnerAcceptanceChecklistPanel({
  checklist,
}: {
  checklist: SoundMusicAudioOwnerAcceptanceChecklistDisplay
}) {
  return (
    <>
      <details className="understanding-section" open>
        <summary>Owner acceptance checklist</summary>
        <div className="renderer-badge-row">
          <Badge accent="warning">Checklist only</Badge>
          <Badge accent="danger">Execution not accepted</Badge>
          <Badge accent="cyan">{checklist.workstream}</Badge>
          <Badge accent="muted">{label(checklist.mode)}</Badge>
        </div>
        <p className="audio-tool-note">
          Mock-only owner readiness metadata. No fixture artifact, audio file, provider call, worker dispatch, Supabase mutation, SQL, storage write, signed URL, public artifact, generated asset, credit record, or approval record is created.
        </p>
        <div className="layout-mode-meta">
          <span><strong>Current stage</strong>{label(checklist.currentUnlockStage)}</span>
          <span><strong>Target future stage</strong>{label(checklist.targetFutureUnlockStage)}</span>
          <span><strong>Claims target passed</strong>{label(checklist.claimsGeneratedLocalFixturePassed)}</span>
          <span><strong>Handoff only</strong>{label(checklist.handoffOnly)}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Owner source-of-truth path</summary>
        <div className="layout-mode-meta">
          <span><strong>Supabase row</strong>{label(checklist.sourceOfTruthPath.requiresSupabaseRow)}</span>
          <span><strong>Private GCS path</strong>{label(checklist.sourceOfTruthPath.requiresPrivateGcsPath)}</span>
          <span><strong>Manifest</strong>{label(checklist.sourceOfTruthPath.requiresManifest)}</span>
          <span><strong>Checksum</strong>{label(checklist.sourceOfTruthPath.requiresChecksum)}</span>
          <span><strong>Approved snapshot</strong>{label(checklist.sourceOfTruthPath.requiresApprovedPlanSnapshot)}</span>
          <span><strong>Signed URL source</strong>{label(checklist.sourceOfTruthPath.signedUrlsAreSourceOfTruth)}</span>
          <span><strong>Public URLs</strong>{label(checklist.sourceOfTruthPath.publicUrlsAllowed)}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Owner execution path</summary>
        <div className="layout-mode-meta">
          <span><strong>User/chat request</strong>{label(checklist.executionPath.requiresUserChatRequest)}</span>
          <span><strong>Structured findings</strong>{label(checklist.executionPath.requiresStructuredAgentFindings)}</span>
          <span><strong>Edit intents</strong>{label(checklist.executionPath.requiresEditIntents)}</span>
          <span><strong>Approved snapshot</strong>{label(checklist.executionPath.requiresApprovedPlanSnapshot)}</span>
          <span><strong>Worker after acceptance</strong>{label(checklist.executionPath.workerExecutionOnlyAfterAcceptance)}</span>
          <span><strong>Raw prompt direct worker</strong>{label(checklist.executionPath.rawPromptDirectWorkerExecutionAllowed)}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Owner no-execution gates</summary>
        <div className="layout-mode-meta">
          {checklist.noExecutionGates.map((gate) => (
            <span key={gate.label}><strong>{label(gate.label)}</strong>{label(gate.value)}</span>
          ))}
        </div>
        <p className="audio-tool-note">
          These gates are display-only checklist metadata. They do not accept owner execution or start any runtime path.
        </p>
      </details>

      <details className="understanding-section">
        <summary>Owner acceptance map</summary>
        <div className="clip-audio-plan-list">
          {checklist.owners.map((owner) => (
            <article className="clip-audio-plan-item" key={owner.owner}>
              <div>
                <span className="section-eyebrow">owner checklist</span>
                <h4>{owner.owner}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Acceptance</strong>{label(owner.acceptanceStatus)}</span>
                <span><strong>Prepared</strong>{listLabel(owner.soundPrepared)}</span>
                <span><strong>Must accept</strong>{listLabel(owner.ownerMustAccept)}</span>
                <span><strong>Evidence</strong>{listLabel(owner.evidenceRequired)}</span>
                <span><strong>Forbidden bypasses</strong>{listLabel(owner.forbiddenBypasses)}</span>
              </div>
              <p className="audio-tool-note">{owner.nextRecommendedPrompt}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Owner blockers and next prompt</summary>
        <div className="audio-qa-list">
          {checklist.blockedUses.map((blockedUse) => <span key={blockedUse}>{label(blockedUse)}</span>)}
        </div>
        <p className="audio-tool-note">{checklist.recommendedImmediateNextPrompt}</p>
      </details>
    </>
  )
}
