import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
  type CanonicalPostrenderVisualQaEvidenceRef,
  type CanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../../src/types/canonical-postrender-visual-qa-lifecycle'
import {
  digestCanonicalPostrenderVisualQaSharedLifecycleResult,
  parseCanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../validation/canonical-postrender-visual-qa-lifecycle-schemas'

const ref = (id: string): CanonicalPostrenderVisualQaEvidenceRef => ({
  id,
  version: 1,
  contentHash: `sha256:${sha256(id)}`,
})
const frameSha256 = sha256('frame-12-rgb24')
const fixtureWithoutDigest = {
  schemaVersion:
    CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION,
  lifecycleResultId: 'visual_qa_lifecycle_result_01',
  sharedProviderCapabilityId:
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  sharedProviderOperationId:
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID,
  sharedProviderOperationVersion:
    CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION,
  scope: {
    workspaceId: 'workspace_01',
    projectId: 'project_01',
    editSessionId: 'edit_01',
    approvedSnapshotId: 'snapshot_01',
  },
  requestRef: ref('visual_qa_request_01'),
  normalizedResultRef: ref('visual_qa_result_01'),
  providerWorkPackageRef: ref('package_01'),
  approvedSnapshotRef: ref('snapshot_01'),
  approvedWorkItemRef: ref('work_01'),
  workerLeaseRef: ref('lease_01'),
  providerDispatchGrantRef: ref('grant_01'),
  providerAttemptRef: ref('attempt_01'),
  providerRunRef: ref('run_01'),
  estimateCostBindingRef: ref('estimate_01'),
  resultRuntimeRecordRef: ref('runtime_result_01'),
  modelQualificationRef: ref('model_qualification_01'),
  sampleCollectionRef: ref('sample_collection_01'),
  sampledFrameRefs: [{
    sampleId: 'sample_01',
    sourceRenderKind: 'full_motion' as const,
    frameNumber: 12,
    frameArtifactRef: {
      id: 'frame_artifact_01',
      version: 1,
      contentHash: `sha256:${frameSha256}`,
    },
    frameSha256,
  }],
  providerAuthorityHashSha256: sha256('provider-authority'),
  providerRequestHashSha256: sha256('provider-request'),
  providerResponseHashSha256: sha256('provider-response'),
  executionAttestationHashSha256: sha256('execution-attestation'),
  executionAttemptId: 'attempt_01',
  replayTuple: {
    idempotencyKey: 'visual_qa_attempt_01',
    requestDigestSha256: sha256('provider-request'),
    attemptOrdinal: 1,
    disposition: 'fresh_execution' as const,
  },
  providerBoundary: CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY,
  canonicalProviderModel: CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL,
  modelRoleId: CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID,
  requestedModelUse: 'visual_understanding' as const,
  startedAt: '2026-07-31T20:00:00.000Z',
  finishedAt: '2026-07-31T20:00:05.000Z',
  actualModelInferenceExecuted: true as const,
  exactApprovedFramesInspected: true as const,
  allSampleFrameDigestsMatched: true as const,
  structuredOutputSchemaValidated: true as const,
  providerResponseNormalizedByServer: true as const,
  canonicalLifecycleAdmissionVerified: true as const,
  workerLeaseVerified: true as const,
  estimateCostBindingVerified: true as const,
  resultRuntimePersistenceVerified: true as const,
  executionAttestationVerified: true as const,
  replayProtectionVerified: true as const,
  responseContainsRawModelText: false as const,
  providerSecretsIncluded: false as const,
  mediaBytesSerialized: false as const,
  pathsOrUrlsIncluded: false as const,
  callerPromptOrExecutableTextAccepted: false as const,
  operationDispatchAuthority: false as const,
  qaApprovalAuthority: false as const,
  repairAuthority: false as const,
  assetMutationAuthority: false as const,
  creditOrBillingAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
}
const provisional = {
  ...fixtureWithoutDigest,
  lifecycleResultDigestSha256: `sha256:${sha256('placeholder')}`,
} satisfies CanonicalPostrenderVisualQaSharedLifecycleResult
const fixture: CanonicalPostrenderVisualQaSharedLifecycleResult = {
  ...provisional,
  lifecycleResultDigestSha256:
    digestCanonicalPostrenderVisualQaSharedLifecycleResult(provisional),
}

assert.deepEqual(
  parseCanonicalPostrenderVisualQaSharedLifecycleResult(fixture),
  fixture,
)

const tamper = (
  mutate: (value: CanonicalPostrenderVisualQaSharedLifecycleResult) => void,
) => {
  const changed = structuredClone(fixture)
  mutate(changed)
  assert.throws(
    () => parseCanonicalPostrenderVisualQaSharedLifecycleResult(changed),
  )
}

tamper((value) => { value.providerRequestHashSha256 = sha256('changed') })
tamper((value) => { value.operationDispatchAuthority = true as false })
tamper((value) => { value.scope.approvedSnapshotId = 'snapshot_02' })
tamper((value) => { value.executionAttemptId = 'attempt_02' })
tamper((value) => { value.sampledFrameRefs[0]!.frameNumber = 13 })
tamper((value) => {
  value.sampledFrameRefs.push(structuredClone(value.sampledFrameRefs[0]!))
})
tamper((value) => {
  value.replayTuple.disposition = 'idempotent_result_replay'
})
tamper((value) => { value.finishedAt = '2026-07-31T19:59:59.000Z' })

console.log(JSON.stringify({
  smoke: 'canonical-postrender-visual-qa-shared-lifecycle-contract',
  capability: fixture.sharedProviderCapabilityId,
  operation: fixture.sharedProviderOperationId,
  operationVersion: fixture.sharedProviderOperationVersion,
  sampledFrames: fixture.sampledFrameRefs.length,
  actualRuntimeExecutedBySmoke: false,
  canonicalLifecycleImplementedByThisSlice: false,
  adversarialAssertions: 8,
}))

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
