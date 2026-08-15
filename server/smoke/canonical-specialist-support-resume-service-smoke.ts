import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
  parseCanonicalSpecialistSupportResumeRecord,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
} from '../services/canonical-specialist-support-resume-service'

const values = new Map<string, Buffer>()
const repository = createCanonicalSpecialistSupportResumeRepository({
  objectPort: memoryObjectPort(values),
  prefix: 'private/smoke/orchestra/specialist-support-resume/v1',
})
const initialCall = callFixture()
const visualRequest = supportRequestFixture(
  initialCall,
  'visual_intelligence',
  ['visual_intelligence_report'],
  'support.visual-intelligence.initial',
)
const trackAllInitialRequest = supportRequestFixture(
  initialCall,
  'track_all',
  ['track_all_mask_binding'],
  'support.track-all.initial',
)
const initialResult = resultFixture(initialCall, {
  disposition: 'needs_followup',
  supportRequests: [visualRequest, trackAllInitialRequest],
})
const initialPair = createCanonicalSpecialistCallResultPair({
  call: initialCall,
  result: initialResult,
  persistedAt: '2026-08-05T13:00:00.000Z',
})
assert.equal(await repository.persistCallResultPairCreateOnly({
  pair: initialPair,
}), 'created')
assert.equal(await repository.persistCallResultPairCreateOnly({
  pair: initialPair,
}), 'identical_replay')
let repositoryGetterInvoked = false
const hostilePairRequest = Object.defineProperty({}, 'pair', {
  enumerable: true,
  get() {
    repositoryGetterInvoked = true
    return initialPair
  },
})
await assert.rejects(repository.persistCallResultPairCreateOnly(
  hostilePairRequest as never,
))
assert.equal(repositoryGetterInvoked, false)

const visualProjection = projectionFixture(
  visualRequest,
  'visual_intelligence_report',
)
assert.equal(await repository.persistAuthenticatedOwnerProjectionCreateOnly({
  projection: visualProjection,
}), 'created')

let executions = 0
const executionPort = {
  async execute(input: {
    call: OrchestraSkillCall
    resumeSupportRequest: SkillSupportRequest
  }) {
    executions += 1
    if (input.resumeSupportRequest.targetSkillKey === 'visual_intelligence') {
      const trackAllRequest = supportRequestFixture(
        input.call,
        'track_all',
        ['track_all_mask_binding'],
        'support.track-all.after-visual',
      )
      return resultFixture(input.call, {
        disposition: 'needs_followup',
        supportRequests: [trackAllRequest],
      })
    }
    return resultFixture(input.call, {
      disposition: 'completed',
      producedArtifactRefs: [artifact(
        'caption_occluded_typography_resolution',
        'captions',
        null,
      )],
    })
  },
}

const firstResume = await resumeCanonicalSpecialistWithAuthenticatedSupport({
  priorCallRef: callRef(initialCall),
  selectedSupportRequestRef: requestRef(visualRequest),
  repository,
  specialistExecutionPort: executionPort,
  now: () => new Date('2026-08-05T13:01:00.000Z'),
})
assert.equal(firstResume.stepOrdinal, 1)
assert.equal(firstResume.resumedResult.disposition, 'needs_followup')
assert.equal(firstResume.resumedCall.injectedSupportArtifactRefs.length, 1)
assert.equal(firstResume.resumedCall.injectedSupportArtifactRefs[0]
  .producerSkillKey, 'visual_intelligence')
assert.equal(firstResume.promotedPriorSupportArtifactRefs.length, 0)
assert.equal(firstResume.directPeerDispatchPerformed, false)
assert.deepEqual(
  parseCanonicalSpecialistSupportResumeRecord(firstResume),
  firstResume,
)

const trackAllRequest = firstResume.resumedResult.supportRequests[0]
assert.ok(trackAllRequest)
const trackAllProjection = projectionFixture(
  trackAllRequest,
  'track_all_mask_binding',
)
await repository.persistAuthenticatedOwnerProjectionCreateOnly({
  projection: trackAllProjection,
})
const secondResume = await resumeCanonicalSpecialistWithAuthenticatedSupport({
  priorCallRef: callRef(firstResume.resumedCall),
  selectedSupportRequestRef: requestRef(trackAllRequest),
  repository,
  specialistExecutionPort: executionPort,
  now: () => new Date('2026-08-05T13:02:00.000Z'),
})
assert.equal(secondResume.stepOrdinal, 2)
assert.equal(secondResume.resumedResult.disposition, 'completed')
assert.equal(secondResume.promotedPriorSupportArtifactRefs.length, 1)
assert.equal(secondResume.promotedPriorSupportArtifactRefs[0]
  .artifactType, 'visual_intelligence_report')
assert.equal(secondResume.promotedPriorSupportArtifactRefs[0]
  .sourceSupportRequestRef, null)
assert.ok(secondResume.resumedCall.inputArtifactRefs.some((candidate) =>
  candidate.artifactType === 'visual_intelligence_report'
  && candidate.producerSkillKey === 'visual_intelligence'
  && candidate.sourceSupportRequestRef === null))
assert.equal(secondResume.resumedCall.injectedSupportArtifactRefs.length, 1)
assert.equal(secondResume.resumedCall.injectedSupportArtifactRefs[0]
  .artifactType, 'track_all_mask_binding')
assert.equal(secondResume.resumedCall.injectedSupportArtifactRefs[0]
  .producerSkillKey, 'track_all')
assert.equal(executions, 2)

const crossedScopeProjection = createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
  ...projectionWithoutDigest(visualProjection),
  projectionId: 'projection.visual-intelligence.crossed-scope',
  canonicalScope: {
    ...visualProjection.canonicalScope,
    projectId: 'project.crossed',
  },
})
const crossedRepository = {
  ...repository,
  async rereadAuthenticatedOwnerProjection() {
    return crossedScopeProjection
  },
}
await assert.rejects(() =>
  resumeCanonicalSpecialistWithAuthenticatedSupport({
    priorCallRef: callRef(initialCall),
    selectedSupportRequestRef: requestRef(visualRequest),
    repository: crossedRepository,
    specialistExecutionPort: executionPort,
  }), /crossed support scope/u)

await repository.persistAuthenticatedOwnerProjectionCreateOnly({
  projection: projectionFixture(
    trackAllInitialRequest,
    'track_all_mask_binding',
  ),
})
await assert.rejects(() =>
  resumeCanonicalSpecialistWithAuthenticatedSupport({
    priorCallRef: callRef(initialCall),
    selectedSupportRequestRef: requestRef(trackAllInitialRequest),
    repository,
    specialistExecutionPort: executionPort,
  }), /next deterministic result member/u)

const tamperedRecord = structuredClone(secondResume)
Reflect.set(tamperedRecord, 'runtimeExecutionPerformedByResumeOwner', true)
assert.throws(() => parseCanonicalSpecialistSupportResumeRecord(tamperedRecord))
let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return 'canonical-specialist-support-resume-record-v1'
  },
})
assert.throws(() => parseCanonicalSpecialistSupportResumeRecord(hostile))
assert.equal(getterInvoked, false)

const exactFrozenDependencyHashes = new Map<string, string>([
  ['src/types/skill-capability-manifest.ts',
    'bd7da7d428c355dc1b133b5c67ff222cc828d8c880adb60dab9824a67e9d33db'],
  ['src/types/orchestra-skill-contracts.ts',
    'e67707d1ba3a54aabf14fd455ce9b7321926abff0ce0c0d6724c4a193baea576'],
  ['src/lib/closed-contract-validation.ts',
    '773ab2ac717012fbdce7bd35a687c0d86cb9eb7807d7669627f269febd0b0c6f'],
  ['server/orchestra/orchestra-skill-contracts.ts',
    '998edd7aa9fd6fd6736ea022d83e123991a3cafcfe0fa04b5d62bc3a8cd206bd'],
])
for (const [path, expectedHash] of exactFrozenDependencyHashes) {
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),
    expectedHash)
}
const specialistWireSource = readFileSync(
  'src/types/orchestra-skill-contracts.ts',
  'utf8',
)
const activeBackendWireSource = readFileSync(
  'src/types/orchestra-skill-capability.ts',
  'utf8',
)
const bridgeSource = readFileSync(
  'server/services/canonical-specialist-support-resume-service.ts',
  'utf8',
)
assert.match(specialistWireSource, /injectedSupportArtifactRefs/u)
assert.match(activeBackendWireSource, /sourceArtifactRefs/u)
assert.match(specialistWireSource, /'orchestra-skill-call-v1'/u)
assert.match(activeBackendWireSource, /'orchestra-skill-call-v1'/u)
assert.doesNotMatch(bridgeSource,
  /from ['"].*orchestra-skill-capability['"]/u)

console.log(JSON.stringify({
  smoke: 'canonical-specialist-support-resume-service',
  checks: 48,
  exactFrozenGenericSpecialistContractsParsed: true,
  exactFrozenGenericDependencyHashesMatched: true,
  sameVersionDifferentWireShapesExplicitlyDetected: true,
  incompatibleBackendVisualIntelligenceWireCastOrRelabeled: false,
  authenticatedVisualIntelligenceThenTrackAllSequentialResume: true,
  priorOwnerResultPersistedRereadAndPromotedAsInput: true,
  onlyCurrentOwnerResultInjected: true,
  deterministicSupportRequestOrderEnforced: true,
  lostOrCrossedOwnerEvidenceFailsClosed: true,
  hostileRepositoryWriteRejectedWithoutGetterInvocation: true,
  exactImmediateCallRequestAndResultLineage: true,
  boundedResumeDepth: 32,
  directPeerDispatchPerformed: false,
  timelineRuntimeAssetQaOrBillingAuthorityMutated: false,
  publicDeliveryOrProductionAuthorityGranted: false,
}, null, 2))

function callFixture(): OrchestraSkillCall {
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: 'orchestra-skill-call-v1',
    callId: 'caption.resolve-occluded-typography.initial',
    idempotencyKey: 'caption.resolve-occluded-typography.idempotency',
    caller: {
      callerKind: 'head_of_orchestra',
      callerId: 'canonical.head-of-orchestra',
    },
    assigneeSkillKey: 'captions',
    job: {
      jobId: 'caption.resolve-occluded-typography.job',
      jobType: 'resolve_subject_occluded_typography',
      requestedMode: 'private_internal',
      scopeLevel: 'scene',
    },
    canonicalScope: {
      ownerUserId: 'owner.fixture',
      workspaceId: 'workspace.fixture',
      projectId: 'project.fixture',
      editSessionId: 'edit.fixture',
      approvedSnapshotRef: ref('snapshot.fixture'),
      outputId: 'output.vertical',
      sceneId: 'scene.speaker',
      boundaryId: null,
      authorizedFrameRanges: [{
        startFrame: 120,
        endFrameExclusive: 240,
      }],
    },
    manifestRef: ref('captions.manifest'),
    qualificationSnapshotRef: ref('captions.qualification'),
    inputArtifactRefs: [
      artifact('canonical_transcript', 'canonical_transcript', null),
      artifact('confirmed_output_frame', 'canonical_frame_owner', null),
      artifact('master_timing', 'master_timing', null),
    ],
    injectedSupportArtifactRefs: [],
    resumeOfSupportRequestRef: null,
    resumeOriginCallRef: null,
    authorityBoundary: closedAuthority(),
    privateArtifactPolicy: {
      tenantScoped: true,
      byteFreeCoordinationOnly: true,
      rawChatAllowed: false,
      mediaBytesAllowed: false,
      urlOrPathAllowed: false,
    },
  }
  return parseOrchestraSkillCall({
    ...withoutDigest,
    callDigestSha256: digest(withoutDigest, 'callDigestSha256'),
  })
}

function supportRequestFixture(
  call: OrchestraSkillCall,
  targetSkillKey: SkillSupportRequest['targetSkillKey'],
  requestedArtifactTypes: string[],
  requestId: string,
): SkillSupportRequest {
  const withoutDigest: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: 'skill-support-request-v1',
    requestId,
    originalCallRef: callRef(call),
    requestingSkillKey: call.assigneeSkillKey,
    targetSkillKey,
    reasonCode: `caption.requires-${targetSkillKey}`,
    requestedArtifactTypes,
    canonicalScope: structuredClone(call.canonicalScope),
    typedPayloadType: `caption-${targetSkillKey}-support-payload-v1`,
    typedPayload: {
      schemaVersion: `caption-${targetSkillKey}-support-payload-v1`,
      exactCanonicalScopeRequired: true,
    },
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: closedAuthority(),
  }
  return parseSkillSupportRequest({
    ...withoutDigest,
    requestDigestSha256: digest(withoutDigest, 'requestDigestSha256'),
  })
}

function resultFixture(
  call: OrchestraSkillCall,
  input: {
    disposition: OrchestraSkillJobResult['disposition']
    supportRequests?: SkillSupportRequest[]
    producedArtifactRefs?: SkillArtifactRef[]
  },
): OrchestraSkillJobResult {
  const withoutDigest: Omit<OrchestraSkillJobResult, 'resultDigestSha256'> = {
    schemaVersion: 'orchestra-skill-job-result-v1',
    resultId: `result.${call.callId}`,
    disposition: input.disposition,
    originalCallRef: callRef(call),
    producerSkillKey: call.assigneeSkillKey,
    jobType: call.job.jobType,
    manifestRef: structuredClone(call.manifestRef),
    qualificationSnapshotRef: structuredClone(call.qualificationSnapshotRef),
    canonicalScope: structuredClone(call.canonicalScope),
    producedArtifactRefs: input.producedArtifactRefs ?? [],
    supportRequests: input.supportRequests ?? [],
    reasonCodes: input.disposition === 'needs_followup'
      ? ['authenticated-owner-evidence-required']
      : ['specialist-job-completed'],
    safeUserSummary: input.disposition === 'needs_followup'
      ? 'Waiting for authenticated shared-owner evidence.'
      : 'Specialist result is ready for the next canonical gate.',
    replayBinding: {
      idempotencyKey: call.idempotencyKey,
      resumedFromSupportRequestRef:
        structuredClone(call.resumeOfSupportRequestRef),
      resumeOriginCallRef: structuredClone(call.resumeOriginCallRef),
    },
    authorityBoundary: closedAuthority(),
  }
  return parseOrchestraSkillJobResult({
    ...withoutDigest,
    resultDigestSha256: digest(withoutDigest, 'resultDigestSha256'),
  })
}

function projectionFixture(
  request: SkillSupportRequest,
  artifactType: string,
) {
  return createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
    ...projectionBase(request, artifactType),
  })
}

function projectionBase(
  request: SkillSupportRequest,
  artifactType: string,
) {
  const supportReference = requestRef(request)
  return {
    schemaVersion:
      'canonical-authenticated-specialist-support-artifact-projection-v1' as const,
    projectionId: `projection.${request.targetSkillKey}.${artifactType}`,
    originalCallRef: structuredClone(request.originalCallRef),
    supportRequestRef: supportReference,
    ownerResultRef: ref(`owner-result.${request.targetSkillKey}`),
    ownerKey: request.targetSkillKey,
    canonicalScope: structuredClone(request.canonicalScope),
    artifactRefs: [artifact(
      artifactType,
      request.targetSkillKey,
      supportReference,
    )],
    authenticatedPrincipalVerified: true as const,
    exactApprovedSnapshotReread: true as const,
    exactCanonicalScopeReread: true as const,
    exactOwnerResultReread: true as const,
    ownerResultPersistedBeforeProjection: true as const,
    browserLocalStateUsed: false as const,
    rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false as const,
    directPeerDispatchPerformed: false as const,
    timelineMutationPerformed: false as const,
    runtimeExecutionAuthorityGrantedToSpecialist: false as const,
    assetMutationAuthorityGrantedToSpecialist: false as const,
    costOrBillingAuthorityGrantedToSpecialist: false as const,
    finalQaApprovalGrantedToSpecialist: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

function projectionWithoutDigest(
  projection: ReturnType<typeof projectionFixture>,
) {
  const copy = structuredClone(projection)
  Reflect.deleteProperty(copy, 'projectionDigestSha256')
  return copy
}

function artifact(
  artifactType: string,
  producerSkillKey: string,
  sourceSupportRequestRef: SkillContractRef | null,
): SkillArtifactRef {
  return {
    ...ref(`artifact.${artifactType}.${producerSkillKey}`),
    artifactType,
    producerSkillKey,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef,
  }
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function ref(id: string): SkillContractRef {
  return {
    id,
    version: 'fixture-v1',
    contentHash: createHash('sha256').update(id).digest('hex'),
  }
}

function closedAuthority() {
  return {
    scopeExpansionGranted: false as const,
    timelineMutationGranted: false as const,
    directPeerDispatchGranted: false as const,
    providerCallGranted: false as const,
    runtimeExecutionGranted: false as const,
    assetCreationGranted: false as const,
    costAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    qaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

function digest(value: unknown, field: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    field,
  )
}

function memoryObjectPort(
  records: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = records.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = records.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
