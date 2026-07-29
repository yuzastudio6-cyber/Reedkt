import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_EVIDENCE_CLASSES,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_FACE_OUTCOMES,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_FAILURE_CODES,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_RECEIPT_CLASS,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_TERMINAL_STATES,
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_VERSION,
  type LivingFrameAuraFaceCpuEmbeddingOutputLease,
  type LivingFrameAuraFaceCpuRuntimeAuthority,
  type LivingFrameAuraFaceCpuRuntimeEvidenceClass,
  type LivingFrameAuraFaceCpuRuntimeFailureCode,
  type LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
  type LivingFrameAuraFaceCpuRuntimeReceipt,
  type LivingFrameAuraFaceCpuRuntimeSourceBindings,
  type LivingFrameAuraFaceCpuRuntimeTerminalState,
} from '../../src/types/living-frame-auraface-cpu-runtime'
import type {
  LivingFrameAuraFaceArtifactRequirements,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalPrivateToolDispatchConsumptionResponseSchema,
  type CanonicalPrivateToolDispatchConsumptionResponse,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  verifyLivingFrameAuraFaceArtifactRequirements,
} from './living-frame-auraface-artifact-requirements'

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EMBEDDING_DIMENSION = 512
const MINIMUM_IMAGE_BYTES = 33
const MAXIMUM_IMAGE_BYTES = 32 * 1024 * 1024
const MAXIMUM_RUNTIME_MILLISECONDS = 120_000
const EVIDENCE_CLASSES = new Set<string>(
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_EVIDENCE_CLASSES,
)
const TERMINAL_STATES = new Set<string>(
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_TERMINAL_STATES,
)
const FAILURE_CODES = new Set<string>(
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_FAILURE_CODES,
)
const FACE_OUTCOMES = new Set<string>(
  LIVING_FRAME_AURAFACE_CPU_RUNTIME_FACE_OUTCOMES,
)

const safeIdSchema = z.string().regex(SAFE_ID)
const sha256Schema = z.string().regex(SHA256)

const sourceBindingsSchema = z.object({
  artifactRequirementSetDigestSha256: sha256Schema,
  referenceArtifactId: safeIdSchema,
  referenceArtifactDigestSha256: sha256Schema,
  referenceContinuityEntryDigestSha256: sha256Schema,
  candidateArtifactId: safeIdSchema,
  candidateArtifactDigestSha256: sha256Schema,
  candidateContinuityEntryDigestSha256: sha256Schema,
  preprocessingSpecDigestSha256: sha256Schema,
  consentAndSafetyAdmissionDigestSha256: sha256Schema,
}).strict()

const authorityBoundarySchema = z.object({
  processBoundInputObservation: z.literal(true),
  processBoundModelBindingObservation: z.literal(true),
  processBoundSafetyAdmissionObservation: z.literal(true),
  processBoundHostInvocationObservation: z.literal(true),
  canonicalDispatchAuthority: z.literal(false),
  modelArtifactRepositoryAuthority: z.literal(false),
  modelArtifactMountAuthority: z.literal(false),
  inputArtifactReadAuthority: z.literal(false),
  consentAuthority: z.literal(false),
  identityVerificationAuthority: z.literal(false),
  likenessApprovalAuthority: z.literal(false),
  continuityDecisionAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationRegistryAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  artifactPersistenceAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const modelBindingSchema = z.object({
  canonicalOrder: z.union([z.literal(0), z.literal(1)]),
  requirementId: z.enum([
    'auraface_v1_embedding_model',
    'auraface_v1_face_detector',
  ]),
  artifactIdentityCode: z.enum([
    'glintr100_onnx',
    'scrfd_10g_bnkps_onnx',
  ]),
  sourceRevision: z.literal(
    'af6d057c9b0ec4071d4c49c80e3539258798b609',
  ),
  artifactFormat: z.literal('onnx'),
  byteLength: z.union([
    z.literal(260_694_151),
    z.literal(16_923_827),
  ]),
  contentSha256: z.enum([
    'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60',
    '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
  ]),
  artifactRecordIdDigestSha256: sha256Schema,
  descriptorDigestSha256: sha256Schema,
  mountConsumptionDigestSha256: sha256Schema,
  consumerScope: z.literal(
    'living-frame.auraface-continuity-measurement',
  ),
  executionTarget: z.literal('private_controlled_cpu'),
  objectVerifiedBeforeConsumer: z.literal(true),
  objectVerifiedAfterConsumer: z.literal(true),
  readOnlySourcePresented: z.literal(true),
  hostPathIncluded: z.literal(false),
  mountAliasIncluded: z.literal(false),
}).strict()

const outputSchema = z.object({
  embeddingDimension: z.literal(512),
  referenceFaceCount: z.literal(1),
  candidateFaceCount: z.literal(1),
  referenceInferenceOutputDigestSha256: sha256Schema,
  candidateInferenceOutputDigestSha256: sha256Schema,
  referenceEmbeddingDigestSha256: sha256Schema,
  candidateEmbeddingDigestSha256: sha256Schema,
  embeddingsIncluded: z.literal(false),
  rawImagesIncluded: z.literal(false),
  identityReferenceIncluded: z.literal(false),
  thresholdApplied: z.literal(false),
  identityOrLikenessApproved: z.literal(false),
  continuityDecisionCreated: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_AURAFACE_CPU_RUNTIME_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_AURAFACE_CPU_RUNTIME_RECEIPT_CLASS,
  ),
  runtimeObservationId: safeIdSchema,
  evidenceClass: z.enum(
    LIVING_FRAME_AURAFACE_CPU_RUNTIME_EVIDENCE_CLASSES,
  ),
  canonicalScope: z.object({
    workspaceId: safeIdSchema,
    projectId: safeIdSchema,
    editSessionId: safeIdSchema,
  }).strict(),
  sourceBindings: sourceBindingsSchema.extend({
    canonicalDispatchConsumptionResponseHash: sha256Schema,
    executionAttemptId: safeIdSchema,
    approvedPlanSnapshotId: safeIdSchema,
    approvedWorkItemId: safeIdSchema,
    expectedAssetId: safeIdSchema,
  }).strict(),
  operation: z.object({
    canonicalToolId: z.literal('transformers'),
    operationId: z.literal(
      'tool.transformers.measure_auraface_identity_continuity.v1',
    ),
    separateCpuContinuityAttempt: z.literal(true),
    excludedFromSharedComfyuiGpuAttempt: z.literal(true),
    exactReuseAddsNoAttempt: z.literal(true),
  }).strict(),
  modelBindings: z.tuple([
    modelBindingSchema,
    modelBindingSchema,
  ]),
  inputObservation: z.object({
    referenceContentType: z.enum(['image/png', 'image/jpeg']),
    candidateContentType: z.enum(['image/png', 'image/jpeg']),
    referenceByteLength: z.number().int()
      .min(MINIMUM_IMAGE_BYTES).max(MAXIMUM_IMAGE_BYTES),
    candidateByteLength: z.number().int()
      .min(MINIMUM_IMAGE_BYTES).max(MAXIMUM_IMAGE_BYTES),
    referenceContentSha256: sha256Schema,
    candidateContentSha256: sha256Schema,
    inputBytesIncluded: z.literal(false),
    callerBytesPathUrlOrCredentialAccepted: z.literal(false),
  }).strict(),
  hostObservation: z.object({
    terminalState: z.enum(
      LIVING_FRAME_AURAFACE_CPU_RUNTIME_TERMINAL_STATES,
    ),
    failureCode: z.enum(
      LIVING_FRAME_AURAFACE_CPU_RUNTIME_FAILURE_CODES,
    ),
    faceOutcome: z.enum(
      LIVING_FRAME_AURAFACE_CPU_RUNTIME_FACE_OUTCOMES,
    ),
    attemptAccepted: z.boolean(),
    detectorInferenceExecuted: z.boolean(),
    embeddingInferenceExecuted: z.boolean(),
    startedAt: z.string().datetime({ offset: true }),
    finishedAt: z.string().datetime({ offset: true }),
    elapsedMilliseconds: z.number().int().nonnegative()
      .max(MAXIMUM_RUNTIME_MILLISECONDS),
  }).strict(),
  output: outputSchema.optional(),
  outputLeaseIssued: z.boolean(),
  outputArtifactPersisted: z.literal(false),
  measurementPersisted: z.literal(false),
  assetManifestUpdated: z.literal(false),
  actualCostEvidenceCreated: z.literal(false),
  customerChargeCreated: z.literal(false),
  providerCallPerformed: z.literal(false),
  externalNetworkPerformed: z.literal(false),
  runtimeDownloadPerformed: z.literal(false),
  callerEndpointAccepted: z.literal(false),
  callerPathUrlCredentialCommandOrBytesAccepted: z.literal(false),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
  )).length(LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES.length),
  authorityBoundary: authorityBoundarySchema,
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export interface LivingFrameAuraFaceCpuPrivateInputItem {
  readonly role: 'reference' | 'candidate'
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly continuityEntryDigestSha256: string
  readonly contentType: 'image/png' | 'image/jpeg'
  readonly contentByteLength: number
  readonly contentSha256: string
  readonly contentBytes: Uint8Array
}

export interface LivingFrameAuraFaceCpuPrivateInputPacket {
  readonly packetClass:
    'process_bound_server_owned_auraface_input_packet_v1'
  readonly artifactRequirementSetDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly consentAndSafetyAdmissionDigestSha256: string
  readonly items: readonly [
    LivingFrameAuraFaceCpuPrivateInputItem,
    LivingFrameAuraFaceCpuPrivateInputItem,
  ]
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly browserShareable: false
  readonly productionReady: false
}

export interface LivingFrameAuraFaceCpuPrivateInputPort {
  readonly portClass:
    | 'controlled_fixture_auraface_input_port_v1'
    | 'private_server_owned_auraface_input_port_v1'
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly browserShareable: false
  readonly productionQualified: false
  readOnce(): Promise<LivingFrameAuraFaceCpuPrivateInputPacket>
}

export interface LivingFrameAuraFaceCpuModelBindingPacket {
  readonly packetClass:
    'process_bound_auraface_model_artifact_mount_binding_packet_v1'
  readonly artifactRequirementSetDigestSha256: string
  readonly bindings: readonly [
    LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
    LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
  ]
  readonly pathsIncluded: false
  readonly mountAliasesIncluded: false
  readonly modelBytesIncluded: false
  readonly runtimeDownloadsPerformed: false
  readonly productionReady: false
}

export interface LivingFrameAuraFaceCpuModelBindingPort {
  readonly portClass:
    | 'controlled_fixture_auraface_model_binding_port_v1'
    | 'private_canonical_model_mount_binding_port_v1'
  readonly callerLocatorAccepted: false
  readonly callerPathAccepted: false
  readonly callerBytesAccepted: false
  readonly callerUrlAccepted: false
  readonly productionQualified: false
  bindOnce(): Promise<LivingFrameAuraFaceCpuModelBindingPacket>
}

export interface LivingFrameAuraFaceCpuSafetyAdmissionPacket {
  readonly packetClass:
    'process_bound_auraface_safety_admission_packet_v1'
  readonly consentAndSafetyAdmissionDigestSha256: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly admissionOutcome: 'admitted_for_private_continuity_measurement'
  readonly realPersonConsentPolicyPassed: true
  readonly minorProtectionPolicyPassed: true
  readonly impersonationAndDeepfakePolicyPassed: true
  readonly documentarySafetyPolicyPassed: true
  readonly retentionAndDeletionPolicyPassed: true
  readonly identityApprovalGranted: false
  readonly subjectIdentityIncluded: false
  readonly rawPolicyEvidenceIncluded: false
  readonly productionReady: false
}

export interface LivingFrameAuraFaceCpuSafetyAdmissionPort {
  readonly portClass:
    | 'controlled_fixture_auraface_safety_admission_port_v1'
    | 'private_server_owned_auraface_safety_admission_port_v1'
  readonly callerAdmissionAccepted: false
  readonly callerConsentBooleanAccepted: false
  readonly callerIdentityAccepted: false
  readonly browserShareable: false
  readonly productionQualified: false
  readOnce(): Promise<LivingFrameAuraFaceCpuSafetyAdmissionPacket>
}

export interface LivingFrameAuraFaceCpuHostExecutionInput {
  readonly artifactRequirementSetDigestSha256: string
  readonly referenceImage: {
    readonly contentType: 'image/png' | 'image/jpeg'
    readonly contentSha256: string
    readonly contentBytes: Uint8Array
  }
  readonly candidateImage: {
    readonly contentType: 'image/png' | 'image/jpeg'
    readonly contentSha256: string
    readonly contentBytes: Uint8Array
  }
  readonly modelBindingPacketDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly callerThresholdAccepted: false
  readonly identityApprovalRequested: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
}

export interface LivingFrameAuraFaceCpuHostExecutionResult {
  readonly evidenceClass:
    LivingFrameAuraFaceCpuRuntimeEvidenceClass
  readonly terminalState:
    LivingFrameAuraFaceCpuRuntimeTerminalState
  readonly failureCode:
    LivingFrameAuraFaceCpuRuntimeFailureCode
  readonly faceOutcome:
    | 'not_observed'
    | 'exactly_one_face_each'
    | 'reference_no_face'
    | 'candidate_no_face'
    | 'reference_multiple_faces'
    | 'candidate_multiple_faces'
    | 'reference_and_candidate_face_count_invalid'
  readonly attemptAccepted: boolean
  readonly detectorInferenceExecuted: boolean
  readonly embeddingInferenceExecuted: boolean
  readonly startedAt: string
  readonly finishedAt: string
  readonly referenceInferenceOutputDigestSha256?: string
  readonly candidateInferenceOutputDigestSha256?: string
  readonly referenceEmbedding?: Float32Array
  readonly candidateEmbedding?: Float32Array
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
}

export interface LivingFrameAuraFaceCpuHostPort {
  readonly portClass:
    | 'controlled_fixture_auraface_cpu_host_port_v1'
    | 'private_offline_auraface_cpu_host_port_v1'
  readonly callerEndpointAccepted: false
  readonly callerPathUrlCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly productionQualified: false
  executeOne(
    input: LivingFrameAuraFaceCpuHostExecutionInput,
  ): Promise<LivingFrameAuraFaceCpuHostExecutionResult>
}

export interface LivingFrameAuraFaceCpuRuntimeInput {
  readonly artifactRequirements:
    LivingFrameAuraFaceArtifactRequirements
  readonly sourceBindings:
    LivingFrameAuraFaceCpuRuntimeSourceBindings
  readonly canonicalDispatchConsumption:
    CanonicalPrivateToolDispatchConsumptionResponse
  readonly inputPort:
    LivingFrameAuraFaceCpuPrivateInputPort
  readonly modelBindingPort:
    LivingFrameAuraFaceCpuModelBindingPort
  readonly safetyAdmissionPort:
    LivingFrameAuraFaceCpuSafetyAdmissionPort
  readonly hostPort:
    LivingFrameAuraFaceCpuHostPort
}

export interface LivingFrameAuraFaceCpuRuntimeResult {
  readonly receipt: LivingFrameAuraFaceCpuRuntimeReceipt
  readonly embeddingOutputLease?:
    LivingFrameAuraFaceCpuEmbeddingOutputLease
}

export interface LivingFrameAuraFaceCpuPrivateEmbeddingPacket {
  readonly packetClass:
    'process_bound_single_use_auraface_cpu_embedding_packet_v1'
  readonly runtimeObservationDigestSha256: string
  readonly evidenceClass:
    LivingFrameAuraFaceCpuRuntimeEvidenceClass
  readonly artifactRequirementSetDigestSha256: string
  readonly referenceArtifactDigestSha256: string
  readonly candidateArtifactDigestSha256: string
  readonly referenceContinuityEntryDigestSha256: string
  readonly candidateContinuityEntryDigestSha256: string
  readonly preprocessingSpecDigestSha256: string
  readonly referenceInferenceOutputDigestSha256: string
  readonly candidateInferenceOutputDigestSha256: string
  readonly embeddingDimension: 512
  readonly referenceFaceCount: 1
  readonly candidateFaceCount: 1
  readonly referenceEmbedding: Float32Array
  readonly candidateEmbedding: Float32Array
  readonly callerThresholdAccepted: false
  readonly embeddingPersistenceAuthorized: false
  readonly identityApprovalAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export class LivingFrameAuraFaceCpuRuntimeError extends Error {
  readonly code:
    | 'artifact_requirements_invalid'
    | 'canonical_dispatch_invalid'
    | 'canonical_dispatch_replay_forbidden'
    | 'canonical_operation_mismatch'
    | 'source_binding_invalid'
    | 'input_port_invalid'
    | 'input_port_reused'
    | 'input_packet_invalid'
    | 'input_packet_lineage_invalid'
    | 'model_binding_port_invalid'
    | 'model_binding_port_reused'
    | 'model_binding_invalid'
    | 'host_port_invalid'
    | 'host_execution_result_invalid'
    | 'face_outcome_invalid'
    | 'embedding_output_invalid'
    | 'output_lease_invalid'
    | 'output_lease_reused'
    | 'unsafe_receipt_forbidden'

  readonly path: string

  constructor(
    code: LivingFrameAuraFaceCpuRuntimeError['code'],
    path: string,
  ) {
    super(`${code} at ${path}`)
    this.code = code
    this.path = path
    this.name = 'LivingFrameAuraFaceCpuRuntimeError'
  }
}

const AUTHORITY_BOUNDARY:
  LivingFrameAuraFaceCpuRuntimeAuthority = deepFreeze({
    processBoundInputObservation: true,
    processBoundModelBindingObservation: true,
    processBoundSafetyAdmissionObservation: true,
    processBoundHostInvocationObservation: true,
    canonicalDispatchAuthority: false,
    modelArtifactRepositoryAuthority: false,
    modelArtifactMountAuthority: false,
    inputArtifactReadAuthority: false,
    consentAuthority: false,
    identityVerificationAuthority: false,
    likenessApprovalAuthority: false,
    continuityDecisionAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const inputPorts = new WeakSet<object>()
const modelBindingPorts = new WeakSet<object>()
const safetyAdmissionPorts = new WeakSet<object>()
const hostPorts = new WeakSet<object>()
const consumedInputPorts = new WeakSet<object>()
const consumedModelBindingPorts = new WeakSet<object>()
const consumedSafetyAdmissionPorts = new WeakSet<object>()
const outputLeases = new WeakSet<object>()
const consumedOutputLeases = new WeakSet<object>()
const embeddingPacketsByLease =
  new WeakMap<object, LivingFrameAuraFaceCpuPrivateEmbeddingPacket>()

export function registerLivingFrameAuraFaceCpuPrivateInputPort<
  T extends LivingFrameAuraFaceCpuPrivateInputPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_auraface_input_port_v1',
      'private_server_owned_auraface_input_port_v1',
    ].includes(port.portClass)
    || port.callerBytesAccepted !== false
    || port.callerPathAccepted !== false
    || port.callerUrlAccepted !== false
    || port.browserShareable !== false
    || port.productionQualified !== false
    || typeof port.readOnce !== 'function'
  ) throw invalid('input_port_invalid', '$.inputPort')
  inputPorts.add(port)
  return port
}

export function registerLivingFrameAuraFaceCpuModelBindingPort<
  T extends LivingFrameAuraFaceCpuModelBindingPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_auraface_model_binding_port_v1',
      'private_canonical_model_mount_binding_port_v1',
    ].includes(port.portClass)
    || port.callerLocatorAccepted !== false
    || port.callerPathAccepted !== false
    || port.callerBytesAccepted !== false
    || port.callerUrlAccepted !== false
    || port.productionQualified !== false
    || typeof port.bindOnce !== 'function'
  ) throw invalid(
    'model_binding_port_invalid',
    '$.modelBindingPort',
  )
  modelBindingPorts.add(port)
  return port
}

export function registerLivingFrameAuraFaceCpuSafetyAdmissionPort<
  T extends LivingFrameAuraFaceCpuSafetyAdmissionPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_auraface_safety_admission_port_v1',
      'private_server_owned_auraface_safety_admission_port_v1',
    ].includes(port.portClass)
    || port.callerAdmissionAccepted !== false
    || port.callerConsentBooleanAccepted !== false
    || port.callerIdentityAccepted !== false
    || port.browserShareable !== false
    || port.productionQualified !== false
    || typeof port.readOnce !== 'function'
  ) throw invalid(
    'source_binding_invalid',
    '$.safetyAdmissionPort',
  )
  safetyAdmissionPorts.add(port)
  return port
}

export function registerLivingFrameAuraFaceCpuHostPort<
  T extends LivingFrameAuraFaceCpuHostPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_auraface_cpu_host_port_v1',
      'private_offline_auraface_cpu_host_port_v1',
    ].includes(port.portClass)
    || port.callerEndpointAccepted !== false
    || port.callerPathUrlCredentialAccepted !== false
    || port.externalNetworkAllowed !== false
    || port.runtimeDownloadsAllowed !== false
    || port.productionQualified !== false
    || typeof port.executeOne !== 'function'
  ) throw invalid('host_port_invalid', '$.hostPort')
  hostPorts.add(port)
  return port
}

export async function executeLivingFrameAuraFaceCpuRuntime(
  input: LivingFrameAuraFaceCpuRuntimeInput,
): Promise<LivingFrameAuraFaceCpuRuntimeResult> {
  if (
    !input
    || typeof input !== 'object'
    || !verifyLivingFrameAuraFaceArtifactRequirements(
      input.artifactRequirements,
    )
  ) throw invalid(
    'artifact_requirements_invalid',
    '$.artifactRequirements',
  )
  const sourceBindings = parseSourceBindings(
    input.sourceBindings,
    input.artifactRequirements,
  )
  const dispatch = assertCanonicalDispatch(
    input.canonicalDispatchConsumption,
  )
  assertScopeMatchesDispatch(sourceBindings, dispatch)
  assertInputPort(input.inputPort)
  assertModelBindingPort(input.modelBindingPort)
  assertSafetyAdmissionPort(input.safetyAdmissionPort)
  assertHostPort(input.hostPort)
  assertPortClassesCompatible(
    input.inputPort,
    input.modelBindingPort,
    input.safetyAdmissionPort,
    input.hostPort,
  )

  consumedInputPorts.add(input.inputPort)
  consumedModelBindingPorts.add(input.modelBindingPort)
  consumedSafetyAdmissionPorts.add(input.safetyAdmissionPort)
  let inputPacket: LivingFrameAuraFaceCpuPrivateInputPacket
  let modelPacket: LivingFrameAuraFaceCpuModelBindingPacket
  let safetyPacket: LivingFrameAuraFaceCpuSafetyAdmissionPacket
  try {
    safetyPacket = await input.safetyAdmissionPort.readOnce()
  } catch {
    throw invalid(
      'source_binding_invalid',
      '$.safetyAdmissionPort',
    )
  }
  assertSafetyAdmissionPacket(
    safetyPacket,
    sourceBindings,
    dispatch,
  )
  try {
    inputPacket = await input.inputPort.readOnce()
  } catch {
    throw invalid('input_packet_invalid', '$.inputPort')
  }
  try {
    modelPacket = await input.modelBindingPort.bindOnce()
  } catch {
    throw invalid(
      'model_binding_invalid',
      '$.modelBindingPort',
    )
  }
  const [reference, candidate] = assertInputPacket(
    inputPacket,
    sourceBindings,
  )
  const modelBindings = assertModelBindingPacket(
    modelPacket,
    input.artifactRequirements,
  )
  const modelBindingPacketDigestSha256 = digest(modelPacket)

  let hostResult: LivingFrameAuraFaceCpuHostExecutionResult
  try {
    hostResult = await input.hostPort.executeOne({
      artifactRequirementSetDigestSha256:
        sourceBindings.artifactRequirementSetDigestSha256,
      referenceImage: {
        contentType: reference.contentType,
        contentSha256: reference.contentSha256,
        contentBytes: copyBytes(reference.contentBytes),
      },
      candidateImage: {
        contentType: candidate.contentType,
        contentSha256: candidate.contentSha256,
        contentBytes: copyBytes(candidate.contentBytes),
      },
      modelBindingPacketDigestSha256,
      preprocessingSpecDigestSha256:
        sourceBindings.preprocessingSpecDigestSha256,
      callerThresholdAccepted: false,
      identityApprovalRequested: false,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
    })
  } catch {
    throw invalid(
      'host_execution_result_invalid',
      '$.hostPort',
    )
  }
  assertHostResult(hostResult, input.hostPort.portClass)

  const elapsedMilliseconds =
    Date.parse(hostResult.finishedAt)
    - Date.parse(hostResult.startedAt)
  const embeddingOutput =
    hostResult.terminalState === 'completed'
      ? inspectEmbeddings(hostResult)
      : undefined
  const runtimeObservationId =
    `lfauracpu_${digest({
      attemptId: dispatch.executionAttemptId,
      dispatchHash: dispatch.responseHash,
      requirements:
        input.artifactRequirements.requirementSetDigestSha256,
      inputs: [
        reference.contentSha256,
        candidate.contentSha256,
      ],
      modelBindingPacketDigestSha256,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      terminalState: hostResult.terminalState,
      output: embeddingOutput
        ? [
            embeddingOutput.referenceEmbeddingDigestSha256,
            embeddingOutput.candidateEmbeddingDigestSha256,
          ]
        : null,
    }).slice(0, 40)}`
  const draft = {
    contractVersion:
      LIVING_FRAME_AURAFACE_CPU_RUNTIME_VERSION,
    resultClass:
      LIVING_FRAME_AURAFACE_CPU_RUNTIME_RECEIPT_CLASS,
    runtimeObservationId,
    evidenceClass: hostResult.evidenceClass,
    canonicalScope: {
      workspaceId: dispatch.grant.binding.workspaceId,
      projectId: dispatch.grant.binding.projectId,
      editSessionId: dispatch.grant.binding.editSessionId,
    },
    sourceBindings: {
      ...sourceBindings,
      canonicalDispatchConsumptionResponseHash:
        dispatch.responseHash,
      executionAttemptId: dispatch.executionAttemptId,
      approvedPlanSnapshotId:
        dispatch.grant.binding.approvedPlanSnapshotId,
      approvedWorkItemId:
        dispatch.grant.binding.approvedWorkItemId,
      expectedAssetId:
        dispatch.grant.binding.expectedAssetId,
    },
    operation: {
      canonicalToolId: 'transformers' as const,
      operationId:
        'tool.transformers.measure_auraface_identity_continuity.v1' as const,
      separateCpuContinuityAttempt: true as const,
      excludedFromSharedComfyuiGpuAttempt: true as const,
      exactReuseAddsNoAttempt: true as const,
    },
    modelBindings,
    inputObservation: {
      referenceContentType: reference.contentType,
      candidateContentType: candidate.contentType,
      referenceByteLength: reference.contentByteLength,
      candidateByteLength: candidate.contentByteLength,
      referenceContentSha256: reference.contentSha256,
      candidateContentSha256: candidate.contentSha256,
      inputBytesIncluded: false as const,
      callerBytesPathUrlOrCredentialAccepted: false as const,
    },
    hostObservation: {
      terminalState: hostResult.terminalState,
      failureCode: hostResult.failureCode,
      faceOutcome: hostResult.faceOutcome,
      attemptAccepted: hostResult.attemptAccepted,
      detectorInferenceExecuted:
        hostResult.detectorInferenceExecuted,
      embeddingInferenceExecuted:
        hostResult.embeddingInferenceExecuted,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      elapsedMilliseconds,
    },
    output: embeddingOutput
      ? {
          embeddingDimension: 512 as const,
          referenceFaceCount: 1 as const,
          candidateFaceCount: 1 as const,
          referenceInferenceOutputDigestSha256:
            hostResult.referenceInferenceOutputDigestSha256!,
          candidateInferenceOutputDigestSha256:
            hostResult.candidateInferenceOutputDigestSha256!,
          referenceEmbeddingDigestSha256:
            embeddingOutput.referenceEmbeddingDigestSha256,
          candidateEmbeddingDigestSha256:
            embeddingOutput.candidateEmbeddingDigestSha256,
          embeddingsIncluded: false as const,
          rawImagesIncluded: false as const,
          identityReferenceIncluded: false as const,
          thresholdApplied: false as const,
          identityOrLikenessApproved: false as const,
          continuityDecisionCreated: false as const,
        }
      : undefined,
    outputLeaseIssued: embeddingOutput !== undefined,
    outputArtifactPersisted: false as const,
    measurementPersisted: false as const,
    assetManifestUpdated: false as const,
    actualCostEvidenceCreated: false as const,
    customerChargeCreated: false as const,
    providerCallPerformed: false as const,
    externalNetworkPerformed: false as const,
    runtimeDownloadPerformed: false as const,
    callerEndpointAccepted: false as const,
    callerPathUrlCredentialCommandOrBytesAccepted: false as const,
    openGateCodes: [
      ...LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
    ],
    authorityBoundary: AUTHORITY_BOUNDARY,
    subjectSpecificRouting: false as const,
    productionReady: false as const,
  }
  assertReceiptSafe(draft)
  const receipt = deepFreeze({
    ...draft,
    runtimeObservationDigestSha256: digest(draft),
  }) as LivingFrameAuraFaceCpuRuntimeReceipt
  if (!embeddingOutput) return { receipt }

  const lease = deepFreeze({
    leaseClass:
      'process_bound_single_use_unpersisted_auraface_embedding_output_lease_v1' as const,
    leaseId:
      `lfauralease_${digest({
        runtimeObservationDigestSha256:
          receipt.runtimeObservationDigestSha256,
        reference: embeddingOutput.referenceEmbeddingDigestSha256,
        candidate: embeddingOutput.candidateEmbeddingDigestSha256,
      }).slice(0, 40)}`,
    runtimeObservationDigestSha256:
      receipt.runtimeObservationDigestSha256,
    evidenceClass: hostResult.evidenceClass,
    artifactRequirementSetDigestSha256:
      sourceBindings.artifactRequirementSetDigestSha256,
    referenceArtifactDigestSha256:
      sourceBindings.referenceArtifactDigestSha256,
    candidateArtifactDigestSha256:
      sourceBindings.candidateArtifactDigestSha256,
    referenceContinuityEntryDigestSha256:
      sourceBindings.referenceContinuityEntryDigestSha256,
    candidateContinuityEntryDigestSha256:
      sourceBindings.candidateContinuityEntryDigestSha256,
    preprocessingSpecDigestSha256:
      sourceBindings.preprocessingSpecDigestSha256,
    referenceInferenceOutputDigestSha256:
      hostResult.referenceInferenceOutputDigestSha256!,
    candidateInferenceOutputDigestSha256:
      hostResult.candidateInferenceOutputDigestSha256!,
    embeddingDimension: 512 as const,
    callerSerializable: false as const,
    embeddingPersistenceAuthority: false as const,
    identityApprovalAuthority: false as const,
    actualCostAuthority: false as const,
    productionReady: false as const,
  })
  const packet: LivingFrameAuraFaceCpuPrivateEmbeddingPacket =
    deepFreeze({
      packetClass:
        'process_bound_single_use_auraface_cpu_embedding_packet_v1',
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      evidenceClass: hostResult.evidenceClass,
      artifactRequirementSetDigestSha256:
        sourceBindings.artifactRequirementSetDigestSha256,
      referenceArtifactDigestSha256:
        sourceBindings.referenceArtifactDigestSha256,
      candidateArtifactDigestSha256:
        sourceBindings.candidateArtifactDigestSha256,
      referenceContinuityEntryDigestSha256:
        sourceBindings.referenceContinuityEntryDigestSha256,
      candidateContinuityEntryDigestSha256:
        sourceBindings.candidateContinuityEntryDigestSha256,
      preprocessingSpecDigestSha256:
        sourceBindings.preprocessingSpecDigestSha256,
      referenceInferenceOutputDigestSha256:
        hostResult.referenceInferenceOutputDigestSha256!,
      candidateInferenceOutputDigestSha256:
        hostResult.candidateInferenceOutputDigestSha256!,
      embeddingDimension: 512,
      referenceFaceCount: 1,
      candidateFaceCount: 1,
      referenceEmbedding: embeddingOutput.referenceEmbedding,
      candidateEmbedding: embeddingOutput.candidateEmbedding,
      callerThresholdAccepted: false,
      embeddingPersistenceAuthorized: false,
      identityApprovalAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
    })
  outputLeases.add(lease)
  embeddingPacketsByLease.set(lease, packet)
  return { receipt, embeddingOutputLease: lease }
}

export function consumeLivingFrameAuraFaceCpuEmbeddingOutputLease(
  lease: LivingFrameAuraFaceCpuEmbeddingOutputLease,
): LivingFrameAuraFaceCpuPrivateEmbeddingPacket {
  if (
    !lease
    || typeof lease !== 'object'
    || !outputLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_unpersisted_auraface_embedding_output_lease_v1'
    || !SAFE_ID.test(lease.leaseId)
    || !SHA256.test(lease.runtimeObservationDigestSha256)
    || !EVIDENCE_CLASSES.has(lease.evidenceClass)
    || lease.callerSerializable !== false
    || lease.embeddingPersistenceAuthority !== false
    || lease.identityApprovalAuthority !== false
    || lease.actualCostAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('output_lease_invalid', '$.lease')
  if (consumedOutputLeases.has(lease)) {
    throw invalid('output_lease_reused', '$.lease')
  }
  const packet = embeddingPacketsByLease.get(lease)
  if (!packet) throw invalid('output_lease_invalid', '$.lease')
  consumedOutputLeases.add(lease)
  embeddingPacketsByLease.delete(lease)
  return packet
}

export function verifyLivingFrameAuraFaceCpuRuntimeReceipt(
  value: unknown,
): value is LivingFrameAuraFaceCpuRuntimeReceipt {
  if (!isRecord(value)) return false
  const digestValue = value.runtimeObservationDigestSha256
  if (
    typeof digestValue !== 'string'
    || !SHA256.test(digestValue)
  ) return false
  const {
    runtimeObservationDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  try {
    assertReceiptSafe(draft)
    return digest(draft) === digestValue
  } catch {
    return false
  }
}

function assertCanonicalDispatch(
  value: unknown,
): CanonicalPrivateToolDispatchConsumptionResponse {
  const parsed =
    canonicalPrivateToolDispatchConsumptionResponseSchema
      .safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'canonical_dispatch_invalid',
      '$.canonicalDispatchConsumption',
    )
  }
  const { responseHash, ...withoutHash } = parsed.data
  if (sha256AuthorityValue(withoutHash) !== responseHash) {
    throw invalid(
      'canonical_dispatch_invalid',
      '$.canonicalDispatchConsumption.responseHash',
    )
  }
  if (
    parsed.data.consumptionReplayed
    || !parsed.data.executionAuthority
      .newExecutionStartAuthorized
    || !parsed.data.executionAuthority.toolExecutionAuthorized
  ) throw invalid(
    'canonical_dispatch_replay_forbidden',
    '$.canonicalDispatchConsumption.executionAuthority',
  )
  if (
    parsed.data.grant.binding.canonicalToolId !== 'transformers'
    || parsed.data.grant.binding.operationId
      !== 'tool.transformers.measure_auraface_identity_continuity.v1'
    || parsed.data.grant.binding.expectedOutput.contentType
      !== 'application/json'
  ) throw invalid(
    'canonical_operation_mismatch',
    '$.canonicalDispatchConsumption.grant.binding',
  )
  return parsed.data
}

function parseSourceBindings(
  value: unknown,
  requirements: LivingFrameAuraFaceArtifactRequirements,
): LivingFrameAuraFaceCpuRuntimeSourceBindings {
  const parsed = sourceBindingsSchema.safeParse(value)
  if (
    !parsed.success
    || parsed.data.artifactRequirementSetDigestSha256
      !== requirements.requirementSetDigestSha256
    || parsed.data.referenceArtifactId
      === parsed.data.candidateArtifactId
    || parsed.data.referenceArtifactDigestSha256
      === parsed.data.candidateArtifactDigestSha256
    || parsed.data.referenceContinuityEntryDigestSha256
      === parsed.data.candidateContinuityEntryDigestSha256
  ) throw invalid(
    'source_binding_invalid',
    '$.sourceBindings',
  )
  return parsed.data
}

function assertScopeMatchesDispatch(
  sourceBindings: LivingFrameAuraFaceCpuRuntimeSourceBindings,
  dispatch: CanonicalPrivateToolDispatchConsumptionResponse,
): void {
  if (
    dispatch.grant.binding.expectedAssetId
      !== sourceBindings.candidateArtifactId
  ) throw invalid(
    'source_binding_invalid',
    '$.sourceBindings.candidateArtifactId',
  )
}

function assertInputPort(
  port: LivingFrameAuraFaceCpuPrivateInputPort,
): void {
  if (!inputPorts.has(port)) {
    throw invalid('input_port_invalid', '$.inputPort')
  }
  if (consumedInputPorts.has(port)) {
    throw invalid('input_port_reused', '$.inputPort')
  }
}

function assertModelBindingPort(
  port: LivingFrameAuraFaceCpuModelBindingPort,
): void {
  if (!modelBindingPorts.has(port)) {
    throw invalid(
      'model_binding_port_invalid',
      '$.modelBindingPort',
    )
  }
  if (consumedModelBindingPorts.has(port)) {
    throw invalid(
      'model_binding_port_reused',
      '$.modelBindingPort',
    )
  }
}

function assertSafetyAdmissionPort(
  port: LivingFrameAuraFaceCpuSafetyAdmissionPort,
): void {
  if (!safetyAdmissionPorts.has(port)) {
    throw invalid(
      'source_binding_invalid',
      '$.safetyAdmissionPort',
    )
  }
  if (consumedSafetyAdmissionPorts.has(port)) {
    throw invalid(
      'source_binding_invalid',
      '$.safetyAdmissionPort',
    )
  }
}

function assertHostPort(
  port: LivingFrameAuraFaceCpuHostPort,
): void {
  if (!hostPorts.has(port)) {
    throw invalid('host_port_invalid', '$.hostPort')
  }
}

function assertPortClassesCompatible(
  inputPort: LivingFrameAuraFaceCpuPrivateInputPort,
  modelPort: LivingFrameAuraFaceCpuModelBindingPort,
  safetyPort: LivingFrameAuraFaceCpuSafetyAdmissionPort,
  hostPort: LivingFrameAuraFaceCpuHostPort,
): void {
  const controlled = hostPort.portClass
    === 'controlled_fixture_auraface_cpu_host_port_v1'
  if (
    controlled !== (
      inputPort.portClass
        === 'controlled_fixture_auraface_input_port_v1'
    )
    || controlled !== (
      modelPort.portClass
        === 'controlled_fixture_auraface_model_binding_port_v1'
    )
    || controlled !== (
      safetyPort.portClass
        === 'controlled_fixture_auraface_safety_admission_port_v1'
    )
  ) throw invalid(
    'host_port_invalid',
    '$.hostPort',
  )
}

function assertSafetyAdmissionPacket(
  value: unknown,
  expected: LivingFrameAuraFaceCpuRuntimeSourceBindings,
  dispatch: CanonicalPrivateToolDispatchConsumptionResponse,
): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'consentAndSafetyAdmissionDigestSha256',
      'canonicalScope',
      'admissionOutcome',
      'realPersonConsentPolicyPassed',
      'minorProtectionPolicyPassed',
      'impersonationAndDeepfakePolicyPassed',
      'documentarySafetyPolicyPassed',
      'retentionAndDeletionPolicyPassed',
      'identityApprovalGranted',
      'subjectIdentityIncluded',
      'rawPolicyEvidenceIncluded',
      'productionReady',
    ])
    || value.packetClass
      !== 'process_bound_auraface_safety_admission_packet_v1'
    || value.consentAndSafetyAdmissionDigestSha256
      !== expected.consentAndSafetyAdmissionDigestSha256
    || !isRecord(value.canonicalScope)
    || !hasExactKeys(value.canonicalScope, [
      'workspaceId',
      'projectId',
      'editSessionId',
    ])
    || value.canonicalScope.workspaceId
      !== dispatch.grant.binding.workspaceId
    || value.canonicalScope.projectId
      !== dispatch.grant.binding.projectId
    || value.canonicalScope.editSessionId
      !== dispatch.grant.binding.editSessionId
    || value.admissionOutcome
      !== 'admitted_for_private_continuity_measurement'
    || value.realPersonConsentPolicyPassed !== true
    || value.minorProtectionPolicyPassed !== true
    || value.impersonationAndDeepfakePolicyPassed !== true
    || value.documentarySafetyPolicyPassed !== true
    || value.retentionAndDeletionPolicyPassed !== true
    || value.identityApprovalGranted !== false
    || value.subjectIdentityIncluded !== false
    || value.rawPolicyEvidenceIncluded !== false
    || value.productionReady !== false
  ) throw invalid(
    'source_binding_invalid',
    '$.safetyAdmissionPort',
  )
}

function assertInputPacket(
  value: unknown,
  expected: LivingFrameAuraFaceCpuRuntimeSourceBindings,
): readonly [
  LivingFrameAuraFaceCpuPrivateInputItem,
  LivingFrameAuraFaceCpuPrivateInputItem,
] {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'artifactRequirementSetDigestSha256',
      'preprocessingSpecDigestSha256',
      'consentAndSafetyAdmissionDigestSha256',
      'items',
      'callerBytesPathUrlOrCredentialAccepted',
      'browserShareable',
      'productionReady',
    ])
    || value.packetClass
      !== 'process_bound_server_owned_auraface_input_packet_v1'
    || value.artifactRequirementSetDigestSha256
      !== expected.artifactRequirementSetDigestSha256
    || value.preprocessingSpecDigestSha256
      !== expected.preprocessingSpecDigestSha256
    || value.consentAndSafetyAdmissionDigestSha256
      !== expected.consentAndSafetyAdmissionDigestSha256
    || value.callerBytesPathUrlOrCredentialAccepted !== false
    || value.browserShareable !== false
    || value.productionReady !== false
    || !Array.isArray(value.items)
    || value.items.length !== 2
  ) throw invalid(
    'input_packet_lineage_invalid',
    '$.inputPort',
  )
  const items = value.items.map((item, index) =>
    assertInputItem(
      item,
      index === 0 ? 'reference' : 'candidate',
      expected,
    ))
  return items as unknown as readonly [
    LivingFrameAuraFaceCpuPrivateInputItem,
    LivingFrameAuraFaceCpuPrivateInputItem,
  ]
}

function assertInputItem(
  value: unknown,
  role: 'reference' | 'candidate',
  expected: LivingFrameAuraFaceCpuRuntimeSourceBindings,
): LivingFrameAuraFaceCpuPrivateInputItem {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'role',
      'artifactId',
      'artifactDigestSha256',
      'continuityEntryDigestSha256',
      'contentType',
      'contentByteLength',
      'contentSha256',
      'contentBytes',
    ])
    || value.role !== role
    || typeof value.artifactId !== 'string'
    || !SAFE_ID.test(value.artifactId)
    || typeof value.artifactDigestSha256 !== 'string'
    || !SHA256.test(value.artifactDigestSha256)
    || typeof value.continuityEntryDigestSha256 !== 'string'
    || !SHA256.test(value.continuityEntryDigestSha256)
    || !['image/png', 'image/jpeg'].includes(
      String(value.contentType),
    )
    || !Number.isSafeInteger(value.contentByteLength)
    || Number(value.contentByteLength) < MINIMUM_IMAGE_BYTES
    || Number(value.contentByteLength) > MAXIMUM_IMAGE_BYTES
    || typeof value.contentSha256 !== 'string'
    || !SHA256.test(value.contentSha256)
    || !(value.contentBytes instanceof Uint8Array)
    || isSharedBuffer(value.contentBytes.buffer)
    || value.contentBytes.byteLength !== value.contentByteLength
    || digestBytes(value.contentBytes) !== value.contentSha256
    || !matchesImageSignature(
      value.contentBytes,
      value.contentType as 'image/png' | 'image/jpeg',
    )
  ) throw invalid(
    'input_packet_invalid',
    `$.inputPort.items.${role}`,
  )
  const prefix = role === 'reference'
    ? 'reference'
    : 'candidate'
  if (
    value.artifactId !== expected[`${prefix}ArtifactId`]
    || value.artifactDigestSha256
      !== expected[`${prefix}ArtifactDigestSha256`]
    || value.continuityEntryDigestSha256
      !== expected[`${prefix}ContinuityEntryDigestSha256`]
  ) throw invalid(
    'input_packet_lineage_invalid',
    `$.inputPort.items.${role}`,
  )
  return value as unknown as LivingFrameAuraFaceCpuPrivateInputItem
}

function assertModelBindingPacket(
  value: unknown,
  requirements: LivingFrameAuraFaceArtifactRequirements,
): readonly [
  LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
  LivingFrameAuraFaceCpuRuntimeModelBindingObservation,
] {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'artifactRequirementSetDigestSha256',
      'bindings',
      'pathsIncluded',
      'mountAliasesIncluded',
      'modelBytesIncluded',
      'runtimeDownloadsPerformed',
      'productionReady',
    ])
    || value.packetClass
      !== 'process_bound_auraface_model_artifact_mount_binding_packet_v1'
    || value.artifactRequirementSetDigestSha256
      !== requirements.requirementSetDigestSha256
    || value.pathsIncluded !== false
    || value.mountAliasesIncluded !== false
    || value.modelBytesIncluded !== false
    || value.runtimeDownloadsPerformed !== false
    || value.productionReady !== false
    || !Array.isArray(value.bindings)
    || value.bindings.length !== 2
  ) throw invalid(
    'model_binding_invalid',
    '$.modelBindingPort',
  )
  const parsed = z.tuple([
    modelBindingSchema,
    modelBindingSchema,
  ]).safeParse(value.bindings)
  if (!parsed.success) {
    throw invalid(
      'model_binding_invalid',
      '$.modelBindingPort.bindings',
    )
  }
  parsed.data.forEach((binding, index) => {
    const expected = requirements.artifacts[index]
    if (
      binding.canonicalOrder !== index
      || binding.requirementId !== expected.requirementId
      || binding.artifactIdentityCode
        !== expected.artifactIdentityCode
      || binding.sourceRevision !== expected.sourceRevision
      || binding.byteLength !== expected.byteLength
      || binding.contentSha256 !== expected.contentSha256
      || binding.consumerScope !== expected.consumerScope
      || binding.executionTarget
        !== expected.requiredExecutionTarget
    ) throw invalid(
      'model_binding_invalid',
      `$.modelBindingPort.bindings[${index}]`,
    )
  })
  return parsed.data
}

function assertHostResult(
  value: LivingFrameAuraFaceCpuHostExecutionResult,
  portClass: LivingFrameAuraFaceCpuHostPort['portClass'],
): void {
  if (
    !value
    || typeof value !== 'object'
    || !EVIDENCE_CLASSES.has(value.evidenceClass)
    || !TERMINAL_STATES.has(value.terminalState)
    || !FAILURE_CODES.has(value.failureCode)
    || !FACE_OUTCOMES.has(value.faceOutcome)
    || typeof value.attemptAccepted !== 'boolean'
    || typeof value.detectorInferenceExecuted !== 'boolean'
    || typeof value.embeddingInferenceExecuted !== 'boolean'
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
    || !isIsoDate(value.startedAt)
    || !isIsoDate(value.finishedAt)
    || Date.parse(value.finishedAt) < Date.parse(value.startedAt)
    || Date.parse(value.finishedAt) - Date.parse(value.startedAt)
      > MAXIMUM_RUNTIME_MILLISECONDS
  ) throw invalid(
    'host_execution_result_invalid',
    '$.hostPort.result',
  )
  const controlled = portClass
    === 'controlled_fixture_auraface_cpu_host_port_v1'
  if (
    value.evidenceClass !== (
      controlled
        ? 'controlled_non_promotable_auraface_cpu_runtime_fixture'
        : 'private_internal_auraface_cpu_runtime_observation_unreleased'
    )
    || (
      controlled
      && (
        value.detectorInferenceExecuted
        || value.embeddingInferenceExecuted
      )
    )
  ) throw invalid(
    'host_execution_result_invalid',
    '$.hostPort.result.evidenceClass',
  )
  if (
    value.terminalState === 'completed'
    && (
      value.failureCode !== 'none'
      || value.faceOutcome !== 'exactly_one_face_each'
      || !value.attemptAccepted
      || (
        !controlled
        && (
          !value.detectorInferenceExecuted
          || !value.embeddingInferenceExecuted
        )
      )
    )
  ) throw invalid(
    'host_execution_result_invalid',
    '$.hostPort.result',
  )
  if (
    value.terminalState === 'user_review_required'
    && (
      value.failureCode !== 'face_review_required'
      || value.faceOutcome === 'exactly_one_face_each'
      || value.faceOutcome === 'not_observed'
      || value.referenceEmbedding !== undefined
      || value.candidateEmbedding !== undefined
      || value.embeddingInferenceExecuted
    )
  ) throw invalid(
    'face_outcome_invalid',
    '$.hostPort.result',
  )
  if (
    ['failed', 'outcome_unknown'].includes(value.terminalState)
    && (
      value.failureCode === 'none'
      || value.failureCode === 'face_review_required'
      || value.referenceEmbedding !== undefined
      || value.candidateEmbedding !== undefined
      || value.faceOutcome !== 'not_observed'
    )
  ) throw invalid(
    'host_execution_result_invalid',
    '$.hostPort.result',
  )
}

function inspectEmbeddings(
  value: LivingFrameAuraFaceCpuHostExecutionResult,
): {
  readonly referenceEmbedding: Float32Array
  readonly candidateEmbedding: Float32Array
  readonly referenceEmbeddingDigestSha256: string
  readonly candidateEmbeddingDigestSha256: string
} {
  if (
    !(value.referenceEmbedding instanceof Float32Array)
    || !(value.candidateEmbedding instanceof Float32Array)
    || value.referenceEmbedding.length !== EMBEDDING_DIMENSION
    || value.candidateEmbedding.length !== EMBEDDING_DIMENSION
    || isSharedBuffer(value.referenceEmbedding.buffer)
    || isSharedBuffer(value.candidateEmbedding.buffer)
    || !validEmbedding(value.referenceEmbedding)
    || !validEmbedding(value.candidateEmbedding)
    || typeof value.referenceInferenceOutputDigestSha256 !== 'string'
    || !SHA256.test(value.referenceInferenceOutputDigestSha256)
    || typeof value.candidateInferenceOutputDigestSha256 !== 'string'
    || !SHA256.test(value.candidateInferenceOutputDigestSha256)
  ) throw invalid(
    'embedding_output_invalid',
    '$.hostPort.result',
  )
  const referenceEmbedding =
    new Float32Array(value.referenceEmbedding)
  const candidateEmbedding =
    new Float32Array(value.candidateEmbedding)
  return {
    referenceEmbedding,
    candidateEmbedding,
    referenceEmbeddingDigestSha256:
      digestFloat32(referenceEmbedding),
    candidateEmbeddingDigestSha256:
      digestFloat32(candidateEmbedding),
  }
}

function assertReceiptSafe(
  value: unknown,
): asserts value is Omit<
  LivingFrameAuraFaceCpuRuntimeReceipt,
  'runtimeObservationDigestSha256'
> {
  const parsed = receiptDraftSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('unsafe_receipt_forbidden', '$.receipt')
  }
  const draft = parsed.data
  const completed =
    draft.hostObservation.terminalState === 'completed'
  if (
    completed !== (draft.output !== undefined)
    || completed !== draft.outputLeaseIssued
    || draft.modelBindings[0].canonicalOrder !== 0
    || draft.modelBindings[1].canonicalOrder !== 1
    || draft.modelBindings[0].requirementId
      !== 'auraface_v1_embedding_model'
    || draft.modelBindings[1].requirementId
      !== 'auraface_v1_face_detector'
    || canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_AURAFACE_CPU_RUNTIME_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || containsUnsafeSerializedValue(draft)
  ) throw invalid('unsafe_receipt_forbidden', '$.receipt')
}

function containsUnsafeSerializedValue(value: unknown): boolean {
  const serialized = JSON.stringify(value)
  return /(?:https?:\/\/|file:\/\/|\/tmp\/|-----BEGIN|sk-[a-z0-9_-]{8,})/iu
    .test(serialized)
}

function matchesImageSignature(
  bytes: Uint8Array,
  contentType: 'image/png' | 'image/jpeg',
): boolean {
  if (contentType === 'image/png') {
    return Buffer.from(bytes.subarray(0, 8)).toString('hex')
      === '89504e470d0a1a0a'
  }
  return bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[bytes.length - 2] === 0xff
    && bytes[bytes.length - 1] === 0xd9
}

function validEmbedding(value: Float32Array): boolean {
  let squaredNorm = 0
  for (const entry of value) {
    if (!Number.isFinite(entry)) return false
    squaredNorm += entry * entry
  }
  return Number.isFinite(squaredNorm) && squaredNorm > 0
}

function isSharedBuffer(value: ArrayBufferLike): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && value instanceof SharedArrayBuffer
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

function copyBytes(value: Uint8Array): Uint8Array {
  return new Uint8Array(value)
}

function digestFloat32(value: Float32Array): string {
  return createHash('sha256')
    .update(
      Buffer.from(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      ),
    )
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
    && !ArrayBuffer.isView(value)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !ArrayBuffer.isView(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) deepFreeze(child)
  }
  return value
}

function invalid(
  code: LivingFrameAuraFaceCpuRuntimeError['code'],
  path: string,
): LivingFrameAuraFaceCpuRuntimeError {
  return new LivingFrameAuraFaceCpuRuntimeError(code, path)
}
