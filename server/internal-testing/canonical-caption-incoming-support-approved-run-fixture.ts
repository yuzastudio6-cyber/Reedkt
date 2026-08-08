import type {
  CanonicalCaptionIncomingSupportPlanningAdmission,
} from '../captions-specialist/caption-source-led-professional-planning-owner'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  type CaptionsSupportJobType,
} from '../../src/types/captions-specialist'
import type {
  OrchestraSkillCall,
  SkillCanonicalScope,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillSupportRequestV2Digest,
  parseSkillSupportRequestV2,
} from '../orchestra/orchestra-skill-support-request-v2'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCaptionIncomingSupportRequestAdmission,
  createCanonicalCaptionIncomingSupportRequestRepository,
} from '../services/canonical-caption-incoming-support-request-service'

export interface CanonicalCaptionIncomingSupportApprovedRunRequestSpec {
  readonly requestingSkillKey:
    | 'living_frame'
    | 'transitions'
    | 'broll_owner'
    | 'canonical_layout_owner'
    | 'map'
  readonly jobType: CaptionsSupportJobType
  readonly reasonCode: string
  readonly typedPayloadType: string
  readonly typedPayload: unknown
  readonly boundaryId?: string | null
}

/**
 * Internal qualification fixture only. It persists exact neutral V2 requests
 * before approval and exposes the same admitted reader to planning and later
 * canonical execution. It does not schedule work or dispatch a peer.
 */
export async function createCanonicalCaptionIncomingSupportApprovedRunFixture(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix: string
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly outputId: string
    readonly sceneId: string
    readonly frameRange: {
      readonly startFrame: number
      readonly endFrameExclusive: number
    }
    readonly requests:
      readonly CanonicalCaptionIncomingSupportApprovedRunRequestSpec[]
    readonly admittedAt: string
  },
) {
  if (input.requests.length < 1 || input.requests.length > 8
    || new Set(input.requests.map((request) => request.jobType)).size
      !== input.requests.length) {
    throw new Error(
      'Caption incoming-support fixture requires one to eight distinct jobs.',
    )
  }
  const repository = createCanonicalCaptionIncomingSupportRequestRepository({
    objectPort: input.objectPort,
    prefix: input.prefix,
  })
  const planningAdmissions: CanonicalCaptionIncomingSupportPlanningAdmission[] =
    []
  for (const [index, spec] of input.requests.entries()) {
    const scope: SkillCanonicalScope = {
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      approvedSnapshotRef: null,
      outputId: input.outputId,
      sceneId: input.sceneId,
      boundaryId: spec.boundaryId ?? null,
      authorizedFrameRanges: [structuredClone(input.frameRange)],
    }
    const identity = calculateSkillContractDigest({
      prefix: input.prefix,
      index,
      spec,
      scope,
    }, 'unusedDigestField')
    const originalCall = createOriginalCall({
      callId: `caption.support.origin.${identity.slice(0, 32)}`,
      assigneeSkillKey: spec.requestingSkillKey,
      scope,
    })
    const request = createRequest({
      requestId: `caption.support.request.${identity.slice(0, 32)}`,
      originalCall,
      scope,
      spec,
    })
    const admission = createCanonicalCaptionIncomingSupportRequestAdmission({
      request,
      originalCall,
      admittedAt: input.admittedAt,
    })
    await repository.persistCreateOnly({ admission })
    planningAdmissions.push(Object.freeze({
      readPort: repository.readPort,
      requestRef: Object.freeze({ ...admission.requestRef }),
    }))
  }
  return Object.freeze({
    repository,
    readPort: repository.readPort,
    planningAdmissions: Object.freeze(planningAdmissions),
    requestCount: planningAdmissions.length,
    callerSuppliedExecutionEvidenceAccepted: false as const,
    directPeerDispatchPerformed: false as const,
    runtimeExecutionPerformed: false as const,
    productionAuthorityGranted: false as const,
  })
}

function createOriginalCall(input: {
  callId: string
  assigneeSkillKey: string
  scope: SkillCanonicalScope
}): OrchestraSkillCall {
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: 'orchestra-skill-call-v1',
    callId: input.callId,
    idempotencyKey: `${input.callId}.idempotency`,
    caller: {
      callerKind: 'head_of_orchestra',
      callerId: 'canonical-approved-edit-workflow',
    },
    assigneeSkillKey: input.assigneeSkillKey,
    job: {
      jobId: `${input.callId}.job`,
      jobType: 'request_caption_specialist_support',
      requestedMode: 'planning',
      scopeLevel: input.scope.boundaryId === null ? 'scene' : 'boundary',
    },
    canonicalScope: structuredClone(input.scope),
    manifestRef: ref(`${input.assigneeSkillKey}.support.manifest`),
    qualificationSnapshotRef:
      ref(`${input.assigneeSkillKey}.support.qualification`),
    inputArtifactRefs: [],
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

function createRequest(input: {
  requestId: string
  originalCall: OrchestraSkillCall
  scope: SkillCanonicalScope
  spec: CanonicalCaptionIncomingSupportApprovedRunRequestSpec
}): SkillSupportRequestV2 {
  const withoutDigest: Omit<SkillSupportRequestV2, 'requestDigestSha256'> = {
    schemaVersion: 'skill-support-request-v2',
    requestId: input.requestId,
    originalCallRef: {
      id: input.originalCall.callId,
      version: input.originalCall.schemaVersion,
      contentHash: input.originalCall.callDigestSha256,
    },
    requestingSkillKey: input.spec.requestingSkillKey,
    targetSkillKey: 'captions',
    requestedJobType: input.spec.jobType,
    reasonCode: input.spec.reasonCode,
    requestedArtifactTypes: [
      CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[input.spec.jobType],
    ],
    canonicalScope: structuredClone(input.scope),
    typedPayloadType: input.spec.typedPayloadType,
    typedPayload: structuredClone(input.spec.typedPayload),
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

function ref(id: string): SkillContractRef {
  return {
    id,
    version: 'caption-support-fixture-ref-v1',
    contentHash: calculateSkillContractDigest({ id }, 'unusedDigestField'),
  }
}
