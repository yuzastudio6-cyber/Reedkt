import {
  REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES,
  REEDITPRO_RESUMABLE_UPLOAD_MAX_RETRIES,
  assertValidResumableChunkSize,
  type TemporaryUploadProtocol,
} from '../types/large-media'

export interface TemporaryObjectUploadTarget {
  uploadMethod: 'PUT' | 'POST'
  uploadUrl: string
  uploadHeaders?: Record<string, string>
  uploadProtocol?: TemporaryUploadProtocol
  supportsResume?: boolean
  recommendedChunkSizeBytes?: number
}

export interface TemporaryObjectUploadProgress {
  uploadedBytes: number
  totalBytes: number
  fraction: number
  state: 'uploading' | 'recovering' | 'completed'
}

export interface TemporaryObjectUploadResult {
  protocol: TemporaryUploadProtocol
  uploadedBytes: number
  requestCount: number
  resumedAfterInterruption: boolean
}

export interface UploadFileToTemporaryObjectTargetInput {
  apiBaseUrl: string
  file: Blob
  mimeType: string
  target: TemporaryObjectUploadTarget
  authorization?: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  onProgress?: (progress: TemporaryObjectUploadProgress) => void
  retryDelayMs?: number
  maxRetries?: number
}

/**
 * Streams a Blob to a temporary backend/object-storage target. Resumable
 * sessions are kept in memory only: callers must never persist their bearer
 * session URI to localStorage, logs, analytics, or canonical records.
 */
export async function uploadFileToTemporaryObjectTarget(
  input: UploadFileToTemporaryObjectTargetInput,
): Promise<TemporaryObjectUploadResult> {
  if (!Number.isSafeInteger(input.file.size) || input.file.size <= 0) {
    throw new Error('The selected file must have a positive safe-integer byte size.')
  }

  const protocol = input.target.uploadProtocol ?? 'single_put'
  if (protocol === 'gcs_resumable') {
    return uploadResumable(input)
  }
  if (protocol === 'single_put') return uploadSingleRequest(input)
  throw new Error('The temporary upload target declared an unsupported upload protocol.')
}

async function uploadSingleRequest(
  input: UploadFileToTemporaryObjectTargetInput,
): Promise<TemporaryObjectUploadResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  emitProgress(input, 0, 'uploading')
  const response = await fetchImpl(resolveTargetUrl(input.apiBaseUrl, input.target.uploadUrl), {
    method: input.target.uploadMethod,
    credentials: 'omit',
    headers: createUploadHeaders(input),
    body: input.file,
    signal: input.signal,
  })
  if (!response.ok) {
    throw new Error(`Private upload target rejected the file (${response.status}).`)
  }
  emitProgress(input, input.file.size, 'completed')
  return {
    protocol: 'single_put',
    uploadedBytes: input.file.size,
    requestCount: 1,
    resumedAfterInterruption: false,
  }
}

async function uploadResumable(
  input: UploadFileToTemporaryObjectTargetInput,
): Promise<TemporaryObjectUploadResult> {
  if (input.target.supportsResume !== true) {
    throw new Error('The temporary upload target did not confirm resumable offset recovery.')
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const chunkSizeBytes = input.target.recommendedChunkSizeBytes ?? REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES
  assertValidResumableChunkSize(chunkSizeBytes)
  const maxRetries = input.maxRetries ?? REEDITPRO_RESUMABLE_UPLOAD_MAX_RETRIES
  const retryDelayMs = input.retryDelayMs ?? 300
  assertValidRetryPolicy(maxRetries, retryDelayMs)
  let offset = 0
  let retryCount = 0
  let requestCount = 0
  let resumedAfterInterruption = false
  emitProgress(input, offset, 'uploading')

  while (offset < input.file.size) {
    throwIfAborted(input.signal)
    const endExclusive = Math.min(offset + chunkSizeBytes, input.file.size)
    const chunk = input.file.slice(offset, endExclusive, input.mimeType)

    try {
      requestCount += 1
      const response = await fetchImpl(resolveTargetUrl(input.apiBaseUrl, input.target.uploadUrl), {
        method: 'PUT',
        credentials: 'omit',
        redirect: 'manual',
        headers: {
          ...createUploadHeaders(input),
          'content-range': `bytes ${offset}-${endExclusive - 1}/${input.file.size}`,
        },
        body: chunk,
        signal: input.signal,
      })

      if (response.status === 200 || response.status === 201) {
        if (endExclusive !== input.file.size) {
          throw new Error('Resumable storage finalized before all selected bytes were sent.')
        }
        offset = input.file.size
        emitProgress(input, offset, 'completed')
        return {
          protocol: 'gcs_resumable',
          uploadedBytes: offset,
          requestCount,
          resumedAfterInterruption,
        }
      }

      if (response.status === 308) {
        const committedOffset = requireCommittedOffsetWithinSentChunk(
          response.headers.get('range'),
          offset,
          endExclusive,
          input.file.size,
        )
        if (committedOffset > offset) {
          offset = committedOffset
          retryCount = 0
          emitProgress(input, offset, 'uploading')
          continue
        }
        // A 308 with no newly committed bytes is recoverable. Query the
        // provider's session state before retrying the same chunk.
      } else if (!isRetryableUploadStatus(response.status)) {
        throw new Error(`Resumable storage rejected a file chunk (${response.status}).`)
      }
    } catch (error) {
      if (input.signal?.aborted) throw abortError()
      if (isNonRetryableUploadError(error)) throw error
    }

    if (retryCount >= maxRetries) {
      throw new Error('Resumable upload could not recover after the allowed retry attempts.')
    }

    retryCount += 1
    resumedAfterInterruption = true
    emitProgress(input, offset, 'recovering')
    await delay(Math.min(retryDelayMs * 2 ** (retryCount - 1), 4_000), input.signal)
    const recovery = await queryCommittedOffsetWithRetry({
      input,
      fetchImpl,
      maxRetries,
      retryDelayMs,
    })
    requestCount += recovery.requestCount
    const recoveredOffset = recovery.offset
    if (recoveredOffset < offset || recoveredOffset > input.file.size) {
      throw new Error('Resumable storage returned an invalid committed-byte offset.')
    }
    if (recoveredOffset > offset) retryCount = 0
    offset = recoveredOffset
    emitProgress(input, offset, offset === input.file.size ? 'completed' : 'uploading')
  }

  return {
    protocol: 'gcs_resumable',
    uploadedBytes: offset,
    requestCount,
    resumedAfterInterruption,
  }
}

async function queryCommittedOffsetWithRetry(input: {
  input: UploadFileToTemporaryObjectTargetInput
  fetchImpl: typeof fetch
  maxRetries: number
  retryDelayMs: number
}): Promise<{ offset: number; requestCount: number }> {
  let retryCount = 0
  let requestCount = 0

  while (true) {
    throwIfAborted(input.input.signal)
    try {
      requestCount += 1
      const offset = await queryCommittedOffset(input.input, input.fetchImpl)
      return { offset, requestCount }
    } catch (error) {
      if (input.input.signal?.aborted) throw abortError()
      if (isNonRetryableUploadError(error)) throw error
      if (retryCount >= input.maxRetries) {
        throw new Error(
          'Resumable upload could not recover its committed offset after the allowed retry attempts.',
          { cause: error },
        )
      }

      retryCount += 1
      await delay(Math.min(input.retryDelayMs * 2 ** (retryCount - 1), 4_000), input.input.signal)
    }
  }
}

async function queryCommittedOffset(
  input: UploadFileToTemporaryObjectTargetInput,
  fetchImpl: typeof fetch,
): Promise<number> {
  const response = await fetchImpl(resolveTargetUrl(input.apiBaseUrl, input.target.uploadUrl), {
    method: 'PUT',
    credentials: 'omit',
    redirect: 'manual',
    headers: {
      ...createUploadHeaders(input),
      'content-range': `bytes */${input.file.size}`,
    },
    body: new Blob([]),
    signal: input.signal,
  })

  if (response.status === 200 || response.status === 201) return input.file.size
  if (isRetryableUploadStatus(response.status)) {
    throw new RetryableResumableUploadError(
      `Resumable storage temporarily could not report upload progress (${response.status}).`,
    )
  }
  if (response.status !== 308) {
    throw new Error(`Resumable storage could not report upload progress (${response.status}).`)
  }
  return parseCommittedOffset(response.headers.get('range'), input.file.size)
}

function createUploadHeaders(input: UploadFileToTemporaryObjectTargetInput): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(input.target.uploadHeaders ?? {})) {
    const normalizedName = name.trim().toLowerCase()
    if (!normalizedName || normalizedName === 'authorization') continue
    headers[normalizedName] = value
  }
  headers['content-type'] = input.mimeType
  if (input.authorization && isBackendTarget(input.apiBaseUrl, input.target.uploadUrl)) {
    headers.authorization = input.authorization
  }
  return headers
}

function resolveTargetUrl(apiBaseUrl: string, uploadUrl: string): string {
  if (/^https?:\/\//i.test(uploadUrl)) return uploadUrl
  return `${apiBaseUrl.replace(/\/+$/, '')}/${uploadUrl.replace(/^\/+/, '')}`
}

function isBackendTarget(apiBaseUrl: string, uploadUrl: string): boolean {
  if (!/^https?:\/\//i.test(uploadUrl)) return true
  try {
    return new URL(apiBaseUrl).origin === new URL(uploadUrl).origin
  } catch {
    return false
  }
}

function requireCommittedOffsetWithinSentChunk(
  rangeHeader: string | null,
  sentStart: number,
  sentEndExclusive: number,
  totalBytes: number,
): number {
  const committedOffset = parseCommittedOffset(rangeHeader, totalBytes)
  if (committedOffset < sentStart || committedOffset > sentEndExclusive) {
    throw new Error('Resumable storage did not acknowledge a valid offset within the sent chunk.')
  }
  return committedOffset
}

export function parseCommittedOffset(rangeHeader: string | null, totalBytes: number): number {
  if (!rangeHeader) return 0
  const match = /^(?:bytes=)?0-(\d+)$/.exec(rangeHeader.trim())
  if (!match) throw new Error('Resumable storage returned an unreadable committed-byte range.')
  const lastByte = Number(match[1])
  const offset = lastByte + 1
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > totalBytes) {
    throw new Error('Resumable storage returned an out-of-bounds committed-byte range.')
  }
  return offset
}

function isRetryableUploadStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

class RetryableResumableUploadError extends Error {}

function isNonRetryableUploadError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.startsWith('Resumable storage rejected') ||
    error.message.startsWith('Resumable storage finalized') ||
    error.message.startsWith('Resumable storage did not acknowledge') ||
    error.message.startsWith('Resumable storage returned') ||
    error.message.startsWith('Resumable storage could not report')
  )
}

function assertValidRetryPolicy(maxRetries: number, retryDelayMs: number): void {
  if (
    !Number.isSafeInteger(maxRetries) ||
    maxRetries < 0 ||
    maxRetries > REEDITPRO_RESUMABLE_UPLOAD_MAX_RETRIES
  ) {
    throw new Error(
      `Resumable upload retries must be an integer from 0 to ${REEDITPRO_RESUMABLE_UPLOAD_MAX_RETRIES}.`,
    )
  }
  if (!Number.isSafeInteger(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 4_000) {
    throw new Error('Resumable upload retry delay must be an integer from 0 to 4000 milliseconds.')
  }
}

function emitProgress(
  input: UploadFileToTemporaryObjectTargetInput,
  uploadedBytes: number,
  state: TemporaryObjectUploadProgress['state'],
): void {
  input.onProgress?.({
    uploadedBytes,
    totalBytes: input.file.size,
    fraction: input.file.size > 0 ? uploadedBytes / input.file.size : 0,
    state,
  })
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw abortError()
}

function abortError(): Error {
  return new DOMException('The upload was cancelled.', 'AbortError')
}

async function delay(durationMs: number, signal: AbortSignal | undefined): Promise<void> {
  throwIfAborted(signal)
  if (durationMs <= 0) return
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      reject(abortError())
    }
    const onComplete = () => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }
    const timeout = setTimeout(onComplete, durationMs)
    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) onAbort()
  })
}
