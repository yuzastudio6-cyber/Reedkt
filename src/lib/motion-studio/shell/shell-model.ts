import type { ApiResponseEnvelope } from '../../../backend/api/api-runtime-contracts'
import type {
  MotionStudioJobAttemptSummaryDto,
  MotionStudioJobDto,
  MotionStudioJobStatus,
  MotionStudioProductionDto,
  MotionStudioStage,
  MotionStudioStatus,
  MotionStudioWorkGraphDto,
  MotionStudioWorkspaceGroup,
  MotionStudioWorkspaceMode,
  ProductionMode,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_CANONICAL_RESOURCE_STATES,
  MOTION_STUDIO_STAGE_GROUPS,
  MOTION_STUDIO_STORYTELLING_STAGE_ORDER,
} from '../contracts/constants'

export type MotionStudioResourceState = typeof MOTION_STUDIO_CANONICAL_RESOURCE_STATES[number]

export interface MotionStudioStagePresentation {
  stage: MotionStudioStage
  group: MotionStudioWorkspaceGroup
  label: string
  description: string
}

export interface MotionStudioGroupPresentation {
  group: MotionStudioWorkspaceGroup
  label: string
  description: string
  stages: readonly MotionStudioStagePresentation[]
}

export const MOTION_STUDIO_GROUP_ORDER = [
  'plan',
  'design',
  'produce',
  'review',
  'deliver',
] as const satisfies readonly MotionStudioWorkspaceGroup[]

const stageCopy: Record<MotionStudioStage, Omit<MotionStudioStagePresentation, 'stage' | 'group'>> = {
  director_brief: { label: 'Director Brief', description: 'Story goal, audience, format, and production boundaries.' },
  story_understanding: { label: 'Story Understanding', description: 'Shared interpretation, narrative angle, and open questions.' },
  research: { label: 'Research', description: 'Sources, claims, chronology, and visual evidence.' },
  story_script: { label: 'Story & Script', description: 'Approved story structure, narration, and screen text.' },
  references: { label: 'References', description: 'Explicit visual, composition, character, motion, and camera roles.' },
  motion_dna: { label: 'Motion DNA', description: 'The approved visual and motion grammar for the production.' },
  voice: { label: 'Voice', description: 'Narration direction, pronunciation, takes, and alignment.' },
  calibration_reel: { label: 'Calibration Reel', description: 'Representative route tests before production-scale work.' },
  scene_board: { label: 'Scene Board', description: 'Scene purpose, treatment, dependencies, and readiness.' },
  storyboard: { label: 'Storyboard', description: 'Reviewable frames before higher-cost motion work.' },
  animatic: { label: 'Animatic', description: 'Low-cost timing, pacing, voice, and visual-flow review.' },
  scene_editor: { label: 'Scene Editor', description: 'Scene documents, layers, shots, and controlled motion.' },
  picture_lock: { label: 'Picture Lock', description: 'Exact approved picture and timing versions.' },
  sound_music: { label: 'Sound & Music', description: 'Narration, music, ambience, Foley, and mix intent.' },
  fine_cut: { label: 'Fine Cut', description: 'The near-final story with picture and sound together.' },
  quality_control: { label: 'Quality Control', description: 'Fact, visual, audio, timing, caption, and render checks.' },
  delivery: { label: 'Delivery', description: 'Approved masters, versions, captions, and project handoff.' },
}

export const MOTION_STUDIO_STORYTELLING_STAGE_PRESENTATIONS: readonly MotionStudioStagePresentation[] =
  MOTION_STUDIO_STORYTELLING_STAGE_ORDER.map((stage) => ({
    stage,
    group: MOTION_STUDIO_STAGE_GROUPS[stage],
    ...stageCopy[stage],
  }))

export const MOTION_STUDIO_STORYTELLING_GROUP_PRESENTATIONS: readonly MotionStudioGroupPresentation[] =
  MOTION_STUDIO_GROUP_ORDER.map((group) => ({
    group,
    label: titleCase(group),
    description: groupDescription(group),
    stages: MOTION_STUDIO_STORYTELLING_STAGE_PRESENTATIONS.filter((stage) => stage.group === group),
  }))

/** Compatibility aliases for consumers written before the parent/module split. */
export const MOTION_STUDIO_STAGE_PRESENTATIONS = MOTION_STUDIO_STORYTELLING_STAGE_PRESENTATIONS
export const MOTION_STUDIO_GROUP_PRESENTATIONS = MOTION_STUDIO_STORYTELLING_GROUP_PRESENTATIONS

const productionStatuses = new Set<MotionStudioStatus>([
  'draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing',
  'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived',
])
const workspaceModes = new Set<MotionStudioWorkspaceMode>(['guided', 'studio'])
const productionModes = new Set<ProductionMode>([
  'generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed',
])
const stageNames = new Set<MotionStudioStage>(MOTION_STUDIO_STORYTELLING_STAGE_ORDER)
const jobStatuses = new Set<MotionStudioJobStatus>([
  'waiting', 'queued', 'claimed', 'running', 'cancel_requested',
  'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled',
])

export function projectMotionStudioProduction(value: unknown): MotionStudioProductionDto | undefined {
  if (!isRecord(value)) return undefined
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.projectId) || !isNonEmptyString(value.editSessionId)) return undefined
  if (value.moduleId !== 'storytelling') return undefined
  if (value.moduleCatalogVersion !== 'motion-studio-module-catalog-v1') return undefined
  if (value.stageProfileId !== 'motion-studio-storytelling-stage-profile-v1') return undefined
  if (!productionStatuses.has(value.status as MotionStudioStatus)) return undefined
  if (!stageNames.has(value.currentStage as MotionStudioStage)) return undefined
  if (!workspaceModes.has(value.workspaceMode as MotionStudioWorkspaceMode)) return undefined
  if (!productionModes.has(value.defaultProductionMode as ProductionMode)) return undefined
  if (value.userFacingStrategy !== "Director's Hybrid" || value.localCandidateOnly !== true) return undefined
  if (!Number.isSafeInteger(value.recordVersion) || (value.recordVersion as number) < 1) return undefined
  if (!isNonEmptyString(value.createdAt) || !isNonEmptyString(value.updatedAt)) return undefined

  return {
    id: value.id,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: value.status as MotionStudioStatus,
    currentStage: value.currentStage as MotionStudioStage,
    workspaceMode: value.workspaceMode as MotionStudioWorkspaceMode,
    defaultProductionMode: value.defaultProductionMode as ProductionMode,
    userFacingStrategy: value.userFacingStrategy,
    recordVersion: value.recordVersion as number,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    localCandidateOnly: true,
  }
}

export function projectMotionStudioWorkGraph(value: unknown): MotionStudioWorkGraphDto | undefined {
  if (!isRecord(value)) return undefined
  if (!isNonEmptyString(value.productionId) || !isNonEmptyString(value.approvedSnapshotId) || !isNonEmptyString(value.costEstimateId)) return undefined
  if (!['authorized', 'incurring', 'paused', 'released', 'exhausted', 'cancelled'].includes(String(value.status))) return undefined
  if (!Array.isArray(value.jobs) || !Array.isArray(value.dependencies) || value.localCandidateOnly !== true) return undefined

  const jobs: MotionStudioJobDto[] = []
  for (const jobValue of value.jobs) {
    const job = projectJob(jobValue, value.productionId, value.approvedSnapshotId)
    if (!job) return undefined
    jobs.push(job)
  }

  const jobIds = new Set(jobs.map((job) => job.id))
  const dependencies: Array<MotionStudioWorkGraphDto['dependencies'][number]> = []
  for (const dependency of value.dependencies) {
    if (!isRecord(dependency) || !isNonEmptyString(dependency.upstreamJobId) || !isNonEmptyString(dependency.downstreamJobId)) return undefined
    if (!jobIds.has(dependency.upstreamJobId) || !jobIds.has(dependency.downstreamJobId)) return undefined
    dependencies.push({ upstreamJobId: dependency.upstreamJobId, downstreamJobId: dependency.downstreamJobId })
  }

  return {
    productionId: value.productionId,
    approvedSnapshotId: value.approvedSnapshotId,
    costEstimateId: value.costEstimateId,
    status: value.status as MotionStudioWorkGraphDto['status'],
    jobs,
    dependencies,
    localCandidateOnly: true,
  }
}

export function productionResourceState(production: MotionStudioProductionDto): MotionStudioResourceState {
  if (production.status === 'awaiting_review' || production.status === 'reviewing') return 'review_needed'
  if (production.status === 'blocked' || production.status === 'archived') return 'blocked'
  if (production.status === 'draft' && production.currentStage === 'director_brief') return 'empty'
  return 'success'
}

export function errorResourceState(response: ApiResponseEnvelope<unknown>): MotionStudioResourceState {
  if (response.statusCode === 401 || response.statusCode === 403) return 'permission_denied'

  switch (response.error?.code) {
    case 'MOTION_STUDIO_NOT_FOUND':
      return 'first_use'
    case 'MOTION_STUDIO_CONFLICT':
      return 'version_conflict'
    case 'MOTION_STUDIO_LOCKED':
      return 'stale'
    case 'MOTION_STUDIO_APPROVAL_BLOCKED':
    case 'MOTION_STUDIO_COST_LIMIT':
      return 'blocked'
    default:
      return 'failure'
  }
}

export function productionRequiresWorkGraph(production: MotionStudioProductionDto): boolean {
  return [
    'approved_for_execution',
    'producing',
    'reviewing',
    'delivery_ready',
    'completed',
  ].includes(production.status)
}

export function currentStagePresentation(stage: MotionStudioStage): MotionStudioStagePresentation {
  return MOTION_STUDIO_STORYTELLING_STAGE_PRESENTATIONS.find((item) => item.stage === stage)
    ?? MOTION_STUDIO_STORYTELLING_STAGE_PRESENTATIONS[0]
}

export function productionModeLabel(mode: ProductionMode): string {
  const labels: Record<ProductionMode, string> = {
    generative_first: 'Generative-first',
    layered_first: 'Layered-first',
    native_graphics_first: 'Native graphics-first',
    footage_first: 'Footage-first',
    hybrid_directed: "Director's Hybrid",
  }
  return labels[mode]
}

export function jobStatusLabel(status: MotionStudioJobStatus): string {
  const labels: Record<MotionStudioJobStatus, string> = {
    waiting: 'Waiting on dependencies',
    queued: 'Queued',
    claimed: 'Claimed',
    running: 'Running',
    cancel_requested: 'Cancellation requested',
    reconciliation_required: 'Reconciliation required',
    blocked: 'Blocked',
    succeeded: 'Succeeded',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

function projectJob(
  value: unknown,
  expectedProductionId: string,
  expectedApprovedSnapshotId: string,
): MotionStudioJobDto | undefined {
  if (!isRecord(value)) return undefined
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.productionId) || !isNonEmptyString(value.approvedSnapshotId)) return undefined
  if (value.productionId !== expectedProductionId || value.approvedSnapshotId !== expectedApprovedSnapshotId) return undefined
  if (!isNonEmptyString(value.approvedWorkItemId) || !isNonEmptyString(value.workItemKey) || !isNonEmptyString(value.workItemType)) return undefined
  if (!jobStatuses.has(value.status as MotionStudioJobStatus)) return undefined
  if (!Number.isSafeInteger(value.sequenceNumber) || !Number.isSafeInteger(value.attemptCount) || !Number.isSafeInteger(value.maxAttempts)) return undefined
  if (typeof value.required !== 'boolean' || !isNonEmptyString(value.runAfter) || !Array.isArray(value.upstreamJobIds)) return undefined
  if (!value.upstreamJobIds.every(isNonEmptyString)) return undefined

  const currentAttempt = value.currentAttempt === undefined ? undefined : projectAttempt(value.currentAttempt)
  if (value.currentAttempt !== undefined && !currentAttempt) return undefined

  return {
    id: value.id,
    productionId: value.productionId,
    approvedSnapshotId: value.approvedSnapshotId,
    approvedWorkItemId: value.approvedWorkItemId,
    workItemKey: value.workItemKey,
    sequenceNumber: value.sequenceNumber as number,
    workItemType: value.workItemType,
    required: value.required,
    status: value.status as MotionStudioJobStatus,
    attemptCount: value.attemptCount as number,
    maxAttempts: value.maxAttempts as number,
    runAfter: value.runAfter,
    ...(isNonEmptyString(value.cancellationRequestedAt) ? { cancellationRequestedAt: value.cancellationRequestedAt } : {}),
    ...(isNonEmptyString(value.startedAt) ? { startedAt: value.startedAt } : {}),
    ...(isNonEmptyString(value.completedAt) ? { completedAt: value.completedAt } : {}),
    upstreamJobIds: value.upstreamJobIds,
    ...(currentAttempt ? { currentAttempt } : {}),
  }
}

function projectAttempt(value: unknown): MotionStudioJobAttemptSummaryDto | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !Number.isSafeInteger(value.attemptNumber)) return undefined
  if (!['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown'].includes(String(value.status))) return undefined
  if (!isNonEmptyString(value.claimedAt) || !isNonEmptyString(value.attemptDeadlineAt)) return undefined

  let lease: MotionStudioJobAttemptSummaryDto['lease']
  if (value.lease !== undefined) {
    if (!isRecord(value.lease) || !['active', 'released', 'expired'].includes(String(value.lease.status)) || !isNonEmptyString(value.lease.expiresAt)) return undefined
    lease = { status: value.lease.status as NonNullable<MotionStudioJobAttemptSummaryDto['lease']>['status'], expiresAt: value.lease.expiresAt }
  }

  return {
    id: value.id,
    attemptNumber: value.attemptNumber as number,
    status: value.status as MotionStudioJobAttemptSummaryDto['status'],
    ...(isNonEmptyString(value.failureCategory) ? { failureCategory: value.failureCategory } : {}),
    claimedAt: value.claimedAt,
    ...(isNonEmptyString(value.startedAt) ? { startedAt: value.startedAt } : {}),
    ...(isNonEmptyString(value.completedAt) ? { completedAt: value.completedAt } : {}),
    attemptDeadlineAt: value.attemptDeadlineAt,
    ...(lease ? { lease } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function titleCase(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}

function groupDescription(group: MotionStudioWorkspaceGroup): string {
  const descriptions: Record<MotionStudioWorkspaceGroup, string> = {
    plan: 'Understand and structure the story before production.',
    design: 'Lock the visual, motion, and voice direction.',
    produce: 'Plan and build controlled scenes in increasing fidelity.',
    review: 'Resolve picture, sound, and quality decisions.',
    deliver: 'Prepare approved outputs through the existing export authority.',
  }
  return descriptions[group]
}
