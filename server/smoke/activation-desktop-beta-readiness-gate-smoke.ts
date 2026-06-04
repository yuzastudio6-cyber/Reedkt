import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS,
  DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
  buildDesktopBetaReadinessGateReports,
} from '../activation/desktop-beta-readiness-gate'

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
  'activation:desktop-beta-readiness-gate:plan',
  'activation:desktop-beta-readiness-gate',
  'activation:desktop-beta-readiness-gate:report',
  'activation:desktop-beta-readiness-gate:summary',
  'activation:desktop-beta-readiness-gate:iam-plan',
  'activation:desktop-beta-readiness-gate:cost-summary',
  'smoke:activation-desktop-beta-readiness-gate',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const moduleDir = 'server/activation/desktop-beta-readiness-gate'
assert(existsSync(moduleDir), 'Phase 44K desktop beta readiness gate module missing.')
assert(!existsSync('server/workers/desktop-beta-readiness-gate'), 'Phase 44K must not add a worker.')
assert(DESKTOP_BETA_READINESS_GATE_REPORT_DIR === 'docs/activation-phase-44k-desktop-beta-readiness-gate-reports', 'Unexpected Phase 44K report directory.')
assert(DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS.length === 15, 'Phase 44K expected report list must include all required safe reports.')

for (const { file, text } of readAllFiles(moduleDir)) {
  assert(!text.includes("from 'node:child_process'"), `Phase 44K activation must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Phase 44K activation must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Phase 44K activation must not spawn processes: ${file}`)
  assert(!text.includes('execFileAsync('), `Phase 44K activation must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Phase 44K activation must not make network calls: ${file}`)
  assert(!text.includes('process.env'), `Phase 44K activation must not read env vars: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Phase 44K activation must not reference service-role secrets: ${file}`)
  assert(!text.includes('providerKey'), `Phase 44K activation must not reference provider keys: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Phase 44K activation must not import Track A: ${file}`)
}

const reports = buildDesktopBetaReadinessGateReports()

const evidence = reports.priorEvidenceInventory as {
  status?: string
  requiredEvidence?: Array<{ inputId?: string; acceptedForPhase44K?: boolean; privatePayloadsRead?: boolean }>
}
assert(evidence.status === 'all_required_committed_safe_evidence_loaded', 'Prior evidence inventory must load all committed safe evidence.')
for (const inputId of [
  'pr161_capability_manifests',
  'pr164_route_manifest',
  'pr167_web_capability_profiler',
  'pr176_desktop_capability_profiler',
  'pr177_desktop_benchmark_runner',
  'pr180_cost_estimator',
  'pr181_local_worker_sidecar_foundation',
  'pr184_hybrid_compute_e2e_simulation',
]) {
  const input = evidence.requiredEvidence?.find((entry) => entry.inputId === inputId)
  assert(input?.acceptedForPhase44K === true, `Missing accepted Phase 44K evidence: ${inputId}`)
  assert(input?.privatePayloadsRead === false, `Phase 44K must not read private payloads: ${inputId}`)
}

const criteria = reports.readinessCriteria as {
  status?: string
  totalCriteria?: number
  passedCriteria?: number
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
}
assert(criteria.status === 'passed', 'Phase 44K readiness criteria must pass.')
assert(criteria.totalCriteria === 20 && criteria.passedCriteria === 20, 'Phase 44K must evaluate and pass 20 criteria.')
assert(criteria.routeExecutionAllowed === false, 'Route execution must remain false.')
assert(criteria.runtimeExecutionAllowed === false, 'Runtime execution must remain false.')
assert(criteria.workerExecutionAllowed === false, 'Worker execution must remain false.')
assert(criteria.sidecarExecutionAllowed === false, 'Sidecar execution must remain false.')
assert(criteria.toolExecutionAllowed === false, 'Tool execution must remain false.')

const allowedScope = reports.allowedInternalScope as {
  status?: string
  routeExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  sidecarExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  publicOutputAllowed?: boolean
}
assert(allowedScope.status === 'restricted_internal_metadata_planning_simulation_only', 'Allowed scope must be restricted metadata/planning/simulation only.')
assert(allowedScope.routeExecutionAllowed === false, 'Allowed scope must block route execution.')
assert(allowedScope.runtimeExecutionAllowed === false, 'Allowed scope must block runtime execution.')
assert(allowedScope.workerExecutionAllowed === false, 'Allowed scope must block worker execution.')
assert(allowedScope.sidecarExecutionAllowed === false, 'Allowed scope must block sidecar execution.')
assert(allowedScope.toolExecutionAllowed === false, 'Allowed scope must block tool execution.')
assert(allowedScope.publicOutputAllowed === false, 'Allowed scope must block public output.')

const blockedScope = reports.blockedScopeMatrix as {
  status?: string
  blockedScopes?: Array<{ scope?: string; status?: string }>
}
for (const scope of [
  'live_route_execution',
  'worker_execution',
  'local_sidecar_execution',
  'tool_execution',
  'providers',
  'public_output',
  'broad_media',
  'product_wide_internal_beta',
  'external_beta',
  'paid_production',
  'production',
  'vlm_runtime',
  'demucs_runtime',
  'track_a',
]) {
  assert(blockedScope.blockedScopes?.some((entry) => entry.scope === scope && entry.status === 'blocked'), `Missing blocked scope: ${scope}`)
}

const rollback = reports.rollbackBlockerPolicy as { status?: string; blockerPolicy?: string[] }
assert(rollback.status === 'fail_closed_policy_defined', 'Rollback/blocker policy must be defined.')
assert((rollback.blockerPolicy ?? []).some((entry) => entry.includes('public artifact')), 'Rollback policy must block public artifacts.')

const support = reports.supportRunbookChecklist as { status?: string; checklist?: Array<{ completed?: boolean }> }
assert(support.status === 'support_checklist_ready', 'Support checklist must be ready.')
assert(support.checklist?.every((entry) => entry.completed === true), 'Every support checklist item must be complete.')

const scorecard = reports.scorecard as {
  status?: string
  totalCriteria?: number
  passedCriteria?: number
  desktopHybridComputeBetaStatus?: string
}
assert(scorecard.status === 'passed', 'Scorecard must pass.')
assert(scorecard.totalCriteria === 20 && scorecard.passedCriteria === 20, 'Scorecard must pass all criteria.')
assert(scorecard.desktopHybridComputeBetaStatus === 'internally_beta_ready_candidate', 'Scorecard must set restricted internal candidate status.')

const decision = reports.readinessDecision as {
  status?: string
  decision?: string
  desktopHybridComputeBetaStatus?: string
  routeExecution?: string
  runtimeExecution?: string
  workerExecution?: string
  sidecarExecution?: string
  toolExecution?: string
  productWideInternalBeta?: string
  externalBeta?: string
  paidProduction?: string
  production?: string
  publicOutput?: string
  providers?: string
  vlm?: string
  demucs?: string
  trackA?: string
}
assert(decision.status === 'passed', 'Readiness decision must pass.')
assert(decision.decision === 'internally_beta_ready_candidate_restricted_metadata_planning_simulation_only', 'Decision must be restricted internal metadata/planning/simulation only.')
assert(decision.desktopHybridComputeBetaStatus === 'internally beta-ready candidate', 'Desktop/hybrid beta status must be internally beta-ready candidate.')
for (const field of ['routeExecution', 'runtimeExecution', 'workerExecution', 'sidecarExecution', 'toolExecution', 'productWideInternalBeta', 'externalBeta', 'paidProduction', 'production', 'publicOutput', 'providers', 'vlm', 'demucs'] as const) {
  assert(decision[field] === 'blocked', `Readiness decision must keep ${field} blocked.`)
}
assert(decision.trackA === 'not_touched', 'Track A must remain untouched.')

const artifactManifest = reports.privateArtifactManifest as {
  status?: string
  privateUpload?: string
  privateRead?: string
  noMediaAudioModelPayloads?: boolean
  noPrivatePayloadsCommitted?: boolean
  noSecrets?: boolean
}
assert(artifactManifest.status === 'committed_metadata_only_no_private_upload', 'Private artifact manifest must be committed metadata only.')
assert(artifactManifest.privateUpload === 'not_required', 'Private upload must not be required.')
assert(artifactManifest.privateRead === 'not_run', 'Private read must not run.')
assert(artifactManifest.noMediaAudioModelPayloads === true, 'Media/audio/model payloads must be absent.')
assert(artifactManifest.noPrivatePayloadsCommitted === true, 'Private payloads must not be committed.')
assert(artifactManifest.noSecrets === true, 'Secrets must not be committed.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44K',
  reportDir: DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
  expectedReports: DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS.length,
  scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
  desktopHybridComputeBetaStatus: decision.desktopHybridComputeBetaStatus,
  routeExecution: 'blocked',
  runtimeExecution: 'blocked',
  workerExecution: 'blocked',
  sidecarExecution: 'blocked',
  toolExecution: 'blocked',
  trackA: 'not_touched',
}, null, 2))
