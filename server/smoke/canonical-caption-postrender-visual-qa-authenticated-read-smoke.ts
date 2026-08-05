import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:http'

import {
  buildCaptionRenderedVisualReviewAuthenticatedReadRequest,
  validateCaptionRenderedVisualReviewAuthenticatedReadResult,
} from '../../src/lib/caption-direction/caption-rendered-visual-review-authenticated-read'
import type {
  CanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../../src/types/canonical-postrender-visual-qa-lifecycle'
import type {
  CanonicalPostrenderVisualQaNormalizedResult,
} from '../../src/types/canonical-postrender-visual-qa-normalized-result'
import type {
  CanonicalPostrenderVisualQaWorkRequestInput,
} from '../../src/types/canonical-postrender-visual-qa-work-request'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService,
} from '../services/canonical-caption-postrender-visual-qa-authenticated-read-service'
import {
  createCanonicalCaptionPostrenderVisualQaEvidence,
  createCanonicalCaptionPostrenderVisualQaOutputAuthority,
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository,
  persistCanonicalCaptionPostrenderVisualQaEvidence,
  type CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
} from '../services/canonical-caption-postrender-visual-qa-evidence-service'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OWNER_RESULT_PORT_VERSION,
  readCanonicalCaptionPostrenderVisualQaOwnerResult,
  type CanonicalCaptionPostrenderVisualQaOwnerResultReadPort,
} from '../services/canonical-caption-postrender-visual-qa-owner-result-port'
import {
  reconcileCanonicalCaptionPostrenderVisualQaOwnerResult,
} from '../services/canonical-caption-postrender-visual-qa-reconciliation-service'
import {
  digestCanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../validation/canonical-postrender-visual-qa-lifecycle-schemas'
import {
  digestCanonicalPostrenderVisualQaNormalizedResult,
  parseCanonicalPostrenderVisualQaNormalizedResult,
} from '../validation/canonical-postrender-visual-qa-normalized-result-schemas'
import {
  createCanonicalPostrenderVisualQaWorkRequest,
} from '../validation/canonical-postrender-visual-qa-work-request-schemas'

let assertions = 0
const check = (condition: unknown, message: string): void => {
  assert.ok(condition, message)
  assertions += 1
}
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const hash = (value: string) => `sha256:${sha(value)}`
const ref = (id: string, version = 1) => ({
  id,
  version,
  contentHash: hash(id),
})

const ownerUserId = 'mock-user-runtime'
const scope = {
  workspaceId: 'workspace-caption-visual-qa',
  projectId: 'project-caption-visual-qa',
  editSessionId: 'edit-caption-visual-qa',
  approvedSnapshotId: 'snapshot-caption-visual-qa',
}
const confirmedFrame = {
  id: 'confirmed-frame-caption-visual-qa',
  version: 1,
  contentHash: hash('confirmed-frame-caption-visual-qa'),
  outputId: 'output-caption-visual-qa-wide',
  aspectRatio: '16:9' as const,
  width: 1_920,
  height: 1_080,
  fps: 24,
  confirmedByUser: true as const,
  confirmationRecordId: 'frame-confirmation-caption-visual-qa',
}
const readRequest = buildCaptionRenderedVisualReviewAuthenticatedReadRequest({
  scope,
  confirmedOutputFrameRefs: [confirmedFrame],
})

const requestInput: CanonicalPostrenderVisualQaWorkRequestInput = {
  scope: { ownerUserId, ...scope },
  approvedSnapshotRef: ref(scope.approvedSnapshotId),
  executionPackageRef: ref('execution-package-caption-visual-qa'),
  approvedWorkItemRef: ref('work-caption-visual-qa'),
  creditReservationRef: ref('credit-reservation-caption-visual-qa'),
  privateRenderArtifactRef: ref('render-caption-visual-qa'),
  deterministicQaRef: ref('deterministic-qa-caption-visual-qa'),
  estimateCostBindingRef: ref('estimate-caption-visual-qa'),
  sampleCollectionRef: ref('sample-collection-caption-visual-qa'),
  render: {
    artifactId: 'render-caption-visual-qa',
    artifactVersion: 1,
    contentHash: hash('render-caption-visual-qa'),
    width: confirmedFrame.width,
    height: confirmedFrame.height,
    fpsNumerator: confirmedFrame.fps,
    fpsDenominator: 1,
    frameCount: 120,
    durationFrames: 120,
    privateCreateOnlyVerified: true,
    exactRereadVerified: true,
    deterministicQaPassed: true,
  },
  samplePlan: {
    schemaVersion: 'canonical-postrender-visual-qa-sample-plan-v1',
    coverageScope: 'complete',
    canonicalSegmentCount: 1,
    sampledSegmentIds: ['segment-caption-visual-qa'],
    sampledSegmentCount: 1,
    unsampledSegmentCount: 0,
    modelInspectsOnlyProvidedSampleArtifacts: true,
    unsampledContentInspectionClaimAllowed: false,
    completeTimeCoverageClaimAllowed: true,
    samples: Array.from({ length: 120 }, (_, frameNumber) => ({
      sampleId: `sample-caption-visual-qa-${frameNumber}`,
      segmentId: 'segment-caption-visual-qa',
      sourceRenderKind: 'full_motion' as const,
      frameNumber,
      startFrame: 0,
      endFrameExclusive: 120,
      width: confirmedFrame.width,
      height: confirmedFrame.height,
      pixelFormat: 'rgb24',
      frameArtifactRef: {
        id: `frame-caption-visual-qa-${frameNumber}`,
        version: 1,
        contentHash: hash(`frame-caption-visual-qa-bytes-${frameNumber}`),
      },
      frameSha256: sha(`frame-caption-visual-qa-bytes-${frameNumber}`),
      createOnlyPersistenceVerified: true,
      exactRereadVerified: true,
      independentArtifactQaPassed: true,
    })),
  },
  inspectionProfile: {
    profileId: 'caption-professional-postrender-visual-qa',
    profileVersion: 1,
    profileDigestSha256: sha('caption-visual-qa-profile'),
    normalizedResponseSchemaId: 'caption-postrender-normalized-decision-v1',
    normalizedResponseSchemaDigestSha256: sha('normalized-decision-schema'),
    serverOwnedInstructions: true,
    rawPromptSerialized: false,
    callerProvidedPromptAccepted: false,
  },
  replay: {
    idempotencyKey: 'caption-visual-qa-idempotency-1',
    requestOrdinal: 1,
    maximumAttempts: 2,
  },
}
const workRequest = createCanonicalPostrenderVisualQaWorkRequest(requestInput)
const authority = (state: 'not_scheduled' | 'waiting_for_render'
  | 'waiting_for_qualified_ai') =>
  createCanonicalCaptionPostrenderVisualQaOutputAuthority({
    authorityId: `caption.visual-qa.authority.${state}`,
    ownerUserId,
    scope,
    output: {
      outputId: confirmedFrame.outputId,
      aspectRatio: confirmedFrame.aspectRatio,
      width: confirmedFrame.width,
      height: confirmedFrame.height,
      fps: confirmedFrame.fps,
      confirmedOutputFrameRef: {
        id: confirmedFrame.id,
        version: confirmedFrame.version,
        contentHash: confirmedFrame.contentHash,
      },
      confirmedByUser: true,
      confirmationRecordId: confirmedFrame.confirmationRecordId,
    },
    lifecycleState: state,
    approvedSnapshotImmutable: true,
    exactConfirmedOutputFrameReread: true,
    browserLocalStateAccepted: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

const completedEnvelope = createEnvelope('passed')

const ownerResultPort: CanonicalCaptionPostrenderVisualQaOwnerResultReadPort = {
  portVersion:
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OWNER_RESULT_PORT_VERSION,
  authorityBoundary: 'canonical_shared_postrender_visual_qa_lifecycle_owner',
  async readPersistedResult() {
    return {
      workRequest: structuredClone(completedEnvelope.workRequest),
      lifecycleResult: structuredClone(completedEnvelope.lifecycleResult),
      normalizedResult: structuredClone(completedEnvelope.normalizedResult),
    }
  },
}
const ownerLocator = {
  ownerUserId,
  ...scope,
  approvedWorkItemId: workRequest.approvedWorkItemRef.id,
  outputId: confirmedFrame.outputId,
  confirmedOutputFrameRef: {
    id: confirmedFrame.id,
    version: `${confirmedFrame.id}.v1`,
    contentHash: sha('confirmed-frame-caption-visual-qa'),
  },
  requireCompleteTimeCoverage: true as const,
}
const exactOwnerResult =
  await readCanonicalCaptionPostrenderVisualQaOwnerResult({
    port: ownerResultPort,
    locator: ownerLocator,
  })
check(exactOwnerResult.normalizedResult.decision === 'passed',
  'Caption coordination must exact-reread the canonical shared-owner decision.')
const coordinatorRepository =
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
    authorities: [authority('waiting_for_qualified_ai')],
  })
const coordinated =
  await reconcileCanonicalCaptionPostrenderVisualQaOwnerResult({
    repository: coordinatorRepository,
    ownerUserId,
    ownerResult: exactOwnerResult,
  })
check(coordinated.disposition === 'created'
  && coordinated.exactRereadVerified
  && coordinated.envelope.evidence.actualCompleteTimeVisualReviewPassed,
'Caption coordination must reconcile shared-owner evidence create-only without dispatching the provider.')
await assert.rejects(() =>
  readCanonicalCaptionPostrenderVisualQaOwnerResult({
    port: ownerResultPort,
    locator: { ...ownerLocator, outputId: 'wrong-output' },
  }))
assertions += 1

const notFoundRepository =
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
    authorities: [authority('not_scheduled')],
  })
const pendingRepository =
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
    authorities: [authority('waiting_for_qualified_ai')],
  })
const completedRepository =
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
    authorities: [authority('waiting_for_qualified_ai')],
  })

const notFound = await createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
  repository: notFoundRepository,
}).read({ authenticatedOwnerUserId: ownerUserId, request: readRequest })
check(notFound.disposition === 'not_found' && notFound.outputSetStatus === null,
  'An exact output with no lifecycle must remain not found.')

const pending = await createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
  repository: pendingRepository,
}).read({ authenticatedOwnerUserId: ownerUserId, request: readRequest })
check(pending.disposition === 'pending'
  && pending.outputSetStatus?.state === 'waiting_for_qualified_ai'
  && pending.outputSetStatus.everyOutputDeterministicQaPassed
  && !pending.outputSetStatus.visualQaGateSatisfied,
'Deterministic QA may be complete while qualified visual review stays pending.')

const persisted = await persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: completedEnvelope,
})
check(persisted.disposition === 'created' && persisted.exactRereadVerified,
  'Completed canonical visual evidence must persist create-only and reread.')
const replay = await persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: structuredClone(completedEnvelope),
})
check(replay.disposition === 'idempotent_replay',
  'The exact completed visual evidence may replay without duplicate writes.')

const completed = await createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
  repository: completedRepository,
}).read({ authenticatedOwnerUserId: ownerUserId, request: readRequest })
check(completed.disposition === 'completed'
  && completed.outputSetStatus?.state === 'passed'
  && completed.outputSetStatus.visualQaGateSatisfied
  && completed.outputSetStatus.outputs[0]?.status.actualModelInferenceVerified,
'Only exact complete-time canonical evidence may project a passed status.')
check(validateCaptionRenderedVisualReviewAuthenticatedReadResult(completed).ok,
  'The server projection must pass the frozen Caption consumer validator.')

const repairRepository =
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
    authorities: [authority('waiting_for_qualified_ai')],
    completed: [createEnvelope('repair_required')],
  })
const repair = await createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
  repository: repairRepository,
}).read({ authenticatedOwnerUserId: ownerUserId, request: readRequest })
check(repair.disposition === 'completed'
  && repair.outputSetStatus?.state === 'repair_required'
  && repair.outputSetStatus.visualQaBlocksDelivery,
'A completed model attempt requiring repair must never project a passed gate.')

await assert.rejects(() =>
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
    repository: completedRepository,
  }).read({ authenticatedOwnerUserId: 'other-user', request: readRequest }))
assertions += 1

const staleFrameRequest = structuredClone(readRequest)
staleFrameRequest.requiredOutputs[0]!.confirmedOutputFrameRef.width = 1_918
await assert.rejects(() =>
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
    repository: completedRepository,
  }).read({ authenticatedOwnerUserId: ownerUserId, request: staleFrameRequest }))
assertions += 1

const crossCanvas = structuredClone(completedEnvelope)
crossCanvas.evidence.output.outputId = 'output-cross-canvas'
await assert.rejects(() => persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: crossCanvas,
}))
assertions += 1

const representativePass = structuredClone(completedEnvelope)
representativePass.workRequest.samplePlan.coverageScope =
  'bounded_representative'
representativePass.workRequest.samplePlan.completeTimeCoverageClaimAllowed = false
representativePass.workRequest.samplePlan.unsampledSegmentCount = 1
representativePass.workRequest.samplePlan.canonicalSegmentCount = 2
representativePass.workRequest.workRequestDigestSha256 = hash('forged-request')
await assert.rejects(() => persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: representativePass,
}))
assertions += 1

const incompleteTimelineRequest = createCanonicalPostrenderVisualQaWorkRequest({
  ...requestInput,
  samplePlan: {
    ...requestInput.samplePlan,
    samples: [requestInput.samplePlan.samples[0]!],
  },
})
await assert.rejects(() => persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: createEnvelope('passed', incompleteTimelineRequest),
}))
assertions += 1

const relabeledNormalizedDecision = structuredClone(completedEnvelope)
relabeledNormalizedDecision.normalizedResult =
  createNormalizedResult('repair_required')
relabeledNormalizedDecision.lifecycleResult = createLifecycleResult(
  workRequest,
  relabeledNormalizedDecision.normalizedResult,
)
await assert.rejects(() => persistCanonicalCaptionPostrenderVisualQaEvidence({
  repository: completedRepository,
  envelope: relabeledNormalizedDecision,
}))
assertions += 1

const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
}), {
  canonicalCaptionPostrenderVisualQaEvidenceRepository: completedRepository,
})
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
try {
  const response = await fetch(
    `http://127.0.0.1:${address.port}/v1/postrender-visual-qa/caption/authenticated-read`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(readRequest),
    },
  )
  const body = await response.json() as {
    ok?: boolean
    data?: { authenticatedRead?: unknown }
  }
  check(response.status === 200 && body.ok === true
    && validateCaptionRenderedVisualReviewAuthenticatedReadResult(
      body.data?.authenticatedRead).ok,
  'The mounted authenticated route must return the exact validated projection.')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) =>
    error ? reject(error) : resolve()))
}

console.log(JSON.stringify({
  smoke: 'canonical-caption-postrender-visual-qa-authenticated-read',
  assertions,
  dispositions: [notFound.disposition, pending.disposition,
    completed.disposition, repair.disposition],
  syntheticLifecycleFixtureOnly: true,
  actualProviderCallMadeBySmoke: false,
  browserLocalCompletionAccepted: false,
  qaApprovalGranted: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}, null, 2))

function createEnvelope(
  decision: 'passed' | 'repair_required',
  request = workRequest,
): CanonicalCaptionPostrenderVisualQaCompletedEnvelope {
  const passed = decision === 'passed'
  const normalizedResult = createNormalizedResult(decision, request)
  const lifecycleResult = createLifecycleResult(request, normalizedResult)
  const evidence = createCanonicalCaptionPostrenderVisualQaEvidence({
    evidenceId: `caption.visual-qa.evidence.${decision}`,
    ownerUserId,
    scope,
    output: authority('waiting_for_qualified_ai').output,
    workRequestRef: {
      id: request.workRequestId,
      version: 1,
      contentHash: request.workRequestDigestSha256,
    },
    lifecycleResultRef: {
      id: lifecycleResult.lifecycleResultId,
      version: 1,
      contentHash: lifecycleResult.lifecycleResultDigestSha256,
    },
    normalizedDecisionRef: structuredClone(
      lifecycleResult.normalizedResultRef),
    providerExecutionReceiptRef: ref('provider-execution-caption-visual-qa'),
    persistedEvidenceArtifactRef: ref('persisted-caption-visual-qa'),
    independentArtifactQaRef: ref('independent-caption-visual-qa'),
    assetManifestReconciliationRef: ref('manifest-caption-visual-qa'),
    decision,
    userFacingSummary: passed
      ? 'Caption placement, readability, timing, and motion passed complete-time visual inspection.'
      : 'One Caption treatment needs the smallest approved repair and another inspection.',
    deterministicQaPassed: true,
    exactApprovedRenderBound: true,
    actualModelInferenceVerified: true,
    deterministicAndModelEvidenceAgree: passed,
    canonicalEvidenceReconciled: true,
    modelInspectionCoverage: {
      scope: 'complete_segment_coverage',
      sampledSegmentCount: 1,
      unsampledSegmentCount: 0,
      modelInspectedOnlyPlannedSamples: true,
      unsampledSegmentsNeverImpliedInspected: true,
    },
    smallestScopeRepairRequired: !passed,
    privateHumanReviewRequired: false,
    actualCompleteTimeVisualReviewPassed: passed,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    browserLocalStateUsed: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    repairExecutionAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })
  return {
    evidence,
    workRequest: request,
    lifecycleResult,
    normalizedResult,
  }
}

function createLifecycleResult(
  request: ReturnType<typeof createCanonicalPostrenderVisualQaWorkRequest>,
  normalizedResult: CanonicalPostrenderVisualQaNormalizedResult,
): CanonicalPostrenderVisualQaSharedLifecycleResult {
  const providerRequestHash = sha('provider-request-caption-visual-qa')
  const withoutDigest = {
    schemaVersion:
      'canonical-postrender-visual-qa-shared-lifecycle-result-v1' as const,
    lifecycleResultId: 'caption-visual-qa-lifecycle-result-1',
    sharedProviderCapabilityId: 'qwen2_5_vl_visual_understanding' as const,
    sharedProviderOperationId: 'postrender_private_visual_qa' as const,
    sharedProviderOperationVersion: 'postrender-private-visual-qa-v1' as const,
    scope,
    requestRef: {
      id: request.workRequestId,
      version: 1,
      contentHash: request.workRequestDigestSha256,
    },
    normalizedResultRef: {
      id: normalizedResult.normalizedResultId,
      version: 1,
      contentHash: normalizedResult.normalizedResultDigestSha256,
    },
    providerWorkPackageRef: structuredClone(request.executionPackageRef),
    approvedSnapshotRef: structuredClone(request.approvedSnapshotRef),
    approvedWorkItemRef: structuredClone(request.approvedWorkItemRef),
    workerLeaseRef: ref('worker-lease-caption-visual-qa'),
    providerDispatchGrantRef: ref('dispatch-grant-caption-visual-qa'),
    providerAttemptRef: ref('provider-attempt-caption-visual-qa'),
    providerRunRef: ref('provider-run-caption-visual-qa'),
    estimateCostBindingRef: structuredClone(request.estimateCostBindingRef),
    resultRuntimeRecordRef: ref('runtime-record-caption-visual-qa'),
    modelQualificationRef: ref('model-qualification-caption-visual-qa'),
    sampleCollectionRef: structuredClone(request.sampleCollectionRef),
    sampledFrameRefs: request.samplePlan.samples.map((sample) => ({
      sampleId: sample.sampleId,
      sourceRenderKind: sample.sourceRenderKind,
      frameNumber: sample.frameNumber,
      frameArtifactRef: structuredClone(sample.frameArtifactRef),
      frameSha256: sample.frameSha256,
    })),
    providerAuthorityHashSha256: sha('provider-authority-caption-visual-qa'),
    providerRequestHashSha256: providerRequestHash,
    providerResponseHashSha256: sha('provider-response-caption-visual-qa'),
    executionAttestationHashSha256: sha('attestation-caption-visual-qa'),
    executionAttemptId: 'provider-attempt-caption-visual-qa',
    replayTuple: {
      idempotencyKey: request.replay.idempotencyKey,
      requestDigestSha256: providerRequestHash,
      attemptOrdinal: 1,
      disposition: 'fresh_execution' as const,
    },
    providerBoundary: 'qwen2_5_vl_7b_instruct_provider_boundary' as const,
    canonicalProviderModel: 'qwen2.5-vl-7b-instruct' as const,
    modelRoleId: 'qwen2_5_vl_visual_understanding' as const,
    requestedModelUse: 'visual_understanding' as const,
    startedAt: '2026-08-05T10:00:00.000Z',
    finishedAt: '2026-08-05T10:00:05.000Z',
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
    ...withoutDigest,
    lifecycleResultDigestSha256: hash('placeholder'),
  } satisfies CanonicalPostrenderVisualQaSharedLifecycleResult
  return {
    ...provisional,
    lifecycleResultDigestSha256:
      digestCanonicalPostrenderVisualQaSharedLifecycleResult(provisional),
  }
}

function createNormalizedResult(
  decision: 'passed' | 'repair_required',
  request = workRequest,
): CanonicalPostrenderVisualQaNormalizedResult {
  const passed = decision === 'passed'
  const provisional: CanonicalPostrenderVisualQaNormalizedResult = {
    schemaVersion: 'canonical-postrender-visual-qa-normalized-result-v1',
    normalizedResultDigestSha256: hash('placeholder-normalized-result'),
    normalizedResultId: `normalized-caption-visual-qa-${decision}`,
    scope,
    output: {
      outputId: confirmedFrame.outputId,
      aspectRatio: confirmedFrame.aspectRatio,
      width: confirmedFrame.width,
      height: confirmedFrame.height,
      fpsNumerator: confirmedFrame.fps,
      fpsDenominator: 1,
      confirmedOutputFrameRef: {
        id: confirmedFrame.id,
        version: `${confirmedFrame.id}.v1`,
        contentHash: sha('confirmed-frame-caption-visual-qa'),
      },
      confirmedByUser: true,
      confirmationRecordId: confirmedFrame.confirmationRecordId,
    },
    requestRef: {
      id: request.workRequestId,
      version: 1,
      contentHash: request.workRequestDigestSha256,
    },
    providerExecutionReceiptRef: ref('provider-execution-caption-visual-qa'),
    persistedEvidenceArtifactRef: ref('persisted-caption-visual-qa'),
    independentArtifactQaRef: ref('independent-caption-visual-qa'),
    assetManifestReconciliationRef: ref('manifest-caption-visual-qa'),
    decision,
    userFacingSummary: passed
      ? 'Caption placement, readability, timing, and motion passed complete-time visual inspection.'
      : 'One Caption treatment needs the smallest approved repair and another inspection.',
    deterministicQaPassed: true,
    exactApprovedRenderBound: true,
    actualModelInferenceVerified: true,
    deterministicAndModelEvidenceAgree: passed,
    canonicalEvidenceReconciled: true,
    modelInspectionCoverage: {
      scope: 'complete_segment_coverage',
      sampledSegmentCount: 1,
      unsampledSegmentCount: 0,
      modelInspectedOnlyPlannedSamples: true,
      unsampledSegmentsNeverImpliedInspected: true,
    },
    smallestScopeRepairRequired: !passed,
    privateHumanReviewRequired: false,
    actualCompleteTimeVisualReviewPassed: passed,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    browserLocalStateUsed: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    repairExecutionAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return parseCanonicalPostrenderVisualQaNormalizedResult({
    ...provisional,
    normalizedResultDigestSha256:
      digestCanonicalPostrenderVisualQaNormalizedResult(provisional),
  })
}
