export type SecurityReviewStatus = 'passed' | 'warning' | 'blocked'

export type SecurityReviewArea =
  | 'secret_safety'
  | 'signed_url_safety'
  | 'raw_prompt_execution'
  | 'frontend_backend_boundary'
  | 'model_weight_security'
  | 'tool_execution_security'
  | 'storage_privacy'

export interface SecurityReviewFinding {
  area: SecurityReviewArea
  status: SecurityReviewStatus
  message: string
  path?: string
}

export interface SecurityReviewReport {
  reportId: string
  createdAt: string
  secretSafetyStatus: SecurityReviewStatus
  signedUrlSafetyStatus: SecurityReviewStatus
  rawPromptExecutionStatus: SecurityReviewStatus
  frontendBackendBoundaryStatus: SecurityReviewStatus
  modelWeightSecurityStatus: SecurityReviewStatus
  toolExecutionSecurityStatus: SecurityReviewStatus
  storagePrivacyStatus: SecurityReviewStatus
  findings: SecurityReviewFinding[]
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}

export interface SourceFileSnapshot {
  path: string
  content: string
}
