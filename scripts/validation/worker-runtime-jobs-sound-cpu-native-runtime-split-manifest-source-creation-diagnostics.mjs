#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_creation_completed_with_warnings_ready_for_source_owner_review_no_install_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production'
const SOURCE_HEAD = 'bf3030197ea04ae33933cc501ed995f1d59a5c23'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-OWNER-REVIEW: review isolated manifest source files, no install/no media/no production'

const MANIFESTS = {
  shared: {
    path: 'server/workers/sound-cpu/requirements.launch-core.shared.txt',
    lines: ['duckdb==1.5.4', 'polars==1.42.0', 'opentimelineio==0.18.1'],
  },
  pyav: {
    path: 'server/workers/sound-cpu/requirements.launch-core.pyav.txt',
    lines: ['av==17.1.0'],
  },
  opencv: {
    path: 'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt',
    lines: ['scenedetect==0.7', 'opencv-python-headless==4.13.0.92'],
  },
}

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-result.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-result',
  },
  files: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-file-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-file-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-validation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-validation-register',
  },
  handoff: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review-handoff.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review-handoff',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'existingCombinedManifestChangedToday',
  'runtimeSourceChangedToday',
  'installProofRanToday',
  'packageInstallRanToday',
  'importProofRanToday',
  'sourceInstallReviewClosedToday',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'toolExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'pythonPackageInstall',
  'nodePackageInstall',
  'runtimeSourceImplementation',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
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
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const source of SOURCE_FILES) read(source)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-native-runtime-split-manifest-source-creation:diagnostics'],
  'package script missing',
)

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source plan decision missing')

const combined = read('server/workers/sound-cpu/requirements.launch-core.txt')
for (const line of ['av==17.1.0', 'scenedetect==0.7', 'opencv-python-headless==4.13.0.92']) {
  assert(combined.includes(line), `combined manifest must remain and include ${line}`)
}

for (const manifest of Object.values(MANIFESTS)) {
  const text = read(manifest.path).trim()
  assert(text === manifest.lines.join('\n'), `${manifest.path} content mismatch`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.splitManifestSourcePlanPr === 1479, 'source PR mismatch')
assert(result.sourceBase.splitManifestSourcePlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourceCreationResult.requirementsFilesCreatedToday === true, 'requirements creation flag missing')
assert(result.sourceCreationResult.requirementsFilesCreated.length === 3, 'created requirements count mismatch')
assert(result.sourceCreationResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero source-install blockers')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const fileRegister = parsed.files
assert(fileRegister.createdFiles.length === 3, 'file register count mismatch')
for (const manifest of Object.values(MANIFESTS)) {
  assert(fileRegister.createdFiles.some((entry) => entry.path === manifest.path), `${manifest.path} missing from register`)
}

const validation = parsed.validation.validationRules
assert(validation.sharedManifestContainsOnlyLowRiskManifestTools === true, 'shared validation missing')
assert(validation.pyavManifestContainsOnlyPyAv === true, 'pyav validation missing')
assert(validation.opencvScenedetectManifestContainsOnlyOpenCvAndPySceneDetect === true, 'opencv/scenedetect validation missing')
assert(validation.noPackageInstallRanToday === true, 'validation must record no install')

const handoff = parsed.handoff.ownerReviewHandoff
assert(handoff.afterOwnerReviewNextAllowedGate === 'controlled isolated install/import proof plan', 'handoff next gate mismatch')
assert(handoff.reviewMustConfirm.includes('real-user-media beta remains blocked'), 'handoff beta guard missing')

const claims = parsed.claims
assert(claims.allowedClaims.isolatedRequirementsFilesCreated === true, 'created source claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real user beta must stay false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.reviewScope.manifestSourceReview === true, 'owner review must inspect source')
assert(prompt.reviewScope.pythonPackageInstall === false, 'owner review must not install')
assert(prompt.requiredSourceFiles.length === 3, 'owner review source file count mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      splitManifestSourcePlanPr: 1479,
      requirementsFilesCreatedToday: true,
      installProofRanToday: false,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
