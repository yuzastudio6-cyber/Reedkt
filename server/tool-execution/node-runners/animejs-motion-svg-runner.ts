import { animate } from 'animejs'

import { createOfflineNodeRunnerResult } from './offline-node-runner-artifacts'
import {
  createOfflineNodeRunnerDeadline,
  escapeXml,
  validateAnimeMotionInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export async function runOfflineAnimeJsMotionOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateAnimeMotionInput(input)
  const durationMilliseconds = request.durationFrames / request.fps * 1_000
  const target = { x: 56, y: request.height / 2, opacity: 0.15, scale: 0.72 }
  const animation = animate(target, {
    x: request.width - 56,
    y: request.height / 2,
    opacity: 1,
    scale: 1.08,
    duration: durationMilliseconds,
    ease: 'inOutQuad',
    autoplay: false,
  })
  const sampleFrames = [...new Set([
    0,
    Math.round(request.durationFrames * 0.125),
    Math.round(request.durationFrames * 0.25),
    Math.round(request.durationFrames * 0.5),
    Math.round(request.durationFrames * 0.75),
    Math.round(request.durationFrames * 0.875),
    request.durationFrames,
  ])].sort((left, right) => left - right)
  const samples = sampleFrames.map((frame) => {
    const timeMilliseconds = frame / request.fps * 1_000
    animation.seek(timeMilliseconds, true)
    deadline.assertWithin('Anime.js fixed timeline seek')
    return {
      frame,
      x: round(target.x),
      y: round(target.y),
      opacity: round(target.opacity),
      scale: round(target.scale),
    }
  })
  animation.cancel()
  const background = request.backgroundMode === 'opaque_panel'
    ? '<rect width="100%" height="100%" fill="#ffffff"/>'
    : ''
  const path = samples.map((sample, index) =>
    `${index === 0 ? 'M' : 'L'}${sample.x} ${sample.y}`).join(' ')
  const sampleMarks = samples.map((sample) => [
    `<circle cx="${sample.x}" cy="${sample.y}" r="${round(7 * sample.scale)}" fill="#4f6fe8" fill-opacity="${sample.opacity}"/>`,
    `<text x="${sample.x}" y="${sample.y + 24}" text-anchor="middle" fill="#646b76" font-size="10">f${sample.frame}</text>`,
  ].join('')).join('')
  const svg = [
    `<svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg" data-reeditpro-library="animejs.animate" data-motion-profile="${request.motionProfileId}">`,
    background,
    `<text x="24" y="32" fill="#17191d" font-size="18" font-weight="700">${escapeXml(request.title)}</text>`,
    `<text x="24" y="52" fill="#646b76" font-size="11">${request.fps} fps · ${request.durationFrames} frames · deterministic seek proof</text>`,
    `<path d="${path}" fill="none" stroke="#9aa8df" stroke-width="2" stroke-dasharray="5 5"/>`,
    sampleMarks,
    '</svg>',
  ].join('')
  deadline.assertWithin('Anime.js SVG proof construction')
  return createOfflineNodeRunnerResult({
    toolId: 'animejs',
    packageName: 'animejs',
    invokedEntrypoints: ['animejs.animate', 'JSAnimation.seek', 'JSAnimation.cancel'],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: true,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumTextElements: 3,
    minimumPathElements: 1,
  })
}

function round(value: number): number {
  return Number(value.toFixed(6))
}
