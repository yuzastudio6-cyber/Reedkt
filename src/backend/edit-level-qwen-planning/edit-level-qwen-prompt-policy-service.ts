import type {
  EditLevelQwenPromptPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenPromptPolicy } from '../../lib/edit-level-qwen-planning-rules'

export function createMockEditLevelQwenPromptPolicy(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenPromptPolicy {
  return createEditLevelQwenPromptPolicy(input.level)
}

export function createAllMockEditLevelQwenPromptPolicies(): EditLevelQwenPromptPolicy[] {
  return [
    createEditLevelQwenPromptPolicy('normal'),
    createEditLevelQwenPromptPolicy('premium'),
    createEditLevelQwenPromptPolicy('ultra_premium'),
  ]
}
