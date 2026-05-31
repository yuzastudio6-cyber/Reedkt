import { proColorImageRuntimeConfig } from './pro-color-image-runtime-policy'
import type { ProColorImageRuntimeFixturePlan } from './pro-color-image-runtime-types'

export function buildProColorImageRuntimeFixturePlan(): ProColorImageRuntimeFixturePlan {
  return {
    mode: proColorImageRuntimeConfig.runtimeMode,
    generatedOnly: true,
    width: proColorImageRuntimeConfig.fixtureWidth,
    height: proColorImageRuntimeConfig.fixtureHeight,
    frameCount: proColorImageRuntimeConfig.fixtureFrameCount,
    fixtures: [
      'RGB color bars with Rec.709-style primary/secondary patches.',
      'Horizontal and vertical gradients for gamma/linear transform sanity checks.',
      'RGBA alpha checker patch for channel and metadata validation.',
    ],
    expectedOperations: [
      'OpenColorIO loads a generated raw/identity config and applies a deterministic RGB transform.',
      'OpenImageIO reads and writes generated image fixtures and validates dimensions/channels/metadata.',
      'Kornia runs CPU-only local transforms and image metrics on generated tensors.',
    ],
    blockers: [],
    warnings: ['Generated fixtures do not prove controlled real-video pro color/image safety.'],
  }
}
