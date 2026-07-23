import { z } from 'zod'

import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  motionStudioArtifactInvalidationSchema,
  motionStudioArtifactPayloadSchema,
  motionStudioArtifactVersionSchema,
  motionStudioPropertyLockSchema,
  motionStudioRegisteredExtensionSchema,
  motionStudioSceneRecipeInstantiationSchema,
  validateMotionStudioDeepValue,
  validateProductionCostActualBoundary,
  validateProductionCostAdjustmentBoundary,
  validateProductionCostBudgetBoundary,
  validateProductionCostEstimateBoundary,
  validateProductionCostEstimateItemBoundary,
  validateProductionCostReconciliationBoundary,
  validateProductionUsageEventBoundary,
  validateProviderRateCardBoundary,
  validateSceneRecipeBoundary,
  validateToolCostProfileBoundary,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioArtifactVersion,
  MotionStudioProvenance,
} from '../../../src/types/motion-studio'
import type { MotionStudioPersistenceRepository } from './repository'
import type {
  AppendMotionStudioArtifactInvalidationInput,
  AppendMotionStudioCostActualInput,
  AppendMotionStudioCostAdjustmentInput,
  AppendMotionStudioCostBudgetInput,
  AppendMotionStudioCostReconciliationInput,
  AppendMotionStudioPropertyLockEventInput,
  AppendMotionStudioUsageEventInput,
  CreateMotionStudioArtifactVersionInput,
  CreateMotionStudioCostEstimateInput,
  CreateMotionStudioProductionInput,
  MotionStudioPersistedRecordReceipt,
  MotionStudioPersistenceOperation,
  MotionStudioPersistenceResult,
  RegisterMotionStudioProviderRateCardInput,
  RegisterMotionStudioRecipeInstantiationInput,
  RegisterMotionStudioSceneRecipeVersionInput,
  RegisterMotionStudioToolCostProfileInput,
} from './types'

interface MotionStudioDatabaseError {
  code?: string
  message?: string
}

interface MotionStudioDatabaseResult {
  data: unknown
  error: MotionStudioDatabaseError | null
}

interface MotionStudioInsertSelection {
  single(): PromiseLike<MotionStudioDatabaseResult>
}

interface MotionStudioInsertBuilder {
  select(columns?: string): MotionStudioInsertSelection
}

interface MotionStudioTableBuilder {
  insert(values: Record<string, unknown>): MotionStudioInsertBuilder
}

/** Server-injected subset only. This module never constructs or configures a client. */
export interface MotionStudioPersistenceClient {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<MotionStudioDatabaseResult>
  from(table: string): MotionStudioTableBuilder
}

export interface CreateMotionStudioPersistenceRepositoryInput {
  client?: MotionStudioPersistenceClient | null
}

const uuid = z.string().uuid()
const nonEmpty = z.string().trim().min(1)
const safeStableId = z.string()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Stable IDs must not contain path traversal.')
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const boundedPlainText = z.string().trim().min(1).max(2_000).refine(
  (value) => [...value].every((character) => {
    const codePoint = character.codePointAt(0)!
    return codePoint > 0x1f && codePoint !== 0x7f
  }),
  'Control characters are forbidden.',
)
const idempotencyKey = boundedPlainText.max(240)

const actorReferenceSchema = z.object({
  actorKind: z.enum(['user', 'director', 'system', 'worker', 'reviewer']),
  actorId: nonEmpty,
  displayName: z.string().optional(),
}).strict()

const provenanceSchema: z.ZodType<MotionStudioProvenance> = z.object({
  createdBy: actorReferenceSchema,
  sourceArtifactVersionIds: z.array(nonEmpty),
  sourceAssetIds: z.array(nonEmpty),
  skillRunIds: z.array(nonEmpty),
  toolRunIds: z.array(nonEmpty),
  providerAttemptIds: z.array(nonEmpty),
  createdAt: isoDate,
  extensions: z.array(motionStudioRegisteredExtensionSchema).max(64).optional(),
}).strict()

const dependencySchema = z.object({
  upstreamVersionId: uuid,
  dependencyKind: z.enum([
    'requires_exact_version', 'derives_from', 'timing_authority',
    'style_authority', 'asset_input', 'approval_input',
  ]),
  invalidationPolicy: z.enum(['always', 'material_change', 'manual_review', 'never']),
}).strict()

const productionInputSchema = z.object({
  editSessionId: safeStableId.max(160),
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  actorUserId: uuid,
  idempotencyKey,
  requestHash: digest,
}).strict()

const artifactInputSchema = z.object({
  productionId: uuid,
  artifactId: uuid.optional(),
  kind: z.enum(MOTION_STUDIO_ARTIFACT_KINDS),
  expectedCurrentDraftVersionId: uuid.optional(),
  parentVersionId: uuid.optional(),
  state: z.enum(['draft', 'in_review']),
  payload: motionStudioArtifactPayloadSchema,
  provenance: provenanceSchema,
  dependencies: z.array(dependencySchema).max(128),
  actorUserId: uuid,
  idempotencyKey,
  requestHash: digest,
}).strict().superRefine((value, context) => {
  const existingAuthority = value.artifactId !== undefined
  if (!existingAuthority && (value.expectedCurrentDraftVersionId || value.parentVersionId)) {
    context.addIssue({
      code: 'custom',
      path: ['artifactId'],
      message: 'A new artifact cannot claim prior draft or parent authority.',
    })
  }
  if (existingAuthority && value.expectedCurrentDraftVersionId !== value.parentVersionId) {
    context.addIssue({
      code: 'custom',
      path: ['parentVersionId'],
      message: 'Parent version must equal the expected current draft version.',
    })
  }
})

const productionReceiptSchema = z.object({
  productionId: uuid,
  workspaceId: uuid,
  projectId: uuid,
  editSessionId: nonEmpty,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  recordVersion: z.number().int().positive().refine(Number.isSafeInteger),
}).strict()

const artifactReceiptSchema = z.object({
  productionId: uuid,
  artifactId: uuid,
  artifactVersionId: uuid,
  versionNumber: z.number().int().positive().refine(Number.isSafeInteger),
  contentDigest: digest,
  state: z.enum(['draft', 'in_review']),
}).strict()

const estimateReceiptSchema = z.object({
  productionId: uuid,
  estimateId: safeStableId,
  itemIds: z.array(safeStableId).min(1),
  rateCardVersionIds: z.array(safeStableId).min(1),
  maximumAuthorizedInternalCostMicros: z.number().int().nonnegative().refine(Number.isSafeInteger),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).strict()

function evidence(
  writeOutcome: 'not_attempted' | 'confirmed' | 'unknown' = 'not_attempted',
): Omit<MotionStudioPersistenceResult<never>, 'ok' | 'operation'> {
  return {
    repositoryMode: 'supabase_server',
    localCandidateOnly: true,
    supabaseReadMade: false,
    supabaseWriteMade: writeOutcome !== 'not_attempted',
    supabaseWriteOutcome: writeOutcome,
    remoteDatabaseVerified: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderStarted: false,
    billingActivated: false,
    customerPricingCalculated: false,
    customerCreditsMutated: false,
  }
}

function success<T>(
  operation: MotionStudioPersistenceOperation,
  data: T,
): MotionStudioPersistenceResult<T> {
  return { ok: true, operation, data, ...evidence('confirmed') }
}

function invalid<T>(
  operation: MotionStudioPersistenceOperation,
  errors: readonly string[],
): MotionStudioPersistenceResult<T> {
  return {
    ok: false,
    operation,
    error: {
      code: 'INVALID_INPUT',
      message: 'Motion Studio persistence input failed contract validation.',
      validationErrors: [...new Set(errors)],
    },
    ...evidence(),
  }
}

function databaseFailure<T>(operation: MotionStudioPersistenceOperation): MotionStudioPersistenceResult<T> {
  return {
    ok: false,
    operation,
    error: {
      code: 'DATABASE_ERROR',
      message: 'Motion Studio local persistence operation failed.',
    },
    ...evidence('unknown'),
  }
}

function schemaErrors(result: z.ZodSafeParseResult<unknown>): string[] {
  if (result.success) return []
  return result.error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.map(String).join('.') : '$'
    return `${path}: ${issue.message}`
  })
}

function validateRequiredUuidFields(fields: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || !uuid.safeParse(value).success) errors.push(`${name}: Valid UUID required.`)
  }
  return errors
}

function validateOptionalUuidFields(fields: Record<string, string | undefined>): string[] {
  const errors: string[] = []
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined && !uuid.safeParse(value).success) errors.push(`${name}: Valid UUID required.`)
  }
  return errors
}

function validateRequiredStableFields(fields: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || !safeStableId.safeParse(value).success) errors.push(`${name}: Safe stable ID required.`)
  }
  return errors
}

function validateOptionalStableFields(fields: Record<string, string | undefined>): string[] {
  const errors: string[] = []
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined && !safeStableId.safeParse(value).success) errors.push(`${name}: Safe stable ID required.`)
  }
  return errors
}

function sameArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function uniqueInOrder(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function exactMicrosItemSum(
  items: readonly Record<string, unknown>[],
  field: string,
): bigint | null {
  let total = 0n
  for (const item of items) {
    const value = item[field]
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return null
    total += BigInt(value)
  }
  return total
}

function validateCostEvidenceStableIds(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['sourceReference: Evidence record required.']
  const record = value as Record<string, unknown>
  const fields: Record<string, string | undefined> = {
    evidenceVersionId: typeof record.evidenceVersionId === 'string' ? record.evidenceVersionId : undefined,
  }
  if (record.kind === 'rate_card_source') {
    fields.rateCardSourceRecordId = typeof record.rateCardSourceRecordId === 'string' ? record.rateCardSourceRecordId : undefined
  } else if (record.kind === 'provider_invoice') {
    fields.providerInvoiceRecordId = typeof record.providerInvoiceRecordId === 'string' ? record.providerInvoiceRecordId : undefined
    fields.providerBillingRecordId = typeof record.providerBillingRecordId === 'string' ? record.providerBillingRecordId : undefined
  } else if (record.kind === 'audit_record') {
    fields.auditRecordId = typeof record.auditRecordId === 'string' ? record.auditRecordId : undefined
  } else if (record.kind === 'source_locator') {
    const locator = record.sourceLocator
    if (locator && typeof locator === 'object' && !Array.isArray(locator)) {
      fields.sourceId = typeof (locator as Record<string, unknown>).sourceId === 'string'
        ? (locator as Record<string, unknown>).sourceId as string
        : undefined
    }
  } else if (record.kind === 'storage_object') {
    const storage = record.storageObjectRef
    if (storage && typeof storage === 'object' && !Array.isArray(storage)) {
      const storageRecord = storage as Record<string, unknown>
      fields.objectId = typeof storageRecord.objectId === 'string' ? storageRecord.objectId : undefined
      fields.bucketId = typeof storageRecord.bucketId === 'string' ? storageRecord.bucketId : undefined
    }
  }
  return validateRequiredStableFields(fields)
}

function candidateArtifactVersion(input: CreateMotionStudioArtifactVersionInput): MotionStudioArtifactVersion {
  const placeholder = '00000000-0000-4000-8000-000000000001'
  return {
    id: placeholder,
    workspaceId: placeholder,
    projectId: placeholder,
    editSessionId: 'motion-studio.validation',
    productionId: input.productionId,
    artifactId: input.artifactId ?? placeholder,
    kind: input.kind,
    versionNumber: input.parentVersionId ? 2 : 1,
    ...(input.parentVersionId ? { parentVersionId: input.parentVersionId } : {}),
    state: input.state,
    payload: input.payload,
    contentDigest: '0'.repeat(64),
    immutable: true,
    provenance: input.provenance,
    createdAt: input.provenance.createdAt,
  }
}

function disabled<T>(operation: MotionStudioPersistenceOperation): MotionStudioPersistenceResult<T> {
  return {
    ok: false,
    operation,
    error: {
      code: 'PERSISTENCE_DISABLED',
      message: 'Motion Studio persistence requires an injected server-only Supabase client.',
    },
    repositoryMode: 'disabled',
    localCandidateOnly: true,
    supabaseReadMade: false,
    supabaseWriteMade: false,
    supabaseWriteOutcome: 'not_attempted',
    remoteDatabaseVerified: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderStarted: false,
    billingActivated: false,
    customerPricingCalculated: false,
    customerCreditsMutated: false,
  }
}

export function createDisabledMotionStudioPersistenceRepository(): MotionStudioPersistenceRepository {
  return {
    createProduction: async () => disabled('create_production'),
    createArtifactVersion: async () => disabled('create_artifact_version'),
    appendArtifactInvalidation: async () => disabled('append_artifact_invalidation'),
    appendPropertyLockEvent: async () => disabled('append_property_lock_event'),
    registerSceneRecipeVersion: async () => disabled('register_scene_recipe_version'),
    registerRecipeInstantiation: async () => disabled('register_recipe_instantiation'),
    registerProviderRateCard: async () => disabled('register_provider_rate_card'),
    registerToolCostProfile: async () => disabled('register_tool_cost_profile'),
    createCostEstimate: async () => disabled('create_cost_estimate'),
    appendCostBudget: async () => disabled('append_cost_budget'),
    appendUsageEvent: async () => disabled('append_usage_event'),
    appendCostActual: async () => disabled('append_cost_actual'),
    appendCostReconciliation: async () => disabled('append_cost_reconciliation'),
    appendCostAdjustment: async () => disabled('append_cost_adjustment'),
  }
}

async function rpc<T>(
  client: MotionStudioPersistenceClient,
  operation: MotionStudioPersistenceOperation,
  name: string,
  parameters: Record<string, unknown>,
  schema: z.ZodType<T>,
): Promise<MotionStudioPersistenceResult<T>> {
  try {
    const response = await client.rpc(name, parameters)
    if (response.error) return databaseFailure(operation)
    const parsed = schema.safeParse(response.data)
    if (!parsed.success) return databaseFailure(operation)
    return success(operation, parsed.data)
  } catch {
    return databaseFailure(operation)
  }
}

async function insert(
  client: MotionStudioPersistenceClient,
  operation: MotionStudioPersistenceOperation,
  table: string,
  values: Record<string, unknown>,
): Promise<MotionStudioPersistenceResult<MotionStudioPersistedRecordReceipt>> {
  try {
    const response = await client.from(table).insert(values).select('id').single()
    if (response.error) return databaseFailure(operation)
    const parsed = z.object({ id: z.string().min(1) }).passthrough().safeParse(response.data)
    if (!parsed.success) return databaseFailure(operation)
    return success(operation, { id: parsed.data.id, table })
  } catch {
    return databaseFailure(operation)
  }
}

export function createSupabaseMotionStudioPersistenceRepository(
  input: CreateMotionStudioPersistenceRepositoryInput,
): MotionStudioPersistenceRepository {
  const client = input.client
  if (!client) return createDisabledMotionStudioPersistenceRepository()

  return {
    async createProduction(value: CreateMotionStudioProductionInput) {
      const errors = schemaErrors(productionInputSchema.safeParse(value))
      if (errors.length) return invalid('create_production', errors)
      return rpc(client, 'create_production', 'create_motion_studio_module_production', {
        target_edit_session_id: value.editSessionId,
        target_actor_user_id: value.actorUserId,
        target_module_id: value.moduleId,
        target_module_catalog_version: value.moduleCatalogVersion,
        target_idempotency_key: value.idempotencyKey,
        target_request_hash: value.requestHash,
      }, productionReceiptSchema)
    },

    async createArtifactVersion(value: CreateMotionStudioArtifactVersionInput) {
      const errors = schemaErrors(artifactInputSchema.safeParse(value))
      const candidate = candidateArtifactVersion(value)
      errors.push(...schemaErrors(motionStudioArtifactVersionSchema.safeParse(candidate)))
      errors.push(...validateMotionStudioDeepValue(value).errors)
      if (errors.length) return invalid('create_artifact_version', errors)
      return rpc(client, 'create_artifact_version', 'create_motion_studio_artifact_version', {
        target_production_id: value.productionId,
        target_artifact_id: value.artifactId ?? null,
        target_kind: value.kind,
        target_expected_current_draft_version_id: value.expectedCurrentDraftVersionId ?? null,
        target_parent_version_id: value.parentVersionId ?? null,
        target_state: value.state,
        target_payload_json: value.payload,
        target_provenance_json: value.provenance,
        target_dependencies_json: value.dependencies,
        target_actor_user_id: value.actorUserId,
        target_idempotency_key: value.idempotencyKey,
        target_request_hash: value.requestHash,
      }, artifactReceiptSchema)
    },

    async appendArtifactInvalidation(value: AppendMotionStudioArtifactInvalidationInput) {
      const errors = schemaErrors(motionStudioArtifactInvalidationSchema.safeParse(value.record))
      errors.push(...validateMotionStudioDeepValue(value).errors)
      errors.push(...validateRequiredUuidFields({
        id: value.record.id,
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
        causeArtifactId: value.record.causeVersion.artifactId,
        causeVersionId: value.record.causeVersion.versionId,
        affectedArtifactId: value.record.affectedVersion.artifactId,
        affectedVersionId: value.record.affectedVersion.versionId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateOptionalUuidFields({ priorInvalidationId: value.priorInvalidationId }))
      errors.push(...validateRequiredStableFields({ editSessionId: value.record.editSessionId }))
      errors.push(...validateOptionalStableFields({
        sourceCommandId: value.sourceCommandId,
        impactEstimateId: value.record.impactEstimateId,
      }))
      if (value.record.status === 'open' && (value.priorInvalidationId || value.record.resolvedAt)) {
        errors.push('Open invalidation events cannot carry predecessor or resolution authority.')
      } else if (value.record.status === 'accepted' && value.record.resolvedAt) {
        errors.push('Accepted invalidation events cannot carry resolution authority.')
      } else if (
        (value.record.status === 'resolved' || value.record.status === 'dismissed')
        && !(value.priorInvalidationId && value.record.resolvedAt)
      ) {
        errors.push('Resolved or dismissed invalidation events require exact prior event and resolvedAt authority.')
      }
      if (errors.length) return invalid('append_artifact_invalidation', errors)
      return insert(client, 'append_artifact_invalidation', 'motion_studio_artifact_invalidations', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        cause_artifact_id: value.record.causeVersion.artifactId,
        cause_version_id: value.record.causeVersion.versionId,
        cause_content_digest: value.record.causeVersion.contentDigest,
        affected_artifact_id: value.record.affectedVersion.artifactId,
        affected_version_id: value.record.affectedVersion.versionId,
        affected_content_digest: value.record.affectedVersion.contentDigest,
        reason: value.record.reason,
        status: value.record.status,
        source_command_id: value.sourceCommandId ?? null,
        prior_invalidation_id: value.priorInvalidationId ?? null,
        impact_estimate_id: value.record.impactEstimateId ?? null,
        created_by: value.actorUserId,
        created_at: value.record.createdAt,
        resolved_at: value.record.resolvedAt ?? null,
      })
    },

    async appendPropertyLockEvent(value: AppendMotionStudioPropertyLockEventInput) {
      const errors = schemaErrors(motionStudioPropertyLockSchema.safeParse(value.record))
      errors.push(...validateMotionStudioDeepValue(value).errors)
      errors.push(...validateRequiredUuidFields({
        id: value.record.id,
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
        artifactId: value.artifactId,
        artifactVersionId: value.record.artifactVersionId,
      }))
      errors.push(...validateOptionalUuidFields({
        priorLockEventId: value.priorLockEventId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateRequiredStableFields({ editSessionId: value.record.editSessionId }))
      if (!digest.safeParse(value.artifactContentDigest).success) errors.push('artifactContentDigest: Lowercase SHA-256 required.')
      if (!value.record.targetPath.startsWith('/') || value.record.targetPath.includes('..')) {
        errors.push('targetPath: Absolute JSON-style path without traversal required.')
      }
      if ((value.eventKind === 'acquired') === Boolean(value.priorLockEventId)) {
        errors.push('Acquired locks cannot have a prior event; release/supersede events require one.')
      }
      if (['user', 'reviewer'].includes(value.record.lockedBy.actorKind) && !value.actorUserId) {
        errors.push('User and reviewer lock events require actorUserId membership authority.')
      }
      if (errors.length) return invalid('append_property_lock_event', errors)
      return insert(client, 'append_property_lock_event', 'motion_studio_lock_events', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        artifact_id: value.artifactId,
        artifact_version_id: value.record.artifactVersionId,
        artifact_content_digest: value.artifactContentDigest,
        target_path: value.record.targetPath,
        lock_kind: value.record.lockKind,
        event_kind: value.eventKind,
        prior_lock_event_id: value.priorLockEventId ?? null,
        actor_type: value.record.lockedBy.actorKind,
        actor_id: value.record.lockedBy.actorId,
        actor_user_id: value.actorUserId ?? null,
        reason: value.record.reason,
        lock_digest: value.record.lockDigest,
        created_at: value.record.createdAt,
      })
    },

    async registerSceneRecipeVersion(value: RegisterMotionStudioSceneRecipeVersionInput) {
      const errors = validateSceneRecipeBoundary(value.record.recipe).errors
      errors.push(...validateMotionStudioDeepValue(value).errors)
      errors.push(...validateRequiredUuidFields({
        id: value.record.id,
        productionId: value.productionId,
        workspaceId: value.workspaceId,
        projectId: value.projectId,
        recipeArtifactId: value.record.recipeId,
        artifactVersionId: value.artifactVersionId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateRequiredStableFields({ editSessionId: value.editSessionId }))
      if (value.record.recipeId !== value.record.recipe.id) errors.push('Recipe identity must match its artifact identity.')
      if (value.record.id !== value.artifactVersionId) errors.push('Recipe version identity must equal its exact artifact version identity.')
      if (value.record.contentDigest !== value.record.recipe.definitionDigest) errors.push('Recipe version digest must match definition digest.')
      if (!digest.safeParse(value.compilerFingerprint).success) errors.push('compilerFingerprint: Lowercase SHA-256 required.')
      if (!safeStableId.safeParse(value.compilerId).success) errors.push('compilerId: Safe stable ID required.')
      if (!Number.isSafeInteger(value.record.versionNumber) || value.record.versionNumber < 1) errors.push('versionNumber: Positive safe integer required.')
      if (value.record.immutable !== true) errors.push('Recipe versions must be immutable.')
      if (errors.length) return invalid('register_scene_recipe_version', errors)
      return insert(client, 'register_scene_recipe_version', 'motion_studio_scene_recipe_versions', {
        id: value.record.id,
        workspace_id: value.workspaceId,
        project_id: value.projectId,
        edit_session_id: value.editSessionId,
        production_id: value.productionId,
        recipe_artifact_id: value.record.recipeId,
        artifact_version_id: value.artifactVersionId,
        artifact_kind: 'scene_recipe',
        version_number: value.record.versionNumber,
        definition_version: value.record.recipe.definitionVersion,
        definition_digest: value.record.contentDigest,
        origin_scope: value.record.recipe.scope,
        name: value.record.recipe.name,
        definition_json: value.record.recipe,
        compiler_id: value.compilerId,
        compiler_version: value.record.recipe.compilerVersion,
        compiler_fingerprint: value.compilerFingerprint,
        immutable: true,
        created_by: value.actorUserId,
        created_at: value.record.createdAt,
      })
    },

    async registerRecipeInstantiation(value: RegisterMotionStudioRecipeInstantiationInput) {
      const errors = schemaErrors(motionStudioSceneRecipeInstantiationSchema.safeParse(value.record))
      errors.push(...validateMotionStudioDeepValue(value).errors)
      errors.push(...validateRequiredUuidFields({
        id: value.record.id,
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
        sceneDocumentArtifactId: value.sceneDocumentArtifactId,
        sceneDocumentVersionId: value.record.sceneDocumentVersionId,
        recipeArtifactId: value.record.recipeVersion.artifactId,
        recipeVersionId: value.record.recipeVersion.versionId,
        motionLanguageArtifactId: value.record.motionLanguage.motionLanguageId,
        motionLanguageArtifactVersionId: value.motionLanguageArtifactVersionId,
        narrativeFunctionArtifactId: value.record.narrativeFunction.narrativeFunctionId,
        narrativeFunctionArtifactVersionId: value.narrativeFunctionArtifactVersionId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateRequiredStableFields({
        editSessionId: value.record.editSessionId,
        sceneId: value.record.sceneId,
      }))
      for (const [name, valueToCheck] of Object.entries({
        sceneDocumentDigest: value.sceneDocumentDigest,
        recipeDefinitionDigest: value.recipeDefinitionDigest,
      })) {
        if (!digest.safeParse(valueToCheck).success) errors.push(`${name}: Lowercase SHA-256 required.`)
      }
      if (value.recipeDefinitionDigest !== value.record.recipeVersion.contentDigest) {
        errors.push('Recipe artifact digest must match the exact recipe version reference.')
      }
      if (errors.length) return invalid('register_recipe_instantiation', errors)
      return insert(client, 'register_recipe_instantiation', 'motion_studio_recipe_instantiations', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        scene_id: value.record.sceneId,
        scene_document_artifact_id: value.sceneDocumentArtifactId,
        scene_document_version_id: value.record.sceneDocumentVersionId,
        scene_document_kind: 'scene_document',
        scene_document_digest: value.sceneDocumentDigest,
        recipe_version_id: value.record.recipeVersion.versionId,
        recipe_definition_version: value.record.recipeDefinitionVersion,
        recipe_definition_digest: value.recipeDefinitionDigest,
        recipe_semantic_digest: value.record.recipeDefinitionDigest,
        recipe_input_digest: value.record.recipeInputDigest,
        motion_language_artifact_id: value.record.motionLanguage.motionLanguageId,
        motion_language_version_id: value.motionLanguageArtifactVersionId,
        motion_language_kind: 'motion_language',
        motion_language_digest: value.record.motionLanguage.motionLanguageDigest,
        motion_language_semantic_digest: value.record.motionLanguage.motionLanguageDigest,
        narrative_function_artifact_id: value.record.narrativeFunction.narrativeFunctionId,
        narrative_function_version_id: value.narrativeFunctionArtifactVersionId,
        narrative_function_kind: 'narrative_function',
        narrative_function_digest: value.record.narrativeFunction.narrativeFunctionDigest,
        narrative_function_semantic_digest: value.record.narrativeFunction.narrativeFunctionDigest,
        production_mode: value.record.productionMode,
        input_artifact_digests: value.record.inputArtifactDigests,
        output_binding_ids: value.record.outputBindingIds,
        approval_status: 'approved',
        immutable: true,
        created_by: value.actorUserId,
      })
    },

    async registerProviderRateCard(value: RegisterMotionStudioProviderRateCardInput) {
      const errors = validateProviderRateCardBoundary(value.record).errors
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        providerCapability: value.record.providerCapability,
        providerAdapterId: value.record.providerAdapterId,
      }))
      errors.push(...validateCostEvidenceStableIds(value.record.sourceReference))
      const effectiveFrom = Date.parse(value.record.effectiveFrom)
      const effectiveTo = value.record.effectiveTo ? Date.parse(value.record.effectiveTo) : undefined
      if (!Number.isFinite(effectiveFrom)) errors.push('effectiveFrom: Valid timestamp required.')
      if (effectiveTo !== undefined && (!Number.isFinite(effectiveTo) || effectiveTo <= effectiveFrom)) {
        errors.push('effectiveTo: Must be later than effectiveFrom.')
      }
      if (errors.length) return invalid('register_provider_rate_card', errors)
      return insert(client, 'register_provider_rate_card', 'provider_rate_card_versions', {
        id: value.record.id,
        provider_capability: value.record.providerCapability,
        provider_adapter_id: value.record.providerAdapterId,
        model_or_service: value.record.modelOrService,
        version: value.record.version,
        content_digest: value.record.contentDigest,
        currency: value.record.currency,
        effective_from: value.record.effectiveFrom,
        effective_to: value.record.effectiveTo ?? null,
        unit: value.record.unit,
        unit_price_micros: value.record.unitPriceMicros,
        minimum_charge_micros: value.record.minimumChargeMicros,
        rounding_rule: value.record.roundingRule,
        source_reference: value.record.sourceReference,
        verified_at: value.record.verifiedAt,
        immutable: true,
      })
    },

    async registerToolCostProfile(value: RegisterMotionStudioToolCostProfileInput) {
      const errors = validateToolCostProfileBoundary(value.record).errors
      errors.push(...validateRequiredStableFields({ id: value.record.id, toolId: value.record.toolId }))
      if (errors.length) return invalid('register_tool_cost_profile', errors)
      return insert(client, 'register_tool_cost_profile', 'tool_cost_profile_versions', {
        id: value.record.id,
        tool_id: value.record.toolId,
        version: value.record.version,
        content_digest: value.record.contentDigest,
        currency: value.record.currency,
        rates_json: value.record.rates,
        immutable: true,
      })
    },

    async createCostEstimate(value: CreateMotionStudioCostEstimateInput) {
      const errors = validateProductionCostEstimateBoundary(value.estimate).errors
      for (const item of value.items) errors.push(...validateProductionCostEstimateItemBoundary(item).errors)
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.estimate.workspaceId,
        projectId: value.estimate.projectId,
        productionId: value.estimate.productionId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateRequiredStableFields({
        estimateId: value.estimate.id,
        editSessionId: value.estimate.editSessionId,
      }))
      errors.push(...validateOptionalStableFields({
        sceneId: value.estimate.sceneId,
        shotId: value.estimate.shotId,
      }))
      if (!digest.safeParse(value.requestHash).success) errors.push('requestHash: Lowercase SHA-256 required.')
      if (!idempotencyKey.safeParse(value.idempotencyKey).success) errors.push('idempotencyKey: Safe bounded value required.')
      const itemIds = value.items.map((item) => item.id)
      const rateIds = uniqueInOrder(value.items.map((item) => item.rateCardVersionId))
      for (const item of value.items) {
        errors.push(...validateRequiredStableFields({
          itemId: item.id,
          workItemKey: item.workItemKey,
          capabilityOrToolId: item.capabilityOrToolId,
          rateCardVersionId: item.rateCardVersionId,
        }))
      }
      if (!sameArray(value.estimate.itemIds, itemIds)) errors.push('Estimate itemIds must preserve the exact ordered item records.')
      if (!sameArray(value.estimate.rateCardVersionIds, rateIds)) errors.push('Estimate rateCardVersionIds must preserve exact first-use order.')
      const itemRecords = value.items as readonly unknown[] as readonly Record<string, unknown>[]
      for (const [field, parentValue] of [
        ['lowInternalCostMicros', value.estimate.lowInternalCostMicros],
        ['expectedInternalCostMicros', value.estimate.expectedInternalCostMicros],
        ['highInternalCostMicros', value.estimate.highInternalCostMicros],
        ['maximumAuthorizedInternalCostMicros', value.estimate.maximumAuthorizedInternalCostMicros],
      ] as const) {
        const total = exactMicrosItemSum(itemRecords, field)
        if (total !== null && Number.isSafeInteger(parentValue) && total !== BigInt(parentValue)) {
          errors.push(`${field}: Estimate aggregate must equal the exact immutable item sum.`)
        }
      }
      if (!Number.isFinite(Date.parse(value.estimate.expiresAt)) || Date.parse(value.estimate.expiresAt) <= Date.now()) {
        errors.push('expiresAt: Cost estimate expiry must be in the future.')
      }
      if (errors.length) return invalid('create_cost_estimate', errors)
      return rpc(client, 'create_cost_estimate', 'create_motion_studio_execution_cost_estimate', {
        target_production_id: value.estimate.productionId,
        target_estimate_id: value.estimate.id,
        target_scene_id: value.estimate.sceneId ?? null,
        target_shot_id: value.estimate.shotId ?? null,
        target_low_internal_cost_micros: value.estimate.lowInternalCostMicros,
        target_expected_internal_cost_micros: value.estimate.expectedInternalCostMicros,
        target_high_internal_cost_micros: value.estimate.highInternalCostMicros,
        target_maximum_authorized_internal_cost_micros: value.estimate.maximumAuthorizedInternalCostMicros,
        target_items_json: value.items,
        target_expires_at: value.estimate.expiresAt,
        target_status: value.estimate.status,
        target_actor_user_id: value.actorUserId,
        target_idempotency_key: value.idempotencyKey,
        target_request_hash: value.requestHash,
      }, estimateReceiptSchema)
    },

    async appendCostBudget(value: AppendMotionStudioCostBudgetInput) {
      const errors = validateProductionCostBudgetBoundary(value.record).errors
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
        actorUserId: value.actorUserId,
      }))
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        editSessionId: value.record.editSessionId,
        estimateId: value.record.estimateId,
      }))
      errors.push(...validateRequiredUuidFields({ approvedSnapshotId: value.record.approvedSnapshotId }))
      errors.push('Production cost budgets are derived atomically by durable work-graph authorization; direct append is disabled.')
      return invalid('append_cost_budget', errors)
    },

    async appendUsageEvent(value: AppendMotionStudioUsageEventInput) {
      const errors = validateProductionUsageEventBoundary(value.record).errors
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
      }))
      errors.push(...validateOptionalUuidFields({ actorUserId: value.actorUserId }))
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        editSessionId: value.record.editSessionId,
        toolOrCapabilityId: value.record.toolOrCapabilityId,
        jobId: value.record.jobId,
        attemptId: value.record.attemptId,
        costBudgetId: value.record.costBudgetId,
        costEstimateItemId: value.record.costEstimateItemId,
        meterId: value.meterId,
        rateCardVersionId: value.record.rateCardVersionId,
      }))
      errors.push(...validateOptionalStableFields({
        sceneId: value.record.sceneId,
        shotId: value.record.shotId,
        skillId: value.record.skillId,
        outputAssetId: value.record.outputAssetId,
      }))
      errors.push('Production usage is emitted atomically by the exact leased job-attempt result or reconciliation RPC; direct append is disabled.')
      return invalid('append_usage_event', errors)
    },

    async appendCostActual(value: AppendMotionStudioCostActualInput) {
      const errors = validateProductionCostActualBoundary(value.record).errors
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
      }))
      errors.push(...validateOptionalUuidFields({ actorUserId: value.actorUserId }))
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        editSessionId: value.record.editSessionId,
        ...Object.fromEntries(value.record.usageEventIds.map((id, index) => [`usageEventIds.${index}`, id])),
      }))
      if (value.record.status !== 'provisional' || value.record.reconciledInternalCostMicros !== undefined) {
        errors.push('MS-002B persists provisional actual authority only; reconciliation and adjustment state is derived from append-only evidence.')
      }
      if (errors.length) return invalid('append_cost_actual', errors)
      return insert(client, 'append_cost_actual', 'production_cost_actuals', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        usage_event_ids: value.record.usageEventIds,
        provisional_internal_cost_micros: value.record.provisionalInternalCostMicros,
        reconciled_internal_cost_micros: value.record.reconciledInternalCostMicros ?? null,
        status: value.record.status,
        currency: value.record.currency,
        created_by: value.actorUserId ?? null,
      })
    },

    async appendCostReconciliation(value: AppendMotionStudioCostReconciliationInput) {
      const errors = validateProductionCostReconciliationBoundary(value.record).errors
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
      }))
      errors.push(...validateOptionalUuidFields({ actorUserId: value.actorUserId }))
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        editSessionId: value.record.editSessionId,
        actualCostId: value.record.actualCostId,
      }))
      errors.push(...validateCostEvidenceStableIds(value.record.providerInvoiceReference))
      if (errors.length) return invalid('append_cost_reconciliation', errors)
      return insert(client, 'append_cost_reconciliation', 'production_cost_reconciliations', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        actual_cost_id: value.record.actualCostId,
        provider_invoice_reference: value.record.providerInvoiceReference,
        previous_internal_cost_micros: value.record.previousInternalCostMicros,
        reconciled_internal_cost_micros: value.record.reconciledInternalCostMicros,
        evidence_digest: value.record.evidenceDigest,
        reconciled_at: value.record.reconciledAt,
        created_by: value.actorUserId ?? null,
      })
    },

    async appendCostAdjustment(value: AppendMotionStudioCostAdjustmentInput) {
      const errors = validateProductionCostAdjustmentBoundary(value.record).errors
      errors.push(...validateRequiredUuidFields({
        workspaceId: value.record.workspaceId,
        projectId: value.record.projectId,
        productionId: value.record.productionId,
      }))
      errors.push(...validateOptionalUuidFields({ actorUserId: value.actorUserId }))
      errors.push(...validateRequiredStableFields({
        id: value.record.id,
        editSessionId: value.record.editSessionId,
        actualCostId: value.record.actualCostId,
      }))
      if (errors.length) return invalid('append_cost_adjustment', errors)
      return insert(client, 'append_cost_adjustment', 'production_cost_adjustments', {
        id: value.record.id,
        workspace_id: value.record.workspaceId,
        project_id: value.record.projectId,
        edit_session_id: value.record.editSessionId,
        production_id: value.record.productionId,
        actual_cost_id: value.record.actualCostId,
        direction: value.record.direction,
        amount_internal_cost_micros: value.record.amountInternalCostMicros,
        reason: value.record.reason,
        evidence_digest: value.record.evidenceDigest,
        adjusted_at: value.record.adjustedAt,
        created_by: value.actorUserId ?? null,
      })
    },
  }
}
