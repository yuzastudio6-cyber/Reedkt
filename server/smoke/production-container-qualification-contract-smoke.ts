import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import {
  assertProductionContainerQualificationCandidateIntegrity,
  buildProductionContainerQualificationProbePlan,
  buildReadinessCommandPlans,
  buildStaticProductionReadinessReport,
  hashProductionContainerQualificationValue,
  runProductionContainerQualificationProbeWithAdapter,
  verifyProductionContainerQualificationContractFixture,
  type ProductionContainerQualificationProbeAdapter,
} from '../workers/readiness-validation'

const sourceCommitSha = '1'.repeat(40)
const sourceTreeHash = '2'.repeat(40)
const imageDigest = `sha256:${'3'.repeat(64)}`
const imageReference = `registry.example.test/reeditpro-cpu-worker@${imageDigest}`
const adapter: ProductionContainerQualificationProbeAdapter = {
  inspectCommand(input) {
    return observation(true, { kind: 'command', command: input.command, args: input.args })
  },
  inspectPythonImport(input) {
    return observation(true, { kind: 'python', ...input })
  },
  inspectNodePackage(input) {
    return observation(input.packageName !== 'revideo', { kind: 'node', ...input })
  },
}

let clockTick = 0
const candidate = runProductionContainerQualificationProbeWithAdapter({
  imageRole: 'cpu_worker',
  imageReference,
  sourceCommitSha,
  sourceTreeHash,
  adapter,
  now: () => new Date(Date.UTC(2026, 6, 21, 12, 0, 0, clockTick++)),
})

assert.equal(candidate.evidenceClass, 'container_runtime_self_attested_candidate_unreleased')
assert.equal(candidate.sourceIdentityAuthority, 'human_runner_supplied_not_independently_verified')
assert.equal(candidate.imageRole, 'cpu_worker')
assert.equal(candidate.immutableImageDigest, imageDigest)
assert.equal(candidate.runtimeCheckCoverageComplete, true)
assert.equal(candidate.requiredRuntimeChecksPassed, true)
assert.equal(candidate.forbiddenToolAbsenceVerified, true)
assert.equal(candidate.candidateReadyForIndependentVerification, true)
assert.equal(candidate.manualLicenseAndModelGatesVerified, false)
assert.equal(candidate.productionImageQualified, false)
assert.equal(candidate.externalBetaReady, false)
assert.equal(candidate.productionReady, false)
assert.equal(candidate.safety.networkMode, 'none')
assert.equal(candidate.safety.userMediaMounted, false)
assert.equal(candidate.safety.mediaProcessed, false)
assert.equal(candidate.safety.modelWeightsLoaded, false)
assert.equal(candidate.safety.inferencePerformed, false)
assert.equal(candidate.safety.providerCallPerformed, false)
assert.equal(candidate.safety.cloudMutationPerformed, false)
assert.equal(candidate.costBoundary.providerCostIncluded, false)
assert.equal(candidate.costBoundary.customerPriceIncluded, false)
assert.equal(candidate.costBoundary.customerCreditsIncluded, false)
assert.equal(candidate.costBoundary.serviceFeeIncluded, false)
assert.deepEqual(
  assertProductionContainerQualificationCandidateIntegrity(structuredClone(candidate)),
  candidate,
)

const verification = verifyProductionContainerQualificationContractFixture({
  candidate,
  expectedSourceCommitSha: sourceCommitSha,
  expectedSourceTreeHash: sourceTreeHash,
  expectedImageRole: 'cpu_worker',
  expectedImmutableImageDigest: imageDigest,
})
assert.equal(verification.candidateIntegrityVerified, true)
assert.equal(verification.expectedSourceCommitMatched, true)
assert.equal(verification.expectedSourceTreeMatched, true)
assert.equal(verification.expectedImageRoleMatched, true)
assert.equal(verification.expectedImmutableImageDigestMatched, true)
assert.equal(verification.runtimeChecksPassed, true)
assert.equal(verification.forbiddenAbsencePassed, true)
assert.equal(verification.manualLicenseAndModelGatesVerified, false)
assert.equal(verification.productionImageQualified, false)
assert.equal(verification.externalBetaReady, false)
assert.equal(verification.productionReady, false)

const wrongSource = verifyProductionContainerQualificationContractFixture({
  candidate,
  expectedSourceCommitSha: '4'.repeat(40),
  expectedSourceTreeHash: sourceTreeHash,
  expectedImageRole: 'cpu_worker',
  expectedImmutableImageDigest: imageDigest,
})
assert.equal(wrongSource.expectedSourceCommitMatched, false)
assert.equal(wrongSource.productionImageQualified, false)

const semanticTamper = structuredClone(candidate)
const firstRequired = semanticTamper.checks.find((check) =>
  check.requiredForImageQualification && check.expectation === 'present')
assert.ok(firstRequired)
firstRequired.status = 'failed'
semanticTamper.checksHash = hashProductionContainerQualificationValue(semanticTamper.checks)
semanticTamper.receiptHash = receiptHash(semanticTamper)
assert.throws(
  () => assertProductionContainerQualificationCandidateIntegrity(semanticTamper),
  /requiredRuntimeChecksPassed is invalid/i,
)

const manifestTamper = structuredClone(candidate)
manifestTamper.requiredToolIds = manifestTamper.requiredToolIds.slice(1)
manifestTamper.receiptHash = receiptHash(manifestTamper)
assert.throws(
  () => assertProductionContainerQualificationCandidateIntegrity(manifestTamper),
  /source-owned image manifest/i,
)

assert.throws(
  () => runProductionContainerQualificationProbeWithAdapter({
    imageRole: 'cpu_worker',
    imageReference: 'reeditpro-cpu-worker:mutable-latest',
    sourceCommitSha,
    sourceTreeHash,
    adapter,
  }),
  /invalid_string|Invalid string|expected string to match/i,
)

for (const role of [
  'api',
  'cpu_worker',
  'gpu_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
] as const) {
  const plan = buildProductionContainerQualificationProbePlan(role)
  assert.equal(plan.imageRole, role)
  assert.ok(plan.manifestHash.length === 64)
  assert.ok(plan.definitionHash.length === 64)
  assert.ok(plan.checks.length > 0)
  assert.equal(new Set(plan.checks.map((check) => check.checkId)).size, plan.checks.length)
}

const commandPlans = buildReadinessCommandPlans()
for (const role of [
  'api',
  'cpu_worker',
  'gpu_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
]) {
  const plan = commandPlans.find((item) => item.id === `container_readiness_${role}`)
  assert.ok(plan)
  assert.match(plan.command, /--network none/)
  assert.match(plan.command, /--read-only/)
  assert.match(plan.command, /--cap-drop ALL/)
  assert.match(plan.command, /no-new-privileges/)
  assert.match(plan.command, /container-readiness-receipt\.js/)
  assert.doesNotMatch(plan.command, /--mode=static_only/)
  assert.ok(plan.requiredEnvVars.includes('REEDITPRO_SOURCE_COMMIT_SHA'))
  assert.ok(plan.requiredEnvVars.includes('REEDITPRO_SOURCE_TREE_HASH'))
}

const staticReport = buildStaticProductionReadinessReport()
assert.equal(staticReport.evidenceTiers.productionImageQualification.qualifiedToolIds.length, 0)
assert.equal(staticReport.evidenceTiers.deployedReleaseQualification.qualifiedToolIds.length, 0)

const scripts = [9, 10, 11, 12, 13].map((number) =>
  new URL(`../../scripts/docker/prod/${String(number).padStart(2, '0')}-${({
    9: 'run-container-readiness-cpu',
    10: 'run-container-readiness-render',
    11: 'run-container-readiness-qa',
    12: 'run-container-readiness-gpu',
    13: 'run-all-container-readiness',
  } as Record<number, string>)[number]}.example.sh`, import.meta.url))
for (const script of scripts) {
  const source = await readFile(script, 'utf8')
  assert.match(source, /name@sha256:digest/)
  assert.match(source, /REEDITPRO_SOURCE_COMMIT_SHA/)
  assert.match(source, /REEDITPRO_SOURCE_TREE_HASH/)
  assert.match(source, /container-readiness-receipt\.js/)
  assert.match(source, /--network none/)
  assert.match(source, /--read-only/)
  assert.doesNotMatch(source, /--mode=static_only/)
  assert.doesNotMatch(source, /\beval\b/)
  assert.doesNotMatch(source, /--volume|\s-v\s/)
}

const liveProbeSource = await readFile(new URL(
  '../workers/readiness-validation/production-container-qualification-live-probe.ts',
  import.meta.url,
), 'utf8')
for (const forbidden of [
  'exec(',
  'spawn(',
  'shell: true',
  'fetch(',
  'gcloud ',
  'docker ',
  'from_pretrained',
  'snapshot_download',
  'SecretManagerServiceClient',
]) assert.ok(!liveProbeSource.includes(forbidden))

const cliSource = await readFile(new URL(
  '../cli/production-container-qualification-receipt.ts',
  import.meta.url,
), 'utf8')
assert.match(cliSource, /REEDITPRO_CONFIRM_CONTAINER_READINESS/)
assert.match(cliSource, /REEDITPRO_RUNTIME_CONFINEMENT_ATTESTED/)
assert.match(cliSource, /REEDITPRO_MODEL_DOWNLOADS_DISABLED/)
assert.match(cliSource, /REEDITPRO_INFERENCE_DISABLED/)

await access(new URL('../../dist-server/container-readiness-receipt.js', import.meta.url))

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'production-container-qualification-contract-smoke-v1',
  status: 'bounded_candidate_probe_and_receipt_contract_verified_production_promotion_blocked',
  candidateReceiptHash: candidate.receiptHash,
  verificationHash: verification.verificationHash,
  imageRoles: 6,
  checks: candidate.checks.length,
  boundaries: {
    dockerOrContainerRunPerformed: false,
    mediaOrModelInferencePerformed: false,
    providerSecretCloudDatabaseOrDeploymentActionPerformed: false,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false,
    productionImageQualified: false,
    externalBetaReady: false,
    productionReady: false,
  },
}, null, 2))

function observation(present: boolean, evidence: unknown) {
  return {
    present,
    evidenceHash: hashProductionContainerQualificationValue(evidence),
  }
}

function receiptHash(candidate: typeof semanticTamper): string {
  const { receiptHash: _receiptHash, ...payload } = candidate
  void _receiptHash
  return hashProductionContainerQualificationValue(payload)
}
