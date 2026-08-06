import type {
  AssetUsageRole,
  ID,
  PriorityLevel,
  TimeRange,
} from './workflow-common'
import type {
  CaptionPreference,
  EditBriefStatus,
  MusicPreference,
  PacingPreference,
  TargetPlatform,
} from './edit-brief'
import type { EditCueRole } from './edit-cue'
import type { EditPlan } from './reeditpro'
import type { ProfessionalSkillPlan } from './professional-skills'

export type PlanningContextStatus =
  | 'draft'
  | 'ready'
  | 'needs_review'
  | 'blocked'

export type PlanningInputSource =
  | 'clean_assembly'
  | 'source_library'
  | 'edit_brief'
  | 'edit_cue'
  | 'cue_conflict'
  | 'cleanup_review'
  | 'user_chat'
  | 'system'

export type PlanningCueUsageStatus =
  | 'will_use'
  | 'will_adjust'
  | 'needs_review'
  | 'blocked'
  | 'ignored'
  | 'not_ready'

export type PlanningAssetUsageStatus =
  | 'main_footage'
  | 'must_use'
  | 'prefer'
  | 'optional'
  | 'avoid'
  | 'do_not_use'
  | 'reference_only'

export type PlanningReadinessIssueSeverity =
  | 'info'
  | 'warning'
  | 'blocking'

export interface PlanningReadinessIssue {
  id: ID
  severity: PlanningReadinessIssueSeverity
  source: PlanningInputSource
  message: string
  suggestedAction?: string
  relatedEditCueId?: ID
  relatedMediaAssetId?: ID
  relatedConflictId?: ID
}

export interface PlanningCueUsage {
  editCueId: ID
  title: string
  status: PlanningCueUsageStatus
  role: EditCueRole
  priority: PriorityLevel
  mappedTimeRange?: TimeRange
  explanation: string
  relatedAssetIds: ID[]
  blockingIssueIds: ID[]
}

export interface PlanningAssetUsage {
  mediaAssetId: ID
  sourceLibraryAssetId?: ID
  label: string
  role: AssetUsageRole
  status: PlanningAssetUsageStatus
  priority: PriorityLevel
  explanation: string
}

export interface PlanningBriefInput {
  editBriefId?: ID
  status?: EditBriefStatus
  goal?: string
  audience?: string
  targetPlatforms: TargetPlatform[]
  targetDurationMs?: number
  styleKeywords: string[]
  pacingPreference?: PacingPreference
  captionPreference?: CaptionPreference
  musicPreference?: MusicPreference
  bRollPreference?: string
  mustUseAssetIds: ID[]
  avoidAssetIds: ID[]
  mustIncludeNotes: string[]
  avoidNotes: string[]
  brandNotes?: string
  specialInstructions?: string
  userProvidedReferenceUrls: string[]
  ready: boolean
}

export interface PlanningCleanAssemblyInput {
  cleanAssemblyId: ID
  version: number
  durationMs: number
  accepted: boolean
  segmentCount: number
  sourceTimeMappingCount: number
  summary: string
}

export interface PlanningContext {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: PlanningContextStatus
  cleanAssembly: PlanningCleanAssemblyInput
  sourceAssets: PlanningAssetUsage[]
  editBrief?: PlanningBriefInput
  cueUsages: PlanningCueUsage[]
  readinessIssues: PlanningReadinessIssue[]
  unresolvedConflictIds: ID[]
  blockingIssueCount: number
  warningIssueCount: number
  summary: string
  createdAt: string
  updatedAt: string
}

export interface PlanningContextSummary {
  status: PlanningContextStatus
  cleanAssemblyReady: boolean
  sourceLibraryConfirmed: boolean
  editBriefReady: boolean
  totalAssets: number
  mustUseAssets: number
  avoidAssets: number
  totalCues: number
  readyCues: number
  blockedCues: number
  unresolvedConflicts: number
  blockingIssues: number
  warnings: number
  nextRecommendedActions: string[]
}

export interface ContextAwareMockEditPlanResult {
  planningContext: PlanningContext
  editPlan: EditPlan
  planSummary: string
  professionalSkillPlan: ProfessionalSkillPlan
  cueUsageSummary: PlanningCueUsage[]
  assetUsageSummary: PlanningAssetUsage[]
  readinessSummary: PlanningContextSummary
}
