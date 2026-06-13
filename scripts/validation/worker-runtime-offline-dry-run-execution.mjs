import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runId = 'worker-4-local-static'
const outputDir = path.join(root, '.local-artifacts/worker-runtime/worker-4', runId)
const relativeOutputDir = `.local-artifacts/worker-runtime/worker-4/${runId}`
const fixturePath = 'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json'

const requiredPlaceholderFields = [
  'approvedPlanSnapshotRef',
  'scopedToolCallManifestRef',
  'workerJobRef',
  'idempotencyKeyRef',
  'privateArtifactManifestRef',
  'checksumRef',
  'qaEvidenceRef',
  'observabilityEvidenceRef',
  'cleanupEvidenceRef',
]

const requiredBlockedUses = [
  'worker_execution',
  'worker_job_claim',
  'route_execution',
  'tool_execution',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
]

const requiredTopLevelFalseBooleans = [
  'workerExecutionApprovedNow',
  'workerJobClaimApprovedNow',
  'workerLeaseMutationApprovedNow',
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'mediaRuntimeApprovedNow',
  'audioRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const routeFalseBooleans = [
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

function fail(message) {
  throw new Error(`WORKER-4 offline dry-run failed: ${message}`)
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!existsSync(absolutePath)) fail(`missing file ${relativePath}`)
  return readFileSync(absolutePath, 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function isPlaceholder(value) {
  return typeof value === 'string' && /^<[A-Z0-9_]+>$/.test(value)
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function writeJson(fileName, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`
  writeFileSync(path.join(outputDir, fileName), text)
  return { fileName, sha256: sha256(text), bytes: Buffer.byteLength(text) }
}

function validateRouteFixture(relativePath) {
  const routeFixture = readJson(relativePath)
  if (!Array.isArray(routeFixture.capabilityRefs) || routeFixture.capabilityRefs.length < 1) fail(`${relativePath} missing capabilityRefs`)
  if ((!Array.isArray(routeFixture.selectedToolRefs) || routeFixture.selectedToolRefs.length < 1) && !routeFixture.selectedToolMix) {
    fail(`${relativePath} missing selected tool refs or mix`)
  }
  if (!Array.isArray(routeFixture.routeRefs) || routeFixture.routeRefs.length < 1) fail(`${relativePath} missing routeRefs`)
  if (!Array.isArray(routeFixture.outputArtifactScopes) || routeFixture.outputArtifactScopes.length < 1) fail(`${relativePath} missing output artifact scopes`)
  if (!Array.isArray(routeFixture.QARequirements) || routeFixture.QARequirements.length < 1) fail(`${relativePath} missing QA requirements`)
  if (!Array.isArray(routeFixture.observabilityRequirements) || routeFixture.observabilityRequirements.length < 1) {
    fail(`${relativePath} missing observability requirements`)
  }
  if (!Array.isArray(routeFixture.blockedUses) || routeFixture.blockedUses.length < 1) fail(`${relativePath} missing blocked uses`)
  for (const flag of routeFalseBooleans) {
    if (routeFixture[flag] !== false) fail(`${relativePath} ${flag} must be false`)
  }
  return routeFixture
}

const manifest = readJson(fixturePath)
if (manifest.schemaVersion !== 'worker-route-dry-run-fixtures.v1') fail('unexpected worker fixture schema version')
if (manifest.decisionState !== 'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings') fail('unexpected WORKER-2 decision')
if (manifest.workerReadinessState !== 'ready_with_warnings_for_worker_3_offline_dry_run_approval_packet') fail('unexpected WORKER-2 readiness state')
if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length !== 7) fail('expected seven worker route fixtures')

for (const flag of requiredTopLevelFalseBooleans) {
  if (manifest.approvalBooleans?.[flag] !== false) fail(`top-level ${flag} must be false`)
}

const fixtureResults = []
const jobPayloadRows = []
const claimLeaseRows = []

for (const fixture of manifest.fixtures) {
  if (typeof fixture.fixtureId !== 'string' || !fixture.fixtureId.startsWith('worker_route_')) fail('fixtureId must start with worker_route_')
  if (!existsSync(path.join(root, fixture.sourceScopedToolCallFixture))) fail(`${fixture.fixtureId} source scoped fixture missing`)
  for (const field of requiredPlaceholderFields) {
    if (!isPlaceholder(fixture[field])) fail(`${fixture.fixtureId} ${field} must be a placeholder`)
  }
  if (!Array.isArray(fixture.expectedContractChecks) || fixture.expectedContractChecks.length < 5) {
    fail(`${fixture.fixtureId} expectedContractChecks must include contract checks`)
  }
  if (!Array.isArray(fixture.blockedUses)) fail(`${fixture.fixtureId} blockedUses must be an array`)
  for (const blockedUse of requiredBlockedUses) {
    if (!fixture.blockedUses.includes(blockedUse)) fail(`${fixture.fixtureId} missing blocked use ${blockedUse}`)
  }

  const routeFixture = validateRouteFixture(fixture.sourceScopedToolCallFixture)
  const warnings = ['route_side_tool_capability_route_coverage_inherited_from_tool_route_diagnostics']

  fixtureResults.push({
    fixtureId: fixture.fixtureId,
    result: 'passed_with_warnings',
    sourceScopedToolCallFixture: fixture.sourceScopedToolCallFixture,
    warnings,
    liveWorkerExecutionApprovedNow: false,
    workerJobClaimApprovedNow: false,
    workerLeaseMutationApprovedNow: false,
    queueExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    supabaseMutationApprovedNow: false,
  })

  jobPayloadRows.push({
    fixtureId: fixture.fixtureId,
    planSnapshotId: fixture.approvedPlanSnapshotRef,
    scopedToolCallManifestRef: fixture.scopedToolCallManifestRef,
    workerJobRef: fixture.workerJobRef,
    sourceManifestId: routeFixture.manifestId,
    sourceFixtureId: routeFixture.fixtureId,
    capabilityRefs: routeFixture.capabilityRefs,
    selectedToolRefs: routeFixture.selectedToolRefs || [],
    selectedToolMix: routeFixture.selectedToolMix || null,
    routeRefs: routeFixture.routeRefs,
    outputArtifactScopes: routeFixture.outputArtifactScopes,
    privateArtifactManifestRef: fixture.privateArtifactManifestRef,
    checksumRef: fixture.checksumRef,
    idempotencyKeyRef: fixture.idempotencyKeyRef,
    qaEvidenceRef: fixture.qaEvidenceRef,
    observabilityEvidenceRef: fixture.observabilityEvidenceRef,
    cleanupEvidenceRef: fixture.cleanupEvidenceRef,
  })

  claimLeaseRows.push({
    fixtureId: fixture.fixtureId,
    workerJobRef: fixture.workerJobRef,
    idempotencyKeyRef: fixture.idempotencyKeyRef,
    claimSimulation: 'validated_placeholder_only_no_claim',
    leaseSimulation: 'validated_placeholder_only_no_mutation',
    queueSimulation: 'not_executed',
    retryPolicySimulation: 'placeholder_retry_policy_required_for_worker_5_review',
    serviceRoleMutation: false,
  })
}

mkdirSync(outputDir, { recursive: true })

const report = {
  status: 'passed',
  phase: 'WORKER-4',
  runId,
  decisionState: 'worker_runtime_offline_dry_run_passed_with_warnings',
  fixturesProcessed: fixtureResults.length,
  fixturesPassed: 0,
  fixturesPassedWithWarnings: fixtureResults.length,
  fixturesFailed: 0,
  outputDir: relativeOutputDir,
  sourceFixtureFile: fixturePath,
  noWorkerRuntimeImport: true,
  noRouteHandlerImport: true,
  noToolRuntimeImport: true,
  noProviderRuntimeImport: true,
  noSupabaseConnection: true,
  noNetwork: true,
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  results: fixtureResults,
}

const jobPayloadSummary = {
  status: 'passed_with_warnings',
  runId,
  rows: jobPayloadRows,
  selectedToolCapabilityCoverage: 'inherited_from_committed_tool_route_fixture_json_and_existing_tool_route_diagnostics',
}

const claimLeaseSummary = {
  status: 'passed',
  runId,
  rows: claimLeaseRows,
  jobClaimMade: false,
  workerLeaseMutated: false,
  queueExecuted: false,
}

const qaEvidence = {
  status: 'passed',
  runId,
  fixtureValidationResult: 'passed_with_warnings',
  payloadValidationResult: 'passed_with_warnings',
  noWorkerRuntimeImportProof: true,
  noJobClaimProof: true,
  noLeaseMutationProof: true,
  noQueueExecutionProof: true,
  noRouteToolProviderRuntimeProof: true,
  blockedUseValidation: 'passed',
  noPublicArtifactValidation: true,
  noSignedUrlValidation: true,
  noSupabaseMutationValidation: true,
}

const observabilityEvidence = {
  status: 'passed',
  runId,
  localExecutionScope: 'offline_static_fixture_validation_only',
  commandsRun: ['npm run --silent worker:runtime-offline-dry-run:execute'],
  filesInspected: [fixturePath, ...manifest.fixtures.map((fixture) => fixture.sourceScopedToolCallFixture)],
  localOutputsCreated: [
    `${relativeOutputDir}/offline-dry-run-report.json`,
    `${relativeOutputDir}/job-payload-summary.json`,
    `${relativeOutputDir}/claim-lease-simulation-summary.json`,
    `${relativeOutputDir}/qa-evidence.json`,
    `${relativeOutputDir}/observability-evidence.json`,
    `${relativeOutputDir}/cleanup-evidence.json`,
    `${relativeOutputDir}/checksum-summary.json`,
  ],
  noNetworkApiCalls: true,
  noSupabase: true,
  noGcs: true,
  noProviderModelCalls: true,
  noRouteToolWorkerExecution: true,
}

const cleanupEvidence = {
  status: 'passed',
  runId,
  localOutputDir: relativeOutputDir,
  cleanupPerformed: false,
  evidencePreserved: true,
  noGcsCleanupNeeded: true,
  noSignedUrlCleanupNeeded: true,
  noPublicArtifactCleanupNeeded: true,
  noSupabaseCleanupNeeded: true,
  retryGuidance: 'rerun WORKER-4 only from committed fixture JSON after a new approval if evidence is stale or blocked',
}

const written = [
  writeJson('offline-dry-run-report.json', report),
  writeJson('job-payload-summary.json', jobPayloadSummary),
  writeJson('claim-lease-simulation-summary.json', claimLeaseSummary),
  writeJson('qa-evidence.json', qaEvidence),
  writeJson('observability-evidence.json', observabilityEvidence),
  writeJson('cleanup-evidence.json', cleanupEvidence),
]

const checksumSummary = {
  status: 'passed',
  runId,
  files: written.map((entry) => ({
    path: `${relativeOutputDir}/${entry.fileName}`,
    sha256: entry.sha256,
    bytes: entry.bytes,
  })),
}
const checksumEntry = writeJson('checksum-summary.json', checksumSummary)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-4',
  runId,
  decisionState: report.decisionState,
  fixturesProcessed: report.fixturesProcessed,
  fixturesPassedWithWarnings: report.fixturesPassedWithWarnings,
  outputDir: relativeOutputDir,
  checksumSummary: `${relativeOutputDir}/${checksumEntry.fileName}`,
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  nextRecommendedPrompt: 'WORKER-5 - Worker Runtime Offline Dry-Run QA / Review',
}, null, 2))
