import type {
  EditLevelEstimatePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createAllEditLevelEstimatePackages,
  createEditLevelEstimatePackage,
} from '../../lib/edit-level-estimates-rules'

export function createMockEditLevelEstimatePackage(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage(input.level)
}

export function createMockEditLevelEstimatePackages(): EditLevelEstimatePackage[] {
  return createAllEditLevelEstimatePackages()
}

export function getMockEditLevelEstimatePackageByLevel(
  level: ReEditProCanonicalEditLevel,
): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage(level)
}
