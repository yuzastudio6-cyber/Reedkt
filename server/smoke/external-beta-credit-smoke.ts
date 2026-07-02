import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  CREDIT_EXTERNAL_BETA_SCENARIO_TYPES,
  type CreditExternalBetaScenarioType,
} from '../../src/types'
import { buildCreditExternalBetaLaunchGateReport } from '../services/credit-external-beta-launch-gate-service'

const root = process.cwd()
const generatedAt = '2026-07-02T00:00:00.000Z'
const forbiddenStripeMarkers = [
  ['sk', 'test'].join('_'),
  ['sk', 'live'].join('_'),
  ['rk', 'test'].join('_'),
  ['rk', 'live'].join('_'),
  ['pk', 'live'].join('_'),
  ['wh', 'sec'].join(''),
]
const fakeCardNumber = ['4242', '4242', '4242', '4242'].join('')

const report = buildCreditExternalBetaLaunchGateReport({ generatedAt })
const repeated = buildCreditExternalBetaLaunchGateReport({ generatedAt })

assert.deepEqual(report, repeated, 'External beta credit launch gate report must be deterministic for the same input.')
assert.equal(report.status, 'ready_for_stripe_testmode_beta')
assert.equal(report.mockBetaReady, true)
assert.equal(report.stripeTestModeReady, true)
assert.equal(report.liveModeReadyNoCharge, true)
assert.equal(report.liveModeEnabled, false)
assert.equal(report.liveBetaStatus, 'blocked_for_live_external_beta')
assert.deepEqual(report.blockingGaps, [])
assert.equal(report.nonBlockingGaps.some((gap) => /Live Stripe activation remains deferred/.test(gap)), true)
assert.equal(report.recommendedNextMilestone.includes('RP-EXTERNALBETA-02'), true)

const scenarioTypes = new Set(report.scenarios.map((scenario) => scenario.scenarioType))
assert.equal(report.scenarios.length, CREDIT_EXTERNAL_BETA_SCENARIO_TYPES.length)
assert.equal(report.scenarioResults.length, CREDIT_EXTERNAL_BETA_SCENARIO_TYPES.length)
for (const scenarioType of CREDIT_EXTERNAL_BETA_SCENARIO_TYPES) {
  assert.equal(scenarioTypes.has(scenarioType), true, `Missing scenario ${scenarioType}`)
  const scenario = report.scenarios.find((item) => item.scenarioType === scenarioType)
  const result = report.scenarioResults.find((item) => item.scenarioType === scenarioType)
  assert.ok(scenario, `Scenario definition missing ${scenarioType}`)
  assert.ok(result, `Scenario result missing ${scenarioType}`)
  assert.equal(scenario.liveBillingExpected, false)
  assert.equal(result.blockers.length, 0, `${scenarioType} must not have blockers`)
  assert.equal(result.evidence.length > 0, true, `${scenarioType} must include evidence`)
}

expectPassed('happy_path_normal')
expectPassed('happy_path_premium')
expectStatus('happy_path_ultra_premium', 'warning')
expectPassed('insufficient_credits_before_reservation')
expectPassed('runtime_projected_overage')
expectPassed('revised_credit_approved')
expectPassed('lower_cost_selected')
expectPassed('extra_work_cancelled')
expectPassed('settled_with_unused_return')
expectPassed('settled_with_absorbed_overage')
expectPassed('approved_but_unfunded_export_lock')
expectPassed('mock_credit_top_up')
expectPassed('stripe_testmode_checkout_grant')
expectPassed('stripe_live_readiness_no_charge')
expectPassed('audit_support_trace')
expectPassed('ui_lifecycle_display')

assertEvidence('happy_path_normal', /requiredHold=maximumEstimatedCredits/)
assertEvidence('happy_path_normal', /reservedCredits=maximumEstimatedCredits/)
assertEvidence('settled_with_unused_return', /released=40/)
assertEvidence('settled_with_absorbed_overage', /absorbed=30/)
assertEvidence('settled_with_absorbed_overage', /does not block export/)
assertEvidence('approved_but_unfunded_export_lock', /requires_top_up_before_export/)
assertEvidence('approved_but_unfunded_export_lock', /does not automatically unlock export/)
assertEvidence('runtime_projected_overage', /requires_revised_estimate/)
assertEvidence('revised_credit_approved', /newReservedCredits equals revised max/)
assertEvidence('lower_cost_selected', /new estimate required/)
assertEvidence('extra_work_cancelled', /reservation unchanged/)
assertEvidence('mock_credit_top_up', /purchased grant/)
assertEvidence('stripe_testmode_checkout_grant', /verified webhook/)
assertEvidence('stripe_testmode_checkout_grant', /does not double-grant/)
assertEvidence('stripe_live_readiness_no_charge', /ready_no_charge/)
assertEvidence('stripe_live_readiness_no_charge', /all false/)
assertEvidence('ui_lifecycle_display', /Required hold|ready_no_charge/)
assertEvidence('audit_support_trace', /ready_for_mock_external_beta|receipt explains/)

for (const check of report.safetyChecks) {
  assert.equal(check.status, 'passed', `Safety check ${check.id} must pass.`)
}
assertSafety('max_estimate_hold_rule', /maximumEstimatedCredits/)
assertSafety('tool_cost_service_fee_excluded', /serviceFeeIncluded=false/)
assertSafety('service_fee_separate', /creditPolicyVersion=/)
assertSafety('no_provider_render_export', /report-only|fixture-driven/)
assertSafety('no_production_persistence', /No Supabase write/)
assertSafety('live_mode_disabled', /liveModeEnabled=false/)

const packageJson = JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:external-beta-credit'], 'tsx server/smoke/external-beta-credit-smoke.ts')
for (const result of report.requiredSmokeResults) {
  const scriptName = result.command.replace(/^npm run /, '')
  assert.equal(Boolean(packageJson.scripts?.[scriptName]), true, `Missing required package script ${scriptName}`)
  assert.equal(result.status, 'passed')
}

const routeSource = readFileSync(repoPath('server/routes/credit-audit-routes.ts'), 'utf8')
assert.equal(routeSource.includes('buildCreditExternalBetaLaunchGateReport'), true)
assert.equal(routeSource.includes('launchGateReport'), true)
assert.equal(routeSource.includes('/v1/credit-audit/beta-readiness'), true)
assert.equal(/router\.(post|put|patch|delete)/.test(routeSource), false, 'Credit audit routes must remain GET/read-only.')
assert.equal(routeSource.includes('requireAuth'), true)

const serviceSource = readFileSync(repoPath('server/services/credit-external-beta-launch-gate-service.ts'), 'utf8')
for (const forbiddenCall of [
  'grantMockCredits(',
  'completeMockCreditTopUp(',
  'reserveMaxEstimateCredits(',
  'settleCreditReservation(',
  'evaluateExportCreditGate(',
  'createStripeTestCheckoutSession(',
  'processStripeTestWebhook(',
]) {
  assert.equal(serviceSource.includes(forbiddenCall), false, `Launch gate service must not execute ${forbiddenCall}`)
}

for (const file of [
  'server/services/credit-external-beta-launch-gate-service.ts',
  'server/smoke/external-beta-credit-smoke.ts',
  'docs/external-beta-credit-launch-gate.md',
]) {
  assert.equal(existsSync(repoPath(file)), true, `Missing RP-EXTERNALBETA-01 file ${file}`)
}

const packageLockDiff = execFileSync('git', ['diff', '--name-only', '--', 'package-lock.json'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
assert.equal(packageLockDiff, '', 'RP-EXTERNALBETA-01 must not modify package-lock.json.')

const serialized = JSON.stringify(report)
for (const marker of [...forbiddenStripeMarkers, fakeCardNumber]) {
  assert.equal(serialized.includes(marker), false, `Launch gate report must not expose ${marker}`)
}
assert.equal(serialized.includes('cardNumber'), false)
assert.equal(serialized.includes('cvc'), false)
assert.equal(serialized.includes('cvv'), false)

const blockedReport = buildCreditExternalBetaLaunchGateReport({
  generatedAt,
  packageLockChanged: true,
  rawSecretDetected: true,
  requiredSmokeResults: [
    { command: 'npm run smoke:credit-policy', status: 'failed', notes: ['simulated failure'] },
  ],
})
assert.equal(blockedReport.status, 'blocked')
assert.equal(blockedReport.blockingGaps.length > 0, true)
assert.equal(blockedReport.safetyChecks.some((check) => check.id === 'package_lock_unchanged' && check.status === 'blocked'), true)
assert.equal(blockedReport.safetyChecks.some((check) => check.id === 'no_raw_secret_exposure' && check.status === 'blocked'), true)

console.log(JSON.stringify({
  smoke: 'external-beta-credit',
  status: 'passed',
  launchGateStatus: report.status,
  scenarios: report.scenarios.length,
  safetyChecks: report.safetyChecks.length,
  liveBetaStatus: report.liveBetaStatus,
}, null, 2))

function expectPassed(scenarioType: CreditExternalBetaScenarioType): void {
  expectStatus(scenarioType, 'passed')
}

function expectStatus(scenarioType: CreditExternalBetaScenarioType, status: string): void {
  const result = report.scenarioResults.find((item) => item.scenarioType === scenarioType)
  assert.equal(result?.status, status, `${scenarioType} must be ${status}`)
}

function assertEvidence(scenarioType: CreditExternalBetaScenarioType, pattern: RegExp): void {
  const result = report.scenarioResults.find((item) => item.scenarioType === scenarioType)
  assert.ok(result, `Missing scenario result ${scenarioType}`)
  assert.equal(result.evidence.some((item) => pattern.test(item.value)), true, `${scenarioType} missing evidence ${pattern}`)
}

function assertSafety(id: string, pattern: RegExp): void {
  const check = report.safetyChecks.find((item) => item.id === id)
  assert.ok(check, `Missing safety check ${id}`)
  assert.equal(check.notes.some((note) => pattern.test(note)), true, `${id} missing note ${pattern}`)
}

function repoPath(relativePath: string): string {
  return path.join(root, relativePath)
}
