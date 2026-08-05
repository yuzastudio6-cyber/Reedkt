import { createHash } from 'node:crypto'
import {
  CAPTIONS_SPECIALIST_SKILL_KEY,
} from '../../src/types/captions-specialist'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  type OrchestraSkillCall,
  type OrchestraSkillJobResult,
  type SkillArtifactRef,
  type SkillContractRef,
  type SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import type {
  SkillRequestedMode,
  SkillScopeLevel,
} from '../../src/types/skill-capability-manifest'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTIONS_SPECIALIST_MANIFEST } from '../captions-specialist/captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from '../captions-specialist/captions-specialist-qualification'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT } from
  '../captions-specialist/captions-specialist-integration-qualification'
import {
  CAPTIONS_CLOSED_AUTHORITY_BOUNDARY,
  runCaptionsSpecialistJob,
} from '../captions-specialist/captions-specialist-runtime'

export const CAPTIONS_INTERNAL_HARNESS_VERSION =
  'captions-specialist-internal-harness-v1' as const

export interface CaptionsHarnessAuthorityState {
  timelineMutations: number
  providerCalls: number
  runtimeExecutions: number
  assetsCreated: number
  creditMutations: number
  billingMutations: number
  qaApprovals: number
  deliveries: number
}

export interface CaptionsHarnessRun {
  harnessVersion: typeof CAPTIONS_INTERNAL_HARNESS_VERSION
  initialCall: OrchestraSkillCall
  initialResult: OrchestraSkillJobResult
  resumedCall: OrchestraSkillCall | null
  resumedResult: OrchestraSkillJobResult | null
  capturedSupportRequests: SkillSupportRequest[]
  authorityStateBefore: CaptionsHarnessAuthorityState
  authorityStateAfter: CaptionsHarnessAuthorityState
}

export interface CaptionsHarnessSequentialResumeStep {
  stepNumber: number
  selectedSupportRequest: SkillSupportRequest
  promotedPriorSupportArtifactRefs: SkillArtifactRef[]
  resumedCall: OrchestraSkillCall
  resumedResult: OrchestraSkillJobResult
}

export interface CaptionsHarnessSequentialRun {
  harnessVersion: typeof CAPTIONS_INTERNAL_HARNESS_VERSION
  initialCall: OrchestraSkillCall
  initialResult: OrchestraSkillJobResult
  resumeSteps: CaptionsHarnessSequentialResumeStep[]
  finalResult: OrchestraSkillJobResult
  authorityStateBefore: CaptionsHarnessAuthorityState
  authorityStateAfter: CaptionsHarnessAuthorityState
  completedWithoutDirectPeerDispatch: boolean
}

export type CaptionsHarnessRuntimeEvidenceInput = Omit<
  Parameters<typeof runCaptionsSpecialistJob>[0],
  'call' | 'qualificationSnapshot' | 'manifest' | 'resumeSupportRequest'
>

export interface CaptionsHarnessSupportResolution {
  injectedSupportArtifactRefs: SkillArtifactRef[]
  runtimeEvidence: CaptionsHarnessRuntimeEvidenceInput
}

export interface CaptionsHarnessSupportResolutionContext {
  stepNumber: number
  currentCall: OrchestraSkillCall
  currentResult: OrchestraSkillJobResult
  selectedSupportRequest: SkillSupportRequest
}

export type CaptionsHarnessSupportResolver = (
  context: CaptionsHarnessSupportResolutionContext,
) => CaptionsHarnessSupportResolution

const EMPTY_AUTHORITY_STATE: Readonly<CaptionsHarnessAuthorityState> =
  Object.freeze({
    timelineMutations: 0,
    providerCalls: 0,
    runtimeExecutions: 0,
    assetsCreated: 0,
    creditMutations: 0,
    billingMutations: 0,
    qaApprovals: 0,
    deliveries: 0,
  })

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function contractRef(
  id: string,
  version: string,
  contentHash: string,
): SkillContractRef {
  return { id, version, contentHash }
}

export function createCaptionsHarnessArtifact(
  artifactType: string,
  producerSkillKey = 'canonical_owner',
): SkillArtifactRef {
  return {
    id: `artifact.${artifactType}`,
    version: `${artifactType}-v1`,
    contentHash: sha256(`artifact:${artifactType}:canonical`),
    artifactType,
    producerSkillKey,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }
}

export function createCaptionsHarnessCall(input: {
  callId: string
  jobType: string
  scopeLevel: SkillScopeLevel
  requestedMode?: SkillRequestedMode
  inputArtifactTypes?: string[]
  outputId?: string | null
  sceneId?: string | null
  boundaryId?: string | null
  approvedSnapshotRef?: SkillContractRef | null
  runtimeProfile?: 'cap01_planning' | 'post_cap20_integration'
}): OrchestraSkillCall {
  const integrationProfile = input.runtimeProfile === 'post_cap20_integration'
  const manifest = integrationProfile
    ? CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
    : CAPTIONS_SPECIALIST_MANIFEST
  const qualification = integrationProfile
    ? CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    : CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT
  const callWithoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: input.callId,
    idempotencyKey: `${input.callId}.idempotency`,
    caller: {
      callerKind: 'internal_test_harness',
      callerId: 'captions.cap01.harness',
    },
    assigneeSkillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
    job: {
      jobId: `${input.callId}.job`,
      jobType: input.jobType,
      requestedMode: input.requestedMode ?? 'planning',
      scopeLevel: input.scopeLevel,
    },
    canonicalScope: {
      ownerUserId: 'owner.fixture',
      workspaceId: 'workspace.fixture',
      projectId: 'project.fixture',
      editSessionId: 'edit.fixture',
      approvedSnapshotRef: input.approvedSnapshotRef === undefined
        ? null : structuredClone(input.approvedSnapshotRef),
      outputId: input.outputId === undefined ? 'output.fixture' : input.outputId,
      sceneId: input.sceneId === undefined
        ? input.scopeLevel === 'scene' ? 'scene.fixture' : null
        : input.sceneId,
      boundaryId: input.boundaryId === undefined
        ? input.scopeLevel === 'boundary' ? 'boundary.fixture' : null
        : input.boundaryId,
      authorizedFrameRanges: input.scopeLevel === 'video'
        ? [{ startFrame: 0, endFrameExclusive: 900 }]
        : [{ startFrame: 120, endFrameExclusive: 240 }],
    },
    manifestRef: contractRef(
      manifest.manifestId,
      manifest.manifestSchemaVersion,
      manifest.manifestHash,
    ),
    qualificationSnapshotRef: contractRef(
      qualification.snapshotId,
      qualification.schemaVersion,
      qualification.snapshotDigestSha256,
    ),
    inputArtifactRefs: (input.inputArtifactTypes ?? [
      'canonical_transcript',
      'confirmed_output_frame',
      'master_timing_or_planning_timing',
    ]).map((artifactType) => createCaptionsHarnessArtifact(artifactType)),
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
    ...callWithoutDigest,
    callDigestSha256: calculateSkillContractDigest(
      { ...callWithoutDigest, callDigestSha256: '' },
      'callDigestSha256',
    ),
  })
}

export function resumeCaptionsHarnessCall(
  originalCall: OrchestraSkillCall,
  request: SkillSupportRequest,
  injectedSupportArtifactRefs?: SkillArtifactRef[],
): OrchestraSkillCall {
  const requestRef = contractRef(
    request.requestId,
    request.schemaVersion,
    request.requestDigestSha256,
  )
  const resumedWithoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    ...structuredClone(originalCall),
    callId: `${originalCall.callId}.resume`,
    idempotencyKey: originalCall.idempotencyKey,
    job: {
      ...structuredClone(originalCall.job),
      jobId: `${originalCall.job.jobId}.resume`,
    },
    inputArtifactRefs: [
      ...structuredClone(originalCall.inputArtifactRefs),
      ...originalCall.injectedSupportArtifactRefs.map((artifact) => ({
        ...structuredClone(artifact),
        sourceSupportRequestRef: null,
      })),
    ],
    injectedSupportArtifactRefs: injectedSupportArtifactRefs === undefined
      ? request.requestedArtifactTypes.map((artifactType) => ({
          ...createCaptionsHarnessArtifact(
            artifactType, request.targetSkillKey),
          id: `artifact.${artifactType}.support`,
          contentHash: sha256(
            `${request.requestDigestSha256}:${artifactType}:approved`,
          ),
          sourceSupportRequestRef: requestRef,
        }))
      : structuredClone(injectedSupportArtifactRefs),
    resumeOfSupportRequestRef: requestRef,
    resumeOriginCallRef: request.originalCallRef,
  }
  return parseOrchestraSkillCall({
    ...resumedWithoutDigest,
    callDigestSha256: calculateSkillContractDigest(
      { ...resumedWithoutDigest, callDigestSha256: '' },
      'callDigestSha256',
    ),
  })
}

export function runCaptionsInternalHarnessToCompletion(input: {
  call: OrchestraSkillCall
  maximumResumeSteps?: number
  initialRuntimeEvidence?: CaptionsHarnessRuntimeEvidenceInput
  resolveSupportRequest?: CaptionsHarnessSupportResolver
}): CaptionsHarnessSequentialRun {
  const authorityStateBefore = structuredClone(EMPTY_AUTHORITY_STATE)
  const initialCall = parseOrchestraSkillCall(input.call)
  const initialResult = runCaptionsSpecialistJob({
    call: initialCall,
    ...(input.initialRuntimeEvidence ?? {}),
  })
  const maximumResumeSteps = input.maximumResumeSteps ?? 8
  if (!Number.isInteger(maximumResumeSteps)
    || maximumResumeSteps < 1 || maximumResumeSteps > 32) {
    throw new Error('Caption harness resume-step bound is invalid.')
  }
  const resumeSteps: CaptionsHarnessSequentialResumeStep[] = []
  let currentCall = initialCall
  let currentResult = initialResult
  while (currentResult.disposition === 'needs_followup') {
    if (resumeSteps.length >= maximumResumeSteps) {
      throw new Error('Caption harness exceeded its bounded resume depth.')
    }
    const selectedSupportRequest = currentResult.supportRequests[0]
    if (!selectedSupportRequest) {
      throw new Error('Caption needs_followup result omitted its support request.')
    }
    const promotedPriorSupportArtifactRefs =
      currentCall.injectedSupportArtifactRefs.map((artifact) => ({
        ...structuredClone(artifact),
        sourceSupportRequestRef: null,
      }))
    const resolution = input.resolveSupportRequest?.({
      stepNumber: resumeSteps.length + 1,
      currentCall: structuredClone(currentCall),
      currentResult: structuredClone(currentResult),
      selectedSupportRequest: structuredClone(selectedSupportRequest),
    })
    const resumedCall = resumeCaptionsHarnessCall(
      currentCall,
      selectedSupportRequest,
      resolution?.injectedSupportArtifactRefs,
    )
    const resumedResult = runCaptionsSpecialistJob({
      call: resumedCall,
      resumeSupportRequest: selectedSupportRequest,
      ...(resolution?.runtimeEvidence ?? {}),
    })
    resumeSteps.push({
      stepNumber: resumeSteps.length + 1,
      selectedSupportRequest: structuredClone(selectedSupportRequest),
      promotedPriorSupportArtifactRefs,
      resumedCall: structuredClone(resumedCall),
      resumedResult: structuredClone(resumedResult),
    })
    currentCall = resumedCall
    currentResult = resumedResult
  }
  const authorityStateAfter = structuredClone(EMPTY_AUTHORITY_STATE)
  return {
    harnessVersion: CAPTIONS_INTERNAL_HARNESS_VERSION,
    initialCall: structuredClone(initialCall),
    initialResult: structuredClone(initialResult),
    resumeSteps,
    finalResult: structuredClone(currentResult),
    authorityStateBefore,
    authorityStateAfter,
    completedWithoutDirectPeerDispatch:
      currentResult.disposition === 'completed'
      && resumeSteps.every((step) =>
        step.selectedSupportRequest.mediationPolicy.hqMediated
        && !step.selectedSupportRequest.mediationPolicy
          .directPeerDispatchAllowed),
  }
}

export function runCaptionsInternalHarness(input: {
  call: OrchestraSkillCall
  autoResumeSingleSupportRequest?: boolean
}): CaptionsHarnessRun {
  const authorityStateBefore = structuredClone(EMPTY_AUTHORITY_STATE)
  const initialResult = runCaptionsSpecialistJob({ call: input.call })
  const capturedSupportRequests = structuredClone(initialResult.supportRequests)
  let resumedCall: OrchestraSkillCall | null = null
  let resumedResult: OrchestraSkillJobResult | null = null
  if (input.autoResumeSingleSupportRequest
    && capturedSupportRequests.length === 1) {
    resumedCall = resumeCaptionsHarnessCall(
      input.call,
      capturedSupportRequests[0],
    )
    resumedResult = runCaptionsSpecialistJob({
      call: resumedCall,
      resumeSupportRequest: capturedSupportRequests[0],
    })
  }
  const authorityStateAfter = structuredClone(EMPTY_AUTHORITY_STATE)
  return {
    harnessVersion: CAPTIONS_INTERNAL_HARNESS_VERSION,
    initialCall: structuredClone(input.call),
    initialResult,
    resumedCall,
    resumedResult,
    capturedSupportRequests,
    authorityStateBefore,
    authorityStateAfter,
  }
}
