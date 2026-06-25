import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/ai-video-broll-generation-owner-lane.md',
  'docs/ai-video-broll-generation-model-candidate-matrix.md',
  'docs/ai-video-broll-generation-model-selection-decision.md',
  'docs/ai-video-broll-generation-license-provenance-plan.md',
  'docs/ai-video-broll-generation-weight-download-storage-policy.md',
  'docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md',
  'docs/ai-video-broll-generation-product-integration-plan.md',
  'docs/ai-video-broll-generation-safety-content-policy-plan.md',
  'docs/ai-video-broll-generation-beta-readiness-blocker-register.md',
  'docs/ai-video-broll-generation-implementation-roadmap.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-1-license-provenance-approval.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-2-weight-source-checksum-plan.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-3-runtime-gpu-owner-review.md',
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(path) {
  check(existsSync(path), `Missing required AI video B-roll file: ${path}`)
  return readFileSync(path, 'utf8')
}

function requireText(text, expected, label) {
  check(text.includes(expected), `${label} must include ${expected}`)
}

function rejectAffirmativeClaims(text, label) {
  const forbidden = [
    /model\s+weights\s+downloaded:\s*true/i,
    /weightsDownloaded:\s*true/i,
    /weights\s+downloaded:\s*yes/i,
    /model\s+inference\s+run:\s*true/i,
    /modelInferenceRun:\s*true/i,
    /inference\s+run:\s*yes/i,
    /generated\s+video\s+created:\s*true/i,
    /generatedVideoCreated:\s*true/i,
    /generated\s+video\s+created:\s*yes/i,
    /docker(?:OrGcp)?Touched:\s*true/i,
    /gcp\s+touched:\s*true/i,
    /cloud\s+run\s+called:\s*true/i,
    /supabaseTouched:\s*true/i,
    /supabase\s+mutated:\s*true/i,
    /sqlExecuted:\s*true/i,
    /sql\s+executed:\s*true/i,
    /signed\s+url\s+created:\s*true/i,
    /public\s+artifact\s+created:\s*true/i,
    /provider\s+called:\s*true/i,
    /worker\s+dispatched:\s*true/i,
    /route\s+executed:\s*true/i,
    /betaUnlocked:\s*true/i,
    /beta\s+unlocked:\s*true/i,
    /production\s+unlocked:\s*true/i,
    /runtimeReadinessClaimed:\s*true/i,
    /runtime\s+readiness\s+claimed:\s*true/i,
    /dry_run_passed\s+(claimed|true|passed)/i,
    /generated_local_fixture_passed\s+(claimed|true|passed)/i,
  ]

  for (const pattern of forbidden) {
    check(!pattern.test(text), `${label} contains forbidden affirmative claim: ${pattern}`)
  }
}

const contents = new Map(requiredDocs.map((path) => [path, read(path)]))
const combinedDocs = Array.from(contents.values()).join('\n\n')

for (const [path, text] of contents) {
  rejectAffirmativeClaims(text, path)
}

for (const expected of [
  'AI_VIDEO_BROLL_GENERATION',
  'Wan',
  'Wan2.1',
  'LTX',
  'LTX-Video',
  'Mochi',
  'Mochi 1',
  'HunyuanVideo',
  'optional premium gated',
  'No model weights are downloaded',
  'No inference',
  'No generated video',
  'No Docker',
  'No Supabase',
  'No SQL',
  'No model is beta-approved',
  'AI-VIDEO-BROLL-GEN-1: license/provenance approval',
]) {
  requireText(combinedDocs, expected, 'AI video B-roll docs')
}

const ownerLane = contents.get('docs/ai-video-broll-generation-owner-lane.md')
const matrix = contents.get('docs/ai-video-broll-generation-model-candidate-matrix.md')
const decision = contents.get('docs/ai-video-broll-generation-model-selection-decision.md')
const blockerRegister = contents.get('docs/ai-video-broll-generation-beta-readiness-blocker-register.md')
const roadmap = contents.get('docs/ai-video-broll-generation-implementation-roadmap.md')

requireText(ownerLane, 'Owner Lane', 'owner lane doc')
requireText(ownerLane, 'SOUND_MUSIC_AUDIO', 'owner lane doc')
requireText(ownerLane, 'TRACK_A_RENDER_EXPORT', 'owner lane doc')
requireText(ownerLane, 'TRACK_B_MEDIA_PROCESSING', 'owner lane doc')
requireText(ownerLane, 'WORKER_RUNTIME_JOBS', 'owner lane doc')
requireText(ownerLane, 'PROVIDER_GATEWAY_MODELS', 'owner lane doc')
requireText(ownerLane, 'SUPABASE_RLS_STORAGE_DATABASE', 'owner lane doc')
requireText(ownerLane, 'BILLING_STRIPE_CREDITS', 'owner lane doc')
requireText(ownerLane, 'PRODUCT_BETA_READINESS', 'owner lane doc')
requireText(ownerLane, 'COMPLIANCE_SECURITY', 'owner lane doc')

requireText(matrix, 'primary', 'model matrix')
requireText(matrix, 'secondary', 'model matrix')
requireText(matrix, 'fallback/research', 'model matrix')
requireText(matrix, 'optional premium gated', 'model matrix')
requireText(matrix, 'https://github.com/Wan-Video/Wan2.1', 'model matrix')
requireText(matrix, 'https://github.com/Lightricks/ltx-video', 'model matrix')
requireText(matrix, 'https://huggingface.co/Lightricks/LTX-Video', 'model matrix')
requireText(matrix, 'https://github.com/genmoai/mochi', 'model matrix')
requireText(matrix, 'https://github.com/Tencent-Hunyuan/HunyuanVideo', 'model matrix')

requireText(decision, 'Primary | Wan / Wan2.1 family', 'model selection decision')
requireText(decision, 'Secondary | LTX / LTX-Video', 'model selection decision')
requireText(decision, 'Fallback/research | Mochi 1', 'model selection decision')
requireText(decision, 'Optional premium gated | HunyuanVideo', 'model selection decision')

for (const blocker of [
  'License/provenance not approved',
  'Model weights not downloaded',
  'Dependencies not installed',
  'GPU runtime not approved',
  'Docker image not created',
  'Worker dispatch not approved',
  'Route/tool execution not approved',
  'Supabase/storage/artifacts not approved',
  'Cost/billing not approved',
  'Moderation not approved',
  'Generated video proof not run',
  'User media policy not approved',
  'Internal beta not approved',
  'External beta not approved',
  'Production not approved',
]) {
  requireText(blockerRegister, blocker, 'beta blocker register')
}

for (const gate of [
  'AI-VIDEO-BROLL-GEN-0 owner/model plan',
  'AI-VIDEO-BROLL-GEN-1 license/provenance approval',
  'AI-VIDEO-BROLL-GEN-2 weight source/checksum plan',
  'AI-VIDEO-BROLL-GEN-3 dependency install plan',
  'AI-VIDEO-BROLL-GEN-4 GPU/runtime architecture owner review',
  'AI-VIDEO-BROLL-GEN-5 controlled model weight download proof',
  'AI-VIDEO-BROLL-GEN-6 model loader/import proof',
  'AI-VIDEO-BROLL-GEN-7 synthetic prompt generation proof',
  'AI-VIDEO-BROLL-GEN-8 worker image plan',
  'AI-VIDEO-BROLL-GEN-9 private generated B-roll proof',
  'AI-VIDEO-BROLL-GEN-10 internal beta readiness review',
]) {
  requireText(roadmap, gate, 'implementation roadmap')
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
check(
  packageJson.scripts?.['ai-video-broll-gen-0:diagnostics'] ===
    'node scripts/validation/ai-video-broll-gen-0-diagnostics.mjs',
  'package.json must include ai-video-broll-gen-0:diagnostics script.',
)

console.log(JSON.stringify({
  ok: true,
  decision: 'ai_video_broll_gen_0_owner_model_selection_plan_completed_with_warnings_ready_for_license_provenance',
  ownerLaneCreated: true,
  primaryModel: 'Wan / Wan2.1 family',
  secondaryModel: 'LTX / LTX-Video',
  fallbackModel: 'Mochi 1',
  optionalGatedModel: 'HunyuanVideo',
  weightsDownloaded: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  dockerOrGcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  betaUnlocked: false,
  runtimeReadinessClaimed: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
}, null, 2))
