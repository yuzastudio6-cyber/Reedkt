import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildWebSearchCaptureReadinessReport,
  buildWebSearchProviderGateAudit,
  buildWebSearchReadinessCommandPlan,
  buildWebSearchReadinessIamPlan,
  resolveWebSearchCaptureEvidenceChain,
  validateWebSearchCaptureReadinessStaticPolicy,
  webSearchCaptureReadinessConfig,
  webSearchCaptureReadinessQaGateIds,
  webSearchCaptureReadinessSafetyFlags,
} from '../activation/web-search-capture-readiness'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const scripts = packageJson.scripts ?? {}

assert.equal(webSearchCaptureReadinessConfig.phase, '49H')
assert.equal(webSearchCaptureReadinessConfig.serviceName, 'reeditpro-staging-private-searxng')
assert.equal(webSearchCaptureReadinessConfig.canonicalPhase49GRunId, 'phase49g-20260602T222646')
assert.equal(webSearchCaptureReadinessSafetyFlags.liveSearchDuringPhase49H, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.browserCaptureDuringPhase49H, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.readabilityExtractionDuringPhase49H, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.paidProviderAllowed, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.arbitraryUrlCaptureAllowed, false)
assert.equal(webSearchCaptureReadinessSafetyFlags.productionReadyAllowed, false)
assert.equal(validateWebSearchCaptureReadinessStaticPolicy().ok, true)

for (const script of [
  'activation:web-search-capture-readiness',
  'activation:web-search-capture-readiness:report',
  'activation:web-search-capture-readiness:iam-plan',
  'smoke:activation-web-search-capture-readiness',
]) {
  assert.ok(scripts[script], `${script} script must exist`)
}

const evidenceChain = resolveWebSearchCaptureEvidenceChain()
assert.equal(evidenceChain.phases.length, 7)
assert.deepEqual(evidenceChain.phases.map((phase) => phase.phase), ['49A', '49B', '49C', '49D', '49E', '49F', '49G'])
assert.equal(evidenceChain.trackStatus, 'ready_for_internal_testing')
assert.equal(evidenceChain.phases.at(-1)?.runId, 'phase49g-20260602T222646')

const providerGate = buildWebSearchProviderGateAudit()
assert.equal(providerGate.defaultProvider, 'searxng')
assert.equal(providerGate.privateSearxngRequired, true)
assert.equal(providerGate.publicSearxngInstancesAllowed, false)
assert.equal(providerGate.paidProvidersAllowed, false)
assert.equal(providerGate.providerFallbackAllowed, false)
assert.equal(providerGate.frontendSecretsAllowed, false)
assert.ok(providerGate.paidProviders.every((provider) => provider.allowed === false && provider.requiresFutureApproval))

const commandPlan = buildWebSearchReadinessCommandPlan()
assert.ok(commandPlan.some((command) => command.commandId === 'phase49h-execute-readiness-audit' && command.requiresConfirmation && command.mutatesState))
for (const blocked of ['live-search-query', 'browser-capture', 'readability-extraction', 'paid-provider-call', 'public-searxng-instance', 'docker-build-push', 'cloud-run-deploy', 'production-beta-unlock']) {
  const command = commandPlan.find((entry) => entry.commandId === blocked)
  assert.ok(command, `${blocked} command plan must exist`)
  assert.equal(command?.allowedInPhase49H, false)
  assert.equal(command?.command, null)
  assert.ok(command?.blockedReason)
}

const iamPlan = buildWebSearchReadinessIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((entry) => entry.role === 'roles/storage.objectCreator' && !entry.broadAccess && entry.prefix === 'activation-web-search/phase49h/'))

const report = buildWebSearchCaptureReadinessReport()
assert.equal(report.phase, '49H')
assert.equal(report.config.serviceName, 'reeditpro-staging-private-searxng')
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), webSearchCaptureReadinessQaGateIds)
assert.equal(report.safetyFlags.paidProviderAllowed, false)
assert.equal(report.safetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(report.safetyFlags.productionReadyAllowed, false)

for (const doc of [
  'docs/activation-web-search-capture-readiness-runbook.md',
  'docs/activation-web-search-capture-readiness-policy.md',
  'docs/activation-web-search-capture-readiness-artifact-policy.md',
  'docs/activation-web-search-capture-readiness-qa-policy.md',
  'docs/activation-phase-49h-web-search-capture-readiness-results.md',
]) {
  assert.ok(existsSync(doc), `${doc} must exist`)
}

console.log('Phase 49H web search/capture readiness smoke passed.')
