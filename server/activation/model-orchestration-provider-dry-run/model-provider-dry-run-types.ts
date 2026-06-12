export type ModelProviderDryRunStatus = 'passed' | 'partial' | 'blocked' | 'skipped'

export type ModelProviderDryRunDecision =
  | 'completed'
  | 'partial_supabase_milestone_sync_unavailable'
  | 'blocked_missing_live_synthetic_provider_authorization'
  | 'blocked_missing_execution_confirmations'
  | 'blocked_secret_resolution_failed'
  | 'blocked_provider_call_failed'
  | 'blocked_schema_validation_failed'
  | 'blocked_redaction_validation_failed'
  | 'blocked_artifact_upload_failed'
  | 'report_only_not_executed'

export type ModelProviderId = 'qwen_dashscope' | 'deepseek'

export type ModelProviderDryRunCaseId =
  | 'modeldryrun1_qwen_head_agent_planning'
  | 'modeldryrun1_deepseek_coding_spec_proposal'

export type ModelProviderDryRunSchemaId =
  | 'agent_findings_v1'
  | 'coding_spec_proposal_v1'

export interface ModelProviderDryRunPolicy {
  phase: 'MODEL_DRYRUN_1'
  mode: 'qwen_deepseek_synthetic_provider_dry_run'
  environment: 'staging'
  syntheticOnly: true
  userDataAllowed: false
  rawMediaAllowed: false
  signedUrlAllowed: false
  privateGcsUrlAllowed: false
  secretPayloadLoggingAllowed: false
  toolExecutionAllowed: false
  workerExecutionAllowed: false
  routeExecutionAllowed: false
  providerChainingAllowed: false
  webSearchAllowed: false
  browserCaptureAllowed: false
  mapRenderingAllowed: false
  mediaProcessingAllowed: false
  publicArtifactsAllowed: false
  rawPromptExecutionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}

export interface ModelProviderDryRunCase {
  caseId: ModelProviderDryRunCaseId
  providerId: ModelProviderId
  modelId: string
  schemaId: ModelProviderDryRunSchemaId
  purpose: string
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  timeoutMs: number
  blockedActions: string[]
}

export interface ProviderSecretReference {
  providerId: ModelProviderId
  envName: 'DASHSCOPE_API_KEY' | 'DEEPSEEK_API_KEY'
  secretName: 'DASHSCOPE_API_KEY' | 'DEEPSEEK_API_KEY'
}

export interface ProviderSecretResolution {
  providerId: ModelProviderId
  secretName: string
  status: ModelProviderDryRunStatus
  payloadAvailable: boolean
  payloadPrinted: false
  payloadCommitted: false
  blocker?: string
  value?: string
}

export interface ProviderCallResult {
  caseId: ModelProviderDryRunCaseId
  providerId: ModelProviderId
  modelId: string
  status: ModelProviderDryRunStatus
  httpStatus?: number
  latencyMs: number
  rawContent?: string
  finishReason?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  blocker?: string
}

export interface NormalizedProviderResponse {
  caseId: ModelProviderDryRunCaseId
  providerId: ModelProviderId
  modelId: string
  schemaId: ModelProviderDryRunSchemaId
  status: ModelProviderDryRunStatus
  parsed: Record<string, unknown> | null
  normalized: Record<string, unknown> | null
  blocker?: string
}

export interface ValidationResult {
  caseId?: ModelProviderDryRunCaseId
  status: ModelProviderDryRunStatus
  blockers: string[]
  warnings: string[]
}

export interface ModelProviderDryRunReports {
  sourceAudit: Record<string, unknown>
  policy: Record<string, unknown>
  syntheticCases: Record<string, unknown>
  requestRedaction: Record<string, unknown>
  secretResolution: Record<string, unknown>
  providerResults: Record<string, unknown>
  normalizedResponses: Record<string, unknown>
  schemaValidation: Record<string, unknown>
  responseRedaction: Record<string, unknown>
  costUsage: Record<string, unknown>
  failClosed: Record<string, unknown>
  artifactManifest: Record<string, unknown>
  supabaseMilestoneSync: Record<string, unknown>
  qaSummary: Record<string, unknown>
  readinessReport: Record<string, unknown>
}

export interface ModelProviderDryRunExecutionOptions {
  execute: boolean
  runId?: string
  keepLocalArtifacts?: boolean
  writeArtifacts?: boolean
}
