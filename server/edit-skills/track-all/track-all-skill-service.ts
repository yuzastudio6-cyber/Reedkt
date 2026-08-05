import type { EditSkillPlugin } from '../core/edit-skill-plugin'
import type { EditSkillHandler, EditSkillInvocationContext } from '../core/skill-capability-registry'
import type { SkillPlanEnvelope } from '../core/skill-plan-envelope'

export class TrackAllSkillService implements EditSkillHandler {
  readonly #plugin: EditSkillPlugin

  constructor(plugin: EditSkillPlugin) { this.#plugin = plugin }

  async plan(context: EditSkillInvocationContext): Promise<SkillPlanEnvelope> {
    return (await this.#plugin.planAssignment({ assignment: context.assignment })).envelope
  }
}
