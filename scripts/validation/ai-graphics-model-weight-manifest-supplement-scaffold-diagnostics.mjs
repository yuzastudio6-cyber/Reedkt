import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scaffoldScriptName = 'ai-graphics:model-weight-manifest-supplement-scaffold'
const scaffoldScriptCommand = 'tsx server/cli/ai-graphics-model-weight-manifest-supplement-scaffold.ts'
const diagnosticScriptName = 'ai-graphics:model-weight-manifest-supplement-scaffold:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-model-weight-manifest-supplement-scaffold-diagnostics.mjs'

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
    'signed.example.invalid',
    'public.example.invalid',
    'gs://reeditpro',
  ]) {
    if (output.includes(token)) fail(`private_or_public_ref_leaked:${label}:${token}`)
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-manifest-supplement-scaffold.ts',
  'server/cli/ai-graphics-model-weight-manifest-supplement-scaffold.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-authoring.ts',
  'server/cli/ai-graphics-model-weight-manifest-authoring.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.json',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence-scaffold.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.json')
const authoringPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.json')
const moduleSource = read('server/tool-registry/ai-graphics-model-weight-manifest-supplement-scaffold.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-manifest-supplement-scaffold.ts')
const authoringCliSource = read('server/cli/ai-graphics-model-weight-manifest-authoring.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.md')
const authoringMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-authoring.md')

if (pkg.scripts?.[scaffoldScriptName] !== scaffoldScriptCommand) fail(`missing_package_script:${scaffoldScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-model-weight-manifest-supplement-scaffold'")) {
  fail('server_registry_index_does_not_export_model_weight_manifest_supplement_scaffold')
}
if (packet.decision !== 'ai_graphics_model_weight_manifest_supplement_scaffold_prepared_for_local_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (authoringPacket.sourceEvidence?.modelWeightManifestSupplementScaffold !==
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-supplement-scaffold.json') {
  fail('authoring_packet_missing_supplement_scaffold_source')
}
if (!authoringMarkdown.includes('ai-graphics:model-weight-manifest-supplement-scaffold')) {
  fail('authoring_markdown_missing_supplement_scaffold_command')
}
if (!authoringCliSource.includes('manifest-supplement-authoring-checklist.json')) {
  fail('authoring_cli_does_not_ignore_supplement_checklist')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestSupplementTools: 5,
  supplementTemplatesPrepared: 5,
  committedManifestSupplementsApproved: 0,
  localPrivateManifestDraftsReadyFromCommittedDocs: 0,
  privateEvidenceRefsLogged: 0,
  runtimeReadyTools: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestSupplementTools?.includes(tool)) fail(`packet_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!moduleSource.includes(tool)) fail(`module_missing_tool:${tool}`)
  if (packet.localPrivateSupplementPaths?.[tool] !== `${directoryNameByTool[tool]}/manifest-review-supplement.json`) {
    fail(`local_private_supplement_path_mismatch:${tool}:${packet.localPrivateSupplementPaths?.[tool]}`)
  }
}

for (const field of requiredSupplementFields) {
  if (!packet.requiredSupplementFields?.includes(field)) fail(`packet_missing_supplement_field:${field}`)
  if (!moduleSource.includes(field)) fail(`module_missing_supplement_field:${field}`)
  if (!markdown.includes(`\`${field}\``)) fail(`markdown_missing_supplement_field:${field}`)
}

for (const token of [
  'AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_SCAFFOLD_DECISION',
  'buildAiGraphicsModelWeightManifestSupplementScaffoldPacket',
  'manifest-review-supplement.json',
  'public://replace-with-reviewed-source-license-evidence',
  'public://replace-with-reviewed-model-card-provenance',
  'templatesInvalidUntilOwnerReviewed',
  'privateEvidenceRefsNotLogged',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--out-dir',
  '--force',
  'manifest-supplement-authoring-checklist.json',
  'MANIFEST_SUPPLEMENT_AUTHORING_CHECKLIST.md',
  'scaffoldTemplatesAreReviewInvalid',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const key of [
  'modelWeightManifestSupplementScaffoldPrepared',
  'all5ModelWeightToolsCovered',
  'manifestReviewSupplementChecklistPrepared',
  'templatesInvalidUntilOwnerReviewed',
  'privateEvidenceRefsNotLogged',
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

function writeChecksumEvidenceFixtures(directory) {
  for (const toolId of modelWeightTools) {
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
    }
    fs.writeFileSync(path.join(directory, `${toolId}.json`), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  }
}

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

const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-manifest-supplement-scaffold-'))
try {
  const supplementDir = path.join(scaffoldRoot, 'supplements')
  const evidenceDir = path.join(scaffoldRoot, 'checksum-evidence')
  const manifestOutDir = path.join(scaffoldRoot, 'model-weight-manifests')
  const scaffoldOutput = runNpm(scaffoldScriptName, ['--out-dir', supplementDir])
  const scaffold = parseJsonOutput(scaffoldOutput, 'scaffold')
  if (scaffold.scaffoldRecords?.length !== 5) fail(`scaffold_record_count_not_5:${scaffold.scaffoldRecords?.length}`)
  if (scaffold.authoringChecklist?.length !== 5) fail(`scaffold_checklist_count_not_5:${scaffold.authoringChecklist?.length}`)
  if (scaffold.output?.writtenFiles?.length !== 7) fail(`scaffold_written_files_not_7:${scaffold.output?.writtenFiles?.length}`)
  if (scaffold.output?.privateEvidenceRefsLogged !== 0) fail('scaffold_private_refs_logged_not_zero')
  for (const toolId of modelWeightTools) {
    const supplementPath = path.join(supplementDir, directoryNameByTool[toolId], 'manifest-review-supplement.json')
    if (!fs.existsSync(supplementPath)) fail(`scaffold_missing_supplement_file:${toolId}`)
    const supplement = JSON.parse(fs.readFileSync(supplementPath, 'utf8'))
    if (supplement.sourceLicenseRef !== `public://replace-with-reviewed-source-license-evidence/${directoryNameByTool[toolId]}.json`) {
      fail(`scaffold_source_license_placeholder_unexpected:${toolId}`)
    }
    if (supplement.approvedForInternalBeta !== false) fail(`scaffold_approved_for_internal_beta_not_false:${toolId}`)
  }
  if (!fs.existsSync(path.join(supplementDir, 'manifest-supplement-authoring-checklist.json'))) {
    fail('scaffold_missing_checklist_json')
  }

  fs.mkdirSync(evidenceDir)
  writeChecksumEvidenceFixtures(evidenceDir)
  try {
    runNpm('ai-graphics:model-weight-manifest-authoring', [
      '--evidence-dir',
      evidenceDir,
      '--supplement-dir',
      supplementDir,
      '--out-dir',
      manifestOutDir,
    ])
    fail('scaffold_placeholders_unexpectedly_passed_authoring')
  } catch (error) {
    const output = String(error.stdout || '')
    const parsed = parseJsonOutput(output, 'scaffold_invalid_authoring')
    const sam2 = parsed.validationResults?.find((entry) => entry.toolId === 'sam2')
    if (sam2?.status !== 'blocked_invalid_manifest_review_supplement') {
      fail(`scaffold_invalid_authoring_status_unexpected:${sam2?.status}`)
    }
  }

  writeValidSupplementFixtures(supplementDir)
  const validAuthoringOutput = runNpm('ai-graphics:model-weight-manifest-authoring', [
    '--evidence-dir',
    evidenceDir,
    '--supplement-dir',
    supplementDir,
    '--out-dir',
    manifestOutDir,
  ])
  assertNoPrivateLeak(validAuthoringOutput, 'valid_authoring_stdout')
  const validAuthoring = parseJsonOutput(validAuthoringOutput, 'valid_authoring')
  if (validAuthoring.localPrivateManifestDraftsReady !== 5) {
    fail(`valid_authoring_drafts_ready_not_5:${validAuthoring.localPrivateManifestDraftsReady}`)
  }
  if (validAuthoring.input?.localPrivateManifestDraftFilesWritten !== 5) {
    fail(`valid_authoring_files_written_not_5:${validAuthoring.input?.localPrivateManifestDraftFilesWritten}`)
  }

  const manifestOutput = runNpm('ai-graphics:model-weight-manifest-review:validate', [
    '--manifest-dir',
    manifestOutDir,
  ])
  assertNoPrivateLeak(manifestOutput, 'valid_manifest_stdout')
  const manifestReview = parseJsonOutput(manifestOutput, 'manifest_review')
  if (manifestReview.reviewAcceptedManifestRecords !== 5) fail('manifest_review_accepted_records_not_5')
  if (manifestReview.nativeGpuProofInputEligibleRecords !== 5) fail('manifest_gpu_input_records_not_5')
} catch (error) {
  fail(`scaffold_flow_failed:${error.message}`)
} finally {
  fs.rmSync(scaffoldRoot, { recursive: true, force: true })
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
  console.error('AI graphics model-weight manifest supplement scaffold diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  modelWeightManifestSupplementTools: packet.counts.modelWeightManifestSupplementTools,
  supplementTemplatesPrepared: packet.counts.supplementTemplatesPrepared,
  committedManifestSupplementsApproved: packet.counts.committedManifestSupplementsApproved,
  privateEvidenceRefsLogged: packet.counts.privateEvidenceRefsLogged,
  runtimeReadyTools: packet.counts.runtimeReadyTools,
}, null, 2))
