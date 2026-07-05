import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  type QwenProviderReadiness,
  type QwenRuntimeBoundaryContext,
  type QwenRuntimeReadiness,
  type QwenSecretReference,
} from '../../types'

export function createQwenRuntimeBoundarySummary(readiness: QwenRuntimeReadiness): string {
  return [
    `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} boundary status: ${readiness.context.gateStatus}.`,
    'Backend-only runtime boundary prepared.',
    'No Qwen call, provider call, Secret Manager value access, gcloud command, Supabase command, or Marker Chat runtime change occurred.',
  ].join(' ')
}

export function createQwenSecretBoundarySummary(references: QwenSecretReference[]): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} secret boundary: ${references.length} symbolic reference(s), valueAccessed false, valuePrinted false, frontendVisible false.`
}

export function createQwenProviderBoundarySummary(readiness: QwenProviderReadiness): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} provider boundary: ${readiness.gateStatus}; clientCreated false, providerCallMade false, fallback available.`
}

export function createQwenRuntimeNextStepSummary(context?: QwenRuntimeBoundaryContext): string {
  const status = context?.gateStatus ?? 'blocked_owner_approval'
  return `Next step after owner review: RP-QWEN-02 - Backend ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} Adapter with fake transport first by default. Current gate: ${status}.`
}
