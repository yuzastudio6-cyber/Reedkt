import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-checksum-evidence-scaffold:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-checksum-evidence-scaffold-diagnostics.mjs'
const scaffoldScriptName = 'ai-graphics:model-weight-checksum-evidence-scaffold'
const scaffoldScriptCommand = 'tsx server/cli/ai-graphics-model-weight-checksum-evidence-scaffold.ts'

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
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
  birefnet: 'ZhengPeng7/BiRefNet',
  real_esrgan: 'RealESRGAN_x4plus.pth',
  rembg: 'isnet-general-use.onnx',
  transparent_background: 'ckpt_base.pth',
}

const expectedSuggestedChecksums = {
  sam2: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  birefnet: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  real_esrgan: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
}

const expectedSuggestedChecksumSources = {
  sam2: 'existing_internal_aggregate_sha256',
  birefnet: 'existing_internal_aggregate_sha256',
  real_esrgan: 'existing_internal_file_sha256',
  rembg: 'requires_private_artifact_sha256',
  transparent_background: 'requires_private_artifact_sha256',
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

function evidencePath(root, toolId) {
  return path.join(root, directoryNameByTool[toolId], 'checksum-evidence.json')
}

function makeValidEvidence(toolId) {
  return {
    evidenceId: `${toolId}_private_checksum_evidence_v1`,
    toolId,
    sourceCandidateId: expectedCandidateIds[toolId],
    artifactFileName: expectedArtifactFileNames[toolId],
    artifactSha256: expectedSuggestedChecksums[toolId] ?? (toolId === 'rembg' ? 'c'.repeat(64) : 'd'.repeat(64)),
    checksumEvidenceRef: `private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
    sourceArtifactRef: `private://reeditpro/ai-graphics/model-weights/${toolId}/source-artifact`,
    hashCommand: `sha256sum ${expectedArtifactFileNames[toolId]}`,
    checksumEvidenceReviewed: true,
    sourceArtifactReviewed: true,
    provenanceReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    approvedForManifestAuthoring: true,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-checksum-evidence-scaffold.ts',
  'server/cli/ai-graphics-model-weight-checksum-evidence-scaffold.ts',
  'server/cli/ai-graphics-model-weight-checksum-evidence.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.md',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.json',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json',
  'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.json')
const checksumPacket = json('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json')
const sourceCatalog = json('docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-checksum-evidence-scaffold.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-checksum-evidence-scaffold.ts')
const validatorSource = read('server/cli/ai-graphics-model-weight-checksum-evidence.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.md')
const checksumMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[scaffoldScriptName] !== scaffoldScriptCommand) fail(`missing_package_script:${scaffoldScriptName}`)
if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-checksum-evidence-scaffold'")) {
  fail('server_registry_index_does_not_export_model_weight_checksum_evidence_scaffold')
}

if (packet.decision !== 'ai_graphics_model_weight_checksum_evidence_scaffold_prepared_for_local_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (checksumPacket.decision !== 'ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records') {
  fail(`unexpected_checksum_packet_decision:${checksumPacket.decision}`)
}
if (sourceCatalog.decision !== 'ai_graphics_model_weight_source_catalog_prepared_with_review_blocks') {
  fail(`unexpected_source_catalog_decision:${sourceCatalog.decision}`)
}
if (checksumPacket.sourceEvidence?.modelWeightChecksumEvidenceScaffold !== 'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.json') {
  fail('checksum_packet_missing_scaffold_source')
}
if (!checksumMarkdown.includes('ai-graphics:model-weight-checksum-evidence-scaffold')) {
  fail('checksum_markdown_missing_scaffold_command')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  modelWeightChecksumEvidenceRequiredTools: 5,
  scaffoldTemplatesPrepared: 5,
  sourceCandidateGuidanceRecords: 5,
  checksumEvidenceAuthoringChecklistItems: 5,
  privateArtifactRefsLogged: 0,
  checksumEvidenceRefsLogged: 0,
  checksumEvidenceRecordsApprovedNow: 0,
  manifestAuthoringEligibleNow: 0,
  runtimeReadyNow: 0,
  internalBetaReadyNow: 0,
  productionReadyNow: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightChecksumEvidenceRequiredTools?.includes(tool)) fail(`packet_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  const scaffold = (packet.scaffoldFiles || []).find((entry) => entry.toolId === tool)
  if (!scaffold) fail(`packet_missing_scaffold_file:${tool}`)
  if (scaffold?.relativeFilePath !== `${directoryNameByTool[tool]}/checksum-evidence.json`) {
    fail(`packet_scaffold_path_mismatch:${tool}:${scaffold?.relativeFilePath}`)
  }
  if (scaffold?.artifactFileName !== expectedArtifactFileNames[tool]) {
    fail(`packet_artifact_name_mismatch:${tool}:${scaffold?.artifactFileName}`)
  }
  if (scaffold?.candidateId !== expectedCandidateIds[tool]) {
    fail(`packet_candidate_mismatch:${tool}:${scaffold?.candidateId}`)
  }
  if (scaffold?.suggestedPrivateManifestChecksumSource !== expectedSuggestedChecksumSources[tool]) {
    fail(`packet_checksum_source_mismatch:${tool}:${scaffold?.suggestedPrivateManifestChecksumSource}`)
  }
  if (expectedSuggestedChecksums[tool] && scaffold?.suggestedPrivateManifestChecksumSha256 !== expectedSuggestedChecksums[tool]) {
    fail(`packet_checksum_mismatch:${tool}:${scaffold?.suggestedPrivateManifestChecksumSha256}`)
  }
  if (!expectedSuggestedChecksums[tool] && scaffold?.suggestedPrivateManifestChecksumSha256) {
    fail(`packet_blocked_tool_has_suggested_checksum:${tool}`)
  }
}

for (const requiredText of [
  'AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_SCAFFOLD_DECISION',
  'AiGraphicsModelWeightChecksumEvidenceScaffoldRecord',
  'placeholderChecksumEvidenceRefStatus',
  'placeholderSourceArtifactRefStatus',
  'placeholderArtifactSha256Status',
  'checksumEvidenceAuthoringStatus',
  'templatesInvalidUntilOwnerReviewed',
  'checksumEvidenceRefsNotLogged',
  'REPLACE_WITH_64_HEX_SHA256',
]) {
  if (!moduleSource.includes(requiredText)) fail(`module_source_missing:${requiredText}`)
}

for (const requiredText of [
  'buildAiGraphicsModelWeightChecksumEvidenceScaffoldPacket',
  'checksum-evidence-authoring-checklist.json',
  'CHECKSUM_EVIDENCE_AUTHORING_CHECKLIST.md',
  '--out-dir',
  '--force',
  'scaffoldTemplatesAreReviewInvalid',
]) {
  if (!cliSource.includes(requiredText)) fail(`cli_source_missing:${requiredText}`)
}

if (!validatorSource.includes("entry !== 'checksum-evidence-authoring-checklist.json'")) {
  fail('validator_does_not_ignore_checksum_authoring_checklist')
}

for (const key of [
  'modelWeightChecksumEvidenceScaffoldPrepared',
  'all5ModelWeightToolsCovered',
  'checksumEvidenceAuthoringChecklistPrepared',
  'templatesInvalidUntilOwnerReviewed',
  'privateArtifactRefsNotLogged',
  'checksumEvidenceRefsNotLogged',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

const scaffoldDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-checksum-scaffold-diagnostics-'))
try {
  const scaffoldOutput = parseOutput(runNpm([
    'ai-graphics:model-weight-checksum-evidence-scaffold',
    '--',
    '--out-dir',
    scaffoldDir,
  ]), 'checksum-scaffold')
  if (scaffoldOutput.scaffoldRecords?.length !== 5) fail(`scaffold_run_record_count:${scaffoldOutput.scaffoldRecords?.length}`)
  if (scaffoldOutput.output?.writtenFiles?.length !== 7) fail(`scaffold_run_written_file_count:${scaffoldOutput.output?.writtenFiles?.length}`)
  if (scaffoldOutput.output?.privateArtifactRefsLogged !== 0) fail('scaffold_run_private_refs_logged_not_zero')
  if (scaffoldOutput.output?.checksumEvidenceRefsLogged !== 0) fail('scaffold_run_checksum_refs_logged_not_zero')

  for (const tool of modelWeightTools) {
    const filePath = evidencePath(scaffoldDir, tool)
    if (!fs.existsSync(filePath)) fail(`scaffold_missing_file:${tool}`)
    const evidence = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (evidence.toolId !== tool) fail(`scaffold_tool_id_mismatch:${tool}:${evidence.toolId}`)
    if (evidence.sourceCandidateId !== expectedCandidateIds[tool]) {
      fail(`scaffold_candidate_mismatch:${tool}:${evidence.sourceCandidateId}`)
    }
    if (!String(evidence.checksumEvidenceRef).startsWith('public://replace-with-reviewed-private-checksum-evidence/')) {
      fail(`scaffold_checksum_ref_placeholder_mismatch:${tool}`)
    }
    if (!String(evidence.sourceArtifactRef).startsWith('public://replace-with-reviewed-private-source-artifact/')) {
      fail(`scaffold_source_artifact_ref_placeholder_mismatch:${tool}`)
    }
    if (expectedSuggestedChecksums[tool]) {
      if (evidence.artifactSha256 !== expectedSuggestedChecksums[tool]) fail(`scaffold_suggested_checksum_mismatch:${tool}`)
    } else if (evidence.artifactSha256 !== 'REPLACE_WITH_64_HEX_SHA256') {
      fail(`scaffold_placeholder_checksum_mismatch:${tool}:${evidence.artifactSha256}`)
    }
    for (const field of [
      'checksumEvidenceReviewed',
      'sourceArtifactReviewed',
      'provenanceReviewed',
      'qualityReviewed',
      'securityReviewed',
      'approvedForManifestAuthoring',
    ]) {
      if (evidence[field] !== false) fail(`scaffold_review_boolean_not_false:${tool}:${field}`)
    }
  }

  const checklistJsonPath = path.join(scaffoldDir, 'checksum-evidence-authoring-checklist.json')
  const checklistMarkdownPath = path.join(scaffoldDir, 'CHECKSUM_EVIDENCE_AUTHORING_CHECKLIST.md')
  if (!fs.existsSync(checklistJsonPath)) fail('scaffold_missing_checklist_json')
  if (!fs.existsSync(checklistMarkdownPath)) fail('scaffold_missing_checklist_markdown')
  const checklist = JSON.parse(fs.readFileSync(checklistJsonPath, 'utf8'))
  if (checklist.length !== 5) fail(`scaffold_checklist_count:${checklist.length}`)
  if (!fs.readFileSync(checklistMarkdownPath, 'utf8').includes('ai-graphics:model-weight-checksum-evidence:validate')) {
    fail('scaffold_checklist_markdown_missing_validation_command')
  }

  try {
    runNpm(['ai-graphics:model-weight-checksum-evidence:validate', '--', '--evidence-dir', scaffoldDir])
    fail('invalid_scaffold_validation_unexpected_success')
  } catch (error) {
    const output = String(error.stdout || '')
    if (!output) {
      fail(`invalid_scaffold_validation_missing_output:${error.message}`)
    } else {
      const parsed = parseOutput(output, 'invalid-scaffold-validation')
      if (parsed.checksumEvidenceRecordsProvided !== 5) {
        fail(`invalid_scaffold_records_provided_not_5:${parsed.checksumEvidenceRecordsProvided}`)
      }
      if (parsed.checksumEvidenceRecordsAccepted !== 0) {
        fail(`invalid_scaffold_records_accepted_not_0:${parsed.checksumEvidenceRecordsAccepted}`)
      }
    }
  }

  for (const tool of modelWeightTools) {
    fs.writeFileSync(evidencePath(scaffoldDir, tool), `${JSON.stringify(makeValidEvidence(tool), null, 2)}\n`, 'utf8')
  }
  const validOutput = runNpm(['ai-graphics:model-weight-checksum-evidence:validate', '--', '--evidence-dir', scaffoldDir])
  const validPacket = parseOutput(validOutput, 'valid-scaffold-validation')
  if (validPacket.checksumEvidenceRecordsProvided !== 5) fail(`valid_scaffold_records_provided_not_5:${validPacket.checksumEvidenceRecordsProvided}`)
  if (validPacket.checksumEvidenceRecordsAccepted !== 5) fail(`valid_scaffold_records_accepted_not_5:${validPacket.checksumEvidenceRecordsAccepted}`)
  if (validPacket.manifestAuthoringEligibleRecords !== 5) fail(`valid_scaffold_manifest_authoring_not_5:${validPacket.manifestAuthoringEligibleRecords}`)
  if (validPacket.privateArtifactRefsLogged !== 0) fail('valid_scaffold_private_refs_logged_not_zero')
  if (validOutput.includes('private://reeditpro/ai-graphics/model-weights/')) fail('valid_scaffold_private_artifact_ref_leaked')
  if (validOutput.includes('private://reeditpro/ai-graphics/checksum-evidence/')) fail('valid_scaffold_checksum_evidence_ref_leaked')
} catch (error) {
  fail(`scaffold_cli_failed:${error.message}`)
} finally {
  fs.rmSync(scaffoldDir, { recursive: true, force: true })
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

const combinedText = [markdown, JSON.stringify(packet), moduleSource].join('\n')
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

if (failures.length) {
  console.error('AI graphics model-weight checksum evidence scaffold diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  scaffoldTemplatesPrepared: packet.counts.scaffoldTemplatesPrepared,
  checksumEvidenceAuthoringChecklistItems: packet.counts.checksumEvidenceAuthoringChecklistItems,
  checksumEvidenceRecordsApprovedNow: packet.counts.checksumEvidenceRecordsApprovedNow,
  manifestAuthoringEligibleNow: packet.counts.manifestAuthoringEligibleNow,
  privateArtifactRefsLogged: packet.counts.privateArtifactRefsLogged,
  checksumEvidenceRefsLogged: packet.counts.checksumEvidenceRefsLogged,
  runtimeReadyNow: packet.counts.runtimeReadyNow,
}, null, 2))
