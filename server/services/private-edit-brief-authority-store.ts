import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  editBriefAttachmentMetadataSchema,
  editBriefExportSettingsSchema,
  editBriefFieldsSchema,
  editBriefMarkerFieldsSchema,
  editBriefRuntimeStateSchema,
  editBriefSourceContextSchema,
  editBriefStructuredIntentSchema,
  type EditBriefAttachmentMetadataInput,
  type EditBriefExportSettingsInput,
  type EditBriefFieldsInput,
  type EditBriefMarkerFieldsInput,
  type EditBriefRuntimeState,
  type EditBriefSourceContextInput,
  type EditBriefStructuredIntentInput,
} from '../validation/edit-brief-authority-schemas'
import { preferenceRuntimeStateSchema } from '../validation/preference-intelligence-schemas'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'
import { withPlanningDomainMutationLock } from './planning-domain-mutation-lock'
import { PREFERENCE_INSTRUCTION_PRIORITY, type PreferenceContextSummary } from './private-preference-intelligence-store'

export { PREFERENCE_INSTRUCTION_PRIORITY } from './private-preference-intelligence-store'

export const PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION = 'private-edit-brief-authority-v1' as const
const PRIVATE_EDIT_BRIEF_AUTHORITY_SOURCE = 'private_edit_brief_authority_store' as const
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
export const MAX_EDIT_BRIEF_MARKERS = 500
export const MAX_EDIT_BRIEF_MESSAGES = 5_000
export const MAX_EDIT_BRIEF_INTENTS = 1_000
export const MAX_EDIT_BRIEF_ATTACHMENTS = 2_000
export const MAX_EDIT_BRIEF_CONTEXT_PACKAGES = 1_000
export const MAX_EDIT_BRIEF_QA_REPORTS = 256
export const MAX_EDIT_BRIEF_PLAN_HINT_PACKAGES = 256
// One exact edit can legitimately accumulate thousands of persisted Marker
// Chat operations. Keep replay/audit evidence aligned above the exposed 5k
// message ceiling; the independent 8 MiB aggregate ceiling still fails closed
// before unbounded local growth.
export const MAX_EDIT_BRIEF_AUDIT_EVENTS = 10_000
export const MAX_EDIT_BRIEF_IDEMPOTENCY_RECORDS = 10_000

export interface EditBriefAuthorityScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

export interface EditBriefRecord {
  id: string
  revision: number
  fields: EditBriefFieldsInput
  createdAt: string
  updatedAt: string
}

export interface EditBriefExportSettingsRecord extends EditBriefExportSettingsInput {
  revision: number
  updatedAt: string
}

export interface EditBriefMarkerRecord extends EditBriefMarkerFieldsInput {
  id: string
  editSessionId: string
  briefId?: string
  revision: number
  status: 'draft' | 'confirmed' | 'archived'
  timingStatus: 'display_seconds_only' | 'frame_authoritative'
  startFrame?: number
  endFrame?: number
  frameRate?: number
  confirmedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EditBriefMarkerMessageRecord {
  id: string
  markerId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  clientMessageId?: string
  runtimeState: EditBriefRuntimeState
  createdAt: string
}

export interface EditBriefMarkerIntentRecord extends EditBriefStructuredIntentInput {
  id: string
  markerId: string
  revision: number
  createdAt: string
  updatedAt: string
}

export interface EditBriefAttachmentRecord extends EditBriefAttachmentMetadataInput {
  id: string
  markerId: string
  createdAt: string
}

export interface EditBriefPreferenceContext {
  applicationStatus: 'applied' | 'cleared' | 'not_selected'
  applicationVersion: number
  context?: PreferenceContextSummary
  doNotCopyRules: string[]
  instructionPriority: typeof PREFERENCE_INSTRUCTION_PRIORITY
}

export interface EditBriefMarkerContextPackage {
  id: string
  contextVersion: number
  markerId: string
  markerRevision: number
  authorityRevision: number
  nearbyWindowSeconds: number
  marker: {
    markerType: EditBriefMarkerRecord['markerType']
    timeKind: EditBriefMarkerRecord['timeKind']
    startSeconds: number
    endSeconds?: number
    startFrame?: number
    endFrame?: number
    status: EditBriefMarkerRecord['status']
    title: string
    note: string
  }
  nearbyMarkers: Array<{
    markerId: string
    markerType: EditBriefMarkerRecord['markerType']
    startSeconds: number
    endSeconds?: number
    status: EditBriefMarkerRecord['status']
    title: string
  }>
  sourceContext: EditBriefSourceContextInput
  sourceAuthorityStatus: 'unverified_private_internal_metadata'
  briefContext?: {
    briefId: string
    briefRevision: number
    fields: EditBriefFieldsInput
  }
  exportContext?: {
    revision: number
    platformTarget: string
    aspectRatio: EditBriefExportSettingsInput['aspectRatio']
    customWidth?: number
    customHeight?: number
    resolution: string
    frameRate: number
    confirmationStatus: EditBriefExportSettingsInput['confirmationStatus']
  }
  latestUserMessage?: string
  currentIntent?: EditBriefStructuredIntentInput
  preferenceContext: EditBriefPreferenceContext
  attachmentMetadata: Array<Pick<EditBriefAttachmentRecord, 'id' | 'privateAssetId' | 'label' | 'kind' | 'mimeType'>>
  latestQaWarnings: string[]
  doNotCopyRules: string[]
  contextHash: string
  runtimeState: EditBriefRuntimeState
  compact: true
  includesRawMedia: false
  includesFullChat: false
  includesPublicAssetLocations: false
  createdAt: string
}

export type EditBriefQaFindingCode =
  | 'brief_not_ready'
  | 'export_frame_unconfirmed'
  | 'marker_frame_timing_missing'
  | 'marker_unconfirmed'
  | 'marker_time_out_of_bounds'
  | 'source_context_gap'
  | 'marker_needs_clarification'
  | 'marker_intent_unconfirmed'
  | 'required_private_asset_missing'
  | 'exact_copy_risk'
  | 'marker_instruction_conflict'

export interface EditBriefQaFinding {
  code: EditBriefQaFindingCode
  severity: 'warning' | 'needs_user_review' | 'blocking'
  message: string
  markerIds: string[]
}

export interface EditBriefConflictRecord {
  id: string
  leftMarkerId: string
  rightMarkerId: string
  kind: 'cut_keep_overlap' | 'must_follow_action_overlap'
  status: 'open'
  createdAt: string
}

export interface EditBriefQaReport {
  id: string
  authorityInputHash: string
  status: 'passed' | 'warning' | 'needs_user_review' | 'blocked'
  findings: EditBriefQaFinding[]
  conflictIds: string[]
  runtimeState: 'metadata_only'
  deterministicOnly: true
  createdAt: string
}

export interface EditBriefPlanHintPackage {
  id: string
  authorityInputHash: string
  planInputHash: string
  planInputQaStatus: 'passed' | 'blocked'
  planInputFindings: string[]
  planHintFingerprint: string
  qaReportId?: string
  readiness: 'ready_for_planning' | 'needs_user_review' | 'blocked'
  instructionPriority: typeof PREFERENCE_INSTRUCTION_PRIORITY
  orderedInstructionSources: Array<{
    priority: number
    source: typeof PREFERENCE_INSTRUCTION_PRIORITY[number]
    instructions: string[]
  }>
  confirmedMarkerHints: Array<{
    markerId: string
    markerType: EditBriefMarkerRecord['markerType']
    startSeconds: number
    endSeconds?: number
    startFrame?: number
    endFrame?: number
    instruction: string
    requiredPrivateAssetIds: string[]
  }>
  sourceContextRefs: Array<{
    markerId: string
    contextPackageId: string
    contextVersion: number
    contextHash: string
    runtimeState: EditBriefRuntimeState
    sourceAuthorityStatus: 'unverified_private_internal_metadata'
  }>
  qaWarnings: string[]
  exportTarget?: {
    platformTarget: string
    aspectRatio: EditBriefExportSettingsInput['aspectRatio']
    resolution: string
    frameRate: number
    confirmationStatus: EditBriefExportSettingsInput['confirmationStatus']
  }
  preferenceApplicationVersion: number
  preferenceBinding: {
    applicationStatus: EditBriefPreferenceContext['applicationStatus']
    applicationVersion: number
    preferenceId?: string
    preferenceDNAId?: string
    preferenceDNAVersion?: number
    fingerprint: string
  }
  briefSummary?: EditBriefFieldsInput
  runtimeTruth: {
    plannerExecuted: false
    editPlanCreated: false
    providerCallsStarted: false
    mediaWorkersStarted: false
    renderStarted: false
    exportStarted: false
    creditsReservedOrSpent: false
  }
  runtimeState: 'metadata_only'
  createdAt: string
}

export type EditBriefPlanHintFingerprintPayload = Omit<
  EditBriefPlanHintPackage,
  'id' | 'createdAt' | 'planHintFingerprint'
>

export interface EditBriefLifecycle {
  phase: 'planning' | 'approved_snapshot'
  mutable: boolean
  approvedSnapshotId?: string
  publicationBindingHash?: string
  authorityInputHash?: string
  authorityRevisionAtLock?: number
  lockedAt?: string
}

export interface EditBriefIdempotencyRecord {
  operation: string
  idempotencyKey: string
  requestHash: string
  responseEntityId: string
  responseEntityKind: string
  committedRevision: number
  completedAt: string
}

export interface EditBriefAuditEvent {
  id: string
  eventType: string
  actorUserId: string
  entityId?: string
  aggregateRevision: number
  createdAt: string
}

export interface PrivateEditBriefAuthorityAggregate {
  schemaVersion: typeof PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION
  privateInternalOnly: true
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  revision: number
  brief?: EditBriefRecord
  exportSettings?: EditBriefExportSettingsRecord
  markers: EditBriefMarkerRecord[]
  markerMessages: EditBriefMarkerMessageRecord[]
  markerIntents: EditBriefMarkerIntentRecord[]
  attachments: EditBriefAttachmentRecord[]
  contextPackages: EditBriefMarkerContextPackage[]
  conflicts: EditBriefConflictRecord[]
  qaReports: EditBriefQaReport[]
  planHintPackages: EditBriefPlanHintPackage[]
  lifecycle: EditBriefLifecycle
  idempotencyRecords: EditBriefIdempotencyRecord[]
  auditEvents: EditBriefAuditEvent[]
  createdAt: string
  updatedAt: string
}

interface PersistedEditBriefAuthorityRecord {
  recordVersion: typeof PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION
  source: typeof PRIVATE_EDIT_BRIEF_AUTHORITY_SOURCE
  aggregate: PrivateEditBriefAuthorityAggregate
  checksumSha256: string
}

const timestampSchema = z.iso.datetime({ offset: true })
const idSchema = z.string().trim().min(1).max(200)
const preferenceContextSummarySchema = z.object({
  compact: z.literal(true),
  audience: z.enum(['planner', 'main_chat', 'marker_chat', 'edit_brief']),
  preferenceId: idSchema,
  preferenceName: z.string().min(1).max(120),
  preferenceDNAId: idSchema,
  preferenceDNAVersion: z.number().int().positive(),
  runtimeState: preferenceRuntimeStateSchema,
  qaStatus: z.enum(['not_run', 'passed', 'warning', 'blocked']),
  confidence: z.number().min(0).max(1),
  relevantRules: z.record(z.string(), z.array(z.string().min(1).max(1_000)).max(64)),
  doNotCopyRules: z.array(z.string().min(1).max(1_000)).max(64),
  nonTransferableElements: z.array(z.string().min(1).max(1_000)).max(64),
  qaWarnings: z.array(z.string().min(1).max(1_000)).max(64),
  instructionPriority: z.tuple(PREFERENCE_INSTRUCTION_PRIORITY.map((entry) => z.literal(entry)) as [
    z.ZodLiteral<'safety_legal_and_do_not_copy'>,
    z.ZodLiteral<'latest_explicit_user_instruction'>,
    z.ZodLiteral<'confirmed_edit_brief_marker'>,
    z.ZodLiteral<'approved_project_override'>,
    z.ZodLiteral<'selected_preference_dna'>,
    z.ZodLiteral<'general_defaults'>,
    z.ZodLiteral<'deterministic_fallback'>,
  ]),
}).strict()

const markerRecordSchema = editBriefMarkerFieldsSchema.safeExtend({
  id: idSchema,
  editSessionId: idSchema,
  briefId: idSchema.optional(),
  revision: z.number().int().positive(),
  status: z.enum(['draft', 'confirmed', 'archived']),
  timingStatus: z.enum(['display_seconds_only', 'frame_authoritative']),
  startFrame: z.number().int().nonnegative().optional(),
  endFrame: z.number().int().positive().optional(),
  frameRate: z.number().int().positive().optional(),
  confirmedAt: timestampSchema.optional(),
  archivedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict()

const aggregateSchema: z.ZodType<PrivateEditBriefAuthorityAggregate> = z.object({
  schemaVersion: z.literal(PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION),
  privateInternalOnly: z.literal(true),
  ownerUserId: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  editSessionId: idSchema,
  revision: z.number().int().nonnegative(),
  brief: z.object({
    id: idSchema,
    revision: z.number().int().positive(),
    fields: editBriefFieldsSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  }).strict().optional(),
  exportSettings: editBriefExportSettingsSchema.safeExtend({
    revision: z.number().int().positive(),
    updatedAt: timestampSchema,
  }).strict().optional(),
  markers: z.array(markerRecordSchema).max(MAX_EDIT_BRIEF_MARKERS),
  markerMessages: z.array(z.object({
    id: idSchema, markerId: idSchema, role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(8_000), clientMessageId: idSchema.optional(),
    runtimeState: editBriefRuntimeStateSchema, createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_MESSAGES),
  markerIntents: z.array(editBriefStructuredIntentSchema.extend({
    id: idSchema, markerId: idSchema, revision: z.number().int().positive(),
    createdAt: timestampSchema, updatedAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_INTENTS),
  attachments: z.array(editBriefAttachmentMetadataSchema.extend({
    id: idSchema, markerId: idSchema, createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_ATTACHMENTS),
  contextPackages: z.array(z.object({
    id: idSchema, contextVersion: z.number().int().positive(), markerId: idSchema, markerRevision: z.number().int().positive(),
    authorityRevision: z.number().int().nonnegative(), nearbyWindowSeconds: z.number().int().min(1).max(300),
    marker: z.object({
      markerType: markerRecordSchema.shape.markerType, timeKind: z.enum(['point', 'range']),
      startSeconds: z.number().nonnegative(), endSeconds: z.number().positive().optional(),
      startFrame: z.number().int().nonnegative().optional(), endFrame: z.number().int().positive().optional(),
      status: z.enum(['draft', 'confirmed', 'archived']), title: z.string().min(1).max(240), note: z.string().min(1).max(8_000),
    }).strict(),
    nearbyMarkers: z.array(z.object({
      markerId: idSchema, markerType: markerRecordSchema.shape.markerType, startSeconds: z.number().nonnegative(),
      endSeconds: z.number().positive().optional(), status: z.enum(['draft', 'confirmed', 'archived']), title: z.string().min(1).max(240),
    }).strict()).max(50),
    sourceContext: editBriefSourceContextSchema,
    sourceAuthorityStatus: z.literal('unverified_private_internal_metadata'),
    briefContext: z.object({
      briefId: idSchema,
      briefRevision: z.number().int().positive(),
      fields: editBriefFieldsSchema,
    }).strict().optional(),
    exportContext: z.object({
      revision: z.number().int().positive(),
      platformTarget: z.string().min(1).max(120),
      aspectRatio: editBriefExportSettingsSchema.shape.aspectRatio,
      customWidth: z.number().int().min(320).max(16_384).optional(),
      customHeight: z.number().int().min(320).max(16_384).optional(),
      resolution: z.string().min(1).max(80),
      frameRate: z.number().int().positive(),
      confirmationStatus: z.enum(['recommended', 'confirmed']),
    }).strict().optional(),
    latestUserMessage: z.string().min(1).max(8_000).optional(),
    currentIntent: editBriefStructuredIntentSchema.optional(),
    preferenceContext: z.object({
      applicationStatus: z.enum(['applied', 'cleared', 'not_selected']), applicationVersion: z.number().int().nonnegative(),
      context: preferenceContextSummarySchema.optional(), doNotCopyRules: z.array(z.string().min(1).max(1_000)).max(128),
      instructionPriority: preferenceContextSummarySchema.shape.instructionPriority,
    }).strict(),
    attachmentMetadata: z.array(z.object({
      id: idSchema, privateAssetId: idSchema, label: z.string().min(1).max(240), kind: z.enum(['image', 'video', 'audio', 'reference']),
      mimeType: z.string().max(160).optional(),
    }).strict()).max(128),
    latestQaWarnings: z.array(z.string().min(1).max(2_000)).max(128),
    doNotCopyRules: z.array(z.string().min(1).max(1_000)).max(128), contextHash: z.string().regex(/^[a-f0-9]{64}$/),
    runtimeState: editBriefRuntimeStateSchema, compact: z.literal(true), includesRawMedia: z.literal(false),
    includesFullChat: z.literal(false), includesPublicAssetLocations: z.literal(false), createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_CONTEXT_PACKAGES),
  conflicts: z.array(z.object({
    id: idSchema, leftMarkerId: idSchema, rightMarkerId: idSchema,
    kind: z.enum(['cut_keep_overlap', 'must_follow_action_overlap']), status: z.literal('open'), createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_MARKERS * 4),
  qaReports: z.array(z.object({
    id: idSchema, authorityInputHash: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(['passed', 'warning', 'needs_user_review', 'blocked']),
    findings: z.array(z.object({
      code: z.enum(['brief_not_ready', 'export_frame_unconfirmed', 'marker_frame_timing_missing', 'marker_unconfirmed', 'marker_time_out_of_bounds', 'source_context_gap', 'marker_needs_clarification', 'marker_intent_unconfirmed', 'required_private_asset_missing', 'exact_copy_risk', 'marker_instruction_conflict']),
      severity: z.enum(['warning', 'needs_user_review', 'blocking']), message: z.string().min(1).max(2_000), markerIds: z.array(idSchema).max(32),
    }).strict()).max(1_000),
    conflictIds: z.array(idSchema).max(2_000), runtimeState: z.literal('metadata_only'), deterministicOnly: z.literal(true), createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_QA_REPORTS),
  planHintPackages: z.array(z.object({
    id: idSchema,
    authorityInputHash: z.string().regex(/^[a-f0-9]{64}$/),
    planInputHash: z.string().regex(/^[a-f0-9]{64}$/),
    planInputQaStatus: z.enum(['passed', 'blocked']),
    planInputFindings: z.array(z.string().min(1).max(2_000)).max(128),
    planHintFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    qaReportId: idSchema.optional(),
    readiness: z.enum(['ready_for_planning', 'needs_user_review', 'blocked']), instructionPriority: preferenceContextSummarySchema.shape.instructionPriority,
    orderedInstructionSources: z.array(z.object({
      priority: z.number().int().min(1).max(7), source: z.enum(PREFERENCE_INSTRUCTION_PRIORITY), instructions: z.array(z.string().min(1).max(8_000)).max(1_000),
    }).strict()).length(7),
    confirmedMarkerHints: z.array(z.object({
      markerId: idSchema, markerType: markerRecordSchema.shape.markerType, startSeconds: z.number().nonnegative(), endSeconds: z.number().positive().optional(),
      startFrame: z.number().int().nonnegative().optional(), endFrame: z.number().int().positive().optional(), instruction: z.string().min(1).max(8_000), requiredPrivateAssetIds: z.array(idSchema).max(64),
    }).strict()).max(MAX_EDIT_BRIEF_MARKERS),
    sourceContextRefs: z.array(z.object({
      markerId: idSchema,
      contextPackageId: idSchema,
      contextVersion: z.number().int().positive(),
      contextHash: z.string().regex(/^[a-f0-9]{64}$/),
      runtimeState: editBriefRuntimeStateSchema,
      sourceAuthorityStatus: z.literal('unverified_private_internal_metadata'),
    }).strict()).max(MAX_EDIT_BRIEF_MARKERS),
    qaWarnings: z.array(z.string().min(1).max(2_000)).max(1_000),
    exportTarget: z.object({
      platformTarget: z.string().min(1).max(120),
      aspectRatio: editBriefExportSettingsSchema.shape.aspectRatio,
      resolution: z.string().min(1).max(80),
      frameRate: z.number().int().positive(),
      confirmationStatus: z.enum(['recommended', 'confirmed']),
    }).strict().optional(),
    preferenceApplicationVersion: z.number().int().nonnegative(),
    preferenceBinding: z.object({
      applicationStatus: z.enum(['applied', 'cleared', 'not_selected']),
      applicationVersion: z.number().int().nonnegative(),
      preferenceId: idSchema.optional(),
      preferenceDNAId: idSchema.optional(),
      preferenceDNAVersion: z.number().int().positive().optional(),
      fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    }).strict(),
    briefSummary: editBriefFieldsSchema.optional(),
    runtimeTruth: z.object({
      plannerExecuted: z.literal(false), editPlanCreated: z.literal(false), providerCallsStarted: z.literal(false),
      mediaWorkersStarted: z.literal(false), renderStarted: z.literal(false), exportStarted: z.literal(false),
      creditsReservedOrSpent: z.literal(false),
    }).strict(),
    runtimeState: z.literal('metadata_only'), createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_PLAN_HINT_PACKAGES),
  lifecycle: z.object({
    phase: z.enum(['planning', 'approved_snapshot']),
    mutable: z.boolean(), approvedSnapshotId: idSchema.optional(),
    publicationBindingHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    authorityInputHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    authorityRevisionAtLock: z.number().int().nonnegative().optional(),
    lockedAt: timestampSchema.optional(),
  }).strict(),
  idempotencyRecords: z.array(z.object({
    operation: z.string().min(1).max(100), idempotencyKey: idSchema, requestHash: z.string().regex(/^[a-f0-9]{64}$/),
    responseEntityId: idSchema, responseEntityKind: z.string().min(1).max(100), committedRevision: z.number().int().positive(), completedAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_IDEMPOTENCY_RECORDS),
  auditEvents: z.array(z.object({
    id: idSchema, eventType: z.string().min(1).max(120), actorUserId: idSchema, entityId: idSchema.optional(),
    aggregateRevision: z.number().int().positive(), createdAt: timestampSchema,
  }).strict()).max(MAX_EDIT_BRIEF_AUDIT_EVENTS),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict()

const scopeLocks = new Map<string, Promise<void>>()

export function clearPrivateEditBriefAuthorityProcessStateForSmoke(): void {
  scopeLocks.clear()
}

export function editBriefAuthorityRelativePath(scope: Omit<EditBriefAuthorityScope, 'localStorageRoot'>): string {
  return [
    'edit-brief-authority',
    'private-internal-v1',
    `scope-${editBriefAuthorityScopeHash(scope)}.json`,
  ].join('/')
}

export async function readPrivateEditBriefAuthorityAggregate(
  scope: EditBriefAuthorityScope,
): Promise<PrivateEditBriefAuthorityAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: editBriefAuthorityRelativePath(scope),
  })
  if (content === undefined) return undefined
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength > MAX_AGGREGATE_BYTES) {
    throw new ApiError('VALIDATION_FAILED', 'Private Edit Brief authority exceeds its safe read ceiling.', 409, {
      byteLength,
      maximumBytes: MAX_AGGREGATE_BYTES,
    })
  }
  return parsePersistedRecord(content, scope)
}

export async function mutatePrivateEditBriefAuthorityAggregate<T>(input: {
  scope: EditBriefAuthorityScope
  expectedRevision: number
  now: string
  replay?: (aggregate: PrivateEditBriefAuthorityAggregate) => T | undefined
  mutation: (aggregate: PrivateEditBriefAuthorityAggregate) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
}): Promise<T> {
  const lockKey = editBriefAuthorityScopeHash(input.scope)
  return withPlanningDomainMutationLock(input.scope, async () => withProcessLock(lockKey, async () => {
    const existing = await readPrivateEditBriefAuthorityAggregate(input.scope)
    const aggregate = existing ?? createEmptyAggregate(input.scope, input.now)
    const replay = input.replay?.(aggregate)
    if (replay !== undefined) return replay
    if (aggregate.revision !== input.expectedRevision) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Edit Brief authority revision did not match.', 409, {
        expectedRevision: input.expectedRevision,
        currentRevision: aggregate.revision,
      })
    }
    const mutationResult = await input.mutation(aggregate)
    if (!mutationResult.changed) return mutationResult.result
    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertAggregateValid(aggregate, input.scope)
    const persisted: PersistedEditBriefAuthorityRecord = {
      recordVersion: PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION,
      source: PRIVATE_EDIT_BRIEF_AUTHORITY_SOURCE,
      aggregate,
      checksumSha256: editBriefAuthorityHash(aggregate),
    }
    const content = `${JSON.stringify(persisted)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_AGGREGATE_BYTES) {
      throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Private Edit Brief authority reached its safe byte ceiling.', 503, {
        byteLength,
        maximumBytes: MAX_AGGREGATE_BYTES,
      })
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: editBriefAuthorityRelativePath(input.scope),
      content,
    })
    return mutationResult.result
  }))
}

function createEmptyAggregate(scope: EditBriefAuthorityScope, now: string): PrivateEditBriefAuthorityAggregate {
  return {
    schemaVersion: PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION,
    privateInternalOnly: true,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    revision: 0,
    markers: [],
    markerMessages: [],
    markerIntents: [],
    attachments: [],
    contextPackages: [],
    conflicts: [],
    qaReports: [],
    planHintPackages: [],
    lifecycle: { phase: 'planning', mutable: true },
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parsePersistedRecord(content: string, scope: EditBriefAuthorityScope): PrivateEditBriefAuthorityAggregate {
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidAggregate('Private Edit Brief authority is not valid JSON.')
  }
  const envelope = z.object({
    recordVersion: z.literal(PRIVATE_EDIT_BRIEF_AUTHORITY_VERSION),
    source: z.literal(PRIVATE_EDIT_BRIEF_AUTHORITY_SOURCE),
    aggregate: aggregateSchema,
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict().safeParse(value)
  if (!envelope.success) throw invalidAggregate('Private Edit Brief authority has an unsupported record shape.')
  if (envelope.data.checksumSha256 !== editBriefAuthorityHash(envelope.data.aggregate)) {
    throw invalidAggregate('Private Edit Brief authority checksum is invalid.')
  }
  assertAggregateValid(envelope.data.aggregate, scope)
  return envelope.data.aggregate
}

function assertAggregateValid(aggregate: PrivateEditBriefAuthorityAggregate, scope: EditBriefAuthorityScope): void {
  const parsed = aggregateSchema.safeParse(aggregate)
  if (!parsed.success) throw invalidAggregate('Private Edit Brief authority failed strict aggregate validation.')
  if (
    aggregate.ownerUserId !== scope.ownerUserId
    || aggregate.workspaceId !== scope.workspaceId
    || aggregate.projectId !== scope.projectId
    || aggregate.editSessionId !== scope.editSessionId
  ) throw invalidAggregate('Private Edit Brief authority scope does not match its storage scope.')
  if (aggregate.lifecycle.mutable !== (aggregate.lifecycle.phase === 'planning')) {
    throw invalidAggregate('Edit Brief lifecycle mutability does not match its phase.')
  }
  if (
    !aggregate.lifecycle.mutable
    && (
      !aggregate.lifecycle.approvedSnapshotId
      || !aggregate.lifecycle.publicationBindingHash
      || !aggregate.lifecycle.authorityInputHash
      || aggregate.lifecycle.authorityRevisionAtLock === undefined
      || !aggregate.lifecycle.lockedAt
    )
  ) throw invalidAggregate('Locked Edit Brief lifecycle is missing exact publication binding evidence.')
  assertUnique(aggregate.markers.map((entry) => entry.id), 'marker')
  assertUnique(aggregate.markerMessages.map((entry) => entry.id), 'marker message')
  assertUnique(aggregate.markerIntents.map((entry) => entry.id), 'marker intent')
  assertUnique(aggregate.markerIntents.map((entry) => entry.markerId), 'marker intent owner')
  assertUnique(aggregate.attachments.map((entry) => entry.id), 'attachment')
  assertUnique(aggregate.contextPackages.map((entry) => entry.id), 'context package')
  assertUnique(aggregate.conflicts.map((entry) => entry.id), 'conflict')
  assertUnique(aggregate.qaReports.map((entry) => entry.id), 'QA report')
  assertUnique(aggregate.planHintPackages.map((entry) => entry.id), 'Plan Hint package')
  const markerIds = new Set(aggregate.markers.map((entry) => entry.id))
  for (const markerChild of [...aggregate.markerMessages, ...aggregate.markerIntents, ...aggregate.attachments, ...aggregate.contextPackages]) {
    if (!markerIds.has(markerChild.markerId)) throw invalidAggregate('Marker child record references an unknown marker.')
  }
  for (const marker of aggregate.markers) {
    if (
      marker.editSessionId !== aggregate.editSessionId
      || marker.briefId !== aggregate.brief?.id
    ) throw invalidAggregate('Marker exact-session or optional Brief lineage is invalid.')
    const hasFrames = marker.startFrame !== undefined && marker.frameRate !== undefined
    if ((marker.timingStatus === 'frame_authoritative') !== hasFrames) {
      throw invalidAggregate('Marker timing authority is inconsistent with its frame evidence.')
    }
    if (marker.timeKind === 'range' && marker.timingStatus === 'frame_authoritative' && marker.endFrame === undefined) {
      throw invalidAggregate('Frame-authoritative range marker is missing endFrame.')
    }
  }
  for (const contextPackage of aggregate.contextPackages) {
    const contextMarker = aggregate.markers.find((marker) => marker.id === contextPackage.markerId)
    if (
      !contextMarker
      || contextPackage.markerRevision !== contextMarker.revision
      || contextPackage.briefContext?.briefId !== aggregate.brief?.id
      || contextPackage.briefContext?.briefRevision !== aggregate.brief?.revision
      || contextPackage.exportContext?.revision !== aggregate.exportSettings?.revision
    ) throw invalidAggregate('Marker context package is stale against current Brief or export authority.')
  }
  for (const planHints of aggregate.planHintPackages) {
    const fingerprintPayload = stableEditBriefAuthorityValue(planHints) as Partial<EditBriefPlanHintPackage>
    delete fingerprintPayload.id
    delete fingerprintPayload.createdAt
    delete fingerprintPayload.planHintFingerprint
    if (
      planHints.preferenceApplicationVersion !== planHints.preferenceBinding.applicationVersion
      || planHints.planInputHash !== editBriefPlanInputHash(planHints)
      || planHints.planHintFingerprint !== editBriefAuthorityHash(fingerprintPayload)
    ) throw invalidAggregate('Plan Hint input or preference binding fingerprint is invalid.')
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(aggregate)
  if (secretLikePaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Private Edit Brief authority contains secret-like fields or values.', 409, { secretLikePaths })
  }
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw invalidAggregate(`Private Edit Brief authority contains duplicate ${label} IDs.`)
}

function invalidAggregate(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function editBriefAuthorityScopeHash(scope: Omit<EditBriefAuthorityScope, 'localStorageRoot'>): string {
  return sha256([
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ].join('\u0000'))
}

export function editBriefAuthorityHash(value: unknown): string {
  return sha256(stableStringify(value))
}

export function editBriefPlanInputHash(
  planHints: Pick<
    EditBriefPlanHintPackage,
    | 'authorityInputHash'
    | 'qaReportId'
    | 'orderedInstructionSources'
    | 'confirmedMarkerHints'
    | 'sourceContextRefs'
    | 'qaWarnings'
    | 'exportTarget'
    | 'preferenceBinding'
    | 'briefSummary'
  >,
): string {
  return editBriefAuthorityHash({
    authorityInputHash: planHints.authorityInputHash,
    qaReportId: planHints.qaReportId,
    orderedInstructionSources: planHints.orderedInstructionSources,
    confirmedMarkerHints: planHints.confirmedMarkerHints,
    sourceContextRefs: planHints.sourceContextRefs,
    qaWarnings: planHints.qaWarnings,
    exportTarget: planHints.exportTarget,
    preferenceBinding: planHints.preferenceBinding,
    briefSummary: planHints.briefSummary,
  })
}

export function editBriefPlanHintFingerprint(payload: EditBriefPlanHintFingerprintPayload): string {
  return editBriefAuthorityHash(payload)
}

export function createEditBriefAuthorityId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export function stableEditBriefAuthorityValue<T>(value: T): T {
  return JSON.parse(stableStringify(value)) as T
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableJsonValue(nested)]),
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function withProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = scopeLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.catch(() => undefined).then(() => current)
  scopeLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (scopeLocks.get(key) === queued) scopeLocks.delete(key)
  }
}
