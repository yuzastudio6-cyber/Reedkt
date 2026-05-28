import {
  buildPhase30BIamCondition,
  buildPhase30BIamConditionExpression,
  phase30BForbiddenMembers,
  phase30BForbiddenRoles,
  phase30BIamScopes,
  phase30BRenderServiceAccountMember,
  validatePhase30BIamScopes,
  type Phase30BIamScope,
} from './real-video-private-export-iam-policy'

export interface Phase30BIamBindingPlan {
  scope: Phase30BIamScope
  member: string
  command: string[]
  conditionExpression: string
}

export interface Phase30BIamPlan {
  planId: 'phase30b-render-private-export-iam'
  projectId: 'reeditpro'
  renderServiceAccountMember: string
  bindings: Phase30BIamBindingPlan[]
  forbiddenRoles: string[]
  forbiddenMembers: string[]
  blockers: string[]
  warnings: string[]
}

export function buildPhase30BIamPlan(): Phase30BIamPlan {
  const blockers = validatePhase30BIamScopes()
  const bindings = phase30BIamScopes.map((scope): Phase30BIamBindingPlan => ({
    scope,
    member: phase30BRenderServiceAccountMember,
    conditionExpression: buildPhase30BIamConditionExpression(scope),
    command: [
      'gcloud',
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${scope.bucket}`,
      `--member=${phase30BRenderServiceAccountMember}`,
      `--role=${scope.role}`,
      `--condition=${buildPhase30BIamCondition(scope)}`,
    ],
  }))
  return {
    planId: 'phase30b-render-private-export-iam',
    projectId: 'reeditpro',
    renderServiceAccountMember: phase30BRenderServiceAccountMember,
    bindings,
    forbiddenRoles: phase30BForbiddenRoles,
    forbiddenMembers: phase30BForbiddenMembers,
    blockers,
    warnings: [
      'If conditional IAM is rejected, stop before broad grants.',
      'Output buckets use objectCreator only; the Phase 30B worker must not read target objects after upload/copy.',
    ],
  }
}

export function summarizePhase30BIamPlan(plan: Phase30BIamPlan = buildPhase30BIamPlan()): string {
  return [
    `IAM plan: ${plan.planId}`,
    `Project: ${plan.projectId}`,
    `Render service account: ${plan.renderServiceAccountMember}`,
    '',
    'Bindings:',
    ...plan.bindings.map((binding) => `- ${binding.scope.role} on gs://${binding.scope.bucket}/${binding.scope.prefix} if ${binding.conditionExpression}`),
    '',
    'Forbidden roles:',
    ...plan.forbiddenRoles.map((role) => `- ${role}`),
    '',
    'Forbidden members:',
    ...plan.forbiddenMembers.map((member) => `- ${member}`),
    '',
    'Blockers:',
    ...(plan.blockers.length ? plan.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...plan.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}
