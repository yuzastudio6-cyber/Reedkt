import { filmRuntimeConfig } from './film-runtime-policy'
import type { FilmRuntimeFixturePlan } from './film-runtime-types'

export function buildFilmRuntimeFixturePlan(): FilmRuntimeFixturePlan {
  return {
    generatedFramesOnly: true,
    frameCount: filmRuntimeConfig.fixtureFrameCount,
    width: filmRuntimeConfig.fixtureWidth,
    height: filmRuntimeConfig.fixtureHeight,
    format: 'png',
    interpolationTime: filmRuntimeConfig.interpolationTime,
    subjectDescription: 'Two generated RGB frames with a bounded geometric subject moving horizontally on a synthetic background.',
    blockers: [],
    warnings: [
      'Generated-frame QA only; no user media or real-video chain is used in Phase 38C.',
      'Passing this fixture does not approve real-video slow motion or full-video interpolation.',
    ],
  }
}
