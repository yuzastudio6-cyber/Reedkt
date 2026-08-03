import type { EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import type { EditSkillHandler, EditSkillInvocationContext } from '../core/skill-capability-registry'
import { createSkillPlanEnvelope, type SkillPlanEnvelope } from '../core/skill-plan-envelope'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import { brollPlanningContextSchema, brollSkillAssignmentSchema } from './b-roll-schemas'
import { compileBrollPlan, type CompileBrollPlanResult } from './b-roll-plan-compiler'

export const BROLL_ORCHESTRA_INTEGRATION_STATUS_MESSAGE =
  'B-roll exposes a qualified public plugin boundary; future orchestra integration remains pending.'

export class BrollSkillService implements EditSkillHandler {
  readonly #artifacts: EditSkillArtifactStore
  readonly #estimators: SkillEstimatorRegistry
  readonly #qa: SkillQaRegistry

  constructor(input: {
    artifacts: EditSkillArtifactStore
    estimators: SkillEstimatorRegistry
    qa: SkillQaRegistry
  }) {
    this.#artifacts = input.artifacts
    this.#estimators = input.estimators
    this.#qa = input.qa
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
    const assignmentRef = invocation.assignment.contextArtifactRefs.find((ref) => ref.artifactType === 'b_roll_assignment_v1')
    const contextRef = invocation.assignment.contextArtifactRefs.find((ref) => ref.artifactType === 'b_roll_context_manifest_v1')
    if (!assignmentRef || !contextRef) throw new Error('B-roll invocation requires assignment and context artifacts.')
    const scope = {
      ownerUserId: invocation.assignment.ownerUserId,
      workspaceId: invocation.assignment.workspaceId,
      projectId: invocation.assignment.projectId,
    }
    const assignment = brollSkillAssignmentSchema.parse(await this.#artifacts.readJson({ reference: assignmentRef, ...scope }))
    const context = brollPlanningContextSchema.parse(await this.#artifacts.readJson({ reference: contextRef, ...scope }))
    const compiled = this.compilePlanning({ assignment, context, manifest: invocation.manifest })
    const plan = compiled.plan
    await this.#artifacts.putJson({
      artifactType: 'b_roll_planning_qa_report_v1',
      value: compiled.planningQaReport,
      ...scope,
    })
    await this.#artifacts.putJson({ artifactType: 'b_roll_plan_v1', value: plan, ...scope })
    const disposition = plan.decision === 'use_no_broll'
      ? 'use_no_action' as const
      : plan.decision === 'needs_other_skill'
        ? 'needs_other_skill' as const
        : plan.decision === 'needs_user_confirmation'
          ? 'needs_user_review' as const
          : plan.decision === 'blocked' ? 'blocked' as const : 'use_skill' as const
    return createSkillPlanEnvelope({
      schemaVersion: 'edit-skill-plan-envelope-v1',
      planId: plan.planId,
      assignmentId: invocation.assignment.assignmentId,
      assignmentHash: invocation.assignment.assignmentHash,
      manifestRef: invocation.assignment.manifestRef,
      authorizedRange: invocation.assignment.authorizedRange,
      disposition,
      payloadArtifactType: 'b_roll_plan_v1',
      payloadHash: plan.planHash,
      ...(disposition === 'needs_other_skill' ? { dependencySkillKey: 'track_all' } : {}),
    })
  }
}
