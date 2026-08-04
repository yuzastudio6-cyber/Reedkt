import type {
  SkillRequestedMode,
  SkillScopeLevel,
} from './skill-capability-manifest'

export const SKILL_QUALIFICATION_SNAPSHOT_VERSION =
  'skill-qualification-snapshot-v1' as const
export const ORCHESTRA_SKILL_CALL_VERSION =
  'orchestra-skill-call-v1' as const
export const SKILL_SUPPORT_REQUEST_VERSION =
  'skill-support-request-v1' as const
export const ORCHESTRA_SKILL_JOB_RESULT_VERSION =
  'orchestra-skill-job-result-v1' as const

export interface SkillContractRef {
  id: string
  version: string
  contentHash: string
}

export interface SkillArtifactRef extends SkillContractRef {
  artifactType: string
  producerSkillKey: string
  privateArtifact: true
  byteFreeRef: true
  sourceSupportRequestRef: SkillContractRef | null
}

export interface SkillFrameRange {
  startFrame: number
  endFrameExclusive: number
}

export interface SkillCanonicalScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotRef: SkillContractRef | null
  outputId: string | null
  sceneId: string | null
  boundaryId: string | null
  authorizedFrameRanges: SkillFrameRange[]
}

export interface SkillClosedAuthorityBoundary {
  scopeExpansionGranted: false
  timelineMutationGranted: false
  directPeerDispatchGranted: false
  providerCallGranted: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  costAuthorityGranted: false
  billingAuthorityGranted: false
  qaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface SkillQualificationJobEntry {
  jobType: string
  status: 'qualified' | 'blocked' | 'disabled'
  qualifiedModes: SkillRequestedMode[]
  blockerCodes: string[]
  routeRefs: SkillContractRef[]
  evidenceRefs: SkillContractRef[]
  requiredEvidenceTypes: string[]
  contractDigestSha256: string
  manifestDigestSha256: string
}

export interface SkillQualificationSnapshot {
  schemaVersion: typeof SKILL_QUALIFICATION_SNAPSHOT_VERSION
  snapshotId: string
  snapshotDigestSha256: string
  skillKey: string
  manifestRef: SkillContractRef
  observedAt: string
  releaseRef: SkillContractRef
  jobEntries: SkillQualificationJobEntry[]
  wholeSkillQualificationClaimed: false
  productionQualificationClaimed: false
}

export interface OrchestraSkillCall {
  schemaVersion: typeof ORCHESTRA_SKILL_CALL_VERSION
  callId: string
  callDigestSha256: string
  idempotencyKey: string
  caller: {
    callerKind:
      | 'head_of_orchestra'
      | 'internal_test_harness'
      | 'approved_recovery_controller'
    callerId: string
  }
  assigneeSkillKey: string
  job: {
    jobId: string
    jobType: string
    requestedMode: SkillRequestedMode
    scopeLevel: SkillScopeLevel
  }
  canonicalScope: SkillCanonicalScope
  manifestRef: SkillContractRef
  qualificationSnapshotRef: SkillContractRef
  inputArtifactRefs: SkillArtifactRef[]
  injectedSupportArtifactRefs: SkillArtifactRef[]
  resumeOfSupportRequestRef: SkillContractRef | null
  resumeOriginCallRef: SkillContractRef | null
  authorityBoundary: SkillClosedAuthorityBoundary
  privateArtifactPolicy: {
    tenantScoped: true
    byteFreeCoordinationOnly: true
    rawChatAllowed: false
    mediaBytesAllowed: false
    urlOrPathAllowed: false
  }
}

export type SkillSupportTarget =
  | 'visual_intelligence'
  | 'track_all'
  | 'living_frame'
  | 'soundsync'
  | 'transitions'
  | 'broll_owner'
  | 'canonical_timing_owner'
  | 'canonical_layout_owner'

export interface SkillSupportRequest {
  schemaVersion: typeof SKILL_SUPPORT_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  originalCallRef: SkillContractRef
  requestingSkillKey: string
  targetSkillKey: SkillSupportTarget
  reasonCode: string
  requestedArtifactTypes: string[]
  canonicalScope: SkillCanonicalScope
  typedPayloadType: string
  typedPayload: unknown
  mediationPolicy: {
    hqMediated: true
    directPeerDispatchAllowed: false
    assigneeMayOnlyResumeAfterInjection: true
  }
  authorityBoundary: SkillClosedAuthorityBoundary
}

export interface OrchestraSkillJobResult {
  schemaVersion: typeof ORCHESTRA_SKILL_JOB_RESULT_VERSION
  resultId: string
  resultDigestSha256: string
  disposition:
    | 'completed'
    | 'needs_followup'
    | 'blocked'
    | 'unsupported'
    | 'failed'
  originalCallRef: SkillContractRef
  producerSkillKey: string
  jobType: string
  manifestRef: SkillContractRef
  qualificationSnapshotRef: SkillContractRef
  canonicalScope: SkillCanonicalScope
  producedArtifactRefs: SkillArtifactRef[]
  supportRequests: SkillSupportRequest[]
  reasonCodes: string[]
  safeUserSummary: string
  replayBinding: {
    idempotencyKey: string
    resumedFromSupportRequestRef: SkillContractRef | null
    resumeOriginCallRef: SkillContractRef | null
  }
  authorityBoundary: SkillClosedAuthorityBoundary
}
