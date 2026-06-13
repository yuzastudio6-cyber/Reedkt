import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const DEFAULT_RUN_ID = 'tool-route-4-local-static'
const EXPECTED_LOCAL_FILES = [
  'offline-dry-run-report.json',
  'scoped-manifest-summary.json',
  'qa-evidence.json',
  'observability-evidence.json',
  'cleanup-evidence.json',
  'checksum-summary.json',
]

const REQUIRED_FALSE_APPROVALS = [
  'liveRouteExecutionApprovedNow',
  'liveToolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'mediaRuntimeApprovedNow',
  'audioRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

function argValue(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  return process.argv[index + 1] || fallback
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(filePath) {
  assert(existsSync(filePath), `Missing local TOOL-ROUTE-4 evidence file: ${filePath}`)
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

const runId = argValue('--run-id', process.env.TOOL_ROUTE_4_RUN_ID || DEFAULT_RUN_ID)
const outputDirectory = argValue('--output-dir', path.join('.local-artifacts', 'tool-route', 'tool-route-4', runId))

for (const fileName of EXPECTED_LOCAL_FILES) {
  assert(existsSync(path.join(outputDirectory, fileName)), `Missing expected local evidence file: ${fileName}`)
}

const report = readJson(path.join(outputDirectory, 'offline-dry-run-report.json'))
const manifestSummary = readJson(path.join(outputDirectory, 'scoped-manifest-summary.json'))
const qaEvidence = readJson(path.join(outputDirectory, 'qa-evidence.json'))
const observabilityEvidence = readJson(path.join(outputDirectory, 'observability-evidence.json'))
const cleanupEvidence = readJson(path.join(outputDirectory, 'cleanup-evidence.json'))
const checksumSummary = readJson(path.join(outputDirectory, 'checksum-summary.json'))

assert(report.status === 'passed', 'Offline dry-run report must pass.')
assert(report.decisionState === 'tool_route_offline_dry_run_passed_with_warnings', 'Unexpected TOOL-ROUTE-4 decision state.')
assert(report.fixturesChecked === 7, 'Offline dry-run report must include all seven fixtures.')
assert(Array.isArray(report.fixtureResults) && report.fixtureResults.length === 7, 'Fixture results must cover seven fixtures.')
assert(manifestSummary.manifestCount === 7, 'Manifest summary must include all seven fixtures.')
assert(qaEvidence.status === 'passed_with_warnings', 'QA evidence must pass with warnings.')
assert(observabilityEvidence.status === 'passed_with_warnings', 'Observability evidence must pass with warnings.')
assert(cleanupEvidence.status === 'passed_with_warnings', 'Cleanup evidence must pass with warnings.')
assert(cleanupEvidence.committedArtifacts === 'none_from_local_artifacts', 'Local artifacts must remain uncommitted.')
assert(checksumSummary.status === 'passed', 'Checksum summary must pass.')
assert(Array.isArray(checksumSummary.sourceFixtureChecksums) && checksumSummary.sourceFixtureChecksums.length === 7, 'Checksum summary must include seven fixture checksums.')

assert(report.approvalBooleans?.futureOfflineDryRunExecutionApproved === true, 'Future offline dry-run approval must remain true for TOOL-ROUTE-4.')
for (const flag of REQUIRED_FALSE_APPROVALS) {
  assert(report.approvalBooleans?.[flag] === false, `${flag} must remain false.`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-4-QA',
  decisionState: report.decisionState,
  runId,
  outputDirectory,
  fixturesChecked: report.fixturesChecked,
  qaStatus: qaEvidence.status,
  observabilityStatus: observabilityEvidence.status,
  cleanupStatus: cleanupEvidence.status,
  checksumStatus: checksumSummary.status,
  futureOfflineDryRunExecutionApproved: true,
  liveRouteExecutionApprovedNow: false,
  liveToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
}, null, 2))
