#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_signalsmith_bounded_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_readiness_recheck_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_audioflux_dockerfile_pip_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_readiness_recheck_no_media_no_production'
const SOURCE_HEAD = '7b29183038dce33326f8c964b50ed66f61e2fd3e'
const RUNNER_PATH = 'server/workers/production-readiness/production-tool-readiness-runner.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECHECK-AFTER-SIGNALSMITH-BOUNDED-RECONCILIATION'

const EVIDENCE_FILES = [
  {
    path: 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json',
    markers: [
      '"status": "passed"',
      '"runtimeBuildStatus": "passed"',
      '"generatedFixtureStatus": "passed"',
      '"realMedia": "not_run_blocked"',
    ],
  },
  {
    path: 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports/phase_36j_signalsmith_controlled_stretch_report.json',
    markers: [
      '"status": "passed"',
      '"boundedControlledAudioOnly": true',
      '"publicOutput": "blocked"',
    ],
  },
  {
    path: 'docs/activation-phase-36m-audio-timing-internal-beta-readiness-gate-reports/phase_36m_audio_timing_beta_gate_decision.json',
    markers: [
      '"status": "passed"',
      '"audioTimingToolFamilyBetaStatus": "internally beta-ready candidate"',
      '"externalBeta": "blocked"',
      '"production": "blocked"',
      '"Signalsmith runtime reruns"',
    ],
  },
]

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-reconciliation',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-tool-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-blocker-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-blocker-delta-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation',
  },
}

const FALSE_FIELDS = [
  'persistentWorkerInstallProven',
  'runtimeRerunAuthorized',
  'externalBetaAuthorized',
  'productionAuthorized',
  'signalsmithPersistentInstallReady',
  'signalsmithToolCallExecutionReady',
  'signalsmithWorkerExecutionReady',
  'signalsmithRuntimeRerunReady',
  'signalsmithRealUserMediaReady',
  'signalsmithBinaryAvailableInSoundCpuDockerfile',
  'signalsmithExternalBetaReady',
  'signalsmithProductionReady',
  'acceptedForToolCallExecutionToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForProductionToday',
  'toolExecution',
  'workerExecution',
  'routeExecution',
  'mediaProcessing',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'artifactCreation',
  'supabaseMutation',
  'sqlExecution',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FALSE_FIELDS.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const file of EVIDENCE_FILES) {
  const text = read(file.path)
  for (const marker of file.markers) {
    assert(text.includes(marker), `${file.path} missing marker ${marker}`)
  }
}

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-reconciliation.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'required AudioFlux source decision missing')

const runner = read(RUNNER_PATH)
for (const marker of [
  'boundedActivationEvidenceFiles',
  "['signalsmith_stretch'",
  'phase_36i_signalsmith_runtime_generated_fixture_report.json',
  'phase_36j_signalsmith_controlled_stretch_report.json',
  'phase_36m_audio_timing_beta_gate_decision.json',
  'buildBoundedActivationEvidenceToolSet',
  'boundedActivationEvidenceWarningToolIds',
  'Signalsmith Phase 36I/36J/36M bounded activation evidence passed',
]) {
  assert(runner.includes(marker), `runner missing marker ${marker}`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  if (name !== 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
    assert(doc.decision === DECISION, `${name} decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, name)
  }
  scanFalse(doc, [name])
}

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(reconciliation.sourceBase.audiofluxDockerfilePipReadinessPr === 1536, 'source PR mismatch')
assert(reconciliation.sourceBase.audiofluxDockerfilePipReadinessDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.boundedEvidence.tool === 'signalsmith_stretch', 'bounded tool mismatch')
assert(reconciliation.boundedEvidence.phase36iGeneratedFixture === 'passed', 'Phase 36I evidence mismatch')
assert(reconciliation.boundedEvidence.phase36jControlledPrivateSample === 'passed', 'Phase 36J evidence mismatch')
assert(reconciliation.boundedEvidence.phase36mInternalQaPlanningCandidate === 'passed', 'Phase 36M evidence mismatch')
assert(reconciliation.reconciliation.runnerPath === RUNNER_PATH, 'runner path mismatch')
assert(reconciliation.reconciliation.statusTransition === 'missing_to_warning_for_bounded_activation_evidence_only', 'status transition mismatch')
assert(reconciliation.reconciliation.blocksProductionRemains === true, 'production blocker must remain true')
assert(reconciliation.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const row = parsed.tools.toolRegister[0]
assert(row.toolId === 'signalsmith_stretch', 'tool row mismatch')
assert(row.previousDryRunStatus === 'missing', 'previous status mismatch')
assert(row.newDryRunStatus === 'warning', 'new status mismatch')
assert(row.statusReason === 'bounded_activation_evidence_only', 'status reason mismatch')
assert(row.persistentInstallEvidence === 'not_present', 'persistent install evidence mismatch')

const blockers = parsed.blockers
assert(blockers.closedStaticFalseMissingBlockers.includes('signalsmith_stretch_bounded_activation_evidence_not_reflected_in_dry_run_readiness'), 'closed blocker missing')
for (const blocker of [
  'signalsmith_persistent_worker_install_proof',
  'signalsmith_runtime_rerun_authorization',
  'signalsmith_broad_media_policy',
  'signalsmith_real_user_media_beta_policy',
  'signalsmith_paid_production_policy',
]) {
  assert(blockers.stillBlocked.includes(blocker), `still-blocked item missing ${blocker}`)
}
assert(blockers.expectedReadinessDelta.hardBlockerReductionFromFalseMissingStaticReadiness === 2, 'expected hard blocker delta mismatch')
assert(blockers.duplicateRiskReview.samePurposeBranchOrPrFound === false, 'duplicate risk flag mismatch')

assert(parsed.claims.allowedClaims.signalsmithBoundedActivationEvidenceRecognized === true, 'allowed claim missing')
assert(parsed.claims.blockedClaims.signalsmithPersistentInstallReady === false, 'persistent install must remain false')

const prompt = parsed.prompt
assert(prompt.owner === 'WORKER_RUNTIME_JOBS', 'prompt owner mismatch')
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.expectedInputs.tool === 'signalsmith_stretch', 'prompt tool mismatch')
assert(prompt.expectedInputs.expectedDryRunStatus === 'warning', 'prompt expected status mismatch')
assert(prompt.scope.blocked.includes('Signalsmith runtime rerun'), 'prompt runtime boundary missing')
assert(prompt.scope.blocked.includes('beta or production unlock'), 'prompt beta/production boundary missing')
assertSupabaseNoop(prompt.supabaseClassification, 'prompt')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-signalsmith-bounded-readiness-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      tool: 'signalsmith_stretch',
      statusTransition: 'missing_to_warning_for_bounded_activation_evidence_only',
      persistentInstallReady: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
