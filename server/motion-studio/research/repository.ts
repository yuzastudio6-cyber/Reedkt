import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { motionStudioResearchWorkspaceDtoSchema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioResearchFixtureReceipt,
  MotionStudioResearchRepository,
} from './types'

const uuid = z.string().uuid()
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)

const externalSummarySchema = z.object({
  state: z.enum([
    'not_requested', 'authorized', 'preflight_passed', 'processing',
    'reconciliation', 'needs_review', 'approved', 'rejected', 'blocked',
    'failure', 'cancelled',
  ]),
  requestCount: safeInteger,
  capturedRecordCount: safeInteger,
  binaryCaptureCount: z.number().int().min(0).max(1).refine(Number.isSafeInteger),
  externalSourceCount: safeInteger,
  openQuestionCount: safeInteger,
  openQuestions: z.array(z.string().trim().min(1).max(2_000)).max(64).readonly(),
  reviewOnlyCandidateCount: safeInteger,
  externalRetrievalPerformed: z.boolean(),
  finalAssetRegistrationAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  updatedAt: z.string().datetime({ offset: true }),
}).strict()

const fixtureReceiptSchema: z.ZodType<MotionStudioResearchFixtureReceipt> = z.object({
  productionId: uuid,
  approvedStoryUnderstandingVersionId: uuid,
  researchPackVersionId: uuid,
  claimLedgerVersionId: uuid,
  visualCoverageVersionId: uuid,
  referenceContractVersionId: uuid,
  sourceCount: z.literal(3),
  evidenceCount: z.literal(4),
  claimCount: z.literal(3),
  chronologyCount: z.literal(2),
  visualNeedCount: z.literal(2),
  candidateCount: z.literal(2),
  techniqueBlueprintCount: z.literal(1),
  maximumAuthorizedInternalCostMicros: z.literal(0),
  externalRetrievalPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  providerCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  localFixtureOnly: z.literal(true),
}).strict()

export function createSupabaseMotionStudioResearchRepository(
  client: SupabaseClient,
): MotionStudioResearchRepository {
  return {
    async getWorkspace(input) {
      const [workspaceResponse, externalResponse] = await Promise.all([
        client.rpc('get_motion_studio_research_workspace', {
          target_production_id: input.productionId,
          target_actor_user_id: input.actorUserId,
        }),
        client.rpc('get_motion_studio_research_external_summary', {
          target_production_id: input.productionId,
          target_actor_user_id: input.actorUserId,
        }),
      ])
      const workspace = readRawRequired(workspaceResponse, 'browser-safe Storytelling research workspace')
      const externalEvidence = readRequired(
        externalResponse,
        externalSummarySchema,
        'browser-safe bounded external research summary',
      )
      const externalRetrievalPerformed = externalEvidence.externalRetrievalPerformed
      return readRequired(
        {
          data: mergeExternalSummary(workspace, externalEvidence, externalRetrievalPerformed),
          error: null,
        },
        motionStudioResearchWorkspaceDtoSchema,
        'browser-safe Storytelling research workspace',
      )
    },
    async seedFixture(input) {
      return readRequired(
        await client.rpc('seed_motion_studio_research_fixture', {
          target_production_id: input.productionId,
          target_story_understanding_version_id: input.storyUnderstandingVersionId,
          target_research_pack_version_id: input.researchPackVersionId,
          target_claim_ledger_version_id: input.claimLedgerVersionId,
          target_visual_coverage_version_id: input.visualCoverageVersionId,
          target_reference_contract_version_id: input.referenceContractVersionId,
          target_actor_user_id: input.actorUserId,
          target_idempotency_key: input.idempotencyKey,
          target_request_hash: input.requestHash,
        }),
        fixtureReceiptSchema,
        'fixture-only Storytelling research seed',
      )
    },
  }
}

function mergeExternalSummary(
  workspace: Record<string, unknown>,
  externalEvidence: z.infer<typeof externalSummarySchema>,
  externalRetrievalPerformed: boolean,
): Record<string, unknown> {
  const scope = asRecord(workspace.scope)
  const state = externalStateOverridesWorkspace(externalEvidence.state)
    ? externalEvidence.state
    : workspace.state
  return {
    ...workspace,
    state,
    scope: {
      ...scope,
      fixtureOnly: !externalRetrievalPerformed,
      externalRetrievalAllowed: false,
      maximumAuthorizedInternalCostMicros: 0,
    },
    externalEvidence: {
      state: externalEvidence.state,
      requestCount: externalEvidence.requestCount,
      capturedRecordCount: externalEvidence.capturedRecordCount,
      binaryCaptureCount: externalEvidence.binaryCaptureCount,
      externalSourceCount: externalEvidence.externalSourceCount,
      openQuestionCount: externalEvidence.openQuestionCount,
      openQuestions: externalEvidence.openQuestions,
      reviewOnlyCandidateCount: externalEvidence.reviewOnlyCandidateCount,
      finalAssetRegistrationAllowed: false,
      timelineMutationAllowed: false,
      updatedAt: externalEvidence.updatedAt,
    },
    externalRetrievalPerformed,
    localFixtureOnly: !externalRetrievalPerformed,
    providerCallMade: false,
    providerCostMicros: 0,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
    updatedAt: latestIsoDate(workspace.updatedAt, externalEvidence.updatedAt),
  }
}

function externalStateOverridesWorkspace(state: z.infer<typeof externalSummarySchema>['state']): state is 'processing' | 'reconciliation' | 'blocked' | 'failure' | 'cancelled' {
  return ['processing', 'reconciliation', 'blocked', 'failure', 'cancelled'].includes(state)
}

function latestIsoDate(left: unknown, right: string): string {
  if (typeof left !== 'string' || Number.isNaN(Date.parse(left))) return right
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function readRawRequired(
  response: { data: unknown; error: PostgrestError | null },
  label: string,
): Record<string, unknown> {
  if (response.error) throw databaseError(label, response.error)
  if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw new ApiError('INTERNAL_ERROR', `${label} returned an invalid record.`, 500, undefined, { internal: true })
  }
  return response.data as Record<string, unknown>
}

function readRequired<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T {
  if (response.error) throw databaseError(label, response.error)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    throw new ApiError(
      'INTERNAL_ERROR',
      `${label} returned an invalid sanitized record.`,
      500,
      undefined,
      { internal: true },
    )
  }
  return parsed.data
}

function databaseError(label: string, error: PostgrestError): ApiError {
  const status = error.code === '42501' ? 403
    : error.code === 'P0002' ? 404
      : ['22023', '23514'].includes(error.code) ? 400
        : ['23503', '23505', '55000'].includes(error.code) ? 409 : 500
  return new ApiError(
    status === 403 ? 'WORKSPACE_ACCESS_DENIED'
      : status === 404 ? 'MOTION_STUDIO_NOT_FOUND'
        : status === 400 ? 'VALIDATION_FAILED'
          : status === 409 ? 'MOTION_STUDIO_CONFLICT' : 'INTERNAL_ERROR',
    `${label} could not be persisted.`,
    status,
  )
}
