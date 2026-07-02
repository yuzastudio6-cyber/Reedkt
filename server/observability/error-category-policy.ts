import type { ProductionErrorCategory } from './observability-types'

export const productionErrorCategories: ProductionErrorCategory[] = [
  'policy_blocked',
  'readiness_blocked',
  'model_weight_blocked',
  'license_blocked',
  'tool_unavailable',
  'missing_artifact',
  'invalid_payload',
  'qa_failed',
  'timeout',
  'retry_exhausted',
  'cost_limit_exceeded',
  'concurrency_limit_exceeded',
  'secret_safety_violation',
  'signed_url_safety_violation',
  'unknown',
]

export function isProductionErrorCategory(value: string): value is ProductionErrorCategory {
  return productionErrorCategories.includes(value as ProductionErrorCategory)
}
