import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/ai-video-broll-generation-dependency-install-plan.md',
  'docs/ai-video-broll-generation-runtime-dependency-matrix.md',
  'docs/ai-video-broll-generation-python-cuda-compatibility-plan.md',
  'docs/ai-video-broll-generation-gate-3-blocker-register.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-4-runtime-gpu-owner-review.md',
]

const requiredSources = [
  'https://huggingface.co/docs/diffusers/en/api/pipelines/wan',
  'https://github.com/Wan-Video/Wan2.1',
  'https://github.com/huggingface/diffusers/blob/main/docs/source/en/api/pipelines/ltx_video.md',
  'https://docs.ltx.video/open-source-model/integration-tools/pytorch-api',
  'https://github.com/genmoai/mochi',
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(path) {
  check(existsSync(path), `Missing required AI video B-roll Gate 3 file: ${path}`)
  return readFileSync(path, 'utf8')
}

function requireText(text, expected, label) {
  check(text.includes(expected), `${label} must include ${expected}`)
}

function rejectAffirmativeClaims(text, label) {
  const forbidden = [
    /dependenciesInstalled:\s*true/i,
    /dependency\s+installed:\s*true/i,
    /virtualEnvironmentCreated:\s*true/i,
    /modelWeightsDownloaded:\s*true/i,
    /weightsDownloaded:\s*true/i,
    /modelImported:\s*true/i,
    /import\s+attempted:\s*true/i,
    /inferenceRun:\s*true/i,
    /modelInferenceRun:\s*true/i,
    /generatedVideoCreated:\s*true/i,
    /docker(?:OrGcp)?Touched:\s*true/i,
    /gcp\s+touched:\s*true/i,
    /supabaseTouched:\s*true/i,
    /supabase\s+mutated:\s*true/i,
    /sqlExecuted:\s*true/i,
    /sql\s+executed:\s*true/i,
    /providerCalled:\s*true/i,
    /workerDispatched:\s*true/i,
    /storageObjectCreated:\s*true/i,
    /signedUrlCreated:\s*true/i,
    /publicArtifactCreated:\s*true/i,
    /creditsMutated:\s*true/i,
    /betaUnlocked:\s*true/i,
    /productionUnlocked:\s*true/i,
    /runtimeReadinessClaimed:\s*true/i,
    /dry_run_passed\s+(claimed|true|passed)/i,
    /generated_local_fixture_passed\s+(claimed|true|passed)/i,
    /(^|\n)\s*(pip|uv|conda|python|docker|supabase|psql)\s+(install|run|start|init|db|migrate|push|pull|clone)\b/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]+/i,
    /service[_-]?role\s*[:=]\s*['"][^'"]+/i,
    /secret\s*[:=]\s*['"][^'"]+/i,
  ]

  for (const pattern of forbidden) {
    check(!pattern.test(text), `${label} contains forbidden install/runtime claim: ${pattern}`)
  }
}

function assertAllFalse(summary) {
  const falseKeys = [
    'dependenciesInstalled',
    'virtualEnvironmentCreated',
    'weightsDownloaded',
    'modelImported',
    'modelInferenceRun',
    'generatedVideoCreated',
    'dockerOrGcpTouched',
    'supabaseTouched',
    'sqlExecuted',
    'providerCalled',
    'workerDispatched',
    'storageObjectCreated',
    'signedUrlCreated',
    'publicArtifactCreated',
    'creditsMutated',
    'betaUnlocked',
    'productionUnlocked',
    'runtimeReadinessClaimed',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]

  for (const key of falseKeys) {
    check(summary[key] === false, `${key} must remain false.`)
  }
}

const contents = new Map(requiredDocs.map((path) => [path, read(path)]))
const combinedDocs = Array.from(contents.values()).join('\n\n')

for (const [path, text] of contents) {
  rejectAffirmativeClaims(text, path)
}

for (const expected of [
  'ai_video_broll_gen_3_dependency_install_plan_completed_ready_for_runtime_gpu_owner_review',
  'Python 3.10',
  'PyTorch',
  'diffusers',
  'Wan / Wan2.1 T2V 1.3B',
  'LTX / LTX-Video',
  'Mochi 1',
  'HunyuanVideo',
  'No dependency is installed',
  'No model weights are downloaded',
  'No model import is attempted',
  'No inference',
  'No generated video',
  'No Docker',
  'No GCP',
  'No Supabase',
  'No SQL',
  'No provider',
  'No worker',
  'AI-VIDEO-BROLL-GEN-4: runtime GPU owner review',
]) {
  requireText(combinedDocs, expected, 'AI video B-roll Gate 3 docs')
}

for (const source of requiredSources) {
  requireText(combinedDocs, source, 'AI video B-roll Gate 3 source evidence')
}

const plan = contents.get('docs/ai-video-broll-generation-dependency-install-plan.md')
const matrix = contents.get('docs/ai-video-broll-generation-runtime-dependency-matrix.md')
const compatibility = contents.get('docs/ai-video-broll-generation-python-cuda-compatibility-plan.md')
const blockers = contents.get('docs/ai-video-broll-generation-gate-3-blocker-register.md')
const prompt = contents.get('docs/implementation-prompts/prompt-ai-video-broll-gen-4-runtime-gpu-owner-review.md')

for (const expected of [
  'Diffusers: preferred shared path for Wan and LTX',
  'ComfyUI packs and third-party runtime bundles: blocked',
  'CPU is not an approved inference target',
]) {
  requireText(plan, expected, 'dependency install plan')
}

for (const expected of [
  'Shared PyTorch + diffusers plan',
  'Media/export stack',
  'blocked and owned by Track A/Track B',
]) {
  requireText(matrix, expected, 'runtime dependency matrix')
}

for (const expected of [
  'small-preview',
  'mid-720p',
  'high-research',
  'premium-gated',
]) {
  requireText(compatibility, expected, 'python cuda compatibility plan')
}

for (const expected of [
  'Runtime GPU owner review missing',
  'Dependency install proof missing',
  'Model import proof missing',
  'Synthetic generation proof missing',
]) {
  requireText(blockers, expected, 'Gate 3 blocker register')
}

for (const expected of [
  'Runtime owner accepts or rejects small-preview',
  'CPU-only boundary remains diagnostics-only.',
  'Next prompt is controlled dependency install proof only if owner acceptance is recorded.',
]) {
  requireText(prompt, expected, 'Gate 4 prompt')
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
check(
  packageJson.scripts?.['ai-video-broll-gen-3:diagnostics'] ===
    'node scripts/validation/ai-video-broll-gen-3-diagnostics.mjs',
  'package.json must include ai-video-broll-gen-3:diagnostics script.',
)

const summary = {
  ok: true,
  decision: 'ai_video_broll_gen_3_dependency_install_plan_completed_ready_for_runtime_gpu_owner_review',
  primaryDependencyLane: 'Wan / Wan2.1 T2V 1.3B via shared PyTorch + diffusers planning',
  secondaryDependencyLane: 'LTX / LTX-Video via shared PyTorch + diffusers planning',
  fallbackDependencyLane: 'Mochi 1 via uv-style isolated Python planning',
  blockedModel: 'HunyuanVideo',
  dependenciesInstalled: false,
  virtualEnvironmentCreated: false,
  weightsDownloaded: false,
  modelImported: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  dockerOrGcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  providerCalled: false,
  workerDispatched: false,
  storageObjectCreated: false,
  signedUrlCreated: false,
  publicArtifactCreated: false,
  creditsMutated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  runtimeReadinessClaimed: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: 'AI-VIDEO-BROLL-GEN-4: runtime GPU owner review',
}

assertAllFalse(summary)

console.log(JSON.stringify(summary, null, 2))
