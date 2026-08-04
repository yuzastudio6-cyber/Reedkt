import { PROFESSIONAL_TOOL_OPERATION_SEEDS } from '../professional-tool-operation-seeds'
import { productionToolProfiles } from '../../tool-registry/production-tool-profiles'
import type { OfflineNodeRunnerToolId } from './offline-node-runner-types'

export interface OfflineNodeRunnerCanonicalOperation {
  toolId: OfflineNodeRunnerToolId
  operationId: string
  packageName: string
}

const canonicalOperations = Object.freeze(Object.fromEntries(
  (['d3', 'echarts', 'vega_lite', 'vega', 'satori', 'sharp', 'svg_js', 'viz_js', 'animejs', 'three_js'] as const).map((toolId) => {
    const seed = toolId === 'sharp'
      ? {
          operationName: 'prepare_approved_image_asset',
          entrypoint: { kind: 'node_library' as const, packageName: 'sharp' },
          networkMode: 'offline_required' as const,
        }
      : PROFESSIONAL_TOOL_OPERATION_SEEDS.find((candidate) => candidate.canonicalToolId === toolId)
    if (!seed) throw new Error(`Offline Node runner ${toolId} requires exactly one canonical operation seed.`)
    const matchingProfiles = productionToolProfiles.filter((profile) => profile.toolId === toolId)
    if (matchingProfiles.length !== 1) {
      throw new Error(`Offline Node runner ${toolId} requires exactly one production policy profile.`)
    }
    const [profile] = matchingProfiles
    if (seed.entrypoint.kind !== 'node_library' || (seed.networkMode ?? 'offline_required') !== 'offline_required') {
      throw new Error(`Offline Node runner ${toolId} requires one offline Node-library operation seed.`)
    }
    if (
      ['evaluation_only', 'future', 'blocked'].includes(profile.productionStatus) ||
      profile.workerType === 'planning_only' ||
      profile.executionMode === 'readiness_check'
    ) {
      throw new Error(`Offline Node runner ${toolId} is blocked by its current production policy profile.`)
    }
    return [toolId, Object.freeze({
      toolId,
      operationId: `tool.${toolId}.${seed.operationName}.v1`,
      packageName: seed.entrypoint.packageName,
    })]
  }),
)) as Readonly<Record<OfflineNodeRunnerToolId, OfflineNodeRunnerCanonicalOperation>>

export function getOfflineNodeRunnerCanonicalOperation(
  toolId: OfflineNodeRunnerToolId,
): OfflineNodeRunnerCanonicalOperation {
  return canonicalOperations[toolId]
}
