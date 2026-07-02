import type { ApprovalStatus, ID, ISODateString, JSONObject, ProcessingStatus } from './shared'
import type { CreativeSkillFamily, CreativeSkillKey } from './creative-skills-core'

export type SkillQAStage =
  | 'planning_contract_QA'
  | 'StoryTiming_QA'
  | 'credit_approval_QA'
  | 'source_proof_QA'
  | 'user_visible_plan_QA'
  | 'revision_QA'
  | 'preview_QA_future'
  | 'execution_QA_future'

export type SkillQASeverity = 'pass' | 'info' | 'warning' | 'needs_review' | 'blocking' | 'critical'

export type SkillQAStatus =
  | 'not_started'
  | 'passed'
  | 'passed_with_warnings'
  | 'needs_review'
  | 'failed'
  | 'blocked'
  | 'superseded'
  | 'future_pending'

export type SkillQACategory =
  | 'planning_completeness'
  | 'professional_taste'
  | 'overuse'
  | 'underuse'
  | 'StoryTiming_coordination'
  | 'caption_readability'
  | 'speech_clarity'
  | 'visual_safety'
  | 'source_proof_safety'
  | 'credit_approval'
  | 'user_instruction_preference'
  | 'runtime_boundary'
  | 'revision_readiness'

export type SkillQAGateDecision = 'allow' | 'allow_with_warnings' | 'needs_repair' | 'block' | 'future_pending'

export type SkillQAGateStatus =
  | 'not_evaluated'
  | 'open'
  | 'passed'
  | 'warning'
  | 'blocked'
  | 'resolved'
  | 'superseded'

export interface SkillQARequirementRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  linkedRouteId?: ID
  linkedConceptId?: ID
  linkedOpportunityId?: ID
  linkedSkillKey?: CreativeSkillKey
  linkedSkillFamily?: CreativeSkillFamily
  qaStage: SkillQAStage
  qaCategory: SkillQACategory
  severity: SkillQASeverity
  passCondition: string
  failCondition: string
  warningCondition?: string
  blocksTarget: 'plan_display' | 'credit_estimate' | 'approval' | 'preview_future' | 'execution_future' | 'none'
  recommendedFix: string
  userVisibleMessage?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillQAResultRecord {
  id: ID
  requirementId: ID
  projectId: ID
  editPlanId?: ID
  status: SkillQAStatus
  severity: SkillQASeverity
  passed: boolean
  issueSummary?: string
  warningSummary?: string
  recommendedFix?: string
  userVisibleMessage?: string
  checkedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillQAReportRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  routeBundleId?: ID
  reportStatus: ProcessingStatus
  requirementIds: ID[]
  resultIds: ID[]
  highestSeverity: SkillQASeverity
  gateDecision: SkillQAGateDecision
  approvalStatusAtCheck?: ApprovalStatus
  blockingIssueCount: number
  warningIssueCount: number
  repairRecommendationIds: ID[]
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillQARepairRecommendationRecord {
  id: ID
  qaResultId: ID
  affectedRouteIds: ID[]
  affectedSkillKeys: CreativeSkillKey[]
  repairSummary: string
  repairType:
    | 'add_missing_contract'
    | 'reduce_density'
    | 'resolve_storytiming'
    | 'add_credit_approval'
    | 'fix_source_safety'
    | 'respect_preference'
    | 'remove_runtime_leak'
    | 'ask_user'
  requiresReapproval: boolean
  requiresReestimate: boolean
  gateStatusAfterRepair?: SkillQAGateStatus
  createdAt: ISODateString
  metadata?: JSONObject
}
