import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const validateScriptName = 'ai-graphics:model-weight-manifest-supplement:validate'
const validateScriptCommand = 'tsx server/cli/ai-graphics-model-weight-manifest-supplement.ts'
const diagnosticScriptName = 'ai-graphics:model-weight-manifest-supplement:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-model-weight-manifest-supplement-diagnostics.mjs'

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const sourceCandidateIdByTool = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_isnet_general_use_review_candidate',
  transparent_background: 'plemeri_transparent_background_base_ckpt_review_candidate',
}

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
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
    'reeditpro-private://',
    'reeditpro-private-artifact-ref-',
    'signed.example.invalid',
    'public.example.invalid',
    'gs://reeditpro',
  ]) {
    if (output.includes(token)) fail(`private_or_public_ref_leaked:${label}:${token}`)
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-supplement.ts',
  'server/cli/ai-graphics-model-weight-manifest-supplement.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-supplement-scaffold.ts',
  'server/cli/ai-graphics-model-weight-manifest-supplement-scaffold.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-authoring.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement.json')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-manifest-supplement.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-manifest-supplement.ts')
const scaffoldSource = read('server/tool-registry/ai-graphics-model-weight-manifest-supplement-scaffold.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement.md')
const scaffoldMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.md')
const authoringMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md')
const checksumMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md')

if (pkg.scripts?.[validateScriptName] !== validateScriptCommand) fail(`missing_package_script:${validateScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-model-weight-manifest-supplement'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_supplement')
}
if (packet.decision !== 'ai_graphics_model_weight_manifest_supplement_prepared_with_no_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestSupplementTools: 5,
  manifestSupplementRecordsProvided: 0,
  manifestSupplementRecordsAccepted: 0,
  manifestAuthoringEligibleRecords: 0,
  privateArtifactRefsLogged: 0,
  betaReadyModelWeightTools: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestSupplementTools?.includes(tool)) fail(`packet_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!moduleSource.includes(tool)) fail(`module_missing_tool:${tool}`)
  const result = packet.validationResults?.find((entry) => entry.toolId === tool)
  if (!result) fail(`packet_missing_validation_result:${tool}`)
  if (result?.expectedSourceCandidateId !== sourceCandidateIdByTool[tool]) {
    fail(`expected_source_candidate_mismatch:${tool}:${result?.expectedSourceCandidateId}`)
  }
  if (result?.reviewAccepted !== false) fail(`committed_supplement_unexpectedly_accepted:${tool}`)
}

for (const field of requiredSupplementFields) {
  if (!packet.requiredSupplementFields?.includes(field)) fail(`packet_missing_supplement_field:${field}`)
  if (!moduleSource.includes(field)) fail(`module_missing_supplement_field:${field}`)
  if (!markdown.includes(`\`${field}\``)) fail(`markdown_missing_supplement_field:${field}`)
}

for (const token of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_DECISION',
  'validateAiGraphicsModelWeightManifestSupplementRecord',
  'buildAiGraphicsModelWeightManifestSupplementPacket',
  'sourceLicenseRef must be a reviewed private source/license evidence reference',
  'modelCardRef must be a reviewed private model-card/provenance reference',
  'present_private_ref_not_logged',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--supplement',
  '--supplement-file',
  '--supplement-dir',
  'manifest-supplement-authoring-checklist.json',
  'localPrivateManifestSupplementFilesRead',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const token of [
  'ai-graphics:model-weight-manifest-supplement:validate',
  'ai-graphics:model-weight-manifest-authoring',
]) {
  if (!markdown.includes(token)) fail(`markdown_missing_command:${token}`)
  if (!scaffoldMarkdown.includes(token)) fail(`scaffold_markdown_missing_command:${token}`)
  if (!authoringMarkdown.includes(token)) fail(`authoring_markdown_missing_command:${token}`)
}
if (!checksumMarkdown.includes('ai-graphics:model-weight-manifest-supplement:validate')) {
  fail('checksum_markdown_missing_supplement_validator_command')
}
if (!scaffoldSource.includes('ai-graphics:model-weight-manifest-supplement:validate')) {
  fail('scaffold_source_missing_supplement_validator_command')
}

for (const key of [
  'manifestSupplementValidatorPrepared',
  'sourceModelWeightSourceCatalogAccepted',
  'all5ModelWeightToolsCovered',
  'sourceLicensePrivateRefsRequired',
  'modelCardPrivateRefsRequired',
  'privateArtifactRefsNotLogged',
  'publicOrSignedRefsRejected',
  'commercialUseReviewRequired',
  'redistributionReviewRequired',
  'provenanceReviewRequired',
  'qualityReviewRequired',
  'securityReviewRequired',
  'approvedForInternalBetaReviewRequired',
  'manifestAuthoringOnly',
  'checksumEvidenceStillRequired',
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
  'mediaProcessingPerformed',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (packet.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const defaultOutput = runNpm(validateScriptName)
const defaultPacket = parseJsonOutput(defaultOutput, 'default_validate')
if (defaultPacket.manifestSupplementRecordsProvided !== 0) fail('default_records_provided_not_zero')
if (defaultPacket.manifestSupplementRecordsAccepted !== 0) fail('default_records_accepted_not_zero')

function writeValidSupplementFixtures(directory) {
  for (const toolId of modelWeightTools) {
    const supplementPath = path.join(directory, directoryNameByTool[toolId], 'manifest-review-supplement.json')
    fs.mkdirSync(path.dirname(supplementPath), { recursive: true })
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
    }
    fs.writeFileSync(supplementPath, `${JSON.stringify(supplement, null, 2)}\n`, 'utf8')
  }
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-supplement-validator-'))
try {
  const scaffoldDir = path.join(tempRoot, 'scaffold')
  const validDir = path.join(tempRoot, 'valid')
  runNpm('ai-graphics:model-weight-manifest-supplement-scaffold', ['--out-dir', scaffoldDir])

  try {
    runNpm(validateScriptName, ['--supplement-dir', scaffoldDir])
    fail('placeholder_supplements_unexpectedly_passed')
  } catch (error) {
    const output = String(error.stdout || '')
    const invalidPacket = parseJsonOutput(output, 'placeholder_validate')
    const sam2 = invalidPacket.validationResults?.find((entry) => entry.toolId === 'sam2')
    if (sam2?.sourceLicenseRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`placeholder_source_license_status_unexpected:${sam2?.sourceLicenseRefStatus}`)
    }
    if (sam2?.modelCardRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`placeholder_model_card_status_unexpected:${sam2?.modelCardRefStatus}`)
    }
    if (invalidPacket.manifestAuthoringEligibleRecords !== 0) fail('placeholder_authoring_eligible_not_zero')
  }

  writeValidSupplementFixtures(validDir)
  const validOutput = runNpm(validateScriptName, ['--supplement-dir', validDir])
  assertNoPrivateLeak(validOutput, 'valid_supplement_validate')
  const validPacket = parseJsonOutput(validOutput, 'valid_supplement_validate')
  if (validPacket.manifestSupplementRecordsProvided !== 5) {
    fail(`valid_records_provided_not_5:${validPacket.manifestSupplementRecordsProvided}`)
  }
  if (validPacket.manifestSupplementRecordsAccepted !== 5) {
    fail(`valid_records_accepted_not_5:${validPacket.manifestSupplementRecordsAccepted}`)
  }
  if (validPacket.manifestAuthoringEligibleRecords !== 5) {
    fail(`valid_authoring_eligible_not_5:${validPacket.manifestAuthoringEligibleRecords}`)
  }
  for (const result of validPacket.validationResults || []) {
    if (result.sourceLicenseRefStatus !== 'present_private_ref_not_logged') {
      fail(`valid_source_license_status_unexpected:${result.toolId}:${result.sourceLicenseRefStatus}`)
    }
    if (result.modelCardRefStatus !== 'present_private_ref_not_logged') {
      fail(`valid_model_card_status_unexpected:${result.toolId}:${result.modelCardRefStatus}`)
    }
    if (result.approvedForAgentExecutionNow !== false) {
      fail(`valid_result_approved_for_agent_execution:${result.toolId}`)
    }
  }
} catch (error) {
  fail(`validator_flow_failed:${error.message}`)
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true })
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
  console.error('AI graphics model-weight manifest supplement diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  modelWeightManifestSupplementTools: packet.counts.modelWeightManifestSupplementTools,
  manifestSupplementRecordsAccepted: packet.counts.manifestSupplementRecordsAccepted,
  manifestAuthoringEligibleRecords: packet.counts.manifestAuthoringEligibleRecords,
  privateArtifactRefsLogged: packet.counts.privateArtifactRefsLogged,
  runtimeReadyTools: 0,
}, null, 2))
