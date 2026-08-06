import type { OfflineNodeRunnerToolId } from './offline-node-runner-types'

export const OFFLINE_NODE_SVG_RUNNER_TOOL_IDS = Object.freeze([
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
  'animejs',
  'three_js',
] as const satisfies readonly OfflineNodeRunnerToolId[])

export type OfflineNodeSvgRunnerToolId = (typeof OFFLINE_NODE_SVG_RUNNER_TOOL_IDS)[number]
export const OFFLINE_NODE_RUNNER_TOOL_IDS = Object.freeze([
  ...OFFLINE_NODE_SVG_RUNNER_TOOL_IDS,
  'sharp',
] as const satisfies readonly OfflineNodeRunnerToolId[])

export function isOfflineNodeRunnerToolId(value: unknown): value is OfflineNodeRunnerToolId {
  return typeof value === 'string' &&
    (OFFLINE_NODE_RUNNER_TOOL_IDS as readonly string[]).includes(value)
}

export function isOfflineNodeSvgRunnerToolId(value: string): value is OfflineNodeSvgRunnerToolId {
  return (OFFLINE_NODE_SVG_RUNNER_TOOL_IDS as readonly string[]).includes(value)
}
