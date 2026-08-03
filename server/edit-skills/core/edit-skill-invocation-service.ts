import type { SkillCapabilityRegistry } from './skill-capability-registry'
import { hashSkillValue } from './skill-capability-manifest-hash'
import { assertSkillAssignment, assertSkillRangeMutation } from './skill-range-authority'
import type { SkillAssignment } from './skill-assignment-types'
import type { SkillPlanEnvelope } from './skill-plan-envelope'
import type { SkillResultEnvelope } from './skill-result-envelope'

export class EditSkillInvocationService {
  readonly #registry: SkillCapabilityRegistry

  constructor(registry: SkillCapabilityRegistry) { this.#registry = registry }

  async plan(assignmentInput: SkillAssignment): Promise<SkillPlanEnvelope> {
    const assignment = assertSkillAssignment(assignmentInput)
    const manifest = this.#registry.resolveManifest(assignment.manifestRef)
    const handler = this.#registry.resolveHandler(assignment.manifestRef)
    const plan = await handler.plan({ assignment, manifest })
    if (
      plan.assignmentId !== assignment.assignmentId ||
      plan.assignmentHash !== assignment.assignmentHash ||
      hashSkillValue(plan.manifestRef) !== hashSkillValue(assignment.manifestRef) ||
      hashSkillValue(plan.authorizedRange) !== hashSkillValue(assignment.authorizedRange)
    ) throw new Error('Skill plan is not bound to the exact assignment authority.')
    return plan
  }

  async execute(input: {
    assignment: SkillAssignment
    plan: SkillPlanEnvelope
  }): Promise<SkillResultEnvelope> {
    const assignment = assertSkillAssignment(input.assignment)
    const manifest = this.#registry.resolveManifest(assignment.manifestRef)
    const handler = this.#registry.resolveHandler(assignment.manifestRef)
    if (!handler.execute) throw new Error(`Skill ${manifest.skillKey} has no execution handler.`)
    if (input.plan.assignmentHash !== assignment.assignmentHash) throw new Error('Skill plan belongs to a different assignment.')
    const result = await handler.execute({ assignment, manifest }, input.plan)
    for (const mutationRange of result.mutationRanges) {
      assertSkillRangeMutation({ assignment, mutationRange })
    }
    if (
      result.assignmentHash !== assignment.assignmentHash ||
      result.planHash !== input.plan.planHash ||
      hashSkillValue(result.manifestRef) !== hashSkillValue(assignment.manifestRef)
    ) throw new Error('Skill result is not bound to the exact plan and assignment authority.')
    return result
  }
}
