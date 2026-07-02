import type { SupabaseClient } from '@supabase/supabase-js'
import {
  recordPersistentBetaReadinessEvidencePacket,
  type BetaReadinessEvidencePacketInput,
} from './beta-readiness-evidence-store'
import type {
  BetaPlatformDeployedEvidenceObservation,
  BetaPlatformDeployedEvidenceProbeTransport,
} from './platform-deployed-evidence-probes'
import type { BetaPlatformDeployedProbeId } from './platform-deployed-evidence-verifier'

export type BetaPlatformSupabaseAttestedProbeId = Extract<
  BetaPlatformDeployedProbeId,
  | 'authenticated_rls_member_readback_verified'
  | 'stripe_boundary_owner_verified'
  | 'monitoring_deployment_verified'
  | 'staging_billing_qa_verified'
>

export interface BetaPlatformSupabaseDeployedProbeTransportOptions {
  admin: SupabaseClient | null
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  idempotencyKey: string
  allowPersistentProbeWrites?: boolean
  walletSettlementProbeToolCostEventId?: string
  attestations?: Partial<Record<BetaPlatformSupabaseAttestedProbeId, BetaPlatformDeployedEvidenceObservation>>
}

interface SupabaseProbeResult {
  data?: unknown
  error?: { code?: string; message?: string; hint?: string } | null
}

export function createBetaPlatformSupabaseDeployedEvidenceProbeTransport(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
): BetaPlatformDeployedEvidenceProbeTransport {
  return {
    verifyToolCostEventsMigration: () => verifyReadableTable(
      options.admin,
      'tool_cost_events',
      'tool_cost_events table read probe succeeded through backend service-role client.',
      'Deploy the tool_cost_events migration and verify service-role read access in staging.',
    ),
    verifyBetaReadinessEvidenceMigration: () => verifyReadableTable(
      options.admin,
      'beta_readiness_evidence_packets',
      'beta_readiness_evidence_packets table read probe succeeded through backend service-role client.',
      'Deploy the beta_readiness_evidence_packets migration and verify backend-only evidence access in staging.',
    ),
    verifyServiceRoleWritePath: () => verifyPersistentEvidenceWrite(options, 'service-role-write'),
    verifyAuthenticatedRlsMemberReadback: () => attestedProbe(
      options,
      'authenticated_rls_member_readback_verified',
      'Provide staging member/non-member RLS readback evidence from authenticated Supabase clients before platform evidence can clear.',
    ),
    verifyIdempotentReplay: () => verifyPersistentEvidenceReplay(options),
    verifyWalletSettlement: () => verifyWalletSettlementRpc(options),
    verifyStripeBoundaryOwnerApproval: () => attestedProbe(
      options,
      'stripe_boundary_owner_verified',
      'Record billing-owner Stripe-boundary approval for the deployed staging tool-cost surfaces.',
    ),
    verifyMonitoringDeployment: () => attestedProbe(
      options,
      'monitoring_deployment_verified',
      'Deploy and verify tool-cost/beta readiness monitoring dashboards, alerts, thresholds, and routing.',
    ),
    verifyStagingBillingQa: () => attestedProbe(
      options,
      'staging_billing_qa_verified',
      'Run staging billing QA for event write, replay, summary readback, settlement, and non-billable failure cases.',
    ),
  }
}

async function verifyReadableTable(
  admin: SupabaseClient | null,
  tableName: string,
  successEvidence: string,
  nextAction: string,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  if (!admin) return missingAdmin(nextAction)

  try {
    const result = await admin.from(tableName).select('id').limit(1) as SupabaseProbeResult
    if (result.error) return failedFromSupabase(result.error, nextAction)
    return {
      ok: true,
      evidence: [successEvidence],
      nextAction: 'No action; deployed table read probe passed.',
    }
  } catch {
    return {
      ok: false,
      evidence: [`${tableName} read probe failed without exposing response details.`],
      nextAction,
    }
  }
}

async function verifyPersistentEvidenceWrite(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
  probeName: string,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  if (!options.allowPersistentProbeWrites) {
    return {
      ok: false,
      evidence: ['Persistent probe writes were not explicitly allowed for this request.'],
      nextAction: 'Re-run the deployed probe route with allowPersistentProbeWrites=true only in staging after owner approval.',
    }
  }
  if (!options.admin) {
    return missingAdmin('Configure backend service-role Supabase runtime before verifying deployed evidence writes.')
  }

  try {
    const result = await recordPersistentBetaReadinessEvidencePacket(
      options.admin,
      probeIdempotencyKey(options, probeName),
      probeEvidence(options),
      'beta-platform-supabase-probe-transport',
    )
    return {
      ok: true,
      evidence: [
        `Persistent beta readiness evidence write probe succeeded; replayed=${result.replayed}.`,
        'Probe packet contains no platform approval evidence and does not enable beta or production.',
      ],
      nextAction: 'No action; backend service-role evidence write path passed.',
    }
  } catch (error) {
    return {
      ok: false,
      evidence: [`Persistent evidence write probe failed: ${safeErrorSummary(error)}.`],
      nextAction: 'Fix beta_readiness_evidence_packets deployment or service-role backend write path before recording platform evidence.',
    }
  }
}

async function verifyPersistentEvidenceReplay(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  if (!options.allowPersistentProbeWrites) {
    return {
      ok: false,
      evidence: ['Persistent replay probe writes were not explicitly allowed for this request.'],
      nextAction: 'Re-run with allowPersistentProbeWrites=true only in staging after owner approval to verify idempotent replay.',
    }
  }
  if (!options.admin) {
    return missingAdmin('Configure backend service-role Supabase runtime before verifying idempotent evidence replay.')
  }

  try {
    const idempotencyKey = probeIdempotencyKey(options, 'idempotent-replay')
    const first = await recordPersistentBetaReadinessEvidencePacket(
      options.admin,
      idempotencyKey,
      probeEvidence(options),
      'beta-platform-supabase-probe-transport',
    )
    const second = await recordPersistentBetaReadinessEvidencePacket(
      options.admin,
      idempotencyKey,
      probeEvidence(options),
      'beta-platform-supabase-probe-transport',
    )
    const samePacket = first.packet.id === second.packet.id
    return {
      ok: samePacket && second.replayed,
      evidence: [
        `Persistent evidence replay returned same packet=${samePacket}.`,
        `Second write replayed=${second.replayed}.`,
      ],
      nextAction: samePacket && second.replayed
        ? 'No action; deployed evidence idempotent replay passed.'
        : 'Fix persistent beta readiness idempotency before recording platform evidence.',
    }
  } catch (error) {
    return {
      ok: false,
      evidence: [`Persistent evidence replay probe failed: ${safeErrorSummary(error)}.`],
      nextAction: 'Fix persistent beta readiness idempotency before recording platform evidence.',
    }
  }
}

async function verifyWalletSettlementRpc(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  if (!options.allowPersistentProbeWrites) {
    return {
      ok: false,
      evidence: ['Wallet settlement probe was not explicitly allowed for this request.'],
      nextAction: 'Re-run with allowPersistentProbeWrites=true and a staging fixture toolCostEventId after billing-owner approval.',
    }
  }
  if (!options.walletSettlementProbeToolCostEventId) {
    return {
      ok: false,
      evidence: ['No staging fixture tool-cost event ID was provided for wallet settlement verification.'],
      nextAction: 'Create or select an approved staging fixture tool_cost_events row, then pass walletSettlementProbeToolCostEventId.',
    }
  }
  if (!options.admin) {
    return missingAdmin('Configure backend service-role Supabase runtime before verifying wallet settlement.')
  }

  try {
    const result = await options.admin.rpc('settle_tool_cost_event', {
      p_idempotency_key: probeIdempotencyKey(options, 'wallet-settlement'),
      p_tool_cost_event_id: options.walletSettlementProbeToolCostEventId,
      p_settlement_type: 'spend',
    }) as SupabaseProbeResult
    if (result.error) {
      return failedFromSupabase(
        result.error,
        'Fix deployed settle_tool_cost_event RPC or staging fixture event before recording platform evidence.',
      )
    }
    return {
      ok: Boolean(result.data),
      evidence: [
        `Wallet settlement RPC returned a settlement row=${Boolean(result.data)} for the approved staging fixture event.`,
        'Stripe was not called by this RPC probe.',
      ],
      nextAction: result.data
        ? 'No action; deployed wallet settlement RPC probe passed.'
        : 'Fix deployed settle_tool_cost_event RPC return shape before recording platform evidence.',
    }
  } catch (error) {
    return {
      ok: false,
      evidence: [`Wallet settlement RPC probe failed: ${safeErrorSummary(error)}.`],
      nextAction: 'Fix deployed wallet settlement RPC before recording platform evidence.',
    }
  }
}

async function attestedProbe(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
  id: BetaPlatformSupabaseAttestedProbeId,
  nextAction: string,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  const attestation = options.attestations?.[id]
  if (!attestation) {
    return {
      ok: false,
      evidence: [`No deployed attestation was supplied for ${id}.`],
      nextAction,
    }
  }
  return attestation
}

function probeEvidence(options: BetaPlatformSupabaseDeployedProbeTransportOptions): BetaReadinessEvidencePacketInput {
  return {
    workspaceId: options.workspaceId,
    projectId: options.projectId,
  }
}

function probeIdempotencyKey(
  options: BetaPlatformSupabaseDeployedProbeTransportOptions,
  suffix: string,
): string {
  return `${options.idempotencyKey}:platform-supabase-probe:${suffix}`
}

function missingAdmin(nextAction: string): BetaPlatformDeployedEvidenceObservation {
  return {
    ok: false,
    evidence: ['Supabase service-role admin client is unavailable; no deployed backend probe ran.'],
    nextAction,
  }
}

function failedFromSupabase(
  error: { code?: string; message?: string; hint?: string },
  nextAction: string,
): BetaPlatformDeployedEvidenceObservation {
  return {
    ok: false,
    evidence: [`Supabase probe failed with code ${error.code ?? 'unknown'} and sanitized message: ${safeErrorSummary(error)}.`],
    nextAction,
  }
}

function safeErrorSummary(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown; message?: unknown }
    if (typeof maybeError.code === 'string' && maybeError.code.trim()) {
      return `code ${maybeError.code}`
    }
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return 'operation failed'
    }
  }
  return 'operation failed'
}
