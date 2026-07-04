import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

type ModelWeightToolId =
  | 'sam2'
  | 'birefnet'
  | 'real_esrgan'
  | 'rembg'
  | 'transparent_background'

interface ModelRuntimePathContract {
  toolId: ModelWeightToolId
  modelFlag: string
  modelField: string
  modelLabel: string
  modelPathExpectation: 'file' | 'birefnet_model_directory'
  modelFileForChecksum: (value: string) => string
  expectedExtensions?: string[]
  expectedFileName?: string
  requiresSafetensorsHeader?: boolean
}

const decision =
  'ai_graphics_external_agent_gpu_model_runtime_input_manifest_materialized_local_only'
const canonicalGpuModelRuntimeContainerImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const modelWeightTools: readonly ModelWeightToolId[] = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]
const minimumPrivateModelFileBytes = 1024 * 1024
const maximumSafetensorsHeaderBytes = 1024 * 1024

const modelRuntimePathContracts: Record<ModelWeightToolId, ModelRuntimePathContract> = {
  sam2: {
    toolId: 'sam2',
    modelFlag: '--sam2-checkpoint',
    modelField: 'sam2CheckpointLocalPath',
    modelLabel: 'SAM2 checkpoint',
    modelPathExpectation: 'file',
    modelFileForChecksum: (value) => value,
    expectedExtensions: ['.pt', '.pth'],
  },
  birefnet: {
    toolId: 'birefnet',
    modelFlag: '--birefnet-model',
    modelField: 'birefnetModelLocalPath',
    modelLabel: 'BiRefNet model.safetensors',
    modelPathExpectation: 'birefnet_model_directory',
    modelFileForChecksum: (value) => path.join(value, 'model.safetensors'),
    expectedFileName: 'model.safetensors',
    requiresSafetensorsHeader: true,
  },
  real_esrgan: {
    toolId: 'real_esrgan',
    modelFlag: '--real-esrgan-model',
    modelField: 'realEsrganModelLocalPath',
    modelLabel: 'Real-ESRGAN model',
    modelPathExpectation: 'file',
    modelFileForChecksum: (value) => value,
    expectedFileName: 'RealESRGAN_x4plus.pth',
    expectedExtensions: ['.pth'],
  },
  rembg: {
    toolId: 'rembg',
    modelFlag: '--rembg-model',
    modelField: 'rembgModelLocalPath',
    modelLabel: 'rembg ONNX model',
    modelPathExpectation: 'file',
    modelFileForChecksum: (value) => value,
    expectedExtensions: ['.onnx'],
  },
  transparent_background: {
    toolId: 'transparent_background',
    modelFlag: '--transparent-background-checkpoint',
    modelField: 'transparentBackgroundCheckpointLocalPath',
    modelLabel: 'transparent-background checkpoint',
    modelPathExpectation: 'file',
    modelFileForChecksum: (value) => value,
    expectedExtensions: ['.pth'],
  },
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function requiredStringArg(flag: string): string {
  const value = stringArg(flag)
  if (!value) throw new Error(`${flag} is required`)
  return value
}

function assertLocalPath(label: string, value: string): void {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    throw new Error(`${label} must be a private local path, not a URL or URI`)
  }
  if (value.includes('\0')) throw new Error(`${label} must not contain null bytes`)
  if (value.split(/[\\/]+/).includes('..')) {
    throw new Error(`${label} must not contain path traversal segments`)
  }
}

function isLocalArtifactPath(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return normalized === '.local-artifacts' ||
    normalized.startsWith(`.local-artifacts${path.sep}`)
}

function assertLocalArtifactPath(label: string, value: string): void {
  assertLocalPath(label, value)
  if (!isLocalArtifactPath(value)) {
    throw new Error(`${label} must stay under .local-artifacts/`)
  }
}

function assertModelWeightManifestId(value: string): void {
  if (
    !/^[a-z0-9][a-z0-9_.:-]{2,127}$/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('\0') ||
    value.split(/[\\/]+/).includes('..')
  ) {
    throw new Error('--model-weight-manifest-id must be a reviewed private manifest id')
  }
}

function assertPrivateChecksumEvidenceRef(value: string): void {
  if (
    !value.startsWith('private://') ||
    /^https?:\/\//i.test(value) ||
    value.startsWith('public://') ||
    value.includes('\0') ||
    value.split(/[\\/]+/).includes('..')
  ) {
    throw new Error('--model-weight-checksum-evidence-ref must be a reviewed private:// checksum evidence ref')
  }
}

function sha256File(filePath: string): string {
  let fd: number | null = null
  try {
    fd = openSync(filePath, 'r')
    const hash = createHash('sha256')
    const buffer = Buffer.alloc(1024 * 1024)
    while (true) {
      const bytesRead = readSync(fd, buffer, 0, buffer.length, null)
      if (bytesRead === 0) break
      hash.update(buffer.subarray(0, bytesRead))
    }
    return hash.digest('hex')
  } finally {
    if (fd !== null) closeSync(fd)
  }
}

function readBytes(filePath: string, byteLength: number, position = 0): Buffer {
  let fd: number | null = null
  try {
    fd = openSync(filePath, 'r')
    const buffer = Buffer.alloc(byteLength)
    const bytesRead = readSync(fd, buffer, 0, byteLength, position)
    return buffer.subarray(0, bytesRead)
  } finally {
    if (fd !== null) closeSync(fd)
  }
}

function hasReadableSafetensorsHeader(filePath: string): boolean {
  const prefix = readBytes(filePath, 8)
  if (prefix.length !== 8) return false
  const headerLength = Number(prefix.readBigUInt64LE(0))
  if (
    !Number.isSafeInteger(headerLength) ||
    headerLength <= 0 ||
    headerLength > maximumSafetensorsHeaderBytes
  ) {
    return false
  }
  const headerBytes = readBytes(filePath, headerLength, 8)
  if (headerBytes.length !== headerLength) return false
  try {
    const header = JSON.parse(headerBytes.toString('utf8')) as unknown
    return Boolean(header && typeof header === 'object' && !Array.isArray(header))
  } catch {
    return false
  }
}

function assertModelPathContract(contract: ModelRuntimePathContract, modelPath: string): string {
  assertLocalPath(contract.modelLabel, modelPath)
  if (!existsSync(modelPath)) {
    throw new Error(`${contract.modelLabel} path does not exist: ${modelPath}`)
  }
  const stats = statSync(modelPath)
  if (contract.modelPathExpectation === 'file' && !stats.isFile()) {
    throw new Error(`${contract.modelLabel} must be a file`)
  }
  if (contract.modelPathExpectation === 'birefnet_model_directory' && !stats.isDirectory()) {
    throw new Error(`${contract.modelLabel} path must be a directory containing model.safetensors`)
  }
  const modelFile = contract.modelFileForChecksum(modelPath)
  if (!existsSync(modelFile) || !statSync(modelFile).isFile()) {
    throw new Error(`${contract.modelLabel} checksum file does not exist: ${modelFile}`)
  }
  const fileName = path.basename(modelFile)
  if (contract.expectedFileName && fileName !== contract.expectedFileName) {
    throw new Error(`${contract.modelLabel} filename must be ${contract.expectedFileName}`)
  }
  if (
    contract.expectedExtensions &&
    !contract.expectedExtensions.includes(path.extname(modelFile).toLowerCase())
  ) {
    throw new Error(`${contract.modelLabel} extension must be one of ${contract.expectedExtensions.join(', ')}`)
  }
  const sizeBytes = statSync(modelFile).size
  if (sizeBytes < minimumPrivateModelFileBytes) {
    throw new Error(`${contract.modelLabel} must be at least ${minimumPrivateModelFileBytes} bytes`)
  }
  if (contract.requiresSafetensorsHeader && !hasReadableSafetensorsHeader(modelFile)) {
    throw new Error(`${contract.modelLabel} must contain a readable safetensors header`)
  }
  return modelFile
}

function capabilityForTool(toolId: ModelWeightToolId): string {
  if (toolId === 'sam2') return 'subject_segmentation'
  if (toolId === 'real_esrgan') return 'upscaling'
  return 'background_removal'
}

function manifestRecordForTool(input: {
  toolId: ModelWeightToolId
  sourceImage: string
  outputDirectory: string
  modelPath: string
  modelWeightManifestId: string
  modelWeightChecksumSha256: string
  modelWeightChecksumEvidenceRef: string
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  privateInputPreflightOnly: boolean
}): Record<string, unknown> {
  const contract = modelRuntimePathContracts[input.toolId]
  const record: Record<string, unknown> = {
    outputDirectory: input.outputDirectory,
    sourceImageLocalPath: input.sourceImage,
    [contract.modelField]: input.modelPath,
    modelWeightManifestId: input.modelWeightManifestId,
    modelWeightChecksumSha256: input.modelWeightChecksumSha256,
    modelWeightChecksumEvidenceRef: input.modelWeightChecksumEvidenceRef,
  }
  if (input.runtimeContainerImage) record.runtimeContainerImage = input.runtimeContainerImage
  if (input.runtimeContainerPlatform) record.runtimeContainerPlatform = input.runtimeContainerPlatform
  if (input.privateInputPreflightOnly) {
    record.privateInputPreflightOnly = true
    record.localRuntimeInputPreflightOnly = true
  }
  return record
}

function main(): void {
  const toolId = requiredStringArg('--tool')
  if (!modelWeightTools.includes(toolId as ModelWeightToolId)) {
    throw new Error(`--tool must be one of ${modelWeightTools.join(', ')}`)
  }
  const typedToolId = toolId as ModelWeightToolId
  const contract = modelRuntimePathContracts[typedToolId]
  const sourceImage = requiredStringArg('--source-image')
  const modelPath = requiredStringArg(contract.modelFlag)
  const outputDirectory = requiredStringArg('--output-dir')
  const manifestOut = requiredStringArg('--manifest-out')
  const manifestId =
    stringArg('--model-weight-manifest-id') ??
    `${typedToolId}_private_manifest_review_v1`
  const checksumEvidenceRef =
    stringArg('--model-weight-checksum-evidence-ref') ??
    `private://reeditpro/ai-graphics/checksum-evidence/${typedToolId}.json`
  const runtimeContainerImage =
    stringArg('--runtime-container-image') ?? canonicalGpuModelRuntimeContainerImage
  const runtimeContainerPlatform = stringArg('--runtime-container-platform') ?? 'linux/amd64'
  const force = hasFlag('--force')
  const privateInputPreflightOnly = hasFlag('--private-input-preflight-only')

  assertLocalPath('sourceImageLocalPath', sourceImage)
  if (!existsSync(sourceImage) || !statSync(sourceImage).isFile()) {
    throw new Error('--source-image must point to a readable private local file')
  }
  assertLocalArtifactPath('outputDirectory', outputDirectory)
  assertLocalArtifactPath('manifestOut', manifestOut)
  assertModelWeightManifestId(manifestId)
  assertPrivateChecksumEvidenceRef(checksumEvidenceRef)
  const checksumFile = assertModelPathContract(contract, modelPath)
  const modelWeightChecksumSha256 = sha256File(checksumFile)

  if (existsSync(manifestOut) && !force) {
    throw new Error(`Refusing to overwrite existing manifest without --force: ${manifestOut}`)
  }
  mkdirSync(path.dirname(manifestOut), { recursive: true })
  mkdirSync(outputDirectory, { recursive: true })

  const manifest = {
    toolInputs: {
      [typedToolId]: manifestRecordForTool({
        toolId: typedToolId,
        sourceImage,
        outputDirectory,
        modelPath,
        modelWeightManifestId: manifestId,
        modelWeightChecksumSha256,
        modelWeightChecksumEvidenceRef: checksumEvidenceRef,
        runtimeContainerImage,
        runtimeContainerPlatform,
        privateInputPreflightOnly,
      }),
    },
  }
  writeFileSync(manifestOut, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    ok: true,
    decision,
    status: 'runtime_input_manifest_ready_for_scoped_private_execution',
    toolId: typedToolId,
    capabilityId: capabilityForTool(typedToolId),
    manifestOut,
    outputDirectory,
    modelWeightManifestId: manifestId,
    modelWeightChecksumSha256,
    modelWeightChecksumEvidenceRef: checksumEvidenceRef,
    checksumFileLocalPath: checksumFile,
    runtimeContainerImage,
    runtimeContainerPlatform,
    manifestTopLevelFields: Object.keys(manifest),
    manifestToolRecordFields: Object.keys(manifest.toolInputs[typedToolId]),
    nextExactScopedToolCallCommand:
      `npm run --silent ai-graphics:external-agent-tool-call -- --tool ${typedToolId} ` +
      '--attempt-gpu-runtime --runtime-backend docker_container ' +
      `--runtime-input-manifest ${manifestOut}`,
    nextExactHarnessCommand:
      'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- ' +
      `--attempt-local-runtime --tool ${typedToolId} --runtime-input-manifest ${manifestOut} ` +
      `--result-out ${outputDirectory}/harness-result.json`,
    booleans: {
      localOnly: true,
      runtimeInputManifestWritten: true,
      checksumComputedFromPrivateModelFile: true,
      agentCanExecuteAfterNativeRuntimeProof: true,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelInferencePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }, null, 2))
}

try {
  main()
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    status: 'runtime_input_manifest_blocked_with_reason',
    errorMessage: error instanceof Error ? error.message : String(error),
    booleans: {
      localOnly: true,
      runtimeInputManifestWritten: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelInferencePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }, null, 2))
  process.exit(2)
}
