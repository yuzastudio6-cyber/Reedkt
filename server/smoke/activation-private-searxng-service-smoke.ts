import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildPrivateSearxngCommandPlan,
  buildPrivateSearxngIamPlan,
  buildPrivateSearxngServicePlan,
  buildPrivateSearxngServiceReport,
  buildPrivateSearxngSourceManifest,
  normalizePrivateSearxngResults,
  privateSearxngQaGateIds,
  privateSearxngRequiredDocs,
  privateSearxngRequiredScripts,
  privateSearxngSafetyFlags,
  privateSearxngServiceConfig,
  validatePrivateSearxngEndpoint,
  validatePrivateSearxngServiceExecutionEnv,
  type PrivateSearxngQueryResponse,
  type PrivateSearxngServiceValidation,
} from '../activation/private-searxng-service'

const plan = buildPrivateSearxngServicePlan({ runId: 'phase49f-smoke' })
const response: PrivateSearxngQueryResponse = {
  query: privateSearxngServiceConfig.controlledQuery,
  results: [
    { title: 'ReeditPro planning docs', url: 'https://docs.example.test/reeditpro-planning', content: 'Planning stack source record.', engine: 'duckduckgo', category: 'general', score: 1 },
    { title: 'Open source video editing', url: 'https://source.example.test/open-source-video', content: 'Open source video editing reference.', engine: 'duckduckgo', category: 'general', score: 0.9 },
  ],
}
const normalization = normalizePrivateSearxngResults({ response, retrievedAt: '2026-06-02T00:00:00.000Z' })
const manifest = buildPrivateSearxngSourceManifest({ runId: 'phase49f-smoke', sources: normalization.sources, warnings: [], blockers: normalization.blockers })
const serviceValidation: PrivateSearxngServiceValidation = {
  serviceName: privateSearxngServiceConfig.serviceName,
  existsBeforeDeploy: false,
  deployedOrResolved: true,
  serviceUrlRedacted: '[redacted-authenticated-cloud-run-url]',
  serviceUrlHost: 'reeditpro-staging-private-searxng-abc-uc.a.run.app',
  publicUnauthenticatedAccess: false,
  invokerMembers: ['user:aiediting@reeditpro.com'],
  allUsersPresent: false,
  allAuthenticatedUsersPresent: false,
  cloudRunIngress: 'all',
  serviceAccountEmail: privateSearxngServiceConfig.serviceAccountEmail,
  image: privateSearxngServiceConfig.targetImage,
  imageDigest: 'sha256:' + 'a'.repeat(64),
  deployedAt: '2026-06-02T00:00:00.000Z',
  blockers: [],
  warnings: [],
}
const endpointValidation = validatePrivateSearxngEndpoint({ serviceValidation })
const report = buildPrivateSearxngServiceReport()

assert.equal(privateSearxngServiceConfig.phase, '49F')
assert.equal(privateSearxngServiceConfig.projectId, 'reeditpro')
assert.equal(privateSearxngServiceConfig.region, 'us-central1')
assert.equal(privateSearxngServiceConfig.env, 'staging')
assert.equal(privateSearxngServiceConfig.serviceName, 'reeditpro-staging-private-searxng')
assert.equal(privateSearxngServiceConfig.provider, 'searxng')
assert.equal(privateSearxngServiceConfig.maxResults <= 5, true)
assert.equal(privateSearxngSafetyFlags.gpuAllowed, false)
assert.equal(privateSearxngSafetyFlags.modelWeightsAllowed, false)
assert.equal(privateSearxngSafetyFlags.publicUnauthenticatedAccessAllowed, false)
assert.equal(privateSearxngSafetyFlags.paidProvidersAllowed, false)
assert.equal(privateSearxngSafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(privateSearxngSafetyFlags.browserCaptureAllowed, false)
assert.equal(privateSearxngSafetyFlags.readabilityExtractionAllowed, false)
assert.equal(privateSearxngSafetyFlags.productionReadyAllowed, false)
assert.equal(privateSearxngSafetyFlags.externalBetaAllowed, false)
assert.equal(privateSearxngSafetyFlags.broadMediaAllowed, false)

assert.equal(plan.approvedPlanSnapshot, true)
assert.equal(plan.rawPromptExecution, false)
assert.equal(plan.runtime.cpuOnly, true)
assert.equal(plan.runtime.unauthenticatedAccessAllowed, false)
assert.equal(plan.image.officialBaseImage, 'docker.io/searxng/searxng:latest')
assert.ok(plan.image.officialAmd64Digest.startsWith('sha256:'))

assert.equal(endpointValidation.allowed, true)
assert.equal(normalization.sources.length, 2)
assert.ok(normalization.sources.every((source) => source.provider === 'searxng'))
assert.ok(normalization.sources.every((source) => source.captureAllowed === false && source.extractionAllowed === false))
assert.ok(normalization.sources.every((source) => source.privateSearxngUsed && !source.paidProvider))
assert.equal(manifest.privateSearxngUsed, true)
assert.equal(manifest.publicSearxngInstanceUsed, false)
assert.equal(manifest.paidProviderUsed, false)
assert.equal(manifest.browserCaptureUsed, false)
assert.equal(manifest.readabilityExtractionUsed, false)

assert.deepEqual(privateSearxngQaGateIds, [
  'phase49e_evidence',
  'private_service_deployed_or_resolved',
  'service_access_control',
  'searxng_api_health',
  'controlled_query',
  'result_normalization',
  'artifact_privacy',
  'blocked_features',
])

const iamPlan = buildPrivateSearxngIamPlan()
assert.ok(iamPlan.some((entry) => entry.role === 'roles/run.invoker' && !entry.member.includes('allUsers')))
assert.ok(iamPlan.every((entry) => entry.reportOnly))
assert.ok(iamPlan.every((entry) => !entry.member.includes('allAuthenticatedUsers')))

const commandPlan = buildPrivateSearxngCommandPlan()
assert.ok(commandPlan.some((entry) => entry.commandId === 'phase49f-execute-private-searxng-service-validation' && entry.requiresConfirmation && entry.mutatesGcp))
assert.ok(commandPlan.some((entry) => entry.commandId === 'blocked-public-searxng-instance' && !entry.allowedInPhase49F))
assert.ok(commandPlan.some((entry) => entry.commandId === 'blocked-paid-search-provider' && !entry.allowedInPhase49F))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PUBLIC_SEARXNG_INSTANCE_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('BROWSER_CAPTURE_ALLOWED=true'))

assert.equal(validatePrivateSearxngServiceExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  paidProvidersAllowed: 'false',
  publicSearxngInstanceAllowed: 'false',
  publicUnauthenticatedAccessAllowed: 'false',
  broadCrawlingAllowed: 'false',
  browserCaptureAllowed: 'false',
  readabilityExtractionAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadMediaReady: 'false',
}).allowed, true)
assert.equal(validatePrivateSearxngServiceExecutionEnv({ confirmation: 'false' }).allowed, false)

assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicSearxngInstanceAllowed, false)
assert.equal(report.publicUnauthenticatedAccessAllowed, false)
assert.equal(report.browserCaptureAllowed, false)
assert.equal(report.readabilityExtractionAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)

for (const doc of privateSearxngRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of privateSearxngRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49f_policy',
    'private_service_name',
    'cpu_only',
    'public_unauth_blocked',
    'paid_provider_blocked',
    'public_searxng_blocked',
    'controlled_query_bounds',
    'result_normalization',
    'source_manifest',
    'qa_gates',
    'package_scripts',
    'blocked_features',
  ],
}))
