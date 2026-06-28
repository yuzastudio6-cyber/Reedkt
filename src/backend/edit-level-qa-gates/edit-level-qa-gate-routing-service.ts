import type {
  EditLevelQAGatePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createAllEditLevelQAGatePackages,
  createEditLevelQAGatePackage,
} from '../../lib/edit-level-qa-gates-rules'

export function createMockEditLevelQAGatePackage(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQAGatePackage {
  return createEditLevelQAGatePackage(input.level)
}

export function createMockEditLevelQAGatePackages(): EditLevelQAGatePackage[] {
  return createAllEditLevelQAGatePackages()
}

export function getMockEditLevelQAGatePackageByLevel(
  level: ReEditProCanonicalEditLevel,
): EditLevelQAGatePackage {
  return createEditLevelQAGatePackage(level)
}
