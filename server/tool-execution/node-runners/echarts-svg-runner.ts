import * as echarts from 'echarts'

import {
  createOfflineNodeRunnerResult,
  normalizeEchartsGeneratedIdentifiers,
} from './offline-node-runner-artifacts'
import {
  createOfflineNodeRunnerDeadline,
  themeTokens,
  validateStructuredChartInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export function runOfflineEchartsSvgOperation(input: unknown): OfflineNodeRunnerResult {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateStructuredChartInput(input)
  const tokens = themeTokens(request.theme)
  deadline.assertWithin('ECharts input validation')
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: request.width,
    height: request.height,
  })
  let svg: string
  try {
    chart.setOption({
      animation: false,
      backgroundColor: tokens.background,
      textStyle: { color: tokens.foreground, fontFamily: 'sans-serif' },
      title: {
        text: request.title,
        left: 'center',
        textStyle: { color: tokens.foreground, fontSize: 18, fontWeight: 700 },
      },
      grid: { left: 64, right: 24, top: 58, bottom: 58, containLabel: false },
      xAxis: {
        type: 'category',
        name: request.xAxisLabel,
        nameLocation: 'middle',
        nameGap: 36,
        data: request.data.map((datum) => datum.label),
        axisLine: { lineStyle: { color: tokens.muted } },
        axisLabel: { color: tokens.foreground, interval: 0 },
        nameTextStyle: { color: tokens.muted },
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: request.yAxisLabel,
        nameLocation: 'middle',
        nameGap: 46,
        axisLine: { show: true, lineStyle: { color: tokens.muted } },
        axisLabel: { color: tokens.muted },
        splitLine: { lineStyle: { color: tokens.grid } },
        nameTextStyle: { color: tokens.muted },
      },
      tooltip: { show: false },
      aria: { enabled: false },
      series: [{
        type: 'bar',
        silent: true,
        data: request.data.map((datum, index) => ({
          value: datum.value,
          itemStyle: { color: index % 2 === 0 ? tokens.accent : tokens.accentSecondary, borderRadius: [4, 4, 0, 0] },
        })),
        label: { show: true, position: 'top', color: tokens.foreground },
        emphasis: { disabled: true },
      }],
    }, { notMerge: true, lazyUpdate: false, silent: true })
    deadline.assertWithin('ECharts option evaluation')
    svg = chart.renderToSVGString()
  } finally {
    chart.dispose()
  }
  deadline.assertWithin('ECharts SSR SVG render')
  const normalizedSvg = normalizeEchartsGeneratedIdentifiers(svg)
  return createOfflineNodeRunnerResult({
    toolId: 'echarts',
    packageName: 'echarts',
    invokedEntrypoints: ['echarts.init', 'ECharts.setOption', 'ECharts.renderToSVGString'],
    sourceInput: request,
    svg: normalizedSvg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: normalizedSvg !== svg,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumTextElements: request.data.length + 3,
    minimumPathElements: request.data.length,
  })
}
