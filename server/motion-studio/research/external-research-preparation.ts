import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MS011B_EXT001_RUN_IDENTITY,
  type Ms011bExternalRunIdentity,
} from './external-run-identity'

export const MS011B_LIVE_RUN_ID = MS011B_EXT001_RUN_IDENTITY.runId
export const MS011B_OWNER_USER_ID = '00000000-0000-4000-8000-00000000a001' as const
export const MS011B_WORKSPACE_ID = '10000000-0000-4000-8000-00000000a001' as const
export const MS011B_PROJECT_ID = '20000000-0000-4000-8000-00000000a001' as const
export const MS011B_EDIT_SESSION_ID = 'edit-a-ms011b' as const
export const MS011B_OWNER_AUTHORITY_RECORDED_AT = '2026-07-16T23:45:13.000Z' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const gitObject = z.string().regex(/^[a-f0-9]{40}$/)
const uuid = z.string().uuid()

const productionReceiptSchema = z.object({
  productionId: uuid,
  workspaceId: z.literal(MS011B_WORKSPACE_ID),
  projectId: z.literal(MS011B_PROJECT_ID),
  editSessionId: z.literal(MS011B_EDIT_SESSION_ID),
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
}).passthrough()

const researchFixtureReceiptSchema = z.object({
  productionId: uuid,
  localFixtureOnly: z.literal(true),
  externalRetrievalPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  providerCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).passthrough()

const costReceiptSchema = z.object({
  estimateId: z.string().min(1),
  maximumAuthorizedInternalCostMicros: z.literal(250_000),
  expectedInternalCostMicros: z.literal(79_912),
  workItemKey: z.string().min(1),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).strict()

export interface Ms011bPreparedRun {
  runId: string
  productionId: string
  actorUserId: typeof MS011B_OWNER_USER_ID
  candidateCommitSha: string
  candidateTreeSha: string
  preflightEvidenceDigest: string
  latestState: 'preflight_passed'
  maximumAuthorizedInternalCostMicros: 250_000
  externalRequestsPerformed: 0
  providerCallsPerformed: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

const artifactDefinitions = Object.freeze([
  ['71000000-0000-4000-8000-00000000b011', '71100000-0000-4000-8000-00000000b011', 'story_bible', 'approved', 'a'],
  ['72000000-0000-4000-8000-00000000b011', '72100000-0000-4000-8000-00000000b011', 'research_pack', 'in_review', 'b'],
  ['73000000-0000-4000-8000-00000000b011', '73100000-0000-4000-8000-00000000b011', 'claim_ledger', 'in_review', 'c'],
  ['74000000-0000-4000-8000-00000000b011', '74100000-0000-4000-8000-00000000b011', 'visual_coverage_plan', 'in_review', 'd'],
  ['75000000-0000-4000-8000-00000000b011', '75100000-0000-4000-8000-00000000b011', 'reference_contract', 'in_review', 'e'],
] as const)

const rateDefinitions = Object.freeze([
  ['ms011b-rate-http-v1', 'ms011b-http-control', 'request', 1_000, 'exact_per_begun_request', '1'],
  ['ms011b-rate-capture-v1', 'ms011b-capture-processing', 'network_egress_gib', 2_097_152, 'ceil_each_response_kib', '2'],
  ['ms011b-rate-storage-v1', 'ms011b-private-storage', 'storage_gib_hour', 2_097_152, 'ceil_each_capture_kib', '3'],
  ['ms011b-rate-cpu-v1', 'ms011b-local-cpu', 'cpu_second', 1_000, 'ceil_each_attempt_second', '4'],
  ['ms011b-rate-qa-v1', 'ms011b-quality-control', 'request', 500, 'exact_per_qa_event', '5'],
] as const)

export async function prepareMs011bExternalResearchRun(input: {
  client: SupabaseClient
  candidateCommitSha: string
  candidateTreeSha: string
  preflightEvidenceDigest: string
  identity?: Ms011bExternalRunIdentity
}): Promise<Ms011bPreparedRun> {
  const identity = input.identity ?? MS011B_EXT001_RUN_IDENTITY
  gitObject.parse(input.candidateCommitSha)
  gitObject.parse(input.candidateTreeSha)
  digest.parse(input.preflightEvidenceDigest)
  await assertOwnerScope(input.client)

  await ensureRow(input.client, 'edit_sessions', 'id', {
    id: MS011B_EDIT_SESSION_ID,
    workspace_id: MS011B_WORKSPACE_ID,
    project_id: MS011B_PROJECT_ID,
    owner_id: MS011B_OWNER_USER_ID,
    name: 'MS-011B Bounded External Research Fixture',
  })

  const production = productionReceiptSchema.parse(readRpc(await input.client.rpc(
    'create_motion_studio_module_production',
    {
      target_edit_session_id: MS011B_EDIT_SESSION_ID,
      target_actor_user_id: MS011B_OWNER_USER_ID,
      target_module_id: 'storytelling',
      target_module_catalog_version: 'motion-studio-module-catalog-v1',
      target_idempotency_key: 'ms011b-production',
      target_request_hash: '1'.repeat(64),
    },
  ), 'Storytelling production preparation'))

  for (const [artifactId, versionId, kind, state, digestCharacter] of artifactDefinitions) {
    await ensureRow(input.client, 'motion_studio_artifacts', 'id', {
      id: artifactId,
      workspace_id: MS011B_WORKSPACE_ID,
      project_id: MS011B_PROJECT_ID,
      edit_session_id: MS011B_EDIT_SESSION_ID,
      production_id: production.productionId,
      kind,
      created_by: MS011B_OWNER_USER_ID,
    })
    await ensureRow(input.client, 'motion_studio_artifact_versions', 'id', {
      id: versionId,
      workspace_id: MS011B_WORKSPACE_ID,
      project_id: MS011B_PROJECT_ID,
      edit_session_id: MS011B_EDIT_SESSION_ID,
      production_id: production.productionId,
      artifact_id: artifactId,
      kind,
      version_number: 1,
      state,
      payload_json: {
        schemaVersion: 'motion-studio.ms011b-fixture.v1',
        data: { fixture: kind },
        references: [],
        extensions: [],
      },
      content_digest: digestCharacter.repeat(64),
      provenance_json: {
        createdBy: { actorKind: 'system', actorId: 'ms011b-fixture' },
        sourceArtifactVersionIds: [],
        sourceAssetIds: [],
        skillRunIds: [],
        toolRunIds: [],
        providerAttemptIds: [],
        createdAt: '2026-07-16T12:00:00.000Z',
      },
      created_by: MS011B_OWNER_USER_ID,
    })
    await ensureArtifactPointer(input.client, artifactId, state === 'approved'
      ? { current_approved_version_id: versionId }
      : { current_draft_version_id: versionId })
  }

  const fixture = researchFixtureReceiptSchema.parse(readRpc(await input.client.rpc(
    'seed_motion_studio_research_fixture',
    {
      target_production_id: production.productionId,
      target_story_understanding_version_id: artifactDefinitions[0][1],
      target_research_pack_version_id: artifactDefinitions[1][1],
      target_claim_ledger_version_id: artifactDefinitions[2][1],
      target_visual_coverage_version_id: artifactDefinitions[3][1],
      target_reference_contract_version_id: artifactDefinitions[4][1],
      target_actor_user_id: MS011B_OWNER_USER_ID,
      target_idempotency_key: 'ms011b-research-seed',
      target_request_hash: '2'.repeat(64),
    },
  ), 'Storytelling research fixture preparation'))

  for (const [id, capability, unit, price, rounding, digestCharacter] of rateDefinitions) {
    const contentDigest = digestCharacter.repeat(64)
    await ensureRow(input.client, 'provider_rate_card_versions', 'id', {
      id,
      provider_capability: capability,
      provider_adapter_id: 'ms011b-local-internal',
      model_or_service: `MS-011B local bounded evidence ${capability}`,
      version: 'v1',
      content_digest: contentDigest,
      effective_from: '2026-07-16T12:00:00.000Z',
      unit,
      unit_price_micros: price,
      rounding_rule: rounding,
      source_reference: {
        kind: 'audit_record',
        evidenceVersionId: `${id}-evidence`,
        evidenceDigest: contentDigest,
        capturedAt: '2026-07-16T12:00:00Z',
        sourceSystem: 'reeditpro_audit',
        provenanceClass: 'rate_card_verification',
        auditRecordId: `${id}-audit`,
      },
      verified_at: '2026-07-16T12:00:00.000Z',
    })
  }

  const costReceipt = costReceiptSchema.parse(readRpc(await input.client.rpc(identity.createCostEstimateRpc, {
    target_production_id: production.productionId,
    target_actor_user_id: MS011B_OWNER_USER_ID,
    target_expires_at: '2030-07-16T23:45:13.000Z',
  }), 'bounded external cost authorization'))
  if (costReceipt.estimateId !== identity.costEstimateId || costReceipt.workItemKey !== identity.workItemKey) {
    throw new Error('Bounded external cost authorization returned a different run identity profile.')
  }

  if (fixture.productionId !== production.productionId) {
    throw new Error('Storytelling research fixture returned a different production identity.')
  }
  const researchScope = await readSingle(input.client, 'motion_studio_research_scopes', [
    'id', 'story_understanding_artifact_id', 'story_understanding_version_id',
    'story_understanding_content_digest',
  ], 'production_id', production.productionId)
  const researchScopeId = requiredString(researchScope.id)

  const authorizationRecordId = `${identity.authorizationRecordIdPrefix}${production.productionId}`
  await ensureRow(input.client, 'motion_studio_research_external_authorizations', 'id', {
    id: authorizationRecordId,
    authorization_id: identity.authorizationId,
    workspace_id: MS011B_WORKSPACE_ID,
    project_id: MS011B_PROJECT_ID,
    edit_session_id: MS011B_EDIT_SESSION_ID,
    production_id: production.productionId,
    research_scope_id: researchScopeId,
    story_understanding_artifact_id: requiredString(researchScope.story_understanding_artifact_id),
    story_understanding_version_id: requiredString(researchScope.story_understanding_version_id),
    story_understanding_content_digest: requiredString(researchScope.story_understanding_content_digest),
    authority_digest: identity.authorityFileSha256,
    request_template_digest: identity.compiledRequestTemplateDigest,
    maximum_http_requests: 3,
    maximum_binary_downloads: 1,
    maximum_automatic_retries: 0,
    maximum_fallback_requests: 0,
    maximum_captured_bytes: 9_961_472,
    maximum_authorized_internal_cost_micros: 250_000,
    timeout_milliseconds: 10_000,
    single_use: true,
    owner_authorized_at: identity.ownerAuthorizedAt,
    created_by: MS011B_OWNER_USER_ID,
  })

  const runRequestHash = sha256CanonicalJson({
    authorizationId: identity.authorizationId,
    candidateCommitSha: input.candidateCommitSha,
    candidateTreeSha: input.candidateTreeSha,
    compiledRequestDigest: identity.compiledRequestTemplateDigest,
    preflightEvidenceDigest: input.preflightEvidenceDigest,
    productionId: production.productionId,
  })
  await ensureRow(input.client, 'motion_studio_research_external_runs', 'id', {
    id: identity.runId,
    authorization_record_id: authorizationRecordId,
    workspace_id: MS011B_WORKSPACE_ID,
    project_id: MS011B_PROJECT_ID,
    edit_session_id: MS011B_EDIT_SESSION_ID,
    production_id: production.productionId,
    research_pack_artifact_id: artifactDefinitions[1][0],
    research_pack_version_id: artifactDefinitions[1][1],
    research_pack_content_digest: 'b'.repeat(64),
    claim_ledger_artifact_id: artifactDefinitions[2][0],
    claim_ledger_version_id: artifactDefinitions[2][1],
    claim_ledger_content_digest: 'c'.repeat(64),
    visual_coverage_artifact_id: artifactDefinitions[3][0],
    visual_coverage_version_id: artifactDefinitions[3][1],
    visual_coverage_content_digest: 'd'.repeat(64),
    cost_estimate_id: identity.costEstimateId,
    work_item_key: identity.workItemKey,
    candidate_commit_sha: input.candidateCommitSha,
    candidate_tree_sha: input.candidateTreeSha,
    compiled_request_digest: identity.compiledRequestTemplateDigest,
    idempotency_key: identity.idempotencyKey,
    request_hash: runRequestHash,
    created_by: MS011B_OWNER_USER_ID,
  })

  await ensureRow(input.client, 'motion_studio_research_external_run_events', 'id', {
    id: `${identity.runEventIdPrefix}1`,
    run_id: identity.runId,
    workspace_id: MS011B_WORKSPACE_ID,
    project_id: MS011B_PROJECT_ID,
    edit_session_id: MS011B_EDIT_SESSION_ID,
    production_id: production.productionId,
    sequence_number: 1,
    prior_event_id: null,
    state: 'authorized',
    evidence_digest: sha256CanonicalJson({
      authorizationId: identity.authorizationId,
      authorityDigest: identity.authorityFileSha256,
      ownerAuthorityRecordedAt: identity.ownerAuthorizedAt,
    }),
    reason_code: 'owner-authority-recorded',
    created_by: MS011B_OWNER_USER_ID,
  })
  await ensureRow(input.client, 'motion_studio_research_external_run_events', 'id', {
    id: `${identity.runEventIdPrefix}2`,
    run_id: identity.runId,
    workspace_id: MS011B_WORKSPACE_ID,
    project_id: MS011B_PROJECT_ID,
    edit_session_id: MS011B_EDIT_SESSION_ID,
    production_id: production.productionId,
    sequence_number: 2,
    prior_event_id: `${identity.runEventIdPrefix}1`,
    state: 'preflight_passed',
    evidence_digest: input.preflightEvidenceDigest,
    reason_code: 'exact-preflight-passed',
    created_by: MS011B_OWNER_USER_ID,
  })

  const latest = await readLatestEvent(input.client, identity.runId)
  if (latest.state !== 'preflight_passed' || Number(latest.sequence_number) !== 2 ||
      latest.evidence_digest !== input.preflightEvidenceDigest) {
    throw new Error('Prepared external research run does not preserve the exact unconsumed preflight state.')
  }
  return {
    runId: identity.runId,
    productionId: production.productionId,
    actorUserId: MS011B_OWNER_USER_ID,
    candidateCommitSha: input.candidateCommitSha,
    candidateTreeSha: input.candidateTreeSha,
    preflightEvidenceDigest: input.preflightEvidenceDigest,
    latestState: 'preflight_passed',
    maximumAuthorizedInternalCostMicros: 250_000,
    externalRequestsPerformed: 0,
    providerCallsPerformed: 0,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
  }
}

async function assertOwnerScope(client: SupabaseClient): Promise<void> {
  const workspace = await readSingle(client, 'workspaces', ['id', 'owner_id'], 'id', MS011B_WORKSPACE_ID)
  const project = await readSingle(client, 'projects', ['id', 'workspace_id', 'owner_id'], 'id', MS011B_PROJECT_ID)
  const membership = await readSingle(client, 'workspace_members', ['workspace_id', 'user_id', 'role'], 'id',
    '11000000-0000-4000-8000-00000000a001')
  if (workspace.owner_id !== MS011B_OWNER_USER_ID || project.workspace_id !== MS011B_WORKSPACE_ID ||
      project.owner_id !== MS011B_OWNER_USER_ID || membership.workspace_id !== MS011B_WORKSPACE_ID ||
      membership.user_id !== MS011B_OWNER_USER_ID || membership.role !== 'owner') {
    throw new Error('Local canonical owner scope differs from the exact MS-011B fixture authority.')
  }
}

async function ensureArtifactPointer(
  client: SupabaseClient,
  artifactId: string,
  pointer: { current_approved_version_id: string } | { current_draft_version_id: string },
): Promise<void> {
  const approved = 'current_approved_version_id' in pointer
  const field = approved ? 'current_approved_version_id' : 'current_draft_version_id'
  const expected = approved ? pointer.current_approved_version_id : pointer.current_draft_version_id
  const existing = await readSingle(client, 'motion_studio_artifacts', ['id', field], 'id', artifactId)
  if (existing[field] === expected) return
  if (existing[field] !== null) throw new Error('MS-011B artifact pointer already has different immutable authority.')
  const response = await client.from('motion_studio_artifacts').update({
    [field]: expected,
    record_version: 2,
  } as never).eq('id', artifactId).is(field, null)
  if (response.error) throw databaseFailure('MS-011B artifact pointer preparation', response.error)
  const readback = await readSingle(client, 'motion_studio_artifacts', ['id', field], 'id', artifactId)
  if (readback[field] !== expected) throw new Error('MS-011B artifact pointer preparation did not persist exactly.')
}

async function ensureRow(
  client: SupabaseClient,
  table: string,
  keyField: string,
  expected: Record<string, unknown>,
): Promise<void> {
  const response = await client.from(table).insert(expected as never)
  if (!response.error) return
  const key = expected[keyField]
  if (typeof key !== 'string') throw databaseFailure(`${table} preparation`, response.error)
  const existing = await readSingle(client, table, Object.keys(expected), keyField, key)
  if (sha256CanonicalJson(normalizeForComparison(existing)) !==
      sha256CanonicalJson(normalizeForComparison(expected))) {
    throw databaseFailure(`${table} immutable preparation conflict`, response.error)
  }
}

async function readLatestEvent(client: SupabaseClient, runId: string): Promise<Record<string, unknown>> {
  const response = await client.from('motion_studio_research_external_run_events')
    .select('sequence_number,state,evidence_digest')
    .eq('run_id', runId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single()
  if (response.error || !response.data) throw databaseFailure('MS-011B prepared event readback', response.error)
  return response.data as unknown as Record<string, unknown>
}

async function readSingle(
  client: SupabaseClient,
  table: string,
  columns: readonly string[],
  field: string,
  value: string,
): Promise<Record<string, unknown>> {
  const response = await client.from(table).select(columns.join(',')).eq(field, value).single()
  if (response.error || !response.data) throw databaseFailure(`${table} readback`, response.error)
  return response.data as unknown as Record<string, unknown>
}

function readRpc(response: { data: unknown; error: PostgrestError | null }, operation: string): unknown {
  if (response.error || !response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw databaseFailure(operation, response.error)
  }
  return response.data
}

function normalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForComparison)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    if ((key.endsWith('_at') || key === 'effective_from') && typeof item === 'string' && Number.isFinite(Date.parse(item))) {
      return [key, new Date(item).toISOString()]
    }
    return [key, normalizeForComparison(item)]
  }))
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error('MS-011B canonical authority readback is incomplete.')
  return value
}

function databaseFailure(operation: string, error?: PostgrestError | null): Error {
  return new Error(`${operation} failed at the loopback-only canonical service boundary${error?.code ? ` (${error.code})` : ''}.`)
}
