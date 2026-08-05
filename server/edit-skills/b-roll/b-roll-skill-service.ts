import type { EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import type { EditSkillHandler, EditSkillInvocationContext } from '../core/skill-capability-registry'
import type { SkillPlanEnvelope } from '../core/skill-plan-envelope'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
import type { SkillRouteQualificationRegistry } from '../core/skill-route-qualification'
import type { BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import { BrollEditSkillPlugin } from './b-roll-edit-skill-plugin'
import { compileBrollPlan, type CompileBrollPlanResult } from './b-roll-plan-compiler'

export const BROLL_IMPLEMENTATION_STATUS = Object.freeze({
  skillImplementation: 'complete',
  planningQualification: 'qualified',
  executionQualification: 'internal_execution_qualified',
  productionQualification: 'blocked_pending_five_live_fixtures',
  liveProvider: 'blocked_pending_explicit_canary_gates',
  publicPlugin: 'available',
  orchestraIntegration: 'not_implemented_by_design',
} as const)

export class BrollSkillService implements EditSkillHandler {
  readonly #artifacts: EditSkillArtifactStore
  readonly #estimators: SkillEstimatorRegistry
  readonly #qa: SkillQaRegistry
  readonly #qualifications: SkillQualificationRegistry
  readonly #routeQualifications: SkillRouteQualificationRegistry

  constructor(input: {
    artifacts: EditSkillArtifactStore
    estimators: SkillEstimatorRegistry
    qa: SkillQaRegistry
    qualifications: SkillQualificationRegistry
    routeQualifications: SkillRouteQualificationRegistry
  }) {
    this.#artifacts = input.artifacts
    this.#estimators = input.estimators
    this.#qa = input.qa
    this.#qualifications = input.qualifications
    this.#routeQualifications = input.routeQualifications
  }

  compilePlanning(input: {
    assignment: BrollSkillAssignment
    context: BrollPlanningContext
    manifest: EditSkillInvocationContext['manifest']
  }): CompileBrollPlanResult {
    return compileBrollPlan({
      ...input,
      estimators: this.#estimators,
      qa: this.#qa,
    })
  }

  async plan(invocation: EditSkillInvocationContext): Promise<SkillPlanEnvelope> {
    const plugin = new BrollEditSkillPlugin({
      artifacts: this.#artifacts,
      estimators: this.#estimators,
      qa: this.#qa,
      qualifications: this.#qualifications,
      routeQualifications: this.#routeQualifications,
    })
    return (await plugin.planAssignment({ assignment: invocation.assignment })).envelope
  }
}
