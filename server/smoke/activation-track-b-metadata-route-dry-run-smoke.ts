import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS,
  TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
  buildTrackBMetadataRouteDryRunReports,
} from '../activation/track-b-metadata-route-dry-run'

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
  'activation:track-b-metadata-route-dry-run:plan',
  'activation:track-b-metadata-route-dry-run',
  'activation:track-b-metadata-route-dry-run:report',
  'activation:track-b-metadata-route-dry-run:summary',
  'activation:track-b-metadata-route-dry-run:iam-plan',
  'activation:track-b-metadata-route-dry-run:cost-summary',
  'smoke:activation-track-b-metadata-route-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/track-b-metadata-route-dry-run'), 'Phase 44O activation module missing.')
assert(existsSync('src/lib/track-b/metadata-route-dry-run'), 'Phase 44O pure metadata route library missing.')
assert(!existsSync('server/workers/track-b-metadata-route-dry-run'), 'Phase 44O must not add a worker.')
assert(TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR === 'docs/activation-phase-44o-metadata-route-dry-run-execution-reports', 'Unexpected Phase 44O report directory.')
assert(TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS.length === 15, 'Phase 44O expected report list must include JSON and Markdown reports.')
for (const report of TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR, report)), `Missing Phase 44O report: ${report}`)
}
for (const doc of [
  'docs/activation-phase-44o-metadata-route-dry-run-execution.md',
  'docs/activation-phase-44o-metadata-route-secret-payload-guard.md',
  'docs/activation-phase-44o-metadata-route-plan-snapshot-validation.md',
  'docs/activation-phase-44o-metadata-route-artifact-scope-validation.md',
  'docs/activation-phase-44o-metadata-route-resolution.md',
  'docs/activation-phase-44o-metadata-route-cost-guard.md',
  'docs/activation-phase-44o-metadata-route-sidecar-validation.md',
  'docs/activation-phase-44o-metadata-route-failure-policy.md',
  'docs/activation-phase-44o-metadata-route-readiness.md',
  'docs/activation-phase-tool-runtime-route-approval-handoff.md',
  'docs/implementation-prompts/prompt-tool-runtime-route-approval.md',
]) {
  assert(existsSync(doc), `Missing Phase 44O doc: ${doc}`)
}

for (const scanDir of ['server/activation/track-b-metadata-route-dry-run', 'src/lib/track-b/metadata-route-dry-run']) {
  for (const { file, text } of readAllFiles(scanDir)) {
    assert(!text.includes("from 'node:child_process'"), `Phase 44O must not import child_process: ${file}`)
    assert(!text.includes('spawn('), `Phase 44O must not spawn processes: ${file}`)
    assert(!text.includes('spawnSync('), `Phase 44O must not spawn processes: ${file}`)
    assert(!text.includes('execFile'), `Phase 44O must not execute commands: ${file}`)
    assert(!text.includes('fetch('), `Phase 44O must not make network calls: ${file}`)
    assert(!/from ['"].*track-a/i.test(text), `Phase 44O must not import Track A: ${file}`)
    assert(!text.includes('providerKey'), `Phase 44O must not reference provider keys: ${file}`)
    assert(!text.includes('createRequire'), `Phase 44O must not load runtime packages dynamically: ${file}`)
  }
}

const reports = buildTrackBMetadataRouteDryRunReports()

const priorEvidence = reports.priorEvidenceInventory as {
  phase44n?: { selectedCandidateId?: string; decision?: string; status?: string }
  phase44m?: { noopRouteDryRunStatus?: string; routeExecutionPerformed?: boolean; secretPayloadAccessPerformed?: boolean }
  routeManifest?: { duckDbRoute?: { routeStatus?: string; routeExecutionAllowed?: boolean; runtimeExecutionAllowed?: boolean; capabilityIds?: string[] } }
  costEstimator?: { duckDbCost?: { executionClass?: string; estimateAllowed?: boolean; costRiskClass?: string } }
}
assert(priorEvidence.phase44n?.selectedCandidateId === 'candidate-duckdb-metadata-route-dry-run', 'Phase 44O must load the Phase 44N DuckDB candidate.')
assert(priorEvidence.phase44n?.decision === 'approved_for_future_metadata_only_route_dry_run', 'Phase 44O must load the Phase 44N approval decision.')
assert(priorEvidence.phase44n?.status === 'passed', 'Phase 44N approval status must pass.')
assert(priorEvidence.phase44m?.noopRouteDryRunStatus === 'passed', 'Phase 44M no-op dry-run must be passed.')
assert(priorEvidence.phase44m?.routeExecutionPerformed === false, 'Phase 44M must not have performed route execution.')
assert(priorEvidence.phase44m?.secretPayloadAccessPerformed === false, 'Phase 44M must not have accessed secrets.')
assert(priorEvidence.routeManifest?.duckDbRoute?.routeStatus === 'route_enabled_restricted_internal', 'DuckDB route must be restricted internal.')
assert(priorEvidence.routeManifest?.duckDbRoute?.routeExecutionAllowed === false, 'DuckDB route execution must remain false.')
assert(priorEvidence.routeManifest?.duckDbRoute?.runtimeExecutionAllowed === false, 'DuckDB runtime execution must remain false.')
assert(priorEvidence.routeManifest?.duckDbRoute?.capabilityIds?.includes('internal_qa_aggregation'), 'DuckDB route must include internal_qa_aggregation.')
assert(priorEvidence.costEstimator?.duckDbCost?.executionClass === 'metadata_only', 'DuckDB cost entry must be metadata-only.')
assert(priorEvidence.costEstimator?.duckDbCost?.estimateAllowed === true, 'DuckDB metadata-only cost estimate must be allowed.')
assert(priorEvidence.costEstimator?.duckDbCost?.costRiskClass === 'free_or_negligible', 'DuckDB metadata-only cost must be free_or_negligible.')

const secretGuard = reports.secretPayloadGuard
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
  duckDbRuntimeExecutionAllowed?: boolean
}
assert(planValidation.status === 'passed', 'Plan snapshot validation must pass.')
assert(planValidation.routeExecutionAllowed === false, 'Route execution must remain false.')
assert(planValidation.runtimeExecutionAllowed === false, 'Runtime execution must remain false.')
assert(planValidation.workerExecutionAllowed === false, 'Worker execution must remain false.')
assert(planValidation.sidecarExecutionAllowed === false, 'Sidecar execution must remain false.')
assert(planValidation.toolExecutionAllowed === false, 'Tool execution must remain false.')
assert(planValidation.duckDbRuntimeExecutionAllowed === false, 'DuckDB runtime must remain false.')

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

assert(reports.routeResolutionReport.status === 'passed', 'Route resolution must pass.')
assert(reports.routeResolutionReport.routeResolved === true, 'DuckDB metadata route must resolve.')
assert(reports.routeResolutionReport.routeEligibleForFutureDryRun === true, 'DuckDB route must be eligible for future dry-run only.')
assert(reports.routeResolutionReport.executionPerformed === false, 'Route resolution must not execute.')
assert(reports.routeResolutionReport.duckDbRuntimePerformed === false, 'Route resolution must not run DuckDB.')

assert(reports.costGuardReport.status === 'passed', 'Cost guard must pass.')
assert(reports.costGuardReport.billingApiCalls === 'not_run', 'Cost guard must not call billing APIs.')
assert(reports.costGuardReport.cloudCalls === 'not_run', 'Cost guard must not call cloud APIs.')
assert(reports.costGuardReport.metadataOnlyCostAllowed === true, 'Metadata-only cost must be allowed.')

assert(reports.sidecarValidationReport.status === 'passed', 'Sidecar validation must pass.')
assert(reports.sidecarValidationReport.sidecarProcessStarted === false, 'Sidecar process must not start.')
assert(reports.sidecarValidationReport.executionBlockedResponse.type === 'execution_blocked_response', 'Sidecar validation must return execution-blocked response.')

const executionReport = reports.executionReport
assert(executionReport.metadataRouteDryRunStatus === 'passed', 'Metadata route dry-run must pass.')
assert(executionReport.executionPerformed === false, 'No real execution must occur.')
assert(executionReport.routeExecutionPerformed === false, 'No real route execution must occur.')
assert(executionReport.runtimeExecutionPerformed === false, 'No runtime execution must occur.')
assert(executionReport.workerExecutionPerformed === false, 'No worker execution must occur.')
assert(executionReport.toolExecutionPerformed === false, 'No tool execution must occur.')
assert(executionReport.sidecarExecutionPerformed === false, 'No sidecar execution must occur.')
assert(executionReport.duckDbRuntimePerformed === false, 'No DuckDB runtime must occur.')
assert(executionReport.secretPayloadAccessPerformed === false, 'No secret payload access must occur.')

const failureReport = reports.failureReport as {
  status?: string
  fixtureCount?: number
  passedFixtures?: number
  failureFixtures?: Array<{ expectedBlockedReason?: string; expectedBlockedReasonObserved?: boolean }>
}
assert(failureReport.status === 'passed', 'Failure fixtures must pass.')
assert(failureReport.fixtureCount === 16, 'Phase 44O must run exactly 16 failure fixtures.')
assert(failureReport.passedFixtures === 16, 'Every Phase 44O failure fixture must block as expected.')
for (const blocker of [
  'unexpected_secret_payload_access_required',
  'raw_chat_execution_blocked',
  'route_execution_allowed_true_blocked',
  'runtime_execution_allowed_true_blocked',
  'execute_tool_true_blocked',
  'duckdb_runtime_blocked',
  'worker_execution_blocked',
  'sidecar_execution_blocked',
  'demucs_route_blocked',
  'vlm_route_blocked',
  'provider_calls_blocked',
  'public_output_blocked',
  'arbitrary_path_blocked',
  'media_artifact_blocked',
  'signed_url_source_blocked',
  'cost_hard_block_requested',
]) {
  assert(failureReport.failureFixtures?.some((fixture) => fixture.expectedBlockedReason === blocker && fixture.expectedBlockedReasonObserved === true), `Missing failure fixture blocker: ${blocker}`)
}

const readinessReport = reports.readinessReport as {
  status?: string
  trackBMetadataRouteDryRun?: string
  productWideInternalBeta?: string
  externalBeta?: string
  paidProduction?: string
  production?: string
  trackA?: string
}
assert(readinessReport.status === 'passed', 'Readiness report must pass.')
assert(readinessReport.trackBMetadataRouteDryRun === 'phase_complete_restricted_scope', 'Metadata route dry-run status must be phase complete restricted scope.')
assert(readinessReport.productWideInternalBeta === 'blocked', 'Product-wide internal beta must remain blocked.')
assert(readinessReport.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readinessReport.paidProduction === 'blocked', 'Paid production must remain blocked.')
assert(readinessReport.production === 'blocked', 'Production must remain blocked.')
assert(readinessReport.trackA === 'not_touched', 'Track A must remain untouched.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44O',
  selectedCandidate: priorEvidence.phase44n?.selectedCandidateId,
  reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
  expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS.length,
  metadataRouteDryRun: readinessReport.trackBMetadataRouteDryRun,
  failureFixtures: `${failureReport.passedFixtures}/${failureReport.fixtureCount}`,
  secretPayloadAccess: 'not_required',
  routeExecution: 'metadata_only_dry_run',
  duckDbRuntime: 'not_run',
  workerExecution: 'not_run',
  toolExecution: 'not_run',
  sidecarExecution: 'not_run',
  trackA: 'not_touched',
}, null, 2))
