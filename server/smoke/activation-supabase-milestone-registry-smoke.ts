import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildPhase51BMilestoneBundle,
  buildSupabaseMilestoneBackfillPlan,
  buildSupabaseMilestoneRegistryCommandPlan,
  buildSupabaseMilestoneRegistryIamPlan,
  buildSupabaseMilestoneRegistryReport,
  buildSupabaseMilestoneSchemaMetadata,
  supabaseMilestoneDisabledFeatureGates,
  supabaseMilestoneRegistryConfig,
  supabaseMilestoneRegistryRequiredDocs,
  supabaseMilestoneRegistryRequiredScripts,
  supabaseMilestoneRegistrySafetyFlags,
  supabaseMilestoneRegistryTableNames,
  validateSupabaseMilestoneBundle,
  validateSupabaseMilestoneMigrationApplyEnv,
} from '../activation/supabase-milestone-registry'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string> }
const schema = buildSupabaseMilestoneSchemaMetadata()
const commandPlan = buildSupabaseMilestoneRegistryCommandPlan()
const iamPlan = buildSupabaseMilestoneRegistryIamPlan()
const backfillPlan = buildSupabaseMilestoneBackfillPlan()
const report = buildSupabaseMilestoneRegistryReport()

assert.equal(supabaseMilestoneRegistryConfig.phase, '51B')
assert.equal(supabaseMilestoneRegistryConfig.mode, 'supabase_activation_milestone_registry')
assert.equal(supabaseMilestoneRegistryConfig.baseBranch, 'codex/rp-activation-51a-supabase-data-plane-audit')
assert.deepEqual(schema.tables.map((table) => table.tableName), supabaseMilestoneRegistryTableNames)
assert.equal(schema.rlsEnabledRequired, true)
assert.equal(schema.serviceRoleOnlyRequired, true)
assert.equal(schema.destructiveChangesAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.productionReadyAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.externalBetaAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.broadMediaAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.publicArtifactAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.signedUrlSourceOfTruthAllowed, false)
assert.equal(supabaseMilestoneRegistrySafetyFlags.rawPromptExecutionAllowed, false)

for (const script of supabaseMilestoneRegistryRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const doc of supabaseMilestoneRegistryRequiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}
assert.equal(packageJson.dependencies['@supabase/supabase-js'] !== undefined, true)

const safeBundle = buildPhase51BMilestoneBundle({
  runId: 'phase51b-smoke',
  status: 'planned',
  qaStatus: 'warning',
  readinessStatus: 'smoke_static_validation',
})
assert.equal(validateSupabaseMilestoneBundle(safeBundle).ok, true)

const publicArtifactBundle = {
  ...safeBundle,
  artifacts: [{ ...safeBundle.artifacts[0], gcsUri: 'https://example.com/public-report.json' }],
}
assert.equal(validateSupabaseMilestoneBundle(publicArtifactBundle).ok, false)

const signedUrlBundle = {
  ...safeBundle,
  artifacts: [{ ...safeBundle.artifacts[0], signedUrlSourceOfTruth: true as unknown as false }],
}
assert.equal(validateSupabaseMilestoneBundle(signedUrlBundle).ok, false)

const secretBundle = {
  ...safeBundle,
  summary: 'contains secret=redacted-test-value',
}
assert.equal(validateSupabaseMilestoneBundle(secretBundle).ok, false)

const unlockedBundle = {
  ...safeBundle,
  featureGateUpdates: [{ ...safeBundle.featureGateUpdates[0], enabled: true as unknown as false }],
}
assert.equal(validateSupabaseMilestoneBundle(unlockedBundle).ok, false)

assert.equal(validateSupabaseMilestoneMigrationApplyEnv({ dbUrlResolved: false }).ok, false)
assert.equal(backfillPlan.phase51BBackfillExecution, false)
for (const phaseId of ['45F', '49P', '49N', '50F', '50G', '51A', '52A']) {
  assert.equal(backfillPlan.candidates.some((candidate) => candidate.phaseId === phaseId), true, `Missing backfill candidate ${phaseId}`)
}
for (const gate of supabaseMilestoneDisabledFeatureGates) {
  assert.equal(safeBundle.featureGateUpdates.some((entry) => entry.gateKey === gate && entry.enabled === false), true, `Missing disabled feature gate ${gate}`)
}
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.some((item) => item.includes('Supabase lifecycle commands')), true)
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.databasePlan.ddlThroughSupabaseRestAllowed, false)
assert.equal(report.reportId, 'activation-phase-51b-supabase-milestone-registry')
assert.equal(report.phase51CReadiness, 'blocked')
assert.equal(report.writeVerification.publicArtifactRejected, true)
assert.equal(report.writeVerification.signedUrlRejected, true)
assert.equal(report.writeVerification.secretLookingValueRejected, true)
assert.equal(report.safetyFlags.productionReadyAllowed, false)
assert.equal(report.safetyFlags.externalBetaAllowed, false)
assert.equal(report.safetyFlags.broadMediaAllowed, false)

console.log('Phase 51B Supabase milestone registry smoke passed.')
