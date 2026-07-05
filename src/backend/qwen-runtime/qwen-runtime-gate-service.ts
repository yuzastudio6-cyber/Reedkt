import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
  type QwenRuntimeBoundaryContext,
  type QwenRuntimeGateStatus,
  type QwenRuntimeMode,
} from '../../types'
import { fail, ok, type ServiceResult } from '../service-result'

export interface QwenRuntimeGateInput {
  mode?: QwenRuntimeMode
  ownerApproval?: QwenRuntimeBoundaryContext['ownerApproval']
  secretBoundaryReady?: boolean
  providerConfigReady?: boolean
  runtimeAdapterReady?: boolean
  structuredValidationReady?: boolean
  rateLimitPolicyReady?: boolean
  usagePolicyReady?: boolean
  securityReviewReady?: boolean
}

export function classifyQwenRuntimeGateStatus(input: QwenRuntimeGateInput = {}): QwenRuntimeGateStatus {
  if (input.ownerApproval !== 'approved_future') return 'blocked_owner_approval'
  if (!input.secretBoundaryReady) return 'blocked_secret_manager'
  if (!input.providerConfigReady) return 'blocked_provider_config'
  if (!input.runtimeAdapterReady) return 'blocked_runtime_adapter'
  if (!input.structuredValidationReady) return 'blocked_structured_validation'
  if (!input.rateLimitPolicyReady) return 'blocked_rate_limit_policy'
  if (!input.usagePolicyReady) return 'blocked_usage_policy'
  if (!input.securityReviewReady) return 'blocked_security_review'
  if (input.mode === 'runtime_adapter_future') return 'ready_for_runtime_adapter_future'
  if (input.mode === 'provider_config_ready') return 'ready_for_fake_adapter'
  return 'ready_boundary_only'
}

export function createQwenRuntimeBoundaryContext(input: QwenRuntimeGateInput = {}): QwenRuntimeBoundaryContext {
  const mode = input.mode ?? 'mock_disabled'
  return {
    mode,
    gateStatus: classifyQwenRuntimeGateStatus(input),
    ownerApproval: input.ownerApproval ?? 'pending',
    providerName: REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
    role: 'reasoning_brain',
    mockOnly: true,
    notes: [
      'RP-QWEN-01 is a server-only runtime boundary.',
      'Qwen provider calls remain disabled by default.',
      'Marker Chat keeps deterministic mock fallback.',
    ],
  }
}

export function createQwenRuntimeGateSummary(context: QwenRuntimeBoundaryContext): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} runtime gate: ${context.gateStatus}. Backend-only boundary is ${context.mode}; owner approval ${context.ownerApproval}. No provider call was made.`
}

export function assertQwenRuntimeProviderCallBlocked(context: QwenRuntimeBoundaryContext): ServiceResult<{
  providerCallStatus: 'blocked_by_gate'
  canCallProvider: false
  qwenCallMade: false
}> {
  if (context.gateStatus === 'ready_for_runtime_adapter_future') {
    return fail('REASONING_AGENT_PROVIDER_CALL_BLOCKED', 'RP-QWEN-01 still blocks provider calls even when future gates are represented.', context)
  }

  return ok({
    providerCallStatus: 'blocked_by_gate',
    canCallProvider: false,
    qwenCallMade: false,
  })
}
