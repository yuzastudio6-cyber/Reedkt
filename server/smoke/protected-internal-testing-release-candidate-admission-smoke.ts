import assert from 'node:assert/strict'

import {
  evaluateProtectedInternalTestingReleaseCandidateAdmission,
  PROTECTED_INTERNAL_TESTING_SOURCE_REF,
  readProtectedInternalTestingReleaseCandidateSnapshot,
  type ProtectedInternalTestingReleaseCandidateSnapshot,
} from '../config/protected-internal-testing-release-candidate-admission'

const root = process.cwd()
const observed = readProtectedInternalTestingReleaseCandidateSnapshot(
  root,
  PROTECTED_INTERNAL_TESTING_SOURCE_REF,
  '',
)
const cleanFixture = clone(observed)
cleanFixture.expectedSourceSha = cleanFixture.source.headSha
cleanFixture.source.statusPorcelain = ''
cleanFixture.source.appleDoublePaths = []

const report = evaluateProtectedInternalTestingReleaseCandidateAdmission(cleanFixture)
assert.equal(report.ok, true, JSON.stringify(report.blockers))
assert.equal(
  report.decision,
  'admitted_for_owner_authorized_same_sha_protected_internal_testing_activation',
)
assert.equal(report.evidenceClass, 'source_verified_same_sha_admission_only')
assert.equal(report.source.expectedRef, PROTECTED_INTERNAL_TESTING_SOURCE_REF)
assert.equal(report.source.expectedSha, cleanFixture.source.headSha)
assert.match(report.source.treeSha, /^[a-f0-9]{40}$/u)
assert.equal(report.source.clean, true)
assert.equal(report.counts.canonicalUiChecks, 11)
assert.equal(report.counts.dedicatedBrowserSuites, 8)
assert.equal(report.counts.toolRegistryProfiles, 50)
assert.equal(report.counts.callableToolCandidates, 50)
assert.equal(report.counts.confinedRunnerProofs, 50)
assert.equal(report.counts.canonicalEndToEndToolProofs, 50)
assert.equal(report.counts.canonicalJobAdapterProofs, 50)
assert.equal(report.counts.canonicalV3LocalMigrations, 20)
assert.ok(report.counts.canonicalV3ManifestVerifiedFiles >= 178)
assert.deepEqual(report.evidence.routineLongForm, {
  profileId: 'routine_two_hour',
  durationSeconds: 7_200,
  childJobCount: 127,
})
assert.deepEqual(report.evidence.releaseStressLongForm, {
  profileId: 'release_six_hour',
  durationSeconds: 21_600,
  childJobCount: 255,
  executedByThisAdmission: false,
})
assert.match(report.receiptSha256, /^[a-f0-9]{64}$/u)
assert.ok(Object.values(report.gates).every(Boolean))
assert.ok(Object.values(report.externalGates).every((value) => value === false))
assert.deepEqual(report.boundaries, {
  sourceOnly: true,
  browserExecutedInThisAdmission: false,
  databaseStarted: false,
  localDatabaseMutated: false,
  networkAccessed: false,
  credentialsRead: false,
  providerCalled: false,
  cloudMutated: false,
  supabaseContacted: false,
  billingMutated: false,
  deploymentPerformed: false,
  sixHourStressExecuted: false,
})

const exactReplay = evaluateProtectedInternalTestingReleaseCandidateAdmission(clone(cleanFixture))
assert.equal(exactReplay.receiptSha256, report.receiptSha256)

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.expectedSourceRef = 'codex/another-branch'
}), 'canonical_source_ref')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.expectedSourceSha = 'f'.repeat(40)
}), 'exact_source_sha')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.source.statusPorcelain = ' M server/app.ts'
}), 'clean_source_worktree')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.source.appleDoublePaths = ['src/._App.tsx']
}), 'appledouble_absent')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.canonicalProductUi.ok = false
}), 'canonical_product_ui_source')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.browser.standardSuiteIsolated = false
}), 'standard_browser_suite_isolated')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.longForm.routineDurationSeconds = 21_600
}), 'routine_two_hour_profile')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.longForm.releaseStressExecutedByRoutinePipeline = true
}), 'release_six_hour_excluded_from_routine')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.tools.totalRegistryProfiles = 71
}), 'tool_catalog_partition')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.tools.canonicalEndToEndVerifiedCount = 49
}), 'fifty_canonical_tool_identities')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.tools.canonicalJobAdapterVerifiedCount = 49
}), 'fifty_canonical_job_adapters')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.tools.allProductPromotionGatesFalse = false
}), 'tool_product_promotion_absent')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.canonicalV3Local.manifestIntegrityVerified = false
}), 'canonical_v3_local_manifest_integrity')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.canonicalV3Local.remoteMutationAllowed = true
}), 'canonical_v3_local_only_boundary')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.sourceContracts.rawMigrationBaselineDocumentBlocked = false
}), 'raw_migration_baseline_blocked')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.sourceContracts.requiredPackageScriptsExact = false
}), 'required_source_readiness_scripts')

assertBlocked(tamper(cleanFixture, (snapshot) => {
  snapshot.sourceContracts.workflowAdmission[
    '.github/workflows/beta-readiness-api-staging-deploy.yml'
  ] = false
}), 'gateway_workflow_source_admission')

const tamperedSource = tamper(cleanFixture, (snapshot) => {
  snapshot.source.treeSha = 'a'.repeat(40)
})
const tamperedReport = evaluateProtectedInternalTestingReleaseCandidateAdmission(tamperedSource)
assert.notEqual(tamperedReport.receiptSha256, report.receiptSha256)
assert.equal(tamperedReport.externalGates.productionReady, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'protected-internal-testing-release-candidate-admission-smoke-v1',
  decision: report.decision,
  sourceSha: report.source.headSha,
  sourceTreeSha: report.source.treeSha,
  receiptSha256: report.receiptSha256,
  counts: report.counts,
  routineLongForm: report.evidence.routineLongForm,
  releaseStressLongForm: report.evidence.releaseStressLongForm,
  externalGates: report.externalGates,
}, null, 2))

function assertBlocked(
  snapshot: ProtectedInternalTestingReleaseCandidateSnapshot,
  expectedBlocker: keyof ReturnType<
    typeof evaluateProtectedInternalTestingReleaseCandidateAdmission
  >['gates'],
): void {
  const blocked = evaluateProtectedInternalTestingReleaseCandidateAdmission(snapshot)
  assert.equal(blocked.ok, false)
  assert.equal(blocked.decision, 'blocked_before_protected_internal_testing_activation')
  assert.ok(blocked.blockers.includes(expectedBlocker))
  assert.equal(blocked.externalGates.productionReady, false)
}

function tamper(
  source: ProtectedInternalTestingReleaseCandidateSnapshot,
  mutate: (snapshot: ProtectedInternalTestingReleaseCandidateSnapshot) => void,
): ProtectedInternalTestingReleaseCandidateSnapshot {
  const copy = clone(source)
  mutate(copy)
  return copy
}

function clone(
  source: ProtectedInternalTestingReleaseCandidateSnapshot,
): ProtectedInternalTestingReleaseCandidateSnapshot {
  return structuredClone(source)
}
