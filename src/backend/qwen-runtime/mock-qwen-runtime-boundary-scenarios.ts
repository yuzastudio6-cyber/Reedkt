import type { QwenRuntimeBoundaryScenario } from '../../types'

const scenarioTitles = [
  'Runtime context defaults to mock disabled',
  'Runtime gate blocked by owner approval',
  'Secret Manager gate blocked',
  'Provider config gate blocked',
  'Runtime adapter future',
  'Runtime boundary ready only',
  'Required secret references are symbolic',
  'API key reference is symbolic only',
  'Base URL reference is symbolic only',
  'Runtime config reference is symbolic only',
  'Secret reference valueAccessed false',
  'Secret reference valuePrinted false',
  'Secret reference frontendVisible false',
  'Disabled resolver blocks value access',
  'Disabled resolver reports gcloudCommandRun false',
  'Disabled resolver returns no secret value',
  'Redaction redacts api key-like string',
  'Redaction redacts bearer token',
  'Redaction redacts sk-like string',
  'Redaction preserves safe label',
  'Provider readiness blocks client creation',
  'Provider readiness blocks provider call',
  'Provider call status not attempted',
  'Mock fallback allowed',
  'Marker Chat runtime wiring blocked',
  'Structured validation required',
  'No frontend secret access check passes',
  'No secret value logging check passes',
  'No gcloud command check passes',
  'No provider call check passes',
  'No marker chat runtime change check passes',
  'Boundary validation passes safe context',
  'Boundary validation blocks value accessed true',
  'Boundary validation blocks value printed true',
  'Boundary validation blocks gcloud command true',
  'Boundary validation blocks provider call true',
  'Boundary validation blocks frontend visible true',
  'Summary mentions Qwen 3.7',
  'Summary mentions backend-only',
  'Summary mentions owner approval pending',
  'Summary mentions RP-QWEN-02 next',
  'No Qwen call made',
  'No DeepSeek call made',
  'No provider call made',
  'No gcloud command run',
  'No secret value inspected',
  'No Marker Chat runtime changed',
]

export const MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS: QwenRuntimeBoundaryScenario[] = scenarioTitles.map((title, index) => ({
  id: `qwen-runtime-boundary-${String(index + 1).padStart(2, '0')}`,
  title,
  expectedOk: !/\bblocks?\b/i.test(title),
  expectedGateStatus: index < 2
    ? 'blocked_owner_approval'
    : index === 2
      ? 'blocked_secret_manager'
      : index === 3
        ? 'blocked_provider_config'
        : index === 4
          ? 'blocked_runtime_adapter'
          : 'ready_boundary_only',
  expectedSecretValueAccessed: false,
  expectedProviderCallMade: false,
  mockOnly: true,
}))

export function listMockQwenRuntimeBoundaryScenarios(): QwenRuntimeBoundaryScenario[] {
  return MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS
}
