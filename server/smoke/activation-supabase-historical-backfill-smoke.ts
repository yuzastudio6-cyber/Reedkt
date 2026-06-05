import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildSupabaseHistoricalBackfillCommandPlan,
  buildSupabaseHistoricalBackfillIamPlan,
  buildSupabaseHistoricalBackfillPlan,
  buildSupabaseHistoricalBackfillReport,
  buildSupabaseHistoricalBundleRecords,
  resolveSupabaseHistoricalEvidence,
  supabaseHistoricalBackfillCanonicalPhases,
  supabaseHistoricalBackfillConfig,
  supabaseHistoricalBackfillDisabledFeatureGates,
  supabaseHistoricalBackfillRequiredDocs,
  supabaseHistoricalBackfillRequiredScripts,
  supabaseHistoricalBackfillSafetyFlags,
} from '../activation/supabase-historical-backfill'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const p0 = supabaseHistoricalBackfillCanonicalPhases.filter((phase) => phase.priority === 'P0').map((phase) => phase.phaseId)
const p1 = supabaseHistoricalBackfillCanonicalPhases.filter((phase) => phase.priority === 'P1').map((phase) => phase.phaseId)
const plan = buildSupabaseHistoricalBackfillPlan()
const evidence = resolveSupabaseHistoricalEvidence(supabaseHistoricalBackfillCanonicalPhases)
const records = buildSupabaseHistoricalBundleRecords({ phases: supabaseHistoricalBackfillCanonicalPhases, evidence })
const report = buildSupabaseHistoricalBackfillReport()
const commandPlan = buildSupabaseHistoricalBackfillCommandPlan()
const iamPlan = buildSupabaseHistoricalBackfillIamPlan()

assert.equal(supabaseHistoricalBackfillConfig.phase, '51C')
assert.equal(supabaseHistoricalBackfillConfig.mode, 'supabase_historical_activation_evidence_backfill')
assert.deepEqual(p0, ['45F', '49P', '49N', '50F', '50G', '51A', '51B'])
for (const phaseId of ['49H', '49I', '49O', '50A', '50B', '50C', '50D', '50E']) assert.equal(p1.includes(phaseId), true)
for (const script of supabaseHistoricalBackfillRequiredScripts) assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
for (const doc of supabaseHistoricalBackfillRequiredDocs) assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
assert.equal(plan.migrationsApplied, false)
assert.equal(plan.schemaMutationAllowed, false)
assert.equal(commandPlan.blockedAlways.some((item) => item.includes('migrations')), true)
assert.equal(iamPlan.databasePlan.migrationsAllowed, false)
assert.equal(supabaseHistoricalBackfillSafetyFlags.productionReadyAllowed, false)
assert.equal(supabaseHistoricalBackfillSafetyFlags.externalBetaAllowed, false)
assert.equal(supabaseHistoricalBackfillSafetyFlags.broadMediaAllowed, false)
assert.equal(supabaseHistoricalBackfillSafetyFlags.publicArtifactAllowed, false)
assert.equal(supabaseHistoricalBackfillSafetyFlags.signedUrlSourceOfTruthAllowed, false)

const p0Records = records.filter((record) => record.phase.priority === 'P0')
assert.equal(p0Records.every((record) => record.bundle && record.validation?.ok), true)
for (const record of p0Records) {
  assert.equal(record.bundle?.featureGateUpdates.every((gate) => gate.enabled === false), true)
  assert.equal(record.bundle?.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://') && artifact.signedUrlSourceOfTruth === false), true)
}
for (const gate of supabaseHistoricalBackfillDisabledFeatureGates) {
  assert.equal(p0Records.some((record) => record.bundle?.featureGateUpdates.some((entry) => entry.gateKey === gate)), true, `Missing disabled feature gate ${gate}`)
}

assert.equal(report.reportId, 'activation-phase-51c-supabase-historical-backfill')
assert.equal(report.phase51DReadiness, report.executionReport?.ok ? 'ready_for_automatic_per_phase_supabase_milestone_sync' : 'blocked')
assert.equal(report.summary.migrationsApplied, false)
assert.equal(report.summary.productionReadyAllowed, false)
assert.equal(report.summary.externalBetaAllowed, false)
assert.equal(report.summary.broadMediaAllowed, false)

console.log('Phase 51C Supabase historical backfill smoke passed.')
