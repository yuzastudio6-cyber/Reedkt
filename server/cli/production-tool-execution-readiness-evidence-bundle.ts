import {
  runProductionBillingEvidenceCollectorFromEnv,
  type ProductionBillingEvidenceCollectorEnv,
  type ProductionBillingEvidenceCollectorFetch,
} from './production-billing-evidence-collector'
import {
  runProductionFinalOwnerSignoffEvidenceCollectorFromEnv,
  type ProductionFinalOwnerSignoffEvidenceCollectorEnv,
} from './production-final-owner-signoff-evidence-collector'
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
  sections: ProductionToolExecutionReadinessEvidenceBundleSection[]
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
  label: string
  ready: boolean
  mode: 'dry_run'
  blockers: string[]
  warnings: string[]
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
  ]

  return {
    ok: sections.every((section) => section.ready),
    mode: 'dry_run',
    readyForAllUpRecord: allUp.readyForRecord,
    backendCallsAttempted: false,
    sections,
    recommendedSequence: recommendedSequence(),
    warnings: [
      'This bundle is dry-run only and forces all record confirmations off before invoking collectors.',
      'It does not call backend routes, Supabase, Stripe, workers, tools, media processors, deployments, or production.',
      'Use the focused collectors to collect slice evidence, then use prod:readiness:tool-execution-evidence-collector for the final authenticated all-up record/readback.',
    ],
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
    '',
    'Sections:',
  ]
  for (const section of result.sections) {
    lines.push(`- ${section.id}: ready=${section.ready}; blockers=${section.blockers.length}`)
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
