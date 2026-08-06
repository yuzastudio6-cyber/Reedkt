import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  adaptActivationReportToMilestoneInput,
  buildActivationMilestoneBundle,
  buildFuturePhaseSyncContract,
  buildPhase51DSelfSyncInput,
  buildSupabaseMilestoneSyncCommandPlan,
  buildSupabaseMilestoneSyncReport,
  createActivationLaunchPermissions,
  defaultActivationLaunchPermissions,
  enforceActivationMilestoneSyncPolicy,
  futurePhaseSupabaseSyncPrSummary,
  supabaseMilestoneSyncArtifactPrefix,
  supabaseMilestoneSyncSafetyFlags,
} from '../activation/supabase-milestone-sync'

const requiredScripts = [
  'activation:supabase-milestone-sync',
  'activation:supabase-milestone-sync:report',
  'activation:supabase-milestone-sync:iam-plan',
  'smoke:activation-supabase-milestone-sync',
]
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
for (const script of requiredScripts) assert.ok(packageJson.scripts[script], `${script} missing`)

const input = buildPhase51DSelfSyncInput({ runId: 'phase51d-smoke', artifactPrefix: supabaseMilestoneSyncArtifactPrefix('phase51d-smoke') })
for (const field of ['phaseId', 'phaseName', 'runId', 'status', 'track', 'subsystem', 'branch', 'baseBranch', 'qaStatus', 'readinessStatus', 'artifacts', 'qaGates', 'readinessSnapshots', 'toolCapabilities', 'featureGateUpdates', 'summary', 'blockers', 'warnings', 'supabaseSyncPolicy'] as const) {
  assert.notEqual(input[field], undefined, `${field} missing from sync contract`)
}
const adapted = adaptActivationReportToMilestoneInput({ directInput: input })
assert.equal(adapted.input.runId, 'phase51d-smoke')

const bundle = buildActivationMilestoneBundle(input)
assert.equal(bundle.featureGateUpdates.every((gate) => !gate.enabled && !gate.productionAllowed && !gate.externalBetaAllowed && !gate.broadMediaAllowed), true)
assert.equal(bundle.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://') && artifact.signedUrlSourceOfTruth === false), true)

const safe = enforceActivationMilestoneSyncPolicy({ syncInput: input, bundle })
assert.equal(safe.ok, true)
const secretInput = { ...input, summary: 'postgres://secret.example.test/password=bad' }
assert.equal(enforceActivationMilestoneSyncPolicy({ syncInput: secretInput, bundle: buildActivationMilestoneBundle(secretInput) }).ok, false)
const publicArtifact = { ...input, artifacts: [{ ...input.artifacts[0], gcsUri: 'https://example.test/public.json' }] }
assert.equal(enforceActivationMilestoneSyncPolicy({ syncInput: publicArtifact, bundle: buildActivationMilestoneBundle(publicArtifact) }).ok, false)
const signedArtifact = { ...input, artifacts: [{ ...input.artifacts[0], signedUrlSourceOfTruth: true as false }] }
assert.equal(enforceActivationMilestoneSyncPolicy({ syncInput: signedArtifact, bundle: buildActivationMilestoneBundle(signedArtifact) }).ok, false)

const commandPlan = buildSupabaseMilestoneSyncCommandPlan()
assert.equal(commandPlan.applyMigrations, false)
assert.equal(commandPlan.historicalBackfill, false)
assert.equal(supabaseMilestoneSyncSafetyFlags.productionReadyAllowed, false)
assert.equal(supabaseMilestoneSyncSafetyFlags.externalBetaAllowed, false)
assert.equal(supabaseMilestoneSyncSafetyFlags.broadMediaAllowed, false)
assert.equal(supabaseMilestoneSyncSafetyFlags.externalBetaAllowed, defaultActivationLaunchPermissions.externalBetaAllowed)
assert.equal(createActivationLaunchPermissions({
  phaseQaPassed: true,
  phaseReadinessReady: true,
  privateArtifactsOnly: true,
  publicAccessBlocked: true,
  broadMediaBlocked: true,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  approvedPlanSnapshotGatePresent: true,
  creditEstimateGatePresent: true,
  creditReservationGatePresent: true,
  idempotencyGatePresent: true,
  rawPromptStorageBlocked: true,
  secretScrubbingEnabled: true,
  signedUrlSourceTruthBlocked: true,
  licenseModelWeightReviewApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  privateMediaApproval: true,
  artifactPrivacyEvidence: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  legalApproval: true,
  checklist: [],
}).paidProductionAllowed, true)
assert.ok(futurePhaseSupabaseSyncPrSummary.includes('Supabase milestone sync:'))
assert.ok(buildFuturePhaseSyncContract().prSummaryTemplate[0].includes('Supabase milestone sync'))
const report = buildSupabaseMilestoneSyncReport()
assert.equal(report.phase, '51D')
assert.equal(report.phase52AReadiness === 'ready_for_shared_agent_and_tool_ownership_architecture' || report.phase52AReadiness === 'blocked', true)
assert.equal(existsSync('docs/activation-phase-51d-supabase-milestone-sync-results.md'), true)
console.log('Phase 51D Supabase milestone sync smoke passed.')
