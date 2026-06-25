import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/ai-video-broll-generation-runtime-gpu-owner-review.md',
  'docs/ai-video-broll-generation-runtime-gpu-tier-decision.md',
  'docs/ai-video-broll-generation-runtime-owner-acceptance-map.md',
  'docs/ai-video-broll-generation-gate-4-blocker-register.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-5-controlled-dependency-install-proof.md',
]

const requiredInputs = [
  'docs/production-gpu-tool-readiness-policy.md',
  'docs/production-model-weight-readiness-plan.md',
  'docs/activation-gcp-staging-command-policy.md',
  'docs/activation-gcp-staging-resource-map.md',
  'docs/activation-phase-39c-sg-cloudrun-l4-cuda-compatibility.md',
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(path) {
  check(existsSync(path), `Missing required AI video B-roll Gate 4 file: ${path}`)
  return readFileSync(path, 'utf8')
}

function requireText(text, expected, label) {
  check(text.includes(expected), `${label} must include ${expected}`)
}

function rejectAffirmativeClaims(text, label) {
  const forbidden = [
    /globalRuntimeExecutionAllowed:\s*true/i,
    /dependenciesInstalled:\s*true/i,
    /dependency\s+installed:\s*true/i,
    /virtualEnvironmentCreated:\s*true/i,
    /modelWeightsDownloaded:\s*true/i,
    /weightsDownloaded:\s*true/i,
    /modelImported:\s*true/i,
    /inferenceRun:\s*true/i,
    /modelInferenceRun:\s*true/i,
    /generatedVideoCreated:\s*true/i,
    /docker(?:OrGcp)?Touched:\s*true/i,
    /gcp\s+touched:\s*true/i,
    /cloud\s+command\s+run:\s*true/i,
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
    /(^|\n)\s*(gcloud|docker|supabase|psql|pip|uv|conda|python)\s+(run|start|build|push|deploy|install|db|migrate|init|clone)\b/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]+/i,
    /service[_-]?role\s*[:=]\s*['"][^'"]+/i,
    /secret\s*[:=]\s*['"][^'"]+/i,
  ]

  for (const pattern of forbidden) {
    check(!pattern.test(text), `${label} contains forbidden runtime/GPU claim: ${pattern}`)
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

for (const path of requiredInputs) {
  read(path)
}

for (const [path, text] of contents) {
  rejectAffirmativeClaims(text, path)
}

for (const expected of [
  'conditional_runtime_gpu_acceptance_for_future_dependency_install_proof',
  'small_preview_gpu',
  'mid_720p_gpu',
  'high_research_gpu',
  'premium_gated_gpu',
  'cloud_gpu_job',
  'Wan / Wan2.1 T2V 1.3B',
  'LTX / LTX-Video',
  'Mochi 1',
  'HunyuanVideo',
  'globalRuntimeExecutionAllowed: false',
  'futureDependencyInstallProofAllowedAfterPreflight: true',
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
  'AI-VIDEO-BROLL-GEN-5: controlled dependency install proof, no weights/no inference',
]) {
  requireText(combinedDocs, expected, 'AI video B-roll Gate 4 docs')
}

const review = contents.get('docs/ai-video-broll-generation-runtime-gpu-owner-review.md')
const tierDecision = contents.get('docs/ai-video-broll-generation-runtime-gpu-tier-decision.md')
const ownerMap = contents.get('docs/ai-video-broll-generation-runtime-owner-acceptance-map.md')
const blockers = contents.get('docs/ai-video-broll-generation-gate-4-blocker-register.md')
const prompt = contents.get('docs/implementation-prompts/prompt-ai-video-broll-gen-5-controlled-dependency-install-proof.md')

for (const expected of [
  'No raw prompt execution',
  'No public service endpoint',
  'No model auto-download',
  'No user media',
]) {
  requireText(review, expected, 'runtime GPU owner review')
}

for (const expected of [
  'Gate 4 does not query or mutate Google Cloud.',
  'job-only',
  'No Cloud Run/GCP execution unless a later prompt explicitly authorizes it.',
]) {
  requireText(tierDecision + review, expected, 'runtime GPU tier decision')
}

for (const expected of [
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'PRODUCT_BETA_READINESS',
  'COMPLIANCE_SECURITY',
]) {
  requireText(ownerMap, expected, 'runtime owner acceptance map')
}

for (const expected of [
  'Controlled dependency install proof missing',
  'GCP/cloud GPU execution not accepted',
  'Hunyuan legal/territory/commercial review missing',
]) {
  requireText(blockers, expected, 'Gate 4 blocker register')
}

for (const expected of [
  'No model weights.',
  'No model import.',
  'No generated video.',
  'Next prompt is controlled weight download proof only if dependency install proof passes.',
]) {
  requireText(prompt, expected, 'Gate 5 prompt')
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
check(
  packageJson.scripts?.['ai-video-broll-gen-4:diagnostics'] ===
    'node scripts/validation/ai-video-broll-gen-4-diagnostics.mjs',
  'package.json must include ai-video-broll-gen-4:diagnostics script.',
)

const summary = {
  ok: true,
  decision: 'conditional_runtime_gpu_acceptance_for_future_dependency_install_proof',
  smallPreviewGpuConditionallyAccepted: true,
  mid720pGpuPlanningOnly: true,
  highResearchGpuPlanningOnly: true,
  premiumGatedGpuBlocked: true,
  cloudGpuHandoffOnly: true,
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
  nextPrompt: 'AI-VIDEO-BROLL-GEN-5: controlled dependency install proof, no weights/no inference',
}

assertAllFalse(summary)

console.log(JSON.stringify(summary, null, 2))
