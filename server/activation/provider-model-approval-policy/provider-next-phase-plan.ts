import type { ProviderNextPhasePlan, ProviderNextPhasePlanItem } from './provider-model-approval-types'

export function buildProviderNextPhasePlan(ready: boolean): ProviderNextPhasePlan {
  return {
    roadmapId: 'provider1_next_phase_plan',
    provider2Readiness: ready ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
    items: [
      item('PROVIDER-2', 'Fixture Adapters And Normalizers', 'Create DeepSeek-shaped and Qwen-shaped fixture adapters with no live provider calls.', ['generated fixtures', 'normalizer tests', 'schema validation'], ['DeepSeek API calls', 'Qwen API calls', 'secret value reads']),
      item('PROVIDER-3', 'DeepSeek Controlled Live Coding Validation', 'One guarded DeepSeek coding-proposal validation after fixture, budget, and secret-reference readiness.', ['max one backend-only call if later approved', 'small output cap', 'sanitized response summary'], ['code execution', 'tool execution', 'raw response storage', 'production paid calls']),
      item('PROVIDER-4', 'Qwen Controlled Live Head-Agent Validation', 'One guarded Qwen planning validation with generated evidence only and no user media.', ['max one backend-only call if later approved', 'generated evidence only', 'sanitized findings summary'], ['user media', 'worker execution', 'tool execution', 'raw prompt execution']),
      item('PROVIDER-5', 'Qwen And DeepSeek Collaboration Dry Run', 'Dry-run collaboration using normalized fixture outputs only.', ['fixture-only collaboration', 'producer and QA checks', 'candidate approved-plan snapshot records'], ['provider chaining', 'live provider calls', 'worker execution']),
      item('PROVIDER-6', 'Provider Gateway Internal Readiness Gate', 'Internal readiness review before any broader Provider Gateway enablement.', ['policy reconciliation', 'cost controls', 'owner readiness checks'], ['production', 'external beta', 'broad media', 'public artifacts']),
    ],
  }
}

function item(
  phaseId: ProviderNextPhasePlanItem['phaseId'],
  name: string,
  scope: string,
  allowed: string[],
  blocked: string[],
): ProviderNextPhasePlanItem {
  return {
    phaseId,
    name,
    scope,
    allowed,
    blocked,
    readinessRequired: ['PROVIDER-1 QA passed', 'blocked features remain disabled', 'Supabase update classification recorded'],
  }
}
