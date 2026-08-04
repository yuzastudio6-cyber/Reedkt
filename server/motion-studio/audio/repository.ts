import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { motionStudioAudioWorkspaceDtoSchema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioAudioPersistenceReceipt,
  MotionStudioAudioRepository,
} from './types'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)

const persistenceReceiptSchema: z.ZodType<MotionStudioAudioPersistenceReceipt> = z.object({
  audioAuthorityId: uuid,
  productionId: uuid,
  approvedSnapshotId: uuid,
  preparedScriptVersionId: uuid,
  voiceBibleVersionId: uuid,
  musicBibleVersionId: uuid,
  mixPlanVersionId: uuid,
  voiceSegmentCount: z.literal(2),
  takeCandidateCount: z.literal(4),
  selectedTakeCount: z.literal(2),
  stemCount: z.literal(4),
  cueCount: z.literal(3),
  capabilityEntryCount: z.literal(9),
  inputDigest: digest,
  outputDigest: digest,
  localFixtureOnly: z.literal(true),
  providerCallMade: z.literal(false),
  mediaExecutionPerformed: z.literal(false),
  providerCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).strict()

export function createSupabaseMotionStudioAudioRepository(
  client: SupabaseClient,
): MotionStudioAudioRepository {
  return {
    async getWorkspace(input) {
      return readRequired(
        await client.rpc('get_motion_studio_audio_workspace', {
          target_production_id: input.productionId,
          target_actor_user_id: input.actorUserId,
        }),
        motionStudioAudioWorkspaceDtoSchema,
        'browser-safe Storytelling audio workspace',
      )
    },
    async persistAuthority(input) {
      return readRequired(
        await client.rpc('persist_motion_studio_audio_authority', {
          target_bundle_json: input.bundle,
          target_input_digest: input.inputDigest,
          target_output_digest: input.outputDigest,
          target_actor_user_id: input.actorUserId,
          target_idempotency_key: input.idempotencyKey,
          target_request_hash: input.requestHash,
        }),
        persistenceReceiptSchema,
        'server-owned Storytelling audio authority',
      )
    },
  }
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
    `${label} could not be read or persisted.`,
    status,
  )
}
