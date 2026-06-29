import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:model-weight-private-evidence-intake'
const runScriptCommand = 'tsx server/cli/ai-graphics-model-weight-private-evidence-intake.ts'
const diagnosticScriptName = 'ai-graphics:model-weight-private-evidence-intake:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-model-weight-private-evidence-intake-diagnostics.mjs'

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

const sourceCandidateIdByTool = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_isnet_general_use_review_candidate',
  transparent_background: 'plemeri_transparent_background_base_ckpt_review_candidate',
}

const artifactFileNameByTool = {
  sam2: 'sam2.1_hiera_tiny.pt',
  birefnet: 'ZhengPeng7/BiRefNet',
  real_esrgan: 'RealESRGAN_x4plus.pth',
  rembg: 'isnet-general-use.onnx',
  transparent_background: 'ckpt_base.pth',
}

const checksumShaByTool = {
  sam2: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  birefnet: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  real_esrgan: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  rembg: 'c'.repeat(64),
  transparent_background: 'd'.repeat(64),
}

const errors = []

function fail(message) {
  errors.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runNpm(scriptName, args = [], expectedExitCode = 0) {
  try {
    const output = execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    })
    if (expectedExitCode !== 0) fail(`expected_nonzero_exit:${scriptName}:${expectedExitCode}`)
    return output
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    if (error.status !== expectedExitCode) fail(`unexpected_exit:${scriptName}:${error.status}`)
    return output
  }
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function assertNoPrivateLeak(output, label) {
  for (const token of [
    'private://reeditpro/',
    'reeditpro-private://',
    'reeditpro-private-artifact-ref-',
    'signed.example.invalid',
    'public.example.invalid',
    'gs://reeditpro',
  ]) {
    if (output.includes(token)) fail(`private_or_public_ref_leaked:${label}:${token}`)
  }
}

function mkdirp(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

function writeJson(filePath, value) {
  mkdirp(path.dirname(filePath))
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function checksumRecord(toolId) {
  return {
    evidenceId: `${toolId}_private_checksum_evidence_v1`,
    toolId,
    sourceCandidateId: sourceCandidateIdByTool[toolId],
    artifactFileName: artifactFileNameByTool[toolId],
    artifactSha256: checksumShaByTool[toolId],
    checksumEvidenceRef: `private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    sourceArtifactRef: `private://reeditpro/ai-graphics/model-weights/${toolId}/source-artifact`,
    hashCommand: `sha256sum ${artifactFileNameByTool[toolId]}`,
    checksumEvidenceReviewed: true,
    sourceArtifactReviewed: true,
    provenanceReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    approvedForManifestAuthoring: true,
  }
}

function supplementRecord(toolId) {
  return {
    supplementId: `${toolId}_private_manifest_review_supplement_v1`,
    toolId,
    sourceCandidateId: sourceCandidateIdByTool[toolId],
    sourceLicenseRef: `private://reeditpro/ai-graphics/license-evidence/${toolId}.json`,
    modelCardRef: `private://reeditpro/ai-graphics/model-card/${toolId}.json`,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    provenanceReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    approvedForInternalBeta: true,
  }
}

function manifestRecord(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_from_checksum_evidence_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    sourceCandidateId: sourceCandidateIdByTool[toolId],
    privateArtifactRef: `private://reeditpro/ai-graphics/model-weights/${toolId}/source-artifact`,
    checksumSha256: checksumShaByTool[toolId],
    checksumEvidenceRef: `private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    sourceLicenseRef: `private://reeditpro/ai-graphics/license-evidence/${toolId}.json`,
    modelCardRef: `private://reeditpro/ai-graphics/model-card/${toolId}.json`,
    checksumEvidenceReviewed: true,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-private-evidence-intake.ts',
  'server/cli/ai-graphics-model-weight-private-evidence-intake.ts',
  'server/tool-registry/ai-graphics-model-weight-checksum-evidence.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-supplement.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-authoring.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.md',
  'docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.json')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.md')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-private-evidence-intake.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-private-evidence-intake.ts')
const indexSource = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-model-weight-private-evidence-intake'")) {
  fail('server_registry_index_does_not_export_private_evidence_intake')
}
if (docs.decision !== 'ai_graphics_model_weight_private_evidence_intake_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestRequiredTools: 5,
  checksumEvidenceRecordsAccepted: 0,
  manifestSupplementRecordsAccepted: 0,
  localPrivateManifestDraftsReady: 0,
  reviewedPrivateManifestRecordsAccepted: 0,
  nativeGpuProofInputEligibleRecords: 0,
  readyForNativeGpuProofInputRecords: 0,
  privateArtifactRefsLogged: 0,
  betaReadyModelWeightTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!docs.modelWeightManifestRequiredTools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}

for (const needle of [
  'AI_GRAPHICS_MODEL_WEIGHT_PRIVATE_EVIDENCE_INTAKE_DECISION',
  'buildAiGraphicsModelWeightPrivateEvidenceIntakePacket',
  'blocked_missing_private_checksum_evidence',
  'blocked_missing_private_manifest_supplements',
  'blocked_missing_private_manifest_authoring',
  'blocked_missing_reviewed_private_manifests',
  'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready',
  'gpuRuntimeShouldStartNow: false',
  'externalBetaReadyNow: false',
]) {
  if (!moduleSource.includes(needle)) fail(`module_missing:${needle}`)
}

for (const needle of [
  '--checksum-evidence-dir',
  '--manifest-supplement-dir',
  '--manifest-dir',
  'buildAiGraphicsModelWeightChecksumEvidencePacket',
  'buildAiGraphicsModelWeightManifestSupplementPacket',
  'buildAiGraphicsModelWeightManifestAuthoringDrafts',
  'buildAiGraphicsModelWeightManifestReviewPacket',
]) {
  if (!cliSource.includes(needle)) fail(`cli_missing:${needle}`)
}

for (const key of [
  'modelWeightPrivateEvidenceIntakePrepared',
  'all5ModelWeightToolsCovered',
  'nativeGpuProofStillRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'privateArtifactRefsNotLogged',
  'publicOrSignedRefsRejected',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`required_true_not_true:${key}`)
}

for (const key of [
  'checksumEvidenceAcceptedForAll5',
  'manifestSupplementsAcceptedForAll5',
  'localPrivateManifestDraftsReadyForAll5',
  'reviewedPrivateManifestsAcceptedForAll5',
  'readyForNativeGpuProofInput',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'modelWeightManifestsApprovedNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (docs.booleans?.[key] !== false) fail(`required_false_not_false:${key}`)
}

const emptyOutput = runNpm(runScriptName)
assertNoPrivateLeak(emptyOutput, 'empty_output')
const emptyPacket = parseJsonOutput(emptyOutput, 'empty_intake')
if (emptyPacket.status !== 'blocked_missing_private_checksum_evidence') {
  fail(`empty_status_unexpected:${emptyPacket.status}`)
}
if (emptyPacket.booleans?.readyForNativeGpuProofInput !== false) fail('empty_ready_not_false')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-private-evidence-intake-'))
const checksumDir = path.join(tempRoot, 'checksum')
const supplementDir = path.join(tempRoot, 'supplements')
const manifestDir = path.join(tempRoot, 'manifests')
for (const tool of modelWeightTools) {
  writeJson(path.join(checksumDir, `${tool}.json`), checksumRecord(tool))
  writeJson(path.join(supplementDir, `${tool}.json`), supplementRecord(tool))
  writeJson(path.join(manifestDir, `${tool}.json`), manifestRecord(tool))
}

const validOutput = runNpm(runScriptName, [
  '--checksum-evidence-dir',
  checksumDir,
  '--manifest-supplement-dir',
  supplementDir,
  '--manifest-dir',
  manifestDir,
])
assertNoPrivateLeak(validOutput, 'valid_output')
const validPacket = parseJsonOutput(validOutput, 'valid_intake')
if (validPacket.status !== 'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready') {
  fail(`valid_status_unexpected:${validPacket.status}`)
}
if (validPacket.readyForNativeGpuProofInputRecords !== 5) fail('valid_ready_records_not_5')
if (validPacket.booleans?.readyForNativeGpuProofInput !== true) fail('valid_ready_boolean_not_true')
if (validPacket.booleans?.gpuRuntimeShouldStartNow !== false) fail('valid_gpu_should_start_not_false')
if (validPacket.booleans?.externalBetaReadyNow !== false) fail('valid_external_beta_not_false')

const missingManifestOutput = runNpm(runScriptName, [
  '--checksum-evidence-dir',
  checksumDir,
  '--manifest-supplement-dir',
  supplementDir,
], 2)
assertNoPrivateLeak(missingManifestOutput, 'missing_manifest_output')
const missingManifestPacket = parseJsonOutput(missingManifestOutput, 'missing_manifest_intake')
if (missingManifestPacket.status !== 'blocked_missing_reviewed_private_manifests') {
  fail(`missing_manifest_status_unexpected:${missingManifestPacket.status}`)
}

const invalidChecksumDir = path.join(tempRoot, 'invalid-checksum')
for (const tool of modelWeightTools) {
  const record = checksumRecord(tool)
  if (tool === 'sam2') record.checksumEvidenceRef = 'https://signed.example.invalid/sam2/checksum.json?X-Goog-Signature=abc'
  writeJson(path.join(invalidChecksumDir, `${tool}.json`), record)
}
const invalidChecksumOutput = runNpm(runScriptName, [
  '--checksum-evidence-dir',
  invalidChecksumDir,
  '--manifest-supplement-dir',
  supplementDir,
  '--manifest-dir',
  manifestDir,
], 2)
assertNoPrivateLeak(invalidChecksumOutput, 'invalid_checksum_output')
const invalidChecksumPacket = parseJsonOutput(invalidChecksumOutput, 'invalid_checksum_intake')
if (invalidChecksumPacket.status !== 'blocked_missing_private_checksum_evidence') {
  fail(`invalid_checksum_status_unexpected:${invalidChecksumPacket.status}`)
}

const combinedText = [markdown, JSON.stringify(docs), moduleSource, cliSource].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeShouldStartNow["`:= ]+true/i,
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
  /modelInferencePerformed["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /publicArtifactCreated["`:= ]+true/i,
  /signedUrlCreated["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_detected:${pattern}`)
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_read_failed:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = [
  ...git(['diff', '--name-only']).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
]
for (const file of changedFiles) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|build|coverage|public\/generated|generated|render|renders|browser-output|canvas-output|webgl-output|media-output)\//i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) {
    fail(`generated_media_changed:${file}`)
  }
}

if (errors.length) {
  console.error('AI graphics model-weight private evidence intake diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  emptyStatus: emptyPacket.status,
  validStatus: validPacket.status,
  missingManifestStatus: missingManifestPacket.status,
  invalidChecksumStatus: invalidChecksumPacket.status,
  modelWeightManifestRequiredTools: modelWeightTools.length,
  readyForNativeGpuProofInputRecords: validPacket.readyForNativeGpuProofInputRecords,
  privateArtifactRefsLogged: validPacket.privateArtifactRefsLogged,
  gpuRuntimeShouldStartNow: validPacket.booleans?.gpuRuntimeShouldStartNow,
  externalBetaReadyNow: validPacket.booleans?.externalBetaReadyNow,
  productionReadyNow: validPacket.booleans?.productionReadyNow,
}, null, 2))
