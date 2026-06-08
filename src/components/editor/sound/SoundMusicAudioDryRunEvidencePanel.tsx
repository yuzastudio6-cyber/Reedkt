import { Badge } from '../../Badge'
import type { SoundMusicAudioDryRunEvidenceDisplay } from './buildSoundMusicAudioDryRunEvidence'

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function listLabel(values: string[]): string {
  return values.length ? values.map(label).join(', ') : 'none'
}

function EvidenceArticle({
  eyebrow,
  title,
  metadata,
  notes,
}: {
  eyebrow: string
  title: string
  metadata: Array<{ label: string; value: string | number | boolean | undefined }>
  notes?: string[]
}) {
  return (
    <article className="clip-audio-plan-item">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h4>{title}</h4>
      </div>
      <div className="layout-mode-meta">
        {metadata.map((item) => (
          <span key={item.label}><strong>{item.label}</strong>{label(item.value)}</span>
        ))}
      </div>
      {notes && notes.length > 0 && (
        <ul className="sfx-compact-list">
          {notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </article>
  )
}

export function SoundMusicAudioDryRunEvidencePanel({
  evidence,
}: {
  evidence: SoundMusicAudioDryRunEvidenceDisplay
}) {
  const noSideEffectGateRows = Object.entries(evidence.noSideEffectGates).map(([gate, value]) => ({
    label: gate,
    value,
  }))

  return (
    <>
      <details className="understanding-section" open>
        <summary>Mock dry-run contract evidence</summary>
        <div className="renderer-badge-row">
          <Badge accent="warning">Mock dry-run contract only</Badge>
          <Badge accent="danger">Real generation/export blocked</Badge>
          <Badge accent="cyan">{evidence.workstream}</Badge>
          <Badge accent="muted">{label(evidence.mode)}</Badge>
        </div>
        <p className="audio-tool-note">
          Display-only readiness evidence. No provider calls, worker dispatch, Supabase mutation, generated assets, public artifacts, storage writes, or signed URLs as source of truth are created.
        </p>

        <div className="layout-mode-meta">
          <span><strong>Dry-run request</strong>{evidence.dryRunRequestId}</span>
          <span><strong>Status</strong>{label(evidence.overallStatus)}</span>
          <span><strong>Current stage</strong>{label(evidence.currentUnlockStage)}</span>
          <span><strong>Next stage</strong>{label(evidence.nextUnlockStage)}</span>
          <span><strong>Next stage blocked</strong>{label(evidence.nextUnlockBlocked)}</span>
        </div>
        <div className="audio-qa-list">
          {evidence.blockedExplanation.map((reason) => <span key={reason}>{reason}</span>)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Structured findings / edit intents</summary>
        <div className="layout-mode-meta">
          <span><strong>Structured findings</strong>{evidence.structuredInputs.structuredFindingCount}</span>
          <span><strong>Edit intents</strong>{evidence.structuredInputs.editIntentCount}</span>
          <span><strong>Raw prompt execution</strong>{label(evidence.structuredInputs.rawPromptExecutionAllowed)}</span>
          <span><strong>Raw worker prompt present</strong>{label(evidence.structuredInputs.rawWorkerPromptPresent)}</span>
        </div>
        <div className="audio-qa-list">
          {evidence.structuredInputs.structuredFindingIds.map((id) => <span key={id}>{id}</span>)}
          {evidence.structuredInputs.editIntentIds.map((id) => <span key={id}>{id}</span>)}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Dry-run handoff evidence</summary>
        <div className="clip-audio-plan-list">
          <EvidenceArticle
            eyebrow="approved snapshot"
            title="Approved plan snapshot metadata"
            metadata={[
              { label: 'Snapshot id', value: evidence.approvedSnapshot.approvedPlanSnapshotId },
              { label: 'Approval status', value: evidence.approvedSnapshot.approvalStatus },
              { label: 'Checksum', value: evidence.approvedSnapshot.snapshotChecksum },
              { label: 'Plan version', value: evidence.approvedSnapshot.immutablePlanVersion },
              { label: 'Creates snapshot', value: evidence.approvedSnapshot.createsSnapshot },
              { label: 'Metadata only', value: evidence.approvedSnapshot.metadataOnly },
            ]}
            notes={evidence.approvedSnapshot.requiredFutureEvidence}
          />
          <EvidenceArticle
            eyebrow="SoundSync timing"
            title="Timing-aware cue manifest"
            metadata={[
              { label: 'Present', value: evidence.timingManifest.present },
              { label: 'Manifest id', value: evidence.timingManifest.cueManifestId },
              { label: 'Cue count', value: evidence.timingManifest.cueCount },
              { label: 'Timing anchors present', value: evidence.timingManifest.timingAnchorsPresent },
              { label: 'Track A final render', value: evidence.timingManifest.trackAFinalRenderReady },
              { label: 'Provider execution', value: evidence.timingManifest.providerExecutionReady },
              { label: 'Worker execution', value: evidence.timingManifest.workerExecutionReady },
            ]}
          />
          <EvidenceArticle
            eyebrow="private artifacts"
            title="Private audio artifact manifest"
            metadata={[
              { label: 'Present', value: evidence.privateArtifactManifest.present },
              { label: 'Manifest id', value: evidence.privateArtifactManifest.manifestId },
              { label: 'Storage scope', value: evidence.privateArtifactManifest.storageScope },
              { label: 'Public artifact allowed', value: evidence.privateArtifactManifest.publicArtifactAllowed },
              { label: 'Signed URLs present', value: evidence.privateArtifactManifest.signedUrlsPresent },
              { label: 'Public URLs present', value: evidence.privateArtifactManifest.publicUrlsPresent },
              { label: 'Generated assets created', value: evidence.privateArtifactManifest.generatedAssetsCreated },
            ]}
            notes={evidence.privateArtifactManifest.futureRequirements}
          />
          <EvidenceArticle
            eyebrow={evidence.providerGateway.owner}
            title="Provider Gateway handoff"
            metadata={[
              { label: 'Provider call', value: evidence.providerGateway.mayCallProvider },
              { label: 'Transport allowed', value: evidence.providerGateway.transportAllowed },
              { label: 'Provider secrets allowed', value: evidence.providerGateway.providerSecretsAllowed },
              { label: 'Fallback execution', value: evidence.providerGateway.fallbackExecutionAllowed },
            ]}
            notes={[
              `Planning only providers: ${listLabel(evidence.providerGateway.planningOnlyProviders)}`,
              `Blocked providers: ${listLabel(evidence.providerGateway.blockedProviders)}`,
              `License-gated candidates: ${listLabel(evidence.providerGateway.licenseGatedPlanningProviders)}`,
              `Processing-only tools: ${listLabel(evidence.providerGateway.processingOnlyProviders)}`,
              ...evidence.providerGateway.licenseEvidenceRequired,
            ]}
          />
          <EvidenceArticle
            eyebrow={evidence.workerRuntime.owner}
            title="Worker Runtime handoff"
            metadata={[
              { label: 'Worker dispatch', value: evidence.workerRuntime.mayDispatchWorker },
              { label: 'Worker payload created', value: evidence.workerRuntime.workerPayloadCreated },
              { label: 'Production payload allowed', value: evidence.workerRuntime.productionWorkerPayloadAllowed },
              { label: 'Requires approved snapshot', value: evidence.workerRuntime.requiresApprovedSnapshot },
              { label: 'Requires idempotency', value: evidence.workerRuntime.requiresIdempotencyKey },
              { label: 'Raw prompt execution', value: evidence.workerRuntime.rawPromptExecutionAllowed },
              { label: 'Signed URL input', value: evidence.workerRuntime.signedUrlInputAllowed },
              { label: 'Generated asset creation', value: evidence.workerRuntime.generatedAssetCreationAllowed },
            ]}
            notes={[
              `Mock idempotency metadata: ${evidence.workerRuntime.idempotencyKey}`,
              ...evidence.workerRuntime.requiredFutureContractFields,
            ]}
          />
          <EvidenceArticle
            eyebrow={evidence.supabaseStorage.owner}
            title="Supabase/RLS/Storage handoff"
            metadata={[
              { label: 'Supabase mutation', value: evidence.supabaseStorage.mayMutateSupabase },
              { label: 'SQL allowed', value: evidence.supabaseStorage.sqlAllowed },
              { label: 'Migration allowed', value: evidence.supabaseStorage.migrationAllowed },
              { label: 'Storage write', value: evidence.supabaseStorage.mayWriteStorage },
              { label: 'Signed URL source of truth', value: evidence.supabaseStorage.signedUrlSourceOfTruthAllowed },
              { label: 'Public artifact allowed', value: evidence.supabaseStorage.publicArtifactAllowed },
            ]}
            notes={evidence.supabaseStorage.requiredFutureTablesOrRecords}
          />
          <EvidenceArticle
            eyebrow={`${evidence.qaObservabilityBilling.observabilityOwner} / ${evidence.qaObservabilityBilling.billingOwner}`}
            title="QA / Observability / Cost / Billing handoff"
            metadata={[
              { label: 'QA evidence persisted', value: evidence.qaObservabilityBilling.qaEvidencePersisted },
              { label: 'Credit estimate created', value: evidence.qaObservabilityBilling.creditEstimateCreated },
              { label: 'Credit approval created', value: evidence.qaObservabilityBilling.creditApprovalCreated },
              { label: 'Credit reservation created', value: evidence.qaObservabilityBilling.creditReservationCreated },
              { label: 'Spend occurred', value: evidence.qaObservabilityBilling.spendOccurred },
              { label: 'Refund or release occurred', value: evidence.qaObservabilityBilling.refundOrReleaseOccurred },
            ]}
            notes={evidence.qaObservabilityBilling.auditEvidenceRequired}
          />
          <EvidenceArticle
            eyebrow={`${evidence.trackHandoffs.trackAOwner} / ${evidence.trackHandoffs.trackBOwner}`}
            title="Track A / Track B handoff"
            metadata={[
              { label: 'Track A final export ready', value: evidence.trackHandoffs.trackAFinalExportReady },
              { label: 'Final mux/export allowed', value: evidence.trackHandoffs.finalMuxExportAllowed },
              { label: 'Track B execution accepted', value: evidence.trackHandoffs.trackBExecutionAccepted },
            ]}
          />
        </div>
      </details>

      <details className="understanding-section">
        <summary>Google Lyria dry-run boundary</summary>
        <div className="layout-mode-meta">
          <span><strong>Provider</strong>{evidence.providerGateway.lyriaPlanning.providerId}</span>
          <span><strong>Families</strong>{listLabel(evidence.providerGateway.lyriaPlanning.allowedFamilies)}</span>
          <span><strong>Used for SFX/foley/ambience</strong>{label(evidence.providerGateway.lyriaPlanning.usedForSfxFoleyAmbience)}</span>
          <span><strong>Generation enabled</strong>{label(evidence.providerGateway.lyriaPlanning.generationEnabled)}</span>
          <span><strong>Provider Gateway required</strong>{label(evidence.providerGateway.lyriaPlanning.providerGatewayRequired)}</span>
        </div>
        <p className="audio-tool-note">
          Google Lyria is displayed only for music, song, and soundtrack planning metadata. It is not an SFX, foley, whoosh, hit, riser, ambience, or room-tone provider.
        </p>
      </details>

      <details className="understanding-section">
        <summary>No-side-effect runtime gates</summary>
        <div className="layout-mode-meta">
          {noSideEffectGateRows.map((gate) => (
            <span key={gate.label}><strong>{gate.label}</strong>{label(gate.value)}</span>
          ))}
        </div>
        <div className="audio-qa-list">
          {evidence.blockedUses.map((blockedUse) => <span key={blockedUse}>{label(blockedUse)}</span>)}
        </div>
        <ul className="sfx-compact-list">
          {evidence.futureRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
        </ul>
      </details>
    </>
  )
}
