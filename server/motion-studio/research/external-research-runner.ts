import { createHash } from 'node:crypto'

import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertImageContentMatchesMime,
  parseMs011bCommonsMetadata,
  parseMs011bWikipediaSummary,
  type Ms011bCommonsResult,
  type Ms011bWikipediaEvidence,
} from './external-evidence-parser'
import {
  createMs011bDerivedThumbnailRequest,
  createMs011bRequest,
  Ms011bTransportFailure,
  type Ms011bConfinedRequest,
  type Ms011bConfinedResponse,
  type Ms011bResearchTransport,
  type Ms011bSafeConnectionFailureCode,
  type Ms011bTransportFailurePhase,
  type Ms011bTransportOutcomeCertainty,
} from './confined-public-research-transport'
import {
  calculateMs011bInternalCost,
  type Ms011bAttemptUsage,
  type Ms011bInternalCostResult,
  type Ms011bInternalUsage,
} from './external-cost'
import {
  persistMs011bPrivateCapture,
  type Ms011bPrivateCaptureReceipt,
} from './external-capture-store'
import {
  MS011B_EXT001_RUN_IDENTITY,
  type Ms011bExternalAuthorizationId,
  type Ms011bExternalRunIdentity,
} from './external-run-identity'
import { MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT } from './external-authority-v5'
import { MS011B_EXT006_WIKIPEDIA_CLAIM_CONTRACT } from './external-authority-v6'

export type Ms011bAttemptOutcome = 'completed' | 'failed' | 'cancelled' | 'rejected' | 'unknown'
export type Ms011bRunTerminalState = 'needs_review' | 'failed' | 'reconciliation' | 'cancelled'

export interface Ms011bAttemptIntentRecord {
  runId: string
  ordinal: 1 | 2 | 3
  requestKind:
    | 'public_json_source_capture'
    | 'public_archive_metadata_search'
    | 'public_archive_thumbnail_capture'
  method: 'GET'
  targetHost: 'en.wikipedia.org' | 'commons.wikimedia.org' | 'upload.wikimedia.org'
  targetUrlHash: string
  derivedFromAttemptId?: string
  retryNumber: 0
  fallbackNumber: 0
  timeoutMilliseconds: 10_000
  startedAt: string
}

export interface Ms011bAttemptCompletionRecord {
  attemptIntentId: string
  runId: string
  ordinal: 1 | 2 | 3
  requestKind: Ms011bAttemptIntentRecord['requestKind']
  method: 'GET'
  targetHost: Ms011bAttemptIntentRecord['targetHost']
  targetUrlHash: string
  derivedFromAttemptId?: string
  retryNumber: 0
  fallbackNumber: 0
  timeoutMilliseconds: 10_000
  outcome: Ms011bAttemptOutcome
  responseStatus?: number
  responseMimeType?: string
  responseBytes: number
  responseDigest?: string
  localCpuMilliseconds: number
  qaEventCount: number
  dnsEvidenceDigest: string
  connectionEvidenceDigest: string
  responseEvidenceDigest: string
  failureCategory?: string
  failurePhase?: Ms011bTransportFailurePhase
  safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
  resolvedAddressFamily?: 4 | 6
  outcomeCertainty: 'known_completed' | Ms011bTransportOutcomeCertainty
  startedAt: string
  completedAt: string
  capture?: Ms011bPrivateCaptureReceipt
}

export interface Ms011bRunRecorder {
  transition(state: 'running' | 'processing' | Ms011bRunTerminalState, evidenceDigest: string): Promise<void>
  beginAttempt(record: Ms011bAttemptIntentRecord): Promise<{ attemptIntentId: string }>
  completeAttempt(record: Ms011bAttemptCompletionRecord): Promise<{ attemptId: string }>
  recordWikipediaEvidence(input: {
    attemptId: string
    capture: Ms011bPrivateCaptureReceipt
    evidence: Ms011bWikipediaEvidence
  }): Promise<void>
  recordCommonsEvidence(input: {
    attemptId: string
    capture: Ms011bPrivateCaptureReceipt
    result: Ms011bCommonsResult
  }): Promise<void>
  finalize(input: {
    state: Ms011bRunTerminalState
    usage: Ms011bInternalUsage
    cost: Ms011bInternalCostResult
    requestCount: number
    binaryDownloadCount: number
    wikipediaEvidence?: Ms011bWikipediaEvidence
    commonsResult?: Ms011bCommonsResult
    thumbnailCapture?: Ms011bPrivateCaptureReceipt
    failureCategory?: string
    safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
    resolvedAddressFamily?: 4 | 6
  }): Promise<void>
}

export interface Ms011bRunResult {
  authorizationId: Ms011bExternalAuthorizationId
  runId: string
  state: Ms011bRunTerminalState
  requestCount: number
  binaryDownloadCount: number
  capturedResponseBytes: number
  automaticRetryCount: 0
  fallbackRequestCount: 0
  providerCallCount: 0
  providerFeeMicros: 0
  usage: Ms011bInternalUsage
  cost: Ms011bInternalCostResult
  wikipediaEvidence?: Ms011bWikipediaEvidence
  commonsResult?: Ms011bCommonsResult
  thumbnailCapture?: Ms011bPrivateCaptureReceipt
  failureCategory?: string
  safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
  resolvedAddressFamily?: 4 | 6
}

export async function runMs011bExternalResearch(input: {
  runId: string
  privateCaptureRoot: string
  transport: Ms011bResearchTransport
  recorder: Ms011bRunRecorder
  persistCapture?: typeof persistMs011bPrivateCapture
  cpuMilliseconds?: () => number
  identity?: Ms011bExternalRunIdentity
}): Promise<Ms011bRunResult> {
  const identity = input.identity ?? MS011B_EXT001_RUN_IDENTITY
  const persistCapture = input.persistCapture ?? persistMs011bPrivateCapture
  const cpuMilliseconds = input.cpuMilliseconds ?? readProcessCpuMilliseconds
  let requestCount = 0
  let capturedResponseBytes = 0
  let privateStorageBytes = 0
  const attemptUsages: Ms011bAttemptUsage[] = []
  let binaryDownloadCount = 0
  let wikipediaEvidence: Ms011bWikipediaEvidence | undefined
  let commonsResult: Ms011bCommonsResult | undefined
  let thumbnailCapture: Ms011bPrivateCaptureReceipt | undefined
  let terminalState: Ms011bRunTerminalState
  let terminalFailureCategory: string | undefined
  let terminalSafeConnectionFailureCode: Ms011bSafeConnectionFailureCode | undefined
  let terminalResolvedAddressFamily: 4 | 6 | undefined
  let metadataAttemptId: string | undefined

  await input.recorder.transition('running', digest({ runId: input.runId, state: 'running' }))

  const execute = async <T>(
    request: Ms011bConfinedRequest,
    derivedFromAttemptId?: string,
    validate?: (response: Ms011bConfinedResponse) => T,
  ): Promise<{
    response: Ms011bConfinedResponse
    capture: Ms011bPrivateCaptureReceipt
    attemptId: string
    parsed: T | undefined
  }> => {
    assertRemainingAuthority({
      request,
      requestCount,
      capturedResponseBytes,
      privateStorageBytes,
    })
    const attemptCpuStart = cpuMilliseconds()
    let attemptQaEventCount = 1
    const startedAt = new Date().toISOString()
    const intent = createIntent(input.runId, request, startedAt, derivedFromAttemptId)
    const { attemptIntentId } = await input.recorder.beginAttempt(intent)
    requestCount += 1
    let response: Ms011bConfinedResponse | undefined
    let capture: Ms011bPrivateCaptureReceipt | undefined
    let responseCounted = false
    let storageCounted = false
    let completionAttempted = false
    let pendingCompletion: Ms011bAttemptCompletionRecord | undefined
    let parsed: T | undefined
    let validationFailed = false
    let validationFailure: unknown
    let completedAttemptId: string | undefined
    try {
      response = await input.transport.execute(request)
      capturedResponseBytes += response.bytes.byteLength
      responseCounted = true
      attemptQaEventCount += 1
      capture = await persistCapture({
        rootPath: input.privateCaptureRoot,
        runId: input.runId,
        requestOrdinal: request.ordinal,
        contentType: response.contentType,
        bytes: response.bytes,
        identity,
      })
      privateStorageBytes += capture.byteLength
      storageCounted = true
      attemptQaEventCount += 1
      if (validate) {
        attemptQaEventCount += 1
        try {
          parsed = validate(response)
        } catch (error) {
          validationFailed = true
          validationFailure = error
        }
      }
      const localCpuMilliseconds = measuredAttemptCpuMilliseconds(
        cpuMilliseconds,
        attemptCpuStart,
        remainingAttributedCpuMilliseconds(attemptUsages),
      )
      pendingCompletion = createCompletion({
        attemptIntentId,
        intent,
        response,
        capture,
        outcome: 'completed',
        outcomeCertainty: 'known_completed',
        localCpuMilliseconds,
        qaEventCount: attemptQaEventCount,
      })
      completionAttempted = true
      const { attemptId } = await input.recorder.completeAttempt(pendingCompletion)
      attemptUsages.push(attemptUsageFromCompletion(attemptId, pendingCompletion))
      completedAttemptId = attemptId
    } catch (error) {
      if (completionAttempted) {
        if (pendingCompletion && !attemptUsages.some((attempt) => attempt.ordinal === request.ordinal)) {
          attemptUsages.push(attemptUsageFromCompletion(
            `unconfirmed-attempt-${request.ordinal}`,
            pendingCompletion,
          ))
        }
        throw new Ms011bRunStop('attempt_persistence_outcome_unknown', 'reconciliation', error)
      }
      const transportFailure = error instanceof Ms011bTransportFailure ? error : undefined
      if (transportFailure) {
        terminalSafeConnectionFailureCode = transportFailure.safeConnectionFailureCode
        terminalResolvedAddressFamily = transportFailure.resolvedAddressFamily
      }
      const classifiedFailure = classifyFailure(error, response)
      const failure = identity.authorizationId === 'MS-011B-EXT-003'
        && classifiedFailure.phase === 'connect'
        && (!transportFailure?.safeConnectionFailureCode || !transportFailure.resolvedAddressFamily)
        ? {
            outcome: 'unknown' as const,
            category: 'transport_diagnostic_evidence_missing',
            phase: 'connect' as const,
            certainty: 'unknown' as const,
            runState: 'reconciliation' as const,
          }
        : classifiedFailure
      if (response && !responseCounted) {
        capturedResponseBytes += response.bytes.byteLength
      } else if (transportFailure && !responseCounted) {
        capturedResponseBytes += transportFailure.responseBytes
      }
      if (transportFailure) attemptQaEventCount += 1
      if (capture && !storageCounted) privateStorageBytes += capture.byteLength
      const completion = createCompletion({
        attemptIntentId,
        intent,
        response,
        capture,
        outcome: failure.outcome,
        failureCategory: failure.category,
        failurePhase: failure.phase,
        outcomeCertainty: failure.certainty,
        transportFailure,
        localCpuMilliseconds: measuredAttemptCpuMilliseconds(
          cpuMilliseconds,
          attemptCpuStart,
          remainingAttributedCpuMilliseconds(attemptUsages),
        ),
        qaEventCount: attemptQaEventCount,
      })
      try {
        const { attemptId } = await input.recorder.completeAttempt(completion)
        attemptUsages.push(attemptUsageFromCompletion(attemptId, completion))
      } catch (persistenceError) {
        attemptUsages.push(attemptUsageFromCompletion(
          `unconfirmed-attempt-${request.ordinal}`,
          completion,
        ))
        throw new Ms011bRunStop(
          'attempt_persistence_outcome_unknown',
          'reconciliation',
          persistenceError,
        )
      }
      throw new Ms011bRunStop(failure.category, failure.runState, error)
    }
    if (!response || !capture || !completedAttemptId) {
      throw new Ms011bRunStop(
        'attempt_completion_invariant_failed',
        'reconciliation',
        new Error('Completed external attempt omitted its immutable response, capture or attempt identity.'),
      )
    }
    if (validationFailed) {
      throw new Ms011bRunStop('source_content_rejected', 'failed', validationFailure)
    }
    return { response, capture, attemptId: completedAttemptId, parsed }
  }

  try {
    const wikipedia = await execute(createMs011bRequest(1), undefined, (response) => {
      const evidence = parseMs011bWikipediaSummary(
        response.bytes,
        response.completedAt,
        identity.authorizationId === 'MS-011B-EXT-006'
          ? MS011B_EXT006_WIKIPEDIA_CLAIM_CONTRACT
          : identity.authorizationId === 'MS-011B-EXT-005'
            ? MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT
            : undefined,
      )
      if (evidence.promptInjectionStatus !== 'not_detected') {
        throw new Error('Wikipedia source content triggered the exact prompt-injection stop condition.')
      }
      return evidence
    })
    wikipediaEvidence = wikipedia.parsed
    if (!wikipediaEvidence) throw new Ms011bRunStop('source_content_rejected', 'failed', 'Wikipedia evidence was not parsed.')
    await input.recorder.recordWikipediaEvidence({
      attemptId: wikipedia.attemptId,
      capture: wikipedia.capture,
      evidence: wikipediaEvidence,
    })

    const commons = await execute(createMs011bRequest(2), undefined, (response) => (
      parseMs011bCommonsMetadata(response.bytes, response.completedAt)
    ))
    metadataAttemptId = commons.attemptId
    commonsResult = commons.parsed
    if (!commonsResult) throw new Ms011bRunStop('source_content_rejected', 'failed', 'Commons metadata was not parsed.')
    await input.recorder.recordCommonsEvidence({
      attemptId: commons.attemptId,
      capture: commons.capture,
      result: commonsResult,
    })

    const selected = commonsResult.selectedThumbnailCandidate
    if (selected?.thumbUrl && selected.mimeType !== 'unsupported') {
      const selectedMimeType: 'image/jpeg' | 'image/png' | 'image/webp' = selected.mimeType
      const thumbnail = await execute(
        createMs011bDerivedThumbnailRequest(selected.thumbUrl),
        commons.attemptId,
        (response) => {
          if (response.contentType !== selectedMimeType) {
            throw new Error('Thumbnail response MIME differs from the exact eligible metadata record.')
          }
          assertImageContentMatchesMime(response.bytes, selectedMimeType)
          return true
        },
      )
      thumbnailCapture = thumbnail.capture
      binaryDownloadCount = 1
    }

    await input.recorder.transition('processing', digest({
      runId: input.runId,
      requestCount,
      capturedResponseBytes,
      binaryDownloadCount,
      state: 'processing',
    }))
    terminalState = 'needs_review'
  } catch (error) {
    const stop = error instanceof Ms011bRunStop
      ? error
      : new Ms011bRunStop('unclassified_failure', 'failed', error)
    terminalState = stop.runState
    terminalFailureCategory = stop.category
  }

  const localCpuMilliseconds = attemptUsages.reduce((total, attempt) => total + attempt.localCpuMilliseconds, 0)
  const qaEventCount = attemptUsages.reduce((total, attempt) => total + attempt.qaEventCount, 0)
  const usage: Ms011bInternalUsage = {
    requestCount,
    capturedResponseBytes,
    privateStorageBytes,
    localCpuMilliseconds,
    qaEventCount,
    providerFeeMicros: 0,
    attemptUsages,
  }
  const cost = calculateMs011bInternalCost(usage)
  const terminalDigest = digest({
    runId: input.runId,
    terminalState,
    requestCount,
    capturedResponseBytes,
    binaryDownloadCount,
    totalInternalCostMicros: cost.totalInternalCostMicros,
    failureCategory: terminalFailureCategory ?? null,
    safeConnectionFailureCode: terminalSafeConnectionFailureCode ?? null,
    resolvedAddressFamily: terminalResolvedAddressFamily ?? null,
    metadataAttemptId: metadataAttemptId ?? null,
  })
  await input.recorder.transition(terminalState, terminalDigest)
  await input.recorder.finalize({
    state: terminalState,
    usage,
    cost,
    requestCount,
    binaryDownloadCount,
    ...(wikipediaEvidence ? { wikipediaEvidence } : {}),
    ...(commonsResult ? { commonsResult } : {}),
    ...(thumbnailCapture ? { thumbnailCapture } : {}),
    ...(terminalFailureCategory ? { failureCategory: terminalFailureCategory } : {}),
    ...(terminalSafeConnectionFailureCode ? { safeConnectionFailureCode: terminalSafeConnectionFailureCode } : {}),
    ...(terminalResolvedAddressFamily ? { resolvedAddressFamily: terminalResolvedAddressFamily } : {}),
  })
  return {
    authorizationId: identity.authorizationId,
    runId: input.runId,
    state: terminalState,
    requestCount,
    binaryDownloadCount,
    capturedResponseBytes,
    automaticRetryCount: 0,
    fallbackRequestCount: 0,
    providerCallCount: 0,
    providerFeeMicros: 0,
    usage,
    cost,
    ...(wikipediaEvidence ? { wikipediaEvidence } : {}),
    ...(commonsResult ? { commonsResult } : {}),
    ...(thumbnailCapture ? { thumbnailCapture } : {}),
    ...(terminalFailureCategory ? { failureCategory: terminalFailureCategory } : {}),
    ...(terminalSafeConnectionFailureCode ? { safeConnectionFailureCode: terminalSafeConnectionFailureCode } : {}),
    ...(terminalResolvedAddressFamily ? { resolvedAddressFamily: terminalResolvedAddressFamily } : {}),
  }
}

class Ms011bRunStop extends Error {
  readonly category: string
  readonly runState: Extract<Ms011bRunTerminalState, 'failed' | 'reconciliation' | 'cancelled'>

  constructor(
    category: string,
    runState: Extract<Ms011bRunTerminalState, 'failed' | 'reconciliation' | 'cancelled'>,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause })
    this.name = 'Ms011bRunStop'
    this.category = category
    this.runState = runState
  }
}

function createIntent(
  runId: string,
  request: Ms011bConfinedRequest,
  startedAt: string,
  derivedFromAttemptId?: string,
): Ms011bAttemptIntentRecord {
  const parsed = new URL(request.url)
  return {
    runId,
    ordinal: request.ordinal,
    requestKind: request.ordinal === 1
      ? 'public_json_source_capture'
      : request.ordinal === 2
        ? 'public_archive_metadata_search'
        : 'public_archive_thumbnail_capture',
    method: 'GET',
    targetHost: parsed.hostname as Ms011bAttemptIntentRecord['targetHost'],
    targetUrlHash: sha256(request.url),
    ...(derivedFromAttemptId ? { derivedFromAttemptId } : {}),
    retryNumber: 0,
    fallbackNumber: 0,
    timeoutMilliseconds: 10_000,
    startedAt,
  }
}

function createCompletion(input: {
  attemptIntentId: string
  intent: Ms011bAttemptIntentRecord
  response?: Ms011bConfinedResponse
  capture?: Ms011bPrivateCaptureReceipt
  transportFailure?: Ms011bTransportFailure
  outcome: Ms011bAttemptOutcome
  failureCategory?: string
  failurePhase?: Ms011bTransportFailurePhase
  outcomeCertainty: 'known_completed' | Ms011bTransportOutcomeCertainty
  localCpuMilliseconds: number
  qaEventCount: number
}): Ms011bAttemptCompletionRecord {
  const responseStatus = input.response?.statusCode ?? input.transportFailure?.responseStatus
  const responseMimeType = input.response?.contentType ?? input.transportFailure?.responseMimeType
  const responseBytes = input.response?.bytes.byteLength ?? input.transportFailure?.responseBytes ?? 0
  const responseDigest = input.response
    ? sha256(input.response.bytes)
    : input.transportFailure?.responseDigest
  const completedAt = input.response?.completedAt
    ?? input.transportFailure?.completedAt
    ?? new Date().toISOString()
  const resolvedAddress = input.response?.resolvedAddress ?? input.transportFailure?.resolvedAddress
  const durationMilliseconds = input.response?.durationMilliseconds
    ?? input.transportFailure?.durationMilliseconds
  const safeConnectionFailureCode = input.transportFailure?.safeConnectionFailureCode
  const resolvedAddressFamily = input.response?.resolvedAddressFamily
    ?? input.transportFailure?.resolvedAddressFamily
  return {
    attemptIntentId: input.attemptIntentId,
    runId: input.intent.runId,
    ordinal: input.intent.ordinal,
    requestKind: input.intent.requestKind,
    method: 'GET',
    targetHost: input.intent.targetHost,
    targetUrlHash: input.intent.targetUrlHash,
    ...(input.intent.derivedFromAttemptId ? { derivedFromAttemptId: input.intent.derivedFromAttemptId } : {}),
    retryNumber: 0,
    fallbackNumber: 0,
    timeoutMilliseconds: 10_000,
    outcome: input.outcome,
    ...(responseStatus !== undefined ? { responseStatus } : {}),
    ...(responseMimeType ? { responseMimeType } : {}),
    responseBytes,
    ...(responseDigest ? { responseDigest } : {}),
    localCpuMilliseconds: input.localCpuMilliseconds,
    qaEventCount: input.qaEventCount,
    dnsEvidenceDigest: digest({
      host: input.intent.targetHost,
      resolvedAddress: resolvedAddress ?? null,
      phase: input.failurePhase ?? null,
    }),
    connectionEvidenceDigest: digest({
      host: input.intent.targetHost,
      startedAt: input.intent.startedAt,
      completedAt,
      durationMilliseconds: durationMilliseconds ?? null,
      status: responseStatus ?? null,
      phase: input.failurePhase ?? null,
      certainty: input.outcomeCertainty,
      safeConnectionFailureCode: safeConnectionFailureCode ?? null,
      resolvedAddressFamily: resolvedAddressFamily ?? null,
    }),
    responseEvidenceDigest: digest({
      ordinal: input.intent.ordinal,
      outcome: input.outcome,
      status: responseStatus ?? null,
      mimeType: responseMimeType ?? null,
      byteLength: responseBytes,
      responseDigest: responseDigest ?? null,
      failureCategory: input.failureCategory ?? null,
      failurePhase: input.failurePhase ?? null,
      outcomeCertainty: input.outcomeCertainty,
    }),
    ...(input.failureCategory ? { failureCategory: input.failureCategory } : {}),
    ...(input.failurePhase ? { failurePhase: input.failurePhase } : {}),
    ...(safeConnectionFailureCode ? { safeConnectionFailureCode } : {}),
    ...(resolvedAddressFamily ? { resolvedAddressFamily } : {}),
    outcomeCertainty: input.outcomeCertainty,
    startedAt: input.intent.startedAt,
    completedAt,
    ...(input.capture ? { capture: input.capture } : {}),
  }
}

function classifyFailure(
  error: unknown,
  response: Ms011bConfinedResponse | undefined,
): {
  outcome: Ms011bAttemptOutcome
  category: string
  phase: Ms011bTransportFailurePhase
  certainty: Ms011bTransportOutcomeCertainty
  runState: 'failed' | 'reconciliation'
} {
  if (error instanceof Ms011bTransportFailure) {
    if (error.certainty === 'not_sent') {
      return {
        outcome: 'failed', category: error.category, phase: error.phase,
        certainty: error.certainty, runState: 'failed',
      }
    }
    if (error.certainty === 'known_rejected') {
      return {
        outcome: 'rejected', category: error.category, phase: error.phase,
        certainty: error.certainty, runState: 'failed',
      }
    }
    return {
      outcome: 'unknown', category: error.category, phase: error.phase,
      certainty: error.certainty, runState: 'reconciliation',
    }
  }
  if (response) {
    return {
      outcome: 'rejected', category: 'response_rejected', phase: 'response_body',
      certainty: 'known_rejected', runState: 'failed',
    }
  }
  return {
    outcome: 'unknown', category: 'unknown_transport_outcome', phase: 'connect',
    certainty: 'unknown', runState: 'reconciliation',
  }
}

function attemptUsageFromCompletion(
  attemptId: string,
  completion: Ms011bAttemptCompletionRecord,
): Ms011bAttemptUsage {
  return {
    attemptId,
    ordinal: completion.ordinal,
    responseBytes: completion.responseBytes,
    privateStorageBytes: completion.capture?.byteLength ?? 0,
    localCpuMilliseconds: completion.localCpuMilliseconds,
    qaEventCount: completion.qaEventCount,
  }
}

function assertRemainingAuthority(input: {
  request: Ms011bConfinedRequest
  requestCount: number
  capturedResponseBytes: number
  privateStorageBytes: number
}): void {
  if (input.requestCount >= 3) throw new Error('MS-011B request count is already exhausted.')
  calculateMs011bInternalCost({
    requestCount: input.requestCount + 1,
    capturedResponseBytes: input.capturedResponseBytes + input.request.maximumResponseBytes,
    privateStorageBytes: input.privateStorageBytes + input.request.maximumResponseBytes,
    localCpuMilliseconds: 30_000,
    qaEventCount: 16,
    providerFeeMicros: 0,
  })
}

function readProcessCpuMilliseconds(): number {
  const usage = process.cpuUsage()
  return (usage.user + usage.system) / 1_000
}

function remainingAttributedCpuMilliseconds(attempts: readonly Ms011bAttemptUsage[]): number {
  return Math.max(0, 30_000 - attempts.reduce((total, attempt) => total + attempt.localCpuMilliseconds, 0))
}

function measuredAttemptCpuMilliseconds(
  clock: () => number,
  startedAtMilliseconds: number,
  remainingMilliseconds: number,
): number {
  return Math.min(remainingMilliseconds, Math.max(0, Math.ceil(clock() - startedAtMilliseconds)))
}

function digest(value: unknown): string {
  return sha256CanonicalJson(value)
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
