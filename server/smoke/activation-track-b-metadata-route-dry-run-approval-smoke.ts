import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
  buildTrackBMetadataRouteDryRunApprovalReports,
} from '../activation/track-b-metadata-route-dry-run-approval'

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
  'activation:track-b-metadata-route-dry-run-approval:plan',
  'activation:track-b-metadata-route-dry-run-approval',
  'activation:track-b-metadata-route-dry-run-approval:report',
  'activation:track-b-metadata-route-dry-run-approval:summary',
  'activation:track-b-metadata-route-dry-run-approval:iam-plan',
  'activation:track-b-metadata-route-dry-run-approval:cost-summary',
  'smoke:activation-track-b-metadata-route-dry-run-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/track-b-metadata-route-dry-run-approval'), 'Phase 44N activation module missing.')
assert(!existsSync('server/workers/track-b-metadata-route-dry-run-approval'), 'Phase 44N must not add a worker.')
assert(TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR === 'docs/activation-phase-44n-metadata-route-dry-run-approval-reports', 'Unexpected Phase 44N report directory.')
assert(TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS.length === 16, 'Phase 44N expected report list must include JSON and Markdown reports.')
for (const report of TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR, report)), `Missing Phase 44N report: ${report}`)
}
for (const doc of [
  'docs/activation-phase-44n-track-b-metadata-route-dry-run-approval-packet.md',
  'docs/activation-phase-44n-metadata-route-dry-run-candidate-registry.md',
  'docs/activation-phase-44n-metadata-route-dry-run-approval-criteria.md',
  'docs/activation-phase-44n-metadata-route-dry-run-plan-snapshot.md',
  'docs/activation-phase-44n-metadata-route-dry-run-artifact-scope.md',
  'docs/activation-phase-44n-metadata-route-dry-run-security-review.md',
  'docs/activation-phase-44n-metadata-route-secret-payload-guard.md',
  'docs/activation-phase-44n-metadata-route-dry-run-operator-checklist.md',
  'docs/activation-phase-44n-metadata-route-dry-run-decision.md',
  'docs/activation-phase-44n-metadata-route-dry-run-blocked-scope-matrix.md',
  'docs/activation-phase-44o-metadata-route-dry-run-execution-handoff.md',
  'docs/implementation-prompts/prompt-phase-44o-metadata-route-dry-run-execution.md',
]) {
  assert(existsSync(doc), `Missing Phase 44N doc: ${doc}`)
}

for (const scanDir of ['server/activation/track-b-metadata-route-dry-run-approval']) {
  for (const { file, text } of readAllFiles(scanDir)) {
    assert(!text.includes("from 'node:child_process'"), `Phase 44N must not import child_process: ${file}`)
    assert(!text.includes('spawn('), `Phase 44N must not spawn processes: ${file}`)
    assert(!text.includes('spawnSync('), `Phase 44N must not spawn processes: ${file}`)
    assert(!text.includes('execFile'), `Phase 44N must not execute commands: ${file}`)
    assert(!text.includes('fetch('), `Phase 44N must not make network calls: ${file}`)
    assert(!/from ['"].*track-a/i.test(text), `Phase 44N must not import Track A: ${file}`)
    assert(!text.includes('providerKey'), `Phase 44N must not reference provider keys: ${file}`)
  }
}

const reports = buildTrackBMetadataRouteDryRunApprovalReports()

const candidateRegistry = reports.candidateRegistry as {
  candidateCount?: number
  selectedCandidateId?: string
  candidates?: Array<{ candidateId?: string; toolId?: string; dryRunType?: string; selected?: boolean; approvalStatus?: string }>
}
assert(candidateRegistry.candidateCount === 9, 'Candidate registry must include exactly nine candidates.')
assert(candidateRegistry.selectedCandidateId === TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE, 'Selected candidate must be the DuckDB metadata route dry-run.')
const selected = candidateRegistry.candidates?.find((entry) => entry.selected)
assert(selected?.candidateId === TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE, 'Selected candidate missing.')
assert(selected?.toolId === 'duckdb', 'Selected candidate must use the DuckDB route.')
assert(selected?.dryRunType === 'metadata_only_route_resolution', 'Selected candidate must be metadata-only.')
assert(candidateRegistry.candidates?.find((entry) => entry.candidateId === 'candidate-vlm-route')?.approvalStatus === 'blocked', 'VLM candidate must be blocked.')
assert(candidateRegistry.candidates?.find((entry) => entry.candidateId === 'candidate-demucs-route')?.approvalStatus === 'blocked', 'Demucs candidate must be blocked.')

const criteria = reports.approvalCriteria as {
  status?: string
  totalCriteria?: number
  passedCriteria?: number
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
}
assert(criteria.status === 'passed', 'Approval criteria must pass.')
assert(criteria.totalCriteria === 20, 'Phase 44N must evaluate 20 approval criteria.')
assert(criteria.passedCriteria === 20, 'All Phase 44N approval criteria must pass.')
assert(criteria.routeExecutionAllowed === false, 'Route execution must remain false.')
assert(criteria.runtimeExecutionAllowed === false, 'Runtime execution must remain false.')

const planSnapshot = reports.planSnapshot as {
  toolId?: string
  capabilityId?: string
  dryRunMode?: string
  executeTool?: boolean
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  futureExecutionRequires?: string[]
}
assert(planSnapshot.toolId === 'duckdb', 'Plan snapshot must target duckdb.')
assert(planSnapshot.capabilityId === 'internal_qa_aggregation', 'Plan snapshot must use internal_qa_aggregation.')
assert(planSnapshot.dryRunMode === 'metadata_only', 'Plan snapshot must be metadata-only.')
assert(planSnapshot.executeTool === false, 'Plan snapshot must not execute DuckDB.')
assert(planSnapshot.routeExecutionAllowed === false, 'Plan snapshot must keep route execution false.')
assert(planSnapshot.runtimeExecutionAllowed === false, 'Plan snapshot must keep runtime execution false.')
assert(planSnapshot.futureExecutionRequires?.includes('separate_phase_44o_or_equivalent'), 'Phase 44O must be required for future execution.')

const artifactScope = reports.artifactScope as {
  status?: string
  noMediaInput?: boolean
  noAudioInput?: boolean
  noModelInput?: boolean
  publicOutputAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  arbitraryLocalPathAllowed?: boolean
  broadMediaAllowed?: boolean
}
assert(artifactScope.status === 'artifact_scope_ready_for_future_metadata_only_route_dry_run', 'Artifact scope must be ready.')
assert(artifactScope.noMediaInput === true, 'Artifact scope must block media input.')
assert(artifactScope.noAudioInput === true, 'Artifact scope must block audio input.')
assert(artifactScope.noModelInput === true, 'Artifact scope must block model input.')
assert(artifactScope.publicOutputAllowed === false, 'Artifact scope must block public output.')
assert(artifactScope.signedUrlSourceOfTruthAllowed === false, 'Artifact scope must block signed URL source of truth.')
assert(artifactScope.arbitraryLocalPathAllowed === false, 'Artifact scope must block arbitrary paths.')
assert(artifactScope.broadMediaAllowed === false, 'Artifact scope must block broad media.')

const securityReview = reports.securityReview as { status?: string; noExecutionPerformed?: boolean }
assert(securityReview.status === 'passed', 'Security review must pass.')
assert(securityReview.noExecutionPerformed === true, 'No execution can happen in Phase 44N.')

const secretGuard = reports.secretGuard as {
  status?: string
  serviceRoleSecretAccess?: string
  providerSecretAccess?: string
  secretManagerAccess?: string
  futureSecretAccessRequestBlocker?: string
}
assert(secretGuard.status === 'passed', 'Secret guard must pass.')
assert(secretGuard.serviceRoleSecretAccess === 'not_required', 'Service role secrets must not be required.')
assert(secretGuard.providerSecretAccess === 'not_required', 'Provider secrets must not be required.')
assert(secretGuard.secretManagerAccess === 'not_required', 'Secret Manager must not be required.')
assert(secretGuard.futureSecretAccessRequestBlocker === 'unexpected_secret_payload_access_required', 'Future secret access must fail closed.')

const decision = reports.approvalDecision as {
  status?: string
  decision?: string
  routeExecution?: string
  workerExecution?: string
  toolExecution?: string
  secretAccess?: string
  trackA?: string
}
assert(decision.status === 'passed', 'Approval decision must pass.')
assert(decision.decision === 'approved_for_future_metadata_only_route_dry_run', 'Decision must approve only a future metadata-only route dry-run.')
assert(decision.routeExecution === 'not_run', 'Route execution must not run.')
assert(decision.workerExecution === 'not_run', 'Worker execution must not run.')
assert(decision.toolExecution === 'not_run', 'Tool execution must not run.')
assert(decision.secretAccess === 'not_run', 'Secret access must not run.')
assert(decision.trackA === 'not_touched', 'Track A must remain untouched.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44N',
  selectedCandidate: selected.candidateId,
  reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS.length,
  decision: decision.decision,
  approvalCriteria: `${criteria.passedCriteria}/${criteria.totalCriteria}`,
  routeExecution: 'not_run',
  runtimeExecution: 'not_run',
  workerExecution: 'not_run',
  toolExecution: 'not_run',
  secretAccess: 'not_run',
  trackA: 'not_touched',
}, null, 2))
