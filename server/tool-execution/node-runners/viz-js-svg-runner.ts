import { instance } from '@viz-js/viz'

import {
  createOfflineNodeRunnerResult,
  normalizeSvgDocument,
} from './offline-node-runner-artifacts'
import {
  awaitWithOfflineDeadline,
  createOfflineNodeRunnerDeadline,
  OfflineNodeRunnerValidationError,
  quoteDot,
  themeTokens,
  validateVizGraphInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

let vizInstancePromise: ReturnType<typeof instance> | undefined

export async function runOfflineVizJsSvgOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateVizGraphInput(input)
  const tokens = themeTokens(request.theme)
  const rankdir = request.direction === 'left_to_right' ? 'LR' : 'TB'
  const dot = [
    'digraph ReeditProGraph {',
    `graph [rankdir=${rankdir}, bgcolor=${quoteDot(tokens.background)}, pad="0.25", nodesep="0.45", ranksep="0.55", label=${quoteDot(request.title)}, labelloc="t", fontname="sans-serif", fontcolor=${quoteDot(tokens.foreground)}, fontsize="18"];`,
    `node [shape="box", style="rounded,filled", fillcolor=${quoteDot(tokens.accent)}, color=${quoteDot(tokens.accent)}, fontname="sans-serif", fontcolor=${quoteDot(request.theme === 'dark' ? '#111318' : '#ffffff')}, fontsize="12", margin="0.16,0.10"];`,
    `edge [color=${quoteDot(tokens.muted)}, fontname="sans-serif", fontcolor=${quoteDot(tokens.muted)}, fontsize="10", arrowsize="0.75", penwidth="1.4"];`,
    ...request.nodes.map((node) => `${quoteDot(node.id)} [label=${quoteDot(node.label)}];`),
    ...request.edges.map((edge) => [
      quoteDot(edge.from),
      ' -> ',
      quoteDot(edge.to),
      edge.label ? ` [label=${quoteDot(edge.label)}]` : '',
      ';',
    ].join('')),
    '}',
  ].join('\n')
  deadline.assertWithin('Viz.js DOT assembly')
  if (!vizInstancePromise) vizInstancePromise = instance()
  const viz = await awaitWithOfflineDeadline(vizInstancePromise, deadline, 'Viz.js WebAssembly initialization')
  let rawSvg: string
  try {
    rawSvg = viz.renderString(dot, { format: 'svg', engine: 'dot' })
  } catch {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'Viz.js rejected the fixed structured graph operation.')
  }
  deadline.assertWithin('Viz.js Graphviz SVG render')
  const svg = normalizeSvgDocument(rawSvg)
  const nodeGroups = svg.match(/<g\b[^>]*class="node"/g)?.length ?? 0
  const edgeGroups = svg.match(/<g\b[^>]*class="edge"/g)?.length ?? 0
  if (nodeGroups !== request.nodes.length || edgeGroups !== request.edges.length) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_OUTPUT',
      'Viz.js output node/edge semantics do not match the structured graph request.',
    )
  }
  return createOfflineNodeRunnerResult({
    toolId: 'viz_js',
    packageName: '@viz-js/viz',
    invokedEntrypoints: ['@viz-js/viz.instance', 'Viz.renderString'],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: svg !== rawSvg,
    minimumTextElements: request.nodes.length + request.edges.filter((edge) => edge.label).length + 1,
    minimumPathElements: request.edges.length,
    minimumGroupElements: request.nodes.length + request.edges.length + 1,
  })
}
