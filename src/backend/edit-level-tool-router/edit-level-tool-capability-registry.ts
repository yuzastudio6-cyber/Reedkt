import type {
  EditLevelProductionReadiness,
  EditLevelToolCapabilityDefinition,
  EditLevelToolCapabilityId,
  EditLevelToolRouterSideEffectFlags,
} from '../../types'
import { defaultEditLevelProductionReadiness } from '../../lib/edit-level-production-readiness'
import {
  createEditLevelToolRouterSideEffectFlags,
  getEditLevelToolCapabilityDefinition,
  listEditLevelToolCapabilityDefinitions,
} from '../../lib/edit-level-tool-router-rules'

export interface EditLevelToolCapabilityRegistryResult {
  capabilities: EditLevelToolCapabilityDefinition[]
  capabilityIds: EditLevelToolCapabilityId[]
  capabilityCount: number
  productionReady: boolean
  productionReadiness: EditLevelProductionReadiness
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export function listEditLevelToolCapabilities(): EditLevelToolCapabilityRegistryResult {
  const capabilities = listEditLevelToolCapabilityDefinitions()

  return {
    capabilities,
    capabilityIds: capabilities.map((capability) => capability.capabilityId),
    capabilityCount: capabilities.length,
    productionReady: defaultEditLevelProductionReadiness.productionReady,
    productionReadiness: defaultEditLevelProductionReadiness,
    sideEffectFlags: createEditLevelToolRouterSideEffectFlags(),
    mockOnly: true,
  }
}

export function getEditLevelToolCapability(
  capabilityId: EditLevelToolCapabilityId,
): EditLevelToolCapabilityDefinition {
  return getEditLevelToolCapabilityDefinition(capabilityId)
}

export function createEditLevelToolCapabilityRegistrySummary(): string[] {
  const registry = listEditLevelToolCapabilities()

  return [
    `${registry.capabilityCount} Edit Level tool capabilities are registered.`,
    'Registry is mock/local metadata only and does not execute providers, models, tools, media, workers, render, storage, or credits.',
    `Registered capabilities: ${registry.capabilityIds.join(', ')}.`,
  ]
}
