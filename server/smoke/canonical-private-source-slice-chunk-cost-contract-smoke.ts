import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  isCanonicalPrivateMeteredSourceSliceChunkProfileId,
} from '../../src/types/canonical-private-composition-capacity'
import { PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS } from
  '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  canonicalPrivateJobCompletionRecoveryRecordSchema,
} from '../validation/canonical-private-job-completion-recovery-schemas'
import {
  isCanonicalPrivateCompositionChunkCaptionCueCount,
} from '../services/canonical-private-tool-dispatch-authority-service'

assert.equal(
  isCanonicalPrivateMeteredSourceSliceChunkProfileId(
    CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  ),
  true,
)
assert.equal(
  isCanonicalPrivateMeteredSourceSliceChunkProfileId(
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  ),
  true,
)
assert.equal(
  isCanonicalPrivateMeteredSourceSliceChunkProfileId(
    'canonical_private_4k_chunk_merge_1920_frames_v1',
  ),
  false,
)
assert.equal(isCanonicalPrivateCompositionChunkCaptionCueCount(-1), false)
assert.equal(isCanonicalPrivateCompositionChunkCaptionCueCount(0), true)
assert.equal(isCanonicalPrivateCompositionChunkCaptionCueCount(7), true)
assert.equal(isCanonicalPrivateCompositionChunkCaptionCueCount(8), false)
assert.equal(isCanonicalPrivateCompositionChunkCaptionCueCount(1.5), false)

const meteredRemotionRecovery = createRecoveryRecord({
  canonicalToolId: 'remotion',
  internalAttemptCostProfileId:
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
  internalAttemptCostEvidenceHash: sha('cost'),
  attemptCostEvidenceRecorded: true,
})
assert.equal(
  canonicalPrivateJobCompletionRecoveryRecordSchema.safeParse(
    meteredRemotionRecovery,
  ).success,
  true,
)
assert.equal(
  canonicalPrivateJobCompletionRecoveryRecordSchema.safeParse({
    ...meteredRemotionRecovery,
    evidence: {
      ...meteredRemotionRecovery.evidence,
      internalAttemptCostProfileId: null,
    },
  }).success,
  false,
)
assert.equal(
  canonicalPrivateJobCompletionRecoveryRecordSchema.safeParse({
    ...meteredRemotionRecovery,
    evidence: {
      ...meteredRemotionRecovery.evidence,
      internalAttemptCostEvidenceHash: null,
    },
  }).success,
  false,
)

console.log(
  JSON.stringify(
    {
      smoke: 'canonical-private-source-slice-chunk-cost-contract',
      meteredProfiles: [
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
      ],
      legacyUnmeteredProfile:
        'canonical_private_4k_chunk_merge_1920_frames_v1',
      meteredRemotionCompletionRecovery: true,
    },
    null,
    2,
  ),
)

function createRecoveryRecord(input: {
  canonicalToolId: string | null
  internalAttemptCostProfileId: string | null
  internalAttemptCostEvidenceHash: string | null
  attemptCostEvidenceRecorded: boolean
}) {
  const response = {
    schemaVersion: 'canonical-private-job-execution-adapter-response-v4' as const,
    source: 'canonical_private_job_execution_adapter' as const,
    purpose: 'execute_canonical_private_job' as const,
    identity: {
      workspaceId: 'workspace',
      projectId: 'project',
      editSessionId: 'edit',
      approvedPlanSnapshotId: 'snapshot',
      jobId: 'job',
      approvedWorkItemId: 'work',
      expectedAssetId: 'asset',
      canonicalToolId: input.canonicalToolId,
      operationId: 'tool.remotion.render_approved_composition.v1',
      runnerClass: 'offline_remotion_render_execution_v1',
    },
    result: {
      artifactId: 'artifact',
      contentType: 'video/mp4',
      sha256: sha('artifact'),
      byteLength: 1,
      qaOutcome: 'passed' as const,
      reconciliationDecision: 'test_merged_not_live_authorized' as const,
      privateTestDependencySatisfied: true as const,
      liveRuntimeDependencySatisfied: false as const,
      finalRenderAuthorized: false as const,
    },
    evidence: {
      serverDerivedCanonicalJob: true as const,
      serverDerivedToolAndOperation: true as const,
      fundedReservationVerified: true as const,
      opaqueLeaseClaimed: true as const,
      singleUseDispatchConsumed: input.canonicalToolId !== null,
      privateArtifactPersisted: true as const,
      actualQaPassed: true as const,
      reconciliationPassed: true as const,
      idempotentAdapterReplay: false,
      attemptCostEvidenceRecorded: input.attemptCostEvidenceRecorded,
      dependencyArtifactInput: true,
      dependencyStreamInputVerified: false,
      largeDependencyOverLegacyBufferVerified: false,
      finalArtifactQaPassed: false,
      sourceStreamInputVerified: false,
      sourceStagingCleanupVerified: false,
      largeSourceOverLegacyBufferVerified: false,
      mediaOutputStreamed: false,
      largeMediaOutputOverLegacyBufferVerified: false,
      leaseHeartbeatCount: 0,
      longRunningLeaseHeartbeatVerified: false,
    },
    permissions: deniedPermissions(),
    readiness: {
      privateInternalJobExecutionReady: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate:
        'canonical_required_job_capabilities_and_terminal_private_review' as const,
    },
    completedAt: '2026-07-29T17:22:09.758Z',
    responseHash: sha('response'),
    testOnly: true as const,
  }
  return {
    schemaVersion: 'canonical-private-job-completion-recovery-v1' as const,
    source: 'canonical_private_job_completion_recovery' as const,
    purpose: 'recover_completed_canonical_private_job' as const,
    identity: {
      ...response.identity,
      leaseId: 'lease',
      leaseAttemptNumber: 1,
      executionAttemptId: 'attempt',
    },
    evidence: {
      leaseImmutableHash: sha('lease'),
      leaseDependencyAuthorityHash: sha('dependency'),
      actualRunEvidenceHash: sha('run'),
      artifactResultEvidenceHash: sha('result'),
      qaEvaluationId: 'qa',
      qaEvidenceHash: sha('qa'),
      reconciliationId: 'reconciliation',
      consumedDispatchGrantId: input.canonicalToolId === null ? null : 'dispatch',
      consumedDispatchGrantHash:
        input.canonicalToolId === null ? null : sha('dispatch'),
      internalAttemptCostProfileId: input.internalAttemptCostProfileId,
      internalAttemptCostEvidenceHash: input.internalAttemptCostEvidenceHash,
      responseHash: response.responseHash,
      executionCompletedAt: response.completedAt,
    },
    recovery: {
      priorCompletedFenceReused: true as const,
      runnerReexecuted: false as const,
      newLeaseClaimed: false as const,
      newDispatchAuthorized: false as const,
      newDispatchConsumed: false as const,
      artifactWritten: false as const,
      qaWritten: false as const,
      reconciliationWritten: false as const,
      costEvidenceWritten: false as const,
      adapterCompletionRecovered: true as const,
    },
    permissions: deniedPermissions(),
    response,
    recoveredAt: '2026-07-29T17:23:09.758Z',
    recoveryRecordHash: sha('recovery'),
    testOnly: true as const,
  }
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
