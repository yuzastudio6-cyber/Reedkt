import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const authoringScriptName = 'ai-graphics:model-weight-manifest-authoring'
const authoringScriptCommand = 'tsx server/cli/ai-graphics-model-weight-manifest-authoring.ts'
const diagnosticScriptName = 'ai-graphics:model-weight-manifest-authoring:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-model-weight-manifest-authoring-diagnostics.mjs'

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

const relativeDraftPathByTool = {
  sam2: 'sam2/model_tree_manifest.json',
  birefnet: 'birefnet/model_tree_manifest.json',
  real_esrgan: 'real-esrgan/model_tree_manifest.json',
  rembg: 'rembg/model_tree_manifest.json',
  transparent_background: 'transparent-background/model_tree_manifest.json',
}

const requiredSupplementFields = [
  'supplementId',
  'toolId',
  'sourceCandidateId',
  'sourceLicenseRef',
  'modelCardRef',
  'commercialUseReviewed',
  'redistributionReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForInternalBeta',
]

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

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
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
    'signed.example.invalid',
    'public.example.invalid',
    'gs://reeditpro',
  ]) {
    if (output.includes(token)) fail(`private_or_public_ref_leaked:${label}:${token}`)
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-authoring.ts',
  'server/cli/ai-graphics-model-weight-manifest-authoring.ts',
  'server/tool-registry/ai-graphics-model-weight-checksum-evidence.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.json',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.json')
const checksumPacket = json('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json')
const manifestPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-manifest-authoring.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-manifest-authoring.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md')

if (pkg.scripts?.[authoringScriptName] !== authoringScriptCommand) fail(`missing_package_script:${authoringScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-model-weight-manifest-authoring'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_authoring')
}
if (packet.decision !== 'ai_graphics_model_weight_manifest_authoring_from_checksum_evidence_prepared_with_local_only_private_drafts') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (checksumPacket.decision !== 'ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records') {
  fail(`unexpected_checksum_packet_decision:${checksumPacket.decision}`)
}
if (manifestPacket.decision !== 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records') {
  fail(`unexpected_manifest_packet_decision:${manifestPacket.decision}`)
}
if (packet.contractSurface?.localPrivateManifestAuthoringScript !== authoringScriptName) {
  fail('packet_missing_authoring_script')
}
if (packet.contractSurface?.localPrivateManifestValidatorScript !== 'ai-graphics:model-weight-manifest-review:validate') {
  fail('packet_missing_manifest_review_validator_script')
}
if (packet.sourceEvidence?.modelWeightChecksumEvidence !== 'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json') {
  fail('packet_missing_checksum_evidence_source')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestAuthoringTools: 5,
  checksumEvidenceRecordsProvided: 0,
  checksumEvidenceRecordsAccepted: 0,
  manifestReviewSupplementsProvided: 0,
  manifestReviewSupplementsAccepted: 0,
  localPrivateManifestDraftsReady: 0,
  manifestReviewValidatorInputReadyRecords: 0,
  privateArtifactRefsLogged: 0,
  betaReadyModelWeightTools: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestRequiredTools?.includes(tool)) fail(`packet_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!moduleSource.includes(tool)) fail(`module_missing_tool:${tool}`)
  const result = packet.validationResults?.find((entry) => entry.toolId === tool)
  if (!result) fail(`packet_missing_validation_result:${tool}`)
  if (result?.templateId !== templateIdByTool[tool]) fail(`template_mismatch:${tool}:${result?.templateId}`)
  if (result?.expectedSourceCandidateId !== sourceCandidateIdByTool[tool]) {
    fail(`source_candidate_mismatch:${tool}:${result?.expectedSourceCandidateId}`)
  }
  if (result?.localPrivateManifestDraftReady !== false) fail(`public_packet_draft_ready_not_false:${tool}`)
  if (result?.manifestReviewValidatorInputReady !== false) fail(`public_packet_validator_input_ready_not_false:${tool}`)
  if (result?.approvedForAgentExecutionNow !== false) fail(`public_packet_agent_execution_not_false:${tool}`)
}

for (const field of requiredSupplementFields) {
  if (!packet.requiredSupplementFields?.includes(field)) fail(`packet_missing_supplement_field:${field}`)
  if (!moduleSource.includes(field)) fail(`module_missing_supplement_field:${field}`)
  if (!markdown.includes(`\`${field}\``)) fail(`markdown_missing_supplement_field:${field}`)
}

for (const token of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_AUTHORING_DECISION',
  'AiGraphicsModelWeightManifestReviewSupplementRecord',
  'buildAiGraphicsModelWeightManifestAuthoringDrafts',
  'buildAiGraphicsModelWeightManifestAuthoringPacket',
  'local_private_manifest_draft_ready',
  'blocked_missing_manifest_review_supplement',
  'sourceLicenseRef must be a reviewed private reference',
  'modelCardRef must be a reviewed private reference',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--evidence-dir',
  '--supplement-dir',
  '--out-dir',
  '--force',
  'localPrivateManifestDraftFilesWritten',
  'privateArtifactRefsLogged: 0',
  'manifest-authoring-checklist.json',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const key of [
  'modelWeightManifestAuthoringBridgePrepared',
  'sourceChecksumEvidenceAccepted',
  'sourceManifestReviewPacketAccepted',
  'all5ModelWeightToolsCovered',
  'checksumEvidenceRequiredBeforeManifestDraft',
  'manifestReviewSupplementRequired',
  'localPrivateManifestDraftsOnly',
  'privateArtifactRefsNotLogged',
  'publicOrSignedRefsRejected',
  'nativeGpuProofStillRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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
  if (packet.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

function writeChecksumEvidenceFixtures(directory, override = {}, skipTools = []) {
  for (const toolId of modelWeightTools) {
    if (skipTools.includes(toolId)) continue
    const evidence = {
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
      ...(override[toolId] || {}),
    }
    fs.writeFileSync(path.join(directory, `${toolId}.json`), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  }
}

function writeSupplementFixtures(directory, override = {}, skipTools = []) {
  for (const toolId of modelWeightTools) {
    if (skipTools.includes(toolId)) continue
    const supplement = {
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
      ...(override[toolId] || {}),
    }
    fs.writeFileSync(path.join(directory, `${toolId}.json`), `${JSON.stringify(supplement, null, 2)}\n`, 'utf8')
  }
}

function runAuthoring(evidenceDir, supplementDir, outDir) {
  const args = ['--evidence-dir', evidenceDir, '--supplement-dir', supplementDir]
  if (outDir) args.push('--out-dir', outDir)
  return runNpm(authoringScriptName, args)
}

const validRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-authoring-valid-'))
try {
  const evidenceDir = path.join(validRoot, 'checksum-evidence')
  const supplementDir = path.join(validRoot, 'supplements')
  const outDir = path.join(validRoot, 'model-weight-manifests')
  fs.mkdirSync(evidenceDir)
  fs.mkdirSync(supplementDir)
  writeChecksumEvidenceFixtures(evidenceDir)
  writeSupplementFixtures(supplementDir)

  const authoringOutput = runAuthoring(evidenceDir, supplementDir, outDir)
  assertNoPrivateLeak(authoringOutput, 'valid_authoring_stdout')
  const authoringPacket = parseJsonOutput(authoringOutput, 'valid_authoring')
  if (authoringPacket.localPrivateManifestDraftsReady !== 5) {
    fail(`valid_authoring_drafts_ready_not_5:${authoringPacket.localPrivateManifestDraftsReady}`)
  }
  if (authoringPacket.manifestReviewValidatorInputReadyRecords !== 5) {
    fail(`valid_authoring_validator_input_not_5:${authoringPacket.manifestReviewValidatorInputReadyRecords}`)
  }
  if (authoringPacket.input?.localPrivateManifestDraftFilesWritten !== 5) {
    fail(`valid_authoring_files_written_not_5:${authoringPacket.input?.localPrivateManifestDraftFilesWritten}`)
  }
  for (const [toolId, relativePath] of Object.entries(relativeDraftPathByTool)) {
    if (!fs.existsSync(path.join(outDir, relativePath))) fail(`valid_authoring_missing_draft_file:${toolId}`)
  }

  const manifestOutput = runNpm('ai-graphics:model-weight-manifest-review:validate', ['--manifest-dir', outDir])
  assertNoPrivateLeak(manifestOutput, 'valid_manifest_validator_stdout')
  const manifestReview = parseJsonOutput(manifestOutput, 'valid_manifest_review')
  if (manifestReview.manifestRecordsProvided !== 5) fail('valid_manifest_records_provided_not_5')
  if (manifestReview.reviewAcceptedManifestRecords !== 5) fail('valid_manifest_records_accepted_not_5')
  if (manifestReview.nativeGpuProofInputEligibleRecords !== 5) fail('valid_manifest_gpu_input_not_5')
} catch (error) {
  fail(`valid_authoring_flow_failed:${error.message}`)
} finally {
  fs.rmSync(validRoot, { recursive: true, force: true })
}

const missingSupplementRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-authoring-missing-supplement-'))
try {
  const evidenceDir = path.join(missingSupplementRoot, 'checksum-evidence')
  const supplementDir = path.join(missingSupplementRoot, 'supplements')
  fs.mkdirSync(evidenceDir)
  fs.mkdirSync(supplementDir)
  writeChecksumEvidenceFixtures(evidenceDir)
  runAuthoring(evidenceDir, supplementDir)
  fail('missing_supplement_authoring_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  assertNoPrivateLeak(output, 'missing_supplement_stdout')
  const parsed = parseJsonOutput(output, 'missing_supplement')
  const sam2 = parsed.validationResults?.find((entry) => entry.toolId === 'sam2')
  if (sam2?.status !== 'blocked_missing_manifest_review_supplement') {
    fail(`missing_supplement_status_unexpected:${sam2?.status}`)
  }
} finally {
  fs.rmSync(missingSupplementRoot, { recursive: true, force: true })
}

const invalidLicenseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-authoring-invalid-license-'))
try {
  const evidenceDir = path.join(invalidLicenseRoot, 'checksum-evidence')
  const supplementDir = path.join(invalidLicenseRoot, 'supplements')
  fs.mkdirSync(evidenceDir)
  fs.mkdirSync(supplementDir)
  writeChecksumEvidenceFixtures(evidenceDir)
  writeSupplementFixtures(supplementDir, {
    rembg: {
      sourceLicenseRef: 'https://signed.example.invalid/rembg/license.json?X-Goog-Signature=abc',
    },
  })
  runAuthoring(evidenceDir, supplementDir)
  fail('invalid_license_authoring_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  assertNoPrivateLeak(output, 'invalid_license_stdout')
  const parsed = parseJsonOutput(output, 'invalid_license')
  const rembg = parsed.validationResults?.find((entry) => entry.toolId === 'rembg')
  if (rembg?.sourceLicenseRefStatus !== 'invalid_public_or_signed_ref') {
    fail(`invalid_license_status_unexpected:${rembg?.sourceLicenseRefStatus}`)
  }
} finally {
  fs.rmSync(invalidLicenseRoot, { recursive: true, force: true })
}

const invalidChecksumRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-authoring-invalid-checksum-'))
try {
  const evidenceDir = path.join(invalidChecksumRoot, 'checksum-evidence')
  const supplementDir = path.join(invalidChecksumRoot, 'supplements')
  fs.mkdirSync(evidenceDir)
  fs.mkdirSync(supplementDir)
  writeChecksumEvidenceFixtures(evidenceDir, {
    real_esrgan: {
      artifactSha256: 'b'.repeat(64),
    },
  })
  writeSupplementFixtures(supplementDir)
  runAuthoring(evidenceDir, supplementDir)
  fail('invalid_checksum_authoring_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  assertNoPrivateLeak(output, 'invalid_checksum_stdout')
  const parsed = parseJsonOutput(output, 'invalid_checksum')
  const realEsrgan = parsed.validationResults?.find((entry) => entry.toolId === 'real_esrgan')
  if (realEsrgan?.status !== 'blocked_invalid_checksum_evidence') {
    fail(`invalid_checksum_status_unexpected:${realEsrgan?.status}`)
  }
} finally {
  fs.rmSync(invalidChecksumRoot, { recursive: true, force: true })
}

const missingToolRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-authoring-missing-tool-'))
try {
  const evidenceDir = path.join(missingToolRoot, 'checksum-evidence')
  const supplementDir = path.join(missingToolRoot, 'supplements')
  fs.mkdirSync(evidenceDir)
  fs.mkdirSync(supplementDir)
  writeChecksumEvidenceFixtures(evidenceDir, {}, ['transparent_background'])
  writeSupplementFixtures(supplementDir)
  runAuthoring(evidenceDir, supplementDir)
  fail('missing_tool_authoring_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  assertNoPrivateLeak(output, 'missing_tool_stdout')
  const parsed = parseJsonOutput(output, 'missing_tool')
  const transparentBackground = parsed.validationResults?.find((entry) => entry.toolId === 'transparent_background')
  if (transparentBackground?.status !== 'missing_checksum_evidence') {
    fail(`missing_tool_status_unexpected:${transparentBackground?.status}`)
  }
} finally {
  fs.rmSync(missingToolRoot, { recursive: true, force: true })
}

const combinedText = [markdown, JSON.stringify(packet), moduleSource, cliSource].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /providerRuntimeApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /modelWeightsDownloaded["`:= ]+true/i,
  /modelWeightsLoaded["`:= ]+true/i,
  /modelInferencePerformed["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /from_pretrained/i,
  /snapshot_download/i,
  /hf_hub_download/i,
  /torch\.load/i,
  /load_state_dict/i,
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

const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) fail(`generated_media_or_font_changed:${file}`)
}

if (errors.length) {
  console.error('AI graphics model-weight manifest authoring diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  modelWeightManifestAuthoringTools: packet.counts.modelWeightManifestAuthoringTools,
  localPrivateManifestDraftsReady: packet.counts.localPrivateManifestDraftsReady,
  manifestReviewValidatorInputReadyRecords: packet.counts.manifestReviewValidatorInputReadyRecords,
  privateArtifactRefsLogged: packet.counts.privateArtifactRefsLogged,
  gpuRuntimeOnDemandOnly: packet.booleans.gpuRuntimeOnDemandOnly,
  noIdleGpuRuntimeApproved: packet.booleans.noIdleGpuRuntimeApproved,
}, null, 2))
