import { z } from 'zod'

import type {
  CreateStorytellingProjectReceiptV2,
  CreateStorytellingProjectReceipt,
  CreateStorytellingProjectRequest,
  ResolveStorytellingProjectReceiptV2,
  ResolveStorytellingProjectReceipt,
  StorytellingChatBootstrap,
  StorytellingDirectorBootstrap,
  StorytellingLibraryPageV2,
  StorytellingLibraryPage,
  StorytellingProjectSummaryV2,
  StorytellingProjectSummary,
} from '../../../types/motion-studio/storytelling-lifecycle'
import {
  STORYTELLING_CHAT_BOOTSTRAP_VERSION,
  STORYTELLING_CREATE_RECEIPT_V2_VERSION,
  STORYTELLING_CREATE_RECEIPT_VERSION,
  STORYTELLING_CREATE_REQUEST_VERSION,
  STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION,
  STORYTELLING_EDIT_CATEGORY,
  STORYTELLING_LIBRARY_PAGE_V2_VERSION,
  STORYTELLING_LIBRARY_PAGE_VERSION,
  STORYTELLING_LIBRARY_ROUTE,
  STORYTELLING_NAMED_EDIT_NAME,
  STORYTELLING_PROJECT_SUMMARY_V2_VERSION,
  STORYTELLING_PROJECT_SUMMARY_VERSION,
  STORYTELLING_RESOLVE_RECEIPT_V2_VERSION,
  STORYTELLING_RESOLVE_RECEIPT_VERSION,
} from '../../../types/motion-studio/storytelling-lifecycle'
import {
  motionStudioStorytellingWorkspaceLocationSchema,
  motionStudioStorytellingWorkspaceRoute,
} from './storytelling-workflow'
import { MOTION_STUDIO_STORYTELLING_WORKFLOW_ID } from '../../../types/motion-studio/storytelling-workflow'

const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const cursor = z.string().min(1).max(1_024).regex(/^[A-Za-z0-9_-]+$/u)

export const storytellingProjectTitleSchema = z.string()
  .min(1)
  .max(80)
  .refine((value) => value === normalizeStorytellingProjectTitle(value))
  .refine((value) => !containsForbiddenText(value))
  .refine((value) => !/[<>]/u.test(value))

const safeLabel = z.string().trim().min(1).max(160)
  .refine((value) => !containsForbiddenText(value))

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

export const storytellingProjectNextActionSchema = z.discriminatedUnion('kind', [
  nextAction('continue_in_chat', 'Continue in Chat'),
  nextAction('resume_in_chat', 'Resume in Chat'),
  nextAction('review_in_chat', 'Review in Chat'),
  nextAction('resolve_issue_in_chat', 'Resolve issue in Chat'),
  nextAction('open_read_only', 'Open read-only'),
])

export const storytellingAttentionSummarySchema = z.object({
  category: z.enum([
    'needs_input',
    'review_required',
    'resumable',
    'blocked',
    'retry_available',
    'archived_read_only',
  ]),
  code: z.enum([
    'story_direction_required',
    'plan_review_required',
    'private_review_required',
    'production_resumable',
    'production_blocked',
    'retry_available',
    'archived_read_only',
  ]),
  label: safeLabel,
}).strict()

export const storytellingLibraryResourceStateSchema = z.enum([
  'loading',
  'empty',
  'ready',
  'needs_input',
  'review_required',
  'resumable',
  'blocked',
  'retry_available',
  'stale',
  'unavailable',
  'access_denied',
  'not_found',
  'archived_read_only',
])

export const storytellingProjectSummarySchema:
z.ZodType<StorytellingProjectSummary> = z.object({
  schemaVersion: z.literal(STORYTELLING_PROJECT_SUMMARY_VERSION),
  productionId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  title: storytellingProjectTitleSchema,
  status: productionStatus,
  currentStage: productionStage,
  lastActivityAt: timestamp,
  nextAction: storytellingProjectNextActionSchema,
  attention: storytellingAttentionSummarySchema.optional(),
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  recordVersion: positiveSafeInteger,
  readOnly: z.boolean(),
}).strict().superRefine((value, context) => {
  assertExactChatRoute(value.projectId, value.editSessionId, value.nextAction.chatRoute, context, ['nextAction', 'chatRoute'])
  if (value.readOnly !== (value.status === 'archived')) {
    issue(context, ['readOnly'], 'Only archived Storytelling productions are read-only in v1.')
  }
  if ((value.status === 'archived') !== (value.nextAction.kind === 'open_read_only')) {
    issue(context, ['nextAction', 'kind'], 'Archived Storytelling productions require the read-only action.')
  }
})

export const storytellingLibraryPageSchema:
z.ZodType<StorytellingLibraryPage> = z.object({
  schemaVersion: z.literal(STORYTELLING_LIBRARY_PAGE_VERSION),
  items: z.array(storytellingProjectSummarySchema).max(100).readonly(),
  hasMore: z.boolean(),
  nextCursor: cursor.optional(),
}).strict().superRefine((value, context) => {
  if (value.hasMore !== Boolean(value.nextCursor)) {
    issue(context, ['nextCursor'], 'A next cursor is required exactly when another page exists.')
  }
  const identities = value.items.map((item) => item.productionId)
  if (new Set(identities).size !== identities.length) {
    issue(context, ['items'], 'A Storytelling page cannot contain duplicate productions.')
  }
})

export const createStorytellingProjectRequestSchema:
z.ZodType<CreateStorytellingProjectRequest> = z.object({
  schemaVersion: z.literal(STORYTELLING_CREATE_REQUEST_VERSION),
  title: storytellingProjectTitleSchema,
}).strict()

export const storytellingUnconfirmedSetupStateSchema = z.object({
  outputFrame: z.literal('unconfirmed'),
  targetPlatform: z.literal('unconfirmed'),
  sourceMaterial: z.literal('not_attached_optional_during_director_intake'),
  sourceCleanupPolicy: z.literal('unconfirmed'),
  editLevel: z.literal('unconfirmed'),
  voice: z.literal('unconfirmed'),
  plan: z.literal('not_created'),
  approval: z.literal('not_requested'),
  generation: z.literal('not_started'),
}).strict()

export const storytellingChatBootstrapSchema:
z.ZodType<StorytellingChatBootstrap> = z.object({
  schemaVersion: z.literal(STORYTELLING_CHAT_BOOTSTRAP_VERSION),
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  projectTitle: storytellingProjectTitleSchema,
  editName: z.literal(STORYTELLING_NAMED_EDIT_NAME),
  editCategory: z.literal(STORYTELLING_EDIT_CATEGORY),
  projectCreatedAt: timestamp,
  editCreatedAt: timestamp,
  productionCreatedAt: timestamp,
  updatedAt: timestamp,
  setup: storytellingUnconfirmedSetupStateSchema,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  productionRecordVersion: positiveSafeInteger,
  libraryRoute: z.literal(STORYTELLING_LIBRARY_ROUTE),
  chatRoute: z.string().min(1).max(512),
  directorIntakeReady: z.literal(true),
  browserCacheAuthoritative: z.literal(false),
  backendSynchronizationAllowedFromBootstrap: z.literal(false),
  expensiveWorkStarted: z.literal(false),
}).strict().superRefine((value, context) => {
  assertExactChatRoute(value.projectId, value.editSessionId, value.chatRoute, context, ['chatRoute'])
})

export const createStorytellingProjectReceiptSchema:
z.ZodType<CreateStorytellingProjectReceipt> = z.object({
  schemaVersion: z.literal(STORYTELLING_CREATE_RECEIPT_VERSION),
  result: z.enum(['created', 'replayed']),
  summary: storytellingProjectSummarySchema,
  bootstrap: storytellingChatBootstrapSchema,
}).strict().superRefine((value, context) => {
  assertSameReceiptTuple(value.summary, value.bootstrap, context)
})

export const resolveStorytellingProjectReceiptSchema:
z.ZodType<ResolveStorytellingProjectReceipt> = z.object({
  schemaVersion: z.literal(STORYTELLING_RESOLVE_RECEIPT_VERSION),
  resolution: z.enum(['current', 'archived_read_only']),
  summary: storytellingProjectSummarySchema,
  bootstrap: storytellingChatBootstrapSchema,
}).strict().superRefine((value, context) => {
  assertSameReceiptTuple(value.summary, value.bootstrap, context)
  if ((value.resolution === 'archived_read_only') !== value.summary.readOnly) {
    issue(context, ['resolution'], 'Resolve state must match the exact production read-only state.')
  }
})

const storytellingDirectorNextActionSchema = z.discriminatedUnion('kind', [
  directorNextAction('continue_in_director', 'Continue'),
  directorNextAction('resume_in_director', 'Resume'),
  directorNextAction('review_in_director', 'Review'),
  directorNextAction('resolve_issue_in_director', 'Resolve issue'),
  directorNextAction('open_read_only', 'Open read-only'),
])

export const storytellingProjectSummaryV2Schema:
z.ZodType<StorytellingProjectSummaryV2> = z.object({
  schemaVersion: z.literal(STORYTELLING_PROJECT_SUMMARY_V2_VERSION),
  productionId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  title: storytellingProjectTitleSchema,
  status: productionStatus,
  currentStage: productionStage,
  lastActivityAt: timestamp,
  nextAction: storytellingDirectorNextActionSchema,
  attention: storytellingAttentionSummarySchema.optional(),
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  recordVersion: positiveSafeInteger,
  readOnly: z.boolean(),
  productWorkflow: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_ID),
  workspaceLocation: motionStudioStorytellingWorkspaceLocationSchema,
}).strict().superRefine((value, context) => {
  assertExactWorkflowLocation(value, value.workspaceLocation, context, ['workspaceLocation'])
  if (value.readOnly !== (value.status === 'archived')) {
    issue(context, ['readOnly'], 'Only archived Storytelling productions are read-only in V2.')
  }
  if ((value.status === 'archived') !== (value.nextAction.kind === 'open_read_only')) {
    issue(context, ['nextAction', 'kind'], 'Archived Storytelling productions require the read-only action.')
  }
})

export const storytellingLibraryPageV2Schema:
z.ZodType<StorytellingLibraryPageV2> = z.object({
  schemaVersion: z.literal(STORYTELLING_LIBRARY_PAGE_V2_VERSION),
  items: z.array(storytellingProjectSummaryV2Schema).max(100).readonly(),
  hasMore: z.boolean(),
  nextCursor: cursor.optional(),
}).strict().superRefine((value, context) => {
  if (value.hasMore !== Boolean(value.nextCursor)) {
    issue(context, ['nextCursor'], 'A next cursor is required exactly when another V2 page exists.')
  }
  const identities = value.items.map((item) => item.productionId)
  if (new Set(identities).size !== identities.length) {
    issue(context, ['items'], 'A Storytelling V2 page cannot contain duplicate productions.')
  }
})

export const storytellingDirectorBootstrapSchema:
z.ZodType<StorytellingDirectorBootstrap> = z.object({
  schemaVersion: z.literal(STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION),
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  projectTitle: storytellingProjectTitleSchema,
  editName: z.literal(STORYTELLING_NAMED_EDIT_NAME),
  editingCategory: z.literal(STORYTELLING_EDIT_CATEGORY),
  editingCategoryDeterminesWorkflow: z.literal(false),
  productWorkflow: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_ID),
  projectCreatedAt: timestamp,
  editCreatedAt: timestamp,
  productionCreatedAt: timestamp,
  updatedAt: timestamp,
  setup: storytellingUnconfirmedSetupStateSchema,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  productionRecordVersion: positiveSafeInteger,
  workspaceLocation: motionStudioStorytellingWorkspaceLocationSchema,
  directorIntakeReady: z.literal(true),
  browserCacheAuthoritative: z.literal(false),
  backendSynchronizationAllowedFromBootstrap: z.literal(false),
  expensiveWorkStarted: z.literal(false),
}).strict().superRefine((value, context) => {
  assertExactWorkflowLocation({
    productionId: value.productionId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    recordVersion: value.productionRecordVersion,
    productWorkflow: value.productWorkflow,
  }, value.workspaceLocation, context, ['workspaceLocation'])
})

export const createStorytellingProjectReceiptV2Schema:
z.ZodType<CreateStorytellingProjectReceiptV2> = z.object({
  schemaVersion: z.literal(STORYTELLING_CREATE_RECEIPT_V2_VERSION),
  result: z.enum(['created', 'replayed']),
  summary: storytellingProjectSummaryV2Schema,
  bootstrap: storytellingDirectorBootstrapSchema,
}).strict().superRefine((value, context) => {
  assertSameV2ReceiptTuple(value.summary, value.bootstrap, context)
})

export const resolveStorytellingProjectReceiptV2Schema:
z.ZodType<ResolveStorytellingProjectReceiptV2> = z.object({
  schemaVersion: z.literal(STORYTELLING_RESOLVE_RECEIPT_V2_VERSION),
  resolution: z.enum(['current', 'archived_read_only']),
  summary: storytellingProjectSummaryV2Schema,
  bootstrap: storytellingDirectorBootstrapSchema,
}).strict().superRefine((value, context) => {
  assertSameV2ReceiptTuple(value.summary, value.bootstrap, context)
  if ((value.resolution === 'archived_read_only') !== value.summary.readOnly) {
    issue(context, ['resolution'], 'V2 resolve state must match the exact production read-only state.')
  }
})

export function normalizeStorytellingProjectTitle(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

export function storytellingChatRoute(projectId: string, editSessionId: string): string {
  return motionStudioStorytellingWorkspaceRoute(
    stableId.parse(projectId),
    stableId.parse(editSessionId),
  )
}

function nextAction<TKind extends string, TLabel extends string>(kind: TKind, label: TLabel) {
  return z.object({
    kind: z.literal(kind),
    label: z.literal(label),
    chatRoute: z.string().min(1).max(512),
  }).strict()
}

function directorNextAction<TKind extends string, TLabel extends string>(kind: TKind, label: TLabel) {
  return z.object({
    kind: z.literal(kind),
    label: z.literal(label),
  }).strict()
}

function assertExactChatRoute(
  projectId: string,
  editSessionId: string,
  route: string,
  context: z.RefinementCtx,
  path: PropertyKey[],
): void {
  if (route !== storytellingChatRoute(projectId, editSessionId)) {
    issue(context, path, 'Chat route must be derived from the exact Project and Named Edit tuple.')
  }
}

function assertSameReceiptTuple(
  summary: StorytellingProjectSummary,
  bootstrap: StorytellingChatBootstrap,
  context: z.RefinementCtx,
): void {
  if (
    summary.projectId !== bootstrap.projectId ||
    summary.editSessionId !== bootstrap.editSessionId ||
    summary.productionId !== bootstrap.productionId ||
    summary.title !== bootstrap.projectTitle ||
    summary.recordVersion !== bootstrap.productionRecordVersion ||
    summary.moduleId !== bootstrap.moduleId ||
    summary.moduleCatalogVersion !== bootstrap.moduleCatalogVersion ||
    summary.stageProfileId !== bootstrap.stageProfileId ||
    summary.nextAction.chatRoute !== bootstrap.chatRoute
  ) {
    issue(context, ['bootstrap'], 'Storytelling receipt projections must resolve one exact canonical tuple.')
  }
}

function assertExactWorkflowLocation(
  identity: {
    productionId: string
    projectId: string
    editSessionId: string
    recordVersion: number
    productWorkflow: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
  },
  location: StorytellingProjectSummaryV2['workspaceLocation'],
  context: z.RefinementCtx,
  path: PropertyKey[],
): void {
  if (
    identity.productWorkflow !== location.workflowId ||
    identity.productionId !== location.productionId ||
    identity.projectId !== location.projectId ||
    identity.editSessionId !== location.editSessionId ||
    identity.recordVersion !== location.workflowBinding.bindingRecordVersion ||
    location.workspaceRoute !== storytellingChatRoute(identity.projectId, identity.editSessionId) ||
    location.normalEditRouteReused ||
    location.queryParameterCanPromoteWorkflow
  ) {
    issue(context, path, 'Storytelling V2 lifecycle projection must bind one exact dedicated Director workspace.')
  }
}

function assertSameV2ReceiptTuple(
  summary: StorytellingProjectSummaryV2,
  bootstrap: StorytellingDirectorBootstrap,
  context: z.RefinementCtx,
): void {
  if (
    summary.projectId !== bootstrap.projectId ||
    summary.editSessionId !== bootstrap.editSessionId ||
    summary.productionId !== bootstrap.productionId ||
    summary.title !== bootstrap.projectTitle ||
    summary.recordVersion !== bootstrap.productionRecordVersion ||
    summary.productWorkflow !== bootstrap.productWorkflow ||
    summary.workspaceLocation.workflowBinding.bindingDigest !==
      bootstrap.workspaceLocation.workflowBinding.bindingDigest ||
    summary.workspaceLocation.workspaceRoute !== bootstrap.workspaceLocation.workspaceRoute
  ) {
    issue(context, ['bootstrap'], 'Storytelling V2 receipt projections must resolve one exact workflow-bound tuple.')
  }
}

function issue(context: z.RefinementCtx, path: PropertyKey[], message: string): void {
  context.addIssue({ code: 'custom', path, message })
}

function containsForbiddenText(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    if (
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      (codePoint >= 0x2028 && codePoint <= 0x202e) ||
      (codePoint >= 0x2066 && codePoint <= 0x2069)
    ) return true
  }
  return false
}
