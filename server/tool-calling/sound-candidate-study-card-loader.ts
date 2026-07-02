import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import {
  getOperationDefinition,
} from './operation-ontology'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import {
  buildSoundMusicAudioOwnerExpansionMatrix,
} from './sound-music-audio-owner-expansion-analyzer'
import type {
  SoundMusicAudioCategory,
  SoundMusicAudioOwnerExpansionRow,
} from './sound-music-audio-owner-expansion-types'
import type {
  SoundCandidateOwnerGateStatus,
  SoundCandidateOwnerLane,
  SoundCandidateRuntimeResolutionStatus,
  SoundCandidateStudyCard,
  SoundCandidateStudyCardsIndex,
  SoundCandidateStudyCardSourceEvidence,
  SoundCandidateStudyOperation,
} from './sound-candidate-study-card-types'

export const SOUND_CANDIDATE_STUDY_CARD_SCHEMA = 'reeditpro.soundCandidateStudyCard.v1'
export const SOUND_CANDIDATE_STUDY_CARD_INDEX_SCHEMA = 'reeditpro.soundCandidateStudyCardsIndex.v1'

const SOUND_CANDIDATE_STUDIES_DIRECTORY = new URL('../../docs/tool-calling/sound-candidate-studies/', import.meta.url)
const SOUND_CANDIDATE_INDEX_URL = new URL('../../docs/tool-calling/sound-candidate-study-cards-index.json', import.meta.url)

export const SOUND_CANDIDATE_CARD_MATRIX_ROW_IDS: Record<string, readonly string[]> = {
  soundfile_libsndfile: ['soundfile', 'libsndfile'],
  sox: ['sox'],
  aubio: ['aubio'],
  mmaudio: ['mmaudio_v2'],
  pydub: ['pydub'],
  audioread: ['audioread'],
  pyloudnorm: ['pyloudnorm'],
  basic_pitch: ['basic_pitch'],
  crepe: ['crepe'],
  torchcrepe: ['torchcrepe'],
  spleeter: ['spleeter'],
  open_unmix: ['open_unmix'],
  asteroid: ['asteroid'],
  speechbrain_enhancement: ['speechbrain_enhancement'],
  sfx_director: ['sfx_director_tool'],
  soundsync: ['soundsync_cue_planning'],
  sound_cue_manifest: ['timing_aware_cue_manifest_builder'],
  music_ducking_loudness_qa: ['music_ducking_mix_qa'],
}

const runtimeStatuses = new Set<SoundCandidateRuntimeResolutionStatus>([
  'owner_inventory_only',
  'install_plan_only',
  'blocked_pending_license',
  'blocked_pending_model_weight',
  'blocked_pending_runtime_gate',
  'blocked_pending_media_policy',
  'blocked_pending_registry_expansion',
])

const ownerLanes = new Set<SoundCandidateOwnerLane>([
  'sound_music_audio',
  'sfx_soundsync',
])

const ownerGateStatuses = new Set<SoundCandidateOwnerGateStatus>([
  'wait_for_sound_runtime_media_gate_1',
  'wait_for_model_weight_owner_review',
  'wait_for_media_policy_owner_handoff',
  'wait_for_license_provenance_review',
  'do_not_duplicate_owner_lane',
  'planning_only_owner_surface',
  'owner_gate_required_before_runtime_selection',
])

const soundCategories = new Set<SoundMusicAudioCategory>([
  'audio_cleanup',
  'denoise',
  'stem_separation',
  'audio_analysis',
  'beat_timing',
  'music_sync',
  'time_stretch',
  'loudness_qa',
  'sound_effects',
  'soundsync',
  'cue_manifest',
  'sfx_director',
  'speech_audio_support',
  'unknown_or_pending',
])

const falseSafetyFlags = [
  'selectableAsRuntimeTool',
  'adapterContractAllowedNow',
  'commandIntentAllowedNow',
  'fixturePlanAllowedNow',
  'controlledProbeAllowedNow',
  'toolExecutionAllowedNow',
  'mediaProcessingAllowedNow',
  'workerExecutionAllowedNow',
  'supabaseMutationAllowedNow',
  'betaProductionAllowedNow',
] as const

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

function readFalse(value: unknown, context: string): false {
  if (value !== false) {
    throw new Error(`${context} must be false for candidate-only SOUND cards.`)
  }

  return false
}

function readZero(value: unknown, context: string): 0 {
  if (value !== 0) {
    throw new Error(`${context} must be 0.`)
  }

  return 0
}

function readOperationId(value: unknown, context: string): ToolCallingOperationId {
  const operationId = readString(value, context)
  if (!getOperationDefinition(operationId)) {
    throw new Error(`${context} is not a known operation: ${operationId}`)
  }

  return operationId as ToolCallingOperationId
}

function readFallbackToolIds(value: unknown, context: string) {
  return readStringArray(value, context).map((toolId) => {
    if (!isProductionToolId(toolId)) {
      throw new Error(`${context} contains non-first-class fallback tool ID: ${toolId}`)
    }

    return toolId
  })
}

function readSourceEvidence(value: unknown, context: string): SoundCandidateStudyCardSourceEvidence[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context} must be a non-empty array.`)
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

function readOperation(value: unknown, context: string): SoundCandidateStudyOperation {
  assertObject(value, context)
  if (value.supportLevel !== 'future') {
    throw new Error(`${context}.supportLevel must be future.`)
  }

  return {
    operationId: readOperationId(value.operationId, `${context}.operationId`),
    supportLevel: 'future',
    bestFor: readStringArray(value.bestFor, `${context}.bestFor`),
    notFor: readStringArray(value.notFor, `${context}.notFor`),
    inputArtifacts: readStringArray(value.inputArtifacts, `${context}.inputArtifacts`) as ToolCallingArtifactType[],
    outputArtifacts: readStringArray(value.outputArtifacts, `${context}.outputArtifacts`) as ToolCallingArtifactType[],
    validators: readStringArray(value.validators, `${context}.validators`) as SoundCandidateStudyOperation['validators'],
    fallbackToolIds: readFallbackToolIds(value.fallbackToolIds, `${context}.fallbackToolIds`),
    notes: readStringArray(value.notes, `${context}.notes`),
  }
}

function readRuntimeResolution(value: unknown, context: string): SoundCandidateStudyCard['runtimeResolution'] {
  assertObject(value, context)
  const status = readString(value.status, `${context}.status`)
  if (!runtimeStatuses.has(status as SoundCandidateRuntimeResolutionStatus)) {
    throw new Error(`${context}.status is unsupported: ${status}`)
  }

  return {
    status: status as SoundCandidateRuntimeResolutionStatus,
    selectableAsRuntimeTool: readFalse(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    productionToolId: value.productionToolId === null
      ? null
      : (() => { throw new Error(`${context}.productionToolId must be null.`) })(),
    reason: readString(value.reason, `${context}.reason`),
  }
}

function rowsForCandidate(externalToolId: string, rows: readonly SoundMusicAudioOwnerExpansionRow[]): SoundMusicAudioOwnerExpansionRow[] {
  const expectedRowIds = SOUND_CANDIDATE_CARD_MATRIX_ROW_IDS[externalToolId] ?? [externalToolId]

  return expectedRowIds.map((rowId) => {
    const row = rows.find((candidate) => candidate.normalizedToolId === rowId)
    if (!row) {
      throw new Error(`${externalToolId} does not have expected SOUND owner matrix row: ${rowId}`)
    }

    return row
  })
}

function readSoundCandidateStudyCard(
  value: unknown,
  fileName: string,
  soundRows: readonly SoundMusicAudioOwnerExpansionRow[],
): SoundCandidateStudyCard {
  assertObject(value, fileName)
  if (value.toolId !== undefined) {
    throw new Error(`${fileName} must not include toolId; candidate cards are not first-class ProductionToolIds.`)
  }
  const externalToolId = readString(value.externalToolId, `${fileName}.externalToolId`)
  if (isProductionToolId(externalToolId)) {
    throw new Error(`${fileName}.externalToolId is already a first-class ProductionToolId: ${externalToolId}`)
  }

  const matchingRows = rowsForCandidate(externalToolId, soundRows)
  const ownerLane = readString(value.ownerLane, `${fileName}.ownerLane`)
  if (!ownerLanes.has(ownerLane as SoundCandidateOwnerLane)) {
    throw new Error(`${fileName}.ownerLane is unsupported: ${ownerLane}`)
  }
  const soundCategory = readString(value.soundCategory, `${fileName}.soundCategory`)
  if (!soundCategories.has(soundCategory as SoundMusicAudioCategory)) {
    throw new Error(`${fileName}.soundCategory is unsupported: ${soundCategory}`)
  }
  const ownerGateStatus = readString(value.ownerGateStatus, `${fileName}.ownerGateStatus`)
  if (!ownerGateStatuses.has(ownerGateStatus as SoundCandidateOwnerGateStatus)) {
    throw new Error(`${fileName}.ownerGateStatus is unsupported: ${ownerGateStatus}`)
  }

  const operations = Array.isArray(value.operations)
    ? value.operations.map((operation, index) => readOperation(operation, `${fileName}.operations[${index}]`))
    : []
  if (operations.length === 0) {
    throw new Error(`${fileName}.operations must include at least one operation.`)
  }
  const sourceEvidence = readSourceEvidence(value.sourceEvidence, `${fileName}.sourceEvidence`)
  const sourcePaths = new Set(sourceEvidence.map((entry) => entry.sourcePath))
  for (const row of matchingRows) {
    if (!row.sourceEvidence.some((sourcePath) => sourcePaths.has(sourcePath))) {
      throw new Error(`${fileName} is missing source evidence from SOUND owner matrix row ${row.normalizedToolId}.`)
    }
  }

  for (const flag of falseSafetyFlags) {
    readFalse(value[flag], `${fileName}.${flag}`)
  }

  return {
    schema: value.schema === SOUND_CANDIDATE_STUDY_CARD_SCHEMA
      ? SOUND_CANDIDATE_STUDY_CARD_SCHEMA
      : (() => { throw new Error(`${fileName}.schema is unsupported.`) })(),
    externalToolId,
    displayName: readString(value.displayName, `${fileName}.displayName`),
    aliases: readStringArray(value.aliases, `${fileName}.aliases`),
    ownerLane: ownerLane as SoundCandidateOwnerLane,
    soundCategory: soundCategory as SoundMusicAudioCategory,
    runtimeResolution: readRuntimeResolution(value.runtimeResolution, `${fileName}.runtimeResolution`),
    operations,
    bestFor: readStringArray(value.bestFor, `${fileName}.bestFor`),
    notFor: readStringArray(value.notFor, `${fileName}.notFor`),
    inputArtifacts: readStringArray(value.inputArtifacts, `${fileName}.inputArtifacts`) as ToolCallingArtifactType[],
    outputArtifacts: readStringArray(value.outputArtifacts, `${fileName}.outputArtifacts`) as ToolCallingArtifactType[],
    validators: readStringArray(value.validators, `${fileName}.validators`) as SoundCandidateStudyCard['validators'],
    fallbackToolIds: readFallbackToolIds(value.fallbackToolIds, `${fileName}.fallbackToolIds`),
    knownFailureModes: readStringArray(value.knownFailureModes, `${fileName}.knownFailureModes`),
    professionalEditingUses: readStringArray(value.professionalEditingUses, `${fileName}.professionalEditingUses`),
    sourceEvidence,
    ownerGateStatus: ownerGateStatus as SoundCandidateOwnerGateStatus,
    futurePromotionRequirements: readStringArray(value.futurePromotionRequirements, `${fileName}.futurePromotionRequirements`),
    readinessNotes: readStringArray(value.readinessNotes, `${fileName}.readinessNotes`),
    benchmarkPlaceholders: readStringArray(value.benchmarkPlaceholders, `${fileName}.benchmarkPlaceholders`),
    telemetryPlaceholders: readStringArray(value.telemetryPlaceholders, `${fileName}.telemetryPlaceholders`),
    selectableAsRuntimeTool: false,
    adapterContractAllowedNow: false,
    commandIntentAllowedNow: false,
    fixturePlanAllowedNow: false,
    controlledProbeAllowedNow: false,
    toolExecutionAllowedNow: false,
    mediaProcessingAllowedNow: false,
    workerExecutionAllowedNow: false,
    supabaseMutationAllowedNow: false,
    betaProductionAllowedNow: false,
  }
}

export function loadSoundCandidateStudyCardsIndex(): SoundCandidateStudyCardsIndex {
  const parsed = JSON.parse(readFileSync(SOUND_CANDIDATE_INDEX_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound candidate study cards index')
  if (parsed.schema !== SOUND_CANDIDATE_STUDY_CARD_INDEX_SCHEMA) {
    throw new Error('sound candidate study cards index schema is unsupported.')
  }

  return {
    schema: SOUND_CANDIDATE_STUDY_CARD_INDEX_SCHEMA,
    sourcePrs: readStringArray((parsed.sourcePrs as number[]).map(String), 'sound candidate study cards index.sourcePrs').map(Number),
    sourceMilestone: parsed.sourceMilestone === 'SOUND-RUNTIME-MEDIA-GATE-0'
      ? 'SOUND-RUNTIME-MEDIA-GATE-0'
      : (() => { throw new Error('sound candidate study cards index sourceMilestone is unsupported.') })(),
    candidateStudyCardCount: Number(parsed.candidateStudyCardCount),
    cardPaths: readStringArray(parsed.cardPaths, 'sound candidate study cards index.cardPaths'),
    candidateExternalToolIds: readStringArray(parsed.candidateExternalToolIds, 'sound candidate study cards index.candidateExternalToolIds'),
    selectableAsRuntimeTool: readFalse(parsed.selectableAsRuntimeTool, 'sound candidate study cards index.selectableAsRuntimeTool'),
    adapterContractsAdded: readZero(parsed.adapterContractsAdded, 'sound candidate study cards index.adapterContractsAdded'),
    commandIntentsAdded: readZero(parsed.commandIntentsAdded, 'sound candidate study cards index.commandIntentsAdded'),
    controlledProbesAdded: readZero(parsed.controlledProbesAdded, 'sound candidate study cards index.controlledProbesAdded'),
  }
}

export function listSoundCandidateStudyCardFiles(): string[] {
  if (!existsSync(SOUND_CANDIDATE_STUDIES_DIRECTORY)) return []

  return readdirSync(SOUND_CANDIDATE_STUDIES_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
}

export function loadSoundCandidateStudyCards(): SoundCandidateStudyCard[] {
  const soundRows = buildSoundMusicAudioOwnerExpansionMatrix()
  const cards = listSoundCandidateStudyCardFiles().map((fileName) => {
    const parsed = JSON.parse(readFileSync(new URL(fileName, SOUND_CANDIDATE_STUDIES_DIRECTORY), 'utf8')) as unknown

    return readSoundCandidateStudyCard(parsed, fileName, soundRows)
  })
  const duplicateExternalToolIds = cards
    .map((card) => card.externalToolId)
    .filter((externalToolId, index, values) => values.indexOf(externalToolId) !== index)
  if (duplicateExternalToolIds.length > 0) {
    throw new Error(`duplicate sound candidate study cards: ${duplicateExternalToolIds.join(', ')}`)
  }

  return cards.sort((left, right) => left.externalToolId.localeCompare(right.externalToolId))
}
