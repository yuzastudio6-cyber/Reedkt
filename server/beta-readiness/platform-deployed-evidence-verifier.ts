import { buildBetaReadinessReport } from './beta-readiness-report-builder'
import type { BetaReadinessEvidencePacketInput } from './beta-readiness-evidence-store'
import type { BetaReadinessReport } from './beta-readiness-types'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export type BetaPlatformDeployedProbeId =
  | 'tool_cost_events_migration_deployed'
  | 'beta_readiness_evidence_migration_deployed'
  | 'service_role_write_path_verified'
  | 'authenticated_rls_member_readback_verified'
  | 'idempotent_replay_verified'
  | 'wallet_settlement_verified'
  | 'stripe_boundary_owner_verified'
  | 'monitoring_deployment_verified'
  | 'staging_billing_qa_verified'

export type BetaPlatformDeployedProbeStatus = 'passed' | 'failed' | 'not_run'

export interface BetaPlatformDeployedProbeResult {
  id: BetaPlatformDeployedProbeId
  status: BetaPlatformDeployedProbeStatus
  evidence: string[]
  nextAction: string
}

export interface BetaPlatformDeployedEvidenceOwnerApprovals {
  billingOwnerStripeBoundaryApproved: boolean
  deploymentApproved: boolean
  securityApproved: boolean
  storageApproved: boolean
  legalApproved: boolean
  monitoringApproved: boolean
  supportApproved: boolean
}

export interface BetaPlatformDeployedEvidenceVerifierInput {
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  environment: 'staging' | 'production'
  ownerApprovals: BetaPlatformDeployedEvidenceOwnerApprovals
  notes: string[]
}

export type BetaPlatformDeployedEvidenceProbeRunner =
  () => Promise<BetaPlatformDeployedProbeResult> | BetaPlatformDeployedProbeResult

export type BetaPlatformDeployedEvidenceProbeRunners = Partial<Record<
  BetaPlatformDeployedProbeId,
  BetaPlatformDeployedEvidenceProbeRunner
>>

export interface BetaPlatformDeployedEvidenceVerificationReport {
  reportId: string
  createdAt: string
  environment: 'staging' | 'production'
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  checks: BetaPlatformDeployedProbeResult[]
  missingEvidence: string[]
  ownerApprovalGaps: string[]
  evidencePacketReady: boolean
  evidencePacket?: BetaReadinessEvidencePacketInput
  evaluatedReadiness: BetaReadinessReport
  externalBetaAllowed: false
  productionAllowed: false
  warnings: string[]
}

const orderedProbeIds: BetaPlatformDeployedProbeId[] = [
  'tool_cost_events_migration_deployed',
  'beta_readiness_evidence_migration_deployed',
  'service_role_write_path_verified',
  'authenticated_rls_member_readback_verified',
  'idempotent_replay_verified',
  'wallet_settlement_verified',
  'stripe_boundary_owner_verified',
  'monitoring_deployment_verified',
  'staging_billing_qa_verified',
]

export async function runBetaPlatformDeployedEvidenceVerifier(
  input: BetaPlatformDeployedEvidenceVerifierInput,
  probes: BetaPlatformDeployedEvidenceProbeRunners,
): Promise<BetaPlatformDeployedEvidenceVerificationReport> {
  assertNoSecretLikeVerifierInput(input)

  const checks = await Promise.all(orderedProbeIds.map(async (id) => {
    const runner = probes[id]
    if (!runner) {
      return notRunProbe(id, nextActionForProbe(id))
    }
    return normalizeProbeResult(id, await runner())
  }))

  const missingEvidence = checks
    .filter((check) => check.status !== 'passed')
    .map((check) => `${labelForProbe(check.id)}: ${check.nextAction}`)
  const ownerApprovalGaps = ownerApprovalGapsFor(input.ownerApprovals)
  const evidencePacketReady = missingEvidence.length === 0 && ownerApprovalGaps.length === 0
  const evidencePacket = evidencePacketReady ? buildEvidencePacket(input) : undefined
  const evaluatedReadiness = evidencePacket
    ? buildBetaReadinessReport({
      platformEvidence: evidencePacket.platformEvidence,
      ...(evidencePacket.approvals ?? {}),
    })
    : buildBetaReadinessReport()

  return {
    reportId: `beta-platform-deployed-evidence-verifier-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    environment: input.environment,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    checks,
    missingEvidence,
    ownerApprovalGaps,
    evidencePacketReady,
    evidencePacket,
    evaluatedReadiness,
    externalBetaAllowed: false,
    productionAllowed: false,
    warnings: [
      'This verifier builds a platform evidence packet only after every deployed probe and owner approval passes.',
      'It does not write evidence, call Supabase by itself, call Stripe, execute tools, process media, enable beta, or enable production.',
      'A ready platform evidence packet clears only the shared platform blocker; per-tool accepted execution evidence and separate launch gates are still required.',
    ],
  }
}

function buildEvidencePacket(input: BetaPlatformDeployedEvidenceVerifierInput): BetaReadinessEvidencePacketInput {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    platformEvidence: {
      sourceId: input.sourceId,
      sourceSha: input.sourceSha,
      environment: input.environment,
      toolCostEventsMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      idempotentReplayVerified: true,
      walletSettlementVerified: true,
      stripeBoundaryVerified: true,
      monitoringVerified: true,
      billingQaVerified: true,
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      legalApproved: true,
      supportApproved: true,
      notes: input.notes,
    },
    approvals: {
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      legalApproved: true,
      monitoringApproved: true,
      supportApproved: true,
    },
  }
}

function normalizeProbeResult(
  expectedId: BetaPlatformDeployedProbeId,
  result: BetaPlatformDeployedProbeResult,
): BetaPlatformDeployedProbeResult {
  if (result.id !== expectedId) {
    return {
      id: expectedId,
      status: 'failed',
      evidence: [`Probe returned ${result.id} while verifier expected ${expectedId}.`],
      nextAction: `Fix the deployed evidence probe wiring for ${expectedId}.`,
    }
  }
  if (result.status === 'passed' && result.evidence.length === 0) {
    return {
      ...result,
      status: 'failed',
      evidence: ['Passed probe did not include evidence notes.'],
      nextAction: `Record deployed evidence notes for ${labelForProbe(expectedId)}.`,
    }
  }
  return result
}

function notRunProbe(id: BetaPlatformDeployedProbeId, nextAction: string): BetaPlatformDeployedProbeResult {
  return {
    id,
    status: 'not_run',
    evidence: [],
    nextAction,
  }
}

function ownerApprovalGapsFor(approvals: BetaPlatformDeployedEvidenceOwnerApprovals): string[] {
  return [
    ...(approvals.billingOwnerStripeBoundaryApproved ? [] : ['Billing owner Stripe-boundary approval is missing.']),
    ...(approvals.deploymentApproved ? [] : ['Deployment owner approval is missing.']),
    ...(approvals.securityApproved ? [] : ['Security owner approval is missing.']),
    ...(approvals.storageApproved ? [] : ['Storage/privacy owner approval is missing.']),
    ...(approvals.legalApproved ? [] : ['Legal owner approval is missing.']),
    ...(approvals.monitoringApproved ? [] : ['Monitoring owner approval is missing.']),
    ...(approvals.supportApproved ? [] : ['Support owner approval is missing.']),
  ]
}

function assertNoSecretLikeVerifierInput(input: BetaPlatformDeployedEvidenceVerifierInput): void {
  const secretPaths = collectSecretLikePaths(input, 'betaPlatformDeployedEvidenceVerifier')
  if (secretPaths.length > 0) {
    throw new Error(`Beta platform deployed evidence verifier input contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function labelForProbe(id: BetaPlatformDeployedProbeId): string {
  return id.replace(/_/g, ' ')
}

function nextActionForProbe(id: BetaPlatformDeployedProbeId): string {
  switch (id) {
    case 'tool_cost_events_migration_deployed':
      return 'Verify the tool_cost_events migration in staging or production.'
    case 'beta_readiness_evidence_migration_deployed':
      return 'Verify the beta_readiness_evidence_packets migration and backend-only access in staging or production.'
    case 'service_role_write_path_verified':
      return 'Verify service-role event/evidence writes through backend runtime without exposing service-role secrets.'
    case 'authenticated_rls_member_readback_verified':
      return 'Verify member and non-member RLS readback with real auth claims.'
    case 'idempotent_replay_verified':
      return 'Verify deployed idempotency replay returns the original event/evidence rows without duplicate charge.'
    case 'wallet_settlement_verified':
      return 'Verify deployed wallet spend/release/refund settlement through the RPC.'
    case 'stripe_boundary_owner_verified':
      return 'Record billing-owner Stripe-boundary approval and verify no Stripe calls occur from tool event surfaces.'
    case 'monitoring_deployment_verified':
      return 'Verify deployed dashboards, alert rules, thresholds, and routing.'
    case 'staging_billing_qa_verified':
      return 'Run staging billing QA for event write, replay, summary readback, settlement, and non-billable failure cases.'
  }
}
