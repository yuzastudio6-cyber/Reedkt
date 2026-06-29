#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation'
const qaDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-qa-mock-implementation'
const decisionText = 'tracka_gpac_mp4box_private_artifact_cleanup_audit_mock_implementation_passed_ready_for_final_runtime_readiness_review'
const executionText = 'completed_private_artifact_cleanup_audit_metadata_no_storage_or_tool_execution'
const priorDecision = 'tracka_gpac_mp4box_private_artifact_qa_mock_implementation_passed_ready_for_cleanup_audit_mock'
const priorMergeSha = '3671bc83a12ff5551c240189e7ba6a2c8d85b53d'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-decision.json`,
  `${packetDir}/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-decision.md`,
  `${packetDir}/private-artifact-cleanup-audit.json`,
  `${packetDir}/private-artifact-cleanup-audit.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-private-artifact-cleanup-audit-mock-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-smoke.ts',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const priorFiles = [
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-qa-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-1.md',
  `${qaDir}/gpac-mp4box-private-artifact-qa-mock-implementation-decision.json`,
  `${qaDir}/private-artifact-qa.json`,
  'scripts/validation/tracka-gpac-mp4box-private-artifact-qa-mock-implementation-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...sourceFiles,
  ...statusFiles,
  ...priorFiles,
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'cleanupAudit.gpacMp4box.privateArtifact.mock',
  'private_artifact_cleanup_audit_metadata_only',
  'worker_temp_private_only',
  'ephemeral_worker_temp_only',
  'residue_check_required',
  'blocked_private_artifact_qa_invalid',
  'blocked_cleanup_reference_missing',
  'blocked_cleanup_policy_not_private_temp_only',
  'blocked_audit_reference_missing',
  'blocked_retention_or_residue_policy_missing',
  'blocked_storage_or_public_delivery_attempt',
  'blocked_tool_or_media_execution_not_enabled',
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

const forbiddenSourcePatterns = [
  /from ['"]node:child_process['"]/,
  /\bexec(File|Sync)?\s*\(/,
  /\bspawn\s*\(/,
  /\bfork\s*\(/,
  /\bfetch\s*\(/,
  /createClient\s*\(/,
  /service[_-]?role[_-]?key/i,
  /SUPABASE_SERVICE_ROLE/i,
  /\bdocker\s+(build|run|push|compose|deploy)/i,
  /\bffmpeg\b/i,
  /\bffprobe\b/i,
  /\bMP4Box\s+-/i,
  /\bgpac\s+-/i,
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-private-artifact-cleanup-audit-mock-implementation:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-diagnostics.mjs') fail('missing package diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation'] !== 'tsx server/smoke/tracka-gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-smoke.ts') fail('missing package smoke script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .filter((file) => !file.startsWith('src/'))
  .filter((file) => !file.startsWith('server/smoke/'))
  .map((file) => read(file))
  .join('\n')
const sourceCorpus = sourceFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !sourceCorpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}
for (const file of sourceFiles) {
  const source = read(file)
  for (const pattern of forbiddenSourcePatterns) {
    if (pattern.test(source)) fail(`${file} contains forbidden runtime pattern ${pattern}`)
  }
}

const contractSource = read('src/backend/contracts/gpac-mp4box-private-artifact-cleanup-audit-mock-contracts.ts')
for (const text of [
  'GpacMp4boxPrivateArtifactCleanupAuditMockInput',
  'private_artifact_cleanup_audit_metadata_only',
  'cleanupAudit.gpacMp4box.privateArtifact.mock',
  'worker_temp_private_only',
  'ephemeral_worker_temp_only',
  'storageResidueAllowed: false',
  'storageTransfer: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
]) {
  if (!contractSource.includes(text)) fail(`cleanup/audit contract missing ${text}`)
}
if (!read('src/backend/contracts/index.ts').includes("export * from './gpac-mp4box-private-artifact-cleanup-audit-mock-contracts'")) fail('contract index export missing')

const decision = json(`${packetDir}/gpac-mp4box-private-artifact-cleanup-audit-mock-implementation-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.privateArtifactQaMock !== priorDecision) fail('prior QA decision drift')
if (decision.prior?.privateArtifactQaMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.cleanupAuditId !== 'cleanupAudit.gpacMp4box.privateArtifact.mock') fail('cleanup/audit id drift')
if (decision.cleanupAuditMode !== 'private_artifact_cleanup_audit_metadata_only') fail('cleanup/audit mode drift')
if (decision.cleanupPolicy?.tempArtifactScope !== 'worker_temp_private_only') fail('cleanup scope drift')
if (decision.retentionPolicy?.retentionClass !== 'ephemeral_worker_temp_only') fail('retention policy drift')
if (decision.residuePolicy?.storageResidueAllowed !== false) fail('residue policy drift')
if (decision.readiness?.finalRuntimeReadinessReview !== 'ready') fail('next readiness drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const cleanupAudit = json(`${packetDir}/private-artifact-cleanup-audit.json`)
for (const key of ['storageTransfer', 'signedUrlCreation', 'publicArtifactCreation', 'workerExecution', 'gpacMp4boxExecution', 'mediaProcessing']) {
  if (cleanupAudit[key] !== false) fail(`cleanup/audit ${key} drift`)
}
if (cleanupAudit.cleanupPolicy?.tempArtifactScope !== 'worker_temp_private_only') fail('cleanup/audit cleanup scope drift')
if (cleanupAudit.retentionPolicy?.retentionClass !== 'ephemeral_worker_temp_only') fail('cleanup/audit retention drift')
if (cleanupAudit.residuePolicy?.storageResidueAllowed !== false) fail('cleanup/audit residue drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.privateArtifactQaPassed !== true) fail('readiness QA drift')
if (readiness.privateArtifactCleanupAuditPassed !== true) fail('readiness cleanup/audit drift')
if (readiness.readyForFinalRuntimeReadinessReview !== true) fail('readiness next gate drift')
for (const key of ['readyForRuntimeRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')

const prior = json(`${qaDir}/gpac-mp4box-private-artifact-qa-mock-implementation-decision.json`)
if (prior.decision !== priorDecision) fail('prior QA decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && !sourceFiles.includes(file)) fail(`forbidden src path changed ${file}`)
  if (/^server\//.test(file) && !sourceFiles.includes(file)) fail(`forbidden server path changed ${file}`)
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

console.log('TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Private artifact cleanup/audit: metadata only')
console.log('Storage transfer, signed/public artifacts, worker execution, GPAC/MP4Box execution, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
