import { vlmBlockerResolutionGateIds } from './vlm-blocker-resolution-policy'
import type {
  VlmBlockerEvidence,
  VlmBlockerResolutionQaGate,
  VlmBlockerResolutionQaSummary,
  VlmExclusionPolicy,
  VlmRuntimeDecision,
  VlmSystemReadinessImpact,
} from './vlm-blocker-resolution-types'

export function buildVlmBlockerResolutionQaSummary(input: {
  phase47aEvidencePassed: boolean
  blockerEvidence: VlmBlockerEvidence
  runtimeDecision: VlmRuntimeDecision
  exclusionPolicy: VlmExclusionPolicy
  systemReadinessImpact: VlmSystemReadinessImpact
  publicAccessBlocked: boolean
  productionBetaGatesBlocked: boolean
  preflightBlockers?: string[]
  preflightWarnings?: string[]
}): VlmBlockerResolutionQaSummary {
  const blockerText = [
    input.blockerEvidence.exactBlocker,
    ...input.blockerEvidence.blockers,
    ...input.blockerEvidence.warnings,
  ].join('\n')
  const gates: VlmBlockerResolutionQaGate[] = [
    gate('phase47a_evidence', input.phase47aEvidencePassed, input.phase47aEvidencePassed ? 'Phase 47A evidence records Track A ready, Track B partial, and integration blocked by VLM.' : 'Phase 47A evidence is missing or inconsistent.'),
    gate('vlm_blocker_evidence', /CUDA out of memory|Engine core initialization|L4|vLLM/i.test(blockerText), input.blockerEvidence.exactBlocker),
    gate('decision_integrity', input.runtimeDecision.decision === 'vlm_excluded_from_initial_internal_testing', input.runtimeDecision.reason),
    gate('runtime_resolution', input.runtimeDecision.runtimeFixAttempted === false && input.runtimeDecision.runtimeFixResult === 'not_attempted_out_of_scope', 'Runtime retry was not attempted because no safe approved Phase 47B fix exists.'),
    gate('exclusion_integrity', input.exclusionPolicy.vlmIncludedInInitialInternalTesting === false && input.exclusionPolicy.vlmRuntimeEnabled === false && input.exclusionPolicy.providerFallbackAllowed === false, input.exclusionPolicy.exclusionReason),
    gate('system_readiness_impact', input.systemReadinessImpact.systemLevelInternalTestingMayProceedWithoutVlm && input.systemReadinessImpact.phase47CReadiness === 'ready_for_system_level_internal_testing_gate_preparation_without_vlm', 'Phase 47C may prepare system-level internal testing only with VLM excluded.'),
    gate('blocked_features', input.publicAccessBlocked && input.productionBetaGatesBlocked, 'Production, beta, broad media, providers, Revideo, final delivery, model downloads, Docker, Cloud Run, and media processing remain blocked.'),
  ]
  const blockers = [
    ...(input.preflightBlockers ?? []),
    ...(input.phase47aEvidencePassed ? [] : ['Phase 47A evidence is missing or inconsistent.']),
    ...(/CUDA out of memory|Engine core initialization|L4|vLLM/i.test(blockerText) ? [] : ['VLM blocker evidence does not include the expected L4/vLLM OOM details.']),
    ...(input.runtimeDecision.decision === 'vlm_excluded_from_initial_internal_testing' ? [] : ['VLM decision is ambiguous or not an exclusion.']),
    ...(input.exclusionPolicy.vlmIncludedInInitialInternalTesting === false && input.exclusionPolicy.vlmRuntimeEnabled === false ? [] : ['VLM exclusion policy leaves runtime or initial-testing inclusion enabled.']),
    ...(input.publicAccessBlocked ? [] : ['Public bucket principal detected or bucket IAM could not be verified.']),
    ...(input.productionBetaGatesBlocked ? [] : ['A production/beta/public/final-delivery/provider/model/media execution gate is unlocked.']),
  ]
  const warnings = [
    ...input.blockerEvidence.warnings,
    ...(input.preflightWarnings ?? []),
    'Phase 47B resolves ambiguity by excluding VLM from initial internal testing; it does not make VLM runtime ready.',
  ]

  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: typeof vlmBlockerResolutionGateIds[number], passed: boolean, summary: string): VlmBlockerResolutionQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
