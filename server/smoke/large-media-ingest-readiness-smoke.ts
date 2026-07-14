import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Storage } from '@google-cloud/storage'

import { loadRuntimeEnv } from '../config/env'
import { createProjectService } from '../services/project-service'
import { createUploadService } from '../services/upload-service'
import { buildProxyVideoArgs } from '../workers/media/ffmpeg-media-adapter'
import { deriveMediaTaskTimeoutMs } from '../workers/media/media-task-policy'
import { GcsStorageAdapter } from '../storage/gcs-storage-adapter'
import {
  LOCAL_RAW_UPLOAD_MAX_BYTES,
  assertAllowedUpload,
  assertLocalRawUploadByteLength,
} from '../storage/storage-validation'
import { validateUploadFile, validateUploadFileSize } from '../../src/backend/storage/upload-validation-service'
import { uploadFileToTemporaryObjectTarget } from '../../src/lib/temporary-object-upload-client'
import {
  GCS_MAX_OBJECT_SIZE_BYTES,
  GCS_RESUMABLE_SESSION_TTL_SECONDS,
  REEDITPRO_ANALYSIS_PROXY_POLICY,
  REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
  REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES,
  REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
  REEDITPRO_SOURCE_AUDIO_MAX_BYTES,
} from '../../src/types/large-media'

const evidence = {
  high_source_ceiling_is_below_provider_hard_limit: false,
  source_and_reference_limits_match_browser_and_backend: false,
  professional_container_and_audio_limits_are_consistent: false,
  high_media_limits_are_source_and_reference_scoped: false,
  user_source_upload_requires_exact_declared_size: false,
  large_gcs_target_is_create_only_resumable: false,
  upload_service_preserves_large_size_and_session_lifetime: false,
  resumable_browser_upload_recovers_exact_committed_offset: false,
  resumable_offset_query_is_itself_retryable: false,
  resumable_no_progress_ack_retries_without_restarting: false,
  provider_session_uri_receives_no_backend_authorization: false,
  browser_upload_does_not_require_whole_file_checksum: false,
  professional_proxy_is_bounded_1080p_and_preserves_original_for_final: false,
  media_task_timeouts_scale_for_large_duration_and_size: false,
  local_raw_route_remains_small_and_non_production: false,
}

assert.ok(REEDITPRO_SOURCE_MEDIA_MAX_BYTES < GCS_MAX_OBJECT_SIZE_BYTES)
assert.equal(REEDITPRO_SOURCE_MEDIA_MAX_BYTES, 1024 ** 4)
evidence.high_source_ceiling_is_below_provider_hard_limit = true

assert.doesNotThrow(() => assertAllowedUpload({
  purpose: 'source_media',
  mimeType: 'video/mp4',
  expectedSizeBytes: REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
}))
assert.throws(() => assertAllowedUpload({
  purpose: 'source_media',
  mimeType: 'video/mp4',
  expectedSizeBytes: REEDITPRO_SOURCE_MEDIA_MAX_BYTES + 1,
}), /exceeds max size/)
assert.doesNotThrow(() => assertAllowedUpload({
  purpose: 'reference_media',
  mimeType: 'video/quicktime',
  expectedSizeBytes: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
}))
assert.throws(() => assertAllowedUpload({
  purpose: 'reference_media',
  mimeType: 'video/quicktime',
  expectedSizeBytes: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES + 1,
}), /exceeds max size/)
assert.equal(validateUploadFileSize('source_media', REEDITPRO_SOURCE_MEDIA_MAX_BYTES).ok, true)
assert.equal(validateUploadFileSize('source_media', REEDITPRO_SOURCE_MEDIA_MAX_BYTES + 1).status, 'too_large')
assert.equal(validateUploadFileSize('reference_media', REEDITPRO_REFERENCE_MEDIA_MAX_BYTES).ok, true)
assert.equal(validateUploadFileSize('reference_media', REEDITPRO_REFERENCE_MEDIA_MAX_BYTES + 1).status, 'too_large')
evidence.source_and_reference_limits_match_browser_and_backend = true

assert.doesNotThrow(() => assertAllowedUpload({
  purpose: 'source_media',
  mimeType: 'application/mxf',
  expectedSizeBytes: 400 * 1024 ** 3,
}))
assert.equal(validateUploadFile({
  name: 'camera-master.mxf',
  size: 400 * 1024 ** 3,
}, 'source_media', {
  workspaceId: 'workspace',
  projectId: 'project',
  userId: 'user',
}).ok, true)
assert.equal(validateUploadFile({
  name: 'production-audio.wav',
  type: 'audio/wav',
  size: REEDITPRO_SOURCE_AUDIO_MAX_BYTES + 1,
}, 'source_media', {
  workspaceId: 'workspace',
  projectId: 'project',
  userId: 'user',
}).status, 'too_large')
evidence.professional_container_and_audio_limits_are_consistent = true
assert.throws(() => assertAllowedUpload({
  purpose: 'generated_asset',
  mimeType: 'video/mp4',
  expectedSizeBytes: 3 * 1024 ** 3,
}), /exceeds max size/)
assert.throws(() => assertAllowedUpload({
  purpose: 'generated_asset',
  mimeType: 'application\/mxf',
  expectedSizeBytes: 1024,
}), /is not allowed/)
assert.equal(validateUploadFile({
  name: 'generated-master.mxf',
  size: 1024,
}, 'generated_asset', {
  workspaceId: 'workspace',
  projectId: 'project',
  userId: 'user',
}).status, 'unsupported_type')
evidence.high_media_limits_are_source_and_reference_scoped = true
assert.throws(() => assertAllowedUpload({
  purpose: 'source_media',
  mimeType: 'video/mp4',
}), /exact positive expected byte size/)
assert.throws(() => assertAllowedUpload({
  purpose: 'reference_media',
  mimeType: 'video/mp4',
  expectedSizeBytes: 0,
}), /exact positive expected byte size/)
evidence.user_source_upload_requires_exact_declared_size = true

type ResumableOptions = {
  metadata?: { contentType?: string }
  preconditionOpts?: { ifGenerationMatch?: number | string }
}

class ResumableTargetStorageDouble {
  readonly calls: Array<{ bucketName: string; objectPath: string; options: ResumableOptions }> = []

  bucket(bucketName: string) {
    return {
      file: (objectPath: string) => ({
        createResumableUpload: async (options: ResumableOptions): Promise<[string]> => {
          this.calls.push({ bucketName, objectPath, options })
          return [`https://storage.example.invalid/resumable-session-${this.calls.length}`]
        },
      }),
    }
  }
}

const storageDouble = new ResumableTargetStorageDouble()
const gcsAdapter = new GcsStorageAdapter(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro-large-media-smoke',
}), storageDouble as unknown as Storage)

const resumableTarget = await gcsAdapter.createUploadTarget({
  uploadIntentId: 'large-upload-intent',
  bucketName: 'private-source-media',
  objectPath: 'workspaces/workspace/projects/project/source-media/large-upload/source.mov',
  mimeType: 'video/quicktime',
  expectedSizeBytes: 100 * 1024 ** 3,
  expiresAt: '2026-07-20T00:00:00.000Z',
})
assert.equal(resumableTarget.uploadProtocol, 'gcs_resumable')
assert.equal(resumableTarget.supportsResume, true)
assert.equal(resumableTarget.createOnly, true)
assert.equal(resumableTarget.sessionUriIsCredential, true)
assert.equal(storageDouble.calls[0]?.options.preconditionOpts?.ifGenerationMatch, 0)
assert.equal(storageDouble.calls[0]?.options.metadata?.contentType, 'video/quicktime')
assert.equal(resumableTarget.uploadHeaders.authorization, undefined)
evidence.large_gcs_target_is_create_only_resumable = true

const serviceLocalRoot = await mkdtemp(join(tmpdir(), 'reeditpro-large-upload-service-'))
try {
  const serviceEnv = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'gcs',
    GOOGLE_CLOUD_PROJECT_ID: 'reeditpro-large-media-smoke',
    LOCAL_STORAGE_ROOT: serviceLocalRoot,
  })
  const serviceContext = {
    env: serviceEnv,
    clients: { admin: null, public: null },
    requestId: 'large-media-service-smoke',
    auth: { userId: 'large-media-user', isMockUser: true },
    storageAdapter: gcsAdapter,
  }
  const project = await createProjectService(serviceContext).createProject({
    workspaceId: 'large-media-workspace',
    name: 'Large media service contract',
  })
  const expectedSizeBytes = 100 * 1024 ** 3
  const startedAtMs = Date.now()
  const created = await createUploadService(serviceContext).createUploadIntent({
    workspaceId: 'large-media-workspace',
    projectId: project.project.id,
    uploadPurpose: 'source_media',
    originalFileName: 'long-form-master.mov',
    mimeType: 'video/mov',
    expectedSizeBytes,
  })
  const completedAtMs = Date.now()
  const expiresAtMs = Date.parse(created.uploadIntent.expiresAt)
  assert.equal(created.uploadIntent.expectedSizeBytes, expectedSizeBytes)
  assert.equal(created.uploadIntent.mimeType, 'video/quicktime')
  assert.equal(created.uploadTarget.uploadProtocol, 'gcs_resumable')
  assert.equal(created.uploadTarget.supportsResume, true)
  assert.ok(expiresAtMs >= startedAtMs + GCS_RESUMABLE_SESSION_TTL_SECONDS * 1_000)
  assert.ok(expiresAtMs <= completedAtMs + GCS_RESUMABLE_SESSION_TTL_SECONDS * 1_000)
  evidence.upload_service_preserves_large_size_and_session_lifetime = true
} finally {
  await rm(serviceLocalRoot, { recursive: true, force: true })
}

const chunkSize = REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES
const totalBytes = chunkSize * 2 + 37
const sourceBlob = new Blob([new Uint8Array(totalBytes)], { type: 'video/mp4' })
let wholeFileArrayBufferReadAttempted = false
Object.defineProperty(sourceBlob, 'arrayBuffer', {
  value: async () => {
    wholeFileArrayBufferReadAttempted = true
    throw new Error('Whole-file browser buffering is forbidden for the resumable path.')
  },
})
const requests: Array<{ contentRange: string; authorization?: string; bodyBytes: number }> = []
let chunkRequestNumber = 0
let offsetQueryRequestNumber = 0
const fetchDouble = (async (_request: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers)
  const contentRange = headers.get('content-range') ?? ''
  const bodyBytes = init?.body instanceof Blob ? init.body.size : 0
  requests.push({
    contentRange,
    authorization: headers.get('authorization') ?? undefined,
    bodyBytes,
  })

  if (contentRange.startsWith('bytes */')) {
    offsetQueryRequestNumber += 1
    if (offsetQueryRequestNumber === 1) {
      throw new TypeError('simulated interrupted committed-offset query')
    }
    return new Response(null, {
      status: 308,
      headers: { range: `bytes=0-${chunkSize * 2 - 1}` },
    })
  }

  chunkRequestNumber += 1
  if (chunkRequestNumber === 1) {
    return new Response(null, {
      status: 308,
      headers: { range: `bytes=0-${chunkSize - 1}` },
    })
  }
  if (chunkRequestNumber === 2) {
    throw new TypeError('simulated lost response after provider commit')
  }
  return new Response(null, { status: 200 })
}) as typeof fetch

const progressStates: string[] = []
const uploadResult = await uploadFileToTemporaryObjectTarget({
  apiBaseUrl: 'https://api.reeditpro.invalid',
  authorization: 'Bearer backend-user-token-must-not-leak',
  fetchImpl: fetchDouble,
  file: sourceBlob,
  mimeType: 'video/mp4',
  retryDelayMs: 0,
  target: {
    uploadMethod: 'PUT',
    uploadUrl: 'https://storage.example.invalid/private-resumable-session',
    uploadHeaders: {
      'content-type': 'video/mp4',
      Authorization: 'Bearer provider-header-must-not-leak',
    },
    uploadProtocol: 'gcs_resumable',
    supportsResume: true,
    recommendedChunkSizeBytes: chunkSize,
  },
  onProgress: (progress) => progressStates.push(progress.state),
})
assert.deepEqual(uploadResult, {
  protocol: 'gcs_resumable',
  uploadedBytes: totalBytes,
  requestCount: 5,
  resumedAfterInterruption: true,
})
assert.deepEqual(requests.map((request) => request.contentRange), [
  `bytes 0-${chunkSize - 1}/${totalBytes}`,
  `bytes ${chunkSize}-${chunkSize * 2 - 1}/${totalBytes}`,
  `bytes */${totalBytes}`,
  `bytes */${totalBytes}`,
  `bytes ${chunkSize * 2}-${totalBytes - 1}/${totalBytes}`,
])
assert.deepEqual(requests.map((request) => request.bodyBytes), [chunkSize, chunkSize, 0, 0, 37])
assert.ok(progressStates.includes('recovering'))
assert.equal(progressStates.at(-1), 'completed')
evidence.resumable_browser_upload_recovers_exact_committed_offset = true
assert.equal(offsetQueryRequestNumber, 2)
evidence.resumable_offset_query_is_itself_retryable = true
assert.equal(requests.some((request) => request.authorization), false)
evidence.provider_session_uri_receives_no_backend_authorization = true
assert.equal(wholeFileArrayBufferReadAttempted, false)
evidence.browser_upload_does_not_require_whole_file_checksum = true

let noProgressChunkRequests = 0
const noProgressRanges: string[] = []
const noProgressResult = await uploadFileToTemporaryObjectTarget({
  apiBaseUrl: 'https://api.reeditpro.invalid',
  fetchImpl: (async (_request: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const contentRange = new Headers(init?.headers).get('content-range') ?? ''
    noProgressRanges.push(contentRange)
    if (contentRange.startsWith('bytes */')) {
      return new Response(null, { status: 308 })
    }
    noProgressChunkRequests += 1
    if (noProgressChunkRequests === 1) {
      return new Response(null, { status: 308 })
    }
    if (noProgressChunkRequests === 2) {
      return new Response(null, {
        status: 308,
        headers: { range: `bytes=0-${chunkSize - 1}` },
      })
    }
    return new Response(null, { status: 200 })
  }) as typeof fetch,
  file: new Blob([new Uint8Array(chunkSize + 13)], { type: 'video/mp4' }),
  mimeType: 'video/mp4',
  retryDelayMs: 0,
  target: {
    uploadMethod: 'PUT',
    uploadUrl: 'https://storage.example.invalid/no-progress-session',
    uploadProtocol: 'gcs_resumable',
    supportsResume: true,
    recommendedChunkSizeBytes: chunkSize,
  },
})
assert.equal(noProgressResult.uploadedBytes, chunkSize + 13)
assert.equal(noProgressResult.resumedAfterInterruption, true)
assert.deepEqual(noProgressRanges, [
  `bytes 0-${chunkSize - 1}/${chunkSize + 13}`,
  `bytes */${chunkSize + 13}`,
  `bytes 0-${chunkSize - 1}/${chunkSize + 13}`,
  `bytes ${chunkSize}-${chunkSize + 12}/${chunkSize + 13}`,
])
evidence.resumable_no_progress_ack_retries_without_restarting = true

const proxyArgs = buildProxyVideoArgs({
  sourceLocalPath: '/private/source/master.mov',
  outputLocalPath: '/private/proxy/proxy.mp4',
  safeOutputRoot: '/private/proxy',
  ffmpegBin: 'ffmpeg',
  timeoutMs: 60_000,
  targetMaxWidth: REEDITPRO_ANALYSIS_PROXY_POLICY.maxWidth,
  targetMaxHeight: REEDITPRO_ANALYSIS_PROXY_POLICY.maxHeight,
  videoPreset: REEDITPRO_ANALYSIS_PROXY_POLICY.videoPreset,
  videoCrf: REEDITPRO_ANALYSIS_PROXY_POLICY.videoCrf,
  audioBitrate: REEDITPRO_ANALYSIS_PROXY_POLICY.audioBitrate,
  keepAudio: true,
}, '/private/proxy/proxy.mp4')
assert.match(proxyArgs[proxyArgs.indexOf('-vf') + 1] ?? '', /1920.*1080/)
assert.equal(proxyArgs[proxyArgs.indexOf('-preset') + 1], 'fast')
assert.equal(proxyArgs[proxyArgs.indexOf('-crf') + 1], '20')
assert.equal(proxyArgs[proxyArgs.indexOf('-b:a') + 1], '192k')
assert.equal(proxyArgs[proxyArgs.indexOf('-loglevel') + 1], 'error')
assert.equal(proxyArgs[proxyArgs.indexOf('-fps_mode:v') + 1], 'passthrough')
assert.equal(proxyArgs[proxyArgs.indexOf('-map_metadata') + 1], '-1')
assert.equal(REEDITPRO_ANALYSIS_PROXY_POLICY.finalRenderUsesOriginal, true)
evidence.professional_proxy_is_bounded_1080p_and_preserves_original_for_final = true

const largeProxyTimeout = deriveMediaTaskTimeoutMs({
  task: 'create_proxy',
  probe: {
    durationSeconds: 4 * 60 * 60,
    sizeBytes: 500 * 1024 ** 3,
  },
})
assert.ok(largeProxyTimeout >= 16 * 60 * 60 * 1_000)
assert.ok(largeProxyTimeout <= 24 * 60 * 60 * 1_000)
assert.equal(deriveMediaTaskTimeoutMs({
  task: 'probe',
  sourceSizeBytes: REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
}), 30 * 60 * 1_000)
evidence.media_task_timeouts_scale_for_large_duration_and_size = true

assert.doesNotThrow(() => assertLocalRawUploadByteLength(LOCAL_RAW_UPLOAD_MAX_BYTES))
assert.throws(() => assertLocalRawUploadByteLength(LOCAL_RAW_UPLOAD_MAX_BYTES + 1), /development-route limit/)
evidence.local_raw_route_remains_small_and_non_production = true

assert.deepEqual(Object.values(evidence), Object.values(evidence).map(() => true))
console.log(JSON.stringify({
  ok: true,
  status: 'source_hardened_local_and_fake_provider_verified_live_cloud_blocked',
  evidence,
  policy: {
    sourceMaxBytes: REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
    referenceMaxBytes: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
    providerHardMaxBytes: GCS_MAX_OBJECT_SIZE_BYTES,
    resumableChunkBytes: resumableTarget.recommendedChunkSizeBytes,
    proxyProfileId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
  },
  liveGcsContacted: false,
  providerActivated: false,
  productionReady: false,
}, null, 2))
