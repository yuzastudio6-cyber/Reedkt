import type {
  EditLevelMarkerContextPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelMarkerContextPolicy } from '../../lib/edit-level-source-understanding-rules'

export function createMockEditLevelMarkerContextPolicy(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelMarkerContextPolicy {
  return createEditLevelMarkerContextPolicy(input.level)
}

export function createAllMockEditLevelMarkerContextPolicies(): EditLevelMarkerContextPolicy[] {
  return [
    createEditLevelMarkerContextPolicy('normal'),
    createEditLevelMarkerContextPolicy('premium'),
    createEditLevelMarkerContextPolicy('ultra_premium'),
  ]
}
