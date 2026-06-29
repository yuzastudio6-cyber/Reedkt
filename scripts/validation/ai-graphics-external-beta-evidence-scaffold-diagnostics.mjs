import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const perToolRuntimeProofScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof'
const perToolRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts'
const perToolRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof:diagnostics'
const perToolRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-runtime-proof-diagnostics.mjs'
const nativeGpuProofCollectionScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection'
const nativeGpuProofCollectionScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const nativeGpuProofCollectionDiagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const nativeGpuProofCollectionDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scaffoldScriptName = 'ai-graphics:external-beta-evidence-scaffold'
const scaffoldScriptCommand = 'tsx server/cli/ai-graphics-external-beta-evidence-scaffold.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-evidence-scaffold:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-external-beta-evidence-scaffold-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'

const allTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const requiredEvidenceClasses = [
  'internal_runtime_soak',
  'external_beta_qa',
  'cost_concurrency_privacy_rollback',
  'incident_response',
  'external_beta_owner_approval',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

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

function runNpm(scriptName, args = [], expectedExitCode = 0) {
  try {
    const output = execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    })
    if (expectedExitCode !== 0) fail(`expected_nonzero_exit:${scriptName}:${expectedExitCode}`)
    return output
  } catch (error) {
    if (error.status !== expectedExitCode) {
      fail(`unexpected_exit:${scriptName}:${error.status}`)
    }
    return error.stdout?.toString() || ''
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

function directoryName(toolId) {
  return toolId.replaceAll('_', '-')
}

function acceptedRecord(toolId) {
  const prefix = `external-beta-evidence://${toolId}`
  return {
    toolId,
    internalRuntimeSoakEvidenceRef: `${prefix}:internal-runtime-soak`,
    externalBetaQaEvidenceRef: `${prefix}:external-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef: `${prefix}:cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef: `${prefix}:incident-response`,
    ownerApprovalRef: `${prefix}:owner-approval`,
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-evidence-scaffold.ts',
  'server/cli/ai-graphics-external-beta-evidence-scaffold.ts',
  'server/tool-registry/ai-graphics-external-beta-evidence-packet.ts',
  'server/cli/ai-graphics-external-beta-evidence-packet.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.json')
const packetDocs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json')
const source = read('server/tool-registry/ai-graphics-external-beta-evidence-scaffold.ts')
const cli = read('server/cli/ai-graphics-external-beta-evidence-scaffold.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[scaffoldScriptName] !== scaffoldScriptCommand) fail(`missing_package_script:${scaffoldScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!index.includes("export * from './ai-graphics-external-beta-evidence-scaffold'")) {
  fail('server_registry_index_missing_external_beta_evidence_scaffold_export')
}
if (docs.decision !== 'ai_graphics_external_beta_evidence_scaffold_prepared_for_local_private_records') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (packetDocs.decision !== 'ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks') {
  fail(`unexpected_packet_docs_decision:${packetDocs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  scaffoldRecordsPrepared: 21,
  committedEvidenceRecordsAccepted: 0,
  generatedTemplateEvidenceRecordsAccepted: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_count:${key}:${docs.counts?.[key]}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes('21') && !markdown.includes(`\`${tool}\``)) {
    fail(`markdown_missing_tool_context:${tool}`)
  }
}
if (!source.includes('AI_GRAPHICS_CANONICAL_TOOL_IDS')) fail('source_missing_canonical_tool_list')
if (!source.includes('listAiGraphicsToolCallReadiness')) fail('source_missing_readiness_record_source')
if (gpuTools.length !== 8) fail('diagnostic_gpu_tool_count_not_8')
for (const evidenceClass of requiredEvidenceClasses) {
  if (!docs.requiredEvidenceClasses?.includes(evidenceClass)) {
    fail(`docs_missing_evidence_class:${evidenceClass}`)
  }
  if (!source.includes(evidenceClass)) fail(`source_missing_evidence_class:${evidenceClass}`)
  if (!markdown.includes(`\`${evidenceClass}\``)) fail(`markdown_missing_evidence_class:${evidenceClass}`)
}

for (const namespace of ['private://', 'reeditpro-private://', 'backend-evidence://', 'owner-evidence://', 'external-beta-evidence://']) {
  if (!docs.acceptedPrivateEvidenceRefNamespaces?.includes(namespace)) {
    fail(`docs_missing_private_namespace:${namespace}`)
  }
  if (!source.includes(namespace)) fail(`source_missing_private_namespace:${namespace}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION',
  'buildAiGraphicsExternalBetaEvidenceScaffoldPacket',
  'public://replace-with-private-evidence',
  'templatesInvalidUntilPrivateEvidenceRefsReplaced',
  'external-beta-evidence-records.template.json',
  'EXTERNAL_BETA_EVIDENCE_COLLECTION_CHECKLIST.md',
  'gpuRuntimeApprovedNow: false',
  'externalBetaReadyNow: false',
]) {
  if (!source.includes(needle) && !cli.includes(needle)) fail(`source_or_cli_missing:${needle}`)
}
for (const needle of [
  '--out-dir',
  '--force',
  'blocked_missing_out_dir',
  'scaffoldTemplatesAreReviewInvalid',
  'privateEvidenceRefsLogged: 0',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

for (const key of [
  'externalBetaEvidenceScaffoldPrepared',
  'all21ToolsCovered',
  'templatesInvalidUntilPrivateEvidenceRefsReplaced',
  'privateEvidenceRefsNotLogged',
  'externalBetaEvidencePacketInputTemplatePrepared',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

const missingOutDirOutput = parseJsonOutput(runNpm(scaffoldScriptName, [], 2), 'missing_out_dir')
if (missingOutDirOutput.status !== 'blocked_missing_out_dir') fail('missing_out_dir_status_not_blocked')
if (missingOutDirOutput.externalBetaReadyNow !== false) fail('missing_out_dir_external_beta_not_false')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-scaffold-'))
const scaffoldOutput = parseJsonOutput(runNpm(scaffoldScriptName, ['--out-dir', tempRoot]), 'scaffold_output')
if (scaffoldOutput.decision !== docs.decision) fail(`scaffold_output_decision_mismatch:${scaffoldOutput.decision}`)
if (scaffoldOutput.scaffoldRecordsPrepared !== 21) fail('scaffold_output_records_not_21')
if (scaffoldOutput.evidenceRecordTemplate?.length !== 21) fail('scaffold_template_count_not_21')
if (scaffoldOutput.collectionChecklist?.length !== 21) fail('scaffold_checklist_count_not_21')
if (scaffoldOutput.output?.localOnly !== true) fail('scaffold_output_not_local_only')
if (scaffoldOutput.output?.privateEvidenceRefsLogged !== 0) fail('scaffold_logged_private_refs')
if (scaffoldOutput.output?.writtenFiles?.length !== 24) fail(`scaffold_written_file_count_not_24:${scaffoldOutput.output?.writtenFiles?.length}`)

const templatePath = path.join(tempRoot, 'external-beta-evidence-records.template.json')
const checklistJsonPath = path.join(tempRoot, 'external-beta-evidence-collection-checklist.json')
const checklistMdPath = path.join(tempRoot, 'EXTERNAL_BETA_EVIDENCE_COLLECTION_CHECKLIST.md')
if (!fs.existsSync(templatePath)) fail('template_file_not_written')
if (!fs.existsSync(checklistJsonPath)) fail('checklist_json_not_written')
if (!fs.existsSync(checklistMdPath)) fail('checklist_markdown_not_written')
for (const tool of allTools) {
  const filePath = path.join(tempRoot, directoryName(tool), 'external-beta-evidence-record.json')
  if (!fs.existsSync(filePath)) fail(`per_tool_template_not_written:${tool}`)
}

const templateRecords = json(templatePath)
if (!Array.isArray(templateRecords) || templateRecords.length !== 21) fail('template_records_not_21')
if (JSON.stringify(templateRecords).includes('private://')) fail('template_records_should_not_include_real_private_refs')
if (!JSON.stringify(templateRecords).includes('public://replace-with-private-evidence')) {
  fail('template_records_missing_rejected_public_placeholders')
}

const rejectedTemplatePacket = parseJsonOutput(
  runNpm(packetScriptName, ['--evidence-records', templatePath]),
  'rejected_template_packet',
)
if (rejectedTemplatePacket.evidenceRecordsAcceptedWithProvidedEvidence !== 0) {
  fail('template_packet_should_accept_0_records')
}
if (rejectedTemplatePacket.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('template_packet_should_not_prepare_external_beta_candidates')
}
if (rejectedTemplatePacket.externalBetaReadyNowTools !== 0) fail('template_packet_external_beta_ready_now_not_0')

const acceptedRecordsPath = path.join(tempRoot, 'accepted-records.json')
writeJson(acceptedRecordsPath, allTools.map(acceptedRecord))
const acceptedPacket = parseJsonOutput(
  runNpm(packetScriptName, ['--evidence-records', acceptedRecordsPath]),
  'accepted_packet',
)
if (acceptedPacket.evidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('accepted_packet_records_not_21')
}
if (acceptedPacket.externalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('accepted_packet_candidate_count_not_21')
}
if (acceptedPacket.externalBetaReadyNowTools !== 0) fail('accepted_packet_external_beta_ready_now_not_0')
if (acceptedPacket.productionReadyNowTools !== 0) fail('accepted_packet_production_ready_now_not_0')

for (const output of [scaffoldOutput, rejectedTemplatePacket, acceptedPacket]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_external_beta_evidence_scaffold_prepared_for_local_private_records')) {
  fail('scorecard_missing_external_beta_evidence_scaffold_decision')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.md',
  'server/tool-registry/ai-graphics-external-beta-evidence-scaffold.ts',
  'server/cli/ai-graphics-external-beta-evidence-scaffold.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${perToolRuntimeProofScriptName}": "${perToolRuntimeProofScriptCommand}",`,
  `+    "${perToolRuntimeProofDiagnosticScriptName}": "${perToolRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${nativeGpuProofCollectionScriptName}": "${nativeGpuProofCollectionScriptCommand}",`,
  `+    "${nativeGpuProofCollectionDiagnosticScriptName}": "${nativeGpuProofCollectionDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${scaffoldScriptName}": "${scaffoldScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-launch-gap-report": "tsx server/cli/ai-graphics-external-beta-launch-gap-report.ts",',
  '+    "ai-graphics:external-beta-launch-gap-report:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-gap-report-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-go-no-go": "tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts",',
  '+    "ai-graphics:external-beta-launch-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-admission": "tsx server/cli/ai-graphics-external-beta-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-tool-call-gateway": "tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts",',
  '+    "ai-graphics:external-beta-tool-call-gateway:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter": "tsx server/cli/ai-graphics-external-beta-worker-enqueue-adapter.ts",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-enqueue-adapter-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-backend-queue-submission": "tsx server/cli/ai-graphics-external-beta-backend-queue-submission.ts",',
  '+    "ai-graphics:external-beta-backend-queue-submission:diagnostics": "node scripts/validation/ai-graphics-external-beta-backend-queue-submission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction": "tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-local-queue-storage": "tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts",',
  '+    "ai-graphics:external-beta-local-queue-storage:diagnostics": "node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-private-artifact-manifest": "tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts",',
  '+    "ai-graphics:external-beta-private-artifact-manifest:diagnostics": "node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
  fail('generated_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  scaffoldRecordsPrepared: scaffoldOutput.scaffoldRecordsPrepared,
  templateRecordsAcceptedWithProvidedEvidence:
    rejectedTemplatePacket.evidenceRecordsAcceptedWithProvidedEvidence,
  acceptedRecordsAcceptedWithProvidedEvidence:
    acceptedPacket.evidenceRecordsAcceptedWithProvidedEvidence,
  externalBetaReadyNowTools: acceptedPacket.externalBetaReadyNowTools,
  productionReadyNowTools: acceptedPacket.productionReadyNowTools,
  agentCanExecuteToolsNow: acceptedPacket.booleans?.agentCanExecuteToolsNow,
}, null, 2))
