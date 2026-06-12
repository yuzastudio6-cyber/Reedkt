import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  adaptActivationReportToMilestoneSyncInput,
  buildPhase51DSelfSyncInput,
  buildSupabaseMilestoneBundleFromSyncInput,
  buildSupabaseMilestoneSyncCommandPlan,
  buildSupabaseMilestoneSyncIamPlan,
  buildSupabaseMilestoneSyncReport,
  futurePhaseSupabaseSyncPrTemplate,
  supabaseMilestoneSyncDisabledFeatureGates,
  validateActivationMilestoneSyncBundle,
  validateActivationMilestoneSyncInput,
} from '../activation/supabase-milestone-sync'

const input = buildPhase51DSelfSyncInput('phase51d-smoke')
assert.equal(input.phaseId, '51D')
assert.equal(input.status, 'completed')
assert.equal(input.supabaseSyncPolicy.migrationsAllowed, false)
assert.equal(input.supabaseSyncPolicy.historicalBackfillAllowed, false)
assert.equal(input.supabaseSyncPolicy.productionReadyAllowed, false)
assert.equal(input.supabaseSyncPolicy.externalBetaAllowed, false)
assert.equal(input.supabaseSyncPolicy.broadMediaAllowed, false)
assert.ok(input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://')))
assert.ok(input.artifacts.every((artifact) => artifact.signedUrlSourceOfTruth === false))

const bundle = buildSupabaseMilestoneBundleFromSyncInput(input)
assert.equal(bundle.phaseId, '51D')
assert.equal(bundle.featureGateUpdates.length, supabaseMilestoneSyncDisabledFeatureGates.length)
assert.ok(bundle.featureGateUpdates.every((gate) => gate.enabled === false))
assert.equal(validateActivationMilestoneSyncInput(input).ok, true)
assert.equal(validateActivationMilestoneSyncBundle(bundle).ok, true)

const publicArtifactInput = {
  ...input,
  artifacts: [{ ...input.artifacts[0], gcsUri: 'https://example.test/public.json' }],
}
assert.equal(validateActivationMilestoneSyncInput(publicArtifactInput).ok, false)

const signedArtifactInput = {
  ...input,
  artifacts: [{ ...input.artifacts[0], signedUrlSourceOfTruth: true as unknown as false }],
}
assert.equal(validateActivationMilestoneSyncInput(signedArtifactInput).ok, false)

const secretInput = {
  ...input,
  warnings: [`postgresql${'://'}user:password@example.test:5432/postgres`],
}
assert.equal(validateActivationMilestoneSyncInput(secretInput).ok, false)

const unlockedInput = {
  ...input,
  featureGateUpdates: [{ ...input.featureGateUpdates[0], enabled: true as false }],
}
assert.equal(validateActivationMilestoneSyncInput(unlockedInput).ok, false)

const adapted = adaptActivationReportToMilestoneSyncInput({ phase: '99Z', status: 'completed' }, 'phase99z-smoke')
assert.equal(adapted.phaseId, '99Z')
assert.equal(adapted.status, 'completed')
assert.ok(adapted.warnings.some((warning) => warning.includes('Adapter source lacked')))

const commandPlan = buildSupabaseMilestoneSyncCommandPlan()
assert.equal(commandPlan.noMigrationCommands, true)
assert.equal(commandPlan.noBackfillRerun, true)
assert.ok(commandPlan.blockedAlways.some((blocked) => blocked.includes('historical backfill')))

const iamPlan = buildSupabaseMilestoneSyncIamPlan()
assert.equal(iamPlan.defaultMutationAllowed, false)
assert.equal(iamPlan.supabasePlan.migrationsAllowed, false)
assert.equal(iamPlan.supabasePlan.historicalBackfillAllowed, false)

const report = buildSupabaseMilestoneSyncReport()
assert.equal(report.phase, '51D')
assert.equal(report.status === 'planned' || report.status === 'completed' || report.status === 'blocked' || report.status === 'partial', true)
assert.ok(report.qa.gates.some((gate) => gate.gateId === 'single_self_sync_write'))
assert.ok(report.qa.gates.some((gate) => gate.gateId === 'blocked_features'))

assert.ok(futurePhaseSupabaseSyncPrTemplate.includes('Supabase milestone sync'))

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
for (const scriptName of [
  'activation:supabase-milestone-sync',
  'activation:supabase-milestone-sync:report',
  'activation:supabase-milestone-sync:iam-plan',
  'smoke:activation-supabase-milestone-sync',
]) {
  assert.ok(packageJson.scripts[scriptName], `Missing package script ${scriptName}`)
}

console.log('Phase 51D Supabase milestone sync smoke passed.')
