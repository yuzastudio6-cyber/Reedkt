import { classifyInitialOwnerResponseStatus, ownerDecisionForStatus } from './handoff-status-classifier'
import type { CrossWorkstreamEvidenceContext, OwnerResponseLedger, OwnerResponseRecord, WorkstreamId } from './cross-workstream-handoff-types'

export function buildOwnerResponseLedger(input: { runId: string; evidence: CrossWorkstreamEvidenceContext; createdAt: string }): OwnerResponseLedger {
  const records = input.evidence.workstreamDecisions.map((decision): OwnerResponseRecord => {
    const status = classifyInitialOwnerResponseStatus(decision.workstream)
    const prompt = input.evidence.ownerPromptPackets.find((packet) => packet.workstream === decision.workstream)
    const acceptedScope = status === 'accepted_with_blockers' ? acceptedScopeFor(decision.workstream) : []
    const blockedScope = Array.from(new Set([...decision.blockedScope, ...alwaysBlockedScope(decision.workstream)]))
    return {
      responseId: `phase52h-${decision.workstream.toLowerCase().replace(/_/g, '-')}-response`,
      workstream: decision.workstream,
      ownerChat: decision.requiredOwner,
      sourcePhase: '52G',
      sourceRunId: 'phase52g-20260606T033152',
      handoffPacketRef: prompt ? `${input.evidence.phase52GArtifactPrefixes.generatedAssets}/prompts/${prompt.fileName}` : 'missing_phase52g_prompt_reference',
      responseStatus: status,
      ownerDecision: ownerDecisionForStatus(decision.workstream, status),
      acceptedScope,
      blockedScope,
      nextPrompt: decision.recommendedNextPrompt,
      evidenceRefs: decision.evidence,
      blockers: blockedScope,
      risks: riskNotes(decision.workstream),
      contractsChanged: false,
      supabaseUpdateClassification: {
        updateRequired: status === 'pending' ? 'owner_response_pending' : 'milestone_status_only',
        updateStatus: 'ready_for_staging_review',
        environmentTouched: 'staging',
        sqlExecuted: false,
        migrationDeployed: false,
        nextSupabaseAction: 'Phase 52H milestone sync only through Phase 51D contract; owner responses may be recorded by a later intake phase.',
      },
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadMediaAllowed: false,
      publicArtifactAllowed: false,
      rawPromptExecutionAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    }
  })

  return {
    ledgerId: 'phase52h_owner_response_tracking_ledger',
    runId: input.runId,
    sourceRunId: 'phase52g-20260606T033152',
    records,
    pendingResponses: byStatus(records, 'pending'),
    acceptedResponses: byStatus(records, 'accepted'),
    blockedResponses: byStatus(records, 'blocked'),
    acceptedWithBlockersResponses: byStatus(records, 'accepted_with_blockers'),
    notes: [
      'Initial ledger is generated from Phase 52G owner handoff packet evidence.',
      'Pending means no owner response has been received in this Phase 52H scope.',
      'Accepted with blockers means prior evidence supports planning intake, while runtime/beta/production scope remains blocked.',
    ],
  }
}

function byStatus(records: OwnerResponseRecord[], status: OwnerResponseRecord['responseStatus']): WorkstreamId[] {
  return records.filter((record) => record.responseStatus === status).map((record) => record.workstream)
}

function acceptedScopeFor(workstream: WorkstreamId): string[] {
  if (workstream === 'MAP_GEOSPATIAL') return ['controlled internal map/geospatial planning evidence only', 'no live tiles/geocoding/routing']
  if (workstream === 'TRACK_A_RENDER_EXPORT') return ['internal private visual-video evidence handoff only', 'no final delivery or runtime execution here']
  if (workstream === 'TRACK_B_MEDIA_PROCESSING') return ['partial Track B evidence intake only', 'VLM and Demucs remain blocked']
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return ['milestone sync/readiness metadata only', 'no schema/RLS/migration work']
  return []
}

function alwaysBlockedScope(workstream: WorkstreamId): string[] {
  const common = ['production', 'external beta', 'paid production', 'broad media', 'public artifacts', 'raw prompt execution', 'signed URLs as source of truth']
  if (workstream === 'PROVIDER_GATEWAY_MODELS') return [...common, 'provider/model execution']
  if (workstream === 'WORKER_RUNTIME_JOBS') return [...common, 'worker/tool runtime execution']
  return common
}

function riskNotes(workstream: WorkstreamId): string[] {
  if (workstream === 'PROVIDER_GATEWAY_MODELS') return ['Provider execution could bypass approved owner gates if not kept blocked.']
  if (workstream === 'WORKER_RUNTIME_JOBS') return ['Worker execution could turn planning records into runtime actions before approved contracts exist.']
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return ['Milestone metadata is ready, but schema/RLS/migration work remains owner-gated.']
  return ['Owner response is required before broader internal test coordination can advance.']
}
