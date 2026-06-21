import {
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import type {
  SoundDuplicateRisk,
  SoundExecutionGate,
  SoundInstallEvidenceStatus,
  SoundMusicAudioCategory,
  SoundMusicAudioOwnerExpansionSeedRow,
  SoundMusicAudioOwnerSourceBundle,
  SoundOwnerEvidenceStatus,
  SoundPendingAction,
  SoundToolCallingCoverage,
} from './sound-music-audio-owner-expansion-types'

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/sound-music-audio-owner-expansion-matrix.json', import.meta.url)

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

const ownerEvidenceStatuses = new Set<SoundOwnerEvidenceStatus>([
  'merged_owner_inventory',
  'merged_runtime_media_gate',
  'approved_install_plan_only',
  'pinned_requirement_only',
  'first_class_production_tool_id',
  'explicit_tool_calling_study_card',
  'planning_only_adapter_contract',
  'blocked_pending_license',
  'blocked_pending_model_weight',
  'blocked_pending_runtime_gate',
  'blocked_pending_media_policy',
  'blocked_pending_registry_expansion',
  'provider_or_api_only',
  'unknown',
])

const installEvidenceStatuses = new Set<SoundInstallEvidenceStatus>([
  'not_declared',
  'owner_inventory_only',
  'install_plan_only',
  'requirements_pinned',
  'bounded_install_proof',
  'runtime_proof',
  'unknown',
])

const executionGates = new Set<SoundExecutionGate>([
  'blocked_no_execution',
  'blocked_pending_cpu_worker_install_plan',
  'blocked_pending_model_review',
  'blocked_pending_media_policy',
  'blocked_pending_license',
  'planning_only',
  'future_controlled_probe_candidate',
])

const pendingActions = new Set<SoundPendingAction>([
  'none',
  'add_tool_calling_study_card',
  'add_runtime_registry_id',
  'add_adapter_contract',
  'add_safe_command_intent',
  'add_fixture_plan',
  'wait_for_sound_runtime_media_gate_1',
  'wait_for_model_weight_owner_review',
  'wait_for_media_policy_owner_handoff',
  'wait_for_license_provenance_review',
  'do_not_duplicate_owner_lane',
])

const duplicateRisks = new Set<SoundDuplicateRisk>([
  'none',
  'possible_duplicate_owner_lane',
  'possible_duplicate_registry_id',
  'possible_duplicate_study_card',
  'possible_duplicate_adapter',
  'wait_for_unmerged_owner_pr',
])

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

function readBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean.`)
  }

  return value
}

function readNullableProductionToolId(value: unknown, context: string): SoundMusicAudioOwnerExpansionSeedRow['productionToolId'] {
  if (value === null) return null
  const toolId = readString(value, context)
  if (!isProductionToolId(toolId)) {
    throw new Error(`${context} is not a first-class ProductionToolId: ${toolId}`)
  }

  return toolId
}

function readCoverage(value: unknown, context: string): SoundToolCallingCoverage {
  assertObject(value, context)

  return {
    hasStudyCard: readBoolean(value.hasStudyCard, `${context}.hasStudyCard`),
    hasAdapterContract: readBoolean(value.hasAdapterContract, `${context}.hasAdapterContract`),
    hasSafeCommandIntent: readBoolean(value.hasSafeCommandIntent, `${context}.hasSafeCommandIntent`),
    hasFixturePlan: readBoolean(value.hasFixturePlan, `${context}.hasFixturePlan`),
    hasControlledProbe: readBoolean(value.hasControlledProbe, `${context}.hasControlledProbe`),
    hasFixtureBoundProbe: readBoolean(value.hasFixtureBoundProbe, `${context}.hasFixtureBoundProbe`),
  }
}

function readSoundCategory(value: unknown, context: string): SoundMusicAudioCategory {
  const category = readString(value, context)
  if (!soundCategories.has(category as SoundMusicAudioCategory)) {
    throw new Error(`${context} is not supported: ${category}`)
  }

  return category as SoundMusicAudioCategory
}

function readEvidenceStatuses(value: unknown, context: string): SoundOwnerEvidenceStatus[] {
  return readStringArray(value, context).map((status) => {
    if (!ownerEvidenceStatuses.has(status as SoundOwnerEvidenceStatus)) {
      throw new Error(`${context} contains unsupported status: ${status}`)
    }

    return status as SoundOwnerEvidenceStatus
  })
}

function readInstallEvidenceStatus(value: unknown, context: string): SoundInstallEvidenceStatus {
  const status = readString(value, context)
  if (!installEvidenceStatuses.has(status as SoundInstallEvidenceStatus)) {
    throw new Error(`${context} is not supported: ${status}`)
  }

  return status as SoundInstallEvidenceStatus
}

function readExecutionGate(value: unknown, context: string): SoundExecutionGate {
  const gate = readString(value, context)
  if (!executionGates.has(gate as SoundExecutionGate)) {
    throw new Error(`${context} is not supported: ${gate}`)
  }

  return gate as SoundExecutionGate
}

function readPendingAction(value: unknown, context: string): SoundPendingAction {
  const action = readString(value, context)
  if (!pendingActions.has(action as SoundPendingAction)) {
    throw new Error(`${context} is not supported: ${action}`)
  }

  return action as SoundPendingAction
}

function readDuplicateRisk(value: unknown, context: string): SoundDuplicateRisk {
  const duplicateRisk = readString(value, context)
  if (!duplicateRisks.has(duplicateRisk as SoundDuplicateRisk)) {
    throw new Error(`${context} is not supported: ${duplicateRisk}`)
  }

  return duplicateRisk as SoundDuplicateRisk
}

function readSeedRow(value: unknown, context: string): SoundMusicAudioOwnerExpansionSeedRow {
  assertObject(value, context)

  return {
    normalizedToolId: readString(value.normalizedToolId, `${context}.normalizedToolId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    soundCategory: readSoundCategory(value.soundCategory, `${context}.soundCategory`),
    ownerEvidenceStatus: readEvidenceStatuses(value.ownerEvidenceStatus, `${context}.ownerEvidenceStatus`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    productionToolId: readNullableProductionToolId(value.productionToolId, `${context}.productionToolId`),
    packageNames: readStringArray(value.packageNames, `${context}.packageNames`),
    aliases: readStringArray(value.aliases, `${context}.aliases`),
    currentToolCallingCoverage: readCoverage(value.currentToolCallingCoverage, `${context}.currentToolCallingCoverage`),
    selectableAsRuntimeTool: readBoolean(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    installEvidenceStatus: readInstallEvidenceStatus(value.installEvidenceStatus, `${context}.installEvidenceStatus`),
    executionGate: readExecutionGate(value.executionGate, `${context}.executionGate`),
    pendingAction: readPendingAction(value.pendingAction, `${context}.pendingAction`),
    duplicateRisk: readDuplicateRisk(value.duplicateRisk, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }
}

export function loadSoundMusicAudioOwnerSources(): SoundMusicAudioOwnerSourceBundle {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'sound music audio owner expansion matrix')
  if (parsed.schema !== 'reeditpro.soundMusicAudioOwnerExpansionMatrix.v1') {
    throw new Error('sound music audio owner expansion matrix schema is unsupported.')
  }
  assertObject(parsed.evidenceSummary, 'sound music audio owner expansion matrix evidenceSummary')
  if (parsed.evidenceSummary.sourcePr !== 636) {
    throw new Error('sound music audio owner expansion matrix must reference PR #636.')
  }
  if (parsed.evidenceSummary.sourceMilestone !== 'SOUND-RUNTIME-MEDIA-GATE-0') {
    throw new Error('sound music audio owner expansion matrix must reference SOUND-RUNTIME-MEDIA-GATE-0.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('sound music audio owner expansion matrix rows must be an array.')
  }

  const rows = parsed.rows.map((row, index) => readSeedRow(row, `rows[${index}]`))
  const duplicateIds = rows
    .map((row) => row.normalizedToolId)
    .filter((toolId, index, values) => values.indexOf(toolId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`sound music audio owner expansion matrix has duplicate normalizedToolId values: ${duplicateIds.join(', ')}`)
  }

  return {
    matrixDocument: {
      schema: 'reeditpro.soundMusicAudioOwnerExpansionMatrix.v1',
      evidenceSummary: {
        sourcePr: 636,
        sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-0',
        sourceDecision: readString(parsed.evidenceSummary.sourceDecision, 'evidenceSummary.sourceDecision'),
        candidateInventoryCount: Number(parsed.evidenceSummary.candidateInventoryCount),
        pinnedRequirementCount: Number(parsed.evidenceSummary.pinnedRequirementCount),
        approvedInstallPlanToolCount: Number(parsed.evidenceSummary.approvedInstallPlanToolCount),
        githubPrScanAvailable: readBoolean(parsed.evidenceSummary.githubPrScanAvailable, 'evidenceSummary.githubPrScanAvailable'),
      },
      rows,
    },
  }
}
