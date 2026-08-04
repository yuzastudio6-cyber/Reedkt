import { Buffer } from 'node:buffer'
import { z } from 'zod'

import type {
  CreateStorytellingProjectReceiptV2,
  CreateStorytellingProjectReceipt,
  ResolveStorytellingProjectReceiptV2,
  ResolveStorytellingProjectReceipt,
  StorytellingAttentionCode,
  StorytellingAttentionSummary,
  StorytellingChatBootstrap,
  StorytellingDirectorBootstrap,
  StorytellingDirectorNextAction,
  StorytellingLibraryPageV2,
  StorytellingLibraryPage,
  StorytellingProjectNextAction,
  StorytellingProjectSummaryV2,
  StorytellingProjectSummary,
} from '../../../src/types/motion-studio'
import {
  STORYTELLING_CHAT_BOOTSTRAP_VERSION,
  STORYTELLING_CREATE_RECEIPT_V2_VERSION,
  STORYTELLING_CREATE_RECEIPT_VERSION,
  STORYTELLING_EDIT_CATEGORY,
  STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION,
  STORYTELLING_LIBRARY_CURSOR_VERSION,
  STORYTELLING_LIBRARY_PAGE_V2_VERSION,
  STORYTELLING_LIBRARY_PAGE_VERSION,
  STORYTELLING_LIBRARY_ROUTE,
  STORYTELLING_NAMED_EDIT_NAME,
  STORYTELLING_PROJECT_SUMMARY_V2_VERSION,
  STORYTELLING_PROJECT_SUMMARY_VERSION,
  STORYTELLING_RESOLVE_RECEIPT_V2_VERSION,
  STORYTELLING_RESOLVE_RECEIPT_VERSION,
} from '../../../src/types/motion-studio'
import {
  createStorytellingProjectReceiptV2Schema,
  createStorytellingProjectReceiptSchema,
  normalizeStorytellingProjectTitle,
  resolveStorytellingProjectReceiptV2Schema,
  resolveStorytellingProjectReceiptSchema,
  storytellingDirectorBootstrapSchema,
  storytellingChatBootstrapSchema,
  storytellingChatRoute,
  storytellingLibraryPageV2Schema,
  storytellingLibraryPageSchema,
  storytellingProjectSummaryV2Schema,
  storytellingProjectSummarySchema,
  storytellingProjectTitleSchema,
} from '../../../src/lib/motion-studio/contracts'
import { MOTION_STUDIO_STORYTELLING_WORKFLOW_ID } from '../../../src/types/motion-studio/storytelling-workflow'
import {
  projectMotionStudioStorytellingWorkspaceLocation,
  type ProjectMotionStudioStorytellingWorkspaceLocationInput,
} from '../storytelling-workspace'

const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const boundedPageSize = z.number().int().min(1).max(100)

const productionStatus = z.enum([
  'draft',
  'planning',
  'awaiting_review',
  'approved_for_execution',
  'producing',
  'blocked',
  'reviewing',
  'delivery_ready',
  'completed',
  'archived',
])

const productionStage = z.enum([
  'director_brief',
  'story_understanding',
  'research',
  'story_script',
  'references',
  'motion_dna',
  'voice',
  'calibration_reel',
  'scene_board',
  'storyboard',
  'animatic',
  'scene_editor',
  'picture_lock',
  'sound_music',
  'fine_cut',
  'quality_control',
  'delivery',
])

const canonicalTupleInputSchema = z.object({
  authorization: z.object({
    authorizedWorkspaceId: stableId,
    currentMembershipVerified: z.literal(true),
    projectAccessVerified: z.literal(true),
    authorizationCheckedBeforeReplayOrDetail: z.literal(true),
  }).strict(),
  project: z.object({
    id: stableId,
    workspaceId: stableId,
    title: storytellingProjectTitleSchema,
    createdAt: timestamp,
    updatedAt: timestamp,
  }).strict(),
  edit: z.object({
    id: stableId,
    workspaceId: stableId,
    projectId: stableId,
    name: z.literal(STORYTELLING_NAMED_EDIT_NAME),
    category: z.literal(STORYTELLING_EDIT_CATEGORY),
    createdAt: timestamp,
    updatedAt: timestamp,
  }).strict(),
  production: z.object({
    id: stableId,
    workspaceId: stableId,
    projectId: stableId,
    editSessionId: stableId,
    moduleId: z.literal('storytelling'),
    moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
    stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
    status: productionStatus,
    currentStage: productionStage,
    recordVersion: positiveSafeInteger,
    createdAt: timestamp,
    updatedAt: timestamp,
  }).strict(),
  safeAttentionSignal: z.enum([
    'story_direction_required',
    'plan_review_required',
    'private_review_required',
    'production_resumable',
    'production_blocked',
    'retry_available',
    'archived_read_only',
  ]).optional(),
}).strict().superRefine((value, context) => {
  const workspaceId = value.authorization.authorizedWorkspaceId
  if (
    value.project.workspaceId !== workspaceId ||
    value.edit.workspaceId !== workspaceId ||
    value.production.workspaceId !== workspaceId
  ) issue(context, ['authorization'], 'Storytelling tuple is outside the freshly authorized workspace.')
  if (value.edit.projectId !== value.project.id) {
    issue(context, ['edit', 'projectId'], 'Named Edit does not belong to the exact Project.')
  }
  if (
    value.production.projectId !== value.project.id ||
    value.production.editSessionId !== value.edit.id
  ) issue(context, ['production'], 'Storytelling production does not belong to the exact Project and Named Edit.')
  if (value.project.title !== normalizeStorytellingProjectTitle(value.project.title)) {
    issue(context, ['project', 'title'], 'Project title is not canonically normalized.')
  }
  if (value.safeAttentionSignal && !attentionCompatible(value.production.status, value.production.currentStage, value.safeAttentionSignal)) {
    issue(context, ['safeAttentionSignal'], 'Attention signal is not compatible with current authoritative production state.')
  }
})

const cursorPayloadSchema = z.object({
  version: z.literal(STORYTELLING_LIBRARY_CURSOR_VERSION),
  lastActivityAt: timestamp,
  productionId: stableId,
}).strict()

export type StorytellingCanonicalTupleProjectionInput =
  z.input<typeof canonicalTupleInputSchema>

export interface ProjectStorytellingLibraryPageInput {
  tuples: readonly StorytellingCanonicalTupleProjectionInput[]
  limit: number
  cursor?: string
}

export interface StorytellingWorkflowCanonicalTupleProjectionInput {
  tuple: StorytellingCanonicalTupleProjectionInput
  workspace: ProjectMotionStudioStorytellingWorkspaceLocationInput
}

export interface ProjectStorytellingLibraryPageV2Input {
  tuples: readonly StorytellingWorkflowCanonicalTupleProjectionInput[]
  limit: number
  cursor?: string
}

export function projectStorytellingProjectSummary(
  input: StorytellingCanonicalTupleProjectionInput,
): StorytellingProjectSummary {
  const tuple = canonicalTupleInputSchema.parse(input)
  const nextAction = deriveNextAction(tuple)
  const attention = deriveAttention(tuple)
  return storytellingProjectSummarySchema.parse({
    schemaVersion: STORYTELLING_PROJECT_SUMMARY_VERSION,
    productionId: tuple.production.id,
    projectId: tuple.project.id,
    editSessionId: tuple.edit.id,
    title: tuple.project.title,
    status: tuple.production.status,
    currentStage: tuple.production.currentStage,
    lastActivityAt: tuple.production.updatedAt,
    nextAction,
    ...(attention ? { attention } : {}),
    moduleId: tuple.production.moduleId,
    moduleCatalogVersion: tuple.production.moduleCatalogVersion,
    stageProfileId: tuple.production.stageProfileId,
    recordVersion: tuple.production.recordVersion,
    readOnly: tuple.production.status === 'archived',
  })
}

export function projectStorytellingChatBootstrap(
  input: StorytellingCanonicalTupleProjectionInput,
): StorytellingChatBootstrap {
  const tuple = canonicalTupleInputSchema.parse(input)
  return storytellingChatBootstrapSchema.parse({
    schemaVersion: STORYTELLING_CHAT_BOOTSTRAP_VERSION,
    projectId: tuple.project.id,
    editSessionId: tuple.edit.id,
    productionId: tuple.production.id,
    projectTitle: tuple.project.title,
    editName: tuple.edit.name,
    editCategory: tuple.edit.category,
    projectCreatedAt: tuple.project.createdAt,
    editCreatedAt: tuple.edit.createdAt,
    productionCreatedAt: tuple.production.createdAt,
    updatedAt: tuple.production.updatedAt,
    setup: {
      outputFrame: 'unconfirmed',
      targetPlatform: 'unconfirmed',
      sourceMaterial: 'not_attached_optional_during_director_intake',
      sourceCleanupPolicy: 'unconfirmed',
      editLevel: 'unconfirmed',
      voice: 'unconfirmed',
      plan: 'not_created',
      approval: 'not_requested',
      generation: 'not_started',
    },
    moduleId: tuple.production.moduleId,
    moduleCatalogVersion: tuple.production.moduleCatalogVersion,
    stageProfileId: tuple.production.stageProfileId,
    productionRecordVersion: tuple.production.recordVersion,
    libraryRoute: STORYTELLING_LIBRARY_ROUTE,
    chatRoute: storytellingChatRoute(tuple.project.id, tuple.edit.id),
    directorIntakeReady: true,
    browserCacheAuthoritative: false,
    backendSynchronizationAllowedFromBootstrap: false,
    expensiveWorkStarted: false,
  })
}

export function projectCreateStorytellingProjectReceipt(input: {
  tuple: StorytellingCanonicalTupleProjectionInput
  result: 'created' | 'replayed'
}): CreateStorytellingProjectReceipt {
  return createStorytellingProjectReceiptSchema.parse({
    schemaVersion: STORYTELLING_CREATE_RECEIPT_VERSION,
    result: input.result,
    summary: projectStorytellingProjectSummary(input.tuple),
    bootstrap: projectStorytellingChatBootstrap(input.tuple),
  })
}

export function projectResolveStorytellingProjectReceipt(
  input: StorytellingCanonicalTupleProjectionInput,
): ResolveStorytellingProjectReceipt {
  const summary = projectStorytellingProjectSummary(input)
  return resolveStorytellingProjectReceiptSchema.parse({
    schemaVersion: STORYTELLING_RESOLVE_RECEIPT_VERSION,
    resolution: summary.readOnly ? 'archived_read_only' : 'current',
    summary,
    bootstrap: projectStorytellingChatBootstrap(input),
  })
}

export function projectStorytellingProjectSummaryV2(
  input: StorytellingWorkflowCanonicalTupleProjectionInput,
): StorytellingProjectSummaryV2 {
  assertSameWorkflowProjectionSource(input)
  const legacy = projectStorytellingProjectSummary(input.tuple)
  const workspaceLocation = projectMotionStudioStorytellingWorkspaceLocation(input.workspace)
  assertSameWorkflowTuple(legacy, workspaceLocation)
  return storytellingProjectSummaryV2Schema.parse({
    schemaVersion: STORYTELLING_PROJECT_SUMMARY_V2_VERSION,
    productionId: legacy.productionId,
    projectId: legacy.projectId,
    editSessionId: legacy.editSessionId,
    title: legacy.title,
    status: legacy.status,
    currentStage: legacy.currentStage,
    lastActivityAt: legacy.lastActivityAt,
    nextAction: directorNextAction(legacy.nextAction),
    ...(legacy.attention ? { attention: legacy.attention } : {}),
    moduleId: legacy.moduleId,
    moduleCatalogVersion: legacy.moduleCatalogVersion,
    stageProfileId: legacy.stageProfileId,
    recordVersion: legacy.recordVersion,
    readOnly: legacy.readOnly,
    productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
    workspaceLocation,
  })
}

export function projectStorytellingDirectorBootstrap(
  input: StorytellingWorkflowCanonicalTupleProjectionInput,
): StorytellingDirectorBootstrap {
  assertSameWorkflowProjectionSource(input)
  const legacy = projectStorytellingChatBootstrap(input.tuple)
  const workspaceLocation = projectMotionStudioStorytellingWorkspaceLocation(input.workspace)
  assertSameWorkflowTuple({
    productionId: legacy.productionId,
    projectId: legacy.projectId,
    editSessionId: legacy.editSessionId,
    recordVersion: legacy.productionRecordVersion,
  }, workspaceLocation)
  return storytellingDirectorBootstrapSchema.parse({
    schemaVersion: STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION,
    projectId: legacy.projectId,
    editSessionId: legacy.editSessionId,
    productionId: legacy.productionId,
    projectTitle: legacy.projectTitle,
    editName: legacy.editName,
    editingCategory: legacy.editCategory,
    editingCategoryDeterminesWorkflow: false,
    productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
    projectCreatedAt: legacy.projectCreatedAt,
    editCreatedAt: legacy.editCreatedAt,
    productionCreatedAt: legacy.productionCreatedAt,
    updatedAt: legacy.updatedAt,
    setup: legacy.setup,
    moduleId: legacy.moduleId,
    moduleCatalogVersion: legacy.moduleCatalogVersion,
    stageProfileId: legacy.stageProfileId,
    productionRecordVersion: legacy.productionRecordVersion,
    workspaceLocation,
    directorIntakeReady: true,
    browserCacheAuthoritative: false,
    backendSynchronizationAllowedFromBootstrap: false,
    expensiveWorkStarted: false,
  })
}

export function projectCreateStorytellingProjectReceiptV2(input: {
  tuple: StorytellingWorkflowCanonicalTupleProjectionInput
  result: 'created' | 'replayed'
}): CreateStorytellingProjectReceiptV2 {
  return createStorytellingProjectReceiptV2Schema.parse({
    schemaVersion: STORYTELLING_CREATE_RECEIPT_V2_VERSION,
    result: input.result,
    summary: projectStorytellingProjectSummaryV2(input.tuple),
    bootstrap: projectStorytellingDirectorBootstrap(input.tuple),
  })
}

export function projectResolveStorytellingProjectReceiptV2(
  input: StorytellingWorkflowCanonicalTupleProjectionInput,
): ResolveStorytellingProjectReceiptV2 {
  const summary = projectStorytellingProjectSummaryV2(input)
  return resolveStorytellingProjectReceiptV2Schema.parse({
    schemaVersion: STORYTELLING_RESOLVE_RECEIPT_V2_VERSION,
    resolution: summary.readOnly ? 'archived_read_only' : 'current',
    summary,
    bootstrap: projectStorytellingDirectorBootstrap(input),
  })
}

export function projectStorytellingLibraryPage(
  input: ProjectStorytellingLibraryPageInput,
): StorytellingLibraryPage {
  const limit = boundedPageSize.parse(input.limit)
  const after = input.cursor ? decodeStorytellingLibraryCursor(input.cursor) : undefined
  const summaries = input.tuples
    .map(projectStorytellingProjectSummary)
    .sort(compareRecentFirst)
    .filter((summary) => !after || isAfterCursor(summary, after))
  const pageItems = summaries.slice(0, limit)
  const hasMore = summaries.length > limit
  const last = pageItems.at(-1)
  const nextCursor = hasMore && last
    ? encodeStorytellingLibraryCursor({
        lastActivityAt: last.lastActivityAt,
        productionId: last.productionId,
      })
    : undefined
  return storytellingLibraryPageSchema.parse({
    schemaVersion: STORYTELLING_LIBRARY_PAGE_VERSION,
    items: pageItems,
    hasMore,
    ...(nextCursor ? { nextCursor } : {}),
  })
}

export function projectStorytellingLibraryPageV2(
  input: ProjectStorytellingLibraryPageV2Input,
): StorytellingLibraryPageV2 {
  const limit = boundedPageSize.parse(input.limit)
  const after = input.cursor ? decodeStorytellingLibraryCursor(input.cursor) : undefined
  const summaries = input.tuples
    .map(projectStorytellingProjectSummaryV2)
    .sort(compareRecentFirstV2)
    .filter((summary) => !after || isAfterCursor(summary, after))
  const pageItems = summaries.slice(0, limit)
  const hasMore = summaries.length > limit
  const last = pageItems.at(-1)
  const nextCursor = hasMore && last
    ? encodeStorytellingLibraryCursor({
        lastActivityAt: last.lastActivityAt,
        productionId: last.productionId,
      })
    : undefined
  return storytellingLibraryPageV2Schema.parse({
    schemaVersion: STORYTELLING_LIBRARY_PAGE_V2_VERSION,
    items: pageItems,
    hasMore,
    ...(nextCursor ? { nextCursor } : {}),
  })
}

export function encodeStorytellingLibraryCursor(input: {
  lastActivityAt: string
  productionId: string
}): string {
  const payload = cursorPayloadSchema.parse({
    version: STORYTELLING_LIBRARY_CURSOR_VERSION,
    ...input,
  })
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeStorytellingLibraryCursor(value: string): {
  lastActivityAt: string
  productionId: string
} {
  if (!/^[A-Za-z0-9_-]{1,1024}$/u.test(value)) throw new Error('Storytelling cursor is malformed.')
  let decoded: string
  try {
    decoded = Buffer.from(value, 'base64url').toString('utf8')
  } catch {
    throw new Error('Storytelling cursor is malformed.')
  }
  const canonicalEncoding = Buffer.from(decoded, 'utf8').toString('base64url')
  if (canonicalEncoding !== value) throw new Error('Storytelling cursor is not canonically encoded.')
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(decoded) as unknown
  } catch {
    throw new Error('Storytelling cursor is malformed.')
  }
  const parsed = cursorPayloadSchema.safeParse(parsedJson)
  if (!parsed.success) throw new Error('Storytelling cursor is malformed.')
  return {
    lastActivityAt: parsed.data.lastActivityAt,
    productionId: parsed.data.productionId,
  }
}

function deriveNextAction(
  tuple: z.output<typeof canonicalTupleInputSchema>,
): StorytellingProjectNextAction {
  const chatRoute = storytellingChatRoute(tuple.project.id, tuple.edit.id)
  switch (tuple.production.status) {
    case 'archived':
      return { kind: 'open_read_only', label: 'Open read-only', chatRoute }
    case 'blocked':
      return { kind: 'resolve_issue_in_chat', label: 'Resolve issue in Chat', chatRoute }
    case 'awaiting_review':
    case 'reviewing':
    case 'delivery_ready':
    case 'completed':
      return { kind: 'review_in_chat', label: 'Review in Chat', chatRoute }
    case 'approved_for_execution':
    case 'producing':
      return { kind: 'resume_in_chat', label: 'Resume in Chat', chatRoute }
    case 'draft':
    case 'planning':
      return { kind: 'continue_in_chat', label: 'Continue in Chat', chatRoute }
  }
}

function deriveAttention(
  tuple: z.output<typeof canonicalTupleInputSchema>,
): StorytellingAttentionSummary | undefined {
  const code = tuple.safeAttentionSignal ?? defaultAttentionCode(tuple.production.status, tuple.production.currentStage)
  switch (code) {
    case 'story_direction_required':
      return { category: 'needs_input', code, label: 'Story direction needed' }
    case 'plan_review_required':
      return { category: 'review_required', code, label: 'Plan review needed' }
    case 'private_review_required':
      return { category: 'review_required', code, label: 'Private review needed' }
    case 'production_resumable':
      return { category: 'resumable', code, label: 'Production can resume' }
    case 'production_blocked':
      return { category: 'blocked', code, label: 'Needs attention' }
    case 'retry_available':
      return { category: 'retry_available', code, label: 'Retry available' }
    case 'archived_read_only':
      return { category: 'archived_read_only', code, label: 'Archived · Read-only' }
    case undefined:
      return undefined
  }
}

function directorNextAction(action: StorytellingProjectNextAction): StorytellingDirectorNextAction {
  switch (action.kind) {
    case 'continue_in_chat': return { kind: 'continue_in_director', label: 'Continue' }
    case 'resume_in_chat': return { kind: 'resume_in_director', label: 'Resume' }
    case 'review_in_chat': return { kind: 'review_in_director', label: 'Review' }
    case 'resolve_issue_in_chat': return { kind: 'resolve_issue_in_director', label: 'Resolve issue' }
    case 'open_read_only': return { kind: 'open_read_only', label: 'Open read-only' }
  }
}

function defaultAttentionCode(
  status: z.output<typeof productionStatus>,
  stage: z.output<typeof productionStage>,
): StorytellingAttentionCode | undefined {
  if (status === 'archived') return 'archived_read_only'
  if (status === 'blocked') return 'production_blocked'
  if (status === 'producing' || status === 'approved_for_execution') return 'production_resumable'
  if (status === 'awaiting_review') {
    return stage === 'director_brief' || stage === 'story_understanding'
      ? 'plan_review_required'
      : 'private_review_required'
  }
  if (status === 'reviewing' || status === 'delivery_ready') return 'private_review_required'
  if (status === 'draft' && stage === 'director_brief') return 'story_direction_required'
  return undefined
}

function attentionCompatible(
  status: z.output<typeof productionStatus>,
  stage: z.output<typeof productionStage>,
  code: StorytellingAttentionCode,
): boolean {
  if (code === 'retry_available') return status === 'blocked'
  return code === defaultAttentionCode(status, stage)
}

function compareRecentFirst(left: StorytellingProjectSummary, right: StorytellingProjectSummary): number {
  const timestampOrder = timestampMillis(right.lastActivityAt) - timestampMillis(left.lastActivityAt)
  return timestampOrder || right.productionId.localeCompare(left.productionId)
}

function compareRecentFirstV2(left: StorytellingProjectSummaryV2, right: StorytellingProjectSummaryV2): number {
  const timestampOrder = timestampMillis(right.lastActivityAt) - timestampMillis(left.lastActivityAt)
  return timestampOrder || right.productionId.localeCompare(left.productionId)
}

function isAfterCursor(
  item: { lastActivityAt: string; productionId: string },
  cursorValue: { lastActivityAt: string; productionId: string },
): boolean {
  const itemTime = timestampMillis(item.lastActivityAt)
  const cursorTime = timestampMillis(cursorValue.lastActivityAt)
  return itemTime < cursorTime ||
    (itemTime === cursorTime && item.productionId < cursorValue.productionId)
}

function timestampMillis(value: string): number {
  const result = Date.parse(value)
  if (!Number.isFinite(result)) throw new Error('Storytelling timestamp is invalid.')
  return result
}

function assertSameWorkflowTuple(
  lifecycle: {
    productionId: string
    projectId: string
    editSessionId: string
    recordVersion: number
  },
  workspace: ReturnType<typeof projectMotionStudioStorytellingWorkspaceLocation>,
): void {
  if (
    lifecycle.productionId !== workspace.productionId ||
    lifecycle.projectId !== workspace.projectId ||
    lifecycle.editSessionId !== workspace.editSessionId ||
    lifecycle.recordVersion !== workspace.workflowBinding.bindingRecordVersion
  ) {
    throw new Error('Storytelling lifecycle and dedicated workspace projections do not identify one exact production tuple.')
  }
}

function assertSameWorkflowProjectionSource(
  input: StorytellingWorkflowCanonicalTupleProjectionInput,
): void {
  const lifecycle = input.tuple
  const workspace = input.workspace
  if (
    lifecycle.authorization.authorizedWorkspaceId !== workspace.authorization.authorizedWorkspaceId ||
    lifecycle.project.id !== workspace.project.id ||
    lifecycle.project.workspaceId !== workspace.project.workspaceId ||
    lifecycle.edit.id !== workspace.edit.id ||
    lifecycle.edit.workspaceId !== workspace.edit.workspaceId ||
    lifecycle.edit.projectId !== workspace.edit.projectId ||
    lifecycle.edit.category !== workspace.edit.category ||
    lifecycle.production.id !== workspace.production.id ||
    lifecycle.production.workspaceId !== workspace.production.workspaceId ||
    lifecycle.production.projectId !== workspace.production.projectId ||
    lifecycle.production.editSessionId !== workspace.production.editSessionId ||
    lifecycle.production.moduleId !== workspace.production.moduleId ||
    lifecycle.production.moduleCatalogVersion !== workspace.production.moduleCatalogVersion ||
    lifecycle.production.stageProfileId !== workspace.production.stageProfileId ||
    lifecycle.production.recordVersion !== workspace.production.recordVersion
  ) {
    throw new Error('Storytelling lifecycle and dedicated workspace sources do not identify one exact authorized production tuple.')
  }
}

function issue(context: z.RefinementCtx, path: PropertyKey[], message: string): void {
  context.addIssue({ code: 'custom', path, message })
}
