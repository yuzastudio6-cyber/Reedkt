import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import {
  MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
  MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
  MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT,
  MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
  MOTION_STUDIO_HAILUO_MODEL_ID,
  MOTION_STUDIO_WAN_LIVE_ADAPTER_ID,
  MOTION_STUDIO_WAN_MODEL_ID,
  type MotionStudioLiveCredentialBinding,
  type MotionStudioMs010BExecutionAuthorityV1,
  type MotionStudioMs010BFallbackEligibilityV1,
} from '../../../src/types/motion-studio'
import {
  validateMotionStudioMs010BExecutionAuthority,
  validateMotionStudioMs010BFallbackEligibility,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const OPENAI_IMAGE_GENERATION_ENDPOINT =
  'https://api.openai.com/v1/images/generations' as const
export const OPENAI_IMAGE_EDIT_ENDPOINT =
  'https://api.openai.com/v1/images/edits' as const
export const MINIMAX_VIDEO_GENERATION_ENDPOINT =
  'https://api.minimax.io/v1/video_generation' as const
export const MINIMAX_VIDEO_QUERY_ENDPOINT =
  'https://api.minimax.io/v1/query/video_generation' as const
export const MINIMAX_FILE_RETRIEVE_ENDPOINT =
  'https://api.minimax.io/v1/files/retrieve' as const

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_PROVIDER_IDENTIFIER_LENGTH = 256
const MAX_IMAGE_RESPONSE_BASE64_LENGTH = 64 * 1024 * 1024
const compiledRequestIntegrityDigests = new WeakMap<object, string>()

export interface MotionStudioLiveImageInput {
  bytes: Buffer
  mimeType: 'image/png'
  width: 1280
  height: 720
  sha256: string
}

export interface MotionStudioCompiledProviderRequest<TBody> {
  providerAdapterId:
    | typeof MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID
    | typeof MOTION_STUDIO_WAN_LIVE_ADAPTER_ID
    | typeof MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID
  credentialReferenceId: string
  method: 'GET' | 'POST'
  endpoint: string
  query?: Readonly<Record<string, string>>
  fixedHeaders: Readonly<Record<string, string>>
  body: TBody
  requestDigest: string
  containsPrivateMediaBytes: boolean
  safeToLogBody: false
  maximumProviderCallCount: 1
}

/**
 * Proves that a live request came from this module's compiler and has not
 * changed since compilation. The proof is process-local by design: callers
 * cannot deserialize or hand-construct a request and then dispatch it.
 */
export function assertMotionStudioCompiledProviderRequestIntegrity<TBody>(
  request: MotionStudioCompiledProviderRequest<TBody>,
): void {
  const expectedDigest = compiledRequestIntegrityDigests.get(request)
  if (!expectedDigest) {
    throw blocked('Live provider request was not produced by the frozen compiler in this process.')
  }
  const actualDigest = compiledRequestIntegrityDigest(request)
  if (actualDigest !== expectedDigest) {
    throw blocked('Live provider request failed its compiler integrity check after mutation.')
  }
}

export interface GptImage2LiveGenerationBody {
  model: typeof MOTION_STUDIO_GPT_IMAGE_MODEL_ID
  prompt: string
  size: '1280x720'
  quality: 'medium'
  output_format: 'png'
  background: 'opaque'
  n: 1
}

export interface GptImage2LiveEditBody {
  kind: 'multipart_image_edit'
  fields: {
    model: typeof MOTION_STUDIO_GPT_IMAGE_MODEL_ID
    prompt: string
    size: '1280x720'
    quality: 'medium'
    output_format: 'png'
    background: 'opaque'
    n: '1'
  }
  image: MotionStudioLiveImageInput
}

export interface Wan27LiveBody {
  model: typeof MOTION_STUDIO_WAN_MODEL_ID
  input: {
    prompt: string
    negative_prompt: string
    media: readonly [{
      type: 'first_frame'
      url: string
    }]
  }
  parameters: {
    resolution: '720P'
    duration: 6
    prompt_extend: false
    watermark: false
  }
}

export interface Hailuo23FastLiveBody {
  model: typeof MOTION_STUDIO_HAILUO_MODEL_ID
  first_frame_image: string
  prompt: string
  prompt_optimizer: false
  duration: 6
  resolution: '768P'
}

export interface ParsedGptImage2LiveResponse {
  bytes: Buffer
  sha256: string
  responseDigest: string
  modelSnapshot: typeof MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputTextTokens: number
    inputImageTokens: number
    inputCachedTokens: number
    outputImageTokens: number
  }
  providerCostIncurred: true
}

export type WanTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN'

export interface ParsedWanSubmitResponse {
  transientTaskId: string
  taskIdDigest: string
  requestIdDigest: string
  status: 'PENDING'
  responseDigest: string
}

export interface ParsedWanQueryResponse {
  transientTaskId: string
  taskIdDigest: string
  requestIdDigest: string
  status: WanTaskStatus
  transientDownloadUrl?: string
  usage?: {
    billedDurationSeconds: number
    outputDurationSeconds: number
    videoCount: 1
    resolution: 720
  }
  failure?: { code: string; message: string }
  responseDigest: string
}

export type HailuoTaskStatus = 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail'

export interface ParsedHailuoSubmitResponse {
  transientTaskId: string
  taskIdDigest: string
  status: 'submitted'
  responseDigest: string
}

export interface ParsedHailuoQueryResponse {
  transientTaskId: string
  taskIdDigest: string
  status: HailuoTaskStatus
  transientFileId?: string
  fileIdDigest?: string
  width?: number
  height?: number
  failureMessage?: string
  responseDigest: string
}

export interface ParsedHailuoFileResponse {
  transientFileId: string
  fileIdDigest: string
  transientDownloadUrl: string
  declaredBytes: number
  filename: string
  responseDigest: string
}

export function compileGptImage2LiveGenerationRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  prompt: string
}): MotionStudioCompiledProviderRequest<GptImage2LiveGenerationBody> {
  assertExecutionAuthority(input.executionAuthority, 'openai', input.credentialReferenceId, input.executionTime)
  const prompt = assertPrompt(input.prompt, 32_000, 'GPT Image 2 generation prompt')
  const body: GptImage2LiveGenerationBody = {
    model: MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
    prompt,
    size: '1280x720',
    quality: 'medium',
    output_format: 'png',
    background: 'opaque',
    n: 1,
  }
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'POST',
    endpoint: OPENAI_IMAGE_GENERATION_ENDPOINT,
    fixedHeaders: { 'Content-Type': 'application/json' },
    body,
    digestBody: body,
    containsPrivateMediaBytes: false,
  })
}

export function compileGptImage2LiveEditRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  prompt: string
  sourceImage: MotionStudioLiveImageInput
}): MotionStudioCompiledProviderRequest<GptImage2LiveEditBody> {
  assertExecutionAuthority(input.executionAuthority, 'openai', input.credentialReferenceId, input.executionTime)
  assertLiveImage(input.sourceImage)
  const fields = {
    model: MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
    prompt: assertPrompt(input.prompt, 32_000, 'GPT Image 2 edit prompt'),
    size: '1280x720',
    quality: 'medium',
    output_format: 'png',
    background: 'opaque',
    n: '1',
  } as const
  const body: GptImage2LiveEditBody = {
    kind: 'multipart_image_edit',
    fields,
    image: input.sourceImage,
  }
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'POST',
    endpoint: OPENAI_IMAGE_EDIT_ENDPOINT,
    fixedHeaders: {},
    body,
    digestBody: { ...fields, sourceImageSha256: input.sourceImage.sha256 },
    containsPrivateMediaBytes: true,
  })
}

export function compileWan27LiveRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  workspaceBindingId: string
  workspaceId: string
  region: 'singapore' | 'beijing'
  prompt: string
  negativePrompt: string
  firstFrame: MotionStudioLiveImageInput
}): MotionStudioCompiledProviderRequest<Wan27LiveBody> {
  const credentialBinding = assertExecutionAuthority(
    input.executionAuthority,
    'alibaba_cloud',
    input.credentialReferenceId,
    input.executionTime,
  )
  if (
    credentialBinding.provider !== 'alibaba_cloud' ||
    credentialBinding.region !== input.region ||
    credentialBinding.workspaceBindingId !== input.workspaceBindingId
  ) {
    throw blocked('Wan region or workspace binding does not match the immutable execution authority.')
  }
  assertStableReference(input.workspaceBindingId, 'workspaceBindingId')
  assertLiveImage(input.firstFrame)
  const endpoint = wanEndpoint(input.region, input.workspaceId, 'submit')
  const firstFrameDataUrl = pngDataUrl(input.firstFrame)
  const body: Wan27LiveBody = {
    model: MOTION_STUDIO_WAN_MODEL_ID,
    input: {
      prompt: assertPrompt(input.prompt, 5_000, 'Wan prompt'),
      negative_prompt: assertPrompt(input.negativePrompt, 500, 'Wan negative prompt'),
      media: [{ type: 'first_frame', url: firstFrameDataUrl }],
    },
    parameters: {
      resolution: '720P',
      duration: 6,
      prompt_extend: false,
      watermark: false,
    },
  }
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_WAN_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'POST',
    endpoint,
    fixedHeaders: { 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' },
    body,
    digestBody: {
      model: body.model,
      input: {
        prompt: body.input.prompt,
        negative_prompt: body.input.negative_prompt,
        media: [{ type: 'first_frame', sha256: input.firstFrame.sha256 }],
      },
      parameters: body.parameters,
      region: input.region,
      workspaceBindingId: input.workspaceBindingId,
    },
    containsPrivateMediaBytes: true,
  })
}

export function compileWan27QueryRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  workspaceBindingId: string
  workspaceId: string
  region: 'singapore' | 'beijing'
  transientTaskId: string
}): MotionStudioCompiledProviderRequest<null> {
  const credentialBinding = assertExecutionAuthority(
    input.executionAuthority,
    'alibaba_cloud',
    input.credentialReferenceId,
    input.executionTime,
  )
  if (
    credentialBinding.provider !== 'alibaba_cloud' ||
    credentialBinding.region !== input.region ||
    credentialBinding.workspaceBindingId !== input.workspaceBindingId
  ) {
    throw blocked('Wan query region or workspace binding does not match the immutable execution authority.')
  }
  const taskId = assertOpaqueProviderIdentifier(input.transientTaskId, 'Wan task ID')
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_WAN_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'GET',
    endpoint: wanEndpoint(input.region, input.workspaceId, 'query', taskId),
    fixedHeaders: {},
    body: null,
    digestBody: { taskIdDigest: digestOpaqueProviderIdentifier(taskId), region: input.region },
    containsPrivateMediaBytes: false,
  })
}

export function compileHailuo23FastLiveRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  fallbackEligibility: MotionStudioMs010BFallbackEligibilityV1
  credentialReferenceId: string
  prompt: string
  firstFrame: MotionStudioLiveImageInput
}): MotionStudioCompiledProviderRequest<Hailuo23FastLiveBody> {
  assertExecutionAuthority(input.executionAuthority, 'minimax', input.credentialReferenceId, input.executionTime)
  const fallbackValidation = validateMotionStudioMs010BFallbackEligibility(input.fallbackEligibility)
  if (!fallbackValidation.ok) {
    throw blocked(`Hailuo fallback lacks persisted eligibility: ${fallbackValidation.errors.join(' ')}`)
  }
  if (
    input.fallbackEligibility.productionId !== input.executionAuthority.productionId ||
    input.fallbackEligibility.approvedSnapshotId !== input.executionAuthority.approvedSnapshotId
  ) {
    throw blocked('Hailuo fallback eligibility does not match the exact production and approved snapshot.')
  }
  assertLiveImage(input.firstFrame)
  const body: Hailuo23FastLiveBody = {
    model: MOTION_STUDIO_HAILUO_MODEL_ID,
    first_frame_image: pngDataUrl(input.firstFrame),
    prompt: assertPrompt(input.prompt, 2_000, 'Hailuo prompt'),
    prompt_optimizer: false,
    duration: 6,
    resolution: '768P',
  }
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'POST',
    endpoint: MINIMAX_VIDEO_GENERATION_ENDPOINT,
    fixedHeaders: { 'Content-Type': 'application/json' },
    body,
    digestBody: { ...body, first_frame_image: { sha256: input.firstFrame.sha256 } },
    containsPrivateMediaBytes: true,
  })
}

export function compileHailuoQueryRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  transientTaskId: string
}): MotionStudioCompiledProviderRequest<null> {
  assertExecutionAuthority(input.executionAuthority, 'minimax', input.credentialReferenceId, input.executionTime)
  const taskId = assertOpaqueProviderIdentifier(input.transientTaskId, 'Hailuo task ID')
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'GET',
    endpoint: MINIMAX_VIDEO_QUERY_ENDPOINT,
    query: { task_id: taskId },
    fixedHeaders: {},
    body: null,
    digestBody: { taskIdDigest: digestOpaqueProviderIdentifier(taskId) },
    containsPrivateMediaBytes: false,
  })
}

export function compileHailuoFileRequest(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  executionTime: string
  credentialReferenceId: string
  transientFileId: string
}): MotionStudioCompiledProviderRequest<null> {
  assertExecutionAuthority(input.executionAuthority, 'minimax', input.credentialReferenceId, input.executionTime)
  const fileId = assertOpaqueProviderIdentifier(input.transientFileId, 'Hailuo file ID')
  return compileRequest({
    providerAdapterId: MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
    credentialReferenceId: input.credentialReferenceId,
    method: 'GET',
    endpoint: MINIMAX_FILE_RETRIEVE_ENDPOINT,
    query: { file_id: fileId },
    fixedHeaders: {},
    body: null,
    digestBody: { fileIdDigest: digestOpaqueProviderIdentifier(fileId) },
    containsPrivateMediaBytes: false,
  })
}

export function parseGptImage2LiveResponse(value: unknown): ParsedGptImage2LiveResponse {
  const record = assertRecord(value, 'GPT Image 2 response')
  if (!Array.isArray(record.data) || record.data.length !== 1) {
    throw invalid('GPT Image 2 response must contain exactly one image.')
  }
  const item = assertRecord(record.data[0], 'GPT Image 2 image')
  const encoded = assertBoundedString(item.b64_json, 16, MAX_IMAGE_RESPONSE_BASE64_LENGTH, 'GPT Image 2 base64 image')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw invalid('GPT Image 2 base64 image is malformed.')
  const bytes = Buffer.from(encoded, 'base64')
  assertPngBytes(bytes, 'GPT Image 2 output')
  assertPngDimensions(bytes, 1280, 720, 'GPT Image 2 output')
  const usageRecord = assertRecord(record.usage, 'GPT Image 2 usage')
  const inputDetails = optionalRecord(usageRecord.input_tokens_details)
  const outputDetails = optionalRecord(usageRecord.output_tokens_details)
  if (!inputDetails) throw invalid('GPT Image 2 response omitted documented input token details.')
  const inputTokens = assertNonNegativeSafeInteger(usageRecord.input_tokens, 'input_tokens')
  const outputTokens = assertNonNegativeSafeInteger(usageRecord.output_tokens, 'output_tokens')
  const inputTextTokens = assertNonNegativeSafeInteger(inputDetails.text_tokens, 'text_tokens')
  const inputImageTokens = assertNonNegativeSafeInteger(inputDetails.image_tokens, 'image_tokens')
  const usage = {
    inputTokens,
    outputTokens,
    totalTokens: assertNonNegativeSafeInteger(usageRecord.total_tokens, 'total_tokens'),
    inputTextTokens,
    inputImageTokens,
    // The Images API schema documents text/image input details, but does not
    // guarantee cached-token or output-detail objects. No reported cache means
    // zero cached input, and every output token on this image-only endpoint is
    // conservatively classified as an image output token.
    inputCachedTokens: inputDetails.cached_tokens === undefined
      ? 0
      : assertNonNegativeSafeInteger(inputDetails.cached_tokens, 'cached_tokens'),
    outputImageTokens: outputDetails?.image_tokens === undefined
      ? outputTokens
      : assertNonNegativeSafeInteger(outputDetails.image_tokens, 'output image_tokens'),
  }
  if (usage.inputTokens + usage.outputTokens !== usage.totalTokens) {
    throw invalid('GPT Image 2 token totals are inconsistent.')
  }
  if (
    usage.inputTextTokens + usage.inputImageTokens !== usage.inputTokens ||
    usage.outputImageTokens !== usage.outputTokens ||
    usage.inputCachedTokens > usage.inputTokens
  ) {
    throw invalid('GPT Image 2 token details do not reconcile to provider totals.')
  }
  const sha256 = sha256Bytes(bytes)
  return {
    bytes,
    sha256,
    responseDigest: sha256CanonicalJson({ sha256, usage }),
    modelSnapshot: MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT,
    usage,
    providerCostIncurred: true,
  }
}

export function parseWanSubmitResponse(value: unknown): ParsedWanSubmitResponse {
  const record = assertSuccessfulWanEnvelope(value)
  const output = assertRecord(record.output, 'Wan submit output')
  const status = output.task_status
  if (status !== 'PENDING') throw invalid('Wan submit response must begin in PENDING state.')
  const transientTaskId = assertOpaqueProviderIdentifier(output.task_id, 'Wan task ID')
  const requestId = assertOpaqueProviderIdentifier(record.request_id, 'Wan request ID')
  const normalized = {
    taskIdDigest: digestOpaqueProviderIdentifier(transientTaskId),
    requestIdDigest: digestOpaqueProviderIdentifier(requestId),
    status,
  } as const
  return { transientTaskId, ...normalized, responseDigest: sha256CanonicalJson(normalized) }
}

export function parseWanQueryResponse(value: unknown): ParsedWanQueryResponse {
  const record = assertSuccessfulWanEnvelope(value)
  const output = assertRecord(record.output, 'Wan query output')
  const status = assertWanStatus(output.task_status)
  const transientTaskId = assertOpaqueProviderIdentifier(output.task_id, 'Wan task ID')
  const requestId = assertOpaqueProviderIdentifier(record.request_id, 'Wan request ID')
  const normalized: Omit<ParsedWanQueryResponse, 'transientTaskId' | 'transientDownloadUrl' | 'responseDigest'> = {
    taskIdDigest: digestOpaqueProviderIdentifier(transientTaskId),
    requestIdDigest: digestOpaqueProviderIdentifier(requestId),
    status,
  }
  let transientDownloadUrl: string | undefined
  if (status === 'SUCCEEDED') {
    transientDownloadUrl = assertTemporaryDownloadUrl(output.video_url, 'Wan video URL')
    const usage = assertRecord(record.usage, 'Wan usage')
    normalized.usage = {
      billedDurationSeconds: assertExactInteger(usage.duration, 6, 'Wan billed duration'),
      outputDurationSeconds: assertExactInteger(usage.output_video_duration, 6, 'Wan output duration'),
      videoCount: assertExactInteger(usage.video_count, 1, 'Wan video count'),
      resolution: assertExactInteger(usage.SR, 720, 'Wan resolution'),
    }
  } else if (status === 'FAILED') {
    normalized.failure = {
      code: assertBoundedString(output.code, 1, 128, 'Wan failure code'),
      message: assertBoundedString(output.message, 1, 1_000, 'Wan failure message'),
    }
  } else if (Object.hasOwn(output, 'video_url') || Object.hasOwn(record, 'usage')) {
    throw invalid('Incomplete Wan states cannot contain output media or usage.')
  }
  return {
    transientTaskId,
    ...normalized,
    ...(transientDownloadUrl ? { transientDownloadUrl } : {}),
    responseDigest: sha256CanonicalJson(normalized),
  }
}

export function parseHailuoSubmitResponse(value: unknown): ParsedHailuoSubmitResponse {
  const record = assertSuccessfulMiniMaxEnvelope(value)
  const transientTaskId = assertOpaqueProviderIdentifier(record.task_id, 'Hailuo task ID')
  const normalized = {
    taskIdDigest: digestOpaqueProviderIdentifier(transientTaskId),
    status: 'submitted' as const,
  }
  return { transientTaskId, ...normalized, responseDigest: sha256CanonicalJson(normalized) }
}

export function parseHailuoQueryResponse(value: unknown): ParsedHailuoQueryResponse {
  const record = assertSuccessfulMiniMaxEnvelope(value)
  const transientTaskId = assertOpaqueProviderIdentifier(record.task_id, 'Hailuo task ID')
  const status = assertHailuoStatus(record.status)
  const normalized: Omit<ParsedHailuoQueryResponse, 'transientTaskId' | 'transientFileId' | 'responseDigest'> = {
    taskIdDigest: digestOpaqueProviderIdentifier(transientTaskId),
    status,
  }
  let transientFileId: string | undefined
  if (status === 'Success') {
    transientFileId = assertOpaqueProviderIdentifier(record.file_id, 'Hailuo file ID')
    normalized.fileIdDigest = digestOpaqueProviderIdentifier(transientFileId)
    normalized.width = assertPositiveSafeInteger(record.video_width, 'Hailuo video width')
    normalized.height = assertPositiveSafeInteger(record.video_height, 'Hailuo video height')
  } else if (status === 'Fail') {
    normalized.failureMessage = typeof record.error_message === 'string'
      ? assertBoundedString(record.error_message, 1, 1_000, 'Hailuo failure message')
      : 'Provider reported failure without a detailed message.'
  } else if (Object.hasOwn(record, 'file_id')) {
    throw invalid('Incomplete Hailuo states cannot contain a file ID.')
  }
  return {
    transientTaskId,
    ...normalized,
    ...(transientFileId ? { transientFileId } : {}),
    responseDigest: sha256CanonicalJson(normalized),
  }
}

export function parseHailuoFileResponse(value: unknown): ParsedHailuoFileResponse {
  const record = assertSuccessfulMiniMaxEnvelope(value)
  const file = assertRecord(record.file, 'Hailuo file response')
  // MiniMax currently returns the successful query `file_id` as a string but
  // may return the same int64 identifier as a JSON number from file retrieval.
  // Normalize only a positive safe integer to its canonical decimal string so
  // the digest must still match the exact query result before download.
  const transientFileId = assertMiniMaxFileIdentifier(file.file_id, 'Hailuo file ID')
  const transientDownloadUrl = assertTemporaryDownloadUrl(file.download_url, 'Hailuo download URL')
  const normalized = {
    fileIdDigest: digestOpaqueProviderIdentifier(transientFileId),
    // MiniMax's current video-download reference permits `bytes: 0` while the
    // signed URL still resolves to the generated MP4. Treat this field as a
    // non-authoritative non-negative declaration; bounded download length,
    // MP4 signature, checksum, FFprobe, and QA remain authoritative.
    declaredBytes: assertNonNegativeSafeInteger(file.bytes, 'Hailuo file bytes'),
    filename: assertBoundedString(file.filename, 1, 255, 'Hailuo filename'),
  }
  if (!normalized.filename.toLowerCase().endsWith('.mp4')) throw invalid('Hailuo output filename must be MP4.')
  return {
    transientFileId,
    transientDownloadUrl,
    ...normalized,
    responseDigest: sha256CanonicalJson(normalized),
  }
}

export function digestOpaqueProviderIdentifier(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function assertExecutionAuthority(
  authority: MotionStudioMs010BExecutionAuthorityV1,
  provider: MotionStudioLiveCredentialBinding['provider'],
  credentialReferenceId: string,
  executionTime: string,
): MotionStudioLiveCredentialBinding {
  const validation = validateMotionStudioMs010BExecutionAuthority(authority)
  if (!validation.ok) {
    throw blocked(`Live provider execution authority is invalid: ${validation.errors.join(' ')}`)
  }
  const now = Date.parse(executionTime)
  if (!Number.isFinite(now) || now < Date.parse(authority.createdAt) || now >= Date.parse(authority.expiresAt)) {
    throw blocked('Live provider execution authority is not current.')
  }
  const binding = authority.credentialBindings.find((candidate) => candidate.provider === provider)
  if (!binding || binding.credentialReferenceId !== credentialReferenceId) {
    throw blocked(`The ${provider} credential reference does not match the immutable execution authority.`)
  }
  return binding
}

function compileRequest<TBody>(input: {
  providerAdapterId: MotionStudioCompiledProviderRequest<TBody>['providerAdapterId']
  credentialReferenceId: string
  method: 'GET' | 'POST'
  endpoint: string
  query?: Readonly<Record<string, string>>
  fixedHeaders: Readonly<Record<string, string>>
  body: TBody
  digestBody: unknown
  containsPrivateMediaBytes: boolean
}): MotionStudioCompiledProviderRequest<TBody> {
  assertStableReference(input.credentialReferenceId, 'credentialReferenceId')
  assertProviderEndpoint(input.endpoint)
  const request: MotionStudioCompiledProviderRequest<TBody> = {
    providerAdapterId: input.providerAdapterId,
    credentialReferenceId: input.credentialReferenceId,
    method: input.method,
    endpoint: input.endpoint,
    ...(input.query ? { query: input.query } : {}),
    fixedHeaders: input.fixedHeaders,
    body: input.body,
    requestDigest: sha256CanonicalJson({
      providerAdapterId: input.providerAdapterId,
      method: input.method,
      endpoint: input.endpoint,
      query: input.query ?? null,
      fixedHeaders: input.fixedHeaders,
      body: input.digestBody,
    }),
    containsPrivateMediaBytes: input.containsPrivateMediaBytes,
    safeToLogBody: false,
    maximumProviderCallCount: 1,
  }
  compiledRequestIntegrityDigests.set(request, compiledRequestIntegrityDigest(request))
  return request
}

function compiledRequestIntegrityDigest<TBody>(request: MotionStudioCompiledProviderRequest<TBody>): string {
  return sha256CanonicalJson({
    providerAdapterId: request.providerAdapterId,
    credentialReferenceId: request.credentialReferenceId,
    method: request.method,
    endpoint: request.endpoint,
    query: request.query ?? null,
    fixedHeaders: request.fixedHeaders,
    body: normalizeTransportIntegrityValue(request.body),
    requestDigest: request.requestDigest,
    containsPrivateMediaBytes: request.containsPrivateMediaBytes,
    safeToLogBody: request.safeToLogBody,
    maximumProviderCallCount: request.maximumProviderCallCount,
  })
}

function normalizeTransportIntegrityValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return {
      kind: 'buffer',
      byteLength: value.byteLength,
      sha256: sha256Bytes(value),
    }
  }
  if (Array.isArray(value)) return value.map((item) => normalizeTransportIntegrityValue(item))
  if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
    const encoded = value.slice('data:image/png;base64,'.length)
    if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw invalid('Compiled PNG data URL is malformed.')
    }
    const bytes = Buffer.from(encoded, 'base64')
    return {
      kind: 'png_data_url',
      byteLength: bytes.byteLength,
      sha256: sha256Bytes(bytes),
    }
  }
  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw invalid('Compiled provider request contains an unsupported transport value.')
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeTransportIntegrityValue(item)]),
    )
  }
  return value
}

function wanEndpoint(
  region: 'singapore' | 'beijing',
  workspaceId: string,
  operation: 'submit' | 'query',
  taskId?: string,
): string {
  if (!/^[A-Za-z0-9-]{4,128}$/.test(workspaceId)) throw invalid('Wan workspace ID is malformed.')
  const origin = region === 'singapore'
    ? `https://${workspaceId}.ap-southeast-1.maas.aliyuncs.com`
    : 'https://dashscope.aliyuncs.com'
  if (operation === 'submit') return `${origin}/api/v1/services/aigc/video-generation/video-synthesis`
  if (!taskId) throw invalid('Wan query requires a task ID.')
  return `${origin}/api/v1/tasks/${encodeURIComponent(taskId)}`
}

function assertProviderEndpoint(value: string): void {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw invalid('Provider endpoint is not a valid URL.')
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) {
    throw invalid('Provider endpoint must be unsigned HTTPS without embedded credentials.')
  }
  if (parsed.search) throw invalid('Provider endpoint cannot contain a query string; query values must remain separately bounded.')
  const allowedHost = parsed.hostname === 'api.openai.com' ||
    parsed.hostname === 'api.minimax.io' ||
    parsed.hostname === 'dashscope.aliyuncs.com' ||
    /^[A-Za-z0-9-]+\.ap-southeast-1\.maas\.aliyuncs\.com$/.test(parsed.hostname)
  if (!allowedHost) throw invalid('Provider endpoint host is not allowlisted.')
  const allowedPath = parsed.hostname === 'api.openai.com'
    ? parsed.pathname === '/v1/images/generations' || parsed.pathname === '/v1/images/edits'
    : parsed.hostname === 'api.minimax.io'
      ? ['/v1/video_generation', '/v1/query/video_generation', '/v1/files/retrieve'].includes(parsed.pathname)
      : parsed.pathname === '/api/v1/services/aigc/video-generation/video-synthesis' ||
        /^\/api\/v1\/tasks\/[A-Za-z0-9._~!$&'()*+,;=:@%-]+$/.test(parsed.pathname)
  if (!allowedPath) throw invalid('Provider endpoint path is not allowlisted.')
}

function assertLiveImage(value: MotionStudioLiveImageInput): void {
  if (value.mimeType !== 'image/png' || value.width !== 1280 || value.height !== 720) {
    throw invalid('MS-010B requires the exact opaque 1280x720 PNG keyframe.')
  }
  if (!Buffer.isBuffer(value.bytes) || value.bytes.length > MAX_IMAGE_BYTES) {
    throw invalid('MS-010B keyframe exceeds the bounded image input size.')
  }
  assertPngBytes(value.bytes, 'MS-010B keyframe')
  assertPngDimensions(value.bytes, value.width, value.height, 'MS-010B keyframe')
  if (!/^[a-f0-9]{64}$/.test(value.sha256) || sha256Bytes(value.bytes) !== value.sha256) {
    throw invalid('MS-010B keyframe checksum does not match its immutable asset version.')
  }
}

function pngDataUrl(value: MotionStudioLiveImageInput): string {
  return `data:image/png;base64,${value.bytes.toString('base64')}`
}

function assertPngBytes(bytes: Buffer, label: string): void {
  if (bytes.length < 8 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw invalid(`${label} is not a PNG.`)
  }
}

function assertPngDimensions(bytes: Buffer, width: number, height: number, label: string): void {
  if (bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw invalid(`${label} lacks a valid PNG IHDR header.`)
  }
  if (bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    throw invalid(`${label} dimensions do not match the exact 1280x720 authority.`)
  }
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function assertPrompt(value: unknown, maximum: number, label: string): string {
  const prompt = assertBoundedString(value, 1, maximum, label).trim()
  if (Array.from(prompt).some((character) => {
    const code = character.charCodeAt(0)
    return (code >= 0 && code <= 8) || code === 11 || code === 12 ||
      (code >= 14 && code <= 31) || code === 127
  })) throw invalid(`${label} contains control characters.`)
  if (/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(prompt)) throw invalid(`${label} cannot contain URLs, data URLs or paths.`)
  return prompt
}

function assertStableReference(value: unknown, label: string): string {
  const result = assertBoundedString(value, 1, 240, label)
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result) || result.includes('..')) throw invalid(`${label} is not a stable reference.`)
  return result
}

function assertOpaqueProviderIdentifier(value: unknown, label: string): string {
  const result = assertBoundedString(value, 1, MAX_PROVIDER_IDENTIFIER_LENGTH, label)
  if (!/^[A-Za-z0-9._:-]+$/.test(result)) throw invalid(`${label} contains unsupported characters.`)
  return result
}

function assertMiniMaxFileIdentifier(value: unknown, label: string): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw invalid(`${label} must be a positive safe integer or opaque string.`)
    }
    return String(value)
  }
  return assertOpaqueProviderIdentifier(value, label)
}

function assertTemporaryDownloadUrl(value: unknown, label: string): string {
  const url = assertBoundedString(value, 8, 8_192, label)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw invalid(`${label} is malformed.`)
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) {
    throw invalid(`${label} must be an HTTPS provider result URL.`)
  }
  return url
}

function assertSuccessfulWanEnvelope(value: unknown): Record<string, unknown> {
  const record = assertRecord(value, 'Wan response')
  if (typeof record.code === 'string' || typeof record.message === 'string') {
    throw invalid('Wan returned an error envelope rather than an asynchronous task result.')
  }
  return record
}

function assertSuccessfulMiniMaxEnvelope(value: unknown): Record<string, unknown> {
  const record = assertRecord(value, 'MiniMax response')
  const base = assertRecord(record.base_resp, 'MiniMax base response')
  if (base.status_code !== 0 || base.status_msg !== 'success') {
    throw invalid('MiniMax returned a non-success base response.')
  }
  return record
}

function assertWanStatus(value: unknown): WanTaskStatus {
  if (value === 'PENDING' || value === 'RUNNING' || value === 'SUCCEEDED' || value === 'FAILED' || value === 'CANCELED' || value === 'UNKNOWN') return value
  throw invalid('Wan returned an unrecognized task status.')
}

function assertHailuoStatus(value: unknown): HailuoTaskStatus {
  if (value === 'Preparing' || value === 'Queueing' || value === 'Processing' || value === 'Success' || value === 'Fail') return value
  throw invalid('Hailuo returned an unrecognized task status.')
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value === undefined ? undefined : assertRecord(value, 'token details')
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw invalid(`${label} must be a plain object.`)
  }
  return value as Record<string, unknown>
}

function assertBoundedString(value: unknown, minimum: number, maximum: number, label: string): string {
  if (typeof value !== 'string' || value.length < minimum || value.length > maximum) throw invalid(`${label} is invalid or outside its bounded length.`)
  return value
}

function assertNonNegativeSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw invalid(`${label} must be a non-negative safe integer.`)
  return value
}

function assertPositiveSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw invalid(`${label} must be a positive safe integer.`)
  return value
}

function assertExactInteger<Value extends number>(value: unknown, expected: Value, label: string): Value {
  if (value !== expected) throw invalid(`${label} must equal ${expected}.`)
  return expected
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
