import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_GPU_RUNTIME_PROOF_RESULT_DECISION =
  'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results'

export type AiGraphicsGpuRuntimeProofProfileId =
  | 'gpu_worker_ai_graphics'
  | 'sam2'
  | 'birefnet'
  | 'real_esrgan'

export type AiGraphicsGpuRuntimeProofAggregateStatus =
  | 'missing_native_gpu_runtime_proof_results'
  | 'invalid_native_gpu_runtime_proof_results'
  | 'ready_for_owner_review_not_beta_ready'

export interface AiGraphicsGpuRuntimeProofResultValidation {
  profileId: AiGraphicsGpuRuntimeProofProfileId
  resultProvided: boolean
  acceptedForOwnerReview: boolean
  proofMetadataAccepted: boolean
  requiredImportsPresent: boolean
  nvidiaSmiAccepted: boolean
  cudaAccepted: boolean
  modelManifestChecksAccepted: boolean
  rawPrivateRefsNotLogged: boolean
  runtimeSideEffectsBlocked: boolean
  errors: string[]
  warnings: string[]
}

export interface AiGraphicsGpuRuntimeProofResultPacket {
  decision: typeof AI_GRAPHICS_GPU_RUNTIME_PROOF_RESULT_DECISION
  status: AiGraphicsGpuRuntimeProofAggregateStatus
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  runtimeProfilesRequired: AiGraphicsGpuRuntimeProofProfileId[]
  runtimeProofResultsProvided: number
  runtimeProofResultsAcceptedForOwnerReview: number
  nativeGpuRuntimeProofResultsAccepted: boolean
  validationResults: AiGraphicsGpuRuntimeProofResultValidation[]
  blockers: string[]
  booleans: {
    gpuRuntimeProofResultValidatorPrepared: true
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightManifestToolsCovered: true
    all4RuntimeProfilesCovered: true
    privateArtifactRefsNotLogged: true
    nativeGpuRuntimeProofResultsAcceptedForOwnerReview: boolean
    ownerReviewStillRequired: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const gpuRuntimeTargetedTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

const runtimeProfilesRequired = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
] as const satisfies readonly AiGraphicsGpuRuntimeProofProfileId[]

export function listAiGraphicsGpuRuntimeProofRequiredProfiles(): readonly AiGraphicsGpuRuntimeProofProfileId[] {
  return [...runtimeProfilesRequired]
}

const requiredImportsByProfile = {
  gpu_worker_ai_graphics: [
    'torch',
    'torchvision',
    'transformers',
    'kornia',
    'rembg',
    'transparent_background',
    'realesrgan',
    'sam2',
  ],
  sam2: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'hydra',
    'iopath',
    'sam2',
  ],
  birefnet: [
    'torch',
    'torchvision',
    'transformers',
    'safetensors',
    'PIL',
    'cv2',
    'numpy',
    'timm',
    'kornia',
    'einops',
    'scipy',
    'skimage',
  ],
  real_esrgan: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'basicsr',
    'realesrgan',
  ],
} as const satisfies Record<AiGraphicsGpuRuntimeProofProfileId, readonly string[]>

const requiredManifestToolsByProfile = {
  gpu_worker_ai_graphics: modelWeightManifestRequiredTools,
  sam2: ['sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['real_esrgan'],
} as const satisfies Record<AiGraphicsGpuRuntimeProofProfileId, readonly AiGraphicsModelWeightManifestToolId[]>

const templateIdByManifestTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const falseRuntimeFields = [
  'modelWeightsLoaded',
  'mediaProcessed',
  'providerRuntimeUsed',
  'toolRouteExecutionReadyNow',
  'workerExecutionReadyNow',
  'runtimeBetaReadyNow',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

const sha256Pattern = /^[a-fA-F0-9]{64}$/
const requiredProbeName = 'reeditpro_ai_graphics_gpu_runtime_readiness'
const requiredProbeVersion = '2026-06-26.native-gpu-proof-v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function parseCapability(value: unknown): [number, number] | null {
  const raw = stringValue(value)
  if (!raw) return null
  const match = /^(\d+)\.(\d+)$/.exec(raw.trim())
  if (!match) return null
  return [Number(match[1]), Number(match[2])]
}

function capabilityMeetsMinimum(value: unknown, minimum: [number, number]): boolean {
  const parsed = parseCapability(value)
  if (!parsed) return false
  return parsed[0] > minimum[0] || (parsed[0] === minimum[0] && parsed[1] >= minimum[1])
}

function detectForbiddenRawReferences(value: unknown, path = '$'): string[] {
  const failures: string[] = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      failures.push(...detectForbiddenRawReferences(entry, `${path}[${index}]`))
    })
    return failures
  }
  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'privateArtifactRef') {
        failures.push(`${path}.${key}`)
      }
      failures.push(...detectForbiddenRawReferences(entry, `${path}.${key}`))
    }
    return failures
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (
      lower.includes('private://') ||
      lower.includes('gs://') ||
      lower.includes('http://') ||
      lower.includes('https://') ||
      lower.includes('x-goog-signature=') ||
      lower.includes('x-amz-signature=') ||
      lower.includes('signature=')
    ) {
      failures.push(path)
    }
  }
  return failures
}

function profileFromInput(input: unknown): AiGraphicsGpuRuntimeProofProfileId | null {
  if (!isRecord(input)) return null
  const profile = stringValue(input.profile)
  return runtimeProfilesRequired.includes(profile as AiGraphicsGpuRuntimeProofProfileId)
    ? profile as AiGraphicsGpuRuntimeProofProfileId
    : null
}

function validateProofMetadata(input: unknown, errors: string[]): boolean {
  if (!isRecord(input) || !isRecord(input.proofMetadata)) {
    errors.push('proofMetadata from the approved GPU runtime readiness probe is required.')
    return false
  }

  const metadata = input.proofMetadata
  let accepted = true
  if (metadata.probeName !== requiredProbeName) {
    errors.push(`proofMetadata.probeName must be ${requiredProbeName}.`)
    accepted = false
  }
  if (metadata.probeVersion !== requiredProbeVersion) {
    errors.push(`proofMetadata.probeVersion must be ${requiredProbeVersion}.`)
    accepted = false
  }
  if (metadata.runtimePlatform !== 'linux') {
    errors.push('proofMetadata.runtimePlatform must be linux.')
    accepted = false
  }
  if (!['x86_64', 'amd64'].includes(String(metadata.runtimeMachine ?? '').toLowerCase())) {
    errors.push('proofMetadata.runtimeMachine must be x86_64 or amd64.')
    accepted = false
  }
  if (metadata.nativeGpuRuntimeProof !== true) {
    errors.push('proofMetadata.nativeGpuRuntimeProof must be true.')
    accepted = false
  }

  for (const field of [
    'modelWeightsLoaded',
    'modelInferencePerformed',
    'mediaProcessingPerformed',
    'providerRuntimePerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (metadata[field] !== false) {
      errors.push(`proofMetadata.${field} must be false.`)
      accepted = false
    }
  }

  return accepted
}

function importLabels(input: unknown): Set<string> {
  if (!isRecord(input) || !Array.isArray(input.imports)) return new Set()
  return new Set(input.imports.flatMap((entry) => {
    if (!isRecord(entry)) return []
    const label = stringValue(entry.label)
    const moduleName = stringValue(entry.module)
    return [label, moduleName].filter((value): value is string => Boolean(value))
  }))
}

function validateModelManifestChecks(
  profileId: AiGraphicsGpuRuntimeProofProfileId,
  input: unknown,
  errors: string[],
): boolean {
  if (!isRecord(input) || !Array.isArray(input.modelManifestChecks)) {
    errors.push('modelManifestChecks must be an array.')
    return false
  }

  const checks = input.modelManifestChecks.filter(isRecord)
  const checksByTool = new Map(checks.map((check) => [stringValue(check.toolId), check]))
  let accepted = true

  for (const toolId of requiredManifestToolsByProfile[profileId]) {
    const check = checksByTool.get(toolId)
    if (!check) {
      errors.push(`Missing model manifest check for ${toolId}.`)
      accepted = false
      continue
    }
    if (check.status !== 'validated_not_loaded') {
      errors.push(`${toolId} model manifest check must have status validated_not_loaded.`)
      accepted = false
    }
    if (check.templateId !== templateIdByManifestTool[toolId]) {
      errors.push(`${toolId} model manifest check templateId mismatch.`)
      accepted = false
    }
    if (check.privateArtifactRefStatus !== 'present_private_ref_not_logged') {
      errors.push(`${toolId} model manifest check must report present_private_ref_not_logged.`)
      accepted = false
    }
    if (!sha256Pattern.test(String(check.checksumSha256 ?? ''))) {
      errors.push(`${toolId} model manifest check checksumSha256 must be a 64-character hex digest.`)
      accepted = false
    }
  }

  return accepted
}

function validateProofResult(
  profileId: AiGraphicsGpuRuntimeProofProfileId,
  input: unknown | undefined,
): AiGraphicsGpuRuntimeProofResultValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (input === undefined) {
    return {
      profileId,
      resultProvided: false,
      acceptedForOwnerReview: false,
      proofMetadataAccepted: false,
      requiredImportsPresent: false,
      nvidiaSmiAccepted: false,
      cudaAccepted: false,
      modelManifestChecksAccepted: false,
      rawPrivateRefsNotLogged: true,
      runtimeSideEffectsBlocked: false,
      errors: ['Native GPU runtime proof result was not provided.'],
      warnings,
    }
  }

  if (!isRecord(input)) {
    errors.push('Proof result must be a JSON object.')
  } else {
    const rawProfile = stringValue(input.profile)
    if (rawProfile !== profileId) {
      errors.push(`Proof result profile must be ${profileId}, got ${rawProfile ?? 'missing'}.`)
    }
    if (input.status !== 'passed') {
      errors.push('Proof result status must be passed.')
    }
  }

  const rawReferenceFailures = detectForbiddenRawReferences(input)
  if (rawReferenceFailures.length) {
    errors.push(`Proof result must not include raw private/public/signed artifact references: ${rawReferenceFailures.join(', ')}`)
  }

  const proofMetadataAccepted = validateProofMetadata(input, errors)
  const labels = importLabels(input)
  const missingImports = requiredImportsByProfile[profileId].filter((label) => !labels.has(label))
  if (missingImports.length) {
    errors.push(`Missing required imports for ${profileId}: ${missingImports.join(', ')}.`)
  }

  const nvidiaSmi = isRecord(input) ? input.nvidiaSmi : undefined
  const nvidiaSmiAccepted = isRecord(nvidiaSmi) && nvidiaSmi.available === true
  if (!nvidiaSmiAccepted) {
    errors.push('nvidiaSmi.available must be true.')
  }

  const cuda = isRecord(input) ? input.cuda : undefined
  const deviceCount = isRecord(cuda) ? numberValue(cuda.deviceCount) : null
  const cudaAccepted = isRecord(cuda) &&
    cuda.available === true &&
    typeof deviceCount === 'number' &&
    deviceCount >= 1 &&
    cuda.tinyTensorProbePassed === true &&
    capabilityMeetsMinimum(cuda.capability, [8, 9])
  if (!cudaAccepted) {
    errors.push('CUDA proof must include available=true, deviceCount>=1, capability>=8.9, and tinyTensorProbePassed=true.')
  }

  const modelManifestChecksAccepted = validateModelManifestChecks(profileId, input, errors)

  let runtimeSideEffectsBlocked = true
  if (isRecord(input)) {
    for (const field of falseRuntimeFields) {
      if (booleanValue(input[field]) !== false) {
        errors.push(`${field} must be false.`)
        runtimeSideEffectsBlocked = false
      }
    }
  } else {
    runtimeSideEffectsBlocked = false
  }

  return {
    profileId,
    resultProvided: true,
    acceptedForOwnerReview: errors.length === 0,
    proofMetadataAccepted,
    requiredImportsPresent: missingImports.length === 0,
    nvidiaSmiAccepted,
    cudaAccepted,
    modelManifestChecksAccepted,
    rawPrivateRefsNotLogged: rawReferenceFailures.length === 0,
    runtimeSideEffectsBlocked,
    errors,
    warnings,
  }
}

function dedupeProofResults(
  results: readonly unknown[],
): Partial<Record<AiGraphicsGpuRuntimeProofProfileId, unknown>> {
  const byProfile: Partial<Record<AiGraphicsGpuRuntimeProofProfileId, unknown>> = {}
  for (const result of results) {
    const profile = profileFromInput(result)
    if (profile && byProfile[profile] === undefined) {
      byProfile[profile] = result
    }
  }
  return byProfile
}

export function buildAiGraphicsGpuRuntimeProofResultPacket(
  proofResults: readonly unknown[] = [],
): AiGraphicsGpuRuntimeProofResultPacket {
  const byProfile = dedupeProofResults(proofResults)
  const validationResults = runtimeProfilesRequired.map((profileId) => (
    validateProofResult(profileId, byProfile[profileId])
  ))
  const runtimeProofResultsProvided = validationResults.filter((result) => result.resultProvided).length
  const runtimeProofResultsAcceptedForOwnerReview = validationResults.filter((result) => result.acceptedForOwnerReview).length
  const nativeGpuRuntimeProofResultsAccepted =
    runtimeProofResultsProvided === runtimeProfilesRequired.length &&
    runtimeProofResultsAcceptedForOwnerReview === runtimeProfilesRequired.length

  const status: AiGraphicsGpuRuntimeProofAggregateStatus = runtimeProofResultsProvided === 0
    ? 'missing_native_gpu_runtime_proof_results'
    : nativeGpuRuntimeProofResultsAccepted
      ? 'ready_for_owner_review_not_beta_ready'
      : 'invalid_native_gpu_runtime_proof_results'

  const blockers = [
    status === 'missing_native_gpu_runtime_proof_results'
      ? 'Native linux/amd64 NVIDIA L4 proof results have not been provided for the four required GPU runtime profiles.'
      : undefined,
    status === 'invalid_native_gpu_runtime_proof_results'
      ? 'One or more native GPU runtime proof results failed profile, CUDA, import, model-manifest, redaction, or false-gate validation.'
      : undefined,
    'Owner review, Tool Route, Worker, provider/model, artifact, beta, and production gates remain blocked even if native proof results are accepted.',
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_GPU_RUNTIME_PROOF_RESULT_DECISION,
    status,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    runtimeProfilesRequired: [...runtimeProfilesRequired],
    runtimeProofResultsProvided,
    runtimeProofResultsAcceptedForOwnerReview,
    nativeGpuRuntimeProofResultsAccepted,
    validationResults,
    blockers,
    booleans: {
      gpuRuntimeProofResultValidatorPrepared: true,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightManifestToolsCovered: true,
      all4RuntimeProfilesCovered: true,
      privateArtifactRefsNotLogged: true,
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: nativeGpuRuntimeProofResultsAccepted,
      ownerReviewStillRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
