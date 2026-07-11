import * as vega from 'vega'

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

export async function runOfflineVegaSvgOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateStructuredChartInput(input)
  const tokens = themeTokens(request.theme)
  deadline.assertWithin('Vega input validation')
  const specification: vega.Spec = {
    $schema: 'https://vega.github.io/schema/vega/v6.json',
    width: request.width,
    height: request.height,
    padding: { top: 42, left: 14, right: 14, bottom: 8 },
    background: tokens.background,
    autosize: { type: 'pad', contains: 'padding' },
    data: [{ name: 'table', values: request.data.map((datum, index) => ({ ...datum, seriesIndex: index })) }],
    scales: [
      {
        name: 'xscale',
        type: 'band',
        domain: { data: 'table', field: 'label' },
        range: 'width',
        padding: 0.24,
      },
      {
        name: 'yscale',
        type: 'linear',
        domain: { data: 'table', field: 'value' },
        domainMin: 0,
        nice: true,
        zero: true,
        range: 'height',
      },
      {
        name: 'colorscale',
        type: 'ordinal',
        domain: [0, 1],
        range: [tokens.accent, tokens.accentSecondary],
      },
    ],
    axes: [
      {
        orient: 'bottom',
        scale: 'xscale',
        title: request.xAxisLabel,
        labelColor: tokens.foreground,
        titleColor: tokens.muted,
        domainColor: tokens.muted,
        tickColor: tokens.muted,
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
      {
        orient: 'left',
        scale: 'yscale',
        title: request.yAxisLabel,
        labelColor: tokens.muted,
        titleColor: tokens.muted,
        domainColor: tokens.muted,
        tickColor: tokens.muted,
        grid: true,
        gridColor: tokens.grid,
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
    ],
    title: {
      text: request.title,
      color: tokens.foreground,
      font: 'sans-serif',
      fontSize: 18,
      fontWeight: 700,
      anchor: 'middle',
    },
    marks: [
      {
        type: 'rect',
        from: { data: 'table' },
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'label' },
            width: { scale: 'xscale', band: 1 },
            y: { scale: 'yscale', field: 'value' },
            y2: { scale: 'yscale', value: 0 },
            fill: { scale: 'colorscale', signal: 'datum.seriesIndex % 2' },
            cornerRadiusTopLeft: { value: 4 },
            cornerRadiusTopRight: { value: 4 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'table' },
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'label', band: 0.5 },
            y: { scale: 'yscale', field: 'value', offset: -7 },
            align: { value: 'center' },
            baseline: { value: 'bottom' },
            text: { field: 'value' },
            fill: { value: tokens.foreground },
            font: { value: 'sans-serif' },
            fontSize: { value: 11 },
          },
        },
      },
    ],
  }
  const runtime = vega.parse(specification)
  deadline.assertWithin('Vega parse')
  const view = new vega.View(runtime, { renderer: 'none', logLevel: vega.Warn })
  let svg: string
  try {
    svg = await awaitWithOfflineDeadline(view.toSVG(), deadline, 'Vega SVG render')
  } finally {
    view.finalize()
  }
  deadline.assertWithin('Vega SVG verification handoff')
  const normalizedSvg = normalizeVegaGeneratedIdentifiers(svg)
  return createOfflineNodeRunnerResult({
    toolId: 'vega',
    packageName: 'vega',
    invokedEntrypoints: ['vega.parse', 'vega.View.toSVG'],
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
