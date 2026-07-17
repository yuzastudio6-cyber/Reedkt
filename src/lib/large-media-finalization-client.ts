import type { TemporaryUploadProtocol } from '../types/large-media'
import { resolveReceiverSafeFetch } from './receiver-safe-fetch'

type FinalizationStatus = 'queued' | 'running' | 'completed' | 'failed_retryable' | 'failed_terminal'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface LargeMediaFinalizationJobView {
  jobId: string
  status: FinalizationStatus
  attemptCount: number
  maximumAttempts: number
  pollAfterMs: number
  retryAvailable: boolean
  failure?: {
    code?: string
    summary?: string
    retryable?: boolean
  }
}

interface LargeMediaFinalizationJobData {
  largeMediaFinalizationJob: LargeMediaFinalizationJobView
}

export interface UploadedSourceFinalizationProgress {
  jobId: string
  status: FinalizationStatus
  attemptCount: number
  maximumAttempts: number
}

export interface FinalizeUploadedSourceInput {
  apiBaseUrl: string
  uploadIntentId: string
  workspaceId: string
  sizeBytes: number
  uploadProtocol?: TemporaryUploadProtocol
  supportsResume?: boolean
  authorization?: string
  reeditProUserAuthorization?: string
  finalizeIdempotencyKey: string
  finalizationJobIdempotencyKey: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  pollIntervalMs?: number
  maximumPollDurationMs?: number
  onProgress?: (progress: UploadedSourceFinalizationProgress) => void
}

export interface FinalizeUploadedSourceResult<TFinalizedData> {
  finalized: TFinalizedData
  warnings: string[]
  sourceFinalizationJobCreated: boolean
  sourceFinalizationJobId?: string
}

/**
 * Finalizes an uploaded source without allowing a large resumable object to
 * fall back to one fragile browser request. The browser may enqueue and poll;
 * it never receives or invokes the internal worker-run route.
 */
export async function finalizeUploadedSource<TFinalizedData>(
  input: FinalizeUploadedSourceInput,
): Promise<FinalizeUploadedSourceResult<TFinalizedData>> {
  assertInput(input)
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const warnings: string[] = []
  const usesBackgroundFinalization = input.uploadProtocol === 'gcs_resumable'

  if (!usesBackgroundFinalization) {
    const finalized = await finalizeRead<TFinalizedData>(input, fetchImpl)
    return {
      finalized: finalized.data,
      warnings: finalized.warnings,
      sourceFinalizationJobCreated: false,
    }
  }
  if (input.supportsResume !== true) {
    throw new Error('Large source finalization requires a resumable upload target with offset recovery.')
  }

  const enqueued = await requestJson<LargeMediaFinalizationJobData>({
    fetchImpl,
    url: resolveUrl(
      input.apiBaseUrl,
      `/v1/upload-intents/${encodeURIComponent(input.uploadIntentId)}/finalization-jobs`,
    ),
    method: 'POST',
    authorization: input.authorization,
    reeditProUserAuthorization: input.reeditProUserAuthorization,
    idempotencyKey: input.finalizationJobIdempotencyKey,
    body: { workspaceId: input.workspaceId, sizeBytes: input.sizeBytes },
    signal: input.signal,
  })
  warnings.push(...enqueued.warnings)
  let job = requireJob(enqueued.data?.largeMediaFinalizationJob)
  const jobId = job.jobId
  emitProgress(input, job)
  const startedAt = Date.now()
  const maximumPollDurationMs = input.maximumPollDurationMs ?? deriveMaximumPollDurationMs(input.sizeBytes)

  while (job.status !== 'completed') {
    if (job.status === 'failed_terminal') {
      throw new Error(job.failure?.summary ?? 'Large source finalization failed and requires review.')
    }
    if (Date.now() - startedAt >= maximumPollDurationMs) {
      throw new Error('Large source finalization is still pending. Reopen this upload after the private worker resumes.')
    }
    await delay(resolvePollDelayMs(input.pollIntervalMs, job.pollAfterMs), input.signal)
    const polled = await requestJson<LargeMediaFinalizationJobData>({
      fetchImpl,
      url: resolveUrl(
        input.apiBaseUrl,
        `/v1/large-media-finalization-jobs/${encodeURIComponent(jobId)}?workspaceId=${encodeURIComponent(input.workspaceId)}`,
      ),
      method: 'GET',
      authorization: input.authorization,
      reeditProUserAuthorization: input.reeditProUserAuthorization,
      signal: input.signal,
    })
    warnings.push(...polled.warnings)
    job = requireJob(polled.data?.largeMediaFinalizationJob, jobId)
    emitProgress(input, job)
  }

  // This is an idempotent read after the worker committed canonical upload
  // authority. It returns the same finalized shape used by the small path and
  // cannot restart hashing/probing because the upload intent is finalized.
  const finalized = await finalizeRead<TFinalizedData>(input, fetchImpl)
  warnings.push(...finalized.warnings)
  return {
    finalized: finalized.data,
    warnings: unique(warnings),
    sourceFinalizationJobCreated: true,
    sourceFinalizationJobId: jobId,
  }
}

async function finalizeRead<TFinalizedData>(
  input: FinalizeUploadedSourceInput,
  fetchImpl: typeof fetch,
): Promise<{ data: TFinalizedData; warnings: string[] }> {
  const finalized = await requestJson<TFinalizedData>({
    fetchImpl,
    url: resolveUrl(
      input.apiBaseUrl,
      `/v1/upload-intents/${encodeURIComponent(input.uploadIntentId)}/finalize`,
    ),
    method: 'POST',
    authorization: input.authorization,
    reeditProUserAuthorization: input.reeditProUserAuthorization,
    idempotencyKey: input.finalizeIdempotencyKey,
    body: { workspaceId: input.workspaceId, sizeBytes: input.sizeBytes },
    signal: input.signal,
  })
  if (!finalized.data) throw new Error('Upload finalization returned no canonical source record.')
  return { data: finalized.data, warnings: finalized.warnings }
}

async function requestJson<TData>(input: {
  fetchImpl: typeof fetch
  url: string
  method: 'GET' | 'POST'
  authorization?: string
  reeditProUserAuthorization?: string
  idempotencyKey?: string
  body?: Record<string, unknown>
  signal?: AbortSignal
}): Promise<{ data?: TData; warnings: string[] }> {
  const headers = new Headers({ accept: 'application/json' })
  if (input.authorization) headers.set('authorization', input.authorization)
  if (input.reeditProUserAuthorization) {
    headers.set('x-reeditpro-user-authorization', input.reeditProUserAuthorization)
  }
  if (input.body) headers.set('content-type', 'application/json')
  if (input.idempotencyKey) headers.set('idempotency-key', input.idempotencyKey)
  const response = await input.fetchImpl(input.url, {
    method: input.method,
    credentials: 'omit',
    redirect: 'error',
    headers,
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
    signal: input.signal,
  })
  const payload = await response.json().catch(() => undefined) as ApiEnvelope<TData> | undefined
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.error?.message ?? `Source finalization request failed (${response.status}).`)
  }
  return { data: payload.data, warnings: payload.warnings ?? [] }
}

function requireJob(value: unknown, expectedJobId?: string): LargeMediaFinalizationJobView {
  if (!value || typeof value !== 'object') throw new Error('Large source finalization returned no job authority.')
  const job = value as Partial<LargeMediaFinalizationJobView>
  const statuses: FinalizationStatus[] = ['queued', 'running', 'completed', 'failed_retryable', 'failed_terminal']
  if (
    typeof job.jobId !== 'string' || !job.jobId ||
    (expectedJobId !== undefined && job.jobId !== expectedJobId) ||
    !statuses.includes(job.status as FinalizationStatus) ||
    !Number.isSafeInteger(job.attemptCount) || Number(job.attemptCount) < 0 ||
    !Number.isSafeInteger(job.maximumAttempts) || Number(job.maximumAttempts) < 1
  ) {
    throw new Error('Large source finalization job authority is invalid.')
  }
  return {
    jobId: job.jobId,
    status: job.status as FinalizationStatus,
    attemptCount: Number(job.attemptCount),
    maximumAttempts: Number(job.maximumAttempts),
    pollAfterMs: Number.isSafeInteger(job.pollAfterMs) && Number(job.pollAfterMs) >= 0
      ? Number(job.pollAfterMs)
      : 2_000,
    retryAvailable: job.retryAvailable === true,
    ...(job.failure ? { failure: job.failure } : {}),
  }
}

function assertInput(input: FinalizeUploadedSourceInput): void {
  if (!input.apiBaseUrl.trim() || !input.uploadIntentId.trim() || !input.workspaceId.trim()) {
    throw new Error('Large source finalization requires API, upload-intent, and workspace authority.')
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error('Large source finalization requires the exact positive source byte size.')
  }
  if (
    !input.finalizeIdempotencyKey.trim() || input.finalizeIdempotencyKey.length > 240 ||
    !input.finalizationJobIdempotencyKey.trim() || input.finalizationJobIdempotencyKey.length > 240
  ) {
    throw new Error('Large source finalization requires stable idempotency keys.')
  }
  if (
    input.maximumPollDurationMs !== undefined &&
    (!Number.isSafeInteger(input.maximumPollDurationMs) || input.maximumPollDurationMs < 1_000)
  ) {
    throw new Error('Large source finalization poll duration is outside the safe range.')
  }
}

function emitProgress(input: FinalizeUploadedSourceInput, job: LargeMediaFinalizationJobView): void {
  input.onProgress?.({
    jobId: job.jobId,
    status: job.status,
    attemptCount: job.attemptCount,
    maximumAttempts: job.maximumAttempts,
  })
}

function resolvePollDelayMs(configured: number | undefined, serverValue: number): number {
  if (configured !== undefined) {
    if (!Number.isSafeInteger(configured) || configured < 0 || configured > 60_000) {
      throw new Error('Large source finalization poll interval is outside the safe range.')
    }
    return configured
  }
  return Math.min(15_000, Math.max(1_000, serverValue))
}

function deriveMaximumPollDurationMs(sizeBytes: number): number {
  const gib = sizeBytes / (1024 ** 3)
  return Math.round(Math.min(24 * 60 * 60_000, Math.max(30 * 60_000, 30 * 60_000 + gib * 30_000)))
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (milliseconds === 0) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      reject(abortError())
    }
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function abortError(): Error {
  return new DOMException('Large source finalization was cancelled.', 'AbortError')
}

function resolveUrl(apiBaseUrl: string, path: string): string {
  return new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`).toString()
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}
