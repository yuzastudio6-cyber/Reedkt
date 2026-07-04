import childProcess from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runScriptName = 'ai-graphics:external-agent-gpu-model-runtime-input-manifest'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-runtime-input-manifest.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-input-manifest:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-runtime-input-manifest-diagnostics.mjs'
const toolCallScriptName = 'ai-graphics:external-agent-tool-call'
const decision =
  'ai_graphics_external_agent_gpu_model_runtime_input_manifest_materialized_local_only'
const runRoot =
  '.local-artifacts/ai-graphics/gpu-model-runtime-input-manifest-materializer/diagnostic'
const canonicalRuntimeImage = 'reeditpro/ai-graphics-gpu-worker:proof-local'

const toolContracts = {
  sam2: {
    modelFlag: '--sam2-checkpoint',
    modelPath: `${runRoot}/models/sam2/sam2-checkpoint.pt`,
    manifestId: 'sam2_private_manifest_review_v1',
    evidenceRef: 'private://reeditpro/ai-graphics/checksum-evidence/sam2.json',
    modelField: 'sam2CheckpointLocalPath',
  },
  birefnet: {
    modelFlag: '--birefnet-model',
    modelPath: `${runRoot}/models/birefnet`,
    checksumFile: `${runRoot}/models/birefnet/model.safetensors`,
    manifestId: 'birefnet_private_manifest_review_v1',
    evidenceRef: 'private://reeditpro/ai-graphics/checksum-evidence/birefnet.json',
    modelField: 'birefnetModelLocalPath',
  },
  real_esrgan: {
    modelFlag: '--real-esrgan-model',
    modelPath: `${runRoot}/models/real-esrgan/RealESRGAN_x4plus.pth`,
    manifestId: 'real_esrgan_private_manifest_review_v1',
    evidenceRef: 'private://reeditpro/ai-graphics/checksum-evidence/real_esrgan.json',
    modelField: 'realEsrganModelLocalPath',
  },
  rembg: {
    modelFlag: '--rembg-model',
    modelPath: `${runRoot}/models/rembg/u2net.onnx`,
    manifestId: 'rembg_private_manifest_review_v1',
    evidenceRef: 'private://reeditpro/ai-graphics/checksum-evidence/rembg.json',
    modelField: 'rembgModelLocalPath',
  },
  transparent_background: {
    modelFlag: '--transparent-background-checkpoint',
    modelPath: `${runRoot}/models/transparent-background/ckpt_base.pth`,
    manifestId: 'transparent_background_private_manifest_review_v1',
    evidenceRef:
      'private://reeditpro/ai-graphics/checksum-evidence/transparent_background.json',
    modelField: 'transparentBackgroundCheckpointLocalPath',
  },
}

const expectedPostEvidenceBlockers = new Set([
  'gpu_model_python_package_missing',
  'gpu_model_python_runtime_unavailable',
  'gpu_model_native_cuda_runtime_missing',
  'gpu_model_onnxruntime_cuda_provider_missing',
  'gpu_model_runtime_container_image_unavailable',
  'gpu_model_runtime_container_gpu_unavailable',
])

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function json(file) {
  return JSON.parse(read(file))
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 80 * 1024 * 1024,
  })
}

function spawn(command) {
  return childProcess.spawnSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 80 * 1024 * 1024,
  })
}

function sha256File(filePath) {
  const hash = createHash('sha256')
  hash.update(fs.readFileSync(absolute(filePath)))
  return hash.digest('hex')
}

function writePrivateSourceFrame(filePath) {
  fs.mkdirSync(path.dirname(absolute(filePath)), { recursive: true })
  fs.writeFileSync(absolute(filePath), [
    'P3',
    '2 2',
    '255',
    '255 0 0 0 255 0',
    '0 0 255 255 255 255',
    '',
  ].join('\n'))
}

function writeLargePrivatePlaceholder(filePath, byte) {
  fs.mkdirSync(path.dirname(absolute(filePath)), { recursive: true })
  fs.writeFileSync(absolute(filePath), Buffer.alloc(1024 * 1024 + 32, byte))
}

function writeSafetensorsPlaceholder(filePath) {
  fs.mkdirSync(path.dirname(absolute(filePath)), { recursive: true })
  const header = Buffer.from(JSON.stringify({
    __metadata__: {
      format: 'pt',
      reeditproDiagnostic: 'local-only-placeholder',
    },
  }))
  const length = Buffer.alloc(8)
  length.writeBigUInt64LE(BigInt(header.length), 0)
  const padding = Buffer.alloc(1024 * 1024 + 32, 3)
  fs.writeFileSync(absolute(filePath), Buffer.concat([length, header, padding]))
}

function materializeManifest(toolId, contract) {
  const manifestOut = `${runRoot}/runtime-inputs/${toolId}.json`
  const outputDir = `${runRoot}/outputs/${toolId}`
  const stdout = exec([
    `npm run --silent ${runScriptName} --`,
    `--tool ${toolId}`,
    `--source-image ${runRoot}/inputs/private-approved-frame.ppm`,
    `${contract.modelFlag} ${contract.modelPath}`,
    `--output-dir ${outputDir}`,
    `--manifest-out ${manifestOut}`,
    `--model-weight-manifest-id ${contract.manifestId}`,
    `--model-weight-checksum-evidence-ref ${contract.evidenceRef}`,
    `--runtime-container-image ${canonicalRuntimeImage}`,
    '--runtime-container-platform linux/amd64',
    '--force',
  ].join(' '))
  return {
    report: JSON.parse(stdout),
    manifestOut,
    outputDir,
  }
}

function runToolCall(toolId, manifestOut) {
  return JSON.parse(exec([
    `npm run --silent ${toolCallScriptName} --`,
    `--tool ${toolId}`,
    '--attempt-gpu-runtime',
    '--runtime-backend host_python',
    `--runtime-input-manifest ${manifestOut}`,
  ].join(' ')))
}

const packageJson = json('package.json')
const source = read('server/cli/ai-graphics-external-agent-gpu-model-runtime-input-manifest.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-gpu-model-runtime-input-manifest-diagnostics.mjs')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}

for (const phrase of [
  'sha256File',
  'modelWeightChecksumSha256',
  'modelWeightChecksumEvidenceRef',
  'manifestTopLevelFields',
  'nextExactScopedToolCallCommand',
  'gpuRuntimeShouldStartNow: false',
  'modelWeightsDownloaded: false',
  'modelInferencePerformed: false',
]) {
  if (!source.includes(phrase)) fail(`source_missing:${phrase}`)
}
for (const phrase of [
  'expectedPostEvidenceBlockers',
  'toolInputs',
  'model_weight',
  'gpuRuntimeShouldStartNow',
]) {
  if (!diagnosticSource.includes(phrase)) fail(`diagnostic_missing:${phrase}`)
}

fs.rmSync(absolute(runRoot), { recursive: true, force: true })
writePrivateSourceFrame(`${runRoot}/inputs/private-approved-frame.ppm`)
writeLargePrivatePlaceholder(toolContracts.sam2.modelPath, 1)
writeSafetensorsPlaceholder(toolContracts.birefnet.checksumFile)
writeLargePrivatePlaceholder(toolContracts.real_esrgan.modelPath, 4)
writeLargePrivatePlaceholder(toolContracts.rembg.modelPath, 5)
writeLargePrivatePlaceholder(toolContracts.transparent_background.modelPath, 6)

const materialized = {}
const routeBlockers = {}
for (const [toolId, contract] of Object.entries(toolContracts)) {
  const result = materializeManifest(toolId, contract)
  materialized[toolId] = result
  if (result.report.decision !== decision) fail(`${toolId}_decision_mismatch`)
  if (result.report.status !== 'runtime_input_manifest_ready_for_scoped_private_execution') {
    fail(`${toolId}_status_mismatch:${result.report.status}`)
  }
  if (result.report.booleans?.runtimeInputManifestWritten !== true) {
    fail(`${toolId}_manifest_not_written`)
  }
  if (result.report.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail(`${toolId}_materializer_started_gpu`)
  }
  if (result.report.booleans?.toolExecutionPerformed !== false) {
    fail(`${toolId}_materializer_executed_tool`)
  }
  const manifest = json(result.manifestOut)
  if (JSON.stringify(Object.keys(manifest)) !== JSON.stringify(['toolInputs'])) {
    fail(`${toolId}_manifest_top_level_fields_mismatch:${Object.keys(manifest).join(',')}`)
  }
  const record = manifest.toolInputs?.[toolId]
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    fail(`${toolId}_manifest_record_missing`)
    continue
  }
  const checksumFile = contract.checksumFile ?? contract.modelPath
  const expectedSha = sha256File(checksumFile)
  if (record.modelWeightChecksumSha256 !== expectedSha) {
    fail(`${toolId}_checksum_mismatch`)
  }
  if (record.modelWeightManifestId !== contract.manifestId) {
    fail(`${toolId}_manifest_id_mismatch`)
  }
  if (record.modelWeightChecksumEvidenceRef !== contract.evidenceRef) {
    fail(`${toolId}_evidence_ref_mismatch`)
  }
  if (record[contract.modelField] !== contract.modelPath) {
    fail(`${toolId}_model_path_mismatch`)
  }
  if (record.sourceImageLocalPath !== `${runRoot}/inputs/private-approved-frame.ppm`) {
    fail(`${toolId}_source_image_mismatch`)
  }
  if (record.outputDirectory !== result.outputDir) {
    fail(`${toolId}_output_dir_mismatch`)
  }

  const toolCall = runToolCall(toolId, result.manifestOut)
  const blockingReason = toolCall.response?.blockingReasonCode
  routeBlockers[toolId] = blockingReason
  if (toolCall.response?.externalAgentExecutionState !== 'blocked_with_reason') {
    fail(`${toolId}_tool_call_state_mismatch:${toolCall.response?.externalAgentExecutionState}`)
  }
  if (typeof blockingReason !== 'string') {
    fail(`${toolId}_blocking_reason_missing`)
  } else if (blockingReason.includes('_model_weight_')) {
    fail(`${toolId}_still_blocked_on_model_weight:${blockingReason}`)
  } else if (!expectedPostEvidenceBlockers.has(blockingReason)) {
    fail(`${toolId}_unexpected_post_evidence_blocker:${blockingReason}`)
  }
  if (toolCall.response?.externalAgentToolCallResult?.currentBlockingPrerequisiteKey === 'modelWeightManifestEvidence') {
    fail(`${toolId}_current_blocker_still_model_weight`)
  }
  if (toolCall.response?.externalAgentToolCallResult?.controlledAdapterInvokedNow !== true) {
    fail(`${toolId}_adapter_not_invoked`)
  }
  if (toolCall.response?.externalAgentToolCallResult?.controlledAdapterExecutedNow !== false) {
    fail(`${toolId}_unexpected_adapter_execution`)
  }
  if (toolCall.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail(`${toolId}_tool_call_started_gpu`)
  }
}

const outsideManifest = spawn([
  `npm run --silent ${runScriptName} --`,
  '--tool rembg',
  `--source-image ${runRoot}/inputs/private-approved-frame.ppm`,
  `--rembg-model ${toolContracts.rembg.modelPath}`,
  `--output-dir ${runRoot}/outputs/outside-test`,
  '--manifest-out /tmp/reeditpro-runtime-inputs.json',
].join(' '))
if (outsideManifest.status === 0) fail('outside_manifest_unexpected_success')
if (!outsideManifest.stderr.includes('manifestOut must stay under .local-artifacts/')) {
  fail('outside_manifest_missing_diagnostic')
}

const publicEvidenceRef = spawn([
  `npm run --silent ${runScriptName} --`,
  '--tool rembg',
  `--source-image ${runRoot}/inputs/private-approved-frame.ppm`,
  `--rembg-model ${toolContracts.rembg.modelPath}`,
  `--output-dir ${runRoot}/outputs/public-evidence-test`,
  `--manifest-out ${runRoot}/runtime-inputs/public-evidence-test.json`,
  '--model-weight-checksum-evidence-ref https://example.invalid/rembg.json',
].join(' '))
if (publicEvidenceRef.status === 0) fail('public_evidence_ref_unexpected_success')
if (!publicEvidenceRef.stderr.includes('reviewed private:// checksum evidence ref')) {
  fail('public_evidence_ref_missing_diagnostic')
}

const tinyModelPath = `${runRoot}/models/rembg/tiny.onnx`
fs.mkdirSync(path.dirname(absolute(tinyModelPath)), { recursive: true })
fs.writeFileSync(absolute(tinyModelPath), 'tiny')
const tinyModel = spawn([
  `npm run --silent ${runScriptName} --`,
  '--tool rembg',
  `--source-image ${runRoot}/inputs/private-approved-frame.ppm`,
  `--rembg-model ${tinyModelPath}`,
  `--output-dir ${runRoot}/outputs/tiny-test`,
  `--manifest-out ${runRoot}/runtime-inputs/tiny-test.json`,
].join(' '))
if (tinyModel.status === 0) fail('tiny_model_unexpected_success')
if (!tinyModel.stderr.includes('must be at least 1048576 bytes')) {
  fail('tiny_model_missing_diagnostic')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  materializedTools: Object.keys(materialized).length,
  routeManifestAcceptedPastModelWeightEvidenceTools: Object.keys(routeBlockers).length,
  routeBlockers,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: !fs.existsSync(absolute('package-lock.json')) ||
    spawn('git diff --quiet -- package-lock.json').status === 0,
}, null, 2))
