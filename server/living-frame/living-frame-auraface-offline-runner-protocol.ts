import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
  LivingFrameAuraFaceCpuHostExecutionInput,
  LivingFrameAuraFaceCpuHostExecutionResult,
} from './living-frame-auraface-cpu-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_PROTOCOL =
  'living-frame-auraface-offline-runner-v1' as const
export const LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL =
  'living-frame-auraface-offline-runner-response-v1' as const
export const LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL =
  'living-frame-auraface-atomic-mount-offline-runner-v2' as const
export const LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL =
  'living-frame-auraface-atomic-mount-offline-runner-response-v2' as const
export const LIVING_FRAME_AURAFACE_OFFLINE_OPERATION =
  'tool.transformers.measure_auraface_identity_continuity.v1' as const
export const LIVING_FRAME_AURAFACE_OFFLINE_PACKAGE_PROFILE =
  'auraface_v1_cpu_continuity_measurement' as const
export const LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST =
  '2660c1ec27667e691e9d1a84c0426fee95ccde4ddd35470e485ff5dcd4c6d614' as const

const SHA256 = /^[a-f0-9]{64}$/u
const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/u
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u
const MAXIMUM_IMAGE_BYTES = 8 * 1024 * 1024
const EMBEDDING_BYTE_LENGTH = 512 * 4
const MAXIMUM_ELAPSED_MILLISECONDS = 120_000

const imagePacketSchema = z.object({
  contentType: z.enum(['image/png', 'image/jpeg']),
  contentByteLength: z.number().int().min(64).max(MAXIMUM_IMAGE_BYTES),
  contentSha256: z.string().regex(SHA256),
  contentBytesBase64: z.string().regex(BASE64),
}).strict()

const requestSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_PROTOCOL,
  ),
  operationId: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
  ),
  packageProfile: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_PACKAGE_PROFILE,
  ),
  payload: z.object({
    artifactRequirementSetDigestSha256: z.string().regex(SHA256),
    modelBindingPacketDigestSha256: z.string().regex(SHA256),
    preprocessingSpecDigestSha256: z.literal(
      LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
    ),
    referenceImage: imagePacketSchema,
    candidateImage: imagePacketSchema,
  }).strict(),
}).strict()

const atomicMountRequestSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
  ),
  operationId: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
  ),
  packageProfile: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_PACKAGE_PROFILE,
  ),
  payload: z.object({
    artifactRequirementSetDigestSha256: z.string().regex(SHA256),
    canonicalMountSessionDigestSha256: z.string().regex(SHA256),
    preprocessingSpecDigestSha256: z.literal(
      LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
    ),
    referenceImage: imagePacketSchema,
    candidateImage: imagePacketSchema,
  }).strict(),
}).strict()

const packageIdentitySchema = z.object({
  insightfaceVersion: z.literal('1.0.1'),
  onnxruntimeVersion: z.literal('1.28.0'),
  opencvHeadlessVersion: z.literal('5.0.0.93'),
  preprocessingSpecDigestSha256: z.literal(
    LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
  ),
}).strict()

const responseCommonSchema = z.object({
  schemaVersion: z.enum([
    LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
    LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  ]),
  ok: z.literal(true),
  operationId: z.literal(
    LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
  ),
  packageIdentity: packageIdentitySchema,
  requestEnvelopeSha256: z.string().regex(SHA256),
  attemptAccepted: z.literal(true),
  detectorInferenceExecuted: z.literal(true),
  startedAt: z.string().regex(ISO_INSTANT),
  finishedAt: z.string().regex(ISO_INSTANT),
  externalNetworkPerformed: z.literal(false),
  runtimeDownloadPerformed: z.literal(false),
  thresholdApplied: z.literal(false),
  identityDecisionCreated: z.literal(false),
  productionReady: z.literal(false),
})

const completedResponseSchema = responseCommonSchema.extend({
  terminalState: z.literal('completed'),
  failureCode: z.literal('none'),
  faceOutcome: z.literal('exactly_one_face_each'),
  embeddingInferenceExecuted: z.literal(true),
  referenceInferenceOutputDigestSha256: z.string().regex(SHA256),
  candidateInferenceOutputDigestSha256: z.string().regex(SHA256),
  embedding: z.object({
    dimension: z.literal(512),
    referenceFloat32LeBase64: z.string().regex(BASE64),
    candidateFloat32LeBase64: z.string().regex(BASE64),
    referenceDigestSha256: z.string().regex(SHA256),
    candidateDigestSha256: z.string().regex(SHA256),
  }).strict(),
}).strict()

const reviewResponseSchema = responseCommonSchema.extend({
  terminalState: z.literal('user_review_required'),
  failureCode: z.literal('face_review_required'),
  faceOutcome: z.enum([
    'reference_no_face',
    'candidate_no_face',
    'reference_multiple_faces',
    'candidate_multiple_faces',
    'reference_and_candidate_face_count_invalid',
  ]),
  embeddingInferenceExecuted: z.literal(false),
}).strict()

const failureResponseSchema = z.object({
  schemaVersion: z.enum([
    LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
    LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  ]),
  ok: z.literal(false),
  code: z.enum([
    'REQUEST_VALIDATION_FAILED',
    'MODEL_OR_INFERENCE_FAILED',
  ]),
  productionReady: z.literal(false),
}).strict()

export type LivingFrameAuraFaceOfflineRunnerRequest =
  z.infer<typeof requestSchema>
export type LivingFrameAuraFaceAtomicMountOfflineRunnerRequest =
  z.infer<typeof atomicMountRequestSchema>

export interface LivingFrameAuraFaceOfflineRunnerRequestEnvelope {
  readonly request: LivingFrameAuraFaceOfflineRunnerRequest
  readonly requestJson: string
  readonly requestEnvelopeSha256: string
}

export interface LivingFrameAuraFaceAtomicMountOfflineRunnerRequestEnvelope {
  readonly request: LivingFrameAuraFaceAtomicMountOfflineRunnerRequest
  readonly requestJson: string
  readonly requestEnvelopeSha256: string
}

export class LivingFrameAuraFaceOfflineRunnerProtocolError extends Error {
  readonly code:
    | 'input_invalid'
    | 'response_invalid'
    | 'runner_failed'
    | 'request_binding_mismatch'
    | 'embedding_invalid'

  constructor(
    code: LivingFrameAuraFaceOfflineRunnerProtocolError['code'],
  ) {
    super(`Living Frame AuraFace offline runner ${code}.`)
    this.name = 'LivingFrameAuraFaceOfflineRunnerProtocolError'
    this.code = code
  }
}

export function compileLivingFrameAuraFaceOfflineRunnerRequest(
  input: LivingFrameAuraFaceCpuHostExecutionInput,
): LivingFrameAuraFaceOfflineRunnerRequestEnvelope {
  if (
    input.externalNetworkAllowed !== false
    || input.runtimeDownloadsAllowed !== false
    || input.callerThresholdAccepted !== false
    || input.identityApprovalRequested !== false
    || input.preprocessingSpecDigestSha256
      !== LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST
  ) throw invalid('input_invalid')

  const request: LivingFrameAuraFaceOfflineRunnerRequest = {
    schemaVersion:
      LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_PROTOCOL,
    operationId:
      LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
    packageProfile:
      LIVING_FRAME_AURAFACE_OFFLINE_PACKAGE_PROFILE,
    payload: {
      artifactRequirementSetDigestSha256:
        input.artifactRequirementSetDigestSha256,
      modelBindingPacketDigestSha256:
        input.modelBindingPacketDigestSha256,
      preprocessingSpecDigestSha256:
        LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
      referenceImage: committedImage(input.referenceImage),
      candidateImage: committedImage(input.candidateImage),
    },
  }
  const parsed = requestSchema.safeParse(request)
  if (!parsed.success) throw invalid('input_invalid')
  const requestJson = stableAuthorityStringify(parsed.data)
  return Object.freeze({
    request: parsed.data,
    requestJson,
    requestEnvelopeSha256:
      sha256AuthorityValue(parsed.data),
  })
}

export function compileLivingFrameAuraFaceAtomicMountOfflineRunnerRequest(
  input: {
    readonly session:
      LivingFrameAuraFaceCpuCanonicalMountHostSessionInput
    readonly canonicalMountSessionDigestSha256: string
  },
): LivingFrameAuraFaceAtomicMountOfflineRunnerRequestEnvelope {
  if (
    !SHA256.test(input.canonicalMountSessionDigestSha256)
    || input.session.externalNetworkAllowed !== false
    || input.session.runtimeDownloadsAllowed !== false
    || input.session.callerThresholdAccepted !== false
    || input.session.identityApprovalRequested !== false
    || input.session.preprocessingSpecDigestSha256
      !== LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST
  ) throw invalid('input_invalid')

  const request: LivingFrameAuraFaceAtomicMountOfflineRunnerRequest = {
    schemaVersion:
      LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
    operationId:
      LIVING_FRAME_AURAFACE_OFFLINE_OPERATION,
    packageProfile:
      LIVING_FRAME_AURAFACE_OFFLINE_PACKAGE_PROFILE,
    payload: {
      artifactRequirementSetDigestSha256:
        input.session.artifactRequirementSetDigestSha256,
      canonicalMountSessionDigestSha256:
        input.canonicalMountSessionDigestSha256,
      preprocessingSpecDigestSha256:
        LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
      referenceImage:
        committedImage(input.session.referenceImage),
      candidateImage:
        committedImage(input.session.candidateImage),
    },
  }
  const parsed = atomicMountRequestSchema.safeParse(request)
  if (!parsed.success) throw invalid('input_invalid')
  const requestJson = stableAuthorityStringify(parsed.data)
  return Object.freeze({
    request: parsed.data,
    requestJson,
    requestEnvelopeSha256:
      sha256AuthorityValue(parsed.data),
  })
}

export function parseLivingFrameAuraFaceOfflineRunnerResponse(
  input: {
    readonly responseJson: string
    readonly expectedRequestEnvelopeSha256: string
  },
): LivingFrameAuraFaceCpuHostExecutionResult {
  return parseRunnerResponse({
    ...input,
    expectedResponseProtocol:
      LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  })
}

export function parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse(
  input: {
    readonly responseJson: string
    readonly expectedRequestEnvelopeSha256: string
  },
): LivingFrameAuraFaceCpuHostExecutionResult {
  return parseRunnerResponse({
    ...input,
    expectedResponseProtocol:
      LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL,
  })
}

function parseRunnerResponse(
  input: {
    readonly responseJson: string
    readonly expectedRequestEnvelopeSha256: string
    readonly expectedResponseProtocol:
      | typeof LIVING_FRAME_AURAFACE_OFFLINE_RUNNER_RESPONSE_PROTOCOL
      | typeof LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_RESPONSE_PROTOCOL
  },
): LivingFrameAuraFaceCpuHostExecutionResult {
  let decoded: unknown
  try {
    decoded = JSON.parse(input.responseJson)
  } catch {
    throw invalid('response_invalid')
  }
  const failure = failureResponseSchema.safeParse(decoded)
  if (failure.success) {
    if (
      failure.data.schemaVersion
        !== input.expectedResponseProtocol
    ) throw invalid('response_invalid')
    throw invalid('runner_failed')
  }
  const completed = completedResponseSchema.safeParse(decoded)
  if (completed.success) {
    if (
      completed.data.schemaVersion
        !== input.expectedResponseProtocol
    ) throw invalid('response_invalid')
    assertCommonResponse(
      completed.data,
      input.expectedRequestEnvelopeSha256,
    )
    const referenceEmbedding = decodeEmbedding(
      completed.data.embedding.referenceFloat32LeBase64,
      completed.data.embedding.referenceDigestSha256,
    )
    const candidateEmbedding = decodeEmbedding(
      completed.data.embedding.candidateFloat32LeBase64,
      completed.data.embedding.candidateDigestSha256,
    )
    return Object.freeze({
      evidenceClass:
        'private_internal_auraface_cpu_runtime_observation_unreleased',
      terminalState: 'completed',
      failureCode: 'none',
      faceOutcome: 'exactly_one_face_each',
      attemptAccepted: true,
      detectorInferenceExecuted: true,
      embeddingInferenceExecuted: true,
      startedAt: completed.data.startedAt,
      finishedAt: completed.data.finishedAt,
      referenceInferenceOutputDigestSha256:
        completed.data.referenceInferenceOutputDigestSha256,
      candidateInferenceOutputDigestSha256:
        completed.data.candidateInferenceOutputDigestSha256,
      referenceEmbedding,
      candidateEmbedding,
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
    })
  }
  const review = reviewResponseSchema.safeParse(decoded)
  if (!review.success) throw invalid('response_invalid')
  if (
    review.data.schemaVersion
      !== input.expectedResponseProtocol
  ) throw invalid('response_invalid')
  assertCommonResponse(
    review.data,
    input.expectedRequestEnvelopeSha256,
  )
  return Object.freeze({
    evidenceClass:
      'private_internal_auraface_cpu_runtime_observation_unreleased',
    terminalState: 'user_review_required',
    failureCode: 'face_review_required',
    faceOutcome: review.data.faceOutcome,
    attemptAccepted: true,
    detectorInferenceExecuted: true,
    embeddingInferenceExecuted: false,
    startedAt: review.data.startedAt,
    finishedAt: review.data.finishedAt,
    externalNetworkPerformed: false,
    runtimeDownloadPerformed: false,
  })
}

function committedImage(
  input:
    | LivingFrameAuraFaceCpuHostExecutionInput['referenceImage']
    | LivingFrameAuraFaceCpuCanonicalMountHostSessionInput[
      'referenceImage'
    ],
): z.infer<typeof imagePacketSchema> {
  const bytes = Uint8Array.from(input.contentBytes)
  if (
    bytes.byteLength < 64
    || bytes.byteLength > MAXIMUM_IMAGE_BYTES
    || sha256Bytes(bytes) !== input.contentSha256
  ) throw invalid('input_invalid')
  const packet = {
    contentType: input.contentType,
    contentByteLength: bytes.byteLength,
    contentSha256: input.contentSha256,
    contentBytesBase64:
      Buffer.from(bytes).toString('base64'),
  }
  const parsed = imagePacketSchema.safeParse(packet)
  if (!parsed.success) throw invalid('input_invalid')
  return parsed.data
}

function assertCommonResponse(
  response: {
    readonly requestEnvelopeSha256: string
    readonly startedAt: string
    readonly finishedAt: string
  },
  expectedRequestEnvelopeSha256: string,
): void {
  if (
    !SHA256.test(expectedRequestEnvelopeSha256)
    || response.requestEnvelopeSha256
      !== expectedRequestEnvelopeSha256
  ) throw invalid('request_binding_mismatch')
  const elapsed =
    Date.parse(response.finishedAt)
    - Date.parse(response.startedAt)
  if (
    !Number.isFinite(elapsed)
    || elapsed < 0
    || elapsed > MAXIMUM_ELAPSED_MILLISECONDS
  ) throw invalid('response_invalid')
}

function decodeEmbedding(
  encoded: string,
  expectedDigest: string,
): Float32Array {
  let bytes: Uint8Array
  try {
    bytes = Uint8Array.from(Buffer.from(encoded, 'base64'))
  } catch {
    throw invalid('embedding_invalid')
  }
  if (
    bytes.byteLength !== EMBEDDING_BYTE_LENGTH
    || Buffer.from(bytes).toString('base64') !== encoded
    || sha256Bytes(bytes) !== expectedDigest
  ) throw invalid('embedding_invalid')
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  )
  const embedding = new Float32Array(512)
  let squaredNorm = 0
  for (let index = 0; index < 512; index += 1) {
    const value = view.getFloat32(index * 4, true)
    if (!Number.isFinite(value)) throw invalid('embedding_invalid')
    embedding[index] = value
    squaredNorm += value * value
  }
  if (
    !Number.isFinite(squaredNorm)
    || squaredNorm < 0.999
    || squaredNorm > 1.001
  ) throw invalid('embedding_invalid')
  return embedding
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function invalid(
  code: LivingFrameAuraFaceOfflineRunnerProtocolError['code'],
): LivingFrameAuraFaceOfflineRunnerProtocolError {
  return new LivingFrameAuraFaceOfflineRunnerProtocolError(code)
}
