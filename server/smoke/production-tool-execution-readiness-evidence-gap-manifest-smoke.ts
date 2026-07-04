import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv,
  PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_GAP_MANIFEST_VERSION,
  writeProductionToolExecutionReadinessEvidenceGapManifestFile,
} from '../cli/production-tool-execution-readiness-evidence-gap-manifest'

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-production-evidence-gap-manifest-'))

const empty = await buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv({}, {
  generatedAt: new Date('2026-07-04T00:00:00.000Z'),
})

assert.equal(empty.version, PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_GAP_MANIFEST_VERSION, 'manifest should expose stable version')
assert.equal(empty.ok, false, 'empty manifest should remain blocked')
assert.equal(empty.mode, 'dry_run', 'manifest should be dry-run only')
assert.equal(empty.backendCallsAttempted, false, 'manifest must not call backend routes')
assert.equal(empty.productionActivationAttempted, false, 'manifest must not activate production')
assert.equal(empty.summary.productionToolCount >= 52, true, 'manifest should include full production tool count')
assert.equal(empty.summary.reviewedRealBackendAdapterCount >= 16, true, 'manifest should include reviewed real handler coverage')
assert.equal(empty.summary.readyForScopedReviewedToolExecution, true, 'scoped reviewed handlers should be ready')
assert.equal(empty.summary.paidProductionEvidenceReady, false, 'paid production evidence should be blocked without evidence')
assert.equal(empty.groups.length, 8, 'manifest should group every bundle section')
assert.equal(empty.milestone10Checklist.length, 10, 'manifest should include Milestone 10 checklist')
assert.equal(empty.recommendedSequence.length, 10, 'manifest should include recommended sequence')
assert.ok(empty.warnings.some((item) => item.includes('does not call backend routes')), 'manifest should document no-runtime behavior')

const supabase = group(empty, 'supabase_persistence')
assert.equal(supabase.ownerLane, 'backend_platform_supabase_owner', 'Supabase group should route to backend platform owner')
assert.equal(supabase.collectorCommand, 'npm run prod:readiness:supabase-persistence-evidence-collector')
assert.equal(supabase.recordConfirmationEnv, 'REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE')
assert.ok(supabase.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED'), 'Supabase group should include migration evidence var')
assert.ok(supabase.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY'), 'Supabase group should include shared reviewer var')
assert.ok(supabase.blockerCount > 0, 'Supabase group should expose blockers without evidence')

const wallet = group(empty, 'wallet_lifecycle')
assert.equal(wallet.ownerLane, 'backend_wallet_owner')
assert.equal(wallet.collectorCommand, 'npm run prod:readiness:wallet-lifecycle-evidence-collector')
assert.ok(wallet.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED'), 'Wallet group should include refund evidence var')

const stripe = group(empty, 'stripe_boundary')
assert.equal(stripe.ownerLane, 'billing_owner')
assert.ok(stripe.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED'), 'Stripe group should include service-fee boundary var')

const ops = group(empty, 'ops_observability')
assert.equal(ops.ownerLane, 'operations_observability_owner')
assert.ok(ops.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCH_BLOCK_VERIFIED'), 'Ops group should include kill-switch negative-control var')
assert.ok(ops.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED'), 'Ops group should include observability var')

const owners = group(empty, 'final_owner_signoff')
assert.equal(owners.ownerLane, 'final_launch_owners')
assert.ok(owners.evidenceVariables.some((item) => item.name === 'REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED'), 'Owner group should include paid-production approval var')

const realHandlers = group(empty, 'real_worker_handlers')
assert.equal(realHandlers.ready, true, 'real worker handler group should be ready from source')
assert.equal(realHandlers.evidenceVariables.length, 0, 'real worker handler group should not ask operators for evidence vars')

const manifestPath = join(tempRoot, 'manifest.json')
writeProductionToolExecutionReadinessEvidenceGapManifestFile(manifestPath, empty)
const rawManifest = readFileSync(manifestPath, 'utf8')
assert.equal(rawManifest.includes('service_role_key'), false, 'manifest should not contain secret-like placeholder text')
assert.equal(rawManifest.includes('REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN'), false, 'manifest should not include backend bearer token config')
assert.equal(rawManifest.includes('REEDITPRO_PRODUCTION_READINESS_API_BASE_URL'), false, 'manifest should not include backend API config')

await assert.rejects(
  () => buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv({
    REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES: 'operator accidentally pasted service_role_key',
  }),
  /secret-like evidence input/,
  'manifest builder should reject secret-like evidence notes',
)

console.log(JSON.stringify({
  ok: true,
  version: empty.version,
  groups: empty.groups.length,
  blockedGroups: empty.groups.filter((item) => !item.ready).length,
  productionToolCount: empty.summary.productionToolCount,
  reviewedRealBackendAdapterCount: empty.summary.reviewedRealBackendAdapterCount,
  readyForScopedReviewedToolExecution: empty.summary.readyForScopedReviewedToolExecution,
}, null, 2))

rmSync(tempRoot, { force: true, recursive: true })

function group(
  manifest: Awaited<ReturnType<typeof buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv>>,
  id: string,
) {
  const found = manifest.groups.find((item) => item.id === id)
  assert.ok(found, `expected manifest group ${id}`)
  return found
}
