import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/ai-video-broll-generation-license-provenance-approval.md',
  'docs/ai-video-broll-generation-license-provenance-evidence-matrix.md',
  'docs/ai-video-broll-generation-weight-source-eligibility-decision.md',
  'docs/ai-video-broll-generation-license-blocker-register.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-2-weight-source-checksum-plan.md',
]

const requiredSources = [
  'https://github.com/Wan-Video/Wan2.1',
  'https://github.com/Wan-Video/Wan2.1/blob/main/LICENSE.txt',
  'https://github.com/Lightricks/LTX-Video',
  'https://github.com/Lightricks/LTX-Video/blob/main/LICENSE',
  'https://huggingface.co/Lightricks/LTX-Video',
  'https://static.lightricks.com/legal/LTX-Video-Open-Weights-License-0.X.pdf',
  'https://github.com/Lightricks/LTX-2/blob/main/LICENSE',
  'https://github.com/genmoai/mochi',
  'https://huggingface.co/genmo/mochi-1-preview',
  'https://github.com/Tencent-Hunyuan/HunyuanVideo',
  'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE',
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(path) {
  check(existsSync(path), `Missing required AI video B-roll Gate 1 file: ${path}`)
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
    /dependency\s+installed:\s*true/i,
    /dependencies\s+installed:\s*true/i,
    /model\s+inference\s+run:\s*true/i,
    /modelInferenceRun:\s*true/i,
    /inference\s+run:\s*yes/i,
    /generated\s+video\s+created:\s*true/i,
    /generatedVideoCreated:\s*true/i,
    /generated\s+video\s+created:\s*yes/i,
    /docker(?:OrGcp)?Touched:\s*true/i,
    /docker\s+run:\s*true/i,
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
    /credit\s+(estimate|approval|reservation|spend)\s+created:\s*true/i,
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

function assertAllFalse(summary) {
  const falseKeys = [
    'weightsDownloaded',
    'dependenciesInstalled',
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
  'AI_VIDEO_BROLL_GENERATION',
  'ai_video_broll_gen_1_license_provenance_approval_completed_with_warnings_ready_for_weight_source_checksum_plan',
  'Wan',
  'Wan2.1',
  'LTX',
  'LTX-Video',
  'Mochi',
  'Mochi 1',
  'HunyuanVideo',
  'approved_for_weight_source_checksum_planning',
  'approved_for_weight_source_checksum_planning_with_version_split_required',
  'blocked_pending_legal_territory_commercial_review',
  'No model weights are downloaded',
  'No dependency is installed',
  'No inference',
  'No generated video',
  'No Docker',
  'No Supabase',
  'No SQL',
  'No provider is called',
  'No worker is dispatched',
  'No beta',
  'AI-VIDEO-BROLL-GEN-2: weight source/checksum plan',
]) {
  requireText(combinedDocs, expected, 'AI video B-roll Gate 1 docs')
}

for (const source of requiredSources) {
  requireText(combinedDocs, source, 'AI video B-roll Gate 1 source evidence')
}

const approval = contents.get('docs/ai-video-broll-generation-license-provenance-approval.md')
const matrix = contents.get('docs/ai-video-broll-generation-license-provenance-evidence-matrix.md')
const eligibility = contents.get('docs/ai-video-broll-generation-weight-source-eligibility-decision.md')
const blockers = contents.get('docs/ai-video-broll-generation-license-blocker-register.md')
const prompt = contents.get('docs/implementation-prompts/prompt-ai-video-broll-gen-2-weight-source-checksum-plan.md')

for (const expected of [
  'Wan / Wan2.1 may proceed to weight source and checksum planning.',
  'Mochi 1 may proceed to weight source and checksum planning.',
  'LTX / LTX-Video may proceed to weight source and checksum planning only with exact version split',
  'HunyuanVideo may not proceed to weight download planning',
]) {
  requireText(approval, expected, 'license provenance approval')
}

for (const expected of [
  'version-sensitive',
  'territory limits',
  'Direct/magnet download paths are not approved by Gate 1',
  'Generated outputs still require ReEditPro provenance',
]) {
  requireText(matrix, expected, 'license evidence matrix')
}

for (const expected of [
  'Eligible For Gate 2 Planning',
  'Not Eligible For Gate 2 Planning',
  'HunyuanVideo | Blocked',
  'No tool calls are enabled by this decision.',
]) {
  requireText(eligibility, expected, 'weight source eligibility decision')
}

for (const expected of [
  'LTX version/license split unresolved',
  'Hunyuan territory and commercial terms unresolved',
  'Runtime route not implemented',
  'Beta readiness not approved',
]) {
  requireText(blockers, expected, 'license blocker register')
}

for (const expected of [
  'Eligible candidates:',
  'Blocked candidate:',
  'Hunyuan remains blocked.',
  'Next prompt is dependency/runtime install planning only if weight sources/checksum plans are accepted.',
]) {
  requireText(prompt, expected, 'Gate 2 prompt')
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
check(
  packageJson.scripts?.['ai-video-broll-gen-1:diagnostics'] ===
    'node scripts/validation/ai-video-broll-gen-1-diagnostics.mjs',
  'package.json must include ai-video-broll-gen-1:diagnostics script.',
)

const summary = {
  ok: true,
  decision: 'ai_video_broll_gen_1_license_provenance_approval_completed_with_warnings_ready_for_weight_source_checksum_plan',
  primaryModel: 'Wan / Wan2.1 family',
  secondaryModel: 'LTX / LTX-Video',
  fallbackModel: 'Mochi 1',
  blockedModel: 'HunyuanVideo',
  ltxVersionSplitRequired: true,
  eligibleForWeightSourcePlanning: ['Wan / Wan2.1 family', 'LTX / LTX-Video with version split', 'Mochi 1'],
  blockedBeforeWeightSourcePlanning: ['HunyuanVideo'],
  weightsDownloaded: false,
  dependenciesInstalled: false,
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
  nextPrompt: 'AI-VIDEO-BROLL-GEN-2: weight source/checksum plan',
}

assertAllFalse(summary)

console.log(JSON.stringify(summary, null, 2))
