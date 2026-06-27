import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-manifest-review-packet:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-manifest-review-packet-diagnostics.mjs'

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const modelTemplateIds = [
  'sam2_checkpoint',
  'birefnet_model',
  'real_esrgan_model',
  'rembg_model',
  'transparent_background_model',
]

const modelTemplateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

const requiredManifestFields = [
  'manifestId',
  'toolId',
  'templateId',
  'privateArtifactRef',
  'checksumSha256',
  'sourceLicenseRef',
  'modelCardRef',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/cli/ai-graphics-model-weight-manifest-review.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const readiness = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const worker = json('docs/tool-intelligence/ai-graphics/worker-handoff-readiness-contract.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const source = read('server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-manifest-review.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.md')

if (pkg.scripts?.['ai-graphics:model-weight-manifest-review:validate'] !== 'tsx server/cli/ai-graphics-model-weight-manifest-review.ts') {
  fail('missing_package_script:ai-graphics:model-weight-manifest-review:validate')
}
if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-manifest-readiness'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_readiness')
}

if (packet.decision !== 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (packet.contractSurface?.localPrivateManifestValidator !== 'server/cli/ai-graphics-model-weight-manifest-review.ts') {
  fail('packet_missing_local_private_manifest_validator')
}
if (packet.contractSurface?.localPrivateManifestValidatorScript !== 'ai-graphics:model-weight-manifest-review:validate') {
  fail('packet_missing_local_private_manifest_validator_script')
}
if (readiness.decision !== 'ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks') {
  fail(`unexpected_readiness_decision:${readiness.decision}`)
}
if (gpuGate.runtimeReadinessScript?.modelWeightManifestContentValidation !== true) {
  fail('gpu_runtime_gate_does_not_validate_manifest_content')
}
if (worker.decision !== 'ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks') {
  fail('worker_handoff_source_not_accepted')
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail('beta_gate_source_not_accepted')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestRequiredTools: 5,
  manifestRecordsProvided: 0,
  schemaValidManifestRecords: 0,
  reviewAcceptedManifestRecords: 0,
  nativeGpuProofInputEligibleRecords: 0,
  privateArtifactRefsLogged: 0,
  localPrivateManifestValidatorPrepared: 1,
  betaReadyModelWeightTools: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

if (!Array.isArray(packet.validationResults) || packet.validationResults.length !== 5) {
  fail(`validation_result_count_not_5:${packet.validationResults?.length}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestRequiredTools?.includes(tool)) fail(`packet_missing_model_weight_tool:${tool}`)
  if (!JSON.stringify(packet.validationResults || []).includes(`"toolId":"${tool}"`)) {
    fail(`validation_missing_tool:${tool}`)
  }
  const result = (packet.validationResults || []).find((entry) => entry.toolId === tool)
  if (result?.manifestRecordProvided !== false) fail(`manifest_record_provided_not_false:${tool}`)
  if (result?.schemaValid !== false) fail(`schema_valid_not_false_without_private_record:${tool}`)
  if (result?.reviewAccepted !== false) fail(`review_accepted_not_false_without_private_record:${tool}`)
  if (result?.eligibleForNativeGpuProofInput !== false) fail(`gpu_proof_input_not_false_without_private_record:${tool}`)
  if (result?.approvedForAgentExecutionNow !== false) fail(`agent_execution_not_false:${tool}`)
  if (result?.privateArtifactRefStatus !== 'missing') fail(`private_artifact_ref_status_not_missing:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}

for (const templateId of modelTemplateIds) {
  if (!packet.modelWeightTemplateIdsCovered?.includes(templateId)) fail(`packet_missing_template:${templateId}`)
  if (!source.includes(`templateId: '${templateId}'`)) fail(`source_missing_template:${templateId}`)
}

for (const field of requiredManifestFields) {
  if (!packet.requiredManifestFields?.includes(field)) fail(`packet_missing_required_field:${field}`)
  if (!source.includes(field)) fail(`source_missing_required_field:${field}`)
  if (!markdown.includes(`\`${field}\``)) fail(`markdown_missing_required_field:${field}`)
}

for (const token of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION',
  'AiGraphicsModelWeightManifestValidationResult',
  'AiGraphicsModelWeightManifestReviewPacket',
  'validateAiGraphicsModelWeightManifestRecord',
  'validateAiGraphicsModelWeightManifestRecords',
  'buildAiGraphicsModelWeightManifestReviewPacket',
  'privateArtifactRefStatus',
  'sha256Pattern',
  'privateArtifactRefNamespaceRequired',
  'present_private_ref_not_logged',
  'invalid_public_or_signed_ref',
  'privateArtifactRef must be a reviewed private storage reference',
  'reviewed private storage reference using private://',
  'reeditpro-private-artifact-ref-',
  'checksumSha256 must be a 64-character hex SHA-256 digest',
]) {
  if (!source.includes(token)) fail(`source_missing:${token}`)
}

for (const key of [
  'modelWeightManifestReviewPacketPrepared',
  'sourceManifestReadinessContractAccepted',
  'all5ModelWeightToolsCovered',
  'all5TemplateTypesCovered',
  'manifestSchemaValidationReady',
  'localPrivateManifestValidatorPrepared',
  'privateArtifactRefNamespaceRequired',
  'privateArtifactRefsNotLogged',
  'publicOrSignedArtifactRefsRejected',
  'checksumSha256Required',
  'licenseReviewRequired',
  'provenanceReviewRequired',
  'qualityReviewRequired',
  'securityReviewRequired',
  'nativeGpuProofStillRequired',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const token of [
  'buildAiGraphicsModelWeightManifestReviewPacket',
  'localPrivateManifestFilesRead',
  'privateArtifactRefsLogged: 0',
  '--manifest-dir',
  '--manifest-file',
  '--manifest',
]) {
  if (!cliSource.includes(token)) fail(`cli_source_missing:${token}`)
}

function writeManifestFixtures(directory, override = {}) {
  for (const [toolId, templateId] of Object.entries(modelTemplateIdByTool)) {
    const manifest = {
      manifestId: `${toolId}_private_manifest_review_v1`,
      toolId,
      templateId,
      privateArtifactRef: `private://reeditpro/ai-graphics/model-weights/${toolId}/model_tree_manifest.json`,
      checksumSha256: 'a'.repeat(64),
      sourceLicenseRef: `private://reeditpro/license-evidence/${toolId}.json`,
      modelCardRef: `private://reeditpro/model-card/${toolId}.json`,
      commercialUseReviewed: true,
      redistributionReviewed: true,
      qualityReviewed: true,
      securityReviewed: true,
      provenanceReviewed: true,
      approvedForInternalBeta: true,
      ...(override[toolId] || {}),
    }
    fs.writeFileSync(path.join(directory, `${toolId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }
}

function runValidator(directory) {
  return execFileSync('npm', [
    'run',
    '--silent',
    'ai-graphics:model-weight-manifest-review:validate',
    '--',
    '--manifest-dir',
    directory,
  ], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

const validFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-manifest-valid-'))
try {
  writeManifestFixtures(validFixtureDir)
  const output = runValidator(validFixtureDir)
  const parsed = JSON.parse(output)
  if (parsed.manifestRecordsProvided !== 5) fail('fixture_valid_manifest_records_provided_not_5')
  if (parsed.schemaValidManifestRecords !== 5) fail('fixture_valid_schema_records_not_5')
  if (parsed.reviewAcceptedManifestRecords !== 5) fail('fixture_valid_review_records_not_5')
  if (parsed.nativeGpuProofInputEligibleRecords !== 5) fail('fixture_valid_gpu_input_records_not_5')
  if (parsed.privateArtifactRefsLogged !== 0) fail('fixture_valid_private_refs_logged_not_zero')
  if (output.includes('private://reeditpro/ai-graphics/model-weights/')) fail('fixture_valid_private_ref_leaked')
} catch (error) {
  fail(`fixture_valid_cli_failed:${error.message}`)
} finally {
  fs.rmSync(validFixtureDir, { recursive: true, force: true })
}

const invalidFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-manifest-invalid-'))
try {
  writeManifestFixtures(invalidFixtureDir, {
    sam2: {
      privateArtifactRef: 'https://signed.example.invalid/sam2/model_tree_manifest.json?X-Goog-Signature=abc',
    },
  })
  runValidator(invalidFixtureDir)
  fail('fixture_invalid_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_invalid_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const sam2 = parsed.validationResults?.find((entry) => entry.toolId === 'sam2')
    if (sam2?.privateArtifactRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`fixture_invalid_ref_status_unexpected:${sam2?.privateArtifactRefStatus}`)
    }
    if (!sam2?.errors?.some((message) => /private storage reference/.test(message))) {
      fail('fixture_invalid_ref_error_missing')
    }
    if (output.includes('https://signed.example.invalid')) fail('fixture_invalid_public_url_leaked')
  }
} finally {
  fs.rmSync(invalidFixtureDir, { recursive: true, force: true })
}

const invalidNamespaceFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-manifest-invalid-namespace-'))
try {
  writeManifestFixtures(invalidNamespaceFixtureDir, {
    birefnet: {
      privateArtifactRef: 'model-weights/birefnet/model_tree_manifest.json',
    },
  })
  runValidator(invalidNamespaceFixtureDir)
  fail('fixture_invalid_namespace_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_invalid_namespace_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const birefnet = parsed.validationResults?.find((entry) => entry.toolId === 'birefnet')
    if (birefnet?.privateArtifactRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`fixture_invalid_namespace_status_unexpected:${birefnet?.privateArtifactRefStatus}`)
    }
    if (!birefnet?.errors?.some((message) => /reviewed private storage reference/.test(message))) {
      fail('fixture_invalid_namespace_error_missing')
    }
    if (output.includes('model-weights/birefnet/model_tree_manifest.json')) {
      fail('fixture_invalid_namespace_ref_leaked')
    }
  }
} finally {
  fs.rmSync(invalidNamespaceFixtureDir, { recursive: true, force: true })
}

for (const key of [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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

const combinedText = [markdown, JSON.stringify(packet), source].join('\n')
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
  console.error('AI graphics model-weight manifest review packet diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  modelWeightManifestRequiredTools: packet.counts.modelWeightManifestRequiredTools,
  manifestRecordsProvided: packet.counts.manifestRecordsProvided,
  schemaValidManifestRecords: packet.counts.schemaValidManifestRecords,
  reviewAcceptedManifestRecords: packet.counts.reviewAcceptedManifestRecords,
  nativeGpuProofInputEligibleRecords: packet.counts.nativeGpuProofInputEligibleRecords,
  privateArtifactRefsLogged: packet.counts.privateArtifactRefsLogged,
  betaReadyModelWeightTools: packet.counts.betaReadyModelWeightTools,
}, null, 2))
