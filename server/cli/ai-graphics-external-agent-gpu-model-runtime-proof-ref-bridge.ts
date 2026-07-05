import fs from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const decision =
  'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks'
const defaultStatus =
  'gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied'
const acceptedStatus =
  'gpu_model_runtime_proof_ref_bridge_accepts_private_local_runtime_proof_for_scoped_route_submission'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md'
const sourceLocalDevHarnessPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
const sourceProofRefRouteCallerPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const

const modelWeightManifestRequiredTools = new Set<string>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

type JsonRecord = Record<string, any>
type GpuModelToolId = (typeof gpuModelTools)[number]

const privateOutputContractByTool: Record<GpuModelToolId, {
  acceptedRuntimeEvidence: string
  requiredPrivateOutputFields: string[]
}> = {
  torch_torchvision: {
    acceptedRuntimeEvidence: 'cpu_foundation_runtime_when_allowCpuFoundationRuntime_is_true',
    requiredPrivateOutputFields: [
      'runtime.cpuFoundationRuntimeAllowed=true',
      'runtime.cudaAvailable=false',
      'runtime.deviceType=cpu',
      'runtime.modelInferencePerformed=false',
      'runtime.mediaProcessed=false',
    ],
  },
  transformers: {
    acceptedRuntimeEvidence: 'cpu_foundation_runtime_when_allowCpuFoundationRuntime_is_true',
    requiredPrivateOutputFields: [
      'runtime.cpuFoundationRuntimeAllowed=true',
      'runtime.cudaAvailable=false',
      'runtime.deviceType=cpu',
      'runtime.modelInferencePerformed=false',
      'runtime.mediaProcessed=false',
    ],
  },
  sam2: {
    acceptedRuntimeEvidence: 'native_cuda_sam2_mask_sequence',
    requiredPrivateOutputFields: [
      'toolId=sam2',
      'cudaAvailable=true',
      'deviceName',
      'privateSourceFrame.sourceImagePath',
      'privateSourceFrame.framePaths[]',
      'masks.maskPaths[]',
      'masks.overlayPaths[]',
      'masks.perFrame[]',
      'runtime.modelId=sam2.1_hiera_tiny',
      'runtime.privateSourceFrameUsed=true',
      'runtime.realMediaUsed=false',
      'runtime.broadRealMediaInputEnabled=false',
      'runtime.externalModelDownloadAttempted=false',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
  birefnet: {
    acceptedRuntimeEvidence: 'native_cuda_birefnet_mask_and_cutout',
    requiredPrivateOutputFields: [
      'toolId=birefnet',
      'cudaAvailable=true',
      'deviceName',
      'fixture.path',
      'fixture.kind',
      'mask.path',
      'mask.cutoutPath',
      'mask.nonZeroRatio',
      'mask.meanAlpha',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
  real_esrgan: {
    acceptedRuntimeEvidence: 'native_cuda_or_explicit_cpu_model_real_esrgan_enhanced_image',
    requiredPrivateOutputFields: [
      'toolId=real_esrgan',
      'native proof: cudaAvailable=true and deviceName',
      'CPU model proof: cudaAvailable=false, runtime.runtimeDevice=cpu, runtime.cpuModelRuntimeAllowed=true',
      'enhanced.path',
      'enhanced.scale=4',
      'enhanced.sizeBytes',
      'sourceFrame.path_or_fixture.path_or_sampleCrop.path',
      'runtime.modelName=RealESRGAN_x4plus',
      'runtime.faceEnhanceRan=false',
      'runtime.gfpganImported=false',
      'runtime.filmUsed=false',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
  kornia: {
    acceptedRuntimeEvidence: 'cpu_tensor_runtime_when_allowCpuTensorRuntime_is_true',
    requiredPrivateOutputFields: [
      'toolId=kornia',
      'cpuTensorRuntimeAllowed=true',
      'cudaAvailable=false',
      'deviceType=cpu',
      'mask.path',
      'metrics.gaussianKernel',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
  rembg: {
    acceptedRuntimeEvidence: 'native_cuda_or_explicit_cpu_model_onnxruntime_rembg_cutout',
    requiredPrivateOutputFields: [
      'toolId=rembg',
      'native proof: cudaExecutionProviderAvailable=true and runtime.availableProviders includes CUDAExecutionProvider',
      'CPU model proof: cudaExecutionProviderAvailable=false, runtime.cpuModelRuntimeAllowed=true, runtime.selectedProviders includes CPUExecutionProvider',
      'runtime.modelName',
      'input.path',
      'mask.path',
      'mask.cutoutPath',
      'mask.meanAlpha',
      'mask.nonZeroRatio',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
  transparent_background: {
    acceptedRuntimeEvidence: 'native_cuda_or_explicit_cpu_model_transparent_background_checkpoint_cutout',
    requiredPrivateOutputFields: [
      'toolId=transparent_background',
      'native proof: cudaAvailable=true and deviceName',
      'CPU model proof: cudaAvailable=false, runtime.runtimeDevice=cpu, runtime.cpuModelRuntimeAllowed=true',
      'runtime.mode',
      'runtime.checkpointPath',
      'input.path',
      'mask.path',
      'mask.cutoutPath',
      'mask.meanAlpha',
      'mask.nonZeroRatio',
      'runtime.modelDownloadedExternally=false',
      'runtime.providerRuntimePerformed=false',
      'runtime.publicArtifactCreated=false',
      'runtime.signedUrlCreated=false',
    ],
  },
}

interface ProofRefCallerRow {
  toolId: GpuModelToolId
  capabilityId: string
  requestEnvelope: {
    nativeGpuRuntimeProofRef: string
    externalBetaPerToolRuntimeProofRef: string
    modelWeightManifestRef?: string
  }
  modelWeightManifestRequired: boolean
}

interface LocalProofHarnessRow {
  toolId: string
  adapterStatus?: string
  executionState?: string
  localRuntimeExecutionPerformed?: boolean
  toolExecutionApprovedNow?: boolean
  gpuRuntimeShouldStartNow?: boolean
  allowCpuTensorRuntime?: boolean
  allowCpuFoundationRuntime?: boolean
  allowCpuModelRuntime?: boolean
  publicArtifactCreated?: boolean
  signedUrlCreated?: boolean
  runtimeReadyNow?: boolean
  externalBetaReadyNow?: boolean
  productionReadyNow?: boolean
  outputJsonPath?: string | null
  outputJsonSha256?: string | null
  skipReasonCode?: string | null
  errorMessage?: string | null
  warnings?: unknown[]
}

interface LocalProofOutputEvidence {
  privateOutputJsonPathExists: boolean
  privateOutputJsonSha256Matches: boolean
  privateOutputJsonAccepted: boolean
  privateOutputJsonRejectionReason: string | null
}

interface BridgeRow {
  toolId: GpuModelToolId
  capabilityId: string
  modelWeightManifestRequired: boolean
  nativeGpuRuntimeProofRef: string
  modelWeightManifestRef?: string
  externalBetaPerToolRuntimeProofRef: string
  localRuntimeProofResultProvided: boolean
  localRuntimeProofAccepted: boolean
  proofRefBridgeStatus:
    | 'blocked_missing_private_local_runtime_proof_result'
    | 'blocked_private_local_runtime_proof_not_executed'
    | 'blocked_private_local_runtime_output_missing'
    | 'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
  blockingReason: string | null
  expectedLocalProofEvidence: {
    adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready'
    executionState: 'executable'
    localRuntimeExecutionPerformed: true
    toolExecutionApprovedNow: true
    gpuRuntimeShouldStartNowDuringScopedProof: boolean
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    privateOutputJsonPathExists: true
    privateOutputJsonSha256Matches: true
  }
  localProofEvidenceObserved: {
    adapterStatus: string | null
    executionState: string | null
    localRuntimeExecutionPerformed: boolean
    toolExecutionApprovedNow: boolean
    gpuRuntimeShouldStartNowDuringScopedProof: boolean
    publicArtifactCreated: boolean
    signedUrlCreated: boolean
    runtimeReadyNow: boolean
    externalBetaReadyNow: boolean
    productionReadyNow: boolean
    privateOutputJsonPath: string | null
    privateOutputJsonSha256: string | null
    privateOutputJsonPathExists: boolean
    privateOutputJsonSha256Matches: boolean
    privateOutputJsonAccepted: boolean
    privateOutputJsonRejectionReason: string | null
    skipReasonCode: string | null
    errorMessage: string | null
  }
  routeSubmissionReadyWithAcceptedPrivateProof: boolean
  gpuRuntimeShouldStartNow: false
  liveQueueWritePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformedByBridge: false
  modelWeightsLoadedByBridge: false
  publicArtifactCreatedByBridge: false
  signedUrlCreatedByBridge: false
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function stringFlags(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) continue
    const value = process.argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`)
    }
    values.push(value)
  }
  return values
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function asBridgePath(file: string): string {
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file)
}

function sourceProofRefRows(source: JsonRecord): ProofRefCallerRow[] {
  const rows = source.gpuModelProofRefCallerRows
  assert(Array.isArray(rows), 'source proof-ref route caller rows are missing')
  assert(rows.length === 8, `expected 8 proof-ref route caller rows, got ${rows.length}`)

  return rows.map((row) => {
    assert(
      gpuModelTools.includes(row.toolId),
      `unexpected GPU/model proof-ref caller tool: ${row.toolId}`,
    )
    const envelope = row.requestEnvelope ?? {}
    assert(
      typeof envelope.nativeGpuRuntimeProofRef === 'string' &&
        envelope.nativeGpuRuntimeProofRef.startsWith('private://'),
      `${row.toolId} native GPU runtime proof ref must be private`,
    )
    assert(
      typeof envelope.externalBetaPerToolRuntimeProofRef === 'string' &&
        envelope.externalBetaPerToolRuntimeProofRef.startsWith('private://'),
      `${row.toolId} per-tool runtime proof ref must be private`,
    )
    if (modelWeightManifestRequiredTools.has(row.toolId)) {
      assert(
        typeof envelope.modelWeightManifestRef === 'string' &&
          envelope.modelWeightManifestRef.startsWith('private://'),
        `${row.toolId} model-weight manifest ref must be private`,
      )
    }
    return row as ProofRefCallerRow
  })
}

function localProofRows(localProof?: JsonRecord): Map<string, LocalProofHarnessRow> {
  if (!localProof) return new Map()
  const rows = localProof.gpuModelLocalDevRuntimeExecutionHarnessRows
  assert(Array.isArray(rows), 'local runtime proof result has no harness rows')
  return new Map(rows.map((row) => [String(row.toolId), row as LocalProofHarnessRow]))
}

function mergeLocalProofRows(localProofs: JsonRecord[]): Map<string, LocalProofHarnessRow> {
  const merged = new Map<string, LocalProofHarnessRow>()
  for (const proof of localProofs) {
    for (const [toolId, row] of localProofRows(proof)) {
      assert(
        !merged.has(toolId),
        `duplicate supplied GPU/model local proof tool across proof bundles: ${toolId}`,
      )
      merged.set(toolId, row)
    }
  }
  return merged
}

function localProofOutputExists(row: LocalProofHarnessRow | undefined): boolean {
  if (!row?.outputJsonPath) return false
  return fs.existsSync(asBridgePath(row.outputJsonPath))
}

function sha256File(file: string): string {
  return createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex')
}

function isLocalGpuModelProofOutputPath(file: string | null | undefined): boolean {
  if (!file) return false
  if (path.isAbsolute(file)) {
    const relative = path.relative(process.cwd(), file)
    if (relative.startsWith('..') || path.isAbsolute(relative)) return false
    return isLocalGpuModelProofOutputPath(relative)
  }
  const normalized = path.normalize(file)
  return normalized.startsWith(
    `.local-artifacts${path.sep}ai-graphics${path.sep}gpu-model-local-dev-runtime${path.sep}`,
  ) ||
    normalized.startsWith(
      `local-artifacts${path.sep}ai-graphics${path.sep}gpu-model-local-dev-runtime${path.sep}`,
    )
}

function nestedValue(
  value: unknown,
  pathSegments: string[],
): unknown {
  let current = value
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined
    }
    current = (current as JsonRecord)[segment]
  }
  return current
}

function anyTruthyFlag(value: unknown, flags: Set<string>): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((item) => anyTruthyFlag(item, flags))
  return Object.entries(value as JsonRecord).some(([key, child]) => {
    if (flags.has(key) && child === true) return true
    return anyTruthyFlag(child, flags)
  })
}

function anyUnsafeUrl(value: unknown): boolean {
  if (typeof value === 'string') return /^https?:\/\//i.test(value)
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(anyUnsafeUrl)
  return Object.values(value as JsonRecord).some(anyUnsafeUrl)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function positiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function nonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString)
}

function nonEmptyRecordArray(value: unknown): value is JsonRecord[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => (
    item !== null && typeof item === 'object' && !Array.isArray(item)
  ))
}

function runtimeFlagIsFalse(outputJson: JsonRecord, key: string): boolean {
  return nestedValue(outputJson, ['runtime', key]) === false
}

function requiredRuntimeFlagsAreFalse(
  outputJson: JsonRecord,
  keys: string[],
): boolean {
  return keys.every((key) => runtimeFlagIsFalse(outputJson, key))
}

function outputToolMatches(
  toolId: GpuModelToolId,
  outputJson: JsonRecord,
): boolean {
  const topToolId = outputJson.toolId
  const runtimeToolId = nestedValue(outputJson, ['runtime', 'toolId'])
  if (topToolId === toolId || runtimeToolId === toolId) return true
  if (
    toolId === 'sam2' &&
    nestedValue(outputJson, ['runtime', 'modelId']) === 'sam2.1_hiera_tiny' &&
    outputJson.privateSourceFrame &&
    outputJson.masks
  ) {
    return true
  }
  if (toolId === 'birefnet' && outputJson.fixture && outputJson.mask) {
    return true
  }
  if (
    toolId === 'real_esrgan' &&
    nestedValue(outputJson, ['runtime', 'modelName']) === 'RealESRGAN_x4plus' &&
    outputJson.enhanced
  ) {
    return true
  }
  return false
}

function outputHasGpuEvidence(
  toolId: GpuModelToolId,
  outputJson: JsonRecord,
): boolean {
  if (toolId === 'rembg') {
    return outputJson.cudaExecutionProviderAvailable === true
  }
  return (
    outputJson.cudaAvailable === true ||
    nestedValue(outputJson, ['runtime', 'cudaAvailable']) === true
  )
}

function acceptsSam2GpuProof(outputJson: JsonRecord): boolean {
  const perFrame = nestedValue(outputJson, ['masks', 'perFrame'])
  return (
    outputJson.cudaAvailable === true &&
    nonEmptyString(outputJson.deviceName) &&
    nestedValue(outputJson, ['runtime', 'modelId']) === 'sam2.1_hiera_tiny' &&
    nestedValue(outputJson, ['runtime', 'privateSourceFrameUsed']) === true &&
    nestedValue(outputJson, ['runtime', 'realMediaUsed']) === false &&
    nestedValue(outputJson, ['runtime', 'broadRealMediaInputEnabled']) === false &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'externalModelDownloadAttempted',
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    nonEmptyString(nestedValue(outputJson, ['privateSourceFrame', 'sourceImagePath'])) &&
    positiveNumber(nestedValue(outputJson, ['privateSourceFrame', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['privateSourceFrame', 'height'])) &&
    positiveNumber(nestedValue(outputJson, ['privateSourceFrame', 'frameCount'])) &&
    nonEmptyStringArray(nestedValue(outputJson, ['privateSourceFrame', 'framePaths'])) &&
    nonEmptyStringArray(nestedValue(outputJson, ['privateSourceFrame', 'jpegFramePaths'])) &&
    nonEmptyStringArray(nestedValue(outputJson, ['masks', 'maskPaths'])) &&
    nonEmptyStringArray(nestedValue(outputJson, ['masks', 'overlayPaths'])) &&
    nonEmptyRecordArray(perFrame) &&
    perFrame.every((frame) => (
      typeof frame.frameIndex === 'number' &&
      Number.isFinite(frame.frameIndex) &&
      typeof frame.nonZeroRatio === 'number' &&
      Number.isFinite(frame.nonZeroRatio)
    ))
  )
}

function acceptsBirefnetGpuProof(outputJson: JsonRecord): boolean {
  return (
    outputJson.cudaAvailable === true &&
    nonEmptyString(outputJson.deviceName) &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    positiveNumber(nestedValue(outputJson, ['fixture', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['fixture', 'height'])) &&
    nonEmptyString(nestedValue(outputJson, ['fixture', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['fixture', 'kind'])) &&
    positiveNumber(nestedValue(outputJson, ['mask', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['mask', 'height'])) &&
    typeof nestedValue(outputJson, ['mask', 'nonZeroRatio']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'meanAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'minAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'maxAlpha']) === 'number' &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'cutoutPath']))
  )
}

function acceptsRealEsrganGpuProof(outputJson: JsonRecord): boolean {
  return (
    outputJson.cudaAvailable === true &&
    nonEmptyString(outputJson.deviceName) &&
    nestedValue(outputJson, ['runtime', 'modelName']) === 'RealESRGAN_x4plus' &&
    nestedValue(outputJson, ['runtime', 'faceEnhanceRan']) === false &&
    nestedValue(outputJson, ['runtime', 'gfpganImported']) === false &&
    nestedValue(outputJson, ['runtime', 'filmUsed']) === false &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'height'])) &&
    nestedValue(outputJson, ['enhanced', 'scale']) === 4 &&
    nonEmptyString(nestedValue(outputJson, ['enhanced', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'sizeBytes'])) &&
    (
      nonEmptyString(nestedValue(outputJson, ['sourceFrame', 'path'])) ||
      nonEmptyString(nestedValue(outputJson, ['fixture', 'path'])) ||
      nonEmptyString(nestedValue(outputJson, ['sampleCrop', 'path']))
    )
  )
}

function acceptsRembgGpuProof(outputJson: JsonRecord): boolean {
  const providers = nestedValue(outputJson, ['runtime', 'availableProviders'])
  return (
    outputJson.cudaExecutionProviderAvailable === true &&
    Array.isArray(providers) &&
    providers.includes('CUDAExecutionProvider') &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'modelName'])) &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    nonEmptyString(nestedValue(outputJson, ['input', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'height'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'cutoutPath'])) &&
    typeof nestedValue(outputJson, ['mask', 'meanAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'nonZeroRatio']) === 'number'
  )
}

function acceptsRealEsrganCpuModelProof(
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  return (
    row?.allowCpuModelRuntime === true &&
    outputJson.cudaAvailable === false &&
    nestedValue(outputJson, ['runtime', 'runtimeDevice']) === 'cpu' &&
    nestedValue(outputJson, ['runtime', 'cpuModelRuntimeAllowed']) === true &&
    nestedValue(outputJson, ['runtime', 'modelName']) === 'RealESRGAN_x4plus' &&
    nestedValue(outputJson, ['runtime', 'faceEnhanceRan']) === false &&
    nestedValue(outputJson, ['runtime', 'gfpganImported']) === false &&
    nestedValue(outputJson, ['runtime', 'filmUsed']) === false &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'height'])) &&
    nestedValue(outputJson, ['enhanced', 'scale']) === 4 &&
    nonEmptyString(nestedValue(outputJson, ['enhanced', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['enhanced', 'sizeBytes'])) &&
    (
      nonEmptyString(nestedValue(outputJson, ['sourceFrame', 'path'])) ||
      nonEmptyString(nestedValue(outputJson, ['fixture', 'path'])) ||
      nonEmptyString(nestedValue(outputJson, ['sampleCrop', 'path']))
    )
  )
}

function acceptsRembgCpuModelProof(
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  const selectedProviders = nestedValue(outputJson, ['runtime', 'selectedProviders'])
  return (
    row?.allowCpuModelRuntime === true &&
    outputJson.cudaExecutionProviderAvailable === false &&
    Array.isArray(selectedProviders) &&
    selectedProviders.includes('CPUExecutionProvider') &&
    nestedValue(outputJson, ['runtime', 'cpuModelRuntimeAllowed']) === true &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'modelName'])) &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    nonEmptyString(nestedValue(outputJson, ['input', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'height'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'cutoutPath'])) &&
    typeof nestedValue(outputJson, ['mask', 'meanAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'nonZeroRatio']) === 'number'
  )
}

function acceptsTransparentBackgroundGpuProof(outputJson: JsonRecord): boolean {
  return (
    outputJson.cudaAvailable === true &&
    nonEmptyString(outputJson.deviceName) &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'mode'])) &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'checkpointPath'])) &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    nonEmptyString(nestedValue(outputJson, ['input', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'height'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'cutoutPath'])) &&
    typeof nestedValue(outputJson, ['mask', 'meanAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'nonZeroRatio']) === 'number'
  )
}

function acceptsTransparentBackgroundCpuModelProof(
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  return (
    row?.allowCpuModelRuntime === true &&
    outputJson.cudaAvailable === false &&
    nestedValue(outputJson, ['runtime', 'runtimeDevice']) === 'cpu' &&
    nestedValue(outputJson, ['runtime', 'cpuModelRuntimeAllowed']) === true &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'mode'])) &&
    nonEmptyString(nestedValue(outputJson, ['runtime', 'checkpointPath'])) &&
    requiredRuntimeFlagsAreFalse(outputJson, [
      'modelDownloadedExternally',
      'providerRuntimePerformed',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) &&
    nonEmptyString(nestedValue(outputJson, ['input', 'path'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'width'])) &&
    positiveNumber(nestedValue(outputJson, ['input', 'height'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'path'])) &&
    nonEmptyString(nestedValue(outputJson, ['mask', 'cutoutPath'])) &&
    typeof nestedValue(outputJson, ['mask', 'meanAlpha']) === 'number' &&
    typeof nestedValue(outputJson, ['mask', 'nonZeroRatio']) === 'number'
  )
}

function acceptsToolSpecificGpuProof(
  toolId: GpuModelToolId,
  outputJson: JsonRecord,
): boolean {
  switch (toolId) {
    case 'sam2':
      return acceptsSam2GpuProof(outputJson)
    case 'birefnet':
      return acceptsBirefnetGpuProof(outputJson)
    case 'real_esrgan':
      return acceptsRealEsrganGpuProof(outputJson)
    case 'rembg':
      return acceptsRembgGpuProof(outputJson)
    case 'transparent_background':
      return acceptsTransparentBackgroundGpuProof(outputJson)
    default:
      return outputHasGpuEvidence(toolId, outputJson)
  }
}

function acceptsCpuFoundationProof(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  if (toolId !== 'torch_torchvision' && toolId !== 'transformers') return false
  if (row?.allowCpuFoundationRuntime !== true) return false
  return (
    nestedValue(outputJson, ['runtime', 'cpuFoundationRuntimeAllowed']) === true &&
    nestedValue(outputJson, ['runtime', 'cudaAvailable']) === false &&
    nestedValue(outputJson, ['runtime', 'deviceType']) === 'cpu' &&
    nestedValue(outputJson, ['runtime', 'modelInferencePerformed']) === false &&
    nestedValue(outputJson, ['runtime', 'mediaProcessed']) === false
  )
}

function acceptsKorniaCpuTensorProof(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  if (toolId !== 'kornia') return false
  if (row?.allowCpuTensorRuntime !== true) return false
  return (
    outputJson.cpuTensorRuntimeAllowed === true &&
    outputJson.cudaAvailable === false &&
    outputJson.deviceType === 'cpu' &&
    nestedValue(outputJson, ['runtime', 'modelDownloadedExternally']) === false &&
    nestedValue(outputJson, ['runtime', 'providerRuntimePerformed']) === false &&
    nestedValue(outputJson, ['runtime', 'publicArtifactCreated']) === false &&
    nestedValue(outputJson, ['runtime', 'signedUrlCreated']) === false &&
    typeof nestedValue(outputJson, ['mask', 'path']) === 'string' &&
    typeof nestedValue(outputJson, ['metrics', 'gaussianKernel']) === 'number'
  )
}

function outputHasAcceptedRuntimeEvidence(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
  outputJson: JsonRecord,
): boolean {
  return acceptsCpuFoundationProof(toolId, row, outputJson) ||
    acceptsKorniaCpuTensorProof(toolId, row, outputJson) ||
    (toolId === 'real_esrgan' && acceptsRealEsrganCpuModelProof(row, outputJson)) ||
    (toolId === 'rembg' && acceptsRembgCpuModelProof(row, outputJson)) ||
    (toolId === 'transparent_background' && acceptsTransparentBackgroundCpuModelProof(row, outputJson)) ||
    acceptsToolSpecificGpuProof(toolId, outputJson)
}

function expectedGpuRuntimeShouldStartDuringScopedProof(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
): boolean {
  if (toolId === 'torch_torchvision' || toolId === 'transformers') {
    return row ? row.allowCpuFoundationRuntime !== true : false
  }
  if (toolId === 'kornia') {
    return row ? row.allowCpuTensorRuntime !== true : false
  }
  if (
    toolId === 'real_esrgan' ||
    toolId === 'rembg' ||
    toolId === 'transparent_background'
  ) {
    return row ? row.allowCpuModelRuntime !== true : false
  }
  return true
}

function localProofOutputEvidence(
  toolId: GpuModelToolId,
  row: LocalProofHarnessRow | undefined,
): LocalProofOutputEvidence {
  if (!isLocalGpuModelProofOutputPath(row?.outputJsonPath)) {
    return {
      privateOutputJsonPathExists: false,
      privateOutputJsonSha256Matches: false,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_outside_local_artifacts_gpu_model_runtime_namespace',
    }
  }

  const privateOutputJsonPathExists = localProofOutputExists(row)
  if (!privateOutputJsonPathExists || !row?.outputJsonPath) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches: false,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason: 'private_output_json_path_missing',
    }
  }

  let observedSha256: string
  try {
    observedSha256 = sha256File(asBridgePath(row.outputJsonPath))
  } catch (error) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches: false,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        error instanceof Error
          ? `private_output_json_unreadable:${error.message}`
          : 'private_output_json_unreadable',
    }
  }
  const expectedSha256 = row.outputJsonSha256
  const privateOutputJsonSha256Matches =
    typeof expectedSha256 === 'string' &&
    /^[a-f0-9]{64}$/i.test(expectedSha256) &&
    observedSha256 === expectedSha256.toLowerCase()
  if (!privateOutputJsonSha256Matches) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        typeof expectedSha256 === 'string'
          ? 'private_output_json_sha256_mismatch'
          : 'private_output_json_sha256_missing',
    }
  }

  let outputJson: JsonRecord
  try {
    outputJson = readJson(asBridgePath(row.outputJsonPath))
  } catch (error) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        error instanceof Error
          ? `private_output_json_unreadable:${error.message}`
          : 'private_output_json_unreadable',
    }
  }

  const unsafeTruthyFlags = new Set([
    'privateLocalProofFixture',
    'dry_run_passed',
    'generated_local_fixture_passed',
    'providerRuntimePerformed',
    'modelDownloadedExternally',
    'externalModelDownloadAttempted',
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
  ])
  if (anyTruthyFlag(outputJson, unsafeTruthyFlags)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_contains_forbidden_success_or_runtime_flag',
    }
  }
  if (anyUnsafeUrl(outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_contains_public_url',
    }
  }
  if (outputJson.ok !== true) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_missing_ok_true',
    }
  }
  if (!outputToolMatches(toolId, outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        'private_output_json_tool_identity_mismatch',
    }
  }
  if (!outputHasAcceptedRuntimeEvidence(toolId, row, outputJson)) {
    return {
      privateOutputJsonPathExists,
      privateOutputJsonSha256Matches,
      privateOutputJsonAccepted: false,
      privateOutputJsonRejectionReason:
        toolId === 'torch_torchvision' || toolId === 'transformers'
          ? 'private_output_json_missing_cuda_or_cpu_foundation_runtime_evidence'
          : toolId === 'kornia'
          ? 'private_output_json_missing_cuda_or_cpu_tensor_runtime_evidence'
          : toolId === 'real_esrgan' ||
            toolId === 'rembg' ||
            toolId === 'transparent_background'
          ? 'private_output_json_missing_cuda_or_cpu_model_runtime_evidence'
          : 'private_output_json_missing_cuda_runtime_evidence',
    }
  }

  return {
    privateOutputJsonPathExists,
    privateOutputJsonSha256Matches,
    privateOutputJsonAccepted: true,
    privateOutputJsonRejectionReason: null,
  }
}

function buildBridgeRow(
  proofRefRow: ProofRefCallerRow,
  localProofRow?: LocalProofHarnessRow,
): BridgeRow {
  const localRuntimeProofResultProvided = Boolean(localProofRow)
  const outputEvidence = localProofOutputEvidence(proofRefRow.toolId, localProofRow)
  const expectedGpuRuntimeShouldStart =
    expectedGpuRuntimeShouldStartDuringScopedProof(
      proofRefRow.toolId,
      localProofRow,
    )
  const privateOutputJsonPathExists =
    outputEvidence.privateOutputJsonPathExists
  const localProofEvidenceObserved = {
    adapterStatus: localProofRow?.adapterStatus ?? null,
    executionState: localProofRow?.executionState ?? null,
    localRuntimeExecutionPerformed:
      localProofRow?.localRuntimeExecutionPerformed === true,
    toolExecutionApprovedNow: localProofRow?.toolExecutionApprovedNow === true,
    gpuRuntimeShouldStartNowDuringScopedProof:
      localProofRow?.gpuRuntimeShouldStartNow === true,
    publicArtifactCreated: localProofRow?.publicArtifactCreated === true,
    signedUrlCreated: localProofRow?.signedUrlCreated === true,
    runtimeReadyNow: localProofRow?.runtimeReadyNow === true,
    externalBetaReadyNow: localProofRow?.externalBetaReadyNow === true,
    productionReadyNow: localProofRow?.productionReadyNow === true,
    privateOutputJsonPath: localProofRow?.outputJsonPath ?? null,
    privateOutputJsonSha256: localProofRow?.outputJsonSha256 ?? null,
    privateOutputJsonPathExists,
    privateOutputJsonSha256Matches:
      outputEvidence.privateOutputJsonSha256Matches,
    privateOutputJsonAccepted: outputEvidence.privateOutputJsonAccepted,
    privateOutputJsonRejectionReason:
      outputEvidence.privateOutputJsonRejectionReason,
    skipReasonCode: localProofRow?.skipReasonCode ?? null,
    errorMessage: localProofRow?.errorMessage ?? null,
    allowCpuModelRuntime: localProofRow?.allowCpuModelRuntime === true,
  }
  const localRuntimeProofAccepted =
    localProofEvidenceObserved.adapterStatus ===
      'controlled_gpu_model_adapter_executed_private_output_ready' &&
    localProofEvidenceObserved.executionState === 'executable' &&
    localProofEvidenceObserved.localRuntimeExecutionPerformed &&
    localProofEvidenceObserved.toolExecutionApprovedNow &&
    localProofEvidenceObserved.gpuRuntimeShouldStartNowDuringScopedProof ===
      expectedGpuRuntimeShouldStart &&
    !localProofEvidenceObserved.publicArtifactCreated &&
    !localProofEvidenceObserved.signedUrlCreated &&
    !localProofEvidenceObserved.runtimeReadyNow &&
    !localProofEvidenceObserved.externalBetaReadyNow &&
    !localProofEvidenceObserved.productionReadyNow &&
    privateOutputJsonPathExists &&
    localProofEvidenceObserved.privateOutputJsonSha256Matches &&
    localProofEvidenceObserved.privateOutputJsonAccepted

  const proofRefBridgeStatus: BridgeRow['proofRefBridgeStatus'] =
    localRuntimeProofAccepted
      ? 'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
      : !localRuntimeProofResultProvided
      ? 'blocked_missing_private_local_runtime_proof_result'
      : !localProofEvidenceObserved.localRuntimeExecutionPerformed
      ? 'blocked_private_local_runtime_proof_not_executed'
      : 'blocked_private_local_runtime_output_missing'

  const blockingReason = localRuntimeProofAccepted
    ? null
    : !localRuntimeProofResultProvided
    ? 'No private local-dev runtime proof result was supplied. Run the scoped harness with the approved per-tool runtime mode and private inputs first.'
    : !localProofEvidenceObserved.localRuntimeExecutionPerformed
    ? `Private local proof for ${proofRefRow.toolId} did not execute; blocker: ${localProofEvidenceObserved.skipReasonCode ?? localProofEvidenceObserved.errorMessage ?? 'unknown'}`
    : `Private local proof executed but was not accepted by the proof bridge: ${
        localProofEvidenceObserved.privateOutputJsonRejectionReason ??
        'missing existing private output JSON path or safe false runtime/public readiness booleans'
      }.`

  return {
    toolId: proofRefRow.toolId,
    capabilityId: proofRefRow.capabilityId,
    modelWeightManifestRequired: proofRefRow.modelWeightManifestRequired,
    nativeGpuRuntimeProofRef:
      proofRefRow.requestEnvelope.nativeGpuRuntimeProofRef,
    modelWeightManifestRef:
      proofRefRow.requestEnvelope.modelWeightManifestRef,
    externalBetaPerToolRuntimeProofRef:
      proofRefRow.requestEnvelope.externalBetaPerToolRuntimeProofRef,
    localRuntimeProofResultProvided,
    localRuntimeProofAccepted,
    proofRefBridgeStatus,
    blockingReason,
    expectedLocalProofEvidence: {
      adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready',
      executionState: 'executable',
      localRuntimeExecutionPerformed: true,
      toolExecutionApprovedNow: true,
      gpuRuntimeShouldStartNowDuringScopedProof:
        expectedGpuRuntimeShouldStart,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      privateOutputJsonPathExists: true,
      privateOutputJsonSha256Matches: true,
    },
    localProofEvidenceObserved,
    routeSubmissionReadyWithAcceptedPrivateProof: localRuntimeProofAccepted,
    gpuRuntimeShouldStartNow: false,
    liveQueueWritePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformedByBridge: false,
    modelWeightsLoadedByBridge: false,
    publicArtifactCreatedByBridge: false,
    signedUrlCreatedByBridge: false,
  }
}

function validateCommittedSources(localDevHarness: JsonRecord, proofRefRouteCaller: JsonRecord): void {
  assert(
    localDevHarness.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'source local-dev runtime harness decision mismatch',
  )
  assert(
    proofRefRouteCaller.decision ===
      'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks',
    'source proof-ref route caller decision mismatch',
  )
  assert(
    localDevHarness.counts?.gpuModelToolsCovered === 8,
    'source local-dev runtime harness must cover 8 GPU/model tools',
  )
  assert(
    proofRefRouteCaller.counts?.gpuModelProofRefRouteCallerToolsNow === 8,
    'source proof-ref route caller must cover 8 GPU/model tools',
  )
}

function validateSuppliedLocalProofResult(localProof: JsonRecord): void {
  assert(
    localProof.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'supplied local-dev runtime proof decision mismatch',
  )
  const rows = localProof.gpuModelLocalDevRuntimeExecutionHarnessRows
  assert(Array.isArray(rows), 'supplied local runtime proof result has no harness rows')
  assert(rows.length > 0, 'supplied local runtime proof result must include at least one scoped tool row')
  assert(rows.length <= gpuModelTools.length, 'supplied local runtime proof result has too many rows')

  const seen = new Set<string>()
  for (const row of rows) {
    assert(
      gpuModelTools.includes(row.toolId),
      `unexpected supplied GPU/model local proof tool: ${row.toolId}`,
    )
    assert(!seen.has(row.toolId), `duplicate supplied GPU/model local proof tool: ${row.toolId}`)
    seen.add(row.toolId)
  }
}

function buildReport(localProofResultPaths: string[] = []) {
  const localDevHarness = readJson(sourceLocalDevHarnessPath)
  const proofRefRouteCaller = readJson(sourceProofRefRouteCallerPath)
  validateCommittedSources(localDevHarness, proofRefRouteCaller)

  const suppliedLocalProofs = localProofResultPaths.map((proofPath) => {
    const proof = readJson(proofPath)
    validateSuppliedLocalProofResult(proof)
    return proof
  })
  if (localProofResultPaths.length > 0) {
    const seen = new Set<string>()
    for (const proof of suppliedLocalProofs) {
      for (const row of proof.gpuModelLocalDevRuntimeExecutionHarnessRows) {
        assert(
          !seen.has(row.toolId),
          `duplicate supplied GPU/model local proof tool across proof bundles: ${row.toolId}`,
        )
        seen.add(row.toolId)
      }
    }
  }

  const proofRows = sourceProofRefRows(proofRefRouteCaller)
  const suppliedRowsByTool = mergeLocalProofRows(suppliedLocalProofs)
  const bridgeRows = proofRows.map((row) => buildBridgeRow(row, suppliedRowsByTool.get(row.toolId)))
  const acceptedPrivateLocalRuntimeProofTools =
    bridgeRows.filter((row) => row.localRuntimeProofAccepted).length
  const routeSubmissionReadyWithAcceptedPrivateProofTools =
    bridgeRows.filter((row) => row.routeSubmissionReadyWithAcceptedPrivateProof).length

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-runtime-proof-ref-bridge',
    decision,
    status: acceptedPrivateLocalRuntimeProofTools > 0 ? acceptedStatus : defaultStatus,
    summary:
      'Bridges scoped private local-dev GPU/model runtime proof results to the external-agent GPU/model proof-ref route caller contract. The committed record is safe and accepts zero tools because no private local runtime proof result is supplied. Supplying a private harness result can mark only the proven scoped tool rows ready for proof-ref route submission; this bridge never starts GPU, never writes live queues, never dispatches workers, never loads model weights, and never creates public artifacts or signed URLs.',
    sourceEvidence: {
      localDevRuntimeExecutionHarness: {
        path: sourceLocalDevHarnessPath,
        decision: localDevHarness.decision,
        accepted: true,
      },
      proofRefRouteCaller: {
        path: sourceProofRefRouteCallerPath,
        decision: proofRefRouteCaller.decision,
        accepted: true,
      },
      suppliedPrivateLocalProofResults: localProofResultPaths.length > 0
        ? localProofResultPaths.map((proofPath) => ({
            path: proofPath,
            acceptedRows: acceptedPrivateLocalRuntimeProofTools,
          }))
        : null,
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs',
      defaultCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
      committedRecordCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --write-records',
      privateProofBridgeCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
      privateProofBridgeMultipleProofsCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-a>/harness-result.json --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-b>/harness-result.json',
      upstreamPrivateProofCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json <per-tool-private-input-flags>',
    },
    proofRefBridgePolicy: {
      localRuntimeProofRequiredBeforeProofRefsAccepted: true,
      requiresAdapterExecutedPrivateOutputReadyStatus: true,
      requiresExecutionStateExecutable: true,
      requiresExistingPrivateOutputJsonPath: true,
      requiresPrivateOutputJsonSha256Match: true,
      requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime: true,
      acceptsScopedToolRowsOnly: true,
      acceptsMultiplePrivateProofBundles: true,
      rejectsDiagnosticOnlyPrivateProofFixtures: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyInUpstreamScopedProofRun: true,
      bridgeStartsGpuRuntime: false,
      bridgeWritesLiveQueue: false,
      bridgeDispatchesWorker: false,
      bridgeExecutesTool: false,
      noModelDownload: true,
      noProviderRuntime: true,
      noPublicArtifact: true,
      noSignedUrl: true,
      committedRecordMustAcceptZeroTools: localProofResultPaths.length === 0,
      exactPerToolPrivateOutputContracts: privateOutputContractByTool,
    },
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: bridgeRows.length,
      sourceLocalDevHarnessToolsCovered: localDevHarness.counts?.gpuModelToolsCovered ?? 0,
      sourceProofRefRouteCallerToolsCovered:
        proofRefRouteCaller.counts?.gpuModelProofRefRouteCallerToolsNow ?? 0,
      privateLocalRuntimeProofResultSuppliedTools: suppliedRowsByTool.size,
      acceptedPrivateLocalRuntimeProofTools,
      routeSubmissionReadyWithAcceptedPrivateProofTools,
      blockedMissingPrivateLocalRuntimeProofResultTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_missing_private_local_runtime_proof_result').length,
      blockedPrivateLocalRuntimeProofNotExecutedTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_private_local_runtime_proof_not_executed').length,
      blockedPrivateLocalRuntimeOutputMissingTools:
        bridgeRows.filter((row) => row.proofRefBridgeStatus === 'blocked_private_local_runtime_output_missing').length,
      gpuRuntimeShouldStartNowTools: 0,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedByBridgeTools: 0,
      modelWeightsLoadedByBridgeTools: 0,
      publicArtifactCreatedByBridgeTools: 0,
      signedUrlCreatedByBridgeTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelRuntimeProofRefBridgeRows: bridgeRows,
    booleans: {
      externalAgentGpuModelRuntimeProofRefBridgePrepared: true,
      sourceLocalDevRuntimeExecutionHarnessAccepted: true,
      sourceProofRefRouteCallerAccepted: true,
      all8GpuModelToolsCoveredByBridge: bridgeRows.length === 8,
      privateLocalRuntimeProofRequiredBeforeProofRefsAccepted: true,
      exactPerToolPrivateProofEvidenceShapeEnforced: true,
      routeSubmissionAllowedOnlyWithAcceptedPrivateProof:
        routeSubmissionReadyWithAcceptedPrivateProofTools > 0,
      committedRecordAcceptsZeroGpuModelRuntimeProofs:
        localProofResultPaths.length === 0,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForScopedAcceptedToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformedInThisLane: false,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
    nextRequiredImplementationStep:
      'Run the local-dev runtime harness on an approved CUDA host for a scoped GPU/model tool with private inputs, then feed that private harness result into this bridge before submitting proof refs to the external-agent route.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.gpuModelRuntimeProofRefBridgeRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.capabilityId}\` | ${row.modelWeightManifestRequired} | ${row.localRuntimeProofResultProvided} | ${row.localRuntimeProofAccepted} | \`${row.proofRefBridgeStatus}\` | ${row.routeSubmissionReadyWithAcceptedPrivateProof} | ${row.gpuRuntimeShouldStartNow} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Runtime Proof-Ref Bridge

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This bridge connects real scoped local-dev GPU/model runtime proof evidence to the external-agent proof-ref route caller. The committed record intentionally accepts zero GPU/model proofs because no private local runtime proof result is supplied.

It does not start GPU runtime, write live queues, dispatch workers, execute tools, load model weights, create public artifacts, create signed URLs, unlock external beta, or unlock production. GPU runtime can start only in the upstream scoped local-dev harness call that supplies private inputs for one requested tool.

Private output proof is accepted only when the JSON matches the exact per-tool contract for that tool. The model/checkpoint-backed tools require tool-shaped evidence such as SAM2 mask sequences, BiRefNet mask/cutout output, Real-ESRGAN enhanced output, rembg cutout output, or transparent-background checkpoint output; generic CUDA-looking JSON is not enough. Real-ESRGAN, rembg, and transparent-background also accept explicit CPU model proof when the local proof row has \`allowCpuModelRuntime=true\`, the private model/input/checksum evidence is present, and no GPU attachment is requested.

## Bridge rows

| Tool | Capability | Needs model manifest | Local proof supplied | Local proof accepted | Bridge status | Route submission ready | GPU starts now |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Private proof bridge command

\`${report.interfaces.privateProofBridgeCommand}\`

## Next implementation step

${report.nextRequiredImplementationStep}
`
}

function main() {
  const localProofResultPaths = stringFlags('--local-runtime-proof-result')
  const outputJson = stringFlag('--output-json')
  const writeRecords = hasFlag('--write-records')

  if (writeRecords && localProofResultPaths.length > 0) {
    throw new Error(
      '--write-records cannot be combined with --local-runtime-proof-result; private proof bridge outputs must stay local-only.',
    )
  }

  const report = buildReport(localProofResultPaths)
  if (writeRecords) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  if (outputJson) {
    fs.mkdirSync(path.dirname(outputJson), { recursive: true })
    fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main()
