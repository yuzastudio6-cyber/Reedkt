import {
  readFileSync,
} from 'node:fs'
import {
  isProductionToolId,
} from '../tool-registry'
import {
  getOperationDefinition,
} from './operation-ontology'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  AllOwnerCurrentRepoStatus,
  AllOwnerDuplicateRisk,
  AllOwnerPendingAction,
  AllOwnerReconciliationSourceBundle,
  AllOwnerSourceMatrixDocument,
  AllOwnerToolLane,
  AllOwnerToolReconciliationSeedRow,
} from './all-owner-stack-reconciliation-types'
import type {
  UnmergedOwnerEvidenceItem,
} from './unmerged-owner-evidence-types'

const MATRIX_DOCUMENT_URL = new URL('../../docs/tool-calling/all-owner-stack-reconciliation-matrix.json', import.meta.url)

const ownerLanes = new Set<AllOwnerToolLane>([
  'track_b_media',
  'track_a_render_export',
  'ai_graphics',
  'sound_music_audio',
  'sfx_soundsync',
  'web_capture',
  'map_geospatial',
  'provider_local_runtime',
  'worker_runtime',
  'tool_calling_overlay',
  'unknown_or_pending',
])

const currentRepoStatuses = new Set<AllOwnerCurrentRepoStatus>([
  'first_class_production_tool_id',
  'explicit_tool_calling_study_card',
  'generated_registry_card_only',
  'owner_inventory_only',
  'installed_source_declared',
  'install_proof_bounded',
  'runtime_proof_bounded',
  'fixture_proof_bounded',
  'controlled_probe_passed',
  'controlled_probe_unavailable',
  'fixture_bound_probe_passed',
  'blocked_pending_license',
  'blocked_pending_model_weight',
  'blocked_pending_runtime_lane',
  'blocked_pending_registry_expansion',
  'evaluation_only',
  'provider_api_only',
  'unknown',
])

const pendingActions = new Set<AllOwnerPendingAction>([
  'none',
  'add_tool_calling_study_card',
  'add_production_tool_registry_id',
  'add_adapter_contract',
  'add_safe_command_intent',
  'add_fixture_plan',
  'add_controlled_probe',
  'add_fixture_bound_probe',
  'wait_for_owner_install_proof',
  'wait_for_license_review',
  'wait_for_model_weight_review',
  'wait_for_worker_runtime_gate',
  'wait_for_unmerged_owner_pr',
  'do_not_duplicate_owner_lane',
])

const duplicateRisks = new Set<AllOwnerDuplicateRisk>([
  'none',
  'possible_duplicate_study',
  'possible_duplicate_adapter',
  'possible_duplicate_registry_id',
  'possible_duplicate_owner_lane',
  'existing_owner_work_in_progress',
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

function readNullableProductionToolId(value: unknown, context: string): AllOwnerToolReconciliationSeedRow['productionToolId'] {
  if (value === null) return null
  const toolId = readString(value, context)
  if (!isProductionToolId(toolId)) {
    throw new Error(`${context} is not a first-class ProductionToolId: ${toolId}`)
  }

  return toolId
}

function readOwnerLane(value: unknown, context: string): AllOwnerToolLane {
  const ownerLane = readString(value, context)
  if (!ownerLanes.has(ownerLane as AllOwnerToolLane)) {
    throw new Error(`${context} is not supported: ${ownerLane}`)
  }

  return ownerLane as AllOwnerToolLane
}

function readCurrentRepoStatuses(value: unknown, context: string): AllOwnerCurrentRepoStatus[] {
  return readStringArray(value, context).map((status) => {
    if (!currentRepoStatuses.has(status as AllOwnerCurrentRepoStatus)) {
      throw new Error(`${context} contains unsupported status: ${status}`)
    }

    return status as AllOwnerCurrentRepoStatus
  })
}

function readOperations(value: unknown, context: string): ToolCallingOperationId[] {
  return readStringArray(value, context).map((operationId) => {
    if (!getOperationDefinition(operationId)) {
      throw new Error(`${context} contains unknown operation: ${operationId}`)
    }

    return operationId as ToolCallingOperationId
  })
}

function readPendingAction(value: unknown, context: string): AllOwnerPendingAction {
  const pendingAction = readString(value, context)
  if (!pendingActions.has(pendingAction as AllOwnerPendingAction)) {
    throw new Error(`${context} is not supported: ${pendingAction}`)
  }

  return pendingAction as AllOwnerPendingAction
}

function readDuplicateRisk(value: unknown, context: string): AllOwnerDuplicateRisk {
  const duplicateRisk = readString(value, context)
  if (!duplicateRisks.has(duplicateRisk as AllOwnerDuplicateRisk)) {
    throw new Error(`${context} is not supported: ${duplicateRisk}`)
  }

  return duplicateRisk as AllOwnerDuplicateRisk
}

function readSeedRow(value: unknown, context: string): AllOwnerToolReconciliationSeedRow {
  assertObject(value, context)

  return {
    normalizedToolId: readString(value.normalizedToolId, `${context}.normalizedToolId`),
    displayName: readString(value.displayName, `${context}.displayName`),
    ownerLane: readOwnerLane(value.ownerLane, `${context}.ownerLane`),
    sourceEvidence: readStringArray(value.sourceEvidence, `${context}.sourceEvidence`),
    currentRepoStatus: readCurrentRepoStatuses(value.currentRepoStatus, `${context}.currentRepoStatus`),
    productionToolId: readNullableProductionToolId(value.productionToolId, `${context}.productionToolId`),
    aliases: readStringArray(value.aliases, `${context}.aliases`),
    packageNames: readStringArray(value.packageNames, `${context}.packageNames`),
    dockerEvidence: readStringArray(value.dockerEvidence, `${context}.dockerEvidence`),
    requirementsEvidence: readStringArray(value.requirementsEvidence, `${context}.requirementsEvidence`),
    packageJsonEvidence: readStringArray(value.packageJsonEvidence, `${context}.packageJsonEvidence`),
    proofEvidence: readStringArray(value.proofEvidence, `${context}.proofEvidence`),
    runtimeEvidence: readStringArray(value.runtimeEvidence, `${context}.runtimeEvidence`),
    operationCoverage: readOperations(value.operationCoverage, `${context}.operationCoverage`),
    hasToolCallingStudyCard: readBoolean(value.hasToolCallingStudyCard, `${context}.hasToolCallingStudyCard`),
    hasAdapterContract: readBoolean(value.hasAdapterContract, `${context}.hasAdapterContract`),
    hasSafeCommandIntent: readBoolean(value.hasSafeCommandIntent, `${context}.hasSafeCommandIntent`),
    hasFixturePlan: readBoolean(value.hasFixturePlan, `${context}.hasFixturePlan`),
    hasDryRunFixture: readBoolean(value.hasDryRunFixture, `${context}.hasDryRunFixture`),
    hasBinaryFixturePlan: readBoolean(value.hasBinaryFixturePlan, `${context}.hasBinaryFixturePlan`),
    hasControlledReadinessProbe: readBoolean(value.hasControlledReadinessProbe, `${context}.hasControlledReadinessProbe`),
    hasFixtureBoundProbe: readBoolean(value.hasFixtureBoundProbe, `${context}.hasFixtureBoundProbe`),
    selectableAsRuntimeTool: readBoolean(value.selectableAsRuntimeTool, `${context}.selectableAsRuntimeTool`),
    pendingAction: readPendingAction(value.pendingAction, `${context}.pendingAction`),
    duplicateRisk: readDuplicateRisk(value.duplicateRisk, `${context}.duplicateRisk`),
    notes: readString(value.notes, `${context}.notes`),
  }
}

export function loadAllOwnerReconciliationSourceMatrix(): AllOwnerSourceMatrixDocument {
  const parsed = JSON.parse(readFileSync(MATRIX_DOCUMENT_URL, 'utf8')) as unknown
  assertObject(parsed, 'all-owner reconciliation matrix')
  if (parsed.schema !== 'reeditpro.allOwnerToolStackReconciliationMatrix.v1') {
    throw new Error('all-owner reconciliation matrix schema is unsupported.')
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error('all-owner reconciliation matrix rows must be an array.')
  }

  const rows = parsed.rows.map((row, index) => readSeedRow(row, `rows[${index}]`))
  const duplicateIds = rows
    .map((row) => row.normalizedToolId)
    .filter((toolId, index, values) => values.indexOf(toolId) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`all-owner reconciliation matrix has duplicate normalizedToolId values: ${duplicateIds.join(', ')}`)
  }

  return {
    schema: 'reeditpro.allOwnerToolStackReconciliationMatrix.v1',
    notes: readStringArray(parsed.notes, 'all-owner reconciliation matrix notes'),
    rows,
  }
}

export function loadAllOwnerReconciliationSources(
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[] = [],
): AllOwnerReconciliationSourceBundle {
  return {
    seedDocument: loadAllOwnerReconciliationSourceMatrix(),
    unmergedOwnerEvidence: [...unmergedOwnerEvidence],
  }
}
