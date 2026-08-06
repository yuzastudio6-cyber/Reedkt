import type {
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelToolRoutingPackage } from '../../lib/edit-level-tool-router-rules'

export function createMockEditLevelToolRoutingPackage(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelToolRoutingPackage {
  return createEditLevelToolRoutingPackage(input.level)
}

export function createMockEditLevelToolRoutingPackages(): EditLevelToolRoutingPackage[] {
  return [
    createEditLevelToolRoutingPackage('normal'),
    createEditLevelToolRoutingPackage('premium'),
    createEditLevelToolRoutingPackage('ultra_premium'),
  ]
}

export function getMockEditLevelToolRoutingPackageByLevel(
  level: ReEditProCanonicalEditLevel,
): EditLevelToolRoutingPackage {
  return createEditLevelToolRoutingPackage(level)
}
