import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_EVIDENCE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_FAILURE_CODES,
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_RECEIPT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_TERMINAL_STATES,
  LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_VERSION,
  type LivingFrameControlledSdxlComfyUiHostRuntimeAuthority,
  type LivingFrameControlledSdxlComfyUiHostRuntimeFailureCode,
  type LivingFrameControlledSdxlComfyUiHostRuntimeReceipt,
  type LivingFrameControlledSdxlComfyUiOutputLease,
} from '../../src/types/living-frame-controlled-sdxl-comfyui-host-runtime'
import type {
  LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
} from '../../src/types/living-frame-controlled-sdxl-gpu-runtime-protocol'
import {
  canonicalPrivateToolDispatchConsumptionResponseSchema,
  type CanonicalPrivateToolDispatchConsumptionResponse,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease,
  type LivingFrameControlledSdxlPrivateGpuWireRequest,
  type LivingFrameControlledSdxlPrivateGpuWireRequestLease,
} from './living-frame-controlled-sdxl-gpu-runtime-protocol'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024
const ALLOWED_NODE_CLASSES = new Set<string>(
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
)

const authorityBoundarySchema = z.object({
  canonicalDispatchAuthority: z.literal(false),
  workerLeaseAuthority: z.literal(false),
  modelArtifactRepositoryAuthority: z.literal(false),
  modelArtifactMountAuthority: z.literal(false),
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
  alphaAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const outputSchema = z.object({
  contentType: z.literal('image/png'),
  widthPixels: z.literal(1024),
  heightPixels: z.literal(1024),
  imageCount: z.literal(1),
  outputByteLength: z.number().int().min(33)
    .max(MAX_OUTPUT_BYTES),
  outputContentSha256: z.string().regex(SHA256),
  opaqueGenerationOutputOnly: z.literal(true),
  transparentBackgroundClaimAccepted: z.literal(false),
  trueAlphaArtifactCreated: z.literal(false),
  outputBytesIncluded: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_RECEIPT_CLASS,
  ),
  runtimeObservationId: z.string().regex(SAFE_ID),
  evidenceClass: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_EVIDENCE_CLASSES,
  ),
  sourceBindings: z.object({
    gpuRuntimeRequestReceiptDigestSha256:
      z.string().regex(SHA256),
    canonicalDispatchConsumptionResponseHash:
      z.string().regex(SHA256),
    executionAttemptId: z.string().regex(SAFE_ID),
    expectedAssetId: z.string().regex(SAFE_ID),
    approvedPlanSnapshotId: z.string().regex(SAFE_ID),
  }).strict(),
  modelMountObservation: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('controlled_fixture_unmounted'),
      atomicCanonicalMountSessionObserved: z.literal(false),
      requiredArtifactCount: z.literal(0),
      hostPathIncluded: z.literal(false),
      mountAliasIncluded: z.literal(false),
      modelBytesIncluded: z.literal(false),
    }).strict(),
    z.object({
      mode: z.literal('atomic_canonical_mount_session'),
      atomicCanonicalMountSessionObserved: z.literal(true),
      requiredArtifactCount: z.literal(5),
      canonicalMountSessionDigestSha256:
        z.string().regex(SHA256),
      modelBindingPacketDigestSha256:
        z.string().regex(SHA256),
      processLifecycleReceiptDigestSha256:
        z.string().regex(SHA256),
      everyObjectVerifiedBeforeAndAfterInference:
        z.literal(true),
      processStartedAndStoppedInsideSession: z.literal(true),
      hostPathIncluded: z.literal(false),
      mountAliasIncluded: z.literal(false),
      modelBytesIncluded: z.literal(false),
    }).strict(),
  ]),
  operation: z.object({
    canonicalToolId: z.literal('comfyui'),
    operationId: z.literal(
      'tool.comfyui.generate_controlled_image.v1',
    ),
    fiveGpuCapabilitiesShareOneAttempt: z.literal(true),
    separateAuraFaceCpuQaExcluded: z.literal(true),
  }).strict(),
  hostObservation: z.object({
    terminalState: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_TERMINAL_STATES,
    ),
    failureCode: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_FAILURE_CODES,
    ),
    promptAccepted: z.boolean(),
    modelInferenceExecuted: z.boolean(),
    startedAt: z.string().datetime({ offset: true }),
    finishedAt: z.string().datetime({ offset: true }),
    elapsedMilliseconds: z.number().int().nonnegative()
      .max(120_000),
    privatePromptIdDigestSha256:
      z.string().regex(SHA256).optional(),
    privatePromptIdIncluded: z.literal(false),
  }).strict(),
  output: outputSchema.optional(),
  outputLeaseIssued: z.boolean(),
  outputArtifactPersisted: z.literal(false),
  assetManifestUpdated: z.literal(false),
  actualCostEvidenceCreated: z.literal(false),
  customerChargeCreated: z.literal(false),
  providerCallPerformed: z.literal(false),
  externalNetworkPerformed: z.literal(false),
  runtimeDownloadPerformed: z.literal(false),
  callerEndpointAccepted: z.literal(false),
  callerPathUrlCredentialCommandOrBytesAccepted: z.literal(false),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  productionReady: z.literal(false),
}).strict()

export class LivingFrameControlledSdxlComfyUiHostRuntimeError
  extends Error {
  readonly code:
    | 'canonical_dispatch_invalid'
    | 'canonical_dispatch_replay_forbidden'
    | 'canonical_operation_mismatch'
    | 'private_wire_request_invalid'
    | 'host_port_invalid'
    | 'legacy_private_loopback_forbidden'
    | 'canonical_model_mount_session_required'
    | 'host_execution_result_invalid'
    | 'output_image_invalid'
    | 'unsafe_receipt_forbidden'

  readonly path: string

  constructor(
    code:
      | 'canonical_dispatch_invalid'
      | 'canonical_dispatch_replay_forbidden'
      | 'canonical_operation_mismatch'
      | 'private_wire_request_invalid'
      | 'host_port_invalid'
      | 'legacy_private_loopback_forbidden'
      | 'canonical_model_mount_session_required'
      | 'host_execution_result_invalid'
      | 'output_image_invalid'
      | 'unsafe_receipt_forbidden',
    path: string,
  ) {
    super(`${code} at ${path}`)
    this.code = code
    this.path = path
    this.name =
      'LivingFrameControlledSdxlComfyUiHostRuntimeError'
  }
}

export interface LivingFrameControlledSdxlComfyUiHostExecutionResult {
  readonly evidenceClass:
    | 'controlled_non_promotable_comfyui_host_runtime_fixture'
    | 'private_internal_comfyui_host_runtime_observation_unreleased'
  readonly terminalState:
    | 'completed'
    | 'failed'
    | 'outcome_unknown'
  readonly failureCode:
    LivingFrameControlledSdxlComfyUiHostRuntimeFailureCode
  readonly promptAccepted: boolean
  readonly modelInferenceExecuted: boolean
  readonly startedAt: string
  readonly finishedAt: string
  readonly privatePromptId?: string
  readonly outputPngBytes?: Uint8Array
  readonly outputImageCount: number
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly canonicalModelMountSession?: {
    readonly canonicalMountSessionDigestSha256: string
    readonly modelBindingPacketDigestSha256: string
    readonly processLifecycleReceiptDigestSha256: string
    readonly requiredArtifactCount: 5
    readonly everyObjectVerifiedBeforeAndAfterInference: true
    readonly processStartedAndStoppedInsideSession: true
    readonly hostPathIncluded: false
    readonly mountAliasIncluded: false
    readonly modelBytesIncluded: false
  }
}

export interface LivingFrameControlledSdxlComfyUiHostPort {
  readonly hostPortClass:
    | 'controlled_fixture_comfyui_host_port_v1'
    | 'private_loopback_comfyui_host_port_v1'
    | 'private_atomic_canonical_mount_comfyui_host_session_port_v1'
  readonly callerEndpointAccepted: false
  readonly callerPathUrlCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly productionQualified: false
  executeOne(
    request: LivingFrameControlledSdxlPrivateGpuWireRequest,
  ): Promise<LivingFrameControlledSdxlComfyUiHostExecutionResult>
}

export interface LivingFrameControlledSdxlComfyUiHostRuntimeInput {
  readonly gpuRuntimeRequestReceipt:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt
  readonly privateWireRequestLease:
    LivingFrameControlledSdxlPrivateGpuWireRequestLease
  readonly canonicalDispatchConsumption:
    CanonicalPrivateToolDispatchConsumptionResponse
  readonly hostPort:
    LivingFrameControlledSdxlComfyUiHostPort
}

export interface LivingFrameControlledSdxlComfyUiHostRuntimeResult {
  readonly receipt:
    LivingFrameControlledSdxlComfyUiHostRuntimeReceipt
  readonly outputLease?: LivingFrameControlledSdxlComfyUiOutputLease
}

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlComfyUiHostRuntimeAuthority =
  deepFreeze({
    canonicalDispatchAuthority: false,
    workerLeaseAuthority: false,
    modelArtifactRepositoryAuthority: false,
    modelArtifactMountAuthority: false,
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
    alphaAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const registeredHostPorts = new WeakSet<object>()
const registeredAtomicCanonicalMountSessionPorts =
  new WeakSet<object>()
const outputLeases = new WeakSet<object>()
const consumedOutputLeases = new WeakSet<object>()
const outputBytesByLease = new WeakMap<object, Uint8Array>()

export function registerLivingFrameControlledSdxlComfyUiHostPort<
  T extends LivingFrameControlledSdxlComfyUiHostPort,
>(hostPort: T): T {
  if (
    !hostPort
    || typeof hostPort !== 'object'
    || ![
      'controlled_fixture_comfyui_host_port_v1',
      'private_loopback_comfyui_host_port_v1',
    ].includes(hostPort.hostPortClass)
    || hostPort.callerEndpointAccepted !== false
    || hostPort.callerPathUrlCredentialAccepted !== false
    || hostPort.externalNetworkAllowed !== false
    || hostPort.runtimeDownloadsAllowed !== false
    || hostPort.productionQualified !== false
    || typeof hostPort.executeOne !== 'function'
  ) throw invalid('host_port_invalid', '$.hostPort')
  registeredHostPorts.add(hostPort)
  return hostPort
}

export function registerLivingFrameControlledSdxlComfyUiCanonicalMountHostSessionPort<
  T extends LivingFrameControlledSdxlComfyUiHostPort,
>(hostPort: T): T {
  if (
    !hostPort
    || typeof hostPort !== 'object'
    || hostPort.hostPortClass
      !==
        'private_atomic_canonical_mount_comfyui_host_session_port_v1'
    || hostPort.callerEndpointAccepted !== false
    || hostPort.callerPathUrlCredentialAccepted !== false
    || hostPort.externalNetworkAllowed !== false
    || hostPort.runtimeDownloadsAllowed !== false
    || hostPort.productionQualified !== false
    || typeof hostPort.executeOne !== 'function'
  ) throw invalid('host_port_invalid', '$.hostPort')
  registeredHostPorts.add(hostPort)
  registeredAtomicCanonicalMountSessionPorts.add(hostPort)
  return hostPort
}

export async function executeLivingFrameControlledSdxlComfyUiHostRuntime(
  input: LivingFrameControlledSdxlComfyUiHostRuntimeInput,
): Promise<LivingFrameControlledSdxlComfyUiHostRuntimeResult> {
  const dispatch = assertCanonicalDispatch(
    input.canonicalDispatchConsumption,
  )
  assertRequestReceipt(input.gpuRuntimeRequestReceipt)
  if (!registeredHostPorts.has(input.hostPort)) {
    throw invalid('host_port_invalid', '$.hostPort')
  }
  if (
    input.hostPort.hostPortClass
      ===
        'private_atomic_canonical_mount_comfyui_host_session_port_v1'
    && !registeredAtomicCanonicalMountSessionPorts.has(input.hostPort)
  ) throw invalid('host_port_invalid', '$.hostPort')
  if (
    input.hostPort.hostPortClass
      === 'private_loopback_comfyui_host_port_v1'
  ) {
    throw invalid(
      'legacy_private_loopback_forbidden',
      '$.hostPort',
    )
  }

  const wireRequest =
    consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease(
      input.privateWireRequestLease,
    )
  assertWireRequest(
    wireRequest,
    input.gpuRuntimeRequestReceipt,
  )

  let hostResult:
    LivingFrameControlledSdxlComfyUiHostExecutionResult
  try {
    hostResult = await input.hostPort.executeOne(wireRequest)
  } catch {
    throw invalid(
      'host_execution_result_invalid',
      '$.hostPort',
    )
  }
  assertHostResult(hostResult, input.hostPort.hostPortClass)

  const output = hostResult.terminalState === 'completed'
    ? await inspectOutput(hostResult)
    : undefined
  const runtimeObservationId =
    `lfcomfyhost_${digest({
      request:
        input.gpuRuntimeRequestReceipt
          .requestReceiptDigestSha256,
      dispatch: dispatch.responseHash,
      attempt: dispatch.executionAttemptId,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      terminalState: hostResult.terminalState,
      output: output?.outputContentSha256 ?? null,
      canonicalMountSession:
        hostResult.canonicalModelMountSession
          ?.canonicalMountSessionDigestSha256 ?? null,
    }).slice(0, 40)}`
  const elapsedMilliseconds =
    Date.parse(hostResult.finishedAt)
    - Date.parse(hostResult.startedAt)
  const draft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_RECEIPT_CLASS,
    runtimeObservationId,
    evidenceClass: hostResult.evidenceClass,
    sourceBindings: {
      gpuRuntimeRequestReceiptDigestSha256:
        input.gpuRuntimeRequestReceipt
          .requestReceiptDigestSha256,
      canonicalDispatchConsumptionResponseHash:
        dispatch.responseHash,
      executionAttemptId: dispatch.executionAttemptId,
      expectedAssetId:
        dispatch.grant.binding.expectedAssetId,
      approvedPlanSnapshotId:
        dispatch.grant.binding.approvedPlanSnapshotId,
    },
    modelMountObservation:
      hostResult.canonicalModelMountSession
        ? {
            mode:
              'atomic_canonical_mount_session' as const,
            atomicCanonicalMountSessionObserved: true as const,
            requiredArtifactCount: 5 as const,
            canonicalMountSessionDigestSha256:
              hostResult.canonicalModelMountSession
                .canonicalMountSessionDigestSha256,
            modelBindingPacketDigestSha256:
              hostResult.canonicalModelMountSession
                .modelBindingPacketDigestSha256,
            processLifecycleReceiptDigestSha256:
              hostResult.canonicalModelMountSession
                .processLifecycleReceiptDigestSha256,
            everyObjectVerifiedBeforeAndAfterInference:
              true as const,
            processStartedAndStoppedInsideSession: true as const,
            hostPathIncluded: false as const,
            mountAliasIncluded: false as const,
            modelBytesIncluded: false as const,
          }
        : {
            mode: 'controlled_fixture_unmounted' as const,
            atomicCanonicalMountSessionObserved: false as const,
            requiredArtifactCount: 0 as const,
            hostPathIncluded: false as const,
            mountAliasIncluded: false as const,
            modelBytesIncluded: false as const,
          },
    operation: {
      canonicalToolId: 'comfyui' as const,
      operationId:
        'tool.comfyui.generate_controlled_image.v1' as const,
      fiveGpuCapabilitiesShareOneAttempt: true as const,
      separateAuraFaceCpuQaExcluded: true as const,
    },
    hostObservation: {
      terminalState: hostResult.terminalState,
      failureCode: hostResult.failureCode,
      promptAccepted: hostResult.promptAccepted,
      modelInferenceExecuted: hostResult.modelInferenceExecuted,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      elapsedMilliseconds,
      ...(hostResult.privatePromptId
        ? {
            privatePromptIdDigestSha256:
              digest(hostResult.privatePromptId),
          }
        : {}),
      privatePromptIdIncluded: false as const,
    },
    ...(output ? { output } : {}),
    outputLeaseIssued: output !== undefined,
    outputArtifactPersisted: false as const,
    assetManifestUpdated: false as const,
    actualCostEvidenceCreated: false as const,
    customerChargeCreated: false as const,
    providerCallPerformed: false as const,
    externalNetworkPerformed: false as const,
    runtimeDownloadPerformed: false as const,
    callerEndpointAccepted: false as const,
    callerPathUrlCredentialCommandOrBytesAccepted: false as const,
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    productionReady: false as const,
  }
  assertReceiptSafe(draft)
  const receipt:
    LivingFrameControlledSdxlComfyUiHostRuntimeReceipt =
    deepFreeze({
      ...draft,
      runtimeObservationDigestSha256: digest(draft),
    })

  if (!output || !hostResult.outputPngBytes) {
    return deepFreeze({ receipt })
  }
  const leaseId =
    `lfcomfyout_${digest({
      runtime: receipt.runtimeObservationDigestSha256,
      output: output.outputContentSha256,
    }).slice(0, 40)}`
  const outputLease:
    LivingFrameControlledSdxlComfyUiOutputLease =
    deepFreeze({
      leaseClass:
        'process_bound_single_use_unpersisted_comfyui_png_output_lease_v1',
      leaseId,
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      outputContentSha256: output.outputContentSha256,
      outputByteLength: output.outputByteLength,
      callerSerializable: false,
      artifactPersistenceAuthority: false,
      assetManifestAuthority: false,
      alphaAuthority: false,
      productionReady: false,
    })
  outputLeases.add(outputLease)
  outputBytesByLease.set(
    outputLease,
    Uint8Array.from(hostResult.outputPngBytes),
  )
  return deepFreeze({ receipt, outputLease })
}

export function consumeLivingFrameControlledSdxlComfyUiOutputLease(
  lease: LivingFrameControlledSdxlComfyUiOutputLease,
): Uint8Array {
  if (
    !outputLeases.has(lease)
    || consumedOutputLeases.has(lease)
    || lease.leaseClass
      !==
        'process_bound_single_use_unpersisted_comfyui_png_output_lease_v1'
    || lease.callerSerializable !== false
    || lease.artifactPersistenceAuthority !== false
    || lease.assetManifestAuthority !== false
    || lease.alphaAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('host_port_invalid', '$.outputLease')
  const bytes = outputBytesByLease.get(lease)
  if (
    !bytes
    || bytes.byteLength !== lease.outputByteLength
    || digestBytes(bytes) !== lease.outputContentSha256
  ) throw invalid('output_image_invalid', '$.outputLease')
  consumedOutputLeases.add(lease)
  outputBytesByLease.delete(lease)
  return Uint8Array.from(bytes)
}

export function verifyLivingFrameControlledSdxlComfyUiHostRuntimeReceipt(
  value: unknown,
): value is LivingFrameControlledSdxlComfyUiHostRuntimeReceipt {
  if (!isRecord(value)) return false
  const digestValue = value.runtimeObservationDigestSha256
  if (typeof digestValue !== 'string' || !SHA256.test(digestValue)) {
    return false
  }
  const {
    runtimeObservationDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  try {
    assertReceiptSafe(
      draft as unknown as Omit<
        LivingFrameControlledSdxlComfyUiHostRuntimeReceipt,
        'runtimeObservationDigestSha256'
      >,
    )
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
  const {
    responseHash,
    ...responseWithoutHash
  } = parsed.data
  if (
    sha256AuthorityValue(responseWithoutHash) !== responseHash
  ) throw invalid(
    'canonical_dispatch_invalid',
    '$.canonicalDispatchConsumption.responseHash',
  )
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
    parsed.data.grant.binding.canonicalToolId !== 'comfyui'
    || parsed.data.grant.binding.operationId
      !== 'tool.comfyui.generate_controlled_image.v1'
    || parsed.data.grant.binding.expectedOutput.contentType
      !== 'image/png'
  ) throw invalid(
    'canonical_operation_mismatch',
    '$.canonicalDispatchConsumption.grant.binding',
  )
  return parsed.data
}

function assertRequestReceipt(
  receipt: LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
): void {
  if (
    !receipt
    || typeof receipt !== 'object'
    || !SHA256.test(receipt.requestReceiptDigestSha256)
    || receipt.canonicalToolIdentityRegistered !== false
    || receipt.canonicalOperationRegistered !== false
    || receipt.dispatchReady !== false
    || receipt.gpuAttemptCreated !== false
    || receipt.productionReady !== false
  ) throw invalid(
    'private_wire_request_invalid',
    '$.gpuRuntimeRequestReceipt',
  )
}

function assertWireRequest(
  request: LivingFrameControlledSdxlPrivateGpuWireRequest,
  receipt: LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
): void {
  const nodes = Object.values(request.prompt)
  const outputNodes = nodes.filter((node) =>
    node.class_type === 'SaveImageWebsocket')
  if (
    request.requestId !== receipt.requestReceiptId
    || request.expectedOperation.canonicalToolId !== 'comfyui'
    || request.expectedOperation.operationId
      !== 'tool.comfyui.generate_controlled_image.v1'
    || request.outputExpectation.transport
      !== 'websocket_image_output'
    || request.outputExpectation.contentType !== 'image/png'
    || request.outputExpectation.widthPixels !== 1024
    || request.outputExpectation.heightPixels !== 1024
    || request.outputExpectation.imageCount !== 1
    || nodes.length < 1
    || nodes.length > 32
    || outputNodes.length !== 1
    || nodes.some((node) =>
      !ALLOWED_NODE_CLASSES.has(node.class_type))
    || request.costEventExpectation.oneRequestEqualsOneGpuAttempt
      !== true
    || request.costEventExpectation
      .fiveGpuCapabilitiesShareAttemptLifetime !== true
    || request.costEventExpectation
      .auraFaceCpuMeasurementExcluded !== true
  ) throw invalid(
    'private_wire_request_invalid',
    '$.privateWireRequestLease',
  )
}

function assertHostResult(
  result: LivingFrameControlledSdxlComfyUiHostExecutionResult,
  hostPortClass: LivingFrameControlledSdxlComfyUiHostPort[
    'hostPortClass'
  ],
): void {
  const started = Date.parse(result.startedAt)
  const finished = Date.parse(result.finishedAt)
  const completed = result.terminalState === 'completed'
  const expectedEvidenceClass =
    hostPortClass === 'controlled_fixture_comfyui_host_port_v1'
      ? 'controlled_non_promotable_comfyui_host_runtime_fixture'
      : 'private_internal_comfyui_host_runtime_observation_unreleased'
  const atomicSessionRequired =
    hostPortClass
      ===
        'private_atomic_canonical_mount_comfyui_host_session_port_v1'
  if (
    result.evidenceClass !== expectedEvidenceClass
    || !Number.isFinite(started)
    || !Number.isFinite(finished)
    || finished < started
    || result.externalNetworkPerformed !== false
    || result.runtimeDownloadPerformed !== false
    || (completed && (
      result.failureCode !== 'none'
      || !result.promptAccepted
      || result.outputImageCount !== 1
      || !result.outputPngBytes
    ))
    || (!completed && (
      result.failureCode === 'none'
      || result.outputImageCount !== 0
      || result.outputPngBytes !== undefined
    ))
    || (
      hostPortClass ===
        'controlled_fixture_comfyui_host_port_v1'
      && result.modelInferenceExecuted
    )
    || (
      atomicSessionRequired
      !== validCanonicalModelMountSession(
        result.canonicalModelMountSession,
      )
    )
  ) throw invalid(
    atomicSessionRequired
      ? 'canonical_model_mount_session_required'
      : 'host_execution_result_invalid',
    '$.hostPort.result',
  )
}

function validCanonicalModelMountSession(
  value:
    LivingFrameControlledSdxlComfyUiHostExecutionResult[
      'canonicalModelMountSession'
    ],
): boolean {
  return value !== undefined
    && SHA256.test(value.canonicalMountSessionDigestSha256)
    && SHA256.test(value.modelBindingPacketDigestSha256)
    && SHA256.test(value.processLifecycleReceiptDigestSha256)
    && value.requiredArtifactCount === 5
    && value.everyObjectVerifiedBeforeAndAfterInference === true
    && value.processStartedAndStoppedInsideSession === true
    && value.hostPathIncluded === false
    && value.mountAliasIncluded === false
    && value.modelBytesIncluded === false
}

async function inspectOutput(
  result: LivingFrameControlledSdxlComfyUiHostExecutionResult,
) {
  const bytes = result.outputPngBytes
  if (
    !bytes
    || bytes.byteLength < 33
    || bytes.byteLength > MAX_OUTPUT_BYTES
  ) throw invalid('output_image_invalid', '$.hostPort.result')
  assertCompletePng(bytes)
  return deepFreeze({
    contentType: 'image/png' as const,
    widthPixels: 1024 as const,
    heightPixels: 1024 as const,
    imageCount: 1 as const,
    outputByteLength: bytes.byteLength,
    outputContentSha256: digestBytes(bytes),
    opaqueGenerationOutputOnly: true as const,
    transparentBackgroundClaimAccepted: false as const,
    trueAlphaArtifactCreated: false as const,
    outputBytesIncluded: false as const,
  })
}

function assertCompletePng(bytes: Uint8Array): void {
  const signature = [
    137, 80, 78, 71, 13, 10, 26, 10,
  ]
  if (
    signature.some((value, index) => bytes[index] !== value)
  ) throw invalid('output_image_invalid', '$.hostPort.result')

  const idatChunks: Uint8Array[] = []
  let offset = 8
  let sawHeader = false
  let sawEnd = false
  let channels = 0
  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) {
      throw invalid('output_image_invalid', '$.hostPort.result')
    }
    const view = new DataView(
      bytes.buffer,
      bytes.byteOffset + offset,
      bytes.byteLength - offset,
    )
    const length = view.getUint32(0, false)
    if (
      length > MAX_OUTPUT_BYTES
      || offset + 12 + length > bytes.byteLength
    ) throw invalid('output_image_invalid', '$.hostPort.result')
    const typeBytes = bytes.subarray(offset + 4, offset + 8)
    const type = String.fromCharCode(...typeBytes)
    const data = bytes.subarray(
      offset + 8,
      offset + 8 + length,
    )
    const expectedCrc = new DataView(
      bytes.buffer,
      bytes.byteOffset + offset + 8 + length,
      4,
    ).getUint32(0, false)
    if (
      crc32(bytes.subarray(offset + 4, offset + 8 + length))
      !== expectedCrc
    ) throw invalid('output_image_invalid', '$.hostPort.result')

    if (!sawHeader) {
      if (type !== 'IHDR' || length !== 13) {
        throw invalid('output_image_invalid', '$.hostPort.result')
      }
      const header = new DataView(
        data.buffer,
        data.byteOffset,
        data.byteLength,
      )
      const width = header.getUint32(0, false)
      const height = header.getUint32(4, false)
      const bitDepth = data[8]
      const colorType = data[9]
      if (
        width !== 1024
        || height !== 1024
        || bitDepth !== 8
        || ![2, 6].includes(colorType!)
        || data[10] !== 0
        || data[11] !== 0
        || data[12] !== 0
      ) throw invalid('output_image_invalid', '$.hostPort.result')
      channels = colorType === 2 ? 3 : 4
      sawHeader = true
    } else if (type === 'IHDR') {
      throw invalid('output_image_invalid', '$.hostPort.result')
    }

    if (type === 'IDAT') idatChunks.push(Uint8Array.from(data))
    if (type === 'IEND') {
      if (length !== 0) {
        throw invalid('output_image_invalid', '$.hostPort.result')
      }
      sawEnd = true
      offset += 12
      break
    }
    offset += 12 + length
  }
  if (
    !sawHeader
    || !sawEnd
    || idatChunks.length < 1
    || offset !== bytes.byteLength
    || channels === 0
  ) throw invalid('output_image_invalid', '$.hostPort.result')

  const expectedInflatedBytes = 1024 * (1 + 1024 * channels)
  let inflated: Buffer
  try {
    inflated = inflateSync(
      Buffer.concat(idatChunks.map((chunk) => Buffer.from(chunk))),
      { maxOutputLength: expectedInflatedBytes + 1 },
    )
  } catch {
    throw invalid('output_image_invalid', '$.hostPort.result')
  }
  if (inflated.byteLength !== expectedInflatedBytes) {
    throw invalid('output_image_invalid', '$.hostPort.result')
  }
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (
        (crc & 1) !== 0 ? 0xedb88320 : 0
      )
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function assertReceiptSafe(
  draft: Omit<
    LivingFrameControlledSdxlComfyUiHostRuntimeReceipt,
    'runtimeObservationDigestSha256'
  >,
): void {
  if (!receiptDraftSchema.safeParse(draft).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  const completed =
    draft.hostObservation.terminalState === 'completed'
  const privateEvidence =
    draft.evidenceClass
      ===
        'private_internal_comfyui_host_runtime_observation_unreleased'
  const atomicModelMountObserved =
    draft.modelMountObservation.mode
      === 'atomic_canonical_mount_session'
  if (
    !SAFE_ID.test(draft.runtimeObservationId)
    || !SHA256.test(
      draft.sourceBindings
        .gpuRuntimeRequestReceiptDigestSha256,
    )
    || !SHA256.test(
      draft.sourceBindings
        .canonicalDispatchConsumptionResponseHash,
    )
    || privateEvidence !== atomicModelMountObserved
    || draft.outputLeaseIssued !== completed
    || (completed !== (draft.output !== undefined))
    || draft.outputArtifactPersisted !== false
    || draft.assetManifestUpdated !== false
    || draft.actualCostEvidenceCreated !== false
    || draft.customerChargeCreated !== false
    || draft.providerCallPerformed !== false
    || draft.externalNetworkPerformed !== false
    || draft.runtimeDownloadPerformed !== false
    || draft.callerEndpointAccepted !== false
    || draft.callerPathUrlCredentialCommandOrBytesAccepted
      !== false
    || draft.productionReady !== false
    || canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES,
      )
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}

function invalid(
  code:
    LivingFrameControlledSdxlComfyUiHostRuntimeError['code'],
  path: string,
): LivingFrameControlledSdxlComfyUiHostRuntimeError {
  return new LivingFrameControlledSdxlComfyUiHostRuntimeError(
    code,
    path,
  )
}
