export interface BrowserTemporaryUploadTarget {
  uploadMethod: 'PUT' | 'POST'
  uploadProtocol?: 'single_put' | 'resumable_content_range_v1' | 'managed_segmented_content_range_v1'
  uploadUrl: string
  uploadHeaders?: Record<string, string>
  uploadStatusUrl?: string
  recommendedChunkSizeBytes?: number
  retryFromVerifiedOffset?: boolean
}

export interface BrowserTemporaryUploadProgress {
  acceptedBytes: number
  totalBytes: number
  progressPercent: number
  attempt: number
  resumed: boolean
  state?: 'uploading' | 'recovering_integrity' | 'waiting_for_storage'
  message?: string
}

export interface BrowserTemporaryUploadResult {
  acceptedBytes: number
  totalBytes: number
  requestCount: number
  resumed: boolean
  protocol: 'single_put' | 'resumable_content_range_v1' | 'managed_segmented_content_range_v1'
}

interface UploadEnvelope {
  ok?: boolean
  data?: {
    resumableUpload?: {
      acceptedBytes?: number
      complete?: boolean
      recovery?: {
        reason?: string
        restartByte?: number
        discardedBytes?: number
      }
    }
  }
  error?: {
    code?: string
    message?: string
    details?: {
      retryable?: boolean
      retryAfterMs?: number
      acceptedBytes?: number
    }
  }
}

const DEFAULT_CHUNK_BYTES = 8 * 1024 * 1024
const MIN_CHUNK_BYTES = 256 * 1024
const MAX_CHUNK_BYTES = 16 * 1024 * 1024
const MAX_NETWORK_RECOVERY_ATTEMPTS = 5
const MIN_STORAGE_RECOVERY_DELAY_MS = 1_000
const MAX_STORAGE_RECOVERY_DELAY_MS = 30_000

class TemporaryUploadRequestError extends Error {
  readonly code: string | undefined
  readonly retryable: boolean
  readonly retryAfterMs: number | undefined
  readonly acceptedBytes: number | undefined

  constructor(input: {
    message: string
    code?: string
    retryable?: boolean
    retryAfterMs?: number
    acceptedBytes?: number
  }) {
    super(input.message)
    this.name = 'TemporaryUploadRequestError'
    this.code = input.code
    this.retryable = input.retryable === true
    this.retryAfterMs = input.retryAfterMs
    this.acceptedBytes = input.acceptedBytes
  }
}

export async function uploadFileToTemporaryTarget(input: {
  file: Blob
  target: BrowserTemporaryUploadTarget
  baseUrl: string
  authorization?: string
  reeditProUserAuthorization?: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  onProgress?: (progress: BrowserTemporaryUploadProgress) => void
}): Promise<BrowserTemporaryUploadResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const protocol = input.target.uploadProtocol ?? 'single_put'
  if (protocol === 'single_put') {
    const response = await fetchImpl(joinUrl(input.baseUrl, input.target.uploadUrl), {
      method: input.target.uploadMethod,
      headers: headers({
        ...input.target.uploadHeaders,
        authorization: isAbsoluteUrl(input.target.uploadUrl) ? undefined : input.authorization,
        'x-reeditpro-user-authorization': isAbsoluteUrl(input.target.uploadUrl)
          ? undefined
          : input.reeditProUserAuthorization,
      }),
      body: input.file,
      signal: input.signal,
    })
    if (!response.ok) throw await uploadFailureError(response, 'Private upload failed.')
    input.onProgress?.({
      acceptedBytes: input.file.size,
      totalBytes: input.file.size,
      progressPercent: 100,
      attempt: 1,
      resumed: false,
      state: 'uploading',
    })
    return {
      acceptedBytes: input.file.size,
      totalBytes: input.file.size,
      requestCount: 1,
      resumed: false,
      protocol,
    }
  }

  const chunkSize = normalizeChunkSize(input.target.recommendedChunkSizeBytes)
  const uploadUrl = joinUrl(input.baseUrl, input.target.uploadUrl)
  const localStatusUrl = input.target.uploadStatusUrl
    ? joinUrl(input.baseUrl, input.target.uploadStatusUrl)
    : undefined
  let acceptedBytes = localStatusUrl
    ? await queryLocalOffset(
        fetchImpl,
        localStatusUrl,
        input.authorization,
        input.reeditProUserAuthorization,
        input.signal,
      )
    : 0
  if (acceptedBytes > input.file.size) throw new Error('Upload checkpoint exceeds the selected file size.')
  let requestCount = 0
  let resumed = acceptedBytes > 0
  let recoveryAttempt = 0
  let storageRecoveryAttempt = 0

  while (acceptedBytes < input.file.size) {
    const endExclusive = Math.min(input.file.size, acceptedBytes + chunkSize)
    const chunk = input.file.slice(acceptedBytes, endExclusive)
    const localChunkChecksum = localStatusUrl ? await sha256Blob(chunk) : undefined
    try {
      const response = await fetchImpl(uploadUrl, {
        method: 'PUT',
        headers: headers({
          ...input.target.uploadHeaders,
          authorization: isAbsoluteUrl(input.target.uploadUrl) ? undefined : input.authorization,
          'x-reeditpro-user-authorization': isAbsoluteUrl(input.target.uploadUrl)
            ? undefined
            : input.reeditProUserAuthorization,
          'content-range': `bytes ${acceptedBytes}-${endExclusive - 1}/${input.file.size}`,
          'x-reeditpro-chunk-sha256': localChunkChecksum,
        }),
        body: chunk,
        signal: input.signal,
      })
      requestCount += 1
      let integrityRecovery: {
        reason?: string
        restartByte?: number
        discardedBytes?: number
      } | undefined
      if (response.status === 308) {
        acceptedBytes = parseAcceptedRange(response.headers.get('range'), endExclusive)
      } else if (response.ok) {
        if (localStatusUrl) {
          const local = await parseLocalAcceptedStatus(response, endExclusive)
          acceptedBytes = local.acceptedBytes
          integrityRecovery = local.recovery
        } else {
          acceptedBytes = endExclusive
        }
      } else {
        throw await uploadFailureError(response, 'Resumable upload chunk failed.')
      }
      if (integrityRecovery) {
        resumed = true
        recoveryAttempt = 0
        storageRecoveryAttempt = 0
        input.onProgress?.({
          acceptedBytes,
          totalBytes: input.file.size,
          progressPercent: Number(((acceptedBytes / input.file.size) * 100).toFixed(2)),
          attempt: requestCount,
          resumed: true,
          state: 'recovering_integrity',
          message: 'A damaged or incomplete upload part was discarded. ReEditPro is continuing from the last verified checkpoint.',
        })
        if (acceptedBytes < endExclusive) continue
      }
      if (acceptedBytes < endExclusive) throw new Error('Upload target did not commit the complete chunk.')
      recoveryAttempt = 0
      storageRecoveryAttempt = 0
      input.onProgress?.({
        acceptedBytes,
        totalBytes: input.file.size,
        progressPercent: Number(((acceptedBytes / input.file.size) * 100).toFixed(2)),
        attempt: requestCount,
        resumed,
        state: 'uploading',
      })
    } catch (error) {
      if (input.signal?.aborted) throw error
      if (isRetryableStorageCapacityError(error)) {
        storageRecoveryAttempt += 1
        const checkpoint = localStatusUrl
          ? await queryLocalOffset(
              fetchImpl,
              localStatusUrl,
              input.authorization,
              input.reeditProUserAuthorization,
              input.signal,
            )
            .catch(() => validAcceptedBytes(error.acceptedBytes, acceptedBytes, input.file.size))
          : validAcceptedBytes(error.acceptedBytes, acceptedBytes, input.file.size)
        acceptedBytes = checkpoint
        resumed = true
        input.onProgress?.({
          acceptedBytes,
          totalBytes: input.file.size,
          progressPercent: Number(((acceptedBytes / input.file.size) * 100).toFixed(2)),
          attempt: requestCount,
          resumed: true,
          state: 'waiting_for_storage',
          message: 'Private storage is temporarily short of working space. Your verified upload progress is safe; ReEditPro will continue automatically.',
        })
        await delay(storageRecoveryDelayMs(error.retryAfterMs, storageRecoveryAttempt), input.signal)
        continue
      }
      recoveryAttempt += 1
      if (recoveryAttempt > MAX_NETWORK_RECOVERY_ATTEMPTS) throw error
      const verifiedOffset = localStatusUrl
        ? await queryLocalOffset(
            fetchImpl,
            localStatusUrl,
            input.authorization,
            input.reeditProUserAuthorization,
            input.signal,
          )
        : await queryExternalResumableOffset(fetchImpl, uploadUrl, input.target, input.file.size, input.signal)
      if (verifiedOffset < 0 || verifiedOffset > input.file.size) {
        throw new Error('Upload recovery returned an invalid byte offset.', { cause: error })
      }
      acceptedBytes = verifiedOffset
      resumed = true
      await delay(Math.min(4_000, 250 * 2 ** (recoveryAttempt - 1)), input.signal)
    }
  }

  return {
    acceptedBytes,
    totalBytes: input.file.size,
    requestCount,
    resumed,
    protocol,
  }
}

async function queryLocalOffset(
  fetchImpl: typeof fetch,
  statusUrl: string,
  authorization: string | undefined,
  reeditProUserAuthorization: string | undefined,
  signal: AbortSignal | undefined,
): Promise<number> {
  const response = await fetchImpl(statusUrl, {
    method: 'GET',
    headers: headers({
      accept: 'application/json',
      authorization,
      'x-reeditpro-user-authorization': reeditProUserAuthorization,
    }),
    signal,
  })
  if (!response.ok) throw await uploadFailureError(response, 'Upload checkpoint lookup failed.')
  const payload = await response.json().catch(() => undefined) as UploadEnvelope | undefined
  const acceptedBytes = payload?.data?.resumableUpload?.acceptedBytes
  if (!Number.isSafeInteger(acceptedBytes) || (acceptedBytes ?? -1) < 0) {
    throw new Error('Upload checkpoint response is invalid.')
  }
  return acceptedBytes as number
}

async function queryExternalResumableOffset(
  fetchImpl: typeof fetch,
  uploadUrl: string,
  target: BrowserTemporaryUploadTarget,
  totalBytes: number,
  signal: AbortSignal | undefined,
): Promise<number> {
  const response = await fetchImpl(uploadUrl, {
    method: 'PUT',
    headers: headers({
      ...target.uploadHeaders,
      'content-range': `bytes */${totalBytes}`,
    }),
    body: new Blob([]),
    signal,
  })
  if (response.status === 308) return parseAcceptedRange(response.headers.get('range'), 0)
  if (response.ok) return totalBytes
  throw await uploadFailureError(response, 'Upload recovery checkpoint lookup failed.')
}

async function parseLocalAcceptedStatus(response: Response, fallback: number): Promise<{
  acceptedBytes: number
  recovery?: {
    reason?: string
    restartByte?: number
    discardedBytes?: number
  }
}> {
  const payload = await response.json().catch(() => undefined) as UploadEnvelope | undefined
  const acceptedBytes = payload?.data?.resumableUpload?.acceptedBytes
  return {
    acceptedBytes: Number.isSafeInteger(acceptedBytes) && (acceptedBytes ?? -1) >= 0
      ? acceptedBytes as number
      : fallback,
    ...(payload?.data?.resumableUpload?.recovery
      ? { recovery: payload.data.resumableUpload.recovery }
      : {}),
  }
}

function parseAcceptedRange(value: string | null, emptyFallback: number): number {
  if (!value) return emptyFallback
  const match = /^bytes=0-(\d+)$/i.exec(value.trim())
  if (!match) throw new Error('Upload target returned an invalid committed range.')
  const lastByte = Number(match[1])
  if (!Number.isSafeInteger(lastByte) || lastByte < 0) throw new Error('Upload target returned an invalid committed offset.')
  return lastByte + 1
}

async function sha256Blob(blob: Blob): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Secure chunk hashing is unavailable in this browser runtime.')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeChunkSize(value: number | undefined): number {
  if (!Number.isSafeInteger(value) || (value ?? 0) < MIN_CHUNK_BYTES || (value ?? 0) > MAX_CHUNK_BYTES) {
    return DEFAULT_CHUNK_BYTES
  }
  return value as number
}

function headers(values: Record<string, string | undefined>): Headers {
  const result = new Headers()
  for (const [key, value] of Object.entries(values)) if (value) result.set(key, value)
  return result
}

function joinUrl(baseUrl: string, candidate: string): string {
  if (isAbsoluteUrl(candidate)) return candidate
  return `${baseUrl.replace(/\/+$/, '')}/${candidate.replace(/^\/+/, '')}`
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

async function uploadFailureError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => undefined) as UploadEnvelope | undefined
  const details = payload?.error?.details
  return new TemporaryUploadRequestError({
    message: payload?.error?.message ?? fallback,
    code: payload?.error?.code,
    retryable: details?.retryable,
    retryAfterMs: details?.retryAfterMs,
    acceptedBytes: details?.acceptedBytes,
  })
}

function isRetryableStorageCapacityError(error: unknown): error is TemporaryUploadRequestError {
  return error instanceof TemporaryUploadRequestError
    && error.code === 'STORAGE_CAPACITY_UNAVAILABLE'
    && error.retryable
}

function validAcceptedBytes(candidate: number | undefined, fallback: number, totalBytes: number): number {
  return Number.isSafeInteger(candidate) && (candidate ?? -1) >= 0 && (candidate ?? totalBytes + 1) <= totalBytes
    ? candidate as number
    : fallback
}

function storageRecoveryDelayMs(value: number | undefined, attempt: number): number {
  if (Number.isFinite(value)) {
    return Math.max(
      MIN_STORAGE_RECOVERY_DELAY_MS,
      Math.min(MAX_STORAGE_RECOVERY_DELAY_MS, Math.round(value as number)),
    )
  }
  return Math.min(
    MAX_STORAGE_RECOVERY_DELAY_MS,
    MIN_STORAGE_RECOVERY_DELAY_MS * 2 ** Math.min(5, Math.max(0, attempt - 1)),
  )
}

async function delay(milliseconds: number, signal: AbortSignal | undefined): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds)
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      reject(signal.reason ?? new DOMException('Upload aborted.', 'AbortError'))
    }, { once: true })
  })
}
