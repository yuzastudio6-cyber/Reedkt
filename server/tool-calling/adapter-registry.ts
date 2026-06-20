import {
  PRODUCTION_TOOL_IDS,
  getProductionToolProfile,
  isProductionToolId,
} from '../tool-registry'
import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import {
  getToolCapabilityCard,
  OPERATION_TOOL_SEEDS,
} from './capability-index'
import type {
  ToolAdapterContract,
} from './adapter-contract-types'

export const ADAPTER_CONTRACT_TOOL_IDS = [
  ...PRODUCTION_TOOL_IDS,
] as const satisfies readonly ProductionToolId[]

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort()
}

function seededOperationsForTool(toolId: ProductionToolId): ToolCallingOperationId[] {
  return Object.entries(OPERATION_TOOL_SEEDS)
    .filter(([, toolIds]) => toolIds.includes(toolId))
    .map(([operationId]) => operationId as ToolCallingOperationId)
}

function buildAdapterContract(toolId: ProductionToolId): ToolAdapterContract {
  const profile = getProductionToolProfile(toolId)
  const card = getToolCapabilityCard(toolId)

  if (!profile) {
    throw new Error(`Adapter contract requires first-class production profile: ${toolId}`)
  }
  if (!card) {
    throw new Error(`Adapter contract requires capability card: ${toolId}`)
  }

  const contract: ToolAdapterContract = {
    adapterId: `tool_adapter_${toolId}_v1`,
    toolId,
    displayName: profile.displayName,
    supportedOperationIds: uniqueSorted([
      ...card.operations,
      ...seededOperationsForTool(toolId),
    ]),
    acceptedInputArtifacts: uniqueSorted(card.inputArtifacts),
    producedOutputArtifacts: uniqueSorted(card.outputArtifacts),
    requiredQualityGates: uniqueSorted([
      ...card.validators,
      ...profile.qaResponsibilities,
    ]),
    workerType: profile.workerType,
    executionMode: 'planning_only',
    planningOnly: true,
    commandExecutionAllowed: false,
    mediaProcessingAllowed: false,
    requiresFirstClassProductionToolId: true,
    runtimeNotes: [
      ...profile.runtimeNotes,
      ...card.readinessNotes,
    ],
    safetyNotes: [
      ...profile.securityNotes,
      'Adapter contract is metadata-only and cannot execute tools.',
      'Future execution must use approved snapshots and existing production worker routing.',
    ],
  }

  assertAdapterContractIsPlanningOnly(contract)
  assertAdapterToolIsFirstClassProductionToolId(contract)

  return contract
}

const adapterContracts = ADAPTER_CONTRACT_TOOL_IDS
  .map(buildAdapterContract)
  .sort((left, right) => left.toolId.localeCompare(right.toolId))

export function listToolAdapterContracts(): ToolAdapterContract[] {
  return [...adapterContracts]
}

export function getToolAdapterContract(toolId: ProductionToolId | string): ToolAdapterContract | undefined {
  return adapterContracts.find((contract) => contract.toolId === toolId)
}

export function findAdapterContractsForOperation(operationId: ToolCallingOperationId | string): ToolAdapterContract[] {
  return adapterContracts
    .filter((contract) => contract.supportedOperationIds.includes(operationId as ToolCallingOperationId))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function assertAdapterContractIsPlanningOnly(contract: ToolAdapterContract): void {
  if (
    contract.executionMode !== 'planning_only' ||
    contract.planningOnly !== true ||
    contract.commandExecutionAllowed !== false ||
    contract.mediaProcessingAllowed !== false
  ) {
    throw new Error(`${contract.adapterId} must remain planning-only.`)
  }
}

export function assertAdapterToolIsFirstClassProductionToolId(contract: ToolAdapterContract): void {
  if (!contract.requiresFirstClassProductionToolId || !isProductionToolId(contract.toolId)) {
    throw new Error(`${contract.adapterId} must target a first-class ProductionToolId.`)
  }
}
