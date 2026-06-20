import type {
  ProviderCostPolicy,
  ProviderDataPolicy,
  ProviderExecutionPolicy,
  ProviderModelDecision,
  ProviderPhaseRoadmap,
  ProviderQuestionAnswer,
  ProviderSecretPolicy,
} from './provider-gateway-models-audit-types'

export function buildProviderModelDecisions(): ProviderModelDecision[] {
  return [
    {
      internalModelName: 'qwen_3_7_max',
      providerModelId: 'qwen3.7-max',
      pinnedSnapshotCandidates: ['qwen3.7-max-2026-06-08', 'qwen3.7-max-2026-05-20'],
      intendedRole: 'Head editing/planning agent candidate for structured planning, not worker execution.',
      executionStatus: 'audit_only_blocked_for_runtime',
    },
    {
      internalModelName: 'deepseek_v4_pro',
      providerModelId: 'deepseek-v4-pro',
      pinnedSnapshotCandidates: [],
      intendedRole: 'Coding/tool-implementation specialist candidate for bounded implementation suggestions, not direct code execution.',
      executionStatus: 'audit_only_blocked_for_runtime',
    },
    {
      internalModelName: 'deepseek_v4_flash',
      providerModelId: 'deepseek-v4-flash',
      pinnedSnapshotCandidates: [],
      intendedRole: 'Optional cheaper coding fallback candidate, blocked until cost and quality gates exist.',
      executionStatus: 'audit_only_blocked_for_runtime',
    },
  ]
}

export function buildProviderSecretPolicy(): ProviderSecretPolicy {
  return {
    policyId: 'provider0_secret_policy',
    qwenSecretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME',
    qwenProviderKeySemantics: 'DASHSCOPE_API_KEY',
    deepSeekSecretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME',
    deepSeekProviderKeySemantics: 'DEEPSEEK_API_KEY',
    allowedStorage: ['backend-only Google Secret Manager reference names', 'server-side environment variables containing Secret Manager resource names', 'private milestone metadata noting secret reference presence only'],
    blockedStorage: ['raw API key values in git', 'raw API key values in docs', 'raw API key values in Supabase rows', 'raw API key values in GCS artifacts', 'frontend NEXT_PUBLIC variables', 'logs or PR body text'],
    frontendExposureAllowed: false,
    secretValuesResolvedInProvider0: false,
  }
}

export function buildProviderDataPolicy(): ProviderDataPolicy {
  return {
    policyId: 'provider0_data_policy',
    qwenAllowedData: [
      'sanitized planning context',
      'approved plan snapshot metadata',
      'structured edit intent and QA constraints',
      'safe source summaries',
      'private gs:// artifact references without temporary signed URLs',
    ],
    deepSeekAllowedData: [
      'sanitized code/task context',
      'bounded file paths and diffs selected by an approved plan snapshot',
      'diagnostics and test failures with secrets redacted',
      'implementation briefs that prohibit direct execution',
    ],
    blockedData: [
      'raw user media or arbitrary private media bytes',
      'private database row payloads',
      'raw provider responses',
      'service-role keys, API keys, bearer tokens, DB URLs, passwords, and payment secrets',
      'frontend-exposed provider keys or model credentials',
      'signed URLs as source of truth',
      'public artifact URLs as source of truth',
      'unrestricted raw chat transcript execution payloads',
    ],
    rawProviderResponseStorageAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
  }
}

export function buildProviderCostPolicy(): ProviderCostPolicy {
  return {
    policyId: 'provider0_cost_policy',
    providerBudgetsDefaultToZero: true,
    providerCallsBlockedByDefault: true,
    requiredFutureControls: [
      'per-provider enabled flag defaulting false',
      'daily call limit defaulting 0 until explicitly approved',
      'monthly budget defaulting 0 until explicitly approved',
      'max tokens/context/output controls per phase',
      'kill switch that blocks all real provider calls',
      'cost estimate attached to approved plan snapshot before any future call',
      'Supabase milestone record for each future validation phase',
    ],
  }
}

export function buildProviderExecutionPolicy(): ProviderExecutionPolicy {
  return {
    policyId: 'provider0_execution_policy',
    deepSeekCanDirectlyExecuteCode: false,
    qwenCanDirectlyExecuteWorkersOrTools: false,
    toolCallsAreModelOutputOnly: true,
    approvedPlanSnapshotsRequiredBeforeAnyFutureRuntime: true,
    runtimeUnlockStageRequiredBeforeExecution: 'repo_audit_passed_or_later_with_explicit_owner_phase',
  }
}

export function buildProviderPhaseRoadmap(ready: boolean): ProviderPhaseRoadmap {
  return {
    roadmapId: 'provider0_phase_roadmap',
    provider1Readiness: ready ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
    items: [
      item('PROVIDER-0', 'Provider Gateway Models Repo Audit', 'This audit, static/report-only with optional milestone sync only.', ['repo audit', 'policy docs', 'model-name decisions'], ['provider calls', 'secret values', 'runtime execution']),
      item('PROVIDER-1', 'Provider Registry And Secret Metadata Fixture', 'Add disabled provider registry metadata and secret-reference presence checks only.', ['metadata fixture', 'Secret Manager metadata only'], ['secret value reads', 'provider calls']),
      item('PROVIDER-2', 'DeepSeek-Shaped Fixture Normalizer', 'Normalize generated DeepSeek-shaped coding/tool suggestions without a live API.', ['generated fixtures'], ['DeepSeek API calls', 'code execution']),
      item('PROVIDER-3', 'Qwen-Shaped Fixture Normalizer', 'Normalize generated Qwen planning outputs without a live API.', ['generated fixtures'], ['Qwen API calls', 'worker/tool execution']),
      item('PROVIDER-4', 'DeepSeek Controlled Live Validation', 'One guarded DeepSeek API validation with budget gates and no code execution.', ['one backend-only call if approved later'], ['direct execution', 'raw response storage']),
      item('PROVIDER-5', 'Qwen Controlled Live Validation', 'One guarded Qwen API validation with budget gates and no tool/worker execution.', ['one backend-only call if approved later'], ['direct worker/tool execution', 'raw response storage']),
      item('PROVIDER-6', 'Provider Gateway Dry-Run Routing', 'Route approved plan snapshot fixtures through disabled provider decisions.', ['dry-run routing'], ['real provider calls']),
      item('PROVIDER-7+', 'Controlled Private Samples', 'Only after owner acceptance and repo audit pass.', ['bounded private samples after explicit phase'], ['production', 'external beta', 'broad media']),
    ],
  }
}

export function buildProviderQuestionAnswers(): ProviderQuestionAnswer[] {
  return [
    answer('q1', 'Is Qwen3.7-Max the exact official model/API name, or is it Qwen3.7 / Qwen3-Max / another Qwen API alias?', 'The exact current integration target is qwen3.7-max. qwen3.7-max-2026-06-08 and qwen3.7-max-2026-05-20 are pinned snapshot candidates. Reuters/Qwen3-Max context is historical and not the exact new API ID.'),
    answer('q2', 'Where should Qwen API keys live?', 'Backend-only Google Secret Manager, referenced by a ReeditPro env var such as GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME. The raw key must never enter frontend code, git, docs, Supabase rows, or artifacts.'),
    answer('q3', 'Where should DeepSeek API keys live?', 'Backend-only Google Secret Manager, referenced by GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME. The raw key must never enter frontend code, git, docs, Supabase rows, or artifacts.'),
    answer('q4', 'What model names should Provider Gateway expose internally?', 'Expose qwen_3_7_max, deepseek_v4_pro, and deepseek_v4_flash as disabled future provider-model candidates mapped to qwen3.7-max, deepseek-v4-pro, and deepseek-v4-flash.'),
    answer('q5', 'What data can be sent to Qwen?', 'Only sanitized planning context, approved plan snapshot metadata, structured edit intent, safe source summaries, and private artifact references in a later approved execution phase.'),
    answer('q6', 'What data can be sent to DeepSeek?', 'Only sanitized code/task context, bounded file paths/diffs/diagnostics, and implementation briefs in a later approved execution phase.'),
    answer('q7', 'What data is blocked?', 'Raw user media, private row payloads, raw provider responses, service-role keys, API keys, bearer tokens, DB URLs, signed URLs as source of truth, public artifact URLs as source of truth, payment secrets, and unrestricted raw chat.'),
    answer('q8', 'Can DeepSeek directly execute code?', 'No. DeepSeek output can become a candidate finding or implementation suggestion only after ReeditPro validation; it cannot directly execute code.'),
    answer('q9', 'Can Qwen directly execute workers/tools?', 'No. Qwen output can become structured planning or candidate approved-plan-snapshot material only after validation; it cannot directly execute workers or tools.'),
    answer('q10', 'What is the first safe DeepSeek phase?', 'PROVIDER-2 DeepSeek-shaped fixture normalizer is the first safe DeepSeek-specific phase; PROVIDER-4 is the first possible live-call validation only after fixture and budget gates.'),
    answer('q11', 'What is the first safe Qwen phase?', 'PROVIDER-3 Qwen-shaped fixture normalizer is the first safe Qwen-specific phase; PROVIDER-5 is the first possible live-call validation only after fixture and budget gates.'),
    answer('q12', 'What feature gates must stay disabled?', 'Provider calls, Qwen calls, DeepSeek calls, provider secret creation/value reads, worker/tool runtime, model inference, production, external beta, paid production, broad media, public artifacts, raw prompt execution, and signed URL source-of-truth.'),
    answer('q13', 'What cost controls are required?', 'Provider enabled flags default false, daily/monthly budgets default 0, max token/result limits, kill switch, cost estimates tied to approved snapshots, and per-phase milestone evidence.'),
    answer('q14', 'What Supabase milestone sync is required?', 'Only an optional PROVIDER-0 milestone sync through the Phase 51D/51B registry path; no schema/RLS/Data API changes and no product row writes.'),
  ]
}

function item(phaseId: string, name: string, scope: string, allowed: string[], blocked: string[]): ProviderPhaseRoadmap['items'][number] {
  return { phaseId, name, scope, allowed, blocked }
}

function answer(questionId: string, question: string, answerText: string): ProviderQuestionAnswer {
  return { questionId, question, answer: answerText }
}
