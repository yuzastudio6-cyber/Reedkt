export type QwenTimeoutStatus = 'passed' | 'partial' | 'blocked' | 'not_attempted'

export type QwenTimeoutDecision =
  | 'qwen_schema_timeout_calibrated_ready_for_model_dryrun'
  | 'qwen_schema_timeout_calibrated_partial_streaming_only'
  | 'qwen_schema_timeout_calibrated_partial_qwen37max_escalation'
  | 'blocked_pending_qwen_schema_timeout'
  | 'blocked_pending_qwen_auth_regression'
  | 'blocked_pending_dashscope_region_review'
  | 'blocked_pending_qwen_schema_contract_fix'
  | 'not_attempted'

export type QwenTimeoutFailure =
  | 'provider_timeout'
  | 'first_byte_timeout'
  | 'stream_timeout'
  | 'schema_invalid'
  | 'model_alias_unavailable'
  | 'auth_regression'
  | 'region_mismatch'
  | 'output_too_large'
  | 'prompt_too_large'

export type DashScopeSecretRef = 'DASHSCOPE_API_KEY' | 'DASHSCOPE_BASE_URL' | 'DASHSCOPE_REGION'
export type QwenTimeoutModelId = 'qwen3.7-plus' | 'qwen3.7-max' | 'qwen-plus-us' | 'qwen-flash-us' | 'qwen-max'
export type QwenTimeoutCaseStage = 'minimal_non_stream' | 'minimal_stream' | 'reduced_schema' | 'fallback_sanity'
export type QwenTimeoutMode = 'non_streaming' | 'streaming'

export interface SecretAccessEntry {
  secretRef: DashScopeSecretRef
  source: 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  secretVersionSelector: 'latest'
  envVarPresent: boolean
  payloadMatchedApprovedValue?: boolean
  payloadPrinted: false
  payloadCommitted: false
  secretValueStoredInReports: false
  blocker?: string
}

export interface LoadedDashScopeConfig {
  apiKey?: string
  baseUrl?: string
  entries: SecretAccessEntry[]
  blockers: QwenTimeoutFailure[]
}

export interface ApprovedQwenSourceCase {
  caseId: string
  prompt: string
  expectedOutputSchema: string
  maxTokens: number
  timeoutMs: number
}

export interface QwenTimeoutCalibrationCase {
  caseId: string
  sourceCaseId?: string
  modelId: QwenTimeoutModelId
  stage: QwenTimeoutCaseStage
  mode: QwenTimeoutMode
  schemaId: string
  prompt: string
  requiredTopLevelFields: string[]
  timeoutMs: number
  firstByteTimeoutMs?: number
  maxOutputTokens: number
}

export interface TokenUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface QwenTimeoutCalibrationResult {
  caseId: string
  sourceCaseId?: string
  modelId: QwenTimeoutModelId
  stage: QwenTimeoutCaseStage
  mode: QwenTimeoutMode
  schemaId: string
  status: 'passed' | 'blocked'
  blocker?: QwenTimeoutFailure
  httpStatus?: number
  latencyMs?: number
  firstByteLatencyMs?: number
  finishReason?: string
  usage?: TokenUsage
  responseContentCharacters?: number
  normalizedOutput?: Record<string, unknown>
  rawProviderResponseStored: false
  rawProviderResponsePrinted: false
  secretPayloadPrinted: false
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  routeExecutionAllowed: false
  publicArtifactsAllowed: false
  signedUrlsAllowed: false
  rawPromptForwardingAllowed: false
  directMutationAllowed: false
  productionMutationAllowed: false
}

export interface QwenTimeoutRecommendation {
  selectedHeadAgentModel: QwenTimeoutModelId | null
  selectedCalibrationMode: QwenTimeoutMode | 'blocked'
  recommendedTimeoutMs: number | null
  recommendedMaxOutputTokens: number | null
  fullDryRunReadiness: 'ready' | 'partial' | 'blocked'
  reason: string
}

export interface PrivateArtifactUpload {
  status: 'not_attempted' | 'uploaded' | 'blocked_private_artifact_upload_failed'
  generatedPrefix: string
  qaPrefix: string
  artifacts: Array<Record<string, unknown>>
  publicArtifacts: false
  signedUrls: false
  rawProviderResponsesStored: false
  blocker?: string
}

export interface QwenTimeoutCalibrationReports {
  sourceAudit: Record<string, unknown>
  policy: Record<string, unknown>
  secretAccess: Record<string, unknown>
  cases: Record<string, unknown>
  results: Record<string, unknown>
  analysis: Record<string, unknown>
  recommendation: QwenTimeoutRecommendation
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  manifest: Record<string, unknown>
  qa: Record<string, unknown>
  report: Record<string, unknown>
}

export interface QwenTimeoutExecutionOptions {
  execute: boolean
}
