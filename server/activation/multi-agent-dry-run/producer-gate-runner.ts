import type { ToolCapabilityRecord } from '../tool-capability-registry-audit'
import type { EditIntentCandidate, ProducerGateResult } from './multi-agent-dry-run-types'

export function runProducerGate(intents: EditIntentCandidate[], capabilities: ToolCapabilityRecord[]): ProducerGateResult[] {
  return intents.map((intent) => {
    const matches = intent.requiredCapabilities
      .map((toolId) => capabilities.find((item) => item.toolId === toolId))
      .filter(Boolean) as ToolCapabilityRecord[]
    const capabilityMatches = matches.map((item) => ({
      track: item.track,
      toolId: item.toolId,
      status: item.status,
      internalTestingReady: item.internalTestingReady,
    }))
    const block = producerBlocker(intent, matches)
    return {
      intentId: intent.intentId,
      intentType: intent.intentType,
      decision: block ? 'blocked' : 'allowed_candidate_plan_only',
      reason: block ?? 'Allowed as an internal-testing candidate plan only; no worker/tool/provider execution is authorized.',
      capabilityMatches,
      candidatePlanOnly: true,
      productionAllowed: false,
      externalBetaAllowed: false,
      publicArtifactAllowed: false,
      rawPromptExecutionAllowed: false,
    }
  })
}

export function validateProducerGate(results: ProducerGateResult[]) {
  const blockers: string[] = []
  if (!results.length) blockers.push('Producer gate returned no results.')
  for (const result of results) {
    if (!result.candidatePlanOnly) blockers.push(`${result.intentId} is not candidate-plan-only.`)
    if (result.productionAllowed || result.externalBetaAllowed || result.publicArtifactAllowed || result.rawPromptExecutionAllowed) {
      blockers.push(`${result.intentId} attempts a blocked unlock.`)
    }
  }
  for (const expectedBlocked of ['motion_graphics_lower_third', 'qwen_vlm_visual_understanding_request', 'demucs_stem_separation_request']) {
    const item = results.find((result) => result.intentType === expectedBlocked)
    if (!item || item.decision !== 'blocked') blockers.push(`${expectedBlocked} must be blocked by the Producer gate.`)
  }
  const allowed = results.filter((result) => result.decision === 'allowed_candidate_plan_only')
  if (!allowed.length) blockers.push('Producer gate did not allow any safe candidate-plan-only intents.')
  return { ok: blockers.length === 0, blockers }
}

function producerBlocker(intent: EditIntentCandidate, matches: ToolCapabilityRecord[]): string | null {
  if (intent.blocked) return intent.blockedReason ?? 'Intent was pre-blocked by capability policy.'
  if (intent.intentType === 'motion_graphics_lower_third') return 'AI Tools owns lower-third creative graphics execution; this chat cannot directly execute it.'
  if (intent.intentType === 'qwen_vlm_visual_understanding_request') return 'VLM remains excluded for initial internal testing.'
  if (intent.intentType === 'demucs_stem_separation_request') return 'Demucs remains blocked pending model provenance.'
  if (!matches.length) return 'No matching Phase 52B capability records were found.'
  const unavailable = matches.filter((item) => !item.internalTestingReady)
  if (unavailable.length) return `Capabilities are not internal-testing-ready: ${unavailable.map((item) => item.toolId).join(', ')}.`
  return null
}
