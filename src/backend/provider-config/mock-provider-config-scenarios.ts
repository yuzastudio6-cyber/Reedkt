import type { MockProviderConfigScenario } from '../../types'

export const MOCK_PROVIDER_CONFIG_SCENARIOS: MockProviderConfigScenario[] = [
  ['mock-runtime-ready', 'Mock runtime ready with no secrets', 'mock_only', ['mock ready']],
  ['qwen-secret-missing-blocks-production', 'Qwen secret missing blocks production', 'missing_required_secret', ['QWEN_API_KEY missing']],
  ['deepseek-secret-missing-blocks-production', 'DeepSeek secret missing blocks production', 'missing_required_secret', ['DEEPSEEK_API_KEY missing']],
  ['lyria-secret-missing-blocks-production', 'Lyria secret missing blocks production generation', 'missing_required_secret', ['LYRIA_API_KEY missing']],
  ['mirelo-secret-missing-blocks-production', 'Mirelo secret missing blocks production SFX', 'missing_required_secret', ['MIRELO_API_KEY missing']],
  ['mmaudio-secret-missing-blocks-production', 'MMAudio secret missing blocks draft SFX', 'missing_required_secret', ['MMAUDIO_API_KEY missing']],
  ['supabase-service-role-missing', 'Supabase service role missing blocks backend writes', 'missing_required_secret', ['SUPABASE_SERVICE_ROLE_KEY missing']],
  ['stripe-secret-missing', 'Stripe secret missing blocks billing', 'missing_required_secret', ['STRIPE_SECRET_KEY missing']],
  ['frontend-supabase-url-safe', 'Frontend public config allows VITE_SUPABASE_URL', 'configured', ['frontend public config safe']],
  ['frontend-supabase-anon-safe', 'Frontend public config allows VITE_SUPABASE_ANON_KEY', 'configured', ['frontend public config safe']],
  ['frontend-qwen-key-unsafe', 'Frontend referencing QWEN_API_KEY is unsafe', 'blocked_missing_gate', ['frontend unsafe secret']],
  ['frontend-deepseek-key-unsafe', 'Frontend referencing DEEPSEEK_API_KEY is unsafe', 'blocked_missing_gate', ['frontend unsafe secret']],
  ['inventory-blocked-gate-missing', 'Secret inventory blocked when gate missing', 'blocked_missing_gate', ['inventory blocked']],
  ['inventory-blocked-wrong-project', 'Secret inventory blocked when project unverified', 'blocked_wrong_project', ['wrong project']],
  ['metadata-only-inventory-accepted', 'Metadata-only inventory report accepted', 'configured', ['metadata only']],
  ['secret-value-report-rejected', 'Secret value in report rejected', 'blocked_missing_gate', ['secret-like value rejected']],
  ['optional-secret-warning', 'Missing optional secret gives warning', 'missing_optional_secret', ['optional secret warning']],
  ['required-secret-blocks', 'Missing required secret gives blocked status', 'missing_required_secret', ['required secret missing']],
  ['approval-gate-listed', 'Provider runtime gate lists approval required', 'disabled', ['approval gate listed']],
  ['credit-reservation-gate-listed', 'Provider runtime gate lists credit reservation required', 'disabled', ['credit reservation gate listed']],
  ['worker-only-blocks-frontend', 'Worker-only provider blocks frontend', 'blocked_missing_gate', ['worker-only boundary']],
  ['backend-only-blocks-frontend', 'Backend-only provider blocks frontend', 'blocked_missing_gate', ['backend-only boundary']],
  ['internal-mock-no-secrets', 'Internal mock provider requires no secrets', 'mock_only', ['no secrets']],
  ['summary-no-values', 'Summary does not print values', 'configured', ['no values']],
  ['gcloud-service-json-never-frontend', 'Google Cloud service account JSON must never be frontend', 'blocked_missing_gate', ['service account json unsafe']],
  ['openai-not-default-list', 'OpenAI/GPT key is not in expected default provider list', 'configured', ['openai not default']],
].map(([id, title, expectedStatus, warning]) => ({
  id,
  title,
  input: { id },
  expectedStatus,
  expectedWarnings: warning,
  mockOnly: true,
} as MockProviderConfigScenario))

export function getMockProviderConfigScenario(id: string): MockProviderConfigScenario | undefined {
  return MOCK_PROVIDER_CONFIG_SCENARIOS.find((scenario) => scenario.id === id)
}
