import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:model-weight-checksum-evidence:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-model-weight-checksum-evidence-diagnostics.mjs'

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

const sourceCatalogSuggestedChecksumSha256ByTool = {
  sam2: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  birefnet: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  real_esrgan: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  rembg: null,
  transparent_background: null,
}

const sourceCatalogChecksumEvidenceStatusByTool = {
  sam2: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
  birefnet: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
  real_esrgan: 'release_asset_checksum_required_before_private_manifest',
  rembg: 'checksum_required_before_private_manifest',
  transparent_background: 'checksum_required_before_private_manifest',
}

const requiredEvidenceFields = [
  'evidenceId',
  'toolId',
  'sourceCandidateId',
  'artifactFileName',
  'artifactSha256',
  'checksumEvidenceRef',
  'sourceArtifactRef',
  'hashCommand',
  'checksumEvidenceReviewed',
  'sourceArtifactReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForManifestAuthoring',
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

function runNpm(args, options = {}) {
  return execFileSync('npm', ['run', '--silent', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    ...options,
  })
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-model-weight-checksum-evidence.ts',
  'server/cli/ai-graphics-model-weight-checksum-evidence.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json',
  'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json')
const sourceCatalog = json('docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json')
const manifestPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const source = read('server/tool-registry/ai-graphics-model-weight-checksum-evidence.ts')
const cliSource = read('server/cli/ai-graphics-model-weight-checksum-evidence.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.md')
const manifestMarkdown = read('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.md')

if (pkg.scripts?.['ai-graphics:model-weight-checksum-evidence:validate'] !== 'tsx server/cli/ai-graphics-model-weight-checksum-evidence.ts') {
  fail('missing_package_script:ai-graphics:model-weight-checksum-evidence:validate')
}
if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-model-weight-checksum-evidence'")) {
  fail('server_registry_index_does_not_export_model_weight_checksum_evidence')
}

if (packet.decision !== 'ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (packet.sourceEvidence?.modelWeightSourceCatalog !== 'docs/tool-intelligence/ai-graphics/model-weight-source-catalog.json') {
  fail('packet_missing_source_catalog_evidence')
}
if (packet.contractSurface?.localPrivateChecksumEvidenceValidator !== 'server/cli/ai-graphics-model-weight-checksum-evidence.ts') {
  fail('packet_missing_local_private_checksum_evidence_validator')
}
if (packet.contractSurface?.localPrivateChecksumEvidenceValidatorScript !== 'ai-graphics:model-weight-checksum-evidence:validate') {
  fail('packet_missing_local_private_checksum_evidence_validator_script')
}
if (manifestPacket.sourceEvidence?.modelWeightChecksumEvidence !== 'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json') {
  fail('manifest_packet_missing_checksum_evidence_source')
}
if (!manifestMarkdown.includes('ai-graphics:model-weight-checksum-evidence:validate')) {
  fail('manifest_markdown_missing_checksum_evidence_validator')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightChecksumEvidenceRequiredTools: 5,
  checksumEvidenceRecordsProvided: 0,
  checksumEvidenceRecordsAccepted: 0,
  manifestAuthoringEligibleRecords: 0,
  privateArtifactRefsLogged: 0,
  betaReadyModelWeightTools: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

if (sourceCatalog.decision !== 'ai_graphics_model_weight_source_catalog_prepared_with_review_blocks') {
  fail(`unexpected_source_catalog_decision:${sourceCatalog.decision}`)
}

if (!Array.isArray(packet.validationResults) || packet.validationResults.length !== 5) {
  fail(`validation_result_count_not_5:${packet.validationResults?.length}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightChecksumEvidenceRequiredTools?.includes(tool)) fail(`packet_missing_model_weight_tool:${tool}`)
  if (!JSON.stringify(packet.validationResults || []).includes(`"toolId":"${tool}"`)) fail(`validation_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)

  const result = (packet.validationResults || []).find((entry) => entry.toolId === tool)
  if (result?.expectedSourceCandidateId !== sourceCandidateIdByTool[tool]) {
    fail(`expected_source_candidate_id_mismatch:${tool}:${result?.expectedSourceCandidateId}`)
  }
  if (result?.expectedArtifactFileName !== artifactFileNameByTool[tool]) {
    fail(`expected_artifact_file_name_mismatch:${tool}:${result?.expectedArtifactFileName}`)
  }
  if (result?.sourceCatalogSuggestedChecksumSha256 !== sourceCatalogSuggestedChecksumSha256ByTool[tool]) {
    fail(`source_catalog_suggested_checksum_mismatch:${tool}:${result?.sourceCatalogSuggestedChecksumSha256}`)
  }
  if (result?.sourceCatalogChecksumEvidenceStatus !== sourceCatalogChecksumEvidenceStatusByTool[tool]) {
    fail(`source_catalog_checksum_evidence_status_mismatch:${tool}:${result?.sourceCatalogChecksumEvidenceStatus}`)
  }
  if (result?.checksumEvidenceRecordProvided !== false) fail(`checksum_evidence_record_provided_not_false:${tool}`)
  if (result?.schemaValid !== false) fail(`schema_valid_not_false_without_private_record:${tool}`)
  if (result?.reviewAccepted !== false) fail(`review_accepted_not_false_without_private_record:${tool}`)
  if (result?.eligibleForPrivateManifestAuthoring !== false) fail(`manifest_authoring_eligible_not_false:${tool}`)
  if (result?.approvedForAgentExecutionNow !== false) fail(`agent_execution_not_false:${tool}`)
  if (result?.checksumEvidenceRefStatus !== 'missing') fail(`checksum_evidence_ref_status_not_missing:${tool}`)
  if (result?.sourceArtifactRefStatus !== 'missing') fail(`source_artifact_ref_status_not_missing:${tool}`)
}

for (const field of requiredEvidenceFields) {
  if (!packet.requiredEvidenceFields?.includes(field)) fail(`packet_missing_required_field:${field}`)
  if (!source.includes(field)) fail(`source_missing_required_field:${field}`)
  if (!markdown.includes(`\`${field}\``)) fail(`markdown_missing_required_field:${field}`)
}

for (const requiredSourceText of [
  'AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_DECISION',
  'AiGraphicsModelWeightChecksumEvidenceRecord',
  'AiGraphicsModelWeightChecksumEvidenceValidationResult',
  'validateAiGraphicsModelWeightChecksumEvidenceRecord',
  'validateAiGraphicsModelWeightChecksumEvidenceRecords',
  'buildAiGraphicsModelWeightChecksumEvidencePacket',
  'sourceCandidateId must be',
  'artifactSha256 must match reviewed source-catalog checksum',
  'checksumEvidenceRef must be a reviewed private checksum evidence reference',
  'sourceArtifactRef or privateArtifactRef must be a reviewed private artifact reference',
  'present_private_ref_not_logged',
  'invalid_public_or_signed_ref',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
]) {
  if (!source.includes(requiredSourceText)) fail(`source_missing:${requiredSourceText}`)
}

for (const requiredCliText of [
  'buildAiGraphicsModelWeightChecksumEvidencePacket',
  'localPrivateChecksumEvidenceFilesRead',
  'privateArtifactRefsLogged: 0',
  '--evidence-dir',
  '--evidence-file',
  '--evidence',
  'checksumEvidence',
]) {
  if (!cliSource.includes(requiredCliText)) fail(`cli_source_missing:${requiredCliText}`)
}

for (const key of [
  'checksumEvidenceValidatorPrepared',
  'sourceModelWeightSourceCatalogAccepted',
  'all5ModelWeightToolsCovered',
  'privateChecksumEvidenceRefsRequired',
  'sourceArtifactPrivateRefsRequired',
  'privateArtifactRefsNotLogged',
  'publicOrSignedArtifactRefsRejected',
  'sha256EvidenceRequired',
  'sourceCatalogChecksumGuidanceEnforced',
  'sourceCatalogChecksumMismatchRejected',
  'rembgTransparentBackgroundPrivateShaEvidenceStillRequired',
  'checksumEvidenceReviewRequired',
  'provenanceReviewRequired',
  'qualityReviewRequired',
  'securityReviewRequired',
  'manifestAuthoringOnly',
  'nativeGpuProofStillRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

function writeChecksumEvidenceFixtures(directory, override = {}, skipTools = []) {
  for (const toolId of modelWeightTools) {
    if (skipTools.includes(toolId)) continue
    const evidence = {
      evidenceId: `${toolId}_private_checksum_evidence_v1`,
      toolId,
      sourceCandidateId: sourceCandidateIdByTool[toolId],
      artifactFileName: artifactFileNameByTool[toolId],
      artifactSha256: sourceCatalogSuggestedChecksumSha256ByTool[toolId] ?? (toolId === 'rembg' ? 'c'.repeat(64) : 'd'.repeat(64)),
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

function runValidator(directory) {
  return runNpm([
    'ai-graphics:model-weight-checksum-evidence:validate',
    '--',
    '--evidence-dir',
    directory,
  ])
}

const validFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-checksum-valid-'))
try {
  writeChecksumEvidenceFixtures(validFixtureDir)
  const output = runValidator(validFixtureDir)
  const parsed = JSON.parse(output)
  if (parsed.checksumEvidenceRecordsProvided !== 5) fail('fixture_valid_records_provided_not_5')
  if (parsed.checksumEvidenceRecordsAccepted !== 5) fail('fixture_valid_records_accepted_not_5')
  if (parsed.manifestAuthoringEligibleRecords !== 5) fail('fixture_valid_manifest_authoring_records_not_5')
  if (parsed.privateArtifactRefsLogged !== 0) fail('fixture_valid_private_refs_logged_not_zero')
  if (output.includes('private://reeditpro/ai-graphics/model-weights/')) fail('fixture_valid_private_artifact_ref_leaked')
  if (output.includes('private://reeditpro/ai-graphics/checksum-evidence/')) fail('fixture_valid_checksum_evidence_ref_leaked')
} catch (error) {
  fail(`fixture_valid_cli_failed:${error.message}`)
} finally {
  fs.rmSync(validFixtureDir, { recursive: true, force: true })
}

const invalidChecksumFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-checksum-invalid-sha-'))
try {
  writeChecksumEvidenceFixtures(invalidChecksumFixtureDir, {
    sam2: {
      artifactSha256: 'b'.repeat(64),
    },
  })
  runValidator(invalidChecksumFixtureDir)
  fail('fixture_invalid_checksum_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_invalid_checksum_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const sam2 = parsed.validationResults?.find((entry) => entry.toolId === 'sam2')
    if (sam2?.sourceCatalogSuggestedChecksumSha256 !== sourceCatalogSuggestedChecksumSha256ByTool.sam2) {
      fail(`fixture_invalid_checksum_expected_checksum_unexpected:${sam2?.sourceCatalogSuggestedChecksumSha256}`)
    }
    if (!sam2?.errors?.some((message) => message.includes('artifactSha256 must match reviewed source-catalog checksum'))) {
      fail('fixture_invalid_checksum_error_missing')
    }
    if (sam2?.eligibleForPrivateManifestAuthoring !== false) fail('fixture_invalid_checksum_still_manifest_authoring_eligible')
    if (output.includes('private://reeditpro/ai-graphics/model-weights/')) fail('fixture_invalid_checksum_private_ref_leaked')
  }
} finally {
  fs.rmSync(invalidChecksumFixtureDir, { recursive: true, force: true })
}

const invalidChecksumEvidenceRefDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-checksum-invalid-ref-'))
try {
  writeChecksumEvidenceFixtures(invalidChecksumEvidenceRefDir, {
    rembg: {
      checksumEvidenceRef: 'https://signed.example.invalid/rembg/checksum.json?X-Goog-Signature=abc',
    },
  })
  runValidator(invalidChecksumEvidenceRefDir)
  fail('fixture_invalid_checksum_evidence_ref_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_invalid_checksum_evidence_ref_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const rembg = parsed.validationResults?.find((entry) => entry.toolId === 'rembg')
    if (rembg?.checksumEvidenceRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`fixture_invalid_checksum_evidence_ref_status_unexpected:${rembg?.checksumEvidenceRefStatus}`)
    }
    if (!rembg?.errors?.some((message) => /checksum evidence reference/.test(message))) {
      fail('fixture_invalid_checksum_evidence_ref_error_missing')
    }
    if (output.includes('signed.example.invalid')) fail('fixture_invalid_checksum_evidence_public_url_leaked')
  }
} finally {
  fs.rmSync(invalidChecksumEvidenceRefDir, { recursive: true, force: true })
}

const invalidArtifactRefDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-checksum-invalid-artifact-ref-'))
try {
  writeChecksumEvidenceFixtures(invalidArtifactRefDir, {
    transparent_background: {
      sourceArtifactRef: 'gs://reeditpro-staging/model-weights/transparent-background/ckpt_base.pth',
    },
  })
  runValidator(invalidArtifactRefDir)
  fail('fixture_invalid_artifact_ref_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_invalid_artifact_ref_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const transparentBackground = parsed.validationResults?.find((entry) => entry.toolId === 'transparent_background')
    if (transparentBackground?.sourceArtifactRefStatus !== 'invalid_public_or_signed_ref') {
      fail(`fixture_invalid_artifact_ref_status_unexpected:${transparentBackground?.sourceArtifactRefStatus}`)
    }
    if (!transparentBackground?.errors?.some((message) => /private artifact reference/.test(message))) {
      fail('fixture_invalid_artifact_ref_error_missing')
    }
    if (output.includes('gs://reeditpro-staging')) fail('fixture_invalid_artifact_ref_leaked')
  }
} finally {
  fs.rmSync(invalidArtifactRefDir, { recursive: true, force: true })
}

const missingToolDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-model-checksum-missing-tool-'))
try {
  writeChecksumEvidenceFixtures(missingToolDir, {}, ['transparent_background'])
  runValidator(missingToolDir)
  fail('fixture_missing_tool_cli_unexpected_success')
} catch (error) {
  const output = String(error.stdout || '')
  if (!output) {
    fail(`fixture_missing_tool_cli_missing_output:${error.message}`)
  } else {
    const parsed = JSON.parse(output)
    const transparentBackground = parsed.validationResults?.find((entry) => entry.toolId === 'transparent_background')
    if (parsed.checksumEvidenceRecordsProvided !== 4) fail(`fixture_missing_tool_records_provided_unexpected:${parsed.checksumEvidenceRecordsProvided}`)
    if (transparentBackground?.checksumEvidenceRecordProvided !== false) fail('fixture_missing_tool_record_provided_not_false')
    if (!transparentBackground?.errors?.some((message) => message.includes('private checksum evidence record is missing'))) {
      fail('fixture_missing_tool_error_missing')
    }
  }
} finally {
  fs.rmSync(missingToolDir, { recursive: true, force: true })
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
  console.error('AI graphics model-weight checksum evidence diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  modelWeightChecksumEvidenceRequiredTools: packet.counts.modelWeightChecksumEvidenceRequiredTools,
  checksumEvidenceRecordsProvided: packet.counts.checksumEvidenceRecordsProvided,
  checksumEvidenceRecordsAccepted: packet.counts.checksumEvidenceRecordsAccepted,
  manifestAuthoringEligibleRecords: packet.counts.manifestAuthoringEligibleRecords,
  privateArtifactRefsLogged: packet.counts.privateArtifactRefsLogged,
  betaReadyModelWeightTools: packet.counts.betaReadyModelWeightTools,
}, null, 2))
