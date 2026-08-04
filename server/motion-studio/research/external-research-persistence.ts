import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  Ms011bAttemptCompletionRecord,
  Ms011bAttemptIntentRecord,
  Ms011bRunRecorder,
} from './external-research-runner'
import {
  MS011B_EXT001_RUN_IDENTITY,
  type Ms011bExternalRunIdentity,
} from './external-run-identity'

const uuid = z.string().uuid()
const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/)

const runSchema = z.object({
  id: safeId,
  workspace_id: uuid,
  project_id: uuid,
  edit_session_id: safeId,
  production_id: uuid,
  created_by: uuid,
}).passthrough()

const eventSchema = z.object({
  id: safeId,
  sequence_number: z.number().int().positive(),
  state: z.string().min(1),
  evidence_digest: z.string().regex(/^[a-f0-9]{64}$/),
}).passthrough()

const attemptCompletionReceiptSchema = z.object({
  attemptId: safeId,
  captureId: safeId.nullable(),
  idempotentReplay: z.boolean(),
}).strict()

const wikipediaReceiptFields = {
  sourceId: uuid,
  sourceVersionId: uuid,
  evidenceFragmentId: uuid,
  claimId: uuid,
  openQuestionId: uuid,
  idempotentReplay: z.boolean(),
} as const

const wikipediaReceiptSchema = z.object({
  ...wikipediaReceiptFields,
  chronologyEventId: uuid,
}).strict()

const wikipediaReceiptWithoutChronologySchema = z.object({
  ...wikipediaReceiptFields,
  chronologyEventId: z.null(),
}).strict()

const commonsReceiptSchema = z.object({
  sourceId: uuid,
  sourceVersionId: uuid,
  evidenceFragmentId: uuid,
  visualNeedId: uuid,
  candidateCount: z.number().int().min(0).max(3),
  needsReviewCount: z.number().int().min(0).max(3),
  idempotentReplay: z.boolean(),
}).strict()

const costReceiptSchema = z.object({
  runId: safeId,
  costOutcomeId: safeId,
  actualCostRecordId: safeId,
  reconciliationRecordId: safeId,
  maximumAuthorizedInternalCostMicros: z.literal(250_000),
  incurredInternalCostMicros: z.number().int().min(0).max(250_000),
  releasedInternalCostMicros: z.number().int().min(0).max(250_000),
  requestCount: z.number().int().min(0).max(3),
  capturedResponseBytes: z.number().int().min(0).max(9_961_472),
  privateStorageBytes: z.number().int().min(0).max(9_961_472),
  localCpuMilliseconds: z.number().int().min(0).max(30_000),
  qaEventCount: z.number().int().min(0).max(64),
  providerCallCount: z.literal(0),
  providerFeeMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  idempotentReplay: z.boolean(),
}).strict()

type RunRecord = z.infer<typeof runSchema>
type EventRecord = z.infer<typeof eventSchema>

export async function createSupabaseMs011bRunRecorder(input: {
  client: SupabaseClient
  runId: string
  actorUserId: string
  identity?: Ms011bExternalRunIdentity
}): Promise<Ms011bRunRecorder> {
  const identity = input.identity ?? MS011B_EXT001_RUN_IDENTITY
  if (input.runId !== identity.runId) {
    throw new Error('MS-011B recorder run identity differs from its authorization profile.')
  }
  const run = runSchema.parse(await readSingle(
    input.client,
    'motion_studio_research_external_runs',
    'id,workspace_id,project_id,edit_session_id,production_id,created_by',
    'id',
    input.runId,
  ))
  if (run.created_by !== input.actorUserId) {
    throw new Error('MS-011B recorder actor differs from the immutable run authority.')
  }
  const latestEvent = eventSchema.parse(await readLatestEvent(input.client, input.runId))
  if (latestEvent.state !== 'preflight_passed') {
    throw new Error('MS-011B recorder requires the exact preflight-passed run state.')
  }
  return new SupabaseMs011bRunRecorder(input.client, run, latestEvent, identity)
}

class SupabaseMs011bRunRecorder implements Ms011bRunRecorder {
  private readonly client: SupabaseClient
  private readonly run: RunRecord
  private latestEvent: EventRecord
  private readonly identity: Ms011bExternalRunIdentity

  constructor(
    client: SupabaseClient,
    run: RunRecord,
    latestEvent: EventRecord,
    identity: Ms011bExternalRunIdentity,
  ) {
    this.client = client
    this.run = run
    this.latestEvent = latestEvent
    this.identity = identity
  }

  async transition(
    state: 'running' | 'processing' | 'needs_review' | 'failed' | 'reconciliation' | 'cancelled',
    evidenceDigest: string,
  ): Promise<void> {
    const sequence = this.latestEvent.sequence_number + 1
    const id = `${this.identity.runEventIdPrefix}${sequence}`
    const value = {
      id,
      run_id: this.run.id,
      workspace_id: this.run.workspace_id,
      project_id: this.run.project_id,
      edit_session_id: this.run.edit_session_id,
      production_id: this.run.production_id,
      sequence_number: sequence,
      prior_event_id: this.latestEvent.id,
      state,
      evidence_digest: evidenceDigest,
      reason_code: reasonCode(state),
      created_by: this.run.created_by,
    }
    const result = await this.client.from('motion_studio_research_external_run_events').insert(value as never)
    if (result.error) {
      const existing = eventSchema.parse(await readSingle(
        this.client,
        'motion_studio_research_external_run_events',
        'id,sequence_number,state,evidence_digest',
        'id',
        id,
      ))
      if (existing.sequence_number !== sequence || existing.state !== state ||
          existing.evidence_digest !== evidenceDigest) {
        throw databaseFailure('external run transition', result.error)
      }
      this.latestEvent = existing
      return
    }
    this.latestEvent = eventSchema.parse(value)
  }

  async beginAttempt(record: Ms011bAttemptIntentRecord): Promise<{ attemptIntentId: string }> {
    assertRunRecord(this.run, record.runId)
    const attemptIntentId = `${this.identity.attemptIntentIdPrefix}${record.ordinal}`
    const value = {
      id: attemptIntentId,
      run_id: this.run.id,
      workspace_id: this.run.workspace_id,
      project_id: this.run.project_id,
      edit_session_id: this.run.edit_session_id,
      production_id: this.run.production_id,
      ordinal: record.ordinal,
      request_kind: record.requestKind,
      method: record.method,
      target_host: record.targetHost,
      target_url_hash: record.targetUrlHash,
      ...(record.derivedFromAttemptId ? { derived_from_attempt_id: record.derivedFromAttemptId } : {}),
      retry_number: record.retryNumber,
      fallback_number: record.fallbackNumber,
      timeout_milliseconds: record.timeoutMilliseconds,
      request_evidence_digest: sha256CanonicalJson(record),
      started_at: record.startedAt,
      created_by: this.run.created_by,
    }
    const result = await this.client.from('motion_studio_research_external_attempt_intents').insert(value as never)
    if (result.error) {
      const existing = await readSingle(
        this.client,
        'motion_studio_research_external_attempt_intents',
        'id,run_id,ordinal,request_kind,method,target_host,target_url_hash,derived_from_attempt_id,retry_number,fallback_number,timeout_milliseconds,request_evidence_digest,started_at',
        'id',
        attemptIntentId,
      )
      if (sha256CanonicalJson(normalizeIntent(existing)) !== sha256CanonicalJson(record)) {
        throw databaseFailure('external request intent', result.error)
      }
    }
    return { attemptIntentId }
  }

  async completeAttempt(record: Ms011bAttemptCompletionRecord): Promise<{ attemptId: string }> {
    assertRunRecord(this.run, record.runId)
    const attemptId = `${this.identity.attemptIdPrefix}${record.ordinal}`
    const response = await this.client.rpc(this.identity.completeAttemptRpc, {
      target_attempt_id: attemptId,
      target_attempt_intent_id: record.attemptIntentId,
      target_run_id: record.runId,
      target_actor_user_id: this.run.created_by,
      target_outcome: record.outcome,
      target_response_status: record.responseStatus ?? null,
      target_response_mime_type: record.responseMimeType ?? null,
      target_response_bytes: record.responseBytes,
      target_response_digest: record.responseDigest ?? null,
      target_local_cpu_milliseconds: record.localCpuMilliseconds,
      target_qa_event_count: record.qaEventCount,
      target_dns_evidence_digest: record.dnsEvidenceDigest,
      target_connection_evidence_digest: record.connectionEvidenceDigest,
      target_response_evidence_digest: record.responseEvidenceDigest,
      target_failure_category: record.failureCategory ?? null,
      target_failure_phase: record.failurePhase ?? null,
      target_outcome_certainty: record.outcomeCertainty,
      target_completed_at: record.completedAt,
      target_capture_id: record.capture?.captureId ?? null,
      target_capture_object_id: record.capture?.objectId ?? null,
      target_capture_digest: record.capture?.checksumSha256 ?? null,
      target_capture_bytes: record.capture?.byteLength ?? null,
      target_capture_mime_type: record.capture?.contentType ?? null,
    })
    const receipt = attemptCompletionReceiptSchema.parse(readRpc(response, 'atomic external attempt completion'))
    if (receipt.attemptId !== attemptId || receipt.captureId !== (record.capture?.captureId ?? null)) {
      throw new Error('Atomic external attempt completion returned different immutable identities.')
    }
    return { attemptId }
  }

  async recordWikipediaEvidence(input: Parameters<Ms011bRunRecorder['recordWikipediaEvidence']>[0]): Promise<void> {
    const response = await this.client.rpc(this.identity.recordWikipediaEvidenceRpc, {
      target_run_id: this.run.id,
      target_attempt_id: input.attemptId,
      target_capture_id: input.capture.captureId,
      target_actor_user_id: this.run.created_by,
      target_accessed_at: input.evidence.accessedAt,
      target_response_digest: input.evidence.responseDigest,
      target_prompt_injection_status: input.evidence.promptInjectionStatus,
      target_prompt_injection_findings: [...input.evidence.promptInjectionFindings],
    })
    const receipt = readRpc(response, 'atomic Wikipedia evidence persistence')
    if (this.identity.authorizationId === 'MS-011B-EXT-005' ||
        this.identity.authorizationId === 'MS-011B-EXT-006') {
      wikipediaReceiptWithoutChronologySchema.parse(receipt)
    } else {
      wikipediaReceiptSchema.parse(receipt)
    }
  }

  async recordCommonsEvidence(input: Parameters<Ms011bRunRecorder['recordCommonsEvidence']>[0]): Promise<void> {
    const candidates = input.result.candidates.map((candidate) => ({
      providerIndex: candidate.providerIndex,
      pageId: candidate.pageId,
      title: candidate.title,
      mimeType: candidate.mimeType,
      width: candidate.width,
      height: candidate.height,
      technicalSuitability: candidate.technicalSuitability,
      selectionStatus: candidate.selectionStatus,
      eligibleForPrivateThumbnailReview: candidate.eligibleForPrivateThumbnailReview,
      rejectionReasons: [...candidate.rejectionReasons],
      promptInjectionStatus: candidate.promptInjectionStatus,
      promptInjectionFindings: [...candidate.promptInjectionFindings],
      ...(candidate.licenseShortName ? { licenseShortName: candidate.licenseShortName } : {}),
    }))
    const response = await this.client.rpc(this.identity.recordCommonsEvidenceRpc, {
      target_run_id: this.run.id,
      target_attempt_id: input.attemptId,
      target_capture_id: input.capture.captureId,
      target_actor_user_id: this.run.created_by,
      target_accessed_at: input.result.accessedAt,
      target_response_digest: input.result.responseDigest,
      target_candidates: candidates,
    })
    const receipt = commonsReceiptSchema.parse(readRpc(response, 'atomic Commons evidence persistence'))
    if (receipt.candidateCount !== candidates.length ||
        receipt.needsReviewCount !== candidates.filter((candidate) => candidate.selectionStatus === 'needs_review').length) {
      throw new Error('Atomic Commons evidence persistence returned different candidate counts.')
    }
  }

  async finalize(input: Parameters<Ms011bRunRecorder['finalize']>[0]): Promise<void> {
    const evidenceDigest = sha256CanonicalJson({
      runId: this.run.id,
      state: input.state,
      usage: input.usage,
      cost: input.cost,
      requestCount: input.requestCount,
      binaryDownloadCount: input.binaryDownloadCount,
      failureCategory: input.failureCategory ?? null,
      safeConnectionFailureCode: input.safeConnectionFailureCode ?? null,
      resolvedAddressFamily: input.resolvedAddressFamily ?? null,
    })
    const response = await this.client.rpc(this.identity.finalizeCostRpc, {
      target_run_id: this.run.id,
      target_actor_user_id: this.run.created_by,
      target_evidence_digest: evidenceDigest,
    })
    const receipt = costReceiptSchema.parse(readRpc(response, 'bounded external cost reconciliation'))
    if (receipt.runId !== this.run.id ||
        receipt.costOutcomeId !== this.identity.costOutcomeId ||
        receipt.actualCostRecordId !== this.identity.actualCostRecordId ||
        receipt.reconciliationRecordId !== this.identity.reconciliationRecordId ||
        receipt.incurredInternalCostMicros !== input.cost.totalInternalCostMicros ||
        receipt.releasedInternalCostMicros !== 250_000 - input.cost.totalInternalCostMicros ||
        receipt.requestCount !== input.requestCount ||
        receipt.capturedResponseBytes !== input.usage.capturedResponseBytes ||
        receipt.privateStorageBytes !== input.usage.privateStorageBytes ||
        receipt.localCpuMilliseconds !== input.usage.localCpuMilliseconds ||
        receipt.qaEventCount !== input.usage.qaEventCount) {
      throw new Error('Database cost reconciliation differs from local attempt-attributed conservation.')
    }
  }
}

function assertRunRecord(run: RunRecord, runId: string): void {
  if (run.id !== runId) throw new Error('MS-011B recorder received a different run identity.')
}

function normalizeIntent(value: Record<string, unknown>): Ms011bAttemptIntentRecord {
  const ordinal = value.ordinal as 1 | 2 | 3
  return {
    runId: String(value.run_id),
    ordinal,
    requestKind: String(value.request_kind) as Ms011bAttemptIntentRecord['requestKind'],
    method: 'GET',
    targetHost: String(value.target_host) as Ms011bAttemptIntentRecord['targetHost'],
    targetUrlHash: String(value.target_url_hash),
    ...(value.derived_from_attempt_id ? { derivedFromAttemptId: String(value.derived_from_attempt_id) } : {}),
    retryNumber: 0,
    fallbackNumber: 0,
    timeoutMilliseconds: 10_000,
    startedAt: new Date(String(value.started_at)).toISOString(),
  }
}

function reasonCode(state: Parameters<Ms011bRunRecorder['transition']>[0]): string {
  return {
    running: 'single-use-gate-consumed',
    processing: 'responses-normalized',
    needs_review: 'human-review-required',
    failed: 'bounded-run-failed',
    reconciliation: 'attempt-outcome-reconciliation-required',
    cancelled: 'operator-cancelled',
  }[state]
}

async function readLatestEvent(client: SupabaseClient, runId: string): Promise<Record<string, unknown>> {
  const response = await client.from('motion_studio_research_external_run_events')
    .select('id,sequence_number,state,evidence_digest')
    .eq('run_id', runId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single()
  if (response.error || !response.data) throw databaseFailure('latest external run event', response.error)
  return response.data as unknown as Record<string, unknown>
}

async function readSingle(
  client: SupabaseClient,
  table: string,
  columns: string,
  field: string,
  value: string,
): Promise<Record<string, unknown>> {
  const response = await client.from(table).select(columns).eq(field, value).single()
  if (response.error || !response.data) throw databaseFailure(`${table} readback`, response.error)
  return response.data as unknown as Record<string, unknown>
}

function readRpc(
  response: { data: unknown; error: PostgrestError | null },
  operation: string,
): unknown {
  if (response.error || !response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw databaseFailure(operation, response.error)
  }
  return response.data
}

function databaseFailure(operation: string, error?: PostgrestError | null): Error {
  return new Error(`${operation} failed at the private canonical persistence boundary${error?.code ? ` (${error.code})` : ''}.`)
}
