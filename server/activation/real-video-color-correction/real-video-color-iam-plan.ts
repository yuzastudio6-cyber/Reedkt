export type Phase32IamAccessMode = 'read' | 'create'

export interface Phase32IamScope {
  id: string
  bucket: string
  prefix: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  accessMode: Phase32IamAccessMode
  conditionTitle: string
  conditionDescription: string
}

export const phase32RenderServiceAccount = 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
export const phase32RenderServiceAccountMember = `serviceAccount:${phase32RenderServiceAccount}`

export const phase32ForbiddenRoles = [
  'roles/owner',
  'roles/editor',
  'roles/storage.admin',
  'roles/storage.objectAdmin',
  'roles/storage.objectUser',
]

export const phase32ForbiddenMembers = [
  'allUsers',
  'allAuthenticatedUsers',
  'serviceAccount:reeditpro-staging-api-sa@reeditpro.iam.gserviceaccount.com',
]

export const phase32IamScopes: Phase32IamScope[] = [
  viewerScope('final_export_phase31_input', 'reeditpro-staging-reeditpro-final-exports', 'activation-real-video/phase31/phase31-20260528T13060/'),
  creatorScope('analysis_phase32', 'reeditpro-staging-reeditpro-analysis-artifacts', 'activation-real-video/phase32/'),
  creatorScope('generated_assets_phase32', 'reeditpro-staging-reeditpro-generated-assets', 'activation-real-video/phase32/'),
  creatorScope('final_exports_phase32', 'reeditpro-staging-reeditpro-final-exports', 'activation-real-video/phase32/'),
  creatorScope('qa_phase32', 'reeditpro-staging-reeditpro-qa-artifacts', 'activation-real-video/phase32/'),
  creatorScope('worker_temp_phase32', 'reeditpro-staging-reeditpro-worker-temp', 'activation-real-video/phase32/'),
]

export interface Phase32IamBindingPlan {
  scope: Phase32IamScope
  member: string
  command: string[]
  conditionExpression: string
}

export interface Phase32IamPlan {
  planId: 'phase32-render-color-correction-iam'
  projectId: 'reeditpro'
  renderServiceAccountMember: string
  bindings: Phase32IamBindingPlan[]
  forbiddenRoles: string[]
  forbiddenMembers: string[]
  blockers: string[]
  warnings: string[]
}

export function buildPhase32IamConditionExpression(scope: Phase32IamScope): string {
  return `resource.name.startsWith("projects/_/buckets/${scope.bucket}/objects/${scope.prefix}")`
}

export function buildPhase32IamCondition(scope: Phase32IamScope): string {
  return [
    `expression=${buildPhase32IamConditionExpression(scope)}`,
    `title=${scope.conditionTitle}`,
    `description=${scope.conditionDescription}`,
  ].join(',')
}

export function validatePhase32IamScopes(scopes: Phase32IamScope[] = phase32IamScopes): string[] {
  const blockers: string[] = []
  for (const scope of scopes) {
    if (!scope.prefix.startsWith('activation-real-video/phase')) blockers.push(`${scope.id} does not use an activation real-video prefix.`)
    if (scope.prefix.includes('..') || scope.prefix.startsWith('/')) blockers.push(`${scope.id} has an unsafe prefix.`)
    if (scope.accessMode === 'read' && scope.role !== 'roles/storage.objectViewer') blockers.push(`${scope.id} read scope must use storage.objectViewer.`)
    if (scope.accessMode === 'create' && scope.role !== 'roles/storage.objectCreator') blockers.push(`${scope.id} create scope must use storage.objectCreator.`)
    if (phase32ForbiddenRoles.includes(scope.role)) blockers.push(`${scope.id} uses forbidden role ${scope.role}.`)
  }
  return blockers
}

export function buildPhase32IamPlan(): Phase32IamPlan {
  const blockers = validatePhase32IamScopes()
  const bindings = phase32IamScopes.map((scope): Phase32IamBindingPlan => ({
    scope,
    member: phase32RenderServiceAccountMember,
    conditionExpression: buildPhase32IamConditionExpression(scope),
    command: [
      'gcloud',
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${scope.bucket}`,
      `--member=${phase32RenderServiceAccountMember}`,
      `--role=${scope.role}`,
      `--condition=${buildPhase32IamCondition(scope)}`,
    ],
  }))
  return {
    planId: 'phase32-render-color-correction-iam',
    projectId: 'reeditpro',
    renderServiceAccountMember: phase32RenderServiceAccountMember,
    bindings,
    forbiddenRoles: phase32ForbiddenRoles,
    forbiddenMembers: phase32ForbiddenMembers,
    blockers,
    warnings: [
      'If conditional IAM is rejected, stop before broad grants.',
      'Output buckets use objectCreator only; the Phase 32 worker must not read target objects after upload.',
    ],
  }
}

export function summarizePhase32IamPlan(plan: Phase32IamPlan = buildPhase32IamPlan()): string {
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

function viewerScope(id: string, bucket: string, prefix: string): Phase32IamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectViewer',
    accessMode: 'read',
    conditionTitle: `phase32_render_view_${id}`,
    conditionDescription: `Phase 32 render worker read access for ${id}`,
  }
}

function creatorScope(id: string, bucket: string, prefix: string): Phase32IamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectCreator',
    accessMode: 'create',
    conditionTitle: `phase32_render_create_${id}`,
    conditionDescription: `Phase 32 render worker create access for ${id}`,
  }
}
