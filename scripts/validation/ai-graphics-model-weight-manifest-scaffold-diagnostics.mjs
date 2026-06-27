import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-manifest-scaffold:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-manifest-scaffold-diagnostics.mjs'
const scaffoldScriptName = 'ai-graphics:model-weight-manifest-scaffold'
const scaffoldScriptCommand = 'tsx server/cli/ai-graphics-model-weight-manifest-scaffold.ts'

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

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
}

const expectedRuntimePaths = {
  sam2: '/opt/reeditpro/model-weights/sam2/model_tree_manifest.json',
  birefnet: '/opt/reeditpro/model-weights/birefnet/model_tree_manifest.json',
  real_esrgan: '/opt/reeditpro/model-weights/real-esrgan/model_tree_manifest.json',
  rembg: '/opt/reeditpro/model-weights/rembg/model_tree_manifest.json',
  transparent_background: '/opt/reeditpro/model-weights/transparent-background/model_tree_manifest.json',
}

const expectedCandidateIds = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_isnet_general_use_review_candidate',
  transparent_background: 'plemeri_transparent_background_base_ckpt_review_candidate',
}

const expectedArtifactFileNames = {
  sam2: 'sam2.1_hiera_tiny.pt',
  real_esrgan: 'RealESRGAN_x4plus.pth',
  rembg: 'isnet-general-use.onnx',
  transparent_background: 'ckpt_base.pth',
}

const failures = []

function fail(message) {
  failures.push(message)
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

function runNpm(args) {
  return execFileSync('npm', ['run', '--silent', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_output:${label}:${error.message}`)
    return {}
  }
}

function manifestPath(root, toolId) {
  return path.join(root, directoryNameByTool[toolId], 'model_tree_manifest.json')
}

function makeValidManifest(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    privateArtifactRef: `private://reeditpro/ai-graphics/model-weights/${directoryNameByTool[toolId]}/model_tree_manifest.json`,
    checksumSha256: 'b'.repeat(64),
    sourceLicenseRef: `private://reeditpro/license-evidence/${toolId}.json`,
    modelCardRef: `private://reeditpro/model-card/${toolId}.json`,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-scaffold.ts',
  'server/cli/ai-graphics-model-weight-manifest-scaffold.ts',
  'server/cli/ai-graphics-model-weight-manifest-review.ts',
  'server/cli/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.json',
  'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.json')
const sourceCatalog = json('docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json')
const manifestPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const commandPlanPacket = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-manifest-scaffold.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-manifest-scaffold.ts')
const validatorSource = read('server/cli/ai-graphics-model-weight-manifest-review.ts')
const commandPlanCliSource = read('server/cli/ai-graphics-gpu-runtime-proof-command-plan.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.md')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[scaffoldScriptName] !== scaffoldScriptCommand) fail(`missing_package_script:${scaffoldScriptName}`)
if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-manifest-scaffold'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_scaffold')
}

if (packet.decision !== 'ai_graphics_model_weight_manifest_scaffold_prepared_for_local_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (manifestPacket.decision !== 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records') {
  fail('manifest_review_packet_source_not_accepted')
}
if (sourceCatalog.decision !== 'ai_graphics_model_weight_source_catalog_prepared_with_review_blocks') {
  fail('source_catalog_source_not_accepted')
}
if (packet.sourceEvidence?.modelWeightSourceCatalog !== 'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json') {
  fail('packet_missing_model_weight_source_catalog_evidence')
}
if (commandPlanPacket.decision !== 'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks') {
  fail('gpu_runtime_command_plan_source_not_accepted')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  modelWeightManifestRequiredTools: 5,
  scaffoldTemplatesPrepared: 5,
  sourceCandidateGuidanceRecords: 5,
  privateArtifactRefsLogged: 0,
  manifestRecordsApprovedNow: 0,
  nativeGpuProofInputEligibleNow: 0,
  runtimeReadyNow: 0,
  internalBetaReadyNow: 0,
  productionReadyNow: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestRequiredTools?.includes(tool)) fail(`packet_missing_tool:${tool}`)
  if (!moduleSource.includes(`'${tool}'`)) fail(`module_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!JSON.stringify(packet.scaffoldFiles || []).includes(expectedRuntimePaths[tool])) {
    fail(`packet_missing_runtime_path:${tool}`)
  }
  const scaffoldFile = (packet.scaffoldFiles || []).find((entry) => entry.toolId === tool)
  const sourceCandidate = (sourceCatalog.sourceCandidates || []).find((entry) => entry.toolId === tool)
  if (!scaffoldFile?.sourceCandidateGuidance) fail(`packet_missing_source_candidate_guidance:${tool}`)
  if (!sourceCandidate) fail(`source_catalog_missing_candidate:${tool}`)
  if (scaffoldFile?.sourceCandidateGuidance?.candidateId !== expectedCandidateIds[tool]) {
    fail(`packet_candidate_guidance_id_mismatch:${tool}:${scaffoldFile?.sourceCandidateGuidance?.candidateId}`)
  }
  if (sourceCandidate && scaffoldFile?.sourceCandidateGuidance?.candidateId !== sourceCandidate.candidateId) {
    fail(`packet_candidate_guidance_not_sourced_from_catalog:${tool}`)
  }
  if (expectedArtifactFileNames[tool] && scaffoldFile?.sourceCandidateGuidance?.artifactFileName !== expectedArtifactFileNames[tool]) {
    fail(`packet_candidate_guidance_artifact_mismatch:${tool}:${scaffoldFile?.sourceCandidateGuidance?.artifactFileName}`)
  }
}
if (!JSON.stringify(packet.scaffoldFiles || []).includes('d692e3dd5fa1b9658949d452bebf1cda')) {
  fail('packet_missing_transparent_background_upstream_md5')
}
if (!JSON.stringify(packet.scaffoldFiles || []).includes('blocked_until_source_review_accepts_selected_candidate')) {
  fail('packet_missing_source_review_block_status')
}

for (const token of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION',
  'buildAiGraphicsModelWeightManifestScaffoldPacket',
  'listAiGraphicsModelWeightSourceCandidates',
  'sourceCandidateGuidanceForTool',
  'upstreamArtifactChecksumMd5ByTool',
  'blocked_until_source_review_accepts_selected_candidate',
  'public://replace-with-reviewed-private-artifact-ref',
  'REPLACE_WITH_64_HEX_SHA256',
  'template_only_not_reviewed',
  'templatesInvalidUntilOwnerReviewed',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--out-dir',
  '--force',
  'privateArtifactRefsLogged: 0',
  'scaffoldTemplatesAreReviewInvalid: true',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const source of [
  ['manifest_validator', validatorSource],
  ['gpu_command_plan_cli', commandPlanCliSource],
]) {
  if (!source[1].includes('statSync')) fail(`${source[0]}_does_not_support_recursive_manifest_dir`)
  if (!source[1].includes('jsonFilesInDirectory(entryPath)')) fail(`${source[0]}_missing_recursive_json_discovery`)
}

for (const key of [
  'modelWeightManifestScaffoldPrepared',
  'all5ModelWeightToolsCovered',
  'runtimeMountLayoutPrepared',
  'templatesInvalidUntilOwnerReviewed',
  'privateArtifactRefsNotLogged',
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

const scaffoldDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-manifest-scaffold-'))
const scaffoldOutput = runNpm([scaffoldScriptName, '--', '--out-dir', scaffoldDir])
const scaffoldRun = parseOutput(scaffoldOutput, 'scaffold')
if (scaffoldRun.output?.writtenFiles?.length !== 5) fail(`scaffold_written_file_count:${scaffoldRun.output?.writtenFiles?.length}`)
if (scaffoldRun.output?.privateArtifactRefsLogged !== 0) fail('scaffold_private_artifact_refs_logged_not_zero')
if (scaffoldRun.output?.scaffoldTemplatesAreReviewInvalid !== true) fail('scaffold_templates_not_marked_invalid')
if (!JSON.stringify(scaffoldRun.scaffoldRecords || []).includes('isnet-general-use.onnx')) {
  fail('scaffold_run_missing_rembg_source_guidance')
}
if (!JSON.stringify(scaffoldRun.scaffoldRecords || []).includes('ckpt_base.pth')) {
  fail('scaffold_run_missing_transparent_background_source_guidance')
}
if (!JSON.stringify(scaffoldRun.scaffoldRecords || []).includes('d692e3dd5fa1b9658949d452bebf1cda')) {
  fail('scaffold_run_missing_transparent_background_md5_guidance')
}

for (const tool of modelWeightTools) {
  const filePath = manifestPath(scaffoldDir, tool)
  if (!fs.existsSync(filePath)) fail(`scaffold_missing_file:${tool}`)
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (manifest.toolId !== tool) fail(`scaffold_tool_id_mismatch:${tool}`)
  if (manifest.templateId !== templateIdByTool[tool]) fail(`scaffold_template_id_mismatch:${tool}`)
  if (!manifest.privateArtifactRef.startsWith('public://replace-with-reviewed-private-artifact-ref/')) {
    fail(`scaffold_private_ref_placeholder_not_invalid:${tool}`)
  }
  if (manifest.checksumSha256 !== 'REPLACE_WITH_64_HEX_SHA256') fail(`scaffold_checksum_placeholder_mismatch:${tool}`)
  for (const field of [
    'commercialUseReviewed',
    'redistributionReviewed',
    'qualityReviewed',
    'securityReviewed',
    'provenanceReviewed',
    'approvedForInternalBeta',
  ]) {
    if (manifest[field] !== false) fail(`scaffold_boolean_not_false:${tool}:${field}`)
  }
}

let scaffoldValidationOutput = ''
let scaffoldValidationFailed = false
try {
  scaffoldValidationOutput = runNpm(['ai-graphics:model-weight-manifest-review:validate', '--', '--manifest-dir', scaffoldDir])
} catch (error) {
  scaffoldValidationFailed = true
  scaffoldValidationOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!scaffoldValidationFailed) fail('invalid_scaffold_validation_did_not_fail')
const scaffoldValidation = parseOutput(scaffoldValidationOutput, 'invalid_scaffold_validation')
if (scaffoldValidation.manifestRecordsProvided !== 5) fail('invalid_scaffold_records_provided_not_5')
if (scaffoldValidation.schemaValidManifestRecords !== 0) fail('invalid_scaffold_schema_valid_not_0')
if (!JSON.stringify(scaffoldValidation).includes('invalid_public_or_signed_ref')) {
  fail('invalid_scaffold_missing_invalid_public_or_signed_status')
}
if (scaffoldValidationOutput.includes('public://replace-with-reviewed-private-artifact-ref')) {
  fail('invalid_scaffold_output_leaked_placeholder_artifact_ref')
}

for (const tool of modelWeightTools) {
  fs.writeFileSync(manifestPath(scaffoldDir, tool), `${JSON.stringify(makeValidManifest(tool), null, 2)}\n`, 'utf8')
}

const validValidationOutput = runNpm(['ai-graphics:model-weight-manifest-review:validate', '--', '--manifest-dir', scaffoldDir])
const validValidation = parseOutput(validValidationOutput, 'valid_nested_validation')
if (validValidation.manifestRecordsProvided !== 5) fail('valid_nested_records_provided_not_5')
if (validValidation.schemaValidManifestRecords !== 5) fail('valid_nested_schema_valid_not_5')
if (validValidation.reviewAcceptedManifestRecords !== 5) fail('valid_nested_review_accepted_not_5')
if (validValidation.nativeGpuProofInputEligibleRecords !== 5) fail('valid_nested_gpu_input_not_5')
if (validValidationOutput.includes('private://reeditpro')) fail('valid_nested_validation_leaked_private_ref')

const commandPlanOutput = runNpm(['ai-graphics:gpu-runtime-proof-command-plan', '--', '--manifest-dir', scaffoldDir])
const commandPlan = parseOutput(commandPlanOutput, 'valid_nested_command_plan')
if (commandPlan.nativeGpuProofInputStatus !== 'ready_for_native_gpu_runtime_probe_input') {
  fail(`valid_nested_command_plan_status:${commandPlan.nativeGpuProofInputStatus}`)
}
if (commandPlan.input?.privateArtifactRefsLogged !== 0) fail('command_plan_private_artifact_refs_logged_not_zero')
if (commandPlanOutput.includes('private://reeditpro')) fail('command_plan_leaked_private_ref')
if (!commandPlanOutput.includes('$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT/sam2')) {
  fail('command_plan_missing_mount_placeholder')
}
for (const profile of commandPlan.runtimeProfiles || []) {
  if (!String(profile.resultCaptureCommand || '').includes('test -n "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"')) {
    fail(`command_plan_missing_private_root_guard:${profile.profileId}`)
  }
  if (!String(profile.resultCaptureCommand || '').includes('test -d "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"')) {
    fail(`command_plan_missing_private_root_directory_guard:${profile.profileId}`)
  }
}

let noOutDirFailed = false
try {
  runNpm([scaffoldScriptName])
} catch {
  noOutDirFailed = true
}
if (!noOutDirFailed) fail('scaffold_without_out_dir_did_not_fail')

let overwriteFailed = false
try {
  runNpm([scaffoldScriptName, '--', '--out-dir', scaffoldDir])
} catch {
  overwriteFailed = true
}
if (!overwriteFailed) fail('scaffold_without_force_did_not_protect_existing_files')

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /modelInferencePerformed["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

for (const [label, text] of [
  ['module', moduleSource],
  ['cli', cliSource],
  ['markdown', markdown],
  ['packet', JSON.stringify(packet)],
]) {
  for (const pattern of forbiddenTruePatterns) {
    if (pattern.test(text)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

const packageLockDiff = git(['diff', '--name-only', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

const changedPackageJson = git(['diff', '--', 'package.json'])
if (/dependencies|devDependencies|optionalDependencies|peerDependencies/.test(changedPackageJson)) {
  fail('package_dependency_section_changed')
}

const changedFiles = [
  ...git(['diff', '--name-only']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
]
for (const file of changedFiles) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|build|coverage|public\/generated|generated|render|renders|browser-output|canvas-output|webgl-output|media-output)\//i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
}

try {
  git(['cat-file', '-e', `${baseRef}:package-lock.json`])
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff) fail('package_lock_differs_from_base')
} catch {
  fail(`base_ref_unavailable:${baseRef}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  scaffoldTemplatesPrepared: 5,
  invalidScaffoldRecordsProvided: scaffoldValidation.manifestRecordsProvided,
  validNestedManifestStatus: validValidation.nativeGpuProofInputEligibleRecords === 5,
  commandPlanStatus: commandPlan.nativeGpuProofInputStatus,
  privateArtifactRefsLogged: packet.counts?.privateArtifactRefsLogged,
  runtimeReadyNow: packet.booleans?.runtimeReadyNow,
}, null, 2))
