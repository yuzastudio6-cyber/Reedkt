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
import type {
  CanonicalCaptionPrivateReviewDependencyBinding,
} from '../../src/types/canonical-caption-private-review-dependency-binding'
import type {
  CanonicalPrivateReviewAssemblyResponse,
} from '../validation/canonical-private-review-assembly-schemas'
import type {
  CanonicalPrivateReviewDecisionResponse,
} from '../validation/canonical-private-review-decision-schemas'
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
  buildCanonicalCaptionPrivateReviewEvidenceProjection,
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from '../services/canonical-caption-private-review-evidence-service'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
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

const privateReviewAuthority = createPrivateReviewAuthority()
const waitingAssembly = buildCanonicalCaptionPrivateReviewEvidenceProjection({
  authority: privateReviewAuthority,
  completed: completedEnvelope,
  assembly: null,
  decision: null,
})
check(waitingAssembly.disposition === 'waiting_for_private_review_assembly'
  && waitingAssembly.privateReviewAssemblyAllowed
  && !waitingAssembly.terminalPrivateInternalQualificationEligible,
'A visual pass may enter canonical private review but cannot qualify before its decision.')
const reviewAssembly = createPrivateReviewAssembly()
const waitingDecision = buildCanonicalCaptionPrivateReviewEvidenceProjection({
  authority: privateReviewAuthority,
  completed: completedEnvelope,
  assembly: reviewAssembly,
  decision: null,
})
check(waitingDecision.disposition === 'waiting_for_private_review_decision'
  && waitingDecision.canonicalPrivateReview.exactAssemblyReread
  && !waitingDecision.privateReviewAccepted,
'Exact review assembly must remain pending until the canonical reviewer decides.')
const acceptedDecision = createPrivateReviewDecision(
  reviewAssembly, 'accept_private_internal_review')
const acceptedReview = buildCanonicalCaptionPrivateReviewEvidenceProjection({
  authority: privateReviewAuthority,
  completed: completedEnvelope,
  assembly: reviewAssembly,
  decision: acceptedDecision,
})
check(acceptedReview.disposition === 'private_review_accepted_visual_pass'
  && acceptedReview.privateReviewAccepted
  && acceptedReview.terminalPrivateInternalQualificationEligible,
'Only the exact visual pass plus canonical private-review acceptance may qualify the output.')
check(parseCanonicalCaptionPrivateReviewEvidenceProjection(acceptedReview)
  .projectionDigestSha256 === acceptedReview.projectionDigestSha256,
'The authenticated Caption private-review projection must verify its closed digest.')
const repairEnvelope = createEnvelope('repair_required')
const repairAdmission = buildCanonicalCaptionPrivateReviewEvidenceProjection({
  authority: privateReviewAuthority,
  completed: repairEnvelope,
  assembly: null,
  decision: null,
})
check(repairAdmission.disposition === 'repair_required_before_private_review'
  && !repairAdmission.privateReviewAssemblyAllowed
  && repairAdmission.requiresNewApprovedSnapshot
  && !repairAdmission.terminalPrivateInternalQualificationEligible,
'A visually failed Caption output must stop before review assembly and require a new snapshot.')
assert.throws(() => buildCanonicalCaptionPrivateReviewEvidenceProjection({
  authority: privateReviewAuthority,
  completed: repairEnvelope,
  assembly: reviewAssembly,
  decision: acceptedDecision,
}))
assertions += 1
const tamperedReview = structuredClone(acceptedReview)
tamperedReview.terminalPrivateInternalQualificationEligible = false
tamperedReview.projectionDigestSha256 = calculateSkillContractDigest(
  tamperedReview as unknown as Record<string, unknown>,
  'projectionDigestSha256')
assert.throws(() => parseCanonicalCaptionPrivateReviewEvidenceProjection(
  tamperedReview))
assertions += 1

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

function createPrivateReviewAuthority() {
  const bindingWithoutDigest: Omit<
    CanonicalCaptionPrivateReviewDependencyBinding,
    'bindingDigestSha256'
  > = {
    schemaVersion: 'canonical-caption-private-review-dependency-binding-v1',
    bindingId: 'caption.private-review.binding.visual-qa-smoke',
    planningProjectionRef: {
      id: 'caption.planning.projection.visual-qa-smoke',
      version: 'canonical-caption-specialist-planning-projection-v1',
      contentHash: sha('caption-planning-projection'),
    },
    renderedMediaWorkBindingRef: {
      id: 'caption.rendered-media.binding.visual-qa-smoke',
      version: 'canonical-caption-rendered-media-work-binding-v1',
      contentHash: sha('caption-rendered-media-binding'),
    },
    postrenderVisualQaWorkBindingRef: {
      id: 'caption.visual-qa.binding.visual-qa-smoke',
      version: 'canonical-caption-postrender-visual-qa-work-binding-v1',
      contentHash: sha('caption-visual-qa-binding'),
    },
    outputId: confirmedFrame.outputId,
    confirmedOutputFrameRef: {
      id: confirmedFrame.id,
      version: `${confirmedFrame.id}.v1`,
      contentHash: sha('confirmed-frame-caption-visual-qa'),
    },
    masterTimingRef: {
      id: 'caption.master-timing.visual-qa-smoke',
      version: 'master-timing-plan-v1',
      contentHash: sha('caption-master-timing'),
    },
    canonicalMasterTimingId: 'caption-master-timing-visual-qa-smoke',
    requiredReviewArtifacts: [{
      role: 'final_captioned_render',
      workItemKey: 'caption-final-render-work',
      outputKey: 'caption-final-render-output',
      contentType: 'video/mp4',
    }, {
      role: 'deterministic_final_qa',
      workItemKey: 'caption-final-qa-work',
      outputKey: 'caption-final-qa-output',
      contentType: 'application/json',
    }, {
      role: 'qualified_complete_time_visual_review',
      workItemKey: 'caption-visual-qa-work',
      outputKey: 'caption-visual-qa-output',
      contentType: 'application/json',
    }],
    canonicalPrivateReview: {
      assemblyServiceId: 'canonical_private_review_assembly_service',
      assemblyResponseSchemaVersion:
        'canonical-private-review-assembly-response-v1',
      assemblyManifestSchemaVersion: 'canonical-private-review-manifest-v1',
      assemblyRoute:
        '/v1/edit-executions/packages/:packageRecordId/private-review-assemblies',
      decisionServiceId: 'canonical_private_review_decision_service',
      decisionResponseSchemaVersion:
        'canonical-private-review-decision-response-v1',
      decisionManifestSchemaVersion:
        'canonical-private-review-decision-manifest-v1',
      decisionRoute:
        '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/decisions',
    },
    everyRequiredArtifactRequiresCreateOnlyPersistence: true,
    everyRequiredArtifactRequiresIndependentQa: true,
    everyRequiredArtifactRequiresReconciliation: true,
    actualReviewAssemblyCreated: false,
    actualPrivateReviewDecisionRecorded: false,
    privateReviewAcceptanceClaimed: false,
    browserReviewCompletionAccepted: false,
    approvedSnapshotMutationGranted: false,
    additionalWorkCreationGranted: false,
    providerDispatchGranted: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const dependencyBinding: CanonicalCaptionPrivateReviewDependencyBinding = {
    ...bindingWithoutDigest,
    bindingDigestSha256: calculateSkillContractDigest({
      ...bindingWithoutDigest,
      bindingDigestSha256: '',
    } as unknown as Record<string, unknown>, 'bindingDigestSha256'),
  }
  return {
    ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    approvedSnapshotHash: workRequest.approvedSnapshotRef.contentHash.slice(7),
    planId: 'caption-private-review-plan',
    planVersion: 1,
    packageRecordId: workRequest.executionPackageRef.id,
    packageHash: workRequest.executionPackageRef.contentHash.slice(7),
    approvedVisualQaWorkItemId: workRequest.approvedWorkItemRef.id,
    dependencyBinding,
  }
}

function createPrivateReviewAssembly(): CanonicalPrivateReviewAssemblyResponse {
  const finalArtifact = reviewArtifact(
    workRequest.privateRenderArtifactRef.id,
    workRequest.privateRenderArtifactRef.contentHash.slice(7),
    'video/mp4')
  const finalQaArtifact = {
    ...reviewArtifact(
      workRequest.deterministicQaRef.id,
      workRequest.deterministicQaRef.contentHash.slice(7),
      'application/json'),
    contentType: 'application/json' as const,
    canonicalToolId: 'ffprobe' as const,
    finalQaGatesPassed: true as const,
    finalQaReportSha256: sha('caption-final-qa-report'),
  }
  const withoutHash = {
    schemaVersion: 'canonical-private-review-assembly-response-v1' as const,
    source: 'canonical_private_review_assembly_service' as const,
    purpose: 'assemble_canonical_private_review' as const,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: workRequest.executionPackageRef.id,
      approvedPlanSnapshotId: scope.approvedSnapshotId,
      reviewAssemblyId: 'caption-private-review-assembly-visual-qa-smoke',
    },
    status: 'ready_for_private_internal_review' as const,
    requiredExecution: {
      requiredJobCount: 3,
      requiredExpectedAssetCount: 3,
      passedQaArtifactCount: 3,
      reconciledArtifactCount: 3,
      allRequiredJobsCompleted: true as const,
      allRequiredAssetsQaPassed: true as const,
      allRequiredAssetsReconciled: true as const,
    },
    finalArtifact: {
      ...finalArtifact,
      contentType: 'video/mp4' as const,
      privateDownloadAvailable: true as const,
      publicUrlCreated: false as const,
      signedUrlCreated: false as const,
    },
    finalQaArtifact,
    chain: {
      finalQaLeaseId: 'caption-private-review-final-qa-lease',
      finalQaExecutionAttemptId: 'caption-private-review-final-qa-attempt',
      finalQaDependencyAuthorityHash: sha('caption-final-qa-dependency'),
      finalQaInputBoundToFinalArtifact: true as const,
      immutablePackageRevalidated: true as const,
      immutablePlanRevalidated: true as const,
      artifactStoreChecksumVerified: true as const,
      leaseStoreChecksumVerified: true as const,
    },
    manifest: {
      schemaVersion: 'canonical-private-review-manifest-v1' as const,
      manifestId: 'caption-private-review-assembly-visual-qa-smoke',
      manifestSha256: sha('caption-private-review-manifest'),
      privateCreateOnlyPersistence: true as const,
      credentialFree: true as const,
    },
    replay: {
      idempotentReplay: false,
      sameManifestOnly: true as const,
    },
    readiness: {
      privateReviewReady: true as const,
      publicExportReady: false as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate:
        'canonical_private_review_user_decision_or_revision' as const,
    },
    permissions: assemblyDeniedPermissions(),
    assembledAt: '2026-08-05T10:01:00.000Z',
    testOnly: true as const,
  }
  return {
    ...withoutHash,
    responseHash: sha256AuthorityValue(withoutHash),
  }
}

function createPrivateReviewDecision(
  assembly: CanonicalPrivateReviewAssemblyResponse,
  decision: 'accept_private_internal_review',
): CanonicalPrivateReviewDecisionResponse {
  const withoutHash = {
    schemaVersion: 'canonical-private-review-decision-response-v1' as const,
    source: 'canonical_private_review_decision_service' as const,
    purpose: 'record_canonical_private_review_decision' as const,
    identity: {
      ...assembly.identity,
      reviewDecisionId: 'caption-private-review-decision-visual-qa-smoke',
    },
    decision,
    status: 'private_internal_review_accepted' as const,
    authority: {
      approvedPlanId: 'caption-private-review-plan',
      approvedPlanVersion: 1,
      approvedSnapshotHash: workRequest.approvedSnapshotRef.contentHash.slice(7),
      approvedPlanHash: sha('caption-private-review-plan'),
      approvedEstimateHash: sha('caption-private-review-estimate'),
      reviewManifestSha256: assembly.manifest.manifestSha256,
      finalArtifactSha256: assembly.finalArtifact.sha256,
      immutableApprovedSnapshotPreserved: true as const,
      immutableReviewManifestPreserved: true as const,
    },
    revisionHandoff: null,
    manifest: {
      schemaVersion: 'canonical-private-review-decision-manifest-v1' as const,
      manifestId: 'caption-private-review-decision-visual-qa-smoke',
      manifestSha256: sha('caption-private-review-decision-manifest'),
      privateCreateOnlyPersistence: true as const,
      credentialFree: true as const,
    },
    replay: {
      idempotentReplay: false,
      sameDecisionOnly: true as const,
    },
    readiness: {
      privateReviewDecisionRecorded: true as const,
      revisionRequested: false,
      publicExportReady: false as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate:
        'private_internal_acceptance_recorded_public_delivery_blocked' as const,
    },
    permissions: decisionDeniedPermissions(),
    decidedAt: '2026-08-05T10:02:00.000Z',
    testOnly: true as const,
  }
  return {
    ...withoutHash,
    responseHash: sha256AuthorityValue(withoutHash),
  }
}

function reviewArtifact(
  artifactId: string,
  contentSha256: string,
  contentType: 'video/mp4' | 'application/json',
) {
  return {
    jobId: `${artifactId}-job`,
    approvedWorkItemId: `${artifactId}-work-item`,
    expectedAssetId: `${artifactId}-expected-asset`,
    artifactId,
    artifactVersion: 1,
    qaEvaluationId: `${artifactId}-qa`,
    reconciliationId: `${artifactId}-reconciliation`,
    contentType,
    sha256: contentSha256,
    byteLength: 1_024,
    privateObjectIdentityHash: sha(`${artifactId}-private-object`),
  }
}

function assemblyDeniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    furtherRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

function decisionDeniedPermissions() {
  return {
    ...assemblyDeniedPermissions(),
    revisionExecution: false as const,
    replacementPlanPublication: false as const,
    reservationMutation: false as const,
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
