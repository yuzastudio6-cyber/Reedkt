export type TestingReadinessStatus =
  | 'ready'
  | 'warning'
  | 'blocked'
  | 'not_checked'

export type TestingReadinessCategory =
  | 'repo_integrity'
  | 'package_scripts'
  | 'frontend_build'
  | 'frontend_lint'
  | 'mock_edit_plan'
  | 'required_user_gates'
  | 'planner_validation'
  | 'planner_regression'
  | 'tool_registry'
  | 'launch_tool_stack'
  | 'provider_safety'
  | 'supabase_migrations'
  | 'rls_storage_policy'
  | 'approved_snapshot'
  | 'credit_estimate'
  | 'worker_runtime'
  | 'editing_agent_execution'
  | 'async_reconciliation'
  | 'agent_qa_fallback'
  | 'no_secret_leakage'
  | 'no_real_execution'

export interface TestingReadinessCheck {
  id: string
  category: TestingReadinessCategory
  label: string
  status: TestingReadinessStatus
  severity: 'info' | 'warning' | 'error' | 'blocking'
  passed: boolean
  message: string
  recommendation?: string
}

export interface TestingReadinessReport {
  id: string
  overallStatus: TestingReadinessStatus
  summary: string
  checks: TestingReadinessCheck[]
  blockers: string[]
  warnings: string[]
  manualTestSteps: string[]
  nextMilestones: string[]
  limitations: string[]
}
