import type { RuntimeUnlockLadder, RuntimeUnlockLadderStage, RuntimeUnlockStageId } from './runtime-unlock-roadmap-types'

const stageIds: RuntimeUnlockStageId[] = [
  'blocked',
  'owner_accepted',
  'repo_audit_passed',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'staging_fixture_passed',
  'controlled_private_sample_passed',
  'internal_beta_candidate',
  'external_beta_candidate',
  'production_candidate',
]

export function buildRuntimeUnlockLadder(): RuntimeUnlockLadder {
  return {
    ladderId: 'phase53a_runtime_unlock_ladder',
    noStageSkippingWithoutExplicitPolicyAndQa: true,
    stages: stageIds.map((stageId, stageIndex): RuntimeUnlockLadderStage => ({
      stageIndex,
      stageId,
      displayName: stageId.replace(/_/g, ' '),
      exitCriteria: exitCriteria(stageId),
      maySkip: false,
    })),
  }
}

function exitCriteria(stageId: RuntimeUnlockStageId): string[] {
  switch (stageId) {
    case 'blocked':
      return ['Scope is blocked until an owner accepts it and names an audit prompt.']
    case 'owner_accepted':
      return ['Owner confirms accepted scope, blocked scope, evidence refs, and Supabase update classification.']
    case 'repo_audit_passed':
      return ['Owner repo audit passes without implementing runtime behavior.']
    case 'dry_run_passed':
      return ['Deterministic dry-run proves schemas, policies, and fail-closed behavior.']
    case 'generated_local_fixture_passed':
      return ['Generated/local fixture passes without real user data, live providers, or public artifacts.']
    case 'staging_fixture_passed':
      return ['Private staging fixture passes with approved credentials, artifact privacy, and no broad scope.']
    case 'controlled_private_sample_passed':
      return ['One bounded controlled private sample passes all owner QA gates.']
    case 'internal_beta_candidate':
      return ['Owner and QA approve controlled internal beta candidate limits.']
    case 'external_beta_candidate':
      return ['Compliance, security, observability, billing, and owner gates approve external beta candidate.']
    case 'production_candidate':
      return ['Production readiness, cost, compliance, rollback, monitoring, and owner gates approve production candidate.']
  }
}
