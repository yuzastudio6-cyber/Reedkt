import type { ProviderOfficialEvidence } from './provider-gateway-models-audit-types'

export function buildProviderOfficialEvidence(): ProviderOfficialEvidence[] {
  return [
    {
      evidenceId: 'deepseek_v4_pricing',
      provider: 'deepseek',
      sourceName: 'DeepSeek API Pricing',
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      sourceType: 'official_docs',
      observedFacts: [
        'Official docs list deepseek-v4-pro and deepseek-v4-flash.',
        'Pricing and rate-limit evidence must be encoded before any future live validation.',
        'Provider calls remain blocked in PROVIDER-0.',
      ],
      integrationImpact: 'DeepSeek internal routing can name deepseek_v4_pro and deepseek_v4_flash, but only as disabled future candidates.',
    },
    {
      evidenceId: 'deepseek_v4_api_surface',
      provider: 'deepseek',
      sourceName: 'DeepSeek First API Call and API Reference',
      sourceUrl: 'https://api-docs.deepseek.com/',
      sourceType: 'official_docs',
      observedFacts: [
        'Official docs describe OpenAI-compatible and Anthropic-compatible API shapes.',
        'Official docs describe JSON output and tool-call support.',
        'Tool-call support is model output only; ReeditPro does not allow direct code or worker execution.',
      ],
      integrationImpact: 'Future DeepSeek phases should use backend-only provider gateway routing and approved plan snapshots, never raw chat execution.',
    },
    {
      evidenceId: 'deepseek_v4_changelog',
      provider: 'deepseek',
      sourceName: 'DeepSeek API Changelog',
      sourceUrl: 'https://api-docs.deepseek.com/updates',
      sourceType: 'official_docs',
      observedFacts: [
        'Current official update evidence references the V4 model family and long-context API surface.',
        'Any future live phase must re-verify model availability and pricing on that date.',
      ],
      integrationImpact: 'PROVIDER-0 records current target IDs but requires later phases to re-check before making a live call.',
    },
    {
      evidenceId: 'qwen_3_7_model_updates',
      provider: 'qwen',
      sourceName: 'Alibaba Model Studio Newly Released Models',
      sourceUrl: 'https://help.aliyun.com/zh/model-studio/newly-released-models',
      sourceType: 'official_docs',
      observedFacts: [
        'Alibaba official model update evidence identifies qwen3.7-max as the current API model ID.',
        'qwen3.7-max-2026-06-08 is the newer pinned snapshot candidate.',
      ],
      integrationImpact: 'The integration target should be qwen3.7-max, not the older Qwen3-Max naming used in secondary reporting.',
    },
    {
      evidenceId: 'qwen_3_7_pricing',
      provider: 'qwen',
      sourceName: 'Alibaba Model Studio Pricing',
      sourceUrl: 'https://help.aliyun.com/zh/model-studio/model-pricing',
      sourceType: 'official_docs',
      observedFacts: [
        'Pricing tables include qwen3.7-max alias/snapshot evidence.',
        'qwen3.7-max-2026-05-20 is an older equivalent snapshot candidate for current alias mapping in pricing evidence.',
      ],
      integrationImpact: 'Future Qwen live validation needs explicit daily/monthly budget gates and snapshot pinning policy.',
    },
    {
      evidenceId: 'qwen_openai_compatibility',
      provider: 'qwen',
      sourceName: 'Alibaba Cloud OpenAI-Compatible Qwen API',
      sourceUrl: 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
      sourceType: 'official_docs',
      observedFacts: [
        'Alibaba documents OpenAI-compatible API usage through DashScope/Model Studio.',
        'Provider key semantics align with DASHSCOPE_API_KEY.',
      ],
      integrationImpact: 'Qwen keys must be backend-only Secret Manager references with DashScope semantics.',
    },
    {
      evidenceId: 'qwen_first_api_key_docs',
      provider: 'qwen',
      sourceName: 'Alibaba Cloud First API Call to Qwen',
      sourceUrl: 'https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen',
      sourceType: 'official_docs',
      observedFacts: [
        'Alibaba first-call docs describe API key setup for Qwen/DashScope.',
        'PROVIDER-0 does not create, read, or verify Qwen key values.',
      ],
      integrationImpact: 'Only the future backend secret reference name should be recorded in ReeditPro docs and artifacts.',
    },
    {
      evidenceId: 'qwen3_max_reuters_context',
      provider: 'reuters_context',
      sourceName: 'Reuters Qwen3-Max reporting',
      sourceUrl: 'https://www.reuters.com/',
      sourceType: 'secondary_reporting',
      observedFacts: [
        'Reuters-reported Qwen3-Max evidence is useful historical context for agent/coding capabilities.',
        'Secondary reporting is not the exact API contract for Qwen3.7-Max integration.',
      ],
      integrationImpact: 'Use qwen3.7-max official docs as the integration target; treat qwen3-max as a separate older family/alias unless later official docs say otherwise.',
    },
    {
      evidenceId: 'supabase_data_api_context',
      provider: 'supabase_context',
      sourceName: 'Supabase changelog',
      sourceUrl: 'https://supabase.com/changelog.md',
      sourceType: 'official_changelog',
      observedFacts: [
        'Supabase Data API exposure and OpenAPI access can change independently from RLS.',
        'PROVIDER-0 must not make schema/RLS/Data API changes.',
      ],
      integrationImpact: 'Supabase interaction is limited to the existing Phase 51D milestone sync path if execution is explicitly confirmed.',
    },
  ]
}
