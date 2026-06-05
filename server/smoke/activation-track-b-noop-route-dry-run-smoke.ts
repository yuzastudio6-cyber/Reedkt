import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS,
  TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
  buildTrackBNoopRouteDryRunReports,
} from '../activation/track-b-noop-route-dry-run'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:track-b-noop-route-dry-run:plan',
  'activation:track-b-noop-route-dry-run',
  'activation:track-b-noop-route-dry-run:report',
  'activation:track-b-noop-route-dry-run:summary',
  'activation:track-b-noop-route-dry-run:iam-plan',
  'activation:track-b-noop-route-dry-run:cost-summary',
  'smoke:activation-track-b-noop-route-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/track-b-noop-route-dry-run'), 'Phase 44M activation module missing.')
assert(existsSync('src/lib/track-b/noop-route-dry-run'), 'Phase 44M pure no-op library missing.')
assert(!existsSync('server/workers/track-b-noop-route-dry-run'), 'Phase 44M must not add a worker.')
assert(TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR === 'docs/activation-phase-44m-noop-route-dry-run-execution-reports', 'Unexpected Phase 44M report directory.')
assert(TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS.length === 12, 'Phase 44M expected report list must include all safe reports.')

for (const scanDir of ['server/activation/track-b-noop-route-dry-run', 'src/lib/track-b/noop-route-dry-run']) {
  for (const { file, text } of readAllFiles(scanDir)) {
    assert(!text.includes("from 'node:child_process'"), `Phase 44M must not import child_process: ${file}`)
    assert(!text.includes('spawn('), `Phase 44M must not spawn processes: ${file}`)
    assert(!text.includes('spawnSync('), `Phase 44M must not spawn processes: ${file}`)
    assert(!text.includes('execFile'), `Phase 44M must not execute commands: ${file}`)
    assert(!text.includes('fetch('), `Phase 44M must not make network calls: ${file}`)
    assert(!/from ['"].*track-a/i.test(text), `Phase 44M must not import Track A: ${file}`)
    assert(!text.includes('providerKey'), `Phase 44M must not reference provider keys: ${file}`)
  }
}

const reports = buildTrackBNoopRouteDryRunReports()

const priorEvidence = reports.priorEvidenceInventory as {
  selectedCandidateId?: string
  phase44lDecision?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  secretPayloadsRead?: boolean
}
assert(priorEvidence.selectedCandidateId === 'candidate-noop-sidecar-handshake', 'Phase 44M must load the Phase 44L no-op candidate.')
assert(priorEvidence.phase44lDecision === 'approved_for_future_noop_route_dry_run', 'Phase 44M must load the Phase 44L approval decision.')
assert(priorEvidence.routeExecutionAllowed === false, 'Phase 44L routeExecutionAllowed must remain false.')
assert(priorEvidence.runtimeExecutionAllowed === false, 'Phase 44L runtimeExecutionAllowed must remain false.')
assert(priorEvidence.secretPayloadsRead === false, 'Phase 44M must not read secret payloads.')

const secretGuard = reports.secretPayloadGuard as {
  status?: string
  serviceRoleSecretAccess?: string
  providerSecretAccess?: string
  secretManagerAccess?: string
  unexpectedSecretPayloadAccess?: string
}
assert(secretGuard.status === 'passed', 'Secret payload guard must pass.')
assert(secretGuard.serviceRoleSecretAccess === 'not_required', 'Service role secret access must not be required.')
assert(secretGuard.providerSecretAccess === 'not_required', 'Provider secret access must not be required.')
assert(secretGuard.secretManagerAccess === 'not_required', 'Secret Manager access must not be required.')
assert(secretGuard.unexpectedSecretPayloadAccess === 'not_observed', 'Unexpected secret payload access must not be observed.')

const planValidation = reports.planSnapshotValidation as {
  status?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
}
assert(planValidation.status === 'passed', 'Plan snapshot validation must pass.')
assert(planValidation.routeExecutionAllowed === false, 'Plan snapshot must keep route execution false.')
assert(planValidation.runtimeExecutionAllowed === false, 'Plan snapshot must keep runtime execution false.')
assert(planValidation.workerExecutionAllowed === false, 'Plan snapshot must keep worker execution false.')
assert(planValidation.sidecarExecutionAllowed === false, 'Plan snapshot must keep sidecar execution false.')
assert(planValidation.toolExecutionAllowed === false, 'Plan snapshot must keep tool execution false.')

const artifactValidation = reports.artifactScopeValidation as {
  status?: string
  publicOutputAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  arbitraryPathAllowed?: boolean
  broadMediaAllowed?: boolean
}
assert(artifactValidation.status === 'passed', 'Artifact scope validation must pass.')
assert(artifactValidation.publicOutputAllowed === false, 'Public output must be blocked.')
assert(artifactValidation.signedUrlSourceOfTruthAllowed === false, 'Signed URL source must be blocked.')
assert(artifactValidation.arbitraryPathAllowed === false, 'Arbitrary paths must be blocked.')
assert(artifactValidation.broadMediaAllowed === false, 'Broad media must be blocked.')

const executionReport = reports.executionReport as {
  noopRouteDryRunStatus?: string
  executionPerformed?: boolean
  routeExecutionPerformed?: boolean
  workerExecutionPerformed?: boolean
  toolExecutionPerformed?: boolean
  sidecarProcessStarted?: boolean
  secretPayloadAccessPerformed?: boolean
}
assert(executionReport.noopRouteDryRunStatus === 'passed', 'No-op dry-run must pass.')
assert(executionReport.executionPerformed === false, 'No real execution must occur.')
assert(executionReport.routeExecutionPerformed === false, 'No real route execution must occur.')
assert(executionReport.workerExecutionPerformed === false, 'No worker execution must occur.')
assert(executionReport.toolExecutionPerformed === false, 'No tool execution must occur.')
assert(executionReport.sidecarProcessStarted === false, 'No sidecar process must start.')
assert(executionReport.secretPayloadAccessPerformed === false, 'No secret payload access must occur.')

const failureReport = reports.failureReport as {
  status?: string
  fixtureCount?: number
  passedFixtures?: number
  failureFixtures?: Array<{ expectedBlockedReason?: string; expectedBlockedReasonObserved?: boolean }>
}
assert(failureReport.status === 'passed', 'Failure fixtures must pass.')
assert(failureReport.fixtureCount === 12, 'Phase 44M must run 12 failure fixtures.')
assert(failureReport.passedFixtures === 12, 'Every Phase 44M failure fixture must block as expected.')
for (const blocker of [
  'unexpected_secret_payload_access_required',
  'raw_chat_execution_blocked',
  'route_execution_allowed_true_blocked',
  'runtime_execution_allowed_true_blocked',
  'real_tool_id_requested',
  'demucs_route_blocked',
  'vlm_route_blocked',
  'provider_calls_blocked',
  'public_output_blocked',
  'arbitrary_path_blocked',
  'media_artifact_blocked',
  'signed_url_source_blocked',
]) {
  assert(failureReport.failureFixtures?.some((fixture) => fixture.expectedBlockedReason === blocker && fixture.expectedBlockedReasonObserved === true), `Missing failure fixture blocker: ${blocker}`)
}

const readinessReport = reports.readinessReport as {
  status?: string
  trackBNoopRouteDryRun?: string
  productWideInternalBeta?: string
  externalBeta?: string
  production?: string
  trackA?: string
}
assert(readinessReport.status === 'passed', 'Readiness report must pass.')
assert(readinessReport.trackBNoopRouteDryRun === 'phase_complete_restricted_scope', 'No-op route dry-run status must be phase complete restricted scope.')
assert(readinessReport.productWideInternalBeta === 'blocked', 'Product-wide internal beta must remain blocked.')
assert(readinessReport.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readinessReport.production === 'blocked', 'Production must remain blocked.')
assert(readinessReport.trackA === 'not_touched', 'Track A must remain untouched.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44M',
  selectedCandidate: priorEvidence.selectedCandidateId,
  reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
  expectedReports: TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS.length,
  noopRouteDryRun: readinessReport.trackBNoopRouteDryRun,
  failureFixtures: `${failureReport.passedFixtures}/${failureReport.fixtureCount}`,
  secretPayloadAccess: 'not_required',
  routeExecution: 'noop_only',
  workerExecution: 'not_run',
  toolExecution: 'not_run',
  sidecarExecution: 'not_run',
  trackA: 'not_touched',
}, null, 2))
