import { runOfflineD3SvgOperation } from './d3-svg-runner'
import { runOfflineAnimeJsMotionOperation } from './animejs-motion-svg-runner'
import { runOfflineEchartsSvgOperation } from './echarts-svg-runner'
import { runOfflineSatoriSvgOperation } from './satori-svg-runner'
import { runOfflineSharpImageOperation } from './sharp-image-runner'
import { runOfflineSvgJsOperation } from './svg-js-svg-runner'
import { runOfflineThreeJsSceneOperation } from './threejs-scene-svg-runner'
import { runOfflineVegaLiteSvgOperation } from './vega-lite-svg-runner'
import { runOfflineVegaSvgOperation } from './vega-svg-runner'
import { runOfflineVizJsSvgOperation } from './viz-js-svg-runner'
import {
  isOfflineNodeRunnerToolId,
} from './offline-node-runner-tool-ids'
import {
  OfflineNodeRunnerValidationError,
} from './offline-node-runner-security'
import { getOfflineNodeRunnerCanonicalOperation } from './offline-node-runner-canonical-operations'
import type {
  OfflineNodeRunnerResult,
  OfflineNodeRunnerToolId,
} from './offline-node-runner-types'

export interface OfflineNodeRunnerRegistryInvocation {
  toolId: OfflineNodeRunnerToolId
  operationId: string
  payload: unknown
}

type OfflineNodeRunner = (payload: unknown) => Promise<OfflineNodeRunnerResult>

const runners: Readonly<Record<OfflineNodeRunnerToolId, OfflineNodeRunner>> = Object.freeze({
  d3: async (payload) => runOfflineD3SvgOperation(payload),
  echarts: async (payload) => runOfflineEchartsSvgOperation(payload),
  vega_lite: runOfflineVegaLiteSvgOperation,
  vega: runOfflineVegaSvgOperation,
  satori: runOfflineSatoriSvgOperation,
  sharp: runOfflineSharpImageOperation,
  svg_js: async (payload) => runOfflineSvgJsOperation(payload),
  viz_js: runOfflineVizJsSvgOperation,
  animejs: runOfflineAnimeJsMotionOperation,
  three_js: runOfflineThreeJsSceneOperation,
})

export { isOfflineNodeRunnerToolId }

/**
 * Executes one canonical, fixed offline Node operation.
 *
 * This registry accepts canonical tool and operation identities only. Alias
 * resolution belongs to the server-side planning/dispatch boundary; a worker
 * must never reinterpret a caller-provided alias at execution time.
 */
export async function runOfflineNodeToolOperation(
  input: OfflineNodeRunnerRegistryInvocation,
): Promise<OfflineNodeRunnerResult> {
  assertExactRegistryInvocation(input)
  const canonicalOperation = getOfflineNodeRunnerCanonicalOperation(input.toolId)
  const expectedOperationId = canonicalOperation.operationId
  if (input.operationId !== expectedOperationId) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      'Offline Node execution requires the exact canonical approved operation identity.',
    )
  }

  const result = await runners[input.toolId](input.payload)
  if (
    result.toolId !== input.toolId ||
    result.operationId !== expectedOperationId ||
    result.actualToolPackageExecuted !== true ||
    result.status !== 'actual_library_operation_completed'
  ) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_OUTPUT',
      'Offline Node runner returned evidence for a different tool or operation identity.',
    )
  }
  return result
}

function assertExactRegistryInvocation(value: unknown): asserts value is OfflineNodeRunnerRegistryInvocation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Offline Node registry invocation must be an object.')
  }
  const record = value as Record<string, unknown>
  if (
    Object.keys(record).sort().join('\u0000') !== ['operationId', 'payload', 'toolId'].join('\u0000') ||
    !isOfflineNodeRunnerToolId(record.toolId) ||
    typeof record.operationId !== 'string' ||
    record.operationId.length < 1 ||
    record.operationId.length > 240
  ) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      'Offline Node registry invocation contains an unsupported identity or field.',
    )
  }
}
