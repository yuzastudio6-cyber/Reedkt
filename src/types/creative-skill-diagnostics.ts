import type { ID, ISODateString, JSONObject, ProcessingStatus } from './shared'

export type SkillDiagnosticCategory =
  | 'docs_completeness'
  | 'source_of_truth_integrity'
  | 'skill_taxonomy_validation'
  | 'planning_contract_validation'
  | 'pseudo_record_validation'
  | 'checklist_validation'
  | 'prompt_duplication_detection'
  | 'runtime_unlock_detection'
  | 'package_mutation_detection'
  | 'migration_timing_validation'
  | 'TypeScript_contract_validation_future'
  | 'schema_validation_future'
  | 'mock_fixture_validation_future'
  | 'planner_validation_future'
  | 'StoryTiming_validation_future'
  | 'credit_approval_gate_validation'
  | 'source_proof_safety_validation'
  | 'provider_tool_boundary_validation'
  | 'Supabase_boundary_validation'
  | 'QA_contract_validation'
  | 'CI_static_boundary_validation'

export type SkillDiagnosticValidationLevel =
  | 'docs_only_static'
  | 'docs_plus_types_static_future'
  | 'docs_types_schema_static_future'
  | 'mock_fixture_static_future'
  | 'planner_static_future'
  | 'CI_gate_future'
  | 'runtime_gate_future'

export type SkillDiagnosticSeverity =
  | 'pass'
  | 'info'
  | 'warning'
  | 'fail'
  | 'critical_fail'
  | 'not_applicable'
  | 'future_pending'

export type SkillDiagnosticStatus =
  | 'not_started'
  | 'running_future'
  | 'passed'
  | 'passed_with_warnings'
  | 'failed'
  | 'failed_critical'
  | 'skipped_not_applicable'
  | 'skipped_future_artifact_missing'
  | 'superseded'
  | 'needs_owner_review'

export type SkillDiagnosticRuleKey =
  | 'skills_docs_required_files_present'
  | 'skills_docs_readme_index_complete'
  | 'skills_handoff_next_prompt_present'
  | 'skills_no_duplicate_prompt_ids'
  | 'skills_no_duplicate_contract_docs'
  | 'skills_taxonomy_canonical_keys'
  | 'skills_taxonomy_no_duplicate_keys'
  | 'skills_taxonomy_no_tool_provider_skill_names'
  | 'skills_planning_contract_required'
  | 'skills_when_to_avoid_required'
  | 'skills_premium_approval_credit_hints_required'
  | 'skills_no_generation_before_approval_required'
  | 'skills_source_safety_required'
  | 'skills_storytiming_handoff_required'
  | 'skills_QA_requirement_required'
  | 'skills_no_runtime_files_in_docs_only_prompt'
  | 'skills_no_package_mutation_in_docs_only_prompt'
  | 'skills_no_migrations_in_docs_only_prompt'
  | 'skills_no_provider_secret_references'
  | 'skills_no_reference_copy_language'
  | 'skills_pseudo_records_not_runtime'
  | 'skills_checklists_fail_cases_present'
  | 'skills_future_type_contract_alignment'
  | 'skills_future_schema_alignment'
  | 'skills_future_fixture_alignment'
  | 'duplicate_skill_key'
  | 'duplicate_skill_family'
  | 'missing_planning_contract'
  | 'missing_when_to_use_rule'
  | 'missing_when_to_avoid_rule'
  | 'premium_without_credit_approval_hint'
  | 'non_canonical_skill_key'
  | 'alias_conflict'
  | 'prompt_duplication'
  | 'pseudo_record_completeness'
  | 'runtime_unlock_detection'
  | 'provider_tool_execution_leakage'
  | 'package_mutation_detection'
  | 'migration_timing_check'
  | 'Supabase_boundary_check'
  | 'credit_approval_gate_check'
  | 'no_generation_before_approval_check'
  | 'source_proof_safety_check'
  | 'StoryTiming_coordination_check'
  | 'edit_preference_snapshot_check'
  | 'QA_contract_coverage_check'
  | 'CI_static_boundary_check'

export interface SkillDiagnosticRuleRecord {
  id: ID
  ruleKey: SkillDiagnosticRuleKey
  ruleName: string
  category: SkillDiagnosticCategory
  severityOnFail: SkillDiagnosticSeverity
  appliesToLayers: SkillDiagnosticValidationLevel[]
  inputPaths: string[]
  requiredPatterns: string[]
  forbiddenPatterns: string[]
  expectedOutputs: string[]
  passCondition: string
  failCondition: string
  warningCondition?: string
  remediationGuidance: string
  ownerDoc: string
  status: SkillDiagnosticStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillDiagnosticResultRecord {
  id: ID
  ruleKey: SkillDiagnosticRuleKey
  runId: ID
  status: SkillDiagnosticStatus
  severity: SkillDiagnosticSeverity
  checkedPaths: string[]
  matchedEvidence: string[]
  missingEvidence: string[]
  failureSummary?: string
  warningSummary?: string
  remediationGuidance: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillDiagnosticRunRecord {
  id: ID
  runScope: string
  runReason: string
  targetPaths: string[]
  ruleKeys: SkillDiagnosticRuleKey[]
  status: ProcessingStatus
  passedCount: number
  warningCount: number
  failedCount: number
  criticalFailedCount: number
  skippedCount: number
  highestSeverity: SkillDiagnosticSeverity
  resultIds: ID[]
  canContinue: boolean
  blockedNextSteps: string[]
  createdBy: string
  createdAt: ISODateString
  metadata?: JSONObject
}
