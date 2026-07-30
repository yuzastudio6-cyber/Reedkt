import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getCanonicalComfyUiGpuRuntimeContract,
} from './canonical-comfyui-gpu-runtime-contract'
import {
  canonicalComfyUiGpuRuntimeRunnerRequestSchema,
} from './canonical-comfyui-gpu-runtime-request'
import {
  assertCanonicalComfyUiGpuRuntimeWireResponse,
} from './canonical-comfyui-gpu-runtime-result'
import {
  getCanonicalFasterWhisperGpuRuntimeContract,
} from './canonical-faster-whisper-gpu-runtime-contract'
import {
  assertCanonicalFasterWhisperGpuRuntimeWireResponse,
} from './canonical-faster-whisper-gpu-runtime-result'
import {
  getCanonicalRembgGpuRuntimeContract,
} from './canonical-rembg-gpu-runtime-contract'
import {
  assertCanonicalRembgGpuRuntimeWireResponse,
} from './canonical-rembg-gpu-runtime-result'
import {
  getCanonicalSam2GpuRuntimeContract,
} from './canonical-sam2-gpu-runtime-contract'
import {
  assertCanonicalSam2GpuRuntimeWireResponse,
} from './canonical-sam2-gpu-runtime-result'
import {
  CANONICAL_GPU_WORKER_OPERATION_ROUTER_RECEIPT_VERSION,
  CANONICAL_GPU_WORKER_OPERATION_ROUTER_VERSION,
  type CanonicalGpuWorkerOperationRouterReceipt,
  type CanonicalGpuWorkerOperationId,
  type CanonicalGpuWorkerOperationRuntimePort,
  type CanonicalGpuWorkerOperationRuntimePortResult,
  type CanonicalGpuWorkerRuntimeRequest,
  type CanonicalGpuWorkerRuntimeSuccessWireResponse,
  type CanonicalGpuWorkerRuntimePortEvidenceClass,
} from './canonical-gpu-worker-operation-router-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_RESPONSE_BYTES = 128 * 1_024
const ROUTER_TIMEOUT_MILLISECONDS = 2 * 60 * 60 * 1_000

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const fasterWhisperModelArtifactsSchema = z.tuple([
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

const fasterWhisperRuntimeRequestSchema = z.object({
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
  modelArtifacts: fasterWhisperModelArtifactsSchema,
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

const rembgRuntimeRequestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-rembg-gpu-runtime-request-v1',
  ),
  operationId: z.literal(
    'tool.rembg.remove_image_background.v1',
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
      .max(16_777_216),
    contentType: z.literal('image/png'),
    width: z.number().int().positive().max(4_096),
    height: z.number().int().positive().max(4_096),
    decodedRgbaSha256: digestSchema,
    opaquePixelCount: z.number().int().positive()
      .max(16_777_216),
  }).strict().superRefine((source, context) => {
    const pixelCount = source.width * source.height
    if (
      pixelCount > 16_777_216
      || source.opaquePixelCount !== pixelCount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'opaque source pixel contract changed',
      })
    }
  }),
  modelArtifacts: z.tuple([
    z.object({
      canonicalOrder: z.literal(0),
      slotId: z.literal('rembg_u2netp_onnx'),
      fileName: z.literal('u2netp.onnx'),
      byteLength: z.literal(4_574_861),
      contentSha256: z.literal(
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
      ),
    }).strict(),
  ]),
  settings: z.object({
    device: z.literal('cuda'),
    modelId: z.literal('u2netp'),
    outputMode: z.literal('mask_only_png'),
    confidenceThreshold: z.literal(0.5),
    alphaMatteMode: z.literal('straight'),
    edgeRefinementProfileId: z.literal(
      'approved_u2netp_default_v1',
    ),
    maximumSubjects: z.literal(1),
    preserveSourceDimensions: z.literal(true),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  requestBindingSha256: digestSchema,
}).strict()

const sam2SubjectPromptBaseSchema = z.object({
  promptPacketVersion: z.literal(
    'canonical-sam2-subject-prompt-packet-v1',
  ),
  promptPacketClass: z.literal(
    'server_compiled_normalized_subject_selection',
  ),
  subjectSelectionId: safeIdSchema,
  sourceArtifactId: safeIdSchema,
  sourceArtifactSha256: digestSchema,
  sourceFrameIndex: z.number().int().nonnegative()
    .max(17_999),
  sourceFrameWidth: z.number().int().min(16).max(8_192),
  sourceFrameHeight: z.number().int().min(16).max(8_192),
  coordinateSpace: z.literal('normalized_source_frame'),
  subjectCount: z.literal(1),
  approvedSubjectLabelIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  rawMediaIncluded: z.literal(false),
  promptDigestSha256: digestSchema,
})

const sam2NormalizedCoordinateSchema =
  z.number().finite().min(0).max(1)

const sam2SubjectPromptSchema = z.discriminatedUnion(
  'promptMode',
  [
    sam2SubjectPromptBaseSchema.extend({
      promptMode: z.literal('box'),
      boundingBox: z.object({
        x: sam2NormalizedCoordinateSchema,
        y: sam2NormalizedCoordinateSchema,
        width: sam2NormalizedCoordinateSchema
          .refine((value) => value >= 0.001),
        height: sam2NormalizedCoordinateSchema
          .refine((value) => value >= 0.001),
      }).strict().superRefine((box, context) => {
        if (box.x + box.width > 1 || box.y + box.height > 1) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'SAM2 prompt box exceeds source frame',
          })
        }
      }),
      points: z.tuple([]),
    }).strict(),
    sam2SubjectPromptBaseSchema.extend({
      promptMode: z.literal('points'),
      boundingBox: z.null(),
      points: z.array(z.object({
        x: sam2NormalizedCoordinateSchema,
        y: sam2NormalizedCoordinateSchema,
        label: z.enum(['foreground', 'background']),
      }).strict()).min(1).max(32)
        .refine((points) => points.some(
          (point) => point.label === 'foreground',
        )),
    }).strict(),
  ],
)

const sam2RuntimeRequestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam2-gpu-runtime-request-v1',
  ),
  operationId: z.literal(
    'tool.sam2.segment_and_track_subject.v1',
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
      .max(4_294_901_760),
    contentType: z.literal('video/mp4'),
    width: z.number().int().min(16).max(8_192),
    height: z.number().int().min(16).max(8_192),
    frameCount: z.number().int().min(2).max(18_000),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    durationMilliseconds: z.number().int().positive()
      .max(600_000),
    sourceExpectationDigestSha256: digestSchema,
  }).strict().superRefine((source, context) => {
    if (
      source.width * source.height * source.frameCount
        > 4_294_901_760
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SAM2 raw mask spool ceiling exceeded',
      })
    }
  }),
  subjectPromptArtifact: z.object({
    artifactId: safeIdSchema,
    contentSha256: digestSchema,
    byteLength: z.number().int().min(2).max(65_536),
    contentType: z.literal('application/json'),
    canonicalJsonEncoding: z.literal(
      'stable_authority_json_utf8_no_bom',
    ),
  }).strict(),
  subjectPrompt: sam2SubjectPromptSchema,
  modelArtifacts: z.tuple([
    z.object({
      canonicalOrder: z.literal(0),
      slotId: z.literal('sam2_checkpoint'),
      fileName: z.literal('sam2.1_hiera_small.pt'),
      artifactId: z.literal(
        'meta-sam2.1-hiera-small-checkpoint',
      ),
      revision: z.literal(
        'ee5bba1d82bb8749febdf90f45e84b687142ba03',
      ),
      modelFamily: z.literal('sam2.1-hiera-small'),
      byteLength: z.literal(184_416_285),
      contentSha256: z.literal(
        '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
      ),
    }).strict(),
  ]),
  settings: z.object({
    device: z.literal('cuda'),
    modelConfigPath: z.literal(
      'configs/sam2.1/sam2.1_hiera_s.yaml',
    ),
    confidenceThreshold: z.number().finite().min(0.01).max(0.99),
    maximumSubjects: z.literal(1),
    frameStride: z.literal(1),
    preserveContactObjects: z.boolean(),
    subjectPromptProfile: z.literal(
      'normalized_box_or_points_v1',
    ),
    subjectPromptSha256: digestSchema,
    outputMode: z.literal(
      'gray8_ffv1_matroska_mask_sequence_v1',
    ),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  requestBindingSha256: digestSchema,
}).strict().superRefine((request, context) => {
  const source = request.source
  const prompt = request.subjectPrompt
  const {
    promptDigestSha256,
    ...promptWithoutDigest
  } = prompt
  const promptBytes = Buffer.byteLength(
    stableAuthorityStringify(prompt),
    'utf8',
  )
  if (
    prompt.sourceArtifactId !== source.artifactId
    || prompt.sourceArtifactSha256 !== source.contentSha256
    || prompt.sourceFrameWidth !== source.width
    || prompt.sourceFrameHeight !== source.height
    || prompt.sourceFrameIndex >= source.frameCount
    || request.subjectPromptArtifact.byteLength !== promptBytes
    || request.subjectPromptArtifact.contentSha256
      !== sha256AuthorityValue(prompt)
    || request.settings.subjectPromptSha256
      !== request.subjectPromptArtifact.contentSha256
    || promptDigestSha256
      !== sha256AuthorityValue(promptWithoutDigest)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SAM2 prompt and source lineage changed',
    })
  }
})

const runtimeRequestSchema = z.discriminatedUnion(
  'operationId',
  [
    canonicalComfyUiGpuRuntimeRunnerRequestSchema,
    fasterWhisperRuntimeRequestSchema,
    rembgRuntimeRequestSchema,
    sam2RuntimeRequestSchema,
  ],
)

const runtimePorts = new WeakSet<object>()
const consumedRuntimePorts = new WeakSet<object>()

const BLOCKERS = [
  'canonical_attempt_authority_reread_required',
  'canonical_cloud_dispatch_worker_and_completion_receipts_required',
  'cloud_run_gpu_job_deployment_and_image_identity_required',
  'live_worker_service_identity_and_iam_required',
  'official_gpu_rate_and_attempt_cost_evidence_required',
  'private_input_and_model_mount_materialization_required',
  'private_output_artifact_commit_qa_reconciliation_required',
] as const

export function createCanonicalGpuWorkerOperationRuntimePort(input: {
  evidenceClass: CanonicalGpuWorkerRuntimePortEvidenceClass
  supportedOperationIds?:
    readonly CanonicalGpuWorkerOperationId[]
  execute(
    input: Parameters<
      CanonicalGpuWorkerOperationRuntimePort['execute']
    >[0],
  ): Promise<CanonicalGpuWorkerOperationRuntimePortResult>
}): CanonicalGpuWorkerOperationRuntimePort {
  const supportedOperationIds =
    input.supportedOperationIds
    ?? ['tool.faster_whisper.transcribe_private_audio.v1']
  assertSupportedOperationIds(supportedOperationIds)
  const port: CanonicalGpuWorkerOperationRuntimePort = Object.freeze({
    portVersion:
      'canonical-gpu-worker-operation-runtime-port-v1',
    evidenceClass: input.evidenceClass,
    supportedOperationIds:
      Object.freeze([...supportedOperationIds]),
    execute: input.execute,
  })
  runtimePorts.add(port)
  return port
}

export async function routeCanonicalGpuWorkerOperation(input: {
  request: unknown
  runtimePort: CanonicalGpuWorkerOperationRuntimePort
}): Promise<CanonicalGpuWorkerOperationRouterReceipt> {
  const parsed = runtimeRequestSchema.safeParse(input.request)
  if (!parsed.success) {
    throw invalid('canonical_gpu_worker_runtime_request_invalid')
  }
  const request = parsed.data as CanonicalGpuWorkerRuntimeRequest
  assertRuntimePort(input.runtimePort, request.operationId)
  assertRequestBinding(request)
  const runtimeContract =
    await assertCurrentRuntimeContract(request)
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
  const response = assertRuntimeWireResponse({
    value: runtimeResult.wireResponse,
    request,
  })
  const outputCount = response.outputs.length
  const processEvidenceCount =
    'processEvidence' in response
      ? response.processEvidence.length
      : 0

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
      computeType: request.operationId
        === 'tool.faster_whisper.transcribe_private_audio.v1'
        ? 'float16' as const
        : 'model_native' as const,
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
      outputCount,
      processEvidenceCount,
      outputBytesIncluded: false as const,
      transcriptTextIncluded: false as const,
      maskBytesIncluded: false as const,
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
      maskEdgeQualityQaAuthority: false as const,
      maskSubjectCoverageQaAuthority: false as const,
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
  operationId: CanonicalGpuWorkerOperationId,
): void {
  if (
    !runtimePorts.has(port)
    || consumedRuntimePorts.has(port)
    || port.portVersion
      !== 'canonical-gpu-worker-operation-runtime-port-v1'
    || !port.supportedOperationIds.includes(operationId)
  ) {
    throw blocked(
      'canonical_gpu_worker_process_bound_runtime_port_required',
    )
  }
}

function assertRequestBinding(
  request: CanonicalGpuWorkerRuntimeRequest,
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

async function assertCurrentRuntimeContract(
  request: CanonicalGpuWorkerRuntimeRequest,
): Promise<{
  readonly contractDigestSha256: string
  readonly sourceDigestSha256: string
  readonly runtimeProtocol: {
    readonly maximumRequestBytes: number
  }
}> {
  if (
    request.operationId
      === 'tool.comfyui.generate_controlled_image.v1'
  ) {
    const runtimeContract =
      await getCanonicalComfyUiGpuRuntimeContract()
    const currentModelFiles =
      runtimeContract.fixedFileLayout.modelFiles.map((model) => ({
        canonicalOrder: model.canonicalOrder,
        role: model.role,
        slotId: model.slotId,
        fileName: model.fileName,
        byteLength: model.byteLength,
        contentSha256: model.contentSha256,
      }))
    const requestModelFiles = request.modelArtifacts.map(
      (model) => ({
        canonicalOrder: model.canonicalOrder,
        role: model.role,
        slotId: model.slotId,
        fileName: model.fileName,
        byteLength: model.byteLength,
        contentSha256: model.contentSha256,
      }),
    )
    if (
      runtimeContract.operationIdentity.operationId
        !== request.operationId
      || runtimeContract.operationIdentity.sharedWorkerType
        !== 'gpu_ai_worker'
      || runtimeContract.runtimeProtocol.device !== 'cuda'
      || runtimeContract.runtimeProtocol.cpuFallbackAllowed
      || runtimeContract.cloudRunGpuPolicy.admittedExistingRegion
        !== request.dispatch.runtimeRegion
      || stableAuthorityStringify(currentModelFiles)
        !== stableAuthorityStringify(requestModelFiles)
    ) {
      throw blocked(
        'canonical_gpu_worker_current_runtime_contract_mismatch',
      )
    }
    return runtimeContract
  }

  if (
    request.operationId
      === 'tool.faster_whisper.transcribe_private_audio.v1'
  ) {
    const runtimeContract =
      await getCanonicalFasterWhisperGpuRuntimeContract()
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
    return runtimeContract
  }

  const runtimeContract =
    request.operationId
      === 'tool.rembg.remove_image_background.v1'
      ? await getCanonicalRembgGpuRuntimeContract()
      : await getCanonicalSam2GpuRuntimeContract()
  if (
    runtimeContract.operationIdentity.operationId
      !== request.operationId
    || runtimeContract.operationIdentity.sharedWorkerType
      !== 'gpu_ai_worker'
    || runtimeContract.runtimeProtocol.device !== 'cuda'
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
  if (
    request.operationId
      === 'tool.rembg.remove_image_background.v1'
    && (
      !('executionProvider' in runtimeContract.runtimeProtocol)
      || runtimeContract.runtimeProtocol.executionProvider
        !== 'CUDAExecutionProvider'
    )
  ) {
    throw blocked(
      'canonical_gpu_worker_current_runtime_contract_mismatch',
    )
  }
  return runtimeContract
}

function assertRuntimeWireResponse(input: {
  value: unknown
  request: CanonicalGpuWorkerRuntimeRequest
}): CanonicalGpuWorkerRuntimeSuccessWireResponse {
  if (
    input.request.operationId
      === 'tool.comfyui.generate_controlled_image.v1'
  ) {
    return assertCanonicalComfyUiGpuRuntimeWireResponse({
      value: input.value,
      request: input.request,
    })
  }
  if (
    input.request.operationId
      === 'tool.faster_whisper.transcribe_private_audio.v1'
  ) {
    return assertCanonicalFasterWhisperGpuRuntimeWireResponse({
      value: input.value,
      request: input.request,
    })
  }
  if (
    input.request.operationId
      === 'tool.rembg.remove_image_background.v1'
  ) {
    return assertCanonicalRembgGpuRuntimeWireResponse({
      value: input.value,
      request: input.request,
    })
  }
  return assertCanonicalSam2GpuRuntimeWireResponse({
    value: input.value,
    request: input.request,
  })
}

function assertSupportedOperationIds(
  operationIds: readonly CanonicalGpuWorkerOperationId[],
): void {
  const allowed = new Set<CanonicalGpuWorkerOperationId>([
    'tool.comfyui.generate_controlled_image.v1',
    'tool.faster_whisper.transcribe_private_audio.v1',
    'tool.rembg.remove_image_background.v1',
    'tool.sam2.segment_and_track_subject.v1',
  ])
  if (
    operationIds.length < 1
    || operationIds.length > allowed.size
    || new Set(operationIds).size !== operationIds.length
    || operationIds.some((operationId) => !allowed.has(operationId))
  ) {
    throw invalid(
      'canonical_gpu_worker_supported_operations_invalid',
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
