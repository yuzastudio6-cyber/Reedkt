#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-private-artifact-manifest-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/private-artifact-manifest-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-private-artifact-manifest-local-runtime-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'server/services/internal-beta-private-artifact-manifest-local-runtime.ts',
  'server/smoke/internal-beta-private-artifact-manifest-local-runtime-smoke.ts',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-private-artifact-manifest-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-job-queue-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_local_private_artifact_manifest_runtime_no_storage_access',
  'completed_backend_local_artifact_manifest_validation_no_storage_or_signed_url',
  'local_private_artifact_manifest_validated_no_storage_access',
  'blocked_invalid_private_artifact_manifest_input',
  'Local manifest record created: `true`',
  'Local artifact records created: `2`',
  'Local checksum records created: `2`',
  'Local QA report link created: `true`',
  'Local cleanup policy recorded: `true`',
  'Storage write: `false`',
  'Storage read: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Private media processing: `false`',
  'User media processing: `false`',
  'QA execution: `false`',
  'Cleanup job created: `false`',
  'Cleanup executed: `false`',
  'Supabase persistence: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Next safe milestone: `RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-LOCAL-RUNTIME-1`',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Storage write:\s*`?true/i,
  /Storage read:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Private media processing:\s*`?true/i,
  /User media processing:\s*`?true/i,
  /QA execution:\s*`?true/i,
  /Cleanup job created:\s*`?true/i,
  /Cleanup executed:\s*`?true/i,
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Preview artifact creation:\s*`?true/i,
  /Final export creation:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'docker/',
  '.github/workflows/',
  'server/routes/',
  'server/workers/',
  'server/config/',
  'src/',
  'database/',
  'public/',
  'tests/',
]

const allowedServerFiles = new Set([
  'server/services/internal-beta-private-artifact-manifest-local-runtime.ts',
  'server/smoke/internal-beta-private-artifact-manifest-local-runtime-smoke.ts',
])

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = [
  ...packetFiles,
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const packetCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden docs claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/private-artifact-manifest-local-runtime-record.json`))
if (record.decision !== 'completed_local_private_artifact_manifest_runtime_no_storage_access') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_artifact_manifest_validation_no_storage_or_signed_url') fail('record execution mismatch')
if (record.localRuntimeStatus !== 'local_private_artifact_manifest_validated_no_storage_access') fail('local runtime status mismatch')
if (record.invalidInputBlocker !== 'blocked_invalid_private_artifact_manifest_input') fail('invalid input blocker mismatch')
if (record.localManifestRecordCreated !== true) fail('local manifest flag mismatch')
if (record.localArtifactRecordsCreated !== 2) fail('local artifact count mismatch')
if (record.localChecksumRecordsCreated !== 2) fail('local checksum count mismatch')
if (record.localQaReportLinkCreated !== true) fail('local QA-link flag mismatch')
if (record.localCleanupPolicyRecorded !== true) fail('local cleanup-policy flag mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta must remain blocked')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.nextSafeMilestone !== 'RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-LOCAL-RUNTIME-1') {
  fail('next safe milestone mismatch')
}

for (const key of [
  'storageWrite',
  'storageRead',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'privateMediaProcessing',
  'userMediaProcessing',
  'qaExecution',
  'cleanupJobCreated',
  'cleanupExecuted',
  'routeExecution',
  'persistedToSupabase',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'serviceRoleRouteExecution',
  'creditMutation',
  'realCreditMutation',
  'jobEnqueueExecution',
  'jobEventWriteExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'rawPromptExecution',
  'renderExportExecution',
  'previewArtifactCreation',
  'finalExportCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const service = read('server/services/internal-beta-private-artifact-manifest-local-runtime.ts')
for (const token of [
  'createInternalBetaPrivateArtifactManifestLocalRuntime',
  'INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_LOCAL_RUNTIME_RULE',
  'INTERNAL_BETA_PRIVATE_ARTIFACT_FORBIDDEN_INPUT_KEYS',
  'local_private_artifact_manifest_validated_no_storage_access',
  'blocked_invalid_private_artifact_manifest_input',
  "storageProvider: 'local_metadata_only'",
  'storageObjectCreated: false',
  'storageObjectRead: false',
  'signedUrlCreated: false',
  'publicArtifactCreated: false',
  'qaExecution: false',
  'cleanupJobCreated: false',
  'cleanupExecuted: false',
  'persistedToSupabase: false',
  'artifact_manifest_',
  'artifact_',
  'signedUrl',
  'mediaBytes',
  'serviceRoleKey',
  'providerApiKey',
]) {
  if (!service.includes(token)) fail(`service missing token ${token}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /registerMockRouteHandler\(/,
]) {
  if (pattern.test(service)) fail(`service contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-private-artifact-manifest-local-runtime-smoke.ts')
for (const token of [
  'same private artifact manifest basis should hash deterministically',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'missingChecksum',
  'file name only',
  'signed/public URL',
  'media bytes',
  'internal-beta-private-artifact-manifest-local-runtime-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-private-artifact-manifest-local-runtime'] !==
  'tsx server/smoke/internal-beta-private-artifact-manifest-local-runtime-smoke.ts'
) {
  fail('missing private artifact manifest local runtime smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-private-artifact-manifest-local-runtime-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-private-artifact-manifest-local-runtime-1-diagnostics.mjs'
) {
  fail('missing private artifact manifest local runtime diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'docker', 'src', 'database', '.github/workflows', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    if (!allowedServerFiles.has(file)) fail(`forbidden changed file ${file}`)
  }
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
