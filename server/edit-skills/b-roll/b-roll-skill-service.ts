import type { EditSkillHandler } from '../core/skill-capability-registry'

export const BROLL_IMPLEMENTATION_PENDING_MESSAGE =
  'B-roll orchestra invocation is disabled until planning qualification passes.'

export class BrollSkillService implements EditSkillHandler {
  async plan(): Promise<never> {
    throw new Error(BROLL_IMPLEMENTATION_PENDING_MESSAGE)
  }
}
