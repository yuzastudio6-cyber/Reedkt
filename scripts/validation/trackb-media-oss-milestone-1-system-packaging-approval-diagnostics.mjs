#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-system-packaging-approval'
const expectedDecision = 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution'
const expectedNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION'
const expectedTarget = 'docker/prod/cpu-worker/Dockerfile'
const requiredPackages = [
  'libimage-exiftool-perl',
  'mediainfo',
  'tesseract-ocr',
  'tesseract-ocr-eng',
  'imagemagick',
]
const requiredTools = ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'container-target-review.json',
  'container-target-review.md',
  'package-list-approval.json',
  'package-list-approval.md',
  'future-install-command-plan.json',
  'future-install-command-plan.md',
  'future-verification-command-plan.json',
  'future-verification-command-plan.md',
  'synthetic-fixture-proof-policy.json',
  'synthetic-fixture-proof-policy.md',
  'cpu-gpu-cloud-runtime-policy.json',
  'cpu-gpu-cloud-runtime-policy.md',
  'security-artifact-policy.json',
  'security-artifact-policy.md',
  'milestone-1-system-packaging-approval-decision.json',
  'milestone-1-system-packaging-approval-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)
const failures = []

function fail(message) {
  failures.push(message)
}

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}

function requireArrayItems(actual, expected, label) {
  const set = new Set(actual || [])
  for (const item of expected) {
    if (!set.has(item)) fail(`${label}_missing:${item}`)
  }
}

for (const file of requiredFiles) readText(file)
readText('docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-execution.md')

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const containerTarget = readJson(`${reportDir}/container-target-review.json`)
const packageList = readJson(`${reportDir}/package-list-approval.json`)
const installPlan = readJson(`${reportDir}/future-install-command-plan.json`)
const verificationPlan = readJson(`${reportDir}/future-verification-command-plan.json`)
const fixturePolicy = readJson(`${reportDir}/synthetic-fixture-proof-policy.json`)
const cpuGpu = readJson(`${reportDir}/cpu-gpu-cloud-runtime-policy.json`)
const security = readJson(`${reportDir}/security-artifact-policy.json`)
const decision = readJson(`${reportDir}/milestone-1-system-packaging-approval-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const ownerStatus = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')

for (const report of [
  sourceAudit,
  containerTarget,
  packageList,
  installPlan,
  verificationPlan,
  fixturePolicy,
  cpuGpu,
  security,
  decision,
  readiness,
  manifest,
]) {
  if (report.decision !== expectedDecision) fail(`decision_drift:${report.schema || 'unknown'}:${report.decision}`)
  if (report.nextPrompt !== expectedNextPrompt) fail(`next_prompt_drift:${report.schema || 'unknown'}:${report.nextPrompt}`)
}

if (containerTarget.selectedTarget !== expectedTarget) fail(`target_drift:${containerTarget.selectedTarget}`)
if (installPlan.targetDockerfile !== expectedTarget) fail(`install_target_drift:${installPlan.targetDockerfile}`)
if (decision.selectedTarget !== expectedTarget) fail(`decision_target_drift:${decision.selectedTarget}`)
if (sourceAudit.evidence?.find((entry) => entry.pr === 546)?.state !== 'MERGED') fail('missing_pr546_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 545)?.state !== 'MERGED') fail('missing_pr545_merged_evidence')
if (sourceAudit.evidence?.find((entry) => entry.pr === 542)?.state !== 'MERGED') fail('missing_pr542_merged_evidence')
if (sourceAudit.duplicatePackagingApprovalPrFound !== false) fail('duplicate_packaging_pr_not_false')

requireArrayItems(packageList.requiredPackages, requiredPackages, 'package_list')
requireArrayItems(installPlan.requiredPackages, requiredPackages, 'install_plan_packages')
requireArrayItems(decision.requiredPackages, requiredPackages, 'decision_packages')
if (packageList.graphicsMagickDefaultIncluded !== false) fail('graphicsmagick_default_included')
if (packageList.imageMagickPreferred !== true) fail('imagemagick_not_preferred')
if (decision.graphicsMagickRole !== 'optional_fallback_not_default') fail(`graphicsmagick_role_drift:${decision.graphicsMagickRole}`)

const installText = (installPlan.commands || []).join('\n')
for (const item of ['apt-get update', 'DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends', 'rm -rf /var/lib/apt/lists/*']) {
  if (!installText.includes(item)) fail(`future_install_command_missing:${item}`)
}
for (const pkg of requiredPackages) {
  if (!installText.includes(pkg)) fail(`future_install_command_package_missing:${pkg}`)
}
if (installText.includes('graphicsmagick')) fail('graphicsmagick_in_default_install_command')

const verificationText = (verificationPlan.commands || []).join('\n')
for (const command of ['exiftool -ver', 'mediainfo --Version', 'tesseract --version']) {
  if (!verificationText.includes(command)) fail(`verification_command_missing:${command}`)
}
if (!/magick -version|convert -version/.test(verificationText)) fail('imagemagick_verification_command_missing')

requireArrayItems(decision.targetTools, requiredTools, 'decision_target_tools')
if (fixturePolicy.realUserMediaAllowed !== false) fail('fixture_policy_real_media_allowed')
if (fixturePolicy.publicArtifactsAllowed !== false) fail('fixture_policy_public_artifacts_allowed')
if (fixturePolicy.signedUrlsAllowed !== false) fail('fixture_policy_signed_urls_allowed')
if (cpuGpu.computeDefault !== 'cpu_only') fail(`cpu_gpu_default_drift:${cpuGpu.computeDefault}`)
if (cpuGpu.gpuRequired !== false || cpuGpu.gpuApproved !== false) fail('gpu_scope_enabled')
if (readiness.readyForPackagingExecution !== true) fail('readiness_not_ready_for_packaging_execution')
if (readiness.readyForRuntimeMediaProcessing !== false) fail('runtime_media_processing_ready')
if (manifest.publicArtifactsCreated !== false || manifest.signedUrlsCreated !== false || manifest.secretMaterialIncluded !== false) {
  fail('private_manifest_forbidden_artifact_or_secret')
}

for (const [flag, expected] of Object.entries({
  installRunInThisPhase: false,
  dockerfileMutationInThisPhase: false,
  dockerBuildRunInThisPhase: false,
  dockerRunInThisPhase: false,
  verificationRunInThisPhase: false,
  proofRunInThisPhase: false,
  packageLockMutationAllowed: false,
  mediaProcessingAllowed: false,
  renderExportAllowed: false,
  workerRouteProviderExecutionAllowed: false,
  supabaseGcsPublicDeliveryAllowed: false,
  betaProductionAllowed: false,
  rawPromptExecutionAllowed: false,
  secretMaterialAllowed: false,
})) {
  for (const report of [installPlan, containerTarget, verificationPlan, fixturePolicy, security, decision]) {
    if (Object.hasOwn(report, flag) && report[flag] !== expected) fail(`flag_drift:${report.schema}:${flag}:${report[flag]}`)
  }
}
if (decision.packagingExecutionApprovedNow !== false) fail('packaging_execution_approved_now')
if (decision.packagingExecutionApprovedForFuturePr !== true) fail('future_packaging_execution_not_approved')
if (decision.endToEndProductReadyTools !== 0) fail('product_ready_tools_claimed')
if (decision.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')

if (ownerStatus.milestone1SystemPackagingApproval?.decision !== expectedDecision) fail('owner_status_missing_packaging_approval')
if (ownerStatus.milestone1SystemPackagingApproval?.targetDockerfile !== expectedTarget) fail('owner_status_target_drift')
requireArrayItems(ownerStatus.milestone1SystemPackagingApproval?.requiredPackages, requiredPackages, 'owner_status_packages')
if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-system-packaging-approval:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-system-packaging-approval-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}

const scanFiles = [
  ...requiredFiles,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-execution.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]
const forbiddenPatterns = [
  /\b(packages?|apt-get|tool|tools?|docker|image|media|render|worker|route|provider|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(were|was|is|are)\s+(installed|executed|run|built|processed|enabled|unlocked|approved now)\b/i,
  /40\+\s+tools\s+(are\s+)?(installed|proven).{0,80}end-to-end/i,
  /\b(sk-proj-|sk-live-|ghp_|postgres:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|without|future|separate|optional fallback|not installed|not created|not selected)\b/i.test(line)
    for (const pattern of forbiddenPatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`)
    }
  }
}

for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}
const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')

if (failures.length) {
  console.error('Track B Milestone 1 system packaging approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: expectedDecision,
  target: expectedTarget,
  requiredPackages,
  optionalFallback: 'graphicsmagick',
  nextPrompt: expectedNextPrompt,
  supabaseClassification: sourceAudit.supabaseClassification,
}, null, 2))
