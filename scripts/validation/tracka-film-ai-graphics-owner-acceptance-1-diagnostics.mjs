#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-FILM-AI-GRAPHICS-OWNER-ACCEPTANCE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/film-frame-interpolation/ai-graphics-owner-acceptance-1'
const requiredFiles = [
  `${packetDir}/owner-acceptance.md`,
  `${packetDir}/owner-acceptance.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/ownership-boundary.md`,
  `${packetDir}/ownership-boundary.json`,
  `${packetDir}/model-weight-boundary.md`,
  `${packetDir}/model-weight-boundary.json`,
  `${packetDir}/gpu-runtime-boundary.md`,
  `${packetDir}/gpu-runtime-boundary.json`,
  `${packetDir}/blocked-scope-register.md`,
  `${packetDir}/readiness-report.json`,
  'docs/activation-phase-tracka-film-ai-graphics-owner-acceptance-1-results.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/implementation-prompts/prompt-ai-graphics-film-owner-acceptance-handoff-1.md',
  'docs/implementation-prompts/prompt-tracka-film-ai-graphics-owner-acceptance-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-gpu-policy-review-1.md',
  'docs/implementation-prompts/prompt-tracka-ai-graphics-film-coordination-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-owner-approval-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-film-ai-graphics-owner-acceptance-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/tracka-film-frame-interpolation-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-film-gpu-policy-ai-graphics-coordination-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime',
  'completed_docs_only_owner_acceptance_check_no_install_or_runtime',
  'AI Graphics / Worker acceptance: `not_present_in_source`',
  'aiGraphicsWorkerAcceptance',
  'not_present_in_source',
  '#544',
  '#547',
  '#717',
  '#721',
  '#732',
  '#577 remains open/draft/blocked/conflicting and excluded as source-of-truth',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1 decision: blocked_pending_gpu_heavy_runtime_policy_and_ai_graphics_coordination',
  'TRACKA-FILM-GPU-POLICY-AI-GRAPHICS-COORDINATION-1 decision: blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy',
  'film_frame_interpolation',
  'atlas_tracka_scoped_capability_label_only',
  'render_export_capability_label_acceptance_criteria_and_future_handoff_requirements',
  'required_for_model_runtime_model_weights_gpu_execution_and_ml_dependency_policy',
  'blocked_pending_ai_graphics_owner_acceptance_and_gpu_heavy_runtime_policy',
  'blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy',
  'blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_model_weight_policy_and_worker_runtime_lane',
  'not_accessed_and_not_approved',
  'not_configured_and_not_approved',
  'AI_GRAPHICS_FILM_OWNER_ACCEPTANCE_HANDOFF_1',
  'TRACKA-REVIDEO-OWNER-APPROVAL-1',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: still_blocked_pending_worker_supabase_remotion_and_tracka_private_e2e_gates',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'blocked_pending_owner_approved_package_source',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Next Supabase action: `none`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Dockerfile install-source change: `none`',
  'Requirements install-source change: `none`',
  'Package installation: `none`',
  'Dependency mutation: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FILM execution, model call, model weight access, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FFmpeg/FFprobe execution, Docker build, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /accepted_by_ai_graphics_owner_for_film_runtime/i,
  /accepted_for_runtime_planning_only/i,
  /rejected_by_ai_graphics_owner_for_film_runtime/i,
  /rejected_for_runtime/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /private fixture execution:\s*`?(true|completed|enabled|run|executed)/i,
  /FILM execution:\s*`?(completed|passed|true|run|executed|enabled)/i,
  /FILM runtime:\s*`?(completed|passed|true|run|executed|enabled)/i,
  /model call:\s*`?(completed|passed|true|run|executed|enabled)/i,
  /model weight access:\s*`?(completed|passed|true|run|executed|enabled)/i,
  /model weights?:\s*`?(accessed|downloaded|available|present|checked|hashed|loaded|approved)/i,
  /GPU runtime:\s*`?(installed|configured|enabled|available|approved|true)/i,
  /TensorFlow(?: runtime| package| install)?:\s*`?(installed|enabled|available|true)/i,
  /PyTorch(?: runtime| package| install)?:\s*`?(installed|enabled|available|true)/i,
  /AI Graphics \/ Worker acceptance:\s*`?(accepted|approved|rejected)/i,
  /FILM install proof readiness:\s*`?(ready|enabled|unblocked|approved)/i,
  /FILM runtime proof readiness:\s*`?(ready|enabled|unblocked|approved)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /final render\/export:\s*`?(completed|enabled|true|run)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GStreamer execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /GPAC\/MP4Box execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /Revideo execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build:\s*`?(completed|passed|true|run|executed)/i,
  /Docker push\/deploy:\s*`?(completed|passed|true|run|executed)/i,
  /Remotion execution:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true)/i,
  /package installation:\s*`?(completed|enabled|true)/i,
  /Dockerfile install-source change:\s*`?(completed|enabled|true|added|changed)/i,
  /requirements install-source change:\s*`?(completed|enabled|true|added|changed)/i,
  /TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness:\s*`?(ready|enabled|unblocked)/i,
]

const forbiddenPathPrefixes = [
  'docker/',
  'src/',
  'server/',
  'database/',
  'supabase/',
  'public/',
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
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

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const script = packageJson.scripts?.['tracka:film-ai-graphics-owner-acceptance-1:diagnostics']
if (script !== 'node scripts/validation/tracka-film-ai-graphics-owner-acceptance-1-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of [
    'film',
    'tensorflow',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-node',
    'torch',
    'pytorch',
    'opencv',
    'opencv4nodejs',
    'gpac',
    'bento4',
    'vapoursynth',
    'python3-vapoursynth',
    'revideo',
    '@revideo/core',
    '@revideo/renderer',
  ]) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')

for (const file of [
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
  '.dockerignore',
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
    forbiddenPathPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.pt') ||
    file.endsWith('.pth') ||
    file.endsWith('.onnx') ||
    file.endsWith('.ckpt')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (file.startsWith('scripts/validation/')) continue
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  const text = read(file)
  for (const phrase of [
    'FILM execution `completed`',
    'FILM execution: `completed`',
    'model call: `completed`',
    'model weight access: `completed`',
    'model weights: `accessed`',
    'GPU runtime: `configured`',
    'AI Graphics / Worker acceptance: `accepted`',
    'AI Graphics / Worker acceptance: `approved`',
    'Docker build `completed`',
    'Docker build: `completed`',
    'Docker push: `completed`',
    'signed URL creation: `completed`',
    'public artifact creation: `completed`',
    'internal beta unlock: `enabled`',
    'external beta unlock: `enabled`',
    'production unlock: `enabled`',
    'package-lock: `changed`',
    'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: ready',
  ]) {
    if (text.includes(phrase)) fail(`forbidden source phrase in ${file}: ${phrase}`)
  }
}

console.log(`${packet} diagnostics passed`)
