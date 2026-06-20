#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/track-a/tracka-native-container-package-identity-batch-1.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-source-audit.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-duplicate-scan.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-bento4-mp4box-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-vapoursynth-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-revideo-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-hyperframe-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-tool-matrix.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-next-phase-plan.md',
  'docs/activation-phase-tracka-native-container-package-identity-batch-1-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-batch-2r-confirmed-build.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
]

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-PACKAGE-IDENTITY-BATCH-1 decision: completed_package_identity_policy_reviews_no_install_changes',
  'Execution: `completed_docs_only_identity_policy_review`',
  'Product-ready end-to-end local OSS tools: `0`',
  'resolved_mp4box_provider_gpac_ready_for_future_install_proof',
  'resolved_vapoursynth_native_policy_ready_for_future_install_proof',
  'resolved_revideo_package_identity_ready_for_future_install_proof',
  'handoff_only_no_install_source_change',
  '#601',
  '#609 remains draft/blocked',
  '#577 remains draft/blocked',
  'GPAC MP4Box evidence',
  'Bento4 evidence',
  'VapourSynth packaging evidence',
  'Revideo installation evidence',
  'FFmpeg and FFprobe remain Track B-owned shared dependencies only',
  'AI Graphics / Worker tools are not claimed',
  'Supabase update status: `not_applicable_docs_only`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, media processing, runtime media execution, Docker build, FFmpeg/FFprobe execution, package installation, dependency mutation, or broad service-role handler was enabled.',
]

function fail(message) {
  console.error(`TRACKA-NATIVE-CONTAINER-PACKAGE-IDENTITY-BATCH-1 diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

function requireValue(label, expected) {
  const escapedLabel = label.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  const pattern = new RegExp(escapedLabel + ':\\s*`?([^`\\n]+)`?', 'i')
  const match = corpus.match(pattern)
  if (!match) fail(`missing value for ${label}`)
  if (match[1].trim() !== expected) fail(`unexpected value for ${label}: ${match[1].trim()}`)
}

requireValue('Supabase environment touched', 'none')
requireValue('SQL executed', 'none')
requireValue('Migration deployed', 'no')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['tracka:native-container-package-identity-batch-1:diagnostics'] !== 'node scripts/validation/tracka-native-container-package-identity-batch-1-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const forbiddenDirectDeps = ['gpac', 'bento4', 'vapoursynth', 'revideo', '@revideo/core', '@revideo/renderer', 'hyperframe']
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of forbiddenDirectDeps) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
}

try {
  execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('package-lock.json changed')
}

const trackedChanges = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8', env: gitEnv }).trim().split('\n').filter(Boolean)
const untrackedChanges = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8', env: gitEnv }).trim().split('\n').filter(Boolean)
const changed = [...new Set([...trackedChanges, ...untrackedChanges])]
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^docker\//,
  /^src\//,
  /^server\//,
  /^database\//,
  /^supabase\//,
  /\.sql$/i,
]
for (const changedFile of changed) {
  if (forbiddenPathPatterns.some((pattern) => pattern.test(changedFile))) {
    fail(`forbidden changed path ${changedFile}`)
  }
}

const forbiddenPositiveClaims = [
  /Docker build:\s*`?(completed|passed|success)/i,
  /Runtime execution:\s*`?(completed|true|run)/i,
  /runtimeExecution:\s*`?(completed|true|run)/i,
  /media processing:\s*`?(completed|true|run|enabled)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|true|run|enabled)/i,
  /internal beta unlocked:\s*`?true/i,
  /external beta unlocked:\s*`?true/i,
  /production unlocked:\s*`?true/i,
  /package-lock:\s*`?changed/i,
]
for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(corpus)) fail(`forbidden positive claim matched ${pattern}`)
}

console.log('TRACKA-NATIVE-CONTAINER-PACKAGE-IDENTITY-BATCH-1 diagnostics passed')
console.log('Decision: completed_package_identity_policy_reviews_no_install_changes')
console.log('Execution: completed_docs_only_identity_policy_review')
console.log('Bento4/MP4Box: resolved_mp4box_provider_gpac_ready_for_future_install_proof')
console.log('VapourSynth: resolved_vapoursynth_native_policy_ready_for_future_install_proof')
console.log('Revideo: resolved_revideo_package_identity_ready_for_future_install_proof')
console.log('Hyperframe: handoff_only_no_install_source_change')
console.log('Package-lock: unchanged')
console.log('Product-ready end-to-end local OSS tools: 0')
