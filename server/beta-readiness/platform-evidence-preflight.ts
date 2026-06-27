import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ServiceContext } from '../types'
import { buildToolCostOwnerCoverageSummary, buildToolCostOwnerCoverageMatrix } from '../tool-cost-metering'

export type BetaPlatformEvidencePreflightStatus = 'passed' | 'blocked' | 'manual_required'

export interface BetaPlatformEvidencePreflightCheck {
  id: string
  label: string
  status: BetaPlatformEvidencePreflightStatus
  proof: string
  nextAction: string
}

export interface BetaPlatformEvidencePreflightReport {
  reportId: string
  checkedAt: string
  environment: 'local_preflight'
  wouldClearPlatformBlocker: boolean
  productionBillingPersistence: string
  checks: BetaPlatformEvidencePreflightCheck[]
  missingEvidence: string[]
  notes: string[]
}

export function buildBetaPlatformEvidencePreflight(context: ServiceContext): BetaPlatformEvidencePreflightReport {
  const checkedAt = new Date().toISOString()
  const productionBillingPersistence = buildToolCostOwnerCoverageSummary(buildToolCostOwnerCoverageMatrix()).productionBillingPersistence
  const checks: BetaPlatformEvidencePreflightCheck[] = [
    migrationFileCheck(
      'tool_cost_events_migration_source_present',
      'tool_cost_events migration source is present',
      'supabase/migrations/202606270001_tool_cost_metering_events.sql',
      ['create table if not exists public.tool_cost_events', 'idempotency_key', 'tool_cost_events_select_workspace_member'],
      'Deploy and verify this migration in staging or production.',
    ),
    migrationFileCheck(
      'beta_readiness_evidence_migration_source_present',
      'beta readiness evidence migration source is present',
      'supabase/migrations/202606270002_beta_readiness_evidence_packets.sql',
      ['create table if not exists public.beta_readiness_evidence_packets', 'idempotency_key', 'idx_beta_readiness_evidence_packets_workspace_idempotency', 'backend/service-role only'],
      'Deploy and verify this migration in staging or production.',
    ),
    migrationFileCheck(
      'tool_cost_wallet_settlement_rpc_source_present',
      'tool cost wallet settlement RPC source is present',
      'supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql',
      ['create table if not exists public.tool_cost_wallet_settlements', 'create or replace function public.settle_tool_cost_event', 'credit_ledger_entries', 'service_fee_included', 'stripe_call_attempted'],
      'Deploy and verify transactional wallet spend/release/refund settlement in staging or production.',
    ),
    sourceFileCheck(
      'tool_cost_wallet_settlement_rpc_sql_smoke_present',
      'tool cost wallet settlement RPC local SQL smoke is present',
      'server/smoke/tool-cost-wallet-settlement-rpc-sql-smoke.ts',
      ['settle_tool_cost_event', 'credit_ledger_entries', 'service_fee_included', 'stripe_call_attempted', 'relrowsecurity'],
      'Run the SQL smoke against a disposable local Postgres database, then repeat equivalent checks against staging Supabase.',
    ),
    sourceFileCheck(
      'beta_platform_rls_readback_sql_smoke_present',
      'beta platform RLS readback local SQL smoke is present',
      'server/smoke/beta-platform-rls-readback-sql-smoke.ts',
      ['tool_cost_events', 'tool_cost_wallet_settlements', 'beta_readiness_evidence_packets', 'set role authenticated', 'authenticatedInsertDenied'],
      'Run the SQL smoke against a disposable local Postgres database, then repeat equivalent authenticated readback checks against staging Supabase.',
    ),
    sourceFileCheck(
      'backend_evidence_routes_present',
      'Backend beta readiness evidence routes are present',
      'server/routes/beta-readiness-routes.ts',
      ['/v1/beta-readiness/evidence', '/v1/beta-readiness/evidence/core-real-check', '/v1/beta-readiness/platform-billing-qa'],
      'Exercise the routes against staging with authenticated users and service-role persistence.',
    ),
    sourceFileCheck(
      'beta_platform_monitoring_catalog_present',
      'Beta platform monitoring catalog entries are present',
      'server/smoke/beta-platform-monitoring-catalog-smoke.ts',
      ['tool_cost_event_write_count', 'tool_cost_wallet_settlement_failure', 'beta_platform_billing_qa_missing_evidence_count', 'stripe_call_attempted_from_tool_cost_surface'],
      'Deploy and verify the corresponding monitoring dashboards and alerts in staging or production.',
    ),
    sourceFileCheck(
      'tool_cost_persistent_store_present',
      'Persistent tool cost event store source is present',
      'server/tool-cost-metering/tool-cost-persistent-store.ts',
      ['recordPersistentToolCostEvent', 'buildPersistentToolCostSummary', 'tool_cost_events'],
      'Verify service-role inserts and authenticated member summaries against deployed Supabase.',
    ),
    envCheck(
      'service_role_runtime_configured',
      'Service-role runtime is configured',
      Boolean(context.clients.admin && !context.env.mockOnly),
      context.clients.admin && !context.env.mockOnly
        ? 'Supabase admin client is available and runtime is not mock-only.'
        : 'Supabase admin client is unavailable or runtime is mock-only.',
      'Configure staging/production Supabase service-role runtime and verify writes without exposing secrets.',
    ),
    blockedCheck(
      'rls_member_read_path_verified',
      'RLS member read path is verified',
      'Local SQL smoke can prove disposable RLS behavior, but deployed authenticated member reads are not verified here.',
      'Run authenticated member readback in staging or production after applying the migrations.',
    ),
    blockedCheck(
      'wallet_settlement_verified',
      'Wallet settlement is verified',
      'Tool cost events are recorded separately from wallet spend/release/refund settlement.',
      'Implement and verify transactional wallet settlement for approved tool events.',
    ),
    blockedCheck(
      'stripe_boundary_verified',
      'Stripe boundary is verified',
      'Stripe remains disabled in this backend skeleton.',
      'Verify Stripe remains backend-only and cannot be called by tool event recording; later add billing owner approval.',
    ),
    blockedCheck(
      'monitoring_verified',
      'Monitoring is verified',
      'Tool-cost billing monitoring templates are source-verified locally, but no deployed alerts or dashboards are verified here.',
      'Deploy and verify monitoring/alerting for tool cost event writes, wallet settlement, RLS readback, billing QA, and Stripe boundary anomalies.',
    ),
    blockedCheck(
      'billing_qa_verified',
      'Billing QA is verified',
      'Local source preflight does not prove staging billing QA.',
      'Run billing QA in staging using idempotent event write/replay, summary readback, and settlement test cases.',
    ),
    blockedCheck(
      'human_approvals_present',
      'Deployment/security/storage/legal/support approvals are present',
      'Human approvals are not derivable from local source files.',
      'Record named owner approvals through the beta readiness evidence route after review.',
    ),
  ]
  const missingEvidence = checks
    .filter((check) => check.status !== 'passed')
    .map((check) => `${check.label}: ${check.nextAction}`)

  return {
    reportId: `beta-platform-evidence-preflight-${checkedAt}`,
    checkedAt,
    environment: 'local_preflight',
    wouldClearPlatformBlocker: false,
    productionBillingPersistence,
    checks,
    missingEvidence,
    notes: [
      'This is a read-only local source/runtime preflight for the beta platform blocker.',
      'It does not write evidence, run migrations, call Supabase, call Stripe, settle wallets, enable beta, or mark production ready.',
      'Only a complete staging or production platform evidence packet can clear the shared platform blocker.',
    ],
  }
}

function migrationFileCheck(
  id: string,
  label: string,
  path: string,
  requiredFragments: string[],
  nextAction: string,
): BetaPlatformEvidencePreflightCheck {
  return sourceFileCheck(id, label, path, requiredFragments, nextAction)
}

function sourceFileCheck(
  id: string,
  label: string,
  path: string,
  requiredFragments: string[],
  nextAction: string,
): BetaPlatformEvidencePreflightCheck {
  const absolutePath = join(process.cwd(), path)
  if (!existsSync(absolutePath)) {
    return {
      id,
      label,
      status: 'blocked',
      proof: `${path} is missing.`,
      nextAction,
    }
  }

  const text = readFileSync(absolutePath, 'utf8')
  const missingFragments = requiredFragments.filter((fragment) => !text.includes(fragment))
  if (missingFragments.length > 0) {
    return {
      id,
      label,
      status: 'blocked',
      proof: `${path} exists but is missing expected fragments: ${missingFragments.join(', ')}.`,
      nextAction,
    }
  }

  return {
    id,
    label,
    status: 'passed',
    proof: `${path} exists with required source markers.`,
    nextAction,
  }
}

function envCheck(
  id: string,
  label: string,
  passed: boolean,
  proof: string,
  nextAction: string,
): BetaPlatformEvidencePreflightCheck {
  return {
    id,
    label,
    status: passed ? 'passed' : 'blocked',
    proof,
    nextAction,
  }
}

function blockedCheck(
  id: string,
  label: string,
  proof: string,
  nextAction: string,
): BetaPlatformEvidencePreflightCheck {
  return {
    id,
    label,
    status: 'manual_required',
    proof,
    nextAction,
  }
}
