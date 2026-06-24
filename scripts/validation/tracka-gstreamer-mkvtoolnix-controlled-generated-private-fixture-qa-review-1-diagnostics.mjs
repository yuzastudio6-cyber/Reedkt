import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review'
const executionPacketDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-execution-packet'
const activationResult = 'docs/activation-phase-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-results.md'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'gstreamer-evidence-acceptance.json',
  'gstreamer-evidence-acceptance.md',
  'mkvtoolnix-evidence-acceptance.json',
  'mkvtoolnix-evidence-acceptance.md',
  'artifact-cleanup-acceptance.json',
  'artifact-cleanup-acceptance.md',
  'boundary-qa.json',
  'boundary-qa.md',
  'qa-status-matrix.json',
  'qa-status-matrix.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'controlled-generated-private-fixture-qa-decision.json',
  'controlled-generated-private-fixture-qa-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
  'source-refresh-after-pr-680-drift.json',
  'source-refresh-after-pr-680-drift.md',
  'live-head-draft-readiness-review.json',
  'live-head-draft-readiness-review.md',
  'dependency-validation-gate-decision.json',
  'dependency-validation-gate-decision.md',
  'post-merge-dependency-gate-reconciliation.json',
  'post-merge-dependency-gate-reconciliation.md',
].map((file) => `${packetDir}/${file}`)

const predecessorFiles = [
  `${executionPacketDir}/reconciliation.json`,
  `${executionPacketDir}/reconciliation.md`,
  `${executionPacketDir}/source-of-truth-audit.json`,
  `${executionPacketDir}/source-of-truth-audit.md`,
  `${executionPacketDir}/status-matrix.json`,
  `${executionPacketDir}/status-matrix.md`,
  `${executionPacketDir}/validation-results.md`,
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.json',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.md',
]

const requiredFiles = [
  ...requiredReports,
  ...predecessorFiles,
  activationResult,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const allowedChangedFiles = new Set([
  ...requiredReports,
  ...predecessorFiles,
  activationResult,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'package.json',
])

const decision = 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup'
const internalRepairStatus = 'qa_passed_controlled_generated_private_fixture_execution_evidence'
const validationStatus = 'full_validation_passed_after_disk_space_closure'
const validationBlocker = 'closed'
const nextPrompt = 'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1'
const tempRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1/2026-06-23T03-37-56-bc4d88cf'

function isPostPr697ReviewChangedFile(file) {
  return file.startsWith('docs/track-a/native-container-render-tools/post-pr697-install-proof-3-review/')
    || file === 'docs/production-beta-blocker-inventory.md'
    || file === 'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md'
    || file === 'scripts/validation/tracka-install-proof-3-post-pr697-review-diagnostics.mjs'
    || file === 'scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs'
    || file === 'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs'
}

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1',
  '#680',
  '41601b267d076534412b7e13c86bee32cac23f7b',
  'satisfied_by_merged_controlled_generated_private_fixture_execution_1',
  '#673',
  '536d24bbe37763b8262e3b70dd8950e264482dfd',
  '71705e3b6081cf2e0e4870d2e24e7f29f421dfec',
  'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa',
  '#666',
  '8184a3af6499d1a05f56c95273f0bc44acf8540b',
  'tracka_gstreamer_mkvtoolnix_private_fixture_plan_passed_ready_for_controlled_generated_private_fixture_execution',
  '#662',
  '4ed3cc562ca2656f103282a1344fa060fc75bac5',
  'tracka_gstreamer_mkvtoolnix_private_fixture_approval_passed_ready_for_private_fixture_plan',
  '#659',
  '479b7bba918f27e58ecd9591b8fade0b79680d84',
  'tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval',
  '#652',
  'a3074af2eff53380402708ee055fa0db70b2f77a',
  'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof',
  'gst-launch-1.0 -q videotestsrc num-buffers=3 ! fakesink',
  'generated-private-subtitles.srt',
  'generated-private-subtitle-only.mkv',
  'SubRip/SRT',
  '2487edd658e8459b7818baf0422c8db6679f693020d78aeb90d5be0fb5aa446b',
  'ea659dec22a7492be8af90a521be03f76367723e99570e32e9f3b59d68ec1b82',
  decision,
  internalRepairStatus,
  validationStatus,
  'Validation blocker: `closed`',
  'live head: `6e3d90c2e7065a7bc41c694ab80806b10c9bc722`',
  'Draft decision: `ready_for_review_after_validation_closure`',
  'Validation status: `full_validation_passed_after_disk_space_closure`',
  'Dependency validation current attempt: `completed_after_disk_space_closure`',
  'PR review state: `ready_for_review_after_validation_closure`',
  'PR #682 live head at gate start: `146b2805c6a84e2fcdc5a2052ea0fda3b4e5bf1b`',
  'Dependency validation decision: `ready_for_review_after_validation_passed`',
  'Previous blocker: `host_resource_limit_no_space_left_on_device_requires_larger_validation_environment`',
  'Phase: `TRACKA-GSTREAMER-MKVTOOLNIX-QA-PR-682-POST-MERGE-DEPENDENCY-GATE-METADATA-RECONCILIATION`',
  'PR #682 merge commit: `d1dfcdbee62971313f6d7b017ed61747ac9d2518`',
  'Post-merge source-branch commit: `90e8f39d960a8a75405a45c5bbe3e07b12a8be40`',
  'Compare status: `diverged`',
  'Execution: `completed_docs_only_qa_review_no_runtime_execution`',
  'QA scope: `source_evidence_review_only`',
  'Private fixture execution in this phase: `false`',
  nextPrompt,
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 readiness: context_only_ready',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: still_blocked_pending_worker_supabase_remotion_and_tracka_private_e2e_gates',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1',
  'PR #577 remains open, draft, blocked/conflicting, and excluded as source-of-truth',
  'Product-ready end-to-end local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'PR #680 merge SHA / current base SHA: `41601b267d076534412b7e13c86bee32cac23f7b`',
  'PR #682 old head SHA: `ea2e5c81550143643de2ae1e10e67fbd75fd9205`',
  'tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics',
  'tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics',
  'QA-phase GStreamer execution: `not_run`',
  'QA-phase MKVToolNix execution: `not_run`',
  'QA-phase FFmpeg/FFprobe execution: `not_run`',
  'QA-phase Docker build/run: `not_run`',
  'Private/user/real media: `not_used`',
  'Update required: `none`',
  'Environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /QA-phase GStreamer execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase MKVToolNix execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase FFmpeg\/FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase Docker build\/run:\s*`?(true|completed|passed|run|executed)/i,
  /private\/user\/real media:\s*`?(true|used|processed|allowed|approved)/i,
  /user media:\s*`?(used|allowed|approved|true)/i,
  /real media:\s*`?(used|allowed|approved|true)/i,
  /arbitrary media probing:\s*`?(used|allowed|approved|true)/i,
  /media processing:\s*`?(true|completed|passed|run|executed)/i,
  /render\/export:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /beta\/production:\s*`?(unlocked|enabled|true)/i,
  /raw prompts?:\s*`?(executed|true)/i,
  /secret payloads?:\s*`?(printed|true)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_MEDIA_EXECUTION',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_FIXTURE_EXECUTION',
  'REEDITPRO_CONFIRM_FFMPEG_EXECUTION',
  'REEDITPRO_CONFIRM_FFPROBE_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_REMOTION_EXECUTION',
  'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const name of forbiddenEnv) {
  if (process.env[name]) fail(`forbidden confirmation env var is set: ${name}`)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

for (const file of requiredReports.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON report ${file}: ${error.message}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics')
}
const expectedExecutionPacketScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics'] !== expectedExecutionPacketScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics')
}

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const decisionReport = JSON.parse(read(`${packetDir}/controlled-generated-private-fixture-qa-decision.json`))
if (decisionReport.decision !== decision) fail('decision drift in QA decision report')
if (decisionReport.internalRepairStatus !== internalRepairStatus) fail('internal repair status drift in QA decision report')
if (decisionReport.execution !== 'completed_docs_only_qa_review_no_runtime_execution') fail('execution drift in QA decision report')
if (decisionReport.qaScope !== 'source_evidence_review_only') fail('QA scope drift in QA decision report')
if (decisionReport.privateFixtureExecutionInThisPhase !== false) fail('private fixture execution must remain false in QA decision report')
if (decisionReport.reconciliationPullRequest !== 680) fail('PR #680 reconciliation must be recorded')
if (decisionReport.reconciliationMergeSha !== '41601b267d076534412b7e13c86bee32cac23f7b') fail('PR #680 merge SHA drift')
if (decisionReport.next_prompt !== nextPrompt) fail('next prompt drift in QA decision report')
if (decisionReport.productReadyLocalOssTools !== 0) fail('product-ready local OSS count must remain 0')
if (decisionReport.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership must be preserved')
if (decisionReport.blocker !== validationBlocker) fail('QA decision report must record the closed dependency validation blocker')
if (decisionReport.validationStatus !== validationStatus) fail('QA decision report validation status drift')

const audit = JSON.parse(read(`${packetDir}/source-of-truth-audit.json`))
if (audit.decision !== decision) fail('decision drift in source audit')
if (audit.internalRepairStatus !== internalRepairStatus) fail('internal repair status drift in source audit')
if (audit.execution !== 'completed_docs_only_qa_review_no_runtime_execution') fail('execution drift in source audit')
if (audit.qaScope !== 'source_evidence_review_only') fail('QA scope drift in source audit')
if (audit.privateFixtureExecutionInThisPhase !== false) fail('private fixture execution must remain false in source audit')
if (!audit.predecessorPullRequests?.some((pr) => pr.number === 680 && pr.mergeSha === '41601b267d076534412b7e13c86bee32cac23f7b')) {
  fail('source audit must record PR #680 merge SHA')
}
if (!audit.excludedPullRequests?.some((pr) => pr.number === 577 && pr.status === 'open_draft_blocked_conflicting')) {
  fail('source audit must exclude PR #577')
}

const gst = JSON.parse(read(`${packetDir}/gstreamer-evidence-acceptance.json`))
if (gst.accepted !== true || gst.sourcePullRequest !== 673) fail('GStreamer evidence must accept PR #673')
if (gst.exitStatus !== 0 || gst.fileOutput !== false || gst.networkDisabled !== true) fail('GStreamer evidence must be exit 0, network disabled, and no file output')
if (gst.qaPhaseExecution !== false) fail('GStreamer must not execute in QA phase')
if (!gst.acceptedPipeline.includes('videotestsrc num-buffers=3 ! fakesink')) fail('GStreamer accepted pipeline drift')

const mkv = JSON.parse(read(`${packetDir}/mkvtoolnix-evidence-acceptance.json`))
if (mkv.accepted !== true || mkv.sourcePullRequest !== 673) fail('MKVToolNix evidence must accept PR #673')
if (mkv.mergeExitStatus !== 0 || mkv.identifyExitStatus !== 0 || mkv.networkDisabled !== true) fail('MKVToolNix evidence must be exit 0 and network disabled')
if (mkv.qaPhaseExecution !== false) fail('MKVToolNix must not execute in QA phase')
if (mkv.generatedSubtitle?.name !== 'generated-private-subtitles.srt') fail('unexpected subtitle fixture name')
if (mkv.generatedMkv?.name !== 'generated-private-subtitle-only.mkv') fail('unexpected MKV fixture name')

const cleanup = JSON.parse(read(`${packetDir}/artifact-cleanup-acceptance.json`))
if (cleanup.accepted !== true || cleanup.cleanupCompleted !== true || cleanup.runRootRemoved !== true) fail('cleanup evidence must be accepted and complete')
if (cleanup.generatedMediaArtifactsCommitted !== false || cleanup.tmpArtifactsCopiedToRepo !== false) fail('generated artifacts must not be committed or copied')
if (existsSync(tempRoot)) fail(`temp run root still exists: ${tempRoot}`)

const boundary = JSON.parse(read(`${packetDir}/boundary-qa.json`))
if (boundary.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('boundary QA must preserve Track B FFmpeg/FFprobe ownership')
if (boundary.productReadyLocalOssTools !== 0) fail('boundary QA must keep product-ready count 0')
for (const [scope, status] of Object.entries(boundary.blockedScope)) {
  if (status !== 'blocked') fail(`blocked scope drift for ${scope}: ${status}`)
}

const statusMatrix = JSON.parse(read(`${packetDir}/qa-status-matrix.json`))
if (!Array.isArray(statusMatrix.rows) || statusMatrix.rows.length !== 2) fail('QA status matrix must include exactly two rows')
if (statusMatrix.decision !== decision) fail('QA status matrix decision drift')
if (statusMatrix.internalRepairStatus !== internalRepairStatus) fail('QA status matrix internal repair status drift')
for (const row of statusMatrix.rows) {
  if (row.qaAccepted !== true) fail(`QA row must be accepted for ${row.tool}`)
  if (row.qaPhaseExecution !== false) fail(`QA row must not execute for ${row.tool}`)
  if (row.productReady !== false) fail(`QA row must keep productReady false for ${row.tool}`)
  if (row.readiness !== 'qa_passed_ready_for_tracka_native_container_rollup_or_private_e2e_planning') {
    fail(`QA row readiness drift for ${row.tool}`)
  }
}

const readiness = JSON.parse(read(`${packetDir}/readiness-report.json`))
if (readiness.qaDecision !== decision) fail('readiness report QA decision drift')
if (readiness.internalRepairStatus !== internalRepairStatus) fail('readiness report internal repair status drift')
if (readiness.nextGate !== nextPrompt) fail('readiness report next gate drift')
if (readiness.validationBlocker !== validationBlocker) fail('readiness report must record the closed dependency validation blocker')
if (readiness.validationStatus !== validationStatus) fail('readiness report validation status drift')
if (readiness.dependencyValidation !== 'passed') fail('readiness report dependency validation must be passed')

const liveHeadReview = JSON.parse(read(`${packetDir}/live-head-draft-readiness-review.json`))
if (liveHeadReview.liveHead !== '6e3d90c2e7065a7bc41c694ab80806b10c9bc722') fail('live-head readiness review head drift')
if (liveHeadReview.draftDecision !== 'ready_for_review_after_validation_closure') fail('live-head readiness review must record ready-for-review closure')
if (liveHeadReview.canonicalDecision !== decision) fail('live-head readiness review canonical decision drift')
if (liveHeadReview.internalRepairStatus !== internalRepairStatus) fail('live-head readiness review internal repair status drift')
if (liveHeadReview.nextPrompt !== nextPrompt) fail('live-head readiness review next prompt drift')
if (liveHeadReview.validationBlocker !== validationBlocker) fail('live-head readiness review validation blocker drift')
if (liveHeadReview.validationStatus !== validationStatus) fail('live-head readiness review validation status drift')
if (liveHeadReview.supabaseClassification?.write !== 'no') fail('live-head readiness review Supabase classification drift')

const dependencyGate = JSON.parse(read(`${packetDir}/dependency-validation-gate-decision.json`))
if (dependencyGate.pullRequest !== 682) fail('dependency validation gate PR drift')
if (dependencyGate.liveHeadAtGateStart !== '146b2805c6a84e2fcdc5a2052ea0fda3b4e5bf1b') fail('dependency validation gate live head drift')
if (dependencyGate.baseSha !== '41601b267d076534412b7e13c86bee32cac23f7b') fail('dependency validation gate base SHA drift')
if (dependencyGate.pr680Context?.mergeSha !== '41601b267d076534412b7e13c86bee32cac23f7b') fail('dependency validation gate PR #680 context drift')
if (dependencyGate.canonicalDecision !== decision) fail('dependency validation gate canonical decision drift')
if (dependencyGate.internalRepairStatus !== internalRepairStatus) fail('dependency validation gate internal repair status drift')
if (dependencyGate.nextPrompt !== nextPrompt) fail('dependency validation gate next prompt drift')
if (dependencyGate.previousBlocker !== 'host_resource_limit_no_space_left_on_device_requires_larger_validation_environment') fail('dependency validation gate previous blocker drift')
if (dependencyGate.validationBlocker !== validationBlocker) fail('dependency validation gate blocker must be closed')
if (dependencyGate.dependencyValidationDecision !== 'ready_for_review_after_validation_passed') fail('dependency validation gate decision drift')
if (dependencyGate.dependencyValidationStatus !== 'passed') fail('dependency validation gate status must be passed')
if (dependencyGate.dependencyValidationAttemptedInThisPhase !== true) fail('dependency validation gate must record dependency validation attempt')
if (dependencyGate.dependencyValidationEnvironment?.threshold !== '25GiB') fail('dependency validation gate disk threshold drift')
if (dependencyGate.noScopeConfirmation?.gstreamer !== 'not_run') fail('dependency validation gate must keep GStreamer not_run')
if (dependencyGate.noScopeConfirmation?.mkvtoolnix !== 'not_run') fail('dependency validation gate must keep MKVToolNix not_run')
if (dependencyGate.noScopeConfirmation?.docker !== 'not_run') fail('dependency validation gate must keep Docker not_run')
if (dependencyGate.noScopeConfirmation?.supabaseSqlGcs !== 'not_touched') fail('dependency validation gate must keep Supabase/SQL/GCS untouched')
if (dependencyGate.protectedMutationReview?.packageLock !== 'unchanged') fail('dependency validation gate package-lock mutation drift')
if (dependencyGate.protectedMutationReview?.dockerfiles !== 'unchanged') fail('dependency validation gate Dockerfile mutation drift')
if (dependencyGate.productReadyLocalOssTools !== 0) fail('dependency validation gate product-ready count drift')
if (dependencyGate.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('dependency validation gate Track B FFmpeg/FFprobe ownership drift')
if (dependencyGate.supabaseClassification?.write !== 'no') fail('dependency validation gate Supabase classification drift')

const postMergeReconciliation = JSON.parse(read(`${packetDir}/post-merge-dependency-gate-reconciliation.json`))
if (postMergeReconciliation.phase !== 'TRACKA-GSTREAMER-MKVTOOLNIX-QA-PR-682-POST-MERGE-DEPENDENCY-GATE-METADATA-RECONCILIATION') fail('post-merge reconciliation phase drift')
if (postMergeReconciliation.pullRequest !== 682 || postMergeReconciliation.pullRequestMerged !== true) fail('post-merge reconciliation PR state drift')
if (postMergeReconciliation.pullRequestMergeCommit !== 'd1dfcdbee62971313f6d7b017ed61747ac9d2518') fail('post-merge reconciliation merge commit drift')
if (postMergeReconciliation.pullRequestMergedHead !== '146b2805c6a84e2fcdc5a2052ea0fda3b4e5bf1b') fail('post-merge reconciliation merged head drift')
if (postMergeReconciliation.postMergeSourceBranchCommit !== '90e8f39d960a8a75405a45c5bbe3e07b12a8be40') fail('post-merge reconciliation source-branch commit drift')
if (postMergeReconciliation.postMergeSourceBranchCommitMessage !== '[track-a] Record PR 682 dependency validation gate') fail('post-merge reconciliation source-branch commit message drift')
if (postMergeReconciliation.compare?.status !== 'diverged') fail('post-merge reconciliation compare status drift')
if (postMergeReconciliation.compare?.aheadBy !== 1 || postMergeReconciliation.compare?.behindBy !== 1) fail('post-merge reconciliation compare ahead/behind drift')
if (postMergeReconciliation.compare?.mergeBase !== '146b2805c6a84e2fcdc5a2052ea0fda3b4e5bf1b') fail('post-merge reconciliation compare merge base drift')
if (postMergeReconciliation.canonicalDecision !== decision) fail('post-merge reconciliation canonical decision drift')
if (postMergeReconciliation.internalRepairStatus !== internalRepairStatus) fail('post-merge reconciliation internal repair status drift')
if (postMergeReconciliation.validationClosure !== validationStatus) fail('post-merge reconciliation validation closure drift')
if (postMergeReconciliation.dependencyValidationGateDecision !== 'ready_for_review_after_validation_passed') fail('post-merge reconciliation dependency gate decision drift')
if (postMergeReconciliation.nextPrompt !== nextPrompt) fail('post-merge reconciliation next prompt drift')
if (postMergeReconciliation.productReadyLocalOssTools !== 0) fail('post-merge reconciliation product-ready count drift')
if (postMergeReconciliation.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('post-merge reconciliation Track B FFmpeg/FFprobe ownership drift')
if (postMergeReconciliation.noScopeConfirmation?.gstreamer !== 'not_run') fail('post-merge reconciliation must keep GStreamer not_run')
if (postMergeReconciliation.noScopeConfirmation?.mkvtoolnix !== 'not_run') fail('post-merge reconciliation must keep MKVToolNix not_run')
if (postMergeReconciliation.noScopeConfirmation?.docker !== 'not_run') fail('post-merge reconciliation must keep Docker not_run')
if (postMergeReconciliation.noScopeConfirmation?.supabaseSqlGcs !== 'not_touched') fail('post-merge reconciliation must keep Supabase/SQL/GCS untouched')
if (postMergeReconciliation.protectedMutationReview?.packageLock !== 'unchanged') fail('post-merge reconciliation package-lock mutation drift')
if (postMergeReconciliation.protectedMutationReview?.dockerfiles !== 'unchanged') fail('post-merge reconciliation Dockerfile mutation drift')
if (postMergeReconciliation.supabaseClassification?.write !== 'no') fail('post-merge reconciliation Supabase classification drift')

const runtimeBoundary = JSON.parse(read(`${packetDir}/runtime-boundary-review.json`))
for (const [key, value] of Object.entries(runtimeBoundary)) {
  if (['supabaseClassification', 'qaScope', 'post680MergeSha'].includes(key)) continue
  if (key === 'post680ReconciliationIntegrated') {
    if (value !== true) fail('post-680 reconciliation must be integrated')
    continue
  }
  if (value !== false) fail(`runtime boundary must remain false for ${key}`)
}
if (runtimeBoundary.qaScope !== 'source_evidence_review_only') fail('runtime boundary QA scope drift')
if (runtimeBoundary.post680MergeSha !== '41601b267d076534412b7e13c86bee32cac23f7b') fail('runtime boundary PR #680 merge SHA drift')

const manifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const key of [
  'committedArtifacts',
  'privateArtifactsCreated',
  'userMediaUsed',
  'realMediaUsed',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'gcsUploads',
  'tmpArtifactsCopiedToRepo',
  'qaPhaseArtifactsCreated',
]) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) {
    fail(`private artifact manifest must keep ${key} empty`)
  }
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).trim()
}

for (const protectedPath of [
  'package-lock.json',
  '.dockerignore',
  'docker',
  'src',
  'server',
  'supabase',
  'database',
]) {
  const changed = git(['diff', '--name-only', 'HEAD', '--', protectedPath])
  if (changed) fail(`protected path changed unexpectedly: ${changed}`)
}

const diffFiles = git(['diff', '--name-only', 'HEAD'])
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(diffFiles ? diffFiles.split('\n') : []),
  ...(untrackedFiles ? untrackedFiles.split('\n') : []),
])].filter(Boolean)

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file) && !isPostPr697ReviewChangedFile(file)) fail(`unexpected changed file: ${file}`)
  if (/\.(mkv|srt|mp4|mov|avi|wav|mp3|m4a)$/i.test(file)) fail(`media artifact changed unexpectedly: ${file}`)
  if (file.startsWith('dist') || file.includes('/dist')) fail(`generated dist output changed unexpectedly: ${file}`)
  if (file.includes('node_modules')) fail(`node_modules must not be changed: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json must not be changed')
  if (file === '.dockerignore' || file.startsWith('docker/')) fail(`Docker/.dockerignore changed unexpectedly: ${file}`)
  if (file.startsWith('src/') || file.startsWith('server/')) fail(`runtime source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) fail(`Supabase/SQL changed unexpectedly: ${file}`)
}

const stagedForbidden = git(['diff', '--cached', '--name-only', '--',
  'dist',
  'dist-server',
  'node_modules',
  'package-lock.json',
  '.dockerignore',
  'docker',
  'src',
  'server',
  'supabase',
  'database',
])
if (stagedForbidden) fail(`forbidden generated/protected path staged unexpectedly: ${stagedForbidden}`)

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1 diagnostics passed')
