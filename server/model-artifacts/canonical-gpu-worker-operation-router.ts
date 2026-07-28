import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getCanonicalFasterWhisperGpuRuntimeContract,
} from './canonical-faster-whisper-gpu-runtime-contract'
import type {
  CanonicalFasterWhisperGpuRuntimeRunnerRequest,
} from './canonical-faster-whisper-gpu-runtime-request-types'
import {
  assertCanonicalFasterWhisperGpuRuntimeWireResponse,
} from './canonical-faster-whisper-gpu-runtime-result'
import {
  CANONICAL_GPU_WORKER_OPERATION_ROUTER_RECEIPT_VERSION,
  CANONICAL_GPU_WORKER_OPERATION_ROUTER_VERSION,
  type CanonicalGpuWorkerOperationRouterReceipt,
  type CanonicalGpuWorkerOperationRuntimePort,
  type CanonicalGpuWorkerOperationRuntimePortResult,
  type CanonicalGpuWorkerRuntimePortEvidenceClass,
} from './canonical-gpu-worker-operation-router-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_RESPONSE_BYTES = 128 * 1_024
const ROUTER_TIMEOUT_MILLISECONDS = 2 * 60 * 60 * 1_000

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const modelArtifactsSchema = z.tuple([
  z.object({
    canonicalOrder: z.literal(0),
    slotId: z.literal('faster_whisper_config'),
    fileName: z.literal('config.json'),
    byteLength: z.literal(2_370),
    contentSha256: z.literal(
      'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828',
    ),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    slotId: z.literal('faster_whisper_model'),
    fileName: z.literal('model.bin'),
    byteLength: z.literal(483_546_902),
    contentSha256: z.literal(
      '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
    ),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(2),
    slotId: z.literal('faster_whisper_tokenizer'),
    fileName: z.literal('tokenizer.json'),
    byteLength: z.literal(2_203_239),
    contentSha256: z.literal(
      'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
    ),
  }).strict(),
  z.object({
    canonicalOrder: z.literal(3),
    slotId: z.literal('faster_whisper_vocabulary'),
    fileName: z.literal('vocabulary.txt'),
    byteLength: z.literal(459_861),
    contentSha256: z.literal(
      '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
    ),
  }).strict(),
])

const runtimeRequestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-faster-whisper-gpu-runtime-request-v1',
  ),
  operationId: z.literal(
    'tool.faster_whisper.transcribe_private_audio.v1',
  ),
  admissionDigestSha256: digestSchema,
  dispatch: z.object({
    dispatchIntentId: safeIdSchema,
    dispatchBindingHash: digestSchema,
    attemptPlanHash: digestSchema,
    runtimeRegion: z.literal('europe-west1'),
  }).strict(),
  source: z.object({
    artifactId: safeIdSchema,
    contentSha256: digestSchema,
    byteLength: z.number().int().positive()
      .max(2 * 1_024 * 1_024 * 1_024),
    durationMilliseconds: z.number().int().positive()
      .max(7_200_000),
    contentType: z.literal('audio/wav'),
    sampleRateHz: z.literal(16_000),
    channelCount: z.literal(1),
    sampleFormat: z.literal('pcm_s16le'),
  }).strict(),
  modelArtifacts: modelArtifactsSchema,
  settings: z.object({
    device: z.literal('cuda'),
    computeType: z.literal('float16'),
    beamSize: z.literal(5),
    wordTimestamps: z.literal(true),
    vadFilter: z.literal(true),
    languagePolicy: z.literal('auto_detect_v1'),
    temperature: z.literal(0),
    conditionOnPreviousText: z.literal(true),
  }).strict(),
  requestBindingSha256: digestSchema,
}).strict()

const runtimePorts = new WeakSet<object>()
const consumedRuntimePorts = new WeakSet<object>()

const BLOCKERS = [
  'canonical_attempt_authority_reread_required',
  'canonical_cloud_dispatch_worker_and_completion_receipts_required',
  'cloud_run_gpu_job_deployment_and_image_identity_required',
  'live_worker_service_identity_and_iam_required',
  'official_gpu_rate_and_attempt_cost_evidence_required',
  'private_audio_and_model_mount_materialization_required',
  'private_output_artifact_commit_qa_reconciliation_required',
] as const

export function createCanonicalGpuWorkerOperationRuntimePort(input: {
  evidenceClass: CanonicalGpuWorkerRuntimePortEvidenceClass
  execute(
    input: Parameters<
      CanonicalGpuWorkerOperationRuntimePort['execute']
    >[0],
  ): Promise<CanonicalGpuWorkerOperationRuntimePortResult>
}): CanonicalGpuWorkerOperationRuntimePort {
  const port: CanonicalGpuWorkerOperationRuntimePort = Object.freeze({
    portVersion:
      'canonical-gpu-worker-operation-runtime-port-v1',
    evidenceClass: input.evidenceClass,
    supportedOperationIds: [
      'tool.faster_whisper.transcribe_private_audio.v1',
    ] as const,
    execute: input.execute,
  })
  runtimePorts.add(port)
  return port
}

export async function routeCanonicalGpuWorkerOperation(input: {
  request: unknown
  runtimePort: CanonicalGpuWorkerOperationRuntimePort
}): Promise<CanonicalGpuWorkerOperationRouterReceipt> {
  assertRuntimePort(input.runtimePort)
  const parsed = runtimeRequestSchema.safeParse(input.request)
  if (!parsed.success) {
    throw invalid('canonical_gpu_worker_runtime_request_invalid')
  }
  const request =
    parsed.data as CanonicalFasterWhisperGpuRuntimeRunnerRequest
  assertRequestBinding(request)
  const runtimeContract =
    await getCanonicalFasterWhisperGpuRuntimeContract()
  assertCurrentRuntimeContract(request, runtimeContract)
  const serializedRequest = stableAuthorityStringify(request)
  const serializedRequestByteLength =
    Buffer.byteLength(serializedRequest, 'utf8')
  if (
    serializedRequestByteLength
      > runtimeContract.runtimeProtocol.maximumRequestBytes
  ) {
    throw invalid('canonical_gpu_worker_runtime_request_too_large')
  }

  consumedRuntimePorts.add(input.runtimePort)
  const runtimeResult = await input.runtimePort.execute({
    request,
    serializedRequest,
    maximumResponseBytes: MAXIMUM_RESPONSE_BYTES,
    timeoutMilliseconds: ROUTER_TIMEOUT_MILLISECONDS,
  })
  assertRuntimeProcessResult(runtimeResult)
  const response =
    assertCanonicalFasterWhisperGpuRuntimeWireResponse({
      value: runtimeResult.wireResponse,
      request,
    })

  const draft = {
    receiptVersion:
      CANONICAL_GPU_WORKER_OPERATION_ROUTER_RECEIPT_VERSION,
    routerVersion: CANONICAL_GPU_WORKER_OPERATION_ROUTER_VERSION,
    receiptClass:
      'source_verified_operation_route_non_authoritative' as const,
    operation: {
      operationId: request.operationId,
      sharedWorkerType: 'gpu_ai_worker' as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      accelerator: 'nvidia_l4' as const,
      device: 'cuda' as const,
      computeType: 'float16' as const,
      cpuFallbackAllowed: false as const,
    },
    request: {
      admissionDigestSha256: request.admissionDigestSha256,
      requestBindingSha256: request.requestBindingSha256,
      dispatchIntentId: request.dispatch.dispatchIntentId,
      dispatchBindingHash: request.dispatch.dispatchBindingHash,
      attemptPlanHash: request.dispatch.attemptPlanHash,
      runtimeRegion: request.dispatch.runtimeRegion,
      serializedRequestByteLength,
    },
    runtimeContract: {
      contractDigestSha256:
        runtimeContract.contractDigestSha256,
      sourceDigestSha256:
        runtimeContract.sourceDigestSha256,
      exactCurrentSourceRevalidated: true as const,
      exactModelFileSetRevalidated: true as const,
      exactCudaOnlyProtocolRevalidated: true as const,
    },
    runtimePort: {
      evidenceClass: input.runtimePort.evidenceClass,
      processInvoked: true as const,
      oneShotPortConsumed: true as const,
      exitCode: 0 as const,
      timedOut: false as const,
      oomKilled: false as const,
      stdoutByteLength:
        runtimeResult.process.stdoutByteLength,
      stderrByteLength:
        runtimeResult.process.stderrByteLength,
      stderrSha256: runtimeResult.process.stderrSha256,
    },
    response,
    summary: {
      exactOperationMatched: true as const,
      exactRequestBindingMatched: true as const,
      exactResponseLineageMatched: true as const,
      cudaSuccessWireShapeMatched: true as const,
      outputCount: 3 as const,
      outputBytesIncluded: false as const,
      transcriptTextIncluded: false as const,
      callerPathsIncluded: false as const,
      callerUrlsIncluded: false as const,
      credentialsIncluded: false as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      operationRouterSourceImplemented: true as const,
      processBoundRuntimePortRequired: true as const,
      controlledFixtureOnly:
        input.runtimePort.evidenceClass
          === 'controlled_source_fixture',
      canonicalAttemptAuthorityRereadVerified: false as const,
      canonicalWorkerReceiptVerified: false as const,
      canonicalCompletionReceiptVerified: false as const,
      actualCloudRunExecutionVerified: false as const,
      runtimeImageIdentityVerified: false as const,
      liveServiceIdentityAndIamVerified: false as const,
      privateInputAndModelMountsVerified: false as const,
      outputBytesRereadVerified: false as const,
      outputArtifactCommitAuthority: false as const,
      transcriptAlignmentQaAuthority: false as const,
      captionTimingQaAuthority: false as const,
      attemptInternalCostEvidenceVerified: false as const,
      customerCostAuthority: false as const,
      cloudDispatchAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      productionAuthority: false as const,
    },
  }
  return deepFreeze({
    ...draft,
    receiptDigestSha256: sha256AuthorityValue(draft),
  })
}

function assertRuntimePort(
  port: CanonicalGpuWorkerOperationRuntimePort,
): void {
  if (
    !runtimePorts.has(port)
    || consumedRuntimePorts.has(port)
    || port.portVersion
      !== 'canonical-gpu-worker-operation-runtime-port-v1'
    || stableAuthorityStringify(port.supportedOperationIds)
      !== stableAuthorityStringify([
        'tool.faster_whisper.transcribe_private_audio.v1',
      ])
  ) {
    throw blocked(
      'canonical_gpu_worker_process_bound_runtime_port_required',
    )
  }
}

function assertRequestBinding(
  request: CanonicalFasterWhisperGpuRuntimeRunnerRequest,
): void {
  const {
    requestBindingSha256,
    ...requestWithoutBinding
  } = request
  if (
    requestBindingSha256
      !== sha256AuthorityValue(requestWithoutBinding)
  ) {
    throw blocked(
      'canonical_gpu_worker_runtime_request_binding_mismatch',
    )
  }
}

function assertCurrentRuntimeContract(
  request: CanonicalFasterWhisperGpuRuntimeRunnerRequest,
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalFasterWhisperGpuRuntimeContract>
  >,
): void {
  if (
    runtimeContract.operationIdentity.operationId
      !== request.operationId
    || runtimeContract.operationIdentity.sharedWorkerType
      !== 'gpu_ai_worker'
    || runtimeContract.runtimeProtocol.device !== 'cuda'
    || runtimeContract.runtimeProtocol.computeType !== 'float16'
    || runtimeContract.runtimeProtocol.cpuFallbackAllowed
    || runtimeContract.cloudRunGpuPolicy.admittedExistingRegion
      !== request.dispatch.runtimeRegion
    || stableAuthorityStringify(
      runtimeContract.fixedFileLayout.modelFiles,
    ) !== stableAuthorityStringify(request.modelArtifacts)
  ) {
    throw blocked(
      'canonical_gpu_worker_current_runtime_contract_mismatch',
    )
  }
}

function assertRuntimeProcessResult(
  result: CanonicalGpuWorkerOperationRuntimePortResult,
): void {
  const process = result.process
  if (
    process.exitCode !== 0
    || process.timedOut
    || process.oomKilled
    || !Number.isSafeInteger(process.stdoutByteLength)
    || process.stdoutByteLength < 2
    || process.stdoutByteLength > MAXIMUM_RESPONSE_BYTES
    || !Number.isSafeInteger(process.stderrByteLength)
    || process.stderrByteLength < 0
    || process.stderrByteLength > MAXIMUM_RESPONSE_BYTES
    || !DIGEST_PATTERN.test(process.stderrSha256)
  ) {
    throw blocked(
      'canonical_gpu_worker_runtime_process_failed',
    )
  }
}

export function hashCanonicalGpuWorkerStderr(
  value: string | Buffer,
): string {
  return createHash('sha256').update(value).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate:
      'canonical_gpu_worker_operation_router_authority',
  })
}
