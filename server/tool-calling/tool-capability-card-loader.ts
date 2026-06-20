import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import {
  getProductionToolProfile,
  isProductionToolId,
  listProductionToolProfiles,
} from '../tool-registry'
import type {
  ProductionToolId,
  ProductionToolProfile,
} from '../tool-registry'
import {
  getOperationDefinition,
  listOperationDefinitions,
} from './operation-ontology'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import {
  resolveRuntimeToolId,
} from './tool-runtime-id-aliases'
import type {
  ExpandedToolCapabilityCard,
  PendingExternalToolCapabilityCard,
  ToolCapabilitySourceEvidence,
  ToolCapabilityCard,
  ToolCapabilityStudyCard,
  ToolCapabilityStudyOperation,
  ToolRuntimeResolution,
} from './tool-capability-card-types'

export const TOOL_CAPABILITY_STUDY_CARD_SCHEMA = 'reeditpro.toolCapabilityStudyCard.v1'

export const OPERATION_TOOL_SEEDS: Record<ToolCallingOperationId, readonly ProductionToolId[]> = {
  'media.inspect': ['ffprobe', 'ffmpeg', 'pyav', 'opencv'],
  'media.proxy.create': ['ffmpeg', 'pyav', 'vapoursynth'],
  'media.audio.extract': ['ffmpeg', 'pyav'],
  'video.scene.detect': ['pyscenedetect', 'opencv', 'ffmpeg'],
  'video.frame.sample': ['pyav', 'opencv', 'ffmpeg', 'sharp'],
  'video.motion.score': ['opencv', 'pyscenedetect', 'vapoursynth'],
  'video.blur.score': ['opencv', 'sharp', 'kornia'],
  'video.safe_zone.detect': ['opencv', 'mediapipe', 'paddleocr', 'sharp'],
  'audio.transcribe': ['faster_whisper', 'whisper_cpp'],
  'audio.word_align': ['faster_whisper', 'whisper_cpp'],
  'audio.loudness.normalize': ['ffmpeg', 'rnnoise', 'signalsmith_stretch'],
  'audio.cleanup': ['deepfilternet', 'rnnoise', 'demucs', 'ffmpeg'],
  'caption.generate': ['faster_whisper', 'remotion', 'libass'],
  'caption.align': ['faster_whisper', 'libass', 'remotion'],
  'caption.style': ['remotion', 'libass', 'sharp'],
  'caption.burn_in': ['libass', 'remotion', 'ffmpeg'],
  'timeline.smart_cut': ['pyscenedetect', 'opentimelineio', 'hyperframe', 'opencv'],
  'timeline.validate': ['opentimelineio', 'hyperframe', 'remotion', 'ffprobe'],
  'timeline.to_otio': ['opentimelineio', 'hyperframe', 'remotion'],
  'render.preview': ['remotion', 'hyperframe', 'ffmpeg', 'pixijs', 'three_js'],
  'render.compose': ['remotion', 'ffmpeg', 'libass', 'pixijs', 'three_js', 'lottie'],
  'export.mux': ['ffmpeg', 'libass', 'vapoursynth'],
  'export.validate': ['ffprobe', 'ffmpeg', 'opentimelineio'],
  'mask.generate': ['birefnet', 'sam2', 'rembg', 'transparent_background', 'opencv'],
  'mask.refine': ['kornia', 'sam2', 'opencv', 'birefnet'],
  'background.remove': ['birefnet', 'sam2', 'rembg', 'transparent_background', 'opencv', 'kornia'],
  'video.enhance': ['real_esrgan', 'sharp', 'ffmpeg', 'vapoursynth'],
  'video.slow_motion': ['film', 'ffmpeg', 'vapoursynth'],
  'color.exposure.correct': ['opencolorio', 'ffmpeg', 'openimageio', 'opencv'],
  'color.shot_match': ['opencolorio', 'openimageio', 'opencv', 'ffmpeg'],
  'ocr.detect_text': ['paddleocr', 'opencv', 'playwright'],
  'thumbnail.generate': ['sharp', 'pyav', 'ffmpeg', 'opencv'],
  'qa.final_delivery': ['ffprobe', 'ffmpeg', 'opentimelineio', 'remotion', 'duckdb', 'polars'],
}

const STUDY_CARDS_DIRECTORY = new URL('../../docs/tool-calling/studies/', import.meta.url)

const actionOperationHints: ReadonlyArray<{
  actionNeedle: string
  operationId: ToolCallingOperationId
}> = [
  { actionNeedle: 'probe', operationId: 'media.inspect' },
  { actionNeedle: 'proxy', operationId: 'media.proxy.create' },
  { actionNeedle: 'audio_extract', operationId: 'media.audio.extract' },
  { actionNeedle: 'extract_audio', operationId: 'media.audio.extract' },
  { actionNeedle: 'detect_scenes', operationId: 'video.scene.detect' },
  { actionNeedle: 'sample_frames', operationId: 'video.frame.sample' },
  { actionNeedle: 'thumbnail', operationId: 'thumbnail.generate' },
  { actionNeedle: 'score_blur', operationId: 'video.blur.score' },
  { actionNeedle: 'safe_zone', operationId: 'video.safe_zone.detect' },
  { actionNeedle: 'transcribe', operationId: 'audio.transcribe' },
  { actionNeedle: 'align_words', operationId: 'audio.word_align' },
  { actionNeedle: 'loudness', operationId: 'audio.loudness.normalize' },
  { actionNeedle: 'denoise', operationId: 'audio.cleanup' },
  { actionNeedle: 'caption', operationId: 'caption.generate' },
  { actionNeedle: 'subtitle', operationId: 'caption.burn_in' },
  { actionNeedle: 'timeline', operationId: 'timeline.validate' },
  { actionNeedle: 'serialize_otio', operationId: 'timeline.to_otio' },
  { actionNeedle: 'render_preview', operationId: 'render.preview' },
  { actionNeedle: 'compose', operationId: 'render.compose' },
  { actionNeedle: 'mux', operationId: 'export.mux' },
  { actionNeedle: 'final_export', operationId: 'export.mux' },
  { actionNeedle: 'export_inspect', operationId: 'export.validate' },
  { actionNeedle: 'mask', operationId: 'mask.generate' },
  { actionNeedle: 'refine_mask', operationId: 'mask.refine' },
  { actionNeedle: 'background', operationId: 'background.remove' },
  { actionNeedle: 'upscale', operationId: 'video.enhance' },
  { actionNeedle: 'enhance', operationId: 'video.enhance' },
  { actionNeedle: 'slow_motion', operationId: 'video.slow_motion' },
  { actionNeedle: 'interpolate', operationId: 'video.slow_motion' },
  { actionNeedle: 'color', operationId: 'color.exposure.correct' },
  { actionNeedle: 'match_shots', operationId: 'color.shot_match' },
  { actionNeedle: 'ocr', operationId: 'ocr.detect_text' },
  { actionNeedle: 'quality', operationId: 'qa.final_delivery' },
]

const supportLevels = new Set(['primary', 'secondary', 'fallback', 'validator', 'future'])

function assertObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`)
  }
}

function readString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${context} must be a non-empty string.`)
  }

  return value
}

function readStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${context} must be an array of strings.`)
  }

  return [...new Set(value)].sort()
}

function readProductionToolIds(value: unknown, context: string): ProductionToolId[] {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) {
      throw new Error(`${context} contains non-production fallback tool ID: ${toolId}`)
    }

    return toolId
  })
}

function readOperationId(value: unknown, context: string): ToolCallingOperationId {
  const operationId = readString(value, context)
  const operation = getOperationDefinition(operationId)
  if (!operation) {
    throw new Error(`${context} is not a known tool-calling operation: ${operationId}`)
  }

  return operation.operationId as ToolCallingOperationId
}

function readStudyOperation(value: unknown, context: string): ToolCapabilityStudyOperation {
  assertObject(value, context)
  const supportLevel = readString(value.supportLevel, `${context}.supportLevel`)
  if (!supportLevels.has(supportLevel)) {
    throw new Error(`${context}.supportLevel is not supported: ${supportLevel}`)
  }

  return {
    operationId: readOperationId(value.operationId, `${context}.operationId`),
    supportLevel: supportLevel as ToolCapabilityStudyOperation['supportLevel'],
    bestFor: readStringArray(value.bestFor, `${context}.bestFor`),
    notFor: readStringArray(value.notFor, `${context}.notFor`),
    inputArtifacts: readStringArray(value.inputArtifacts, `${context}.inputArtifacts`) as ToolCallingArtifactType[],
    outputArtifacts: readStringArray(value.outputArtifacts, `${context}.outputArtifacts`) as ToolCallingArtifactType[],
    validators: readStringArray(value.validators, `${context}.validators`) as ToolCapabilityStudyOperation['validators'],
    fallbackToolIds: readProductionToolIds(value.fallbackToolIds, `${context}.fallbackToolIds`),
    notes: readStringArray(value.notes, `${context}.notes`),
  }
}

function readRuntimeResolution(value: unknown, context: string): ToolRuntimeResolution {
  assertObject(value, context)
  const status = readString(value.status, `${context}.status`)
  if (
    status !== 'first_class_production_tool_id' &&
    status !== 'alias_resolved_to_production_tool_id' &&
    status !== 'pending_production_tool_registry_expansion'
  ) {
    throw new Error(`${context}.status is not supported: ${status}`)
  }

  const runtimeToolId = typeof value.runtimeToolId === 'string' && isProductionToolId(value.runtimeToolId)
    ? value.runtimeToolId
    : undefined

  return {
    status: status as ToolRuntimeResolution['status'],
    runtimeToolId,
    externalToolId: typeof value.externalToolId === 'string' ? value.externalToolId : undefined,
    reason: readString(value.reason, `${context}.reason`),
  }
}

function readSourceEvidence(value: unknown, context: string): ToolCapabilitySourceEvidence[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array when provided.`)
  }

  return value.map((entry, index) => {
    assertObject(entry, `${context}[${index}]`)

    return {
      evidenceType: readString(entry.evidenceType, `${context}[${index}].evidenceType`),
      sourcePath: readString(entry.sourcePath, `${context}[${index}].sourcePath`),
      summary: readString(entry.summary, `${context}[${index}].summary`),
    }
  })
}

function readToolCapabilityStudyCard(value: unknown, fileName: string): ToolCapabilityStudyCard {
  assertObject(value, fileName)
  const toolId = typeof value.toolId === 'string' ? value.toolId : undefined
  const externalToolId = typeof value.externalToolId === 'string' ? value.externalToolId : undefined

  if (toolId && !isProductionToolId(toolId)) {
    throw new Error(`${fileName}.toolId is not a first-class ProductionToolId: ${toolId}`)
  }

  if (Boolean(toolId) === Boolean(externalToolId)) {
    throw new Error(`${fileName} must include exactly one of toolId or externalToolId.`)
  }

  const operations = Array.isArray(value.operations)
    ? value.operations.map((operation, index) => readStudyOperation(operation, `${fileName}.operations[${index}]`))
    : []

  if (operations.length === 0) {
    throw new Error(`${fileName}.operations must include at least one operation.`)
  }

  return {
    schema: readString(value.schema, `${fileName}.schema`),
    toolId: toolId as ProductionToolId | undefined,
    externalToolId,
    displayName: readString(value.displayName, `${fileName}.displayName`),
    aliases: readStringArray(value.aliases, `${fileName}.aliases`),
    runtimeResolution: readRuntimeResolution(value.runtimeResolution, `${fileName}.runtimeResolution`),
    operations,
    bestFor: readStringArray(value.bestFor, `${fileName}.bestFor`),
    notFor: readStringArray(value.notFor, `${fileName}.notFor`),
    inputArtifacts: readStringArray(value.inputArtifacts, `${fileName}.inputArtifacts`) as ToolCallingArtifactType[],
    outputArtifacts: readStringArray(value.outputArtifacts, `${fileName}.outputArtifacts`) as ToolCallingArtifactType[],
    validators: readStringArray(value.validators, `${fileName}.validators`) as ToolCapabilityStudyCard['validators'],
    fallbackToolIds: readProductionToolIds(value.fallbackToolIds, `${fileName}.fallbackToolIds`),
    resourceProfile: readResourceProfile(value.resourceProfile, `${fileName}.resourceProfile`),
    qualityProfile: readQualityProfile(value.qualityProfile, `${fileName}.qualityProfile`),
    knownFailureModes: readStringArray(value.knownFailureModes, `${fileName}.knownFailureModes`),
    professionalEditingUses: readStringArray(value.professionalEditingUses, `${fileName}.professionalEditingUses`),
    readinessNotes: readStringArray(value.readinessNotes, `${fileName}.readinessNotes`),
    benchmarkPlaceholders: readStringArray(value.benchmarkPlaceholders, `${fileName}.benchmarkPlaceholders`),
    telemetryPlaceholders: readStringArray(value.telemetryPlaceholders, `${fileName}.telemetryPlaceholders`),
    sourceEvidence: readSourceEvidence(value.sourceEvidence, `${fileName}.sourceEvidence`),
  }
}

function readResourceProfile(
  value: unknown,
  context: string,
): ToolCapabilityStudyCard['resourceProfile'] {
  assertObject(value, context)

  return {
    workerType: readString(value.workerType, `${context}.workerType`) as ToolCapabilityStudyCard['resourceProfile']['workerType'],
    gpuRequired: Boolean(value.gpuRequired),
    cpuAllowed: Boolean(value.cpuAllowed),
    executionMode: readString(value.executionMode, `${context}.executionMode`),
  }
}

function readQualityProfile(
  value: unknown,
  context: string,
): ToolCapabilityStudyCard['qualityProfile'] {
  assertObject(value, context)

  return {
    productionStatus: readString(value.productionStatus, `${context}.productionStatus`) as ToolCapabilityStudyCard['qualityProfile']['productionStatus'],
    adoptionStage: readString(value.adoptionStage, `${context}.adoptionStage`) as ToolCapabilityStudyCard['qualityProfile']['adoptionStage'],
    launchCore: Boolean(value.launchCore),
    modelWeightsRequired: Boolean(value.modelWeightsRequired),
    licenseRisk: readString(value.licenseRisk, `${context}.licenseRisk`),
    commercialUseStatus: readString(value.commercialUseStatus, `${context}.commercialUseStatus`),
  }
}

function inferOperationsFromProfile(profile: ProductionToolProfile): ToolCallingOperationId[] {
  const operationIds = new Set<ToolCallingOperationId>()
  const actionText = profile.supportedActions.join(' ').toLowerCase()

  for (const operation of listOperationDefinitions()) {
    const operationId = operation.operationId as ToolCallingOperationId
    if (OPERATION_TOOL_SEEDS[operationId].includes(profile.toolId)) {
      operationIds.add(operationId)
    }
  }

  for (const hint of actionOperationHints) {
    const matchesHint = profile.supportedActions.some((action) => {
      const normalizedAction = action.toLowerCase()
      if (hint.actionNeedle === 'extract_audio' || hint.actionNeedle === 'audio_extract') {
        return normalizedAction === hint.actionNeedle
      }
      return normalizedAction.includes(hint.actionNeedle)
    })

    if (matchesHint || actionText.includes(` ${hint.actionNeedle} `)) {
      operationIds.add(hint.operationId)
    }
  }

  if (profile.outputTypes.some((outputType) => outputType === 'final_export')) {
    operationIds.add('export.mux')
    operationIds.add('export.validate')
  }

  if (profile.qaResponsibilities.includes('final_delivery')) {
    operationIds.add('qa.final_delivery')
  }

  return [...operationIds].sort()
}

function buildGeneratedToolCapabilityCard(profile: ProductionToolProfile): ToolCapabilityCard {
  return {
    toolId: profile.toolId,
    displayName: profile.displayName,
    aliases: resolveRuntimeToolId(profile.toolId).aliases,
    runtimeResolution: {
      status: 'first_class_production_tool_id',
      runtimeToolId: profile.toolId,
      reason: 'Generated from canonical server/tool-registry ProductionToolProfile.',
    },
    capabilitySource: 'generated_registry_profile',
    selectableAsRuntimeTool: true,
    operations: inferOperationsFromProfile(profile),
    bestFor: profile.bestFor,
    notFor: profile.notBestFor,
    inputArtifacts: profile.requiredArtifacts,
    outputArtifacts: profile.producedArtifacts,
    validators: profile.qaResponsibilities,
    fallbackToolIds: profile.fallbackToolIds,
    resourceProfile: {
      workerType: profile.workerType,
      gpuRequired: profile.gpuRequired,
      cpuAllowed: profile.cpuAllowed,
      executionMode: profile.executionMode,
    },
    qualityProfile: {
      productionStatus: profile.productionStatus,
      adoptionStage: profile.adoptionStage,
      launchCore: profile.launchCore,
      modelWeightsRequired: profile.modelWeightsRequired,
      licenseRisk: profile.licenseRisk,
      commercialUseStatus: profile.commercialUseStatus,
    },
    readinessNotes: profile.productionReadinessNotes,
    benchmarkPlaceholders: [
      `benchmark:${profile.toolId}:latency_pending`,
      `benchmark:${profile.toolId}:quality_pending`,
      `benchmark:${profile.toolId}:cost_pending`,
    ],
    telemetryPlaceholders: [
      `telemetry:${profile.toolId}:selection_count`,
      `telemetry:${profile.toolId}:fallback_count`,
      `telemetry:${profile.toolId}:qa_gate_outcomes`,
    ],
  }
}

function buildExplicitRuntimeCard(
  studyCard: ToolCapabilityStudyCard,
  generatedCard: ToolCapabilityCard,
): ToolCapabilityCard {
  return {
    ...generatedCard,
    displayName: studyCard.displayName,
    aliases: studyCard.aliases,
    runtimeResolution: {
      status: 'first_class_production_tool_id',
      runtimeToolId: generatedCard.toolId,
      reason: studyCard.runtimeResolution.reason,
    },
    operationMetadata: studyCard.operations,
    capabilitySource: 'explicit_study_card',
    selectableAsRuntimeTool: true,
    operations: studyCard.operations.map((operation) => operation.operationId).sort(),
    bestFor: studyCard.bestFor,
    notFor: studyCard.notFor,
    inputArtifacts: studyCard.inputArtifacts,
    outputArtifacts: studyCard.outputArtifacts,
    validators: studyCard.validators,
    fallbackToolIds: studyCard.fallbackToolIds,
    knownFailureModes: studyCard.knownFailureModes,
    professionalEditingUses: studyCard.professionalEditingUses,
    readinessNotes: studyCard.readinessNotes,
    benchmarkPlaceholders: studyCard.benchmarkPlaceholders,
    telemetryPlaceholders: studyCard.telemetryPlaceholders,
    sourceEvidence: studyCard.sourceEvidence,
  }
}

function buildPendingExternalCard(studyCard: ToolCapabilityStudyCard): PendingExternalToolCapabilityCard {
  const externalToolId = studyCard.externalToolId ?? studyCard.runtimeResolution.externalToolId ?? studyCard.displayName

  return {
    externalToolId,
    displayName: studyCard.displayName,
    aliases: studyCard.aliases,
    runtimeResolution: {
      status: 'pending_production_tool_registry_expansion',
      externalToolId,
      reason: studyCard.runtimeResolution.reason,
    },
    operationMetadata: studyCard.operations,
    capabilitySource: 'explicit_study_card_pending_external',
    selectableAsRuntimeTool: false,
    operations: studyCard.operations.map((operation) => operation.operationId).sort(),
    bestFor: studyCard.bestFor,
    notFor: studyCard.notFor,
    inputArtifacts: studyCard.inputArtifacts,
    outputArtifacts: studyCard.outputArtifacts,
    validators: studyCard.validators,
    fallbackToolIds: studyCard.fallbackToolIds,
    resourceProfile: studyCard.resourceProfile,
    qualityProfile: studyCard.qualityProfile,
    knownFailureModes: studyCard.knownFailureModes,
    professionalEditingUses: studyCard.professionalEditingUses,
    readinessNotes: studyCard.readinessNotes,
    benchmarkPlaceholders: studyCard.benchmarkPlaceholders,
    telemetryPlaceholders: studyCard.telemetryPlaceholders,
    sourceEvidence: studyCard.sourceEvidence,
  }
}

function cardSortKey(card: ExpandedToolCapabilityCard): string {
  return 'toolId' in card ? card.toolId : card.externalToolId
}

export function listExplicitToolStudyCards(): ToolCapabilityStudyCard[] {
  if (!existsSync(STUDY_CARDS_DIRECTORY)) {
    return []
  }

  return readdirSync(STUDY_CARDS_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => {
      const fileUrl = new URL(fileName, STUDY_CARDS_DIRECTORY)
      const parsed = JSON.parse(readFileSync(fileUrl, 'utf8')) as unknown
      return readToolCapabilityStudyCard(parsed, fileName)
    })
}

export function listGeneratedToolCapabilityCards(): ToolCapabilityCard[] {
  return listProductionToolProfiles().map(buildGeneratedToolCapabilityCard)
}

export function listExpandedToolCapabilityCards(): ExpandedToolCapabilityCard[] {
  const generatedCardsByToolId = new Map<ProductionToolId, ToolCapabilityCard>(
    listGeneratedToolCapabilityCards().map((card) => [card.toolId, card]),
  )
  const explicitRuntimeCards = new Map<ProductionToolId, ToolCapabilityCard>()
  const pendingExternalCards: PendingExternalToolCapabilityCard[] = []

  for (const studyCard of listExplicitToolStudyCards()) {
    const lookupId = studyCard.toolId ?? studyCard.externalToolId ?? studyCard.aliases[0]
    if (!lookupId) {
      throw new Error(`${studyCard.displayName} study card must provide a toolId, externalToolId, or alias.`)
    }

    const resolution = resolveRuntimeToolId(lookupId)

    if (resolution.toolId) {
      const generatedCard = generatedCardsByToolId.get(resolution.toolId) ?? getGeneratedCardForToolId(resolution.toolId)
      explicitRuntimeCards.set(resolution.toolId, buildExplicitRuntimeCard(studyCard, generatedCard))
      continue
    }

    pendingExternalCards.push(buildPendingExternalCard(studyCard))
  }

  const generatedFallbackCards = [...generatedCardsByToolId.values()]
    .filter((card) => !explicitRuntimeCards.has(card.toolId))

  return [
    ...explicitRuntimeCards.values(),
    ...generatedFallbackCards,
    ...pendingExternalCards,
  ].sort((left, right) => cardSortKey(left).localeCompare(cardSortKey(right)))
}

export function listSelectableToolCapabilityCards(): ToolCapabilityCard[] {
  return listExpandedToolCapabilityCards()
    .filter((card): card is ToolCapabilityCard => 'toolId' in card)
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function getExpandedToolCapabilityCard(toolIdOrAlias: string): ExpandedToolCapabilityCard | undefined {
  const cards = listExpandedToolCapabilityCards()
  const directMatch = cards.find((card) => {
    if ('toolId' in card && card.toolId === toolIdOrAlias) return true
    if ('externalToolId' in card && card.externalToolId === toolIdOrAlias) return true
    return card.aliases?.includes(toolIdOrAlias) ?? false
  })
  if (directMatch) return directMatch

  const resolution = resolveRuntimeToolId(toolIdOrAlias)
  if (resolution.toolId) {
    return cards.find((card) => 'toolId' in card && card.toolId === resolution.toolId)
  }

  if (resolution.externalToolId) {
    return cards.find((card) => 'externalToolId' in card && card.externalToolId === resolution.externalToolId)
  }

  return undefined
}

function getGeneratedCardForToolId(toolId: ProductionToolId): ToolCapabilityCard {
  const profile = getProductionToolProfile(toolId)
  if (!profile) {
    throw new Error(`Missing ProductionToolProfile for explicit study card runtime ID: ${toolId}`)
  }

  return buildGeneratedToolCapabilityCard(profile)
}
