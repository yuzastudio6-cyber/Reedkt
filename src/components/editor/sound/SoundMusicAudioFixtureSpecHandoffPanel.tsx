import { Badge } from '../../Badge'
import type { SoundMusicAudioFixtureSpecHandoffDisplay } from './buildSoundMusicAudioFixtureSpecHandoff'

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function listLabel(values: string[]): string {
  return values.length ? values.map(label).join(', ') : 'none'
}

export function SoundMusicAudioFixtureSpecHandoffPanel({
  handoff,
}: {
  handoff: SoundMusicAudioFixtureSpecHandoffDisplay
}) {
  const providerRows = Object.entries(handoff.providerCallAllowedByProvider)

  return (
    <>
      <details className="understanding-section" open>
        <summary>Generated/local fixture handoff packet</summary>
        <div className="renderer-badge-row">
          <Badge accent="warning">Handoff only</Badge>
          <Badge accent="danger">Fixture execution blocked</Badge>
          <Badge accent="cyan">{handoff.workstream}</Badge>
          <Badge accent="muted">{label(handoff.mode)}</Badge>
        </div>
        <p className="audio-tool-note">
          Mock-only review data. No fixture artifact, audio file, provider call, worker dispatch, Supabase mutation, SQL, storage write, signed URL, public artifact, generated asset, credit record, or approval record is created.
        </p>
        <div className="layout-mode-meta">
          <span><strong>Current stage</strong>{label(handoff.currentUnlockStage)}</span>
          <span><strong>Target future stage</strong>{label(handoff.targetFutureUnlockStage)}</span>
          <span><strong>Claims target passed</strong>{label(handoff.claimsGeneratedLocalFixturePassed)}</span>
          <span><strong>Handoff only</strong>{label(handoff.handoffOnly)}</span>
          <span><strong>Fixture artifact</strong>{handoff.fixtureArtifactId}</span>
          <span><strong>Checksum</strong>{handoff.expectedChecksumAlgorithm}</span>
          <span><strong>Private path</strong>{handoff.expectedPrivatePath}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Fixture source-of-truth requirements</summary>
        <div className="layout-mode-meta">
          <span><strong>Supabase row</strong>{label(handoff.sourceOfTruthPath.requiresSupabaseRow)}</span>
          <span><strong>Private GCS path</strong>{label(handoff.sourceOfTruthPath.requiresPrivateGcsPath)}</span>
          <span><strong>Manifest</strong>{label(handoff.sourceOfTruthPath.requiresManifest)}</span>
          <span><strong>Checksum</strong>{label(handoff.sourceOfTruthPath.requiresChecksum)}</span>
          <span><strong>Approved snapshot</strong>{label(handoff.sourceOfTruthPath.requiresApprovedPlanSnapshot)}</span>
          <span><strong>Signed URL source</strong>{label(handoff.sourceOfTruthPath.signedUrlsAreSourceOfTruth)}</span>
          <span><strong>Public URLs</strong>{label(handoff.sourceOfTruthPath.publicUrlsAllowed)}</span>
        </div>
        <div className="audio-qa-list">
          <span>Approved snapshot: {handoff.approvedSnapshotRequirementId}</span>
          <span>Timing manifest: {handoff.timingManifestRequirementId}</span>
          <span>Private artifact manifest: {handoff.privateArtifactManifestRequirementId}</span>
          <span>Checksum value: {handoff.expectedChecksumValue}</span>
        </div>
      </details>

      <details className="understanding-section">
        <summary>Fixture no-execution checklist</summary>
        <div className="layout-mode-meta">
          {handoff.noExecutionGates.map((gate) => (
            <span key={gate.label}><strong>{label(gate.label)}</strong>{label(gate.value)}</span>
          ))}
        </div>
        <p className="audio-tool-note">
          These gates are display-only review metadata. They do not start local fixture creation or any runtime path.
        </p>
      </details>

      <details className="understanding-section">
        <summary>Fixture provider and Lyria boundaries</summary>
        <div className="layout-mode-meta">
          <span><strong>Lyria music only</strong>{label(handoff.lyriaBoundary.musicOnly)}</span>
          <span><strong>Lyria families</strong>{listLabel(handoff.lyriaBoundary.allowedFamilies)}</span>
          <span><strong>Lyria SFX</strong>{label(handoff.lyriaBoundary.sfxAllowed)}</span>
          <span><strong>Lyria foley</strong>{label(handoff.lyriaBoundary.foleyAllowed)}</span>
          <span><strong>Lyria ambience</strong>{label(handoff.lyriaBoundary.ambienceAllowed)}</span>
          <span><strong>Lyria generation</strong>{label(handoff.lyriaBoundary.generationAllowed)}</span>
          <span><strong>Provider Gateway</strong>{label(handoff.lyriaBoundary.providerGatewayOwnerRequired)}</span>
        </div>
        <div className="clip-audio-plan-list">
          {providerRows.map(([providerId, mayCall]) => (
            <article className="clip-audio-plan-item" key={providerId}>
              <div>
                <span className="section-eyebrow">provider gate</span>
                <h4>{providerId}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Provider call allowed</strong>{label(mayCall)}</span>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Fixture owner acceptance map</summary>
        <div className="clip-audio-plan-list">
          {handoff.ownerAcceptanceMap.map((owner) => (
            <article className="clip-audio-plan-item" key={owner.owner}>
              <div>
                <span className="section-eyebrow">owner acceptance</span>
                <h4>{owner.owner}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Required before fixture</strong>{label(owner.requiredBeforeFixtureExecution)}</span>
                <span><strong>Accepted for spec only</strong>{label(owner.acceptedForSpecOnly)}</span>
                <span><strong>May execute</strong>{label(owner.mayExecute)}</span>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Fixture blockers and next prompt</summary>
        <div className="audio-qa-list">
          {handoff.blockedUses.map((blockedUse) => <span key={blockedUse}>{label(blockedUse)}</span>)}
        </div>
        <p className="audio-tool-note">{handoff.nextAllowedPromptRecommendation}</p>
      </details>
    </>
  )
}
