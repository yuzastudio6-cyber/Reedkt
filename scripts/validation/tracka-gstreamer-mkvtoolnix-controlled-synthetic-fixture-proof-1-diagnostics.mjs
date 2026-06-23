import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-source-audit.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-runtime-result.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-command-matrix.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-fixture-policy.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-artifact-manifest-summary.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-duplicate-scan.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-blocked-scope-register.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-next-phase-plan.md',
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
]

const requiredFiles = [
  ...requiredDocs,
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
]

const privateFixtureScopeDecisionFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/synthetic-evidence-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/synthetic-evidence-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-policy-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-policy-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/trackb-ffmpeg-ffprobe-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/trackb-ffmpeg-ffprobe-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/render-export-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/render-export-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/artifact-privacy-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/artifact-privacy-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/future-command-scope-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/future-command-scope-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/validation-results.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/post-merge-safety-closure.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/post-merge-safety-closure.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-approval-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const privateFixtureApprovalFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-source-approval.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-source-approval.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/tool-command-approval.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/tool-command-approval.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/artifact-log-policy.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/artifact-log-policy.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/boundary-preservation-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/boundary-preservation-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/future-execution-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/future-execution-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/validation-results.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/post-667-reconciliation.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/post-667-reconciliation.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...privateFixtureScopeDecisionFiles,
  ...privateFixtureApprovalFiles,
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/generated-synthetic-private-fixture-design.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/generated-synthetic-private-fixture-design.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/gstreamer-command-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/gstreamer-command-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/mkvtoolnix-command-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/mkvtoolnix-command-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/privacy-artifact-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/privacy-artifact-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/boundary-preservation-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/boundary-preservation-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/future-execution-validation-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/future-execution-validation-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-target-image-check.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-target-image-check.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/run-directory-fixture-design.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/run-directory-fixture-design.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/boundary-verification.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/boundary-verification.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/latency-cost-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/latency-cost-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/safety-scan-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/safety-scan-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/status-matrix.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/status-matrix.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/gstreamer-evidence-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/gstreamer-evidence-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/mkvtoolnix-evidence-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/mkvtoolnix-evidence-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/artifact-cleanup-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/artifact-cleanup-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/boundary-qa.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/boundary-qa.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'package.json',
])

const passDecision = 'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof'
const blockerDecisions = [
  'blocked_pending_gstreamer_mkvtoolnix_synthetic_fixture_confirmation',
  'blocked_docker_daemon_unavailable',
  'blocked_render_worker_image_unavailable',
  'blocked_gstreamer_synthetic_pipeline_failed',
  'blocked_mkvtoolnix_synthetic_fixture_failed',
  'blocked_unexpected_private_or_user_media',
  'blocked_unexpected_ffmpeg_ffprobe_execution',
]

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1',
  '#601',
  'f19c173a6a3d9a4cf381fc23826bd14a6385bc1f',
  '#609',
  'e36b1a691eb1616cde95ba89bd51f480a337997c',
  '#624',
  'afc9983cecaef0eeeb536409c16c3e0ad2eda7c6',
  '#649',
  '7aaa0b5b8004a401e92b23da5ad3444b3e59cec9',
  '#577 is draft/open/blocked/conflicting and excluded as source-of-truth',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gst-launch-1.0 -q fakesrc num-buffers=3 ! fakesink',
  'fakesrc',
  'fakesink',
  'synthetic.srt',
  'synthetic-subtitle-only.mkv',
  'mkvmerge -o synthetic-subtitle-only.mkv synthetic.srt',
  'mkvmerge --identify synthetic-subtitle-only.mkv',
  'Product-ready end-to-end local OSS tools: `0`',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only.',
  'Atlas Track A does not claim FFmpeg/FFprobe ownership or install proof.',
  'Private/user media used: `false`',
  'Generated artifacts committed: `none`',
  'Supabase update required: `none`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1',
]

const forbiddenPatterns = [
  /Private\/user media used:\s*`?true/i,
  /private media execution:\s*`?(true|completed|passed|run)/i,
  /FFmpeg execution:\s*`?(true|completed|passed|run)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run)/i,
  /Remotion execution:\s*`?(true|completed|passed|run)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run)/i,
  /SQL execution:\s*`?(true|completed|passed|run)/i,
  /Docker push:\s*`?(true|completed|passed|run)/i,
  /Docker deployment:\s*`?(true|completed|passed|run)/i,
  /signed URL creation:\s*`?(true|enabled|completed|created)/i,
  /public artifact creation:\s*`?(true|enabled|completed|created)/i,
  /internal beta unlock:\s*`?(true|enabled|completed)/i,
  /external beta unlock:\s*`?(true|enabled|completed)/i,
  /production unlock:\s*`?(true|enabled|completed)/i,
  /final render\/export:\s*`?(true|enabled|completed|passed|run)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
  /\/Volumes\/backup\/REeditpro\/.+\.(mov|mp4|mkv|avi|wav|mp3|m4a|srt)/i,
]

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file)
    || file.startsWith('docs/track-a/gstreamer-mkvtoolnix/private-fixture-execution-packet/')
    || file.startsWith('docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/')
    || file === 'docs/activation-phase-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-results.md'
    || file === 'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md'
    || file === 'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md'
    || file === 'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md'
    || file === 'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md'
    || file === 'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md'
    || file === 'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md'
    || file === 'docs/track-a/track-a-runtime-blocked-scope-register.md'
    || file === 'docs/track-a/track-a-tool-status-matrix.md'
    || (file.startsWith('scripts/validation/tracka-gstreamer-mkvtoolnix-') && file.endsWith('-diagnostics.mjs'))
    || file === 'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs'
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
const expectedScripts = {
  'tracka:gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1': 'node scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.mjs',
  'tracka:gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1:diagnostics': 'node scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
}
for (const [name, command] of Object.entries(expectedScripts)) {
  if (packageJson.scripts?.[name] !== command) fail(`missing package script: ${name}`)
}

const runner = read('scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.mjs')
for (const token of [
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF',
  'blocked_pending_gstreamer_mkvtoolnix_synthetic_fixture_confirmation',
  'blocked_docker_daemon_unavailable',
  'blocked_render_worker_image_unavailable',
  'blocked_gstreamer_synthetic_pipeline_failed',
  'blocked_mkvtoolnix_synthetic_fixture_failed',
  'blocked_unexpected_private_or_user_media',
  'blocked_unexpected_ffmpeg_ffprobe_execution',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  '--network',
  'none',
  'gst-launch-1.0',
  'fakesrc',
  'fakesink',
  'mkvmerge',
  'synthetic.srt',
  'synthetic-subtitle-only.mkv',
  passDecision,
]) {
  if (!runner.includes(token)) fail(`missing runner token: ${token}`)
}

const combined = requiredDocs.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

const hasPass = combined.includes(passDecision)
const matchedBlockers = blockerDecisions.filter((decision) => combined.includes(decision))
if (!hasPass && matchedBlockers.length !== 1) {
  fail('docs must contain the pass decision or exactly one approved blocker decision')
}
if (hasPass && matchedBlockers.length > 0) {
  fail('docs must not mix pass decision with blocker decisions')
}
if (hasPass) {
  for (const token of [
    'Execution: `completed_controlled_synthetic_fixture_checks`',
    'GStreamer synthetic proof: `passed`',
    'MKVToolNix synthetic proof: `passed`',
    'sha256',
    'gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-report.json',
    'gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-manifest.json',
  ]) {
    if (!combined.includes(token)) fail(`missing pass evidence: ${token}`)
  }
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).trim()
}

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package-lock.json must remain unchanged')
}

const diffFiles = git(['diff', '--name-only', 'HEAD'])
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(diffFiles ? diffFiles.split('\n') : []),
  ...(untrackedFiles ? untrackedFiles.split('\n') : []),
])].filter(Boolean)

for (const file of changedFiles) {
  if (!isAllowedChangedFile(file)) fail(`unexpected changed file: ${file}`)
  if (file.includes('package-lock.json')) fail('package-lock.json must not be changed')
  if (file.startsWith('docker/')) fail(`Dockerfile/install source changed unexpectedly: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/')) fail(`runtime/source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) fail(`Supabase/SQL changed unexpectedly: ${file}`)
  if (file.includes('dist-') || file.startsWith('dist/')) fail(`generated output changed unexpectedly: ${file}`)
  if (file.includes('._') || file.endsWith('.DS_Store')) fail(`macOS metadata file changed unexpectedly: ${file}`)
}

const stagedGenerated = git(['diff', '--cached', '--name-only', '--',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
])
if (stagedGenerated) fail('generated build outputs must not be staged')

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 diagnostics passed')
