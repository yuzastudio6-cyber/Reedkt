import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  buildTrackBRouteDryRunApprovalReports,
} from '../activation/track-b-route-dry-run-approval'

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
  'activation:track-b-route-dry-run-approval:plan',
  'activation:track-b-route-dry-run-approval',
  'activation:track-b-route-dry-run-approval:report',
  'activation:track-b-route-dry-run-approval:summary',
  'activation:track-b-route-dry-run-approval:iam-plan',
  'activation:track-b-route-dry-run-approval:cost-summary',
  'smoke:activation-track-b-route-dry-run-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const moduleDir = 'server/activation/track-b-route-dry-run-approval'
assert(existsSync(moduleDir), 'Phase 44L route dry-run approval module missing.')
assert(!existsSync('server/workers/track-b-route-dry-run-approval'), 'Phase 44L must not add a worker.')
assert(TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR === 'docs/activation-phase-44l-route-dry-run-approval-reports', 'Unexpected Phase 44L report directory.')
assert(TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS.length === 16, 'Phase 44L expected report list must include all safe reports.')

for (const { file, text } of readAllFiles(moduleDir)) {
  assert(!text.includes("from 'node:child_process'"), `Phase 44L activation must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Phase 44L activation must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Phase 44L activation must not spawn processes: ${file}`)
  assert(!text.includes('execFileAsync('), `Phase 44L activation must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Phase 44L activation must not make network calls: ${file}`)
  assert(!text.includes('process.env'), `Phase 44L activation must not read env vars: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Phase 44L activation must not reference service-role secrets: ${file}`)
  assert(!text.includes('providerKey'), `Phase 44L activation must not reference provider keys: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Phase 44L activation must not import Track A: ${file}`)
}

const reports = buildTrackBRouteDryRunApprovalReports()

const inputManifest = reports.inputManifest as {
  requiredInputCount?: number
  requiredInputs?: Array<{ inputId?: string; acceptedForPhase44L?: boolean; privatePayloadsRead?: boolean }>
}
assert(inputManifest.requiredInputCount === 9, 'Phase 44L must load all 9 prior evidence inputs.')
for (const inputId of [
  'pr161_capability_manifests',
  'pr164_route_manifest',
  'pr167_web_capability_profiler',
  'pr176_desktop_capability_profiler',
  'pr177_desktop_benchmark_runner',
  'pr180_cost_estimator',
  'pr181_local_worker_sidecar_foundation',
  'pr184_hybrid_compute_e2e_simulation',
  'pr187_desktop_beta_readiness_gate',
]) {
  const input = inputManifest.requiredInputs?.find((entry) => entry.inputId === inputId)
  assert(input?.acceptedForPhase44L === true, `Missing accepted Phase 44L evidence: ${inputId}`)
  assert(input?.privatePayloadsRead === false, `Phase 44L must not read private payloads: ${inputId}`)
}

const candidateRegistry = reports.candidateRegistry as {
  status?: string
  selectedCandidateId?: string
  realToolRuntimeCandidatesApproved?: boolean
  candidates?: Array<{ candidateId?: string; type?: string; selected?: boolean; approvalStatus?: string; noToolRuntime?: boolean }>
}
assert(candidateRegistry.status === 'candidate_registry_ready', 'Candidate registry must be ready.')
assert(candidateRegistry.candidates?.length === 5, 'Candidate registry must include exactly 5 candidates.')
assert(candidateRegistry.selectedCandidateId === 'candidate-noop-sidecar-handshake', 'Default selected candidate must be no-op sidecar handshake.')
const selected = candidateRegistry.candidates?.find((entry) => entry.selected)
assert(selected?.candidateId === 'candidate-noop-sidecar-handshake', 'Selected candidate must be the no-op handshake.')
assert(selected?.type === 'no-op', 'Selected candidate must be no-op.')
assert(candidateRegistry.realToolRuntimeCandidatesApproved === false, 'Real tool runtime candidates must not be approved.')
for (const candidateId of ['candidate-duckdb-metadata-report-route', 'candidate-sharp-thumbnail-route']) {
  const candidate = candidateRegistry.candidates?.find((entry) => entry.candidateId === candidateId)
  assert(candidate?.approvalStatus === 'not_approved_for_phase44l', `Tool-route candidate must not be approved: ${candidateId}`)
}

const criteria = reports.approvalCriteria as {
  status?: string
  totalCriteria?: number
  passedCriteria?: number
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
}
assert(criteria.status === 'passed', 'Approval criteria must pass.')
assert(criteria.totalCriteria === 20 && criteria.passedCriteria === 20, 'Phase 44L must pass 20 approval criteria.')
assert(criteria.routeExecutionAllowed === false, 'Route execution must remain false.')
assert(criteria.runtimeExecutionAllowed === false, 'Runtime execution must remain false.')
assert(criteria.workerExecutionAllowed === false, 'Worker execution must remain false.')
assert(criteria.sidecarExecutionAllowed === false, 'Sidecar execution must remain false.')
assert(criteria.toolExecutionAllowed === false, 'Tool execution must remain false.')

const planSnapshot = reports.planSnapshot as {
  status?: string
  toolId?: string
  capabilityId?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  noExecutionPerformed?: boolean
  futureExecutionRequires?: string[]
  validatorCompatibility?: { mappedToolId?: string; result?: { accepted?: boolean; blockedReasons?: string[] } }
}
assert(planSnapshot.status === 'plan_snapshot_ready_for_future_noop_dry_run_only', 'Plan snapshot must be ready for future no-op only.')
assert(planSnapshot.toolId === 'track_b_noop_route_validator', 'Plan snapshot must use synthetic no-op validator tool ID.')
assert(planSnapshot.capabilityId === 'no_op_handshake', 'Plan snapshot must use no-op handshake capability.')
assert(planSnapshot.routeExecutionAllowed === false, 'Plan snapshot must keep route execution false.')
assert(planSnapshot.runtimeExecutionAllowed === false, 'Plan snapshot must keep runtime execution false.')
assert(planSnapshot.workerExecutionAllowed === false, 'Plan snapshot must keep worker execution false.')
assert(planSnapshot.sidecarExecutionAllowed === false, 'Plan snapshot must keep sidecar execution false.')
assert(planSnapshot.toolExecutionAllowed === false, 'Plan snapshot must keep tool execution false.')
assert(planSnapshot.noExecutionPerformed === true, 'Plan snapshot must perform no execution.')
assert(planSnapshot.futureExecutionRequires?.includes('new_execution_phase'), 'Plan snapshot must require a new future execution phase.')
assert(planSnapshot.validatorCompatibility?.mappedToolId === 'local_worker_sidecar_planning', 'Compatibility validation must use existing sidecar planning tool ID.')
assert(planSnapshot.validatorCompatibility?.result?.accepted === true, 'Plan snapshot compatibility validator must accept validate-only request.')

const artifactScope = reports.artifactScope as {
  status?: string
  noMediaInput?: boolean
  noAudioInput?: boolean
  noModelInput?: boolean
  noProviderOutput?: boolean
  publicOutputAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  arbitraryPathAllowed?: boolean
  broadMediaAllowed?: boolean
  payloadUploadInPhase44L?: boolean
  validatorCompatibility?: { result?: { accepted?: boolean; blockedReasons?: string[] } }
}
assert(artifactScope.status === 'artifact_scope_ready_for_future_metadata_only_dry_run', 'Artifact scope must be metadata-only.')
assert(artifactScope.noMediaInput === true, 'Artifact scope must block media input.')
assert(artifactScope.noAudioInput === true, 'Artifact scope must block audio input.')
assert(artifactScope.noModelInput === true, 'Artifact scope must block model input.')
assert(artifactScope.noProviderOutput === true, 'Artifact scope must block provider output.')
assert(artifactScope.publicOutputAllowed === false, 'Artifact scope must block public output.')
assert(artifactScope.signedUrlSourceOfTruthAllowed === false, 'Artifact scope must block signed URL source of truth.')
assert(artifactScope.arbitraryPathAllowed === false, 'Artifact scope must block arbitrary paths.')
assert(artifactScope.broadMediaAllowed === false, 'Artifact scope must block broad media.')
assert(artifactScope.payloadUploadInPhase44L === false, 'Phase 44L must not upload payloads.')
assert(artifactScope.validatorCompatibility?.result?.accepted === true, 'Artifact scope compatibility validator must accept private metadata scope.')

const securityReview = reports.securityReview as {
  status?: string
  noExecutionPerformed?: boolean
  checks?: Array<{ checkId?: string; passed?: boolean }>
}
assert(securityReview.status === 'passed', 'Security review must pass.')
assert(securityReview.noExecutionPerformed === true, 'Security review must assert no execution.')
for (const checkId of [
  'no_route_execution_in_phase44l',
  'no_worker_execution_in_phase44l',
  'no_tool_execution_in_phase44l',
  'no_sidecar_process_in_phase44l',
  'no_raw_chat_execution',
  'no_arbitrary_subprocess',
  'no_shell_command',
  'no_public_output',
  'no_provider_calls',
  'vlm_demucs_remain_blocked',
  'future_execution_requires_explicit_phase',
]) {
  assert(securityReview.checks?.some((entry) => entry.checkId === checkId && entry.passed === true), `Missing security check: ${checkId}`)
}

const operatorChecklist = reports.operatorChecklist as {
  status?: string
  checklist?: Array<{ completed?: boolean }>
}
assert(operatorChecklist.status === 'operator_checklist_ready', 'Operator checklist must be ready.')
assert(operatorChecklist.checklist?.every((entry) => entry.completed === true), 'Operator checklist must be complete.')

const decision = reports.approvalDecision as {
  status?: string
  decision?: string
  selectedCandidateId?: string
  phase44lExecutionOccurred?: boolean
  futureExecutionOnly?: boolean
  routeExecution?: string
  runtimeExecution?: string
  workerExecution?: string
  sidecarExecution?: string
  toolExecution?: string
  providers?: string
  trackA?: string
}
assert(decision.status === 'passed', 'Approval decision must pass.')
assert(decision.decision === 'approved_for_future_noop_route_dry_run', 'Decision must approve only future no-op route dry-run.')
assert(decision.selectedCandidateId === 'candidate-noop-sidecar-handshake', 'Decision must select no-op candidate.')
assert(decision.phase44lExecutionOccurred === false, 'Phase 44L must not execute.')
assert(decision.futureExecutionOnly === true, 'Decision must be future execution only.')
for (const field of ['routeExecution', 'runtimeExecution', 'workerExecution', 'sidecarExecution', 'toolExecution', 'providers'] as const) {
  assert(decision[field] === 'blocked', `Decision must keep ${field} blocked.`)
}
assert(decision.trackA === 'not_touched', 'Track A must remain untouched.')

const privateArtifactManifest = reports.privateArtifactManifest as {
  status?: string
  privateUpload?: string
  privateRead?: string
  noMediaAudioModelPayloads?: boolean
  noPrivatePayloadsCommitted?: boolean
  noSecrets?: boolean
}
assert(privateArtifactManifest.status === 'committed_metadata_only_no_private_upload', 'Private artifact manifest must be committed metadata only.')
assert(privateArtifactManifest.privateUpload === 'not_required', 'Private upload must not be required.')
assert(privateArtifactManifest.privateRead === 'not_run', 'Private read must not run.')
assert(privateArtifactManifest.noMediaAudioModelPayloads === true, 'Media/audio/model payloads must be absent.')
assert(privateArtifactManifest.noPrivatePayloadsCommitted === true, 'Private payloads must not be committed.')
assert(privateArtifactManifest.noSecrets === true, 'Secrets must not be committed.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44L',
  reportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  expectedReports: TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS.length,
  selectedCandidate: decision.selectedCandidateId,
  decision: decision.decision,
  routeExecution: 'blocked',
  runtimeExecution: 'blocked',
  workerExecution: 'blocked',
  sidecarExecution: 'blocked',
  toolExecution: 'blocked',
  trackA: 'not_touched',
}, null, 2))
