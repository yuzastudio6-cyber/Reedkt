import { z } from 'zod'

import type {
  OrchestraSkillCall,
  SkillSupportRequest,
} from '../../../src/types/orchestra-skill-capability'
import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  parseOrchestraSkillCall,
  parseSkillSupportRequest,
} from '../../orchestra/orchestra-skill-capability-contract'
import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_ORCHESTRA_BINDING_VERSION =
  'canonical-track-all-sam3_1-orchestra-binding-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE =
  'track_subject_geometry' as const
export const CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE =
  'produce_exact_subject_geometry' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const bindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_ORCHESTRA_BINDING_VERSION,
  ),
  source: z.literal('canonical_server_track_all_sam3_1_orchestra_binding'),
  bindingId: safeId,
  orchestraCall: z.unknown(),
  orchestraCallRef: evidenceRefSchema,
  supportRequest: z.unknown().nullable(),
  supportRequestRef: evidenceRefSchema.nullable(),
  targetSkillKey: z.literal('track_all'),
  jobType: z.literal(CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  dispatchAdmissionRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  orchestraAttemptEnvelopeRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  sourceArtifactRef: evidenceRefSchema,
  selectedSceneBindingRef: evidenceRefSchema,
  trackAllOwnsTrackingAndMaskArtifacts: z.literal(true),
  visualIntelligenceMayInspectButNotCreateOrMutateTrackingArtifacts:
    z.literal(true),
  orchestraOwnsInvocationWorkGraphAndResultRouting: z.literal(true),
  orchestraToGpuAttemptLineageVerified: z.literal(true),
  peerSkillSupportRequestAcceptedOnlyThroughOrchestra: z.literal(true),
  directUserOrPeerSkillDispatchAccepted: z.literal(false),
  visualIntelligenceDispatchAuthorityAccepted: z.literal(false),
  callerSelectedModelRouteImageCommandOrPriceAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const canonicalTrackAllSam31OrchestraBindingSchema =
  bindingWithoutHashSchema.extend({ bindingHash: sha256 }).strict()
export type CanonicalTrackAllSam31OrchestraBinding = z.infer<
  typeof canonicalTrackAllSam31OrchestraBindingSchema
>

/**
 * Binds one already-admitted SAM 3.1 attempt to the provider-neutral Track All
 * skill call that the Orchestra authorized. This is a runtime handoff, not a
 * Track All planner, tracker, or alternate dispatch owner.
 */
export function createCanonicalTrackAllSam31OrchestraBinding(input: {
  readonly bindingId: string
  readonly call: unknown
  readonly supportRequest?: unknown
  readonly admission: unknown
}): CanonicalTrackAllSam31OrchestraBinding {
  const call = parseOrchestraSkillCall(input.call)
  const supportRequest = parseSupportRequestForCall(
    call,
    input.supportRequest,
  )
  const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    input.admission,
  )
  assertTrackAllCall(call)
  assertCallMatchesAdmission({ call, admission })
  const scope = call.scope
  if (scope.scopeType !== 'scene') {
    throw new TypeError('Track All SAM 3.1 execution requires scene scope.')
  }
  const payload = bindingWithoutHashSchema.parse({
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_ORCHESTRA_BINDING_VERSION,
    source: 'canonical_server_track_all_sam3_1_orchestra_binding',
    bindingId: input.bindingId,
    orchestraCall: call,
    orchestraCallRef: ref(call.callId, call.callDigestSha256),
    supportRequest,
    supportRequestRef: supportRequest
      ? ref(supportRequest.requestId, supportRequest.requestDigestSha256)
      : null,
    targetSkillKey: 'track_all',
    jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    dispatchAdmissionRef: ref(admission.admissionId, admission.admissionHash),
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    confirmedOutputFrameRef: admission.scope.confirmedOutputFrameRef,
    masterTimingRef: admission.scope.masterTimingRef,
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    workerLeaseRef: admission.scope.workerLeaseRef,
    fundedReservationRef: admission.scope.fundedReservationRef,
    orchestraAttemptEnvelopeRef: call.attemptEnvelopeRef,
    executionAttemptRef: admission.scope.executionAttemptRef,
    sourceArtifactRef: scope.sourceArtifactRef,
    selectedSceneBindingRef: scope.selectedSceneBindingRef,
    trackAllOwnsTrackingAndMaskArtifacts: true,
    visualIntelligenceMayInspectButNotCreateOrMutateTrackingArtifacts: true,
    orchestraOwnsInvocationWorkGraphAndResultRouting: true,
    orchestraToGpuAttemptLineageVerified: true,
    peerSkillSupportRequestAcceptedOnlyThroughOrchestra: true,
    directUserOrPeerSkillDispatchAccepted: false,
    visualIntelligenceDispatchAuthorityAccepted: false,
    callerSelectedModelRouteImageCommandOrPriceAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return Object.freeze(canonicalTrackAllSam31OrchestraBindingSchema.parse({
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalTrackAllSam31OrchestraBinding(input: {
  readonly value: unknown
  readonly admission?: unknown
}): CanonicalTrackAllSam31OrchestraBinding {
  assertPlainSerializedData(input.value, 'track_all_sam3_1_orchestra_binding')
  const binding = canonicalTrackAllSam31OrchestraBindingSchema.parse(
    input.value,
  )
  const { bindingHash, ...payload } = binding
  if (bindingHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All SAM 3.1 binding hash is invalid.')
  }
  const call = parseOrchestraSkillCall(binding.orchestraCall)
  const supportRequest = parseSupportRequestForCall(
    call,
    binding.supportRequest,
  )
  assertTrackAllCall(call)
  const scope = call.scope
  if (
    scope.scopeType !== 'scene'
    || !sameRef(binding.orchestraCallRef,
      ref(call.callId, call.callDigestSha256))
    || (supportRequest === null
      ? binding.supportRequestRef !== null
      : binding.supportRequestRef === null
        || !sameRef(binding.supportRequestRef,
          ref(supportRequest.requestId, supportRequest.requestDigestSha256)))
    || binding.targetSkillKey !== call.targetSkillKey
    || binding.jobType !== call.jobType
    || !sameRef(binding.approvedSnapshotRef, call.approvedSnapshotRef!)
    || !sameRef(binding.orchestraAttemptEnvelopeRef,
      call.attemptEnvelopeRef)
    || !sameRef(binding.sourceArtifactRef, scope.sourceArtifactRef)
    || !sameRef(binding.selectedSceneBindingRef,
      scope.selectedSceneBindingRef)
  ) throw new TypeError(
    'Track All SAM 3.1 binding differs from its Orchestra call.',
  )
  if (input.admission !== undefined) {
    const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
      input.admission,
    )
    assertCallMatchesAdmission({ call, admission })
    if (
      !sameRef(binding.dispatchAdmissionRef,
        ref(admission.admissionId, admission.admissionHash))
      || !sameRef(binding.approvedSnapshotRef,
        admission.scope.approvedSnapshotRef)
      || !sameRef(binding.confirmedOutputFrameRef,
        admission.scope.confirmedOutputFrameRef)
      || !sameRef(binding.masterTimingRef, admission.scope.masterTimingRef)
      || !sameRef(binding.approvedWorkItemRef,
        admission.scope.approvedWorkItemRef)
      || !sameRef(binding.workerLeaseRef, admission.scope.workerLeaseRef)
      || !sameRef(binding.fundedReservationRef,
        admission.scope.fundedReservationRef)
      || !sameRef(binding.orchestraAttemptEnvelopeRef,
        call.attemptEnvelopeRef)
      || !sameRef(binding.executionAttemptRef,
        admission.scope.executionAttemptRef)
    ) throw new TypeError(
      'Track All SAM 3.1 binding differs from its dispatch admission.',
    )
  }
  return structuredClone(binding)
}

function assertTrackAllCall(call: OrchestraSkillCall): void {
  const scope = call.scope
  if (scope.scopeType !== 'scene') throw new TypeError(
    'SAM 3.1 requires a complete-scene Track All Orchestra call.',
  )
  if (
    call.targetSkillKey !== 'track_all'
    || call.jobType !== CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE
    || call.phase !== 'approved_execution'
    || !scope.completeSceneCoverageRequired
    || scope.authorizedRange.startFrame < 0
    || scope.authorizedRange.endFrameExclusive <=
      scope.authorizedRange.startFrame
    || call.sceneContextSnapshotRef === null
    || call.approvedSnapshotRef === null
    || !call.sourceArtifactRefs.some((item) =>
      sameRef(item, scope.sourceArtifactRef))
    || !call.requiredEvidenceRefs.some((item) =>
      sameRef(item, scope.selectedSceneBindingRef))
  ) throw new TypeError(
    'SAM 3.1 requires a complete-scene Track All Orchestra call.',
  )
}

function parseSupportRequestForCall(
  call: OrchestraSkillCall,
  value: unknown,
): SkillSupportRequest | null {
  if (call.requestedBy.kind === 'orchestra') {
    if (value !== undefined && value !== null) throw new TypeError(
      'Direct Orchestra Track All calls cannot carry a support request.',
    )
    return null
  }
  if (value === undefined || value === null) throw new TypeError(
    'Peer-originated Track All work requires the exact Orchestra support request.',
  )
  const request = parseSkillSupportRequest(value)
  const requestRef = ref(request.requestId, request.requestDigestSha256)
  if (
    !sameRef(call.requestedBy.supportRequestRef, requestRef)
    || call.requestedBy.skillKey !== request.requestingSkillKey
    || call.requestedBy.skillJobRef.id !== request.requestingSkillJobId
    || call.orchestraJobRef.id !== request.parentOrchestraJobId
    || request.requiredCapability !== 'track_all'
    || request.requestedJobType !== CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE
    || request.purposeCode !== CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE
    || request.phase !== call.phase
    || sha256AuthorityValue(request.scope) !== sha256AuthorityValue(call.scope)
    || sha256AuthorityValue(request.inputArtifactRefs) !==
      sha256AuthorityValue(call.sourceArtifactRefs)
    || sha256AuthorityValue(request.comparisonArtifactRefs) !==
      sha256AuthorityValue(call.comparisonArtifactRefs)
    || sha256AuthorityValue(request.expectedOutcomeRefs) !==
      sha256AuthorityValue(call.expectedOutcomeRefs)
    || sha256AuthorityValue(request.requiredEvidenceRefs) !==
      sha256AuthorityValue(call.requiredEvidenceRefs)
  ) throw new TypeError(
    'Track All peer support request does not exactly match the Orchestra call.',
  )
  return request
}

function assertCallMatchesAdmission(input: {
  readonly call: OrchestraSkillCall
  readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
}): void {
  const { call, admission } = input
  const scope = call.scope
  if (
    scope.scopeType !== 'scene'
    || admission.toolId !== 'sam3_1'
    || admission.operationId !== CANONICAL_SAM3_1_OPERATION_ID
    || scope.outputId.length === 0
    || call.approvedSnapshotRef === null
    || !sameRef(call.approvedSnapshotRef, admission.scope.approvedSnapshotRef)
  ) throw new TypeError(
    'Track All Orchestra call differs from the approved SAM 3.1 attempt.',
  )
}

function ref(id: string, digest: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: digest.startsWith('sha256:')
      ? digest
      : `sha256:${digest}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
