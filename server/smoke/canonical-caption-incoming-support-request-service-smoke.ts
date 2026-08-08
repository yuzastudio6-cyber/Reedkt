import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  OrchestraSkillCall,
  SkillCanonicalScope,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillSupportRequestV2Digest,
  parseSkillSupportRequestV2,
} from '../orchestra/orchestra-skill-support-request-v2'
import {
  createCanonicalCaptionIncomingSupportRequestAdmission,
  createCanonicalCaptionIncomingSupportRequestRepository,
  parseCanonicalCaptionIncomingSupportRequestAdmission,
  resolveCanonicalCaptionIncomingSupportRequestForCall,
} from '../services/canonical-caption-incoming-support-request-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'

const root = await mkdtemp(join(tmpdir(), 'caption-incoming-support-'))
let checks = 0

try {
  const planningScope: SkillCanonicalScope = {
    ownerUserId: 'user-caption-support',
    workspaceId: 'workspace-caption-support',
    projectId: 'project-caption-support',
    editSessionId: 'edit-caption-support',
    approvedSnapshotRef: null,
    outputId: 'output-caption-support',
    sceneId: 'scene-caption-support',
    boundaryId: null,
    authorizedFrameRanges: [{ startFrame: 30, endFrameExclusive: 150 }],
  }
  const originalCall = makeCall({
    callId: 'living-frame-caption-support-origin',
    assigneeSkillKey: 'living_frame',
    jobType: 'request_caption_typography_support',
    scope: planningScope,
  })
  const request = makeRequest({ originalCall, scope: planningScope })
  const requestRef = supportRequestRef(request)
  const admission = createCanonicalCaptionIncomingSupportRequestAdmission({
    request,
    originalCall,
    admittedAt: '2026-08-08T15:00:00.000Z',
  })
  assert.equal(
    parseCanonicalCaptionIncomingSupportRequestAdmission(admission)
      .requestRef.contentHash,
    request.requestDigestSha256,
  )
  checks += 1

  const repository = createCanonicalCaptionIncomingSupportRequestRepository({
    objectPort: createCanonicalPrivateLocalJsonObjectPort({
      localStorageRoot: root,
    }),
  })
  assert.equal(await repository.persistCreateOnly({ admission }), 'created')
  assert.equal(
    await repository.persistCreateOnly({ admission }),
    'identical_replay',
  )
  checks += 2
  assert.deepEqual(await repository.rereadExact({ requestRef }), admission)
  assert.deepEqual(await repository.readPort.readExact({ requestRef }), {
    request,
    originalCall,
  })
  checks += 2

  const approvedSnapshotRef = ref('approved-caption-snapshot')
  const approvedCaptionCall = makeCall({
    callId: 'caption-approved-support-call',
    assigneeSkillKey: 'captions',
    jobType: 'provide_speech_derived_typography_spec',
    scope: { ...planningScope, approvedSnapshotRef },
    sourceSupportRequestRef: requestRef,
  })
  assert.equal(
    (await resolveCanonicalCaptionIncomingSupportRequestForCall({
      call: approvedCaptionCall,
      readPort: repository.readPort,
    }))?.requestDigestSha256,
    request.requestDigestSha256,
  )
  checks += 1

  const crossedOutputCall = makeCall({
    callId: 'caption-crossed-output-support-call',
    assigneeSkillKey: 'captions',
    jobType: 'provide_speech_derived_typography_spec',
    scope: {
      ...planningScope,
      approvedSnapshotRef,
      outputId: 'output-crossed-caption-support',
    },
    sourceSupportRequestRef: requestRef,
  })
  await assert.rejects(() =>
    resolveCanonicalCaptionIncomingSupportRequestForCall({
      call: crossedOutputCall,
      readPort: repository.readPort,
    }), /crossed its assignment/u)
  checks += 1

  const boundRequest = makeRequest({
    originalCall: makeCall({
      callId: 'living-frame-bound-snapshot-origin',
      assigneeSkillKey: 'living_frame',
      jobType: 'request_caption_typography_support',
      scope: { ...planningScope, approvedSnapshotRef: ref('old-snapshot') },
    }),
    scope: { ...planningScope, approvedSnapshotRef: ref('old-snapshot') },
    requestId: 'caption-bound-snapshot-support-request',
  })
  const boundAdmission = createCanonicalCaptionIncomingSupportRequestAdmission({
    request: boundRequest,
    originalCall: makeCall({
      callId: 'living-frame-bound-snapshot-origin',
      assigneeSkillKey: 'living_frame',
      jobType: 'request_caption_typography_support',
      scope: { ...planningScope, approvedSnapshotRef: ref('old-snapshot') },
    }),
    admittedAt: '2026-08-08T15:01:00.000Z',
  })
  await repository.persistCreateOnly({ admission: boundAdmission })
  const crossedSnapshotCall = makeCall({
    callId: 'caption-crossed-snapshot-support-call',
    assigneeSkillKey: 'captions',
    jobType: 'provide_speech_derived_typography_spec',
    scope: { ...planningScope, approvedSnapshotRef },
    sourceSupportRequestRef: supportRequestRef(boundRequest),
  })
  await assert.rejects(() =>
    resolveCanonicalCaptionIncomingSupportRequestForCall({
      call: crossedSnapshotCall,
      readPort: repository.readPort,
    }), /crossed its assignment/u)
  checks += 1

  const tampered = structuredClone(admission)
  tampered.request.reasonCode = 'tampered_reason'
  assert.throws(() =>
    parseCanonicalCaptionIncomingSupportRequestAdmission(tampered),
  /digest verification failed/u)
  checks += 1

  const wrongTargetWithoutDigest = {
    ...request,
    targetSkillKey: 'track_all',
    requestDigestSha256: '',
  } as unknown as Record<string, unknown>
  wrongTargetWithoutDigest.requestDigestSha256 =
    calculateSkillSupportRequestV2Digest(wrongTargetWithoutDigest)
  assert.throws(() => createCanonicalCaptionIncomingSupportRequestAdmission({
    request: parseSkillSupportRequestV2(wrongTargetWithoutDigest),
    originalCall,
    admittedAt: '2026-08-08T15:02:00.000Z',
  }), /crossed its owner/u)
  checks += 1

  const nonHqOrigin = makeCall({
    callId: 'caption-non-hq-support-origin',
    assigneeSkillKey: 'living_frame',
    jobType: 'request_caption_typography_support',
    scope: planningScope,
    callerKind: 'internal_test_harness',
  })
  const nonHqRequest = makeRequest({
    originalCall: nonHqOrigin,
    scope: planningScope,
    requestId: 'caption-non-hq-support-request',
  })
  assert.throws(() => createCanonicalCaptionIncomingSupportRequestAdmission({
    request: nonHqRequest,
    originalCall: nonHqOrigin,
    admittedAt: '2026-08-08T15:03:00.000Z',
  }), /crossed its owner/u)
  checks += 1

  console.log(JSON.stringify({
    smoke: 'canonical_caption_incoming_support_request_service',
    checks,
    status: 'passed',
    repositoryVersion: repository.schemaVersion,
    preapprovalRequestPromotedByMutation: false,
    exactApprovedSnapshotBoundByCanonicalWork: true,
    directPeerDispatchPerformed: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function makeRequest(input: {
  originalCall: OrchestraSkillCall
  scope: SkillCanonicalScope
  requestId?: string
}): SkillSupportRequestV2 {
  const withoutDigest: Omit<SkillSupportRequestV2, 'requestDigestSha256'> = {
    schemaVersion: 'skill-support-request-v2',
    requestId: input.requestId ?? 'caption-incoming-support-request',
    originalCallRef: callRef(input.originalCall),
    requestingSkillKey: input.originalCall.assigneeSkillKey,
    targetSkillKey: 'captions',
    requestedJobType: 'provide_speech_derived_typography_spec',
    reasonCode: 'speech_typography_required_for_visual_handoff',
    requestedArtifactTypes: ['caption_speech_derived_typography_spec'],
    canonicalScope: structuredClone(input.scope),
    typedPayloadType: 'caption-speech-typography-support-context-v1',
    typedPayload: {
      schemaVersion: 'caption-speech-typography-support-context-v1',
      semanticConceptRef: ref('caption-semantic-concept'),
      requesterMayDispatchCaptionDirectly: false,
    },
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequestV2({
    ...withoutDigest,
    requestDigestSha256: calculateSkillSupportRequestV2Digest(
      withoutDigest as unknown as Record<string, unknown>),
  })
}

function makeCall(input: {
  callId: string
  assigneeSkillKey: string
  jobType: string
  scope: SkillCanonicalScope
  sourceSupportRequestRef?: SkillContractRef
  callerKind?: OrchestraSkillCall['caller']['callerKind']
}): OrchestraSkillCall {
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: 'orchestra-skill-call-v1',
    callId: input.callId,
    idempotencyKey: `${input.callId}-idempotency`,
    caller: {
      callerKind: input.callerKind ?? 'head_of_orchestra',
      callerId: 'canonical-approved-edit-workflow',
    },
    assigneeSkillKey: input.assigneeSkillKey,
    job: {
      jobId: `${input.callId}-job`,
      jobType: input.jobType,
      requestedMode: 'planning',
      scopeLevel: input.scope.boundaryId !== null
        ? 'boundary' : input.scope.sceneId !== null ? 'scene' : 'video',
    },
    canonicalScope: structuredClone(input.scope),
    manifestRef: ref(`${input.assigneeSkillKey}-manifest`),
    qualificationSnapshotRef: ref(`${input.assigneeSkillKey}-qualification`),
    inputArtifactRefs: input.sourceSupportRequestRef === undefined ? [] : [{
      ...input.sourceSupportRequestRef,
      artifactType: 'source_skill_support_request',
      producerSkillKey: 'head_of_orchestra',
      privateArtifact: true,
      byteFreeRef: true,
      sourceSupportRequestRef: null,
    }],
    injectedSupportArtifactRefs: [],
    resumeOfSupportRequestRef: null,
    resumeOriginCallRef: null,
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
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
    callDigestSha256: calculateSkillContractDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'callDigestSha256',
    ),
  })
}

function ref(id: string): SkillContractRef {
  return {
    id,
    version: 'contract-v1',
    contentHash: calculateSkillContractDigest({ id }, 'unused'),
  }
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function supportRequestRef(request: SkillSupportRequestV2): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}
