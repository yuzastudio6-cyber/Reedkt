import type { Sam2RuntimeFixturePlan } from './sam2-runtime-types'

export function buildSam2RuntimeFixturePlan(): Sam2RuntimeFixturePlan {
  return {
    generatedFixtureOnly: true,
    frameCount: 5,
    width: 512,
    height: 512,
    format: 'png',
    promptType: 'box',
    initialPrompt: [168, 176, 336, 344],
    subjectDescription: 'Generated high-contrast rounded synthetic subject moving slightly across five frames.',
    blockers: [],
    warnings: [
      'Generated fixture runtime QA does not prove real-video temporal stability.',
      'Human visual review is still required before broader mask or text-behind-subject use.',
    ],
  }
}
