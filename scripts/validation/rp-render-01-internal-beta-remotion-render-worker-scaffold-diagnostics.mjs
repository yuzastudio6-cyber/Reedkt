#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-render-01-internal-beta-remotion-render-worker-scaffold'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/render-worker-scaffold-matrix.md`,
  `${packetDir}/render-runtime-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/render-scaffold-record.json`,
  'docs/activation-phase-rp-render-01-internal-beta-remotion-render-worker-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-provider-01-internal-beta-disabled-provider-adapter-scaffold.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-remotion-render-worker-scaffold.ts',
  'scripts/validation/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-diagnostics.mjs',
  'scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  packet,
  'completed_disabled_internal_beta_remotion_render_worker_scaffold_no_render_execution',
  'completed_fail_closed_render_worker_scaffold_no_preview_or_export',
  '`RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD` is merged at `d334c4e9b1962b6d30278ad426fe549706bd5a68`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Remotion render worker scaffold operations added: `8`',
  'Runtime scaffold status: `disabled_pending_remotion_render_worker_runtime_gate`',
  'Render worker job prepared: `false`',
  'Worker dispatch executed: `false`',
  'Worker execution: `false`',
  'Remotion execution: `false`',
  'FFmpeg execution: `false`',
  'FFprobe execution: `false`',
  'Media processing: `false`',
  'Render/export execution: `false`',
  'Preview artifact creation: `false`',
  'Final export creation: `false`',
  'Storage write: `false`',
  'Storage read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Route execution: `false`',
  'Credit mutation: `false`',
  'Supabase mutation: `false`',
  'Provider/model calls: `false`',
  'Internal beta unlock: `false`',
  'Next recommended milestone: `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Remotion render outputs created: `none`',
  'FFmpeg/FFprobe outputs created: `none`',
  'Storage objects created: `none`',
  'Signed URLs created: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Render worker job prepared:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Preview artifact creation:\s*`?true/i,
  /Final export creation:\s*`?true/i,
  /Storage write:\s*`?true/i,
  /Storage read:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /Provider\/model calls:\s*`?true/i,
  /Remotion render outputs created:(?!\s*`?none`?)/i,
  /FFmpeg\/FFprobe outputs created:(?!\s*`?none`?)/i,
  /Storage objects created:(?!\s*`?none`?)/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Remotion execution:\s*`?(completed|enabled|true|passed)/i,
  /FFmpeg execution:\s*`?(completed|enabled|true|passed)/i,
  /FFprobe execution:\s*`?(completed|enabled|true|passed)/i,
  /media processing:\s*`?(completed|enabled|true|passed)/i,
  /preview artifact creation:\s*`?(completed|enabled|true|passed)/i,
  /final export:\s*`?(completed|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'supabase/migrations/',
]

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

function stripHistoricalSections(text) {
  return text
    .replace(/\n## RP-DATA-0[1-4][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-BACKEND-0[1-2][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-CREDITS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-JOBS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-ARTIFACTS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
}

const docsCorpus = requiredFiles
  .filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')
  .map((file) => stripHistoricalSections(read(file)))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/render-scaffold-record.json`))
if (record.decision !== 'completed_disabled_internal_beta_remotion_render_worker_scaffold_no_render_execution') fail('record decision mismatch')
if (record.execution !== 'completed_fail_closed_render_worker_scaffold_no_preview_or_export') fail('record execution mismatch')
if (record.baseMerge !== 'd334c4e9b1962b6d30278ad426fe549706bd5a68') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.remotionRenderWorkerScaffoldOperationsAdded !== 8) fail('render worker operation count mismatch')
if (record.runtimeScaffoldStatus !== 'disabled_pending_remotion_render_worker_runtime_gate') fail('runtime scaffold status mismatch')
if (record.exactOpenDuplicatePr !== 'none') fail('exact open duplicate PR must be none')
if (record.exactRemoteDuplicateBranch !== 'none') fail('exact remote duplicate branch must be none')
for (const key of [
  'renderWorkerJobPrepared',
  'workerDispatchExecuted',
  'workerExecution',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'renderExportExecution',
  'previewArtifactCreation',
  'finalExportCreation',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'routeExecution',
  'creditMutation',
  'supabaseMutation',
  'providerModelCalls',
  'internalBetaUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const scaffold = read('server/services/internal-beta-remotion-render-worker-scaffold.ts')
const operations = scaffold.match(/operation: '[^']+'/g) ?? []
if (operations.length !== 8) fail(`expected 8 render worker operations, found ${operations.length}`)
for (const name of [
  'readInternalBetaRenderWorkerPlanScaffold',
  'preflightInternalBetaRenderWorkerScaffold',
  'prepareInternalBetaRenderWorkerJobScaffold',
  'expectInternalBetaRenderWorkerArtifactManifestScaffold',
  'prepareInternalBetaRenderWorkerQaGateScaffold',
  'prepareInternalBetaRenderWorkerCleanupPolicyScaffold',
  'readInternalBetaRenderWorkerStatusScaffold',
  'classifyInternalBetaRenderWorkerFailureScaffold',
]) {
  if (!scaffold.includes(`function ${name}`)) fail(`missing scaffold function ${name}`)
}
for (const required of [
  "status: 'disabled_pending_remotion_render_worker_runtime_gate'",
  'routeExecution: false',
  'workerExecution: false',
  'workerDispatch: false',
  'remotionExecution: false',
  'ffmpegExecution: false',
  'ffprobeExecution: false',
  'mediaProcessing: false',
  'renderExportExecution: false',
  'previewArtifactCreation: false',
  'finalExportCreation: false',
  'storageWrite: false',
  'storageRead: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
  'supabaseMutation: false',
  'creditMutation: false',
  'providerModelCalls: false',
  'internalBetaUnlock: false',
]) {
  if (!scaffold.includes(required)) fail(`missing scaffold boundary ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /registerMockRouteHandler\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
  /createSignedUrl/i,
  /signedUrl:\s*true/i,
]) {
  if (pattern.test(scaffold)) fail(`scaffold contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs'
if (packageJson.scripts?.['rp-render-01:internal-beta-remotion-render-worker-scaffold:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  'supabase/migrations',
  '.dockerignore',
  'database/migration-drafts',
  'database/test-sql',
  'server/routes',
  'server/workers',
]) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    (file !== 'server/services/internal-beta-remotion-render-worker-scaffold.ts' &&
      forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/')) continue
  const text = stripHistoricalSections(read(file))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
