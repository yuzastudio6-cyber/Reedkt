import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION,
  type CanonicalSourceLedChatExchange,
  type CanonicalSourceLedChatThread,
} from '../../src/types/canonical-source-led-chat-direction'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import { withPlanningDomainMutationLock } from './planning-domain-mutation-lock'
import {
  kimiK3SourceLedChatAssistantRuntimeSchema,
} from './kimi-k3-source-led-chat-assistant'

const PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE =
  'private_canonical_source_led_chat_store' as const
const MAX_CHAT_RECORD_BYTES = 2 * 1024 * 1024
export const MAX_CANONICAL_SOURCE_LED_CHAT_EXCHANGES = 256
export const MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS = 256

export interface CanonicalSourceLedChatStoreScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

interface CanonicalSourceLedChatIdempotencyRecord {
  readonly idempotencyKey: string
  readonly requestHashSha256: string
  readonly exchangeId: string
  readonly completedAt: string
}

export interface PrivateCanonicalSourceLedChatRecord {
  readonly schemaVersion: typeof CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
  readonly source: typeof PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly revision: number
  readonly exchanges: CanonicalSourceLedChatExchange[]
  readonly idempotencyRecords: CanonicalSourceLedChatIdempotencyRecord[]
  readonly createdAt: string
  readonly updatedAt: string
  readonly privateInternalOnly: true
}

interface PersistedCanonicalSourceLedChatRecord {
  readonly recordVersion: typeof CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
  readonly source: typeof PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE
  readonly record: PrivateCanonicalSourceLedChatRecord
  readonly checksumSha256: string
}

type StoreMutationResult<T> =
  | { readonly changed: false; readonly result: T }
  | {
      readonly changed: true
      readonly record: PrivateCanonicalSourceLedChatRecord
      readonly result: T
    }

const safeIdSchema = z.string()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const isoSchema = z.string().datetime({ offset: true })
const requestedSettingsSchema = z.object({
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', '4:3']).optional(),
  cleanupPreference: z.enum([
    'preserve_natural',
    'light_cleanup',
    'balanced_cleanup',
    'tight_retention_cleanup',
    'aggressive_cleanup',
    'documentary_faithful',
    'tutorial_complete',
    'custom',
  ]).optional(),
  visualPreference: z.enum([
    'let_ai_decide',
    'keep_visuals_minimal',
    'balanced_visual_mix',
    'more_stroke_motion',
    'more_graphic_design',
    'real_motion_if_useful',
    'no_extra_visuals',
  ]).optional(),
  workflowType: z.enum([
    'simple_clean_edit',
    'social_short_viral_clip',
    'talking_head_personal_brand',
    'podcast_clip',
    'vlog_lifestyle',
    'product_demo',
    'real_estate_property_tour',
    'education_explainer',
    'marketing_ad',
    'testimonial_case_study',
    'custom_let_ai_decide',
  ]).optional(),
  moodStyle: z.enum([
    'clean',
    'premium',
    'cinematic',
    'energetic',
    'emotional',
    'educational',
    'luxury',
    'funny_playful',
    'corporate',
    'viral_fast_paced',
    'let_ai_decide',
  ]).optional(),
  creditPreference: z.enum([
    'low_credit_cost',
    'balanced',
    'premium_best_result',
    'let_ai_estimate',
  ]).optional(),
  targetPlatform: z.enum([
    'tiktok_reels_shorts',
    'youtube',
    'website',
    'course_training',
    'client_review',
    'custom',
  ]).optional(),
}).strict()
const setupFieldSchema = z.enum([
  'output_frame',
  'cleanup_preference',
  'visual_direction',
  'workflow_context',
  'mood',
  'cost_posture',
  'destination',
])
const exchangeSchema = z.object({
  exchangeId: safeIdSchema,
  clientMessageId: safeIdSchema,
  revision: z.number().int().positive(),
  userMessage: z.object({
    id: safeIdSchema,
    content: z.string().min(1).max(4_000),
    contentDigestSha256: sha256Schema,
    createdAt: isoSchema,
  }).strict(),
  assistantMessage: z.object({
    id: safeIdSchema,
    content: z.string().min(1).max(4_000),
    createdAt: isoSchema,
  }).strict(),
  assistantRuntime: kimiK3SourceLedChatAssistantRuntimeSchema.optional(),
  effect: z.object({
    status: z.enum([
      'applied_to_next_plan',
      'waiting_for_setup_confirmation',
      'waiting_for_ai_response',
      'not_applied',
    ]),
    activeForPlanning: z.boolean(),
    requestedSettings: requestedSettingsSchema,
    requiredSetupConfirmations: z.array(setupFieldSchema).max(7),
    unsupportedRequests: z.array(
      z.literal('edit_level_not_exposed_in_internal_testing'),
    ).max(1),
    draftPlanInvalidated: z.boolean(),
    executionStarted: z.literal(false),
    creditsReservedOrSpent: z.literal(false),
  }).strict(),
}).strict()
const privateRecordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION),
  source: z.literal(PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE),
  ownerUserId: safeIdSchema,
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  revision: z.number().int().nonnegative(),
  exchanges: z.array(exchangeSchema).max(MAX_CANONICAL_SOURCE_LED_CHAT_EXCHANGES),
  idempotencyRecords: z.array(z.object({
    idempotencyKey: z.string().min(1).max(240),
    requestHashSha256: sha256Schema,
    exchangeId: safeIdSchema,
    completedAt: isoSchema,
  }).strict()).max(MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS),
  createdAt: isoSchema,
  updatedAt: isoSchema,
  privateInternalOnly: z.literal(true),
}).strict()

export async function readPrivateCanonicalSourceLedChatRecord(
  scope: CanonicalSourceLedChatStoreScope,
): Promise<PrivateCanonicalSourceLedChatRecord | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalSourceLedChatRecordRelativePath(scope),
  })
  if (!content) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw invalidStoredChat('The saved edit-chat record is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalidStoredChat('The saved edit-chat record is not an object.')
  }
  const envelope = parsed as Partial<PersistedCanonicalSourceLedChatRecord>
  if (
    envelope.recordVersion !== CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
    || envelope.source !== PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE
    || !envelope.record
    || typeof envelope.checksumSha256 !== 'string'
  ) {
    throw invalidStoredChat('The saved edit-chat record envelope is invalid.')
  }
  const validated = privateRecordSchema.safeParse(envelope.record)
  if (!validated.success) {
    throw invalidStoredChat(
      'The saved edit-chat record shape is invalid.',
      validated.error.flatten(),
    )
  }
  const record = validated.data as PrivateCanonicalSourceLedChatRecord
  if (envelope.checksumSha256 !== canonicalSourceLedChatChecksum(record)) {
    throw invalidStoredChat('The saved edit-chat record checksum is invalid.')
  }
  assertChatScope(record, scope)
  assertChatLineage(record)
  return record
}

export async function mutatePrivateCanonicalSourceLedChatRecord<T>(input: {
  readonly scope: CanonicalSourceLedChatStoreScope
  readonly mutation: (
    current: PrivateCanonicalSourceLedChatRecord | undefined,
  ) => Promise<StoreMutationResult<T>> | StoreMutationResult<T>
}): Promise<T> {
  return withPlanningDomainMutationLock(input.scope, async () => {
    const current = await readPrivateCanonicalSourceLedChatRecord(input.scope)
    const mutation = await input.mutation(current)
    if (!mutation.changed) return mutation.result

    assertChatScope(mutation.record, input.scope)
    assertChatLineage(mutation.record)
    const envelope: PersistedCanonicalSourceLedChatRecord = {
      recordVersion: CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION,
      source: PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE,
      record: mutation.record,
      checksumSha256: canonicalSourceLedChatChecksum(mutation.record),
    }
    const content = `${JSON.stringify(envelope)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_CHAT_RECORD_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'This private edit chat reached its safe storage capacity.',
        503,
        { byteLength, maxBytes: MAX_CHAT_RECORD_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: canonicalSourceLedChatRecordRelativePath(input.scope),
      content,
    })
    return mutation.result
  })
}

export function projectPrivateCanonicalSourceLedChatThread(
  scope: CanonicalSourceLedChatStoreScope,
  record?: PrivateCanonicalSourceLedChatRecord,
): CanonicalSourceLedChatThread {
  return {
    schemaVersion: CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION,
    source: PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    revision: record?.revision ?? 0,
    exchanges: structuredClone(record?.exchanges ?? []),
    activeInstructionHistory: (record?.exchanges ?? [])
      .filter((exchange) => exchange.effect.activeForPlanning)
      .map((exchange) => exchange.userMessage.content),
    updatedAt: record?.updatedAt ?? null,
    privateInternalOnly: true,
    providerModelCalled: (record?.exchanges ?? []).some(
      (exchange) => exchange.assistantRuntime?.modelCallMade === true,
    ),
    planCreated: false,
    executionStarted: false,
    creditsReservedOrSpent: false,
  }
}

export function createEmptyPrivateCanonicalSourceLedChatRecord(
  scope: CanonicalSourceLedChatStoreScope,
  timestamp: string,
): PrivateCanonicalSourceLedChatRecord {
  return {
    schemaVersion: CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION,
    source: PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    revision: 0,
    exchanges: [],
    idempotencyRecords: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    privateInternalOnly: true,
  }
}

export function canonicalSourceLedChatRequestHash(value: unknown): string {
  return sha256(stableStringify(value))
}

export function canonicalSourceLedChatRecordRelativePath(
  scope: Omit<CanonicalSourceLedChatStoreScope, 'localStorageRoot'>,
): string {
  return [
    'canonical-source-led-chat',
    'private-internal-v1',
    `scope-${canonicalSourceLedChatScopeHash(scope)}.json`,
  ].join('/')
}

function canonicalSourceLedChatScopeHash(
  scope: Omit<CanonicalSourceLedChatStoreScope, 'localStorageRoot'>,
): string {
  return sha256([
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ].join('\u0000'))
}

function canonicalSourceLedChatChecksum(
  record: PrivateCanonicalSourceLedChatRecord,
): string {
  return sha256(stableStringify(record))
}

function assertChatScope(
  record: PrivateCanonicalSourceLedChatRecord,
  scope: CanonicalSourceLedChatStoreScope,
): void {
  if (
    record.schemaVersion !== CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
    || record.source !== PRIVATE_SOURCE_LED_CHAT_STORE_SOURCE
    || record.ownerUserId !== scope.ownerUserId
    || record.workspaceId !== scope.workspaceId
    || record.projectId !== scope.projectId
    || record.editSessionId !== scope.editSessionId
    || record.privateInternalOnly !== true
  ) {
    throw invalidStoredChat('The saved edit-chat tenancy scope is invalid.')
  }
}

function assertChatLineage(record: PrivateCanonicalSourceLedChatRecord): void {
  if (
    record.revision !== record.exchanges.length
    || record.exchanges.some((exchange, index) => exchange.revision !== index + 1)
  ) {
    throw invalidStoredChat('The saved edit-chat revision lineage is invalid.')
  }
  const exchangeIds = new Set(record.exchanges.map((exchange) => exchange.exchangeId))
  const clientMessageIds = new Set(
    record.exchanges.map((exchange) => exchange.clientMessageId),
  )
  const messageIds = new Set(record.exchanges.flatMap((exchange) => [
    exchange.userMessage.id,
    exchange.assistantMessage.id,
  ]))
  const idempotencyKeys = new Set(
    record.idempotencyRecords.map((entry) => entry.idempotencyKey),
  )
  if (
    exchangeIds.size !== record.exchanges.length
    || clientMessageIds.size !== record.exchanges.length
    || messageIds.size !== record.exchanges.length * 2
    || idempotencyKeys.size !== record.idempotencyRecords.length
    || record.idempotencyRecords.some((entry) => !exchangeIds.has(entry.exchangeId))
  ) {
    throw invalidStoredChat('The saved edit-chat identity lineage is invalid.')
  }
  if (record.exchanges.some((exchange) =>
    exchange.userMessage.contentDigestSha256 !== sha256(exchange.userMessage.content)
  )) {
    throw invalidStoredChat('The saved edit-chat message digest is invalid.')
  }
  if (record.exchanges.some((exchange) => {
    const runtime = exchange.assistantRuntime
    return (
      exchange.effect.status === 'waiting_for_ai_response'
        ? runtime === undefined || runtime.status === 'completed'
        : runtime !== undefined && runtime.status !== 'completed'
    )
  })) {
    throw invalidStoredChat(
      'The saved edit-chat AI response state is inconsistent.',
    )
  }
}

function invalidStoredChat(message: string, details?: unknown): ApiError {
  return new ApiError(
    'INTERNAL_ERROR',
    message,
    500,
    details,
    { internal: true },
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableJsonValue(entry)]),
  )
}
