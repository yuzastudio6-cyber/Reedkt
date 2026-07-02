export type ObservabilitySeverity = 'info' | 'warning' | 'error' | 'critical'

export interface SanitizedLogFinding {
  path: string
  reason: 'secret' | 'signed_url' | 'raw_prompt' | 'auth_header' | 'cookie' | 'sensitive_path'
}

export interface SanitizedLogResult<T = unknown> {
  sanitized: T
  findings: SanitizedLogFinding[]
}

export type ProductionErrorCategory =
  | 'policy_blocked'
  | 'readiness_blocked'
  | 'model_weight_blocked'
  | 'license_blocked'
  | 'tool_unavailable'
  | 'missing_artifact'
  | 'invalid_payload'
  | 'qa_failed'
  | 'timeout'
  | 'retry_exhausted'
  | 'cost_limit_exceeded'
  | 'concurrency_limit_exceeded'
  | 'secret_safety_violation'
  | 'signed_url_safety_violation'
  | 'unknown'

export interface ProductionMetricDefinition {
  metricName: string
  description: string
  unit: 'count' | 'ms' | 'usd' | 'bytes'
  labels: string[]
}

export interface AlertRuleTemplate {
  alertId: string
  description: string
  metricName: string
  severity: ObservabilitySeverity
  templateOnly: true
  doesNotDeploy: true
}
