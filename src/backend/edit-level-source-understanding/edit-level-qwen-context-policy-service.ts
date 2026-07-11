import type {
  EditLevelQwenContextPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenContextPolicy } from '../../lib/edit-level-source-understanding-rules'

export function createMockEditLevelQwenContextPolicy(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenContextPolicy {
  return createEditLevelQwenContextPolicy(input.level)
}

export function createAllMockEditLevelQwenContextPolicies(): EditLevelQwenContextPolicy[] {
  return [
    createEditLevelQwenContextPolicy('normal'),
    createEditLevelQwenContextPolicy('premium'),
    createEditLevelQwenContextPolicy('ultra_premium'),
  ]
}
