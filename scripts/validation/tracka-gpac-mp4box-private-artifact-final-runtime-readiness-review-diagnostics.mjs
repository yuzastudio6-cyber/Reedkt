#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review'
const cleanupAuditDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation'
const decisionText = 'tracka_gpac_mp4box_private_artifact_final_runtime_readiness_review_passed_ready_for_guarded_runtime_enablement_plan'
const executionText = 'completed_docs_only_final_runtime_readiness_review_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_private_artifact_cleanup_audit_mock_implementation_passed_ready_for_final_runtime_readiness_review'
const priorMergeSha = 'a3b861e13df8d4466b5ea160cf121f6606e888d2'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json`,
  `${packetDir}/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const priorFiles = [
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-1.md',
  `${cleanupAuditDir}/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-decision.json`,
  `${cleanupAuditDir}/readiness-report.json`,
  'scripts/validation/tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'metadata_chain_complete_ready_for_guarded_runtime_enablement_plan',
  'readyForGuardedRuntimeEnablementPlan',
  'approved_snapshot_runtime_persistence',
  'service_role_backend_route_registration',
  'worker_runtime_dispatch_confirmation',
  'private_artifact_storage_runtime_policy',
  'storage_transfer_negative_tests',
  'signed_public_artifact_negative_tests',
  'tool_runtime_command_allowlist',
  'qa_cleanup_audit_runtime_observability',
  'rollback_and_residue_validation',
  'Product-ready local OSS tools: `0`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /readyForMediaProcessing"\s*:\s*true/i,
  /readyForStorageTransfer"\s*:\s*true/i,
  /readyForSignedUrlCreation"\s*:\s*true/i,
  /readyForPublicArtifactCreation"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /gpacMp4boxExecution"\s*:\s*true/i,
  /mediaProcessing"\s*:\s*true/i,
  /storageTransfer"\s*:\s*true/i,
  /supabaseMutation"\s*:\s*true/i,
  /sqlExecution"\s*:\s*true/i,
  /signedUrlCreation"\s*:\s*true/i,
  /publicArtifactCreation"\s*:\s*true/i,
  /externalBetaExpansion"\s*:\s*true/i,
  /paidProductionUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1 diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of requiredFiles) read(file)
for (const file of packetFiles.filter((file) => file.endsWith('.json'))) json(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-private-artifact-final-runtime-readiness-review:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-diagnostics.mjs') fail('missing package diagnostics script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !read('package.json').includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.privateArtifactCleanupAuditMock !== priorDecision) fail('prior cleanup/audit decision drift')
if (decision.prior?.privateArtifactCleanupAuditMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.readiness?.guardedRuntimeEnablementPlan !== 'ready') fail('guarded enablement readiness drift')
if (decision.readiness?.productRuntime !== 'blocked') fail('product runtime drift')
for (const requiredGuard of [
  'approved_snapshot_runtime_persistence',
  'service_role_backend_route_registration',
  'worker_runtime_dispatch_confirmation',
  'private_artifact_storage_runtime_policy',
  'storage_transfer_negative_tests',
  'signed_public_artifact_negative_tests',
  'tool_runtime_command_allowlist',
  'qa_cleanup_audit_runtime_observability',
  'rollback_and_residue_validation',
]) {
  if (!decision.requiredFutureGuards?.includes(requiredGuard)) fail(`missing future guard ${requiredGuard}`)
}
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.privateArtifactCleanupAuditPassed !== true) fail('readiness cleanup/audit drift')
if (readiness.finalRuntimeReadinessReviewPassed !== true) fail('readiness final review drift')
if (readiness.readyForGuardedRuntimeEnablementPlan !== true) fail('readiness next gate drift')
for (const key of ['readyForRuntimeRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')

const prior = json(`${cleanupAuditDir}/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-decision.json`)
if (prior.decision !== priorDecision) fail('prior cleanup/audit decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file)) fail(`runtime source path changed ${file}`)
  if (/^server\//.test(file)) fail(`server path changed ${file}`)
  if (/^supabase\/|^database\/|^public\//.test(file)) fail(`forbidden changed path ${file}`)
  if (/^docker\//.test(file)) fail(`Docker path changed ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
  if (/package-lock\.json|\.dockerignore|requirements|supabase|database|public/i.test(file)) fail(`protected path changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Runtime readiness review: ready for guarded runtime enablement plan only')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
