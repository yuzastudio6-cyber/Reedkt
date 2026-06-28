import type {
  EditLevelSourceUnderstandingPolicyPackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelSourceUnderstandingPolicyPackage } from '../../lib/edit-level-source-understanding-rules'

export function createMockEditLevelSourceUnderstandingPackage(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelSourceUnderstandingPolicyPackage {
  return createEditLevelSourceUnderstandingPolicyPackage(input.level)
}

export function createMockEditLevelSourceUnderstandingPackages(): EditLevelSourceUnderstandingPolicyPackage[] {
  return [
    createEditLevelSourceUnderstandingPolicyPackage('normal'),
    createEditLevelSourceUnderstandingPolicyPackage('premium'),
    createEditLevelSourceUnderstandingPolicyPackage('ultra_premium'),
  ]
}

export function getMockEditLevelSourceUnderstandingPackageByLevel(
  level: ReEditProCanonicalEditLevel,
): EditLevelSourceUnderstandingPolicyPackage {
  return createEditLevelSourceUnderstandingPolicyPackage(level)
}
