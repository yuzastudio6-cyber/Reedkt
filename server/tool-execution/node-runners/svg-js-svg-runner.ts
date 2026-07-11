import type { Svg } from '@svgdotjs/svg.js'

import { createOfflineNodeRunnerResult } from './offline-node-runner-artifacts'
import {
  createOfflineNodeRunnerDeadline,
  themeTokens,
  validateSvgCardInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export async function runOfflineSvgJsOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateSvgCardInput(input)
  const [{ SVG, registerWindow }, { createSVGWindow }] = await Promise.all([
    import('@svgdotjs/svg.js'),
    import('svgdom'),
  ])
  const window = createSVGWindow()
  const document = window.document
  registerWindow(window as never, document)
  const draw = (SVG(document.documentElement) as Svg).size(request.width, request.height)
    .viewbox(0, 0, request.width, request.height)
  const colors = themeTokens(request.theme)
  draw.rect(request.width, request.height).fill(colors.background)
  draw.rect(request.width - 48, request.height - 48)
    .move(24, 24)
    .radius(18)
    .fill(request.theme === 'dark' ? '#1b1f27' : '#f7f8fb')
    .stroke({ color: colors.grid, width: 1 })
  draw.text(request.eyebrow)
    .move(52, 48)
    .font({ family: 'sans-serif', size: 13, weight: 700 })
    .fill(colors.accent)
  draw.text(request.title)
    .move(52, 82)
    .font({ family: 'sans-serif', size: 30, weight: 700 })
    .fill(colors.foreground)
  draw.text(request.body)
    .move(52, 142)
    .font({ family: 'sans-serif', size: 17, weight: 400 })
    .fill(colors.muted)
  const calloutWidth = Math.min(request.width - 104, Math.max(180, request.callout.length * 10 + 32))
  draw.rect(calloutWidth, 44)
    .move(52, request.height - 92)
    .radius(10)
    .fill(colors.accent)
  draw.text(request.callout)
    .move(68, request.height - 82)
    .font({ family: 'sans-serif', size: 15, weight: 700 })
    .fill(request.theme === 'dark' ? '#101218' : '#ffffff')
  draw.attr('data-reeditpro-library', '@svgdotjs/svg.js')
  const svg = draw.svg()
  deadline.assertWithin('SVG.js server-DOM construction')
  return createOfflineNodeRunnerResult({
    toolId: 'svg_js',
    packageName: '@svgdotjs/svg.js',
    invokedEntrypoints: ['svgdom.createSVGWindow', '@svgdotjs/svg.js.registerWindow', '@svgdotjs/svg.js.SVG'],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: false,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumTextElements: 4,
    minimumRectElements: 3,
  })
}
