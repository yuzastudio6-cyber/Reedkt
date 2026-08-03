import { createHash } from 'node:crypto'
import { z } from 'zod'

import { hashSkillValue } from '../../../edit-skills/core/skill-capability-manifest-hash'
import {
  BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  type BrollProviderRequestPackageV5,
  brollProviderRequestPackageV5Schema,
} from './b-roll-provider-authority-v5'

export const BROLL_GEMINI_INTERACTIONS_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/interactions' as const
export const BROLL_GEMINI_FILES_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/files' as const
export const BROLL_GEMINI_UPLOAD_ENDPOINT =
  'https://generativelanguage.googleapis.com/upload/v1beta/files' as const
export const BROLL_GEMINI_OFFICIAL_CONTRACT_VERSION =
  'b_roll_gemini_omni_official_contract_v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const artifactRefSchema = z.object({
  artifactType: z.string().trim().min(1).max(180),
  sha256,
  byteLength: z.number().int().positive().max(67_108_864),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
}).strict()

export interface BrollGeminiEphemeralSourceMedia {
  artifactRef: z.input<typeof artifactRefSchema>
  mimeType: 'image/jpeg' | 'image/png' | 'video/mp4'
  bytes: Buffer | Uint8Array
}

export interface BrollGeminiOfficialRequest {
  schemaVersion: typeof BROLL_GEMINI_OFFICIAL_CONTRACT_VERSION
  endpoint: typeof BROLL_GEMINI_INTERACTIONS_ENDPOINT
  method: 'POST'
  fixedHeaders: { 'content-type': 'application/json' }
  body: Record<string, unknown>
  bodyByteLength: number
  bodySha256: string
  sourceMediaSha256: string | null
  safeToPersistRawBody: false
  callerSuppliedEndpoint: false
  callerSuppliedModel: false
  callerSuppliedCredential: false
  automaticRetryAllowed: false
  redirectsAllowed: false
}

export function buildBrollGeminiOfficialInteractionRequest(input: {
  requestPackage: BrollProviderRequestPackageV5
  sourceMedia?: BrollGeminiEphemeralSourceMedia
  uploadedVideoFileUri?: string
  delivery?: 'inline' | 'uri'
}): BrollGeminiOfficialRequest {
  const request = brollProviderRequestPackageV5Schema.parse(input.requestPackage)
  const source = validateSourceMedia(request, input.sourceMedia)
  const task = request.taskMode === 'edit_uploaded_video'
    ? 'edit'
    : request.taskMode
  let officialInput: unknown = request.prompt
  if (request.taskMode === 'image_to_video') {
    if (!source || !source.mimeType.startsWith('image/')) {
      throw new Error('Gemini image-to-video requires one exact approved image source.')
    }
    officialInput = [
      {
        type: 'image',
        data: source.bytes.toString('base64'),
        mime_type: source.mimeType,
      },
      {
        type: 'text',
        text: `<IMAGE_REF_0>\n${request.prompt}\nUse the given image only as an approved reference for the video generation.`,
      },
    ]
  }
  if (request.taskMode === 'edit_uploaded_video') {
    if (!source || source.mimeType !== 'video/mp4') {
      throw new Error('Gemini uploaded-video editing requires one exact approved MP4 source.')
    }
    const uri = validateUploadedFileUri(input.uploadedVideoFileUri)
    officialInput = [
      { type: 'document', uri, mime_type: 'video/mp4' },
      { type: 'text', text: `${request.prompt}\nKeep everything else the same.` },
    ]
  } else if (input.uploadedVideoFileUri !== undefined) {
    throw new Error('Gemini uploaded file URI is only valid for approved video editing.')
  }
  const body: Record<string, unknown> = {
    model: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
    input: officialInput,
    response_format: {
      type: 'video',
      aspect_ratio: request.output.aspectRatio,
      ...(input.delivery === 'uri' ? { delivery: 'uri' } : {}),
    },
    generation_config: { video_config: { task } },
    background: false,
    stream: false,
    store: true,
  }
  const bodyBytes = Buffer.from(JSON.stringify(body), 'utf8')
  if (bodyBytes.byteLength < 1 || bodyBytes.byteLength > 32 * 1024 * 1024) {
    throw new Error('Gemini B-roll official request body exceeds its server-owned ceiling.')
  }
  return {
    schemaVersion: BROLL_GEMINI_OFFICIAL_CONTRACT_VERSION,
    endpoint: BROLL_GEMINI_INTERACTIONS_ENDPOINT,
    method: 'POST',
    fixedHeaders: { 'content-type': 'application/json' },
    body,
    bodyByteLength: bodyBytes.byteLength,
    bodySha256: sha256Bytes(bodyBytes),
    sourceMediaSha256: source?.artifactRef.sha256 ?? null,
    safeToPersistRawBody: false,
    callerSuppliedEndpoint: false,
    callerSuppliedModel: false,
    callerSuppliedCredential: false,
    automaticRetryAllowed: false,
    redirectsAllowed: false,
  }
}

export type BrollGeminiParsedInteraction =
  | {
      state: 'completed_inline'
      interactionId: string
      interactionIdDigest: string
      acceptedRuntimeModel: string
      responseDigest: string
      usageDigest: string | null
      bytes: Buffer
    }
  | {
      state: 'completed_uri'
      interactionId: string
      interactionIdDigest: string
      acceptedRuntimeModel: string
      responseDigest: string
      usageDigest: string | null
      fileId: string
      fileIdDigest: string
    }
  | {
      state: 'in_progress'
      interactionId: string
      interactionIdDigest: string
      acceptedRuntimeModel: string
      responseDigest: string
      usageDigest: string | null
    }
  | {
      state: 'failed'
      interactionId: string | null
      interactionIdDigest: string | null
      acceptedRuntimeModel: string | null
      responseDigest: string
      usageDigest: string | null
      sanitizedFailureCode: string
    }

export function parseBrollGeminiInteractionResponse(input: {
  httpStatus: number
  value: unknown
  maximumInlineBytes?: number
}): BrollGeminiParsedInteraction {
  const responseDigest = hashSkillValue(input.value)
  const record = asRecord(input.value)
  const usageDigest = record.usage_metadata === undefined && record.usageMetadata === undefined
    ? null
    : hashSkillValue(record.usage_metadata ?? record.usageMetadata)
  if (input.httpStatus < 200 || input.httpStatus >= 300) {
    return {
      state: 'failed',
      interactionId: null,
      interactionIdDigest: null,
      acceptedRuntimeModel: null,
      responseDigest,
      usageDigest,
      sanitizedFailureCode: classifyGeminiFailure(input.httpStatus, record),
    }
  }
  const interactionId = stableProviderId(record.id, 'Gemini interaction ID')
  const acceptedRuntimeModel = stableModel(record.model)
  const status = typeof record.status === 'string' ? record.status.toLowerCase() : ''
  if (['failed', 'cancelled', 'canceled', 'rejected'].includes(status)) {
    return {
      state: 'failed',
      interactionId,
      interactionIdDigest: sha256Text(interactionId),
      acceptedRuntimeModel,
      responseDigest,
      usageDigest,
      sanitizedFailureCode: `provider_${status === 'canceled' ? 'cancelled' : status}`,
    }
  }
  const video = findVideoOutput(record)
  if (video?.data !== undefined) {
    if (video.mime_type !== 'video/mp4' || typeof video.data !== 'string') {
      throw new Error('Gemini interaction returned an unsupported inline video output.')
    }
    const maximumInlineBytes = input.maximumInlineBytes ?? 67_108_864
    const bytes = decodeBoundedBase64(video.data, maximumInlineBytes)
    assertMp4(bytes)
    return {
      state: 'completed_inline',
      interactionId,
      interactionIdDigest: sha256Text(interactionId),
      acceptedRuntimeModel,
      responseDigest,
      usageDigest,
      bytes,
    }
  }
  if (video?.uri !== undefined) {
    if (video.mime_type !== 'video/mp4' || typeof video.uri !== 'string') {
      throw new Error('Gemini interaction returned an unsupported URI video output.')
    }
    const fileId = fileIdFromProviderUri(video.uri)
    return {
      state: 'completed_uri',
      interactionId,
      interactionIdDigest: sha256Text(interactionId),
      acceptedRuntimeModel,
      responseDigest,
      usageDigest,
      fileId,
      fileIdDigest: sha256Text(fileId),
    }
  }
  if (['in_progress', 'running', 'pending', 'queued'].includes(status)) {
    return {
      state: 'in_progress',
      interactionId,
      interactionIdDigest: sha256Text(interactionId),
      acceptedRuntimeModel,
      responseDigest,
      usageDigest,
    }
  }
  throw new Error('Gemini interaction response had no recognized terminal or pending output.')
}

export function parseBrollGeminiFileStatus(value: unknown): {
  state: 'processing' | 'active' | 'failed'
  fileId: string
  fileUri: string | null
  metadataDigest: string
} {
  const outer = asRecord(value)
  const record = outer.file === undefined ? outer : asRecord(outer.file)
  const name = typeof record.name === 'string' ? record.name : ''
  const fileId = fileIdFromName(name)
  const state = typeof record.state === 'string' ? record.state.toUpperCase() : ''
  const fileUri = typeof record.uri === 'string' ? validateUploadedFileUri(record.uri) : null
  if (state === 'ACTIVE') return { state: 'active', fileId, fileUri, metadataDigest: hashSkillValue(record) }
  if (state === 'FAILED') return { state: 'failed', fileId, fileUri, metadataDigest: hashSkillValue(record) }
  if (state === 'PROCESSING' || state === 'STATE_UNSPECIFIED') {
    return { state: 'processing', fileId, fileUri, metadataDigest: hashSkillValue(record) }
  }
  throw new Error('Gemini file status is not recognized.')
}

export function fileIdFromProviderUri(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'generativelanguage.googleapis.com') {
    throw new Error('Gemini file URI origin is not allowlisted.')
  }
  const match = /^\/v1beta\/files\/([a-z0-9][a-z0-9-]{0,39})(?::download)?$/u.exec(url.pathname)
  if (!match || [...url.searchParams.keys()].some((key) => key !== 'alt') ||
    (url.searchParams.has('alt') && url.searchParams.get('alt') !== 'media')) {
    throw new Error('Gemini file URI path is not allowlisted.')
  }
  return match[1]!
}

export function fileIdFromName(value: string): string {
  const match = /^files\/([a-z0-9][a-z0-9-]{0,39})$/u.exec(value)
  if (!match) throw new Error('Gemini file resource name is invalid.')
  return match[1]!
}

export function validateUploadedFileUri(value: string | undefined): string {
  if (!value) throw new Error('Gemini uploaded file URI is missing.')
  const fileId = fileIdFromProviderUri(value)
  return `${BROLL_GEMINI_FILES_ENDPOINT}/${fileId}`
}

function validateSourceMedia(
  request: BrollProviderRequestPackageV5,
  sourceInput: BrollGeminiEphemeralSourceMedia | undefined,
): { artifactRef: z.infer<typeof artifactRefSchema>; mimeType: BrollGeminiEphemeralSourceMedia['mimeType']; bytes: Buffer } | undefined {
  if (request.taskMode === 'text_to_video') {
    if (sourceInput) throw new Error('Gemini text-to-video does not accept caller source bytes.')
    return undefined
  }
  if (!sourceInput || request.sourceInputs.length !== 1) {
    throw new Error('Gemini B-roll source bytes are missing for the authorized request.')
  }
  const artifactRef = artifactRefSchema.parse(sourceInput.artifactRef)
  const expected = request.sourceInputs[0]!
  const bytes = Buffer.isBuffer(sourceInput.bytes)
    ? sourceInput.bytes
    : Buffer.from(sourceInput.bytes)
  if (
    artifactRef.sha256 !== expected.sha256 ||
    artifactRef.byteLength !== expected.byteLength ||
    artifactRef.ownerUserId !== expected.ownerUserId ||
    artifactRef.workspaceId !== expected.workspaceId ||
    artifactRef.projectId !== expected.projectId ||
    artifactRef.byteLength !== bytes.byteLength ||
    sha256Bytes(bytes) !== artifactRef.sha256
  ) throw new Error('Gemini B-roll source media does not match request lineage.')
  if (bytes.byteLength > 32 * 1024 * 1024) {
    throw new Error('Gemini B-roll source media exceeds the transport ceiling.')
  }
  return { artifactRef, mimeType: sourceInput.mimeType, bytes }
}

function findVideoOutput(record: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!Array.isArray(record.steps)) return undefined
  for (const rawStep of record.steps) {
    const step = asRecord(rawStep)
    if (step.type !== 'model_output' || !Array.isArray(step.content)) continue
    for (const rawContent of step.content) {
      const content = asRecord(rawContent)
      if (content.type === 'video') return content
    }
  }
  return undefined
}

function classifyGeminiFailure(httpStatus: number, record: Record<string, unknown>): string {
  const error = record.error && typeof record.error === 'object'
    ? asRecord(record.error)
    : {}
  const status = typeof error.status === 'string'
    ? error.status.toLowerCase().replace(/[^a-z0-9_]+/gu, '_').slice(0, 80)
    : ''
  if (httpStatus === 401 || httpStatus === 403) return 'credential_or_account_access_denied'
  if (httpStatus === 429) return 'provider_rate_limited'
  if (httpStatus >= 500) return 'provider_service_unavailable'
  if (status) return `provider_${status}`
  return `provider_http_${httpStatus}`
}

function stableProviderId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value
}

function stableModel(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,239}$/u.test(value)) {
    throw new Error('Gemini accepted runtime model is invalid.')
  }
  return value
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Gemini response must be a JSON object.')
  }
  return value as Record<string, unknown>
}

function decodeBoundedBase64(value: string, maximumBytes: number): Buffer {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value) || value.length > Math.ceil(maximumBytes / 3) * 4 + 4) {
    throw new Error('Gemini inline video base64 is invalid or oversized.')
  }
  const bytes = Buffer.from(value, 'base64')
  if (bytes.byteLength < 16 || bytes.byteLength > maximumBytes) {
    throw new Error('Gemini inline video is outside its byte ceiling.')
  }
  return bytes
}

function assertMp4(bytes: Buffer): void {
  if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw new Error('Gemini output is not an MP4 container.')
  }
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
