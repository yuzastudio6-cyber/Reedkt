import {
  format,
  line,
  max,
  scaleBand,
  scaleLinear,
} from 'd3'

import { createOfflineNodeRunnerResult } from './offline-node-runner-artifacts'
import {
  createOfflineNodeRunnerDeadline,
  escapeXml,
  themeTokens,
  validateStructuredChartInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export function runOfflineD3SvgOperation(input: unknown): OfflineNodeRunnerResult {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateStructuredChartInput(input)
  deadline.assertWithin('D3 input validation')
  const tokens = themeTokens(request.theme)
  const margin = { top: 58, right: 24, bottom: 58, left: 64 }
  const chartWidth = request.width - margin.left - margin.right
  const chartHeight = request.height - margin.top - margin.bottom
  const maximumValue = max(request.data, (datum) => datum.value) ?? 0
  const yMaximum = maximumValue > 0 ? maximumValue * 1.1 : 1
  const xScale = scaleBand<string>()
    .domain(request.data.map((datum) => datum.label))
    .range([0, chartWidth])
    .padding(0.24)
  const yScale = scaleLinear()
    .domain([0, yMaximum])
    .nice(5)
    .range([chartHeight, 0])
  const numberFormat = format('~g')
  const trendPath = line<(typeof request.data)[number]>()
    .x((datum) => {
      const x = xScale(datum.label)
      if (x === undefined) throw new Error('D3 scaleBand failed to resolve an approved category.')
      return x + xScale.bandwidth() / 2
    })
    .y((datum) => yScale(datum.value))(request.data)
  if (!trendPath) throw new Error('D3 line generator failed to produce a bounded chart path.')
  const grid = yScale.ticks(5).map((tick) => {
    const y = yScale(tick)
    return [
      `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="${tokens.grid}" stroke-width="1"/>`,
      `<text x="-10" y="${y + 4}" text-anchor="end" fill="${tokens.muted}" font-size="11">${escapeXml(numberFormat(tick))}</text>`,
    ].join('')
  }).join('')
  const bars = request.data.map((datum, index) => {
    const x = xScale(datum.label)
    if (x === undefined) throw new Error('D3 scaleBand failed to resolve an approved category.')
    const y = yScale(datum.value)
    const height = Math.max(0, chartHeight - y)
    const fill = index % 2 === 0 ? tokens.accent : tokens.accentSecondary
    return [
      `<rect x="${x}" y="${y}" width="${xScale.bandwidth()}" height="${height}" rx="4" fill="${fill}"/>`,
      `<text x="${x + xScale.bandwidth() / 2}" y="${chartHeight + 20}" text-anchor="middle" fill="${tokens.foreground}" font-size="12">${escapeXml(datum.label)}</text>`,
      `<text x="${x + xScale.bandwidth() / 2}" y="${Math.max(12, y - 7)}" text-anchor="middle" fill="${tokens.foreground}" font-size="11">${escapeXml(numberFormat(datum.value))}</text>`,
    ].join('')
  }).join('')
  const svg = [
    `<svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${request.width}" height="${request.height}" fill="${tokens.background}"/>`,
    `<text x="${request.width / 2}" y="28" text-anchor="middle" fill="${tokens.foreground}" font-size="18" font-weight="700">${escapeXml(request.title)}</text>`,
    `<g transform="translate(${margin.left} ${margin.top})">`,
    grid,
    bars,
    `<path data-reeditpro-library="d3.line" d="${trendPath}" fill="none" stroke="${tokens.foreground}" stroke-width="1.5" stroke-opacity="0.45"/>`,
    `<text x="${chartWidth / 2}" y="${chartHeight + 48}" text-anchor="middle" fill="${tokens.muted}" font-size="12">${escapeXml(request.xAxisLabel)}</text>`,
    `<text transform="translate(-48 ${chartHeight / 2}) rotate(-90)" text-anchor="middle" fill="${tokens.muted}" font-size="12">${escapeXml(request.yAxisLabel)}</text>`,
    '</g>',
    '</svg>',
  ].join('')
  deadline.assertWithin('D3 SVG generation')
  return createOfflineNodeRunnerResult({
    toolId: 'd3',
    packageName: 'd3',
    invokedEntrypoints: ['d3.max', 'd3.scaleBand', 'd3.scaleLinear', 'd3.line', 'd3.format'],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: false,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumTextElements: request.data.length * 2 + 3,
    minimumPathElements: 1,
    minimumRectElements: request.data.length + 1,
    minimumGroupElements: 1,
  })
}
