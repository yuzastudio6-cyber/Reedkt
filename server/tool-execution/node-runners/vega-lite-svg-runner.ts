import * as vega from 'vega'
import { compile } from 'vega-lite'

import {
  createOfflineNodeRunnerResult,
  normalizeVegaGeneratedIdentifiers,
} from './offline-node-runner-artifacts'
import {
  awaitWithOfflineDeadline,
  createOfflineNodeRunnerDeadline,
  themeTokens,
  validateStructuredChartInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export async function runOfflineVegaLiteSvgOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateStructuredChartInput(input)
  const tokens = themeTokens(request.theme)
  deadline.assertWithin('Vega-Lite input validation')
  const specification: Parameters<typeof compile>[0] = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: request.width,
    height: request.height,
    background: tokens.background,
    padding: 0,
    title: {
      text: request.title,
      color: tokens.foreground,
      font: 'sans-serif',
      fontSize: 18,
      fontWeight: 700,
      anchor: 'middle',
    },
    data: { values: request.data.map((datum, index) => ({ ...datum, seriesIndex: index })) },
    mark: { type: 'bar', tooltip: false, cornerRadiusTopLeft: 4, cornerRadiusTopRight: 4 },
    encoding: {
      x: {
        field: 'label',
        type: 'nominal',
        sort: null,
        axis: {
          title: request.xAxisLabel,
          labelColor: tokens.foreground,
          titleColor: tokens.muted,
          domainColor: tokens.muted,
          tickColor: tokens.muted,
          labelLimit: 120,
        },
      },
      y: {
        field: 'value',
        type: 'quantitative',
        scale: { domainMin: 0, nice: true, zero: true },
        axis: {
          title: request.yAxisLabel,
          labelColor: tokens.muted,
          titleColor: tokens.muted,
          domainColor: tokens.muted,
          tickColor: tokens.muted,
          gridColor: tokens.grid,
        },
      },
      color: {
        field: 'seriesIndex',
        type: 'nominal',
        legend: null,
        scale: { range: [tokens.accent, tokens.accentSecondary] },
      },
    },
    config: {
      view: { stroke: null },
      axis: { labelFont: 'sans-serif', titleFont: 'sans-serif' },
      text: { font: 'sans-serif' },
      style: { 'guide-label': { font: 'sans-serif' }, 'guide-title': { font: 'sans-serif' } },
    },
  }
  const compiled = compile(specification)
  deadline.assertWithin('Vega-Lite compile')
  const runtime = vega.parse(compiled.spec)
  const view = new vega.View(runtime, { renderer: 'none', logLevel: vega.Warn })
  let svg: string
  try {
    svg = await awaitWithOfflineDeadline(view.toSVG(), deadline, 'Vega View SVG render')
  } finally {
    view.finalize()
  }
  deadline.assertWithin('Vega-Lite SVG verification handoff')
  const normalizedSvg = normalizeVegaGeneratedIdentifiers(svg)
  return createOfflineNodeRunnerResult({
    toolId: 'vega_lite',
    packageName: 'vega-lite',
    invokedEntrypoints: ['vega-lite.compile', 'vega.parse', 'vega.View.toSVG'],
    sourceInput: request,
    svg: normalizedSvg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: normalizedSvg !== svg,
    minimumTextElements: request.data.length + 3,
    minimumPathElements: request.data.length,
    minimumRectElements: 1,
    minimumGroupElements: 2,
  })
}
