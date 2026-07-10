import {
  runProductionBillingEvidenceCollectorFromEnv,
  type ProductionBillingEvidenceCollectorEnv,
  type ProductionBillingEvidenceCollectorFetch,
} from './production-billing-evidence-collector'
import {
  runProductionFinalOwnerSignoffEvidenceCollectorFromEnv,
  type ProductionFinalOwnerSignoffEvidenceCollectorEnv,
} from './production-final-owner-signoff-evidence-collector'
import { buildProductionRealWorkerHandlerReadinessReport } from './production-real-worker-handler-readiness'
import {
  runProductionOpsObservabilityEvidenceCollectorFromEnv,
  type ProductionOpsObservabilityEvidenceCollectorEnv,
} from './production-ops-observability-evidence-collector'
import {
  runProductionStripeBoundaryEvidenceCollectorFromEnv,
  type ProductionStripeBoundaryEvidenceCollectorEnv,
} from './production-stripe-boundary-evidence-collector'
import {
  runProductionSupabasePersistenceEvidenceCollectorFromEnv,
  type ProductionSupabasePersistenceEvidenceCollectorEnv,
} from './production-supabase-persistence-evidence-collector'
import {
  runProductionToolExecutionReadinessEvidenceCollectorFromEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorFetch,
} from './production-tool-execution-readiness-evidence-collector'
import {
  runProductionWalletLifecycleEvidenceCollectorFromEnv,
  type ProductionWalletLifecycleEvidenceCollectorEnv,
} from './production-wallet-lifecycle-evidence-collector'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

export type ProductionToolExecutionReadinessEvidenceBundleEnv =
  ProductionToolExecutionReadinessEvidenceCollectorEnv &
  ProductionBillingEvidenceCollectorEnv &
  ProductionSupabasePersistenceEvidenceCollectorEnv &
  ProductionWalletLifecycleEvidenceCollectorEnv &
  ProductionStripeBoundaryEvidenceCollectorEnv &
  ProductionOpsObservabilityEvidenceCollectorEnv &
  ProductionFinalOwnerSignoffEvidenceCollectorEnv

export interface ProductionToolExecutionReadinessEvidenceBundleResult {
  ok: boolean
  mode: 'dry_run'
  readyForAllUpRecord: boolean
  backendCallsAttempted: false
  summary: ProductionToolExecutionReadinessEvidenceBundleSummary
  sections: ProductionToolExecutionReadinessEvidenceBundleSection[]
  milestone10Checklist: ProductionToolExecutionMilestone10ChecklistItem[]
  recommendedSequence: Array<{
    step: number
    command: string
    purpose: string
    recordConfirmationEnv?: string
  }>
  warnings: string[]
}

export interface ProductionToolExecutionReadinessEvidenceBundleSection {
  id:
    | 'supabase_persistence'
    | 'billing_route'
    | 'wallet_lifecycle'
    | 'stripe_boundary'
    | 'ops_observability'
    | 'final_owner_signoff'
    | 'all_up_preflight'
    | 'real_worker_handlers'
  label: string
  ready: boolean
  mode: 'dry_run'
  blockers: string[]
  warnings: string[]
}

export interface ProductionToolExecutionReadinessEvidenceBundleSummary {
  productionToolCount: number
  productReadyLocalOssCount: 0
  readySectionCount: number
  blockedSectionCount: number
  reviewedRealBackendAdapterCount: number
  blockedPlaceholderAdapterCount: number
  readyForScopedReviewedToolExecution: boolean
  allProductionHandlerCoverageReady: boolean
  paidProductionEvidenceReady: boolean
}

export interface ProductionToolExecutionMilestone10ChecklistItem {
  id:
    | 'supabase_production_persistence'
    | 'tool_cost_ledger_writes'
    | 'wallet_reserve_spend_release_refund'
    | 'stripe_boundary_confirmation'
    | 'observability_alerts'
    | 'rollback_kill_switches'
    | 'rate_concurrency_limits'
    | 'final_owner_signoff'
    | 'all_up_evidence_record_readback'
    | 'scoped_real_backend_handlers'
  label: string
  status: 'ready' | 'blocked'
  sourceSectionIds: ProductionToolExecutionReadinessEvidenceBundleSection['id'][]
  blockerCount: number
  nextAction: string
}

export async function buildProductionToolExecutionReadinessEvidenceBundleFromEnv(
  env: ProductionToolExecutionReadinessEvidenceBundleEnv,
): Promise<ProductionToolExecutionReadinessEvidenceBundleResult> {
  const safeEnv = disableRecordConfirmations(env)
  const supabase = await runProductionSupabasePersistenceEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const billing = await runProductionBillingEvidenceCollectorFromEnv(safeEnv, disabledBillingFetch)
  const wallet = await runProductionWalletLifecycleEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const stripe = await runProductionStripeBoundaryEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const ops = await runProductionOpsObservabilityEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const owners = await runProductionFinalOwnerSignoffEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const allUp = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv(safeEnv, disabledReadinessFetch)
  const realWorkerHandlers = buildProductionRealWorkerHandlerReadinessReport()

  const sections: ProductionToolExecutionReadinessEvidenceBundleSection[] = [
    {
      id: 'supabase_persistence',
      label: 'Supabase production persistence',
      ready: supabase.readyForSupabasePersistenceEvidence,
      mode: 'dry_run',
      blockers: supabase.supabasePersistence.blockers,
      warnings: supabase.warnings,
    },
    {
      id: 'billing_route',
      label: 'Tool cost event, settlement, and summary route plan',
      ready: billing.readyForRouteEvidence,
      mode: 'dry_run',
      blockers: billing.readyForRouteEvidence ? [] : ['billing route evidence collector is not ready.'],
      warnings: billing.warnings,
    },
    {
      id: 'wallet_lifecycle',
      label: 'Wallet reserve/spend/release/refund lifecycle',
      ready: wallet.readyForWalletLifecycleEvidence,
      mode: 'dry_run',
      blockers: wallet.walletLifecycle.blockers,
      warnings: wallet.warnings,
    },
    {
      id: 'stripe_boundary',
      label: 'Stripe boundary and service-fee separation',
      ready: stripe.readyForStripeBoundaryEvidence,
      mode: 'dry_run',
      blockers: stripe.stripeBoundary.blockers,
      warnings: stripe.warnings,
    },
    {
      id: 'ops_observability',
      label: 'Observability, rollback, kill-switch, rate-limit, and concurrency controls',
      ready: ops.readyForOpsObservabilityEvidence,
      mode: 'dry_run',
      blockers: [
        ...ops.evidence.observability.blockers.map((blocker) => `observability: ${blocker}`),
        ...ops.evidence.operationsControls.blockers.map((blocker) => `operations: ${blocker}`),
        ...ops.catalogCoverage.costControlBlockers.map((blocker) => `cost controls: ${blocker}`),
      ],
      warnings: ops.warnings,
    },
    {
      id: 'final_owner_signoff',
      label: 'Final owner signoff',
      ready: owners.readyForFinalOwnerSignoffEvidence,
      mode: 'dry_run',
      blockers: owners.signoff.blockers,
      warnings: owners.warnings,
    },
    {
      id: 'all_up_preflight',
      label: 'All-up production readiness evidence preflight',
      ready: allUp.readyForRecord,
      mode: 'dry_run',
      blockers: [
        ...allUp.preflight.missingConfiguration,
        ...allUp.preflight.missingEvidence,
        ...allUp.preflight.secretLikeInputPaths.map((path) => `secret-like input: ${path}`),
      ],
      warnings: allUp.warnings,
    },
    {
      id: 'real_worker_handlers',
      label: 'Real production worker handlers',
      ready: realWorkerHandlers.readyForRealToolExecution,
      mode: 'dry_run',
      blockers: realWorkerHandlers.blockers,
      warnings: realWorkerHandlers.warnings,
    },
  ]
  const summary = buildSummary(sections, realWorkerHandlers)
  const milestone10Checklist = buildMilestone10Checklist(sections)

  return {
    ok: sections.every((section) => section.ready),
    mode: 'dry_run',
    readyForAllUpRecord: allUp.readyForRecord,
    backendCallsAttempted: false,
    summary,
    sections,
    milestone10Checklist,
    recommendedSequence: recommendedSequence(),
    warnings: [
      'This bundle is dry-run only and forces all record confirmations off before invoking collectors.',
      'It does not call backend routes, Supabase, Stripe, workers, tools, media processors, deployments, or production.',
      'All-up production evidence must still be paired with the real-worker handler readiness report; production dispatch is limited to reviewed real backend adapters and dry-run placeholder adapters remain blocked for production_ready.',
      'Use the focused collectors to collect slice evidence, then use prod:readiness:tool-execution-evidence-collector for the final authenticated all-up record/readback.',
    ],
  }
}

function buildSummary(
  sections: ProductionToolExecutionReadinessEvidenceBundleSection[],
  realWorkerHandlers: ReturnType<typeof buildProductionRealWorkerHandlerReadinessReport>,
): ProductionToolExecutionReadinessEvidenceBundleSummary {
  const readySectionCount = sections.filter((section) => section.ready).length
  return {
    productionToolCount: PRODUCTION_TOOL_IDS.length,
    productReadyLocalOssCount: 0,
    readySectionCount,
    blockedSectionCount: sections.length - readySectionCount,
    reviewedRealBackendAdapterCount: realWorkerHandlers.reviewedRealAdapterIds.length,
    blockedPlaceholderAdapterCount: realWorkerHandlers.blockedPlaceholderAdapterIds.length,
    readyForScopedReviewedToolExecution: realWorkerHandlers.scopedReviewedHandlerReady,
    allProductionHandlerCoverageReady: realWorkerHandlers.allProductionHandlerCoverageReady,
    paidProductionEvidenceReady: sections.every((section) => section.ready),
  }
}

function buildMilestone10Checklist(
  sections: ProductionToolExecutionReadinessEvidenceBundleSection[],
): ProductionToolExecutionMilestone10ChecklistItem[] {
  const byId = new Map(sections.map((section) => [section.id, section]))
  const section = (id: ProductionToolExecutionReadinessEvidenceBundleSection['id']) => {
    const found = byId.get(id)
    if (!found) throw new Error(`Missing production readiness evidence section ${id}.`)
    return found
  }
  const ops = section('ops_observability')

  return [
    checklistItem({
      id: 'supabase_production_persistence',
      label: 'Supabase production persistence',
      sections: [section('supabase_persistence')],
      readyAction: 'Record and retain Supabase persistence evidence with the all-up packet.',
      blockedAction: 'Collect production Supabase migration, RLS/readback, grant, advisor, backup/PITR, and storage-policy evidence.',
    }),
    checklistItem({
      id: 'tool_cost_ledger_writes',
      label: 'Tool cost ledger writes',
      sections: [section('billing_route')],
      readyAction: 'Record tool-cost event write, replay, and summary readback evidence in the all-up packet.',
      blockedAction: 'Collect durable tool-cost event write, append-only ledger, idempotent replay, and project summary readback evidence.',
    }),
    checklistItem({
      id: 'wallet_reserve_spend_release_refund',
      label: 'Wallet reserve/spend/release/refund',
      sections: [section('wallet_lifecycle')],
      readyAction: 'Record wallet lifecycle evidence with service-role-only settlement and idempotent replay proof.',
      blockedAction: 'Collect wallet reservation, spend, release, refund, settlement RPC, service-role-only, replay, and no-silent-charge evidence.',
    }),
    checklistItem({
      id: 'stripe_boundary_confirmation',
      label: 'Stripe boundary confirmation',
      sections: [section('stripe_boundary')],
      readyAction: 'Record Stripe boundary evidence and keep service fees out of tool-cost events.',
      blockedAction: 'Collect billing-owner approval, no Stripe tool-cost calls, service-fee exclusion, and webhook separation evidence.',
    }),
    checklistItem({
      id: 'observability_alerts',
      label: 'Observability and alerts',
      sections: [ops],
      readyAction: 'Record deployed dashboard, alert routing, and billing QA monitoring evidence.',
      blockedAction: 'Collect deployed dashboards, alerts, alert routing, and billing QA monitoring evidence.',
    }),
    checklistItem({
      id: 'rollback_kill_switches',
      label: 'Rollback and kill switches',
      sections: [ops],
      readyAction: 'Record rollback, kill-switch, and incident-runbook evidence.',
      blockedAction: 'Collect rollback approval, kill-switch verification, and incident-runbook approval evidence.',
    }),
    checklistItem({
      id: 'rate_concurrency_limits',
      label: 'Rate and concurrency limits',
      sections: [ops],
      readyAction: 'Record rate-limit and concurrency-limit evidence.',
      blockedAction: 'Collect workspace rate-limit, project concurrency, and worker-type concurrency evidence.',
    }),
    checklistItem({
      id: 'final_owner_signoff',
      label: 'Final owner signoff',
      sections: [section('final_owner_signoff')],
      readyAction: 'Record final deployment, security, privacy, legal, support, billing, operations, media, production, and delivery/share signoff.',
      blockedAction: 'Collect all final owner approvals, including real-user-media, paid-production, artifact privacy, and delivery/share approval.',
    }),
    checklistItem({
      id: 'all_up_evidence_record_readback',
      label: 'All-up evidence record/readback',
      sections: [section('all_up_preflight')],
      readyAction: 'Run the authenticated all-up evidence collector with idempotency and readback.',
      blockedAction: 'Resolve all all-up preflight blockers, then record and read back the production readiness evidence packet.',
    }),
    checklistItem({
      id: 'scoped_real_backend_handlers',
      label: 'Scoped reviewed real backend handlers',
      sections: [section('real_worker_handlers')],
      readyAction: 'Use only reviewed real backend adapters; keep placeholder adapters blocked from production_ready dispatch.',
      blockedAction: 'Replace placeholder/mock-only adapters or narrow production dispatch to reviewed real backend handlers.',
    }),
  ]
}

function checklistItem(input: {
  id: ProductionToolExecutionMilestone10ChecklistItem['id']
  label: string
  sections: ProductionToolExecutionReadinessEvidenceBundleSection[]
  readyAction: string
  blockedAction: string
}): ProductionToolExecutionMilestone10ChecklistItem {
  const blockerCount = input.sections.reduce((total, section) => total + section.blockers.length, 0)
  const ready = input.sections.every((section) => section.ready)
  return {
    id: input.id,
    label: input.label,
    status: ready ? 'ready' : 'blocked',
    sourceSectionIds: input.sections.map((section) => section.id),
    blockerCount,
    nextAction: ready ? input.readyAction : input.blockedAction,
  }
}

function disableRecordConfirmations(
  env: ProductionToolExecutionReadinessEvidenceBundleEnv,
): ProductionToolExecutionReadinessEvidenceBundleEnv {
  return {
    ...env,
    REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE: 'false',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'false',
  }
}

function recommendedSequence(): ProductionToolExecutionReadinessEvidenceBundleResult['recommendedSequence'] {
  return [
    {
      step: 1,
      command: 'npm run prod:readiness:supabase-persistence-evidence-collector',
      purpose: 'Verify deployed Supabase persistence, RLS/readback, grants, advisors, backup/PITR, and storage-policy evidence.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 2,
      command: 'npm run prod:readiness:billing-evidence-collector',
      purpose: 'Verify tool-cost event write/replay, wallet settlement/replay, and project summary readback through backend billing routes.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE',
    },
    {
      step: 3,
      command: 'npm run prod:readiness:wallet-lifecycle-evidence-collector',
      purpose: 'Verify wallet reservation, spend, release, refund, service-role-only settlement RPC, replay, and no silent-charge evidence.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 4,
      command: 'npm run prod:readiness:stripe-boundary-evidence-collector',
      purpose: 'Verify billing-owner Stripe boundary approval, no Stripe from tool-cost surfaces, service-fee exclusion, and webhook separation.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 5,
      command: 'npm run prod:readiness:ops-observability-evidence-collector',
      purpose: 'Verify dashboards, alerts, billing QA monitoring, rollback, kill switches, rate limits, concurrency limits, and runbook evidence.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 6,
      command: 'npm run prod:readiness:final-owner-signoff-evidence-collector',
      purpose: 'Verify final deployment, security, privacy, legal, support, billing, operations, real-user-media, paid-production, and delivery/share owner signoff.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 7,
      command: 'npm run prod:readiness:tool-execution-gate-preflight',
      purpose: 'Evaluate the full non-secret evidence packet locally before any backend record/readback call.',
    },
    {
      step: 8,
      command: 'npm run prod:readiness:tool-execution-evidence-collector',
      purpose: 'Record and read back the passing all-up production readiness packet through the authenticated backend route.',
      recordConfirmationEnv: 'REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE',
    },
    {
      step: 9,
      command: 'npm run prod:readiness:real-worker-handler-readiness',
      purpose: 'Verify production gateway adapters and worker routes no longer resolve to mock-only placeholder handlers.',
    },
    {
      step: 10,
      command: 'npm run prod:readiness:tool-execution-gate',
      purpose: 'Render the final local paid-production readiness gate report from the same evidence inputs.',
    },
  ]
}

const disabledReadinessFetch: ProductionToolExecutionReadinessEvidenceCollectorFetch = async () => {
  throw new Error('Production evidence bundle must not call backend readiness routes.')
}

const disabledBillingFetch: ProductionBillingEvidenceCollectorFetch = async () => {
  throw new Error('Production evidence bundle must not call backend billing routes.')
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

function renderText(result: ProductionToolExecutionReadinessEvidenceBundleResult): string {
  const lines = [
    `ok=${result.ok}`,
    `mode=${result.mode}`,
    `readyForAllUpRecord=${result.readyForAllUpRecord}`,
    `backendCallsAttempted=${result.backendCallsAttempted}`,
    `productionToolCount=${result.summary.productionToolCount}`,
    `reviewedRealBackendAdapterCount=${result.summary.reviewedRealBackendAdapterCount}`,
    `readyForScopedReviewedToolExecution=${result.summary.readyForScopedReviewedToolExecution}`,
    `paidProductionEvidenceReady=${result.summary.paidProductionEvidenceReady}`,
    '',
    'Sections:',
  ]
  for (const section of result.sections) {
    lines.push(`- ${section.id}: ready=${section.ready}; blockers=${section.blockers.length}`)
  }
  lines.push('', 'Milestone 10 checklist:')
  for (const item of result.milestone10Checklist) {
    lines.push(`- ${item.id}: status=${item.status}; blockers=${item.blockerCount}; next=${item.nextAction}`)
  }
  lines.push('', 'Recommended sequence:')
  for (const item of result.recommendedSequence) {
    lines.push(`${item.step}. ${item.command}`)
  }
  return lines.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await buildProductionToolExecutionReadinessEvidenceBundleFromEnv(process.env)
    if (argValue('output') === 'json') {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(renderText(result))
    }
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
