import type { RuntimeUnlockBlockedScopePolicy } from './runtime-unlock-roadmap-types'

export function buildRuntimeUnlockBlockedScopePolicy(): RuntimeUnlockBlockedScopePolicy {
  return {
    policyId: 'phase53a_blocked_scope_policy',
    rawPromptExecutionPolicy: 'blocked_as_direct_execution_forever',
    approvedPlanSnapshotExecutionPolicy: 'replacement_path_only_after_later_owner_runtime_gates',
    signedUrlSourceOfTruthPolicy: 'blocked_forever',
    signedUrlTemporaryAccessPolicy: 'future_temporary_access_link_only_not_source_of_truth',
    rules: [
      rule('tools', 'Owner audit, dry-run, generated/local fixture, staging fixture, and controlled sample must pass before any runtime use.'),
      rule('workers', 'Worker Runtime owner must pass repo audit through controlled private sample before worker execution can be considered.'),
      rule('models', 'Model owner must provide license/provenance/runtime/cost evidence and pass staged fixtures before inference.'),
      rule('providers', 'Provider Gateway owner must pass secret, cost, policy, observability, and fail-closed gates before calls.'),
      rule('media processing', 'Track owner must pass private controlled-sample QA before processing real media beyond approved samples.'),
      rule('web search execution', 'Web search remains owner-gated and must keep private provider/artifact policy.'),
      rule('browser capture', 'Browser capture requires allowlisted, private, bounded owner evidence.'),
      rule('map rendering', 'Map rendering remains generated/local/staging gated; live tiles/geocoding/routing stay blocked.'),
      rule('Docker / Cloud Run execution', 'Worker Runtime and platform owners must pass repo audit, staging fixture, IAM, cost, rollback, and observability gates.'),
      rule('production', 'Production cannot unlock before all owner tracks reach production_candidate and final readiness gates pass.'),
      rule('external beta', 'External beta cannot unlock before owner, compliance, observability, billing, security, and privacy gates pass.'),
      rule('paid production', 'Paid production cannot unlock before billing/credits, compliance, and production readiness are complete.'),
      rule('broad media', 'Broad media remains blocked until privacy, retention, storage, QA, moderation, cost, and rollback gates pass.'),
      rule('public artifacts', 'Public artifacts remain blocked until a later explicit public artifact policy gate passes.'),
      rule('signed URLs', 'Signed URLs cannot be source of truth and may only become temporary access links in a later policy phase.', 'signed_url_source_of_truth_blocked_forever'),
      rule('raw prompt execution', 'Workers must execute approved plan snapshots only; raw prompt direct execution remains blocked forever.', 'raw_prompt_direct_execution_blocked_forever'),
    ],
  }
}

function rule(scope: string, unlockPath: string, permanentPolicy?: string) {
  return {
    scope,
    blockedByDefault: true as const,
    unlockPath,
    permanentPolicy,
  }
}
