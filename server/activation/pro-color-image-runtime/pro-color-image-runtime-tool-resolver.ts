import type { ProColorImageRuntimeToolResolver } from './pro-color-image-runtime-types'

export const proColorImageRuntimeToolResolvers: ProColorImageRuntimeToolResolver[] = [
  {
    toolId: 'opencolorio',
    displayName: 'OpenColorIO',
    pythonImport: 'PyOpenColorIO',
    pinnedPackage: 'opencolorio==2.4.2',
    expectedOperation: 'Load generated raw/identity config and apply deterministic RGB transform.',
    requiredForPhase40CPromotion: true,
  },
  {
    toolId: 'openimageio',
    displayName: 'OpenImageIO',
    pythonImport: 'OpenImageIO',
    pinnedPackage: 'OpenImageIO==3.0.18.1',
    expectedOperation: 'Read/write/inspect generated PNG fixtures and verify dimensions, channels, and sequence integrity.',
    requiredForPhase40CPromotion: true,
  },
  {
    toolId: 'kornia',
    displayName: 'Kornia',
    pythonImport: 'kornia',
    pinnedPackage: 'kornia==0.8.1 with torch==2.7.1+cpu from the PyTorch CPU wheel index',
    expectedOperation: 'Run CPU-only local transform and image-difference metrics on generated tensors.',
    requiredForPhase40CPromotion: true,
  },
]

export function buildProColorImageRuntimeToolResolverSummary(): ProColorImageRuntimeToolResolver[] {
  return proColorImageRuntimeToolResolvers.map((tool) => ({ ...tool }))
}
