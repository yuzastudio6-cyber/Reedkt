import { MODEL_PROVIDER_DRY_RUN_BLOCKED_SCOPES } from './model-provider-dry-run-policy'
import type { ModelProviderDryRunCase } from './model-provider-dry-run-types'

const JSON_ONLY_SYSTEM_PROMPT = [
  'You are participating in ReEditPro MODEL-DRYRUN-1.',
  'Return only valid JSON matching the requested schema.',
  'Use synthetic metadata only.',
  'Do not execute tools, workers, routes, browser capture, media processing, web search, map rendering, provider chains, Supabase, SQL, GCP, uploads, signed URLs, public artifacts, beta, or production.',
  'If an execution request appears, mark it blocked in the JSON.',
].join(' ')

export function buildModelProviderSyntheticDryRunCases(): ModelProviderDryRunCase[] {
  return [
    {
      caseId: 'modeldryrun1_qwen_head_agent_planning',
      providerId: 'qwen_dashscope',
      modelId: 'qwen3.7-plus',
      schemaId: 'agent_findings_v1',
      purpose: 'Qwen head-agent planning and decision metadata only.',
      systemPrompt: JSON_ONLY_SYSTEM_PROMPT,
      userPrompt: JSON.stringify({
        caseId: 'modeldryrun1_qwen_head_agent_planning',
        schemaId: 'agent_findings_v1',
        syntheticEvidenceManifest: {
          project: 'synthetic-demo-product-explainer',
          sourceClips: [
            { clipId: 'synthetic_clip_001', durationSec: 8, note: 'speaker intro with safe placeholder transcript' },
            { clipId: 'synthetic_clip_002', durationSec: 14, note: 'screen demonstration with generated placeholder labels' },
            { clipId: 'synthetic_clip_003', durationSec: 6, note: 'call to action card with synthetic brand copy' },
          ],
          noRealUserData: true,
          noRawMedia: true,
          noUrls: true,
        },
        requestedJsonShape: {
          caseId: 'string',
          findings: ['string'],
          editIntents: ['string'],
          blockedDecisions: ['string'],
          professionalEditScores: { pacing: 'number', clarity: 'number', safety: 'number' },
          confidence: 'number',
          risks: ['string'],
          blockedActions: ['string'],
          executionAllowed: false,
        },
      }, null, 2),
      maxTokens: 900,
      timeoutMs: 15000,
      blockedActions: [...MODEL_PROVIDER_DRY_RUN_BLOCKED_SCOPES],
    },
    {
      caseId: 'modeldryrun1_deepseek_coding_spec_proposal',
      providerId: 'deepseek',
      modelId: 'deepseek-v4-flash',
      schemaId: 'coding_spec_proposal_v1',
      purpose: 'DeepSeek coding/spec proposal metadata only.',
      systemPrompt: JSON_ONLY_SYSTEM_PROMPT,
      userPrompt: JSON.stringify({
        caseId: 'modeldryrun1_deepseek_coding_spec_proposal',
        schemaId: 'coding_spec_proposal_v1',
        syntheticTask: {
          title: 'Design a non-executable schema validator for synthetic provider dry-run responses',
          constraints: [
            'Node built-ins only',
            'no provider chaining',
            'no raw prompt forwarding',
            'fail closed on schema mismatch',
            'record tests as suggestions only',
          ],
        },
        requestedJsonShape: {
          caseId: 'string',
          proposalSummary: 'string',
          implementationNotes: ['string'],
          testsSuggested: ['string'],
          riskLevel: 'low | medium | high',
          blockers: ['string'],
          blockedActions: ['string'],
          executionAllowed: false,
        },
      }, null, 2),
      maxTokens: 900,
      timeoutMs: 15000,
      blockedActions: [...MODEL_PROVIDER_DRY_RUN_BLOCKED_SCOPES],
    },
  ]
}

export function buildSyntheticDryRunCaseReport() {
  const cases = buildModelProviderSyntheticDryRunCases()
  return {
    phase: 'MODEL_DRYRUN_1',
    status: cases.length === 2 ? 'passed' : 'blocked',
    syntheticOnly: true,
    userDataAllowed: false,
    rawMediaAllowed: false,
    caseCount: cases.length,
    cases: cases.map(({ systemPrompt, userPrompt, ...safeCase }) => ({
      ...safeCase,
      promptClass: 'synthetic_non_sensitive',
      systemPromptShaOnly: systemPrompt.length > 0,
      userPromptShaOnly: userPrompt.length > 0,
    })),
  }
}
