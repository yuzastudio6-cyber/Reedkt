import type {
  BetaPlatformDeployedEvidenceProbeRunners,
  BetaPlatformDeployedProbeId,
  BetaPlatformDeployedProbeResult,
} from './platform-deployed-evidence-verifier'

export interface BetaPlatformDeployedEvidenceObservation {
  ok: boolean
  evidence: string[]
  nextAction: string
}

export interface BetaPlatformDeployedEvidenceProbeTransport {
  verifyToolCostEventsMigration(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyBetaReadinessEvidenceMigration(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyServiceRoleWritePath(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyAuthenticatedRlsMemberReadback(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyIdempotentReplay(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyWalletSettlement(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyStripeBoundaryOwnerApproval(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyMonitoringDeployment(): Promise<BetaPlatformDeployedEvidenceObservation>
  verifyStagingBillingQa(): Promise<BetaPlatformDeployedEvidenceObservation>
}

export function createBetaPlatformDeployedEvidenceProbeRunners(
  transport: BetaPlatformDeployedEvidenceProbeTransport,
): BetaPlatformDeployedEvidenceProbeRunners {
  return {
    tool_cost_events_migration_deployed: () => transportProbe(
      'tool_cost_events_migration_deployed',
      transport.verifyToolCostEventsMigration(),
    ),
    beta_readiness_evidence_migration_deployed: () => transportProbe(
      'beta_readiness_evidence_migration_deployed',
      transport.verifyBetaReadinessEvidenceMigration(),
    ),
    service_role_write_path_verified: () => transportProbe(
      'service_role_write_path_verified',
      transport.verifyServiceRoleWritePath(),
    ),
    authenticated_rls_member_readback_verified: () => transportProbe(
      'authenticated_rls_member_readback_verified',
      transport.verifyAuthenticatedRlsMemberReadback(),
    ),
    idempotent_replay_verified: () => transportProbe(
      'idempotent_replay_verified',
      transport.verifyIdempotentReplay(),
    ),
    wallet_settlement_verified: () => transportProbe(
      'wallet_settlement_verified',
      transport.verifyWalletSettlement(),
    ),
    stripe_boundary_owner_verified: () => transportProbe(
      'stripe_boundary_owner_verified',
      transport.verifyStripeBoundaryOwnerApproval(),
    ),
    monitoring_deployment_verified: () => transportProbe(
      'monitoring_deployment_verified',
      transport.verifyMonitoringDeployment(),
    ),
    staging_billing_qa_verified: () => transportProbe(
      'staging_billing_qa_verified',
      transport.verifyStagingBillingQa(),
    ),
  }
}

async function transportProbe(
  id: BetaPlatformDeployedProbeId,
  observationPromise: Promise<BetaPlatformDeployedEvidenceObservation>,
): Promise<BetaPlatformDeployedProbeResult> {
  const observation = await observationPromise
  return {
    id,
    status: observation.ok ? 'passed' : 'failed',
    evidence: observation.evidence,
    nextAction: observation.nextAction,
  }
}
