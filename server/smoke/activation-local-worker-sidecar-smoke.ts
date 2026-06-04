import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS,
  LOCAL_WORKER_SIDECAR_REPORT_DIR,
  buildLocalWorkerSidecarReports,
} from '../activation/local-worker-sidecar-foundation'

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
  'activation:local-worker-sidecar:plan',
  'activation:local-worker-sidecar',
  'activation:local-worker-sidecar:report',
  'activation:local-worker-sidecar:summary',
  'activation:local-worker-sidecar:iam-plan',
  'activation:local-worker-sidecar:cost-summary',
  'smoke:activation-local-worker-sidecar',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const sharedDir = 'src/lib/track-b/local-worker-sidecar'
const moduleDir = 'server/activation/local-worker-sidecar-foundation'
assert(existsSync(sharedDir), 'Shared local worker sidecar protocol library missing.')
assert(existsSync(moduleDir), 'Local worker sidecar activation module missing.')
assert(!existsSync('server/workers/local-worker-sidecar'), 'Phase 44G must not add real sidecar workers.')

for (const { file, text } of readAllFiles(sharedDir)) {
  assert(!text.includes('node:child_process'), `Shared sidecar library must not import child_process: ${file}`)
  assert(!text.includes('node:fs'), `Shared sidecar library must not import fs: ${file}`)
  assert(!text.includes('process.env'), `Shared sidecar library must not read env vars: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Shared sidecar library must not reference service-role secrets: ${file}`)
  assert(!text.includes('providerKey'), `Shared sidecar library must not reference provider keys: ${file}`)
  assert(!/from ['"].*server\//.test(text), `Shared sidecar library must not import server modules: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Shared sidecar library must not import Track A: ${file}`)
}

for (const { file, text } of readAllFiles(moduleDir)) {
  assert(!text.includes("from 'node:child_process'"), `Phase 44G activation must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Phase 44G activation must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Phase 44G activation must not spawn processes: ${file}`)
  assert(!text.includes('execFileAsync('), `Phase 44G activation must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Phase 44G activation must not make network calls: ${file}`)
  assert(!text.includes('providerKey'), `Phase 44G activation must not reference provider keys: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Phase 44G activation must not import Track A: ${file}`)
}

const reports = buildLocalWorkerSidecarReports()

const protocolSchema = reports.protocolSchema as {
  messageTypes?: string[]
  executionRequestPolicy?: string
  rawChatPromptAllowed?: boolean
  arbitraryMediaPathAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  secretValuesAllowed?: boolean
}
for (const messageType of [
  'sidecar_hello',
  'controller_hello',
  'plan_snapshot_validate_request',
  'artifact_scope_validate_request',
  'execution_request',
  'execution_blocked_response',
  'sidecar_shutdown_request',
  'sidecar_shutdown_ack',
]) {
  assert(protocolSchema.messageTypes?.includes(messageType), `Missing protocol message: ${messageType}`)
}
assert(protocolSchema.executionRequestPolicy === 'schema_defined_but_always_blocked_in_phase44g', 'Execution request must be schema-only and blocked.')
assert(protocolSchema.rawChatPromptAllowed === false, 'Raw chat prompt must be blocked.')
assert(protocolSchema.arbitraryMediaPathAllowed === false, 'Arbitrary media paths must be blocked.')
assert(protocolSchema.signedUrlSourceOfTruthAllowed === false, 'Signed URL source of truth must be blocked.')
assert(protocolSchema.secretValuesAllowed === false, 'Secret values must be blocked.')

const planPolicy = reports.planSnapshotPolicy as { blockedSources?: string[]; requiredBooleans?: Record<string, unknown> }
assert(planPolicy.blockedSources?.includes('raw_prompt_text'), 'Plan snapshot policy must block raw prompt text.')
assert(planPolicy.blockedSources?.includes('demucs'), 'Plan snapshot policy must block Demucs.')
assert(planPolicy.blockedSources?.includes('qwen3_vl'), 'Plan snapshot policy must block Qwen3-VL.')
assert(planPolicy.requiredBooleans?.failClosed === true, 'Plan snapshot policy must fail closed.')

const artifactPolicy = reports.artifactScopePolicy as { blocked?: string[] }
assert(artifactPolicy.blocked?.includes('public_artifact_paths'), 'Artifact policy must block public artifacts.')
assert(artifactPolicy.blocked?.includes('arbitrary_user_paths'), 'Artifact policy must block arbitrary paths.')
assert(artifactPolicy.blocked?.includes('signed_urls_as_source_of_truth'), 'Artifact policy must block signed URLs as source of truth.')

const securityPolicy = reports.securityPolicy as {
  rawChatExecutionAllowed?: boolean
  arbitrarySubprocessAllowed?: boolean
  shellStringExecutionAllowed?: boolean
  futureCommandPolicy?: { shellByDefault?: boolean; inheritedSensitiveEnvAllowed?: boolean }
}
assert(securityPolicy.rawChatExecutionAllowed === false, 'Security policy must block raw chat execution.')
assert(securityPolicy.arbitrarySubprocessAllowed === false, 'Security policy must block arbitrary subprocesses.')
assert(securityPolicy.shellStringExecutionAllowed === false, 'Security policy must block shell strings.')
assert(securityPolicy.futureCommandPolicy?.shellByDefault === false, 'Future command policy must disable shells by default.')
assert(securityPolicy.futureCommandPolicy?.inheritedSensitiveEnvAllowed === false, 'Future command policy must scrub sensitive env.')

const lifecyclePolicy = reports.lifecyclePolicy as { states?: string[]; maxRuntimePolicy?: string }
for (const state of ['uninitialized', 'handshake_pending', 'ready_metadata_only', 'validation_only', 'execution_blocked', 'shutting_down', 'terminated', 'error']) {
  assert(lifecyclePolicy.states?.includes(state), `Missing lifecycle state: ${state}`)
}
assert(lifecyclePolicy.maxRuntimePolicy === 'no_long_running_process_in_phase44g', 'Lifecycle policy must block long-running sidecar processes.')

const fixtureResults = reports.fixtureResults as { fixtures?: Array<{ fixtureId?: string; status?: string; blockedReasons?: string[] }> }
for (const fixtureId of [
  'fixture-sidecar-handshake-valid',
  'fixture-plan-snapshot-valid-but-execution-blocked',
  'fixture-artifact-scope-valid-private',
  'fixture-deny-raw-chat-execution',
  'fixture-deny-arbitrary-path',
  'fixture-deny-public-artifact',
  'fixture-deny-demucs-route',
  'fixture-deny-vlm-route',
  'fixture-protocol-version-mismatch',
]) {
  assert(fixtureResults.fixtures?.some((fixture) => fixture.fixtureId === fixtureId && fixture.status === 'passed'), `Missing/pending fixture: ${fixtureId}`)
}

const noop = reports.noopHandshakeReport as { status?: string; subprocessStarted?: boolean; shellUsed?: boolean }
assert(noop.status === 'skipped_by_policy', 'Optional no-op handshake must be skipped by default.')
assert(noop.subprocessStarted === false, 'Optional no-op handshake must not start a subprocess by default.')
assert(noop.shellUsed === false, 'Optional no-op handshake must not use a shell.')

const routeHandoff = reports.routeHandoff as {
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  cannotApproveVlm?: boolean
  cannotApproveDemucs?: boolean
  cannotApproveBroadMedia?: boolean
}
assert(routeHandoff.routeExecutionAllowed === false, 'Route execution must remain blocked.')
assert(routeHandoff.workerExecutionAllowed === false, 'Worker execution must remain blocked.')
assert(routeHandoff.toolExecutionAllowed === false, 'Tool execution must remain blocked.')
assert(routeHandoff.cannotApproveVlm === true, 'Sidecar handoff must not approve VLM.')
assert(routeHandoff.cannotApproveDemucs === true, 'Sidecar handoff must not approve Demucs.')
assert(routeHandoff.cannotApproveBroadMedia === true, 'Sidecar handoff must not approve broad media.')

const readiness = reports.readinessReport as {
  localWorkerSidecarPlanning?: string
  routeExecution?: string
  workerExecution?: string
  hybridE2eSimulation?: string
  production?: string
  externalBeta?: string
  publicArtifacts?: string
  trackA?: string
}
assert(readiness.localWorkerSidecarPlanning === 'phase_complete_restricted_scope', 'Local sidecar planning readiness mismatch.')
assert(readiness.routeExecution === 'blocked', 'Route execution must remain blocked.')
assert(readiness.workerExecution === 'blocked', 'Worker execution must remain blocked.')
assert(readiness.hybridE2eSimulation === 'pending_phase44j', 'Phase 44J must remain pending.')
assert(readiness.production === 'blocked', 'Production must remain blocked.')
assert(readiness.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readiness.publicArtifacts === 'blocked', 'Public artifacts must remain blocked.')
assert(readiness.trackA === 'not_touched', 'Track A must remain untouched.')

for (const reportFile of LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('phase_44g_'), `Unexpected Phase 44G report name: ${reportFile}`)
  assert(existsSync(path.join(LOCAL_WORKER_SIDECAR_REPORT_DIR, reportFile)), `Missing committed report: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '44G',
  localWorkerSidecarPlanning: readiness.localWorkerSidecarPlanning,
  fixtureCount: fixtureResults.fixtures?.length,
  optionalNoopHandshake: noop.status,
  routeExecution: 'blocked',
  workerExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
