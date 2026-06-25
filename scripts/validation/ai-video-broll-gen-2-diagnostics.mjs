import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/ai-video-broll-generation-weight-source-checksum-plan.md',
  'docs/ai-video-broll-generation-weight-source-manifest-plan.md',
  'docs/ai-video-broll-generation-checksum-private-cache-policy.md',
  'docs/ai-video-broll-generation-gate-2-blocker-register.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-3-dependency-install-plan.md',
]

const requiredSources = [
  'https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B',
  'https://www.modelscope.ai/models/Wan-AI/Wan2.1-T2V-1.3B',
  'https://huggingface.co/Wan-AI/Wan2.1-T2V-14B',
  'https://huggingface.co/Lightricks/LTX-Video',
  'https://huggingface.co/Lightricks/LTX-2',
  'https://huggingface.co/Lightricks/LTX-2.3',
  'https://huggingface.co/genmo/mochi-1-preview',
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(path) {
  check(existsSync(path), `Missing required AI video B-roll Gate 2 file: ${path}`)
  return readFileSync(path, 'utf8')
}

function requireText(text, expected, label) {
  check(text.includes(expected), `${label} must include ${expected}`)
}

function rejectAffirmativeClaims(text, label) {
  const forbidden = [
    /downloadApproved:\s*true/i,
    /downloadCompleted:\s*true/i,
    /weightsDownloaded:\s*true/i,
    /weights\s+downloaded:\s*yes/i,
    /dependenciesInstalled:\s*true/i,
    /dependency\s+installed:\s*true/i,
    /checksumVerified:\s*true/i,
    /checksum\s+computed:\s*true/i,
    /inferenceRun:\s*true/i,
    /modelInferenceRun:\s*true/i,
    /generatedVideoCreated:\s*true/i,
    /generated\s+video\s+created:\s*yes/i,
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
    /betaApproved:\s*true/i,
    /betaUnlocked:\s*true/i,
    /productionApproved:\s*true/i,
    /productionUnlocked:\s*true/i,
    /runtimeReadinessClaimed:\s*true/i,
    /dry_run_passed\s+(claimed|true|passed)/i,
    /generated_local_fixture_passed\s+(claimed|true|passed)/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]+/i,
    /service[_-]?role\s*[:=]\s*['"][^'"]+/i,
    /secret\s*[:=]\s*['"][^'"]+/i,
  ]

  for (const pattern of forbidden) {
    check(!pattern.test(text), `${label} contains forbidden affirmative claim: ${pattern}`)
  }
}

function assertAllFalse(summary) {
  const falseKeys = [
    'weightsDownloaded',
    'dependenciesInstalled',
    'checksumComputed',
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
  'ai_video_broll_gen_2_weight_source_checksum_plan_completed_ready_for_dependency_install_plan',
  'Wan-AI/Wan2.1-T2V-1.3B',
  'Wan-AI/Wan2.1-T2V-14B',
  'Lightricks/LTX-Video',
  'Lightricks/LTX-2',
  'Lightricks/LTX-2.3',
  'genmo/mochi-1-preview',
  'HunyuanVideo',
  'blocked',
  'sha256',
  'No model weights are downloaded',
  'No cache directory is created',
  'No checksum is computed',
  'No Supabase',
  'No SQL',
  'No worker',
  'No provider',
  'AI-VIDEO-BROLL-GEN-3: dependency install plan',
]) {
  requireText(combinedDocs, expected, 'AI video B-roll Gate 2 docs')
}

for (const source of requiredSources) {
  requireText(combinedDocs, source, 'AI video B-roll Gate 2 source evidence')
}

const plan = contents.get('docs/ai-video-broll-generation-weight-source-checksum-plan.md')
const manifest = contents.get('docs/ai-video-broll-generation-weight-source-manifest-plan.md')
const cachePolicy = contents.get('docs/ai-video-broll-generation-checksum-private-cache-policy.md')
const blockers = contents.get('docs/ai-video-broll-generation-gate-2-blocker-register.md')
const prompt = contents.get('docs/implementation-prompts/prompt-ai-video-broll-gen-3-dependency-install-plan.md')

for (const expected of [
  'First cost-friendly source candidate',
  'not first download target',
  'not conflated with original LTX-Video',
  'No checksum is computed in Gate 2 because no model file is downloaded.',
]) {
  requireText(plan, expected, 'weight source checksum plan')
}

for (const expected of [
  'downloadApproved: false',
  'downloadCompleted: false',
  'checksumVerified: false',
  'dependenciesInstalled: false',
  'inferenceRun: false',
  'generatedVideoCreated: false',
]) {
  requireText(manifest, expected, 'weight source manifest plan')
}

for (const expected of [
  'Cache path must be private and gitignored.',
  'Signed URL tokens',
  'Raw prompts as worker payloads',
]) {
  requireText(cachePolicy, expected, 'checksum private cache policy')
}

for (const expected of [
  'Dependency install plan missing',
  'GPU/VRAM cost tier not accepted',
  'Hunyuan legal/territory/commercial review missing',
  'Beta readiness missing',
]) {
  requireText(blockers, expected, 'Gate 2 blocker register')
}

for (const expected of [
  'Dependency options are ranked by cost and GPU requirements.',
  'CPU-only boundaries are explicit.',
  'Next prompt is runtime GPU owner review only if dependency planning is accepted.',
]) {
  requireText(prompt, expected, 'Gate 3 prompt')
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
check(
  packageJson.scripts?.['ai-video-broll-gen-2:diagnostics'] ===
    'node scripts/validation/ai-video-broll-gen-2-diagnostics.mjs',
  'package.json must include ai-video-broll-gen-2:diagnostics script.',
)

const summary = {
  ok: true,
  decision: 'ai_video_broll_gen_2_weight_source_checksum_plan_completed_ready_for_dependency_install_plan',
  plannedPrimarySource: 'Wan-AI/Wan2.1-T2V-1.3B',
  plannedSecondarySource: 'Lightricks/LTX-Video',
  plannedFallbackSource: 'genmo/mochi-1-preview',
  blockedModel: 'HunyuanVideo',
  checksumAlgorithm: 'sha256',
  weightsDownloaded: false,
  dependenciesInstalled: false,
  checksumComputed: false,
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
  nextPrompt: 'AI-VIDEO-BROLL-GEN-3: dependency install plan',
}

assertAllFalse(summary)

console.log(JSON.stringify(summary, null, 2))
