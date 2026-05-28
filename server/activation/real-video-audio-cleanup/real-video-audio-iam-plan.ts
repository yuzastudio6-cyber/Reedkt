export type Phase31IamAccessMode = 'read' | 'create'

export interface Phase31IamScope {
  id: string
  bucket: string
  prefix: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  accessMode: Phase31IamAccessMode
  conditionTitle: string
  conditionDescription: string
}

export const phase31RenderServiceAccount = 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
export const phase31RenderServiceAccountMember = `serviceAccount:${phase31RenderServiceAccount}`

export const phase31ForbiddenRoles = [
  'roles/owner',
  'roles/editor',
  'roles/storage.admin',
  'roles/storage.objectAdmin',
  'roles/storage.objectUser',
]

export const phase31ForbiddenMembers = [
  'allUsers',
  'allAuthenticatedUsers',
  'serviceAccount:reeditpro-staging-api-sa@reeditpro.iam.gserviceaccount.com',
]

export const phase31IamScopes: Phase31IamScope[] = [
  viewerScope('final_export_phase30_input', 'reeditpro-staging-reeditpro-final-exports', 'activation-real-video/phase30/phase30-20260528T12421/'),
  creatorScope('generated_assets_phase31', 'reeditpro-staging-reeditpro-generated-assets', 'activation-real-video/phase31/'),
  creatorScope('final_exports_phase31', 'reeditpro-staging-reeditpro-final-exports', 'activation-real-video/phase31/'),
  creatorScope('qa_phase31', 'reeditpro-staging-reeditpro-qa-artifacts', 'activation-real-video/phase31/'),
  creatorScope('worker_temp_phase31', 'reeditpro-staging-reeditpro-worker-temp', 'activation-real-video/phase31/'),
]

export interface Phase31IamBindingPlan {
  scope: Phase31IamScope
  member: string
  command: string[]
  conditionExpression: string
}

export interface Phase31IamPlan {
  planId: 'phase31-render-audio-cleanup-iam'
  projectId: 'reeditpro'
  renderServiceAccountMember: string
  bindings: Phase31IamBindingPlan[]
  forbiddenRoles: string[]
  forbiddenMembers: string[]
  blockers: string[]
  warnings: string[]
}

export function buildPhase31IamConditionExpression(scope: Phase31IamScope): string {
  return `resource.name.startsWith("projects/_/buckets/${scope.bucket}/objects/${scope.prefix}")`
}

export function buildPhase31IamCondition(scope: Phase31IamScope): string {
  return [
    `expression=${buildPhase31IamConditionExpression(scope)}`,
    `title=${scope.conditionTitle}`,
    `description=${scope.conditionDescription}`,
  ].join(',')
}

export function validatePhase31IamScopes(scopes: Phase31IamScope[] = phase31IamScopes): string[] {
  const blockers: string[] = []
  for (const scope of scopes) {
    if (!scope.prefix.startsWith('activation-real-video/phase')) blockers.push(`${scope.id} does not use an activation real-video prefix.`)
    if (scope.prefix.includes('..') || scope.prefix.startsWith('/')) blockers.push(`${scope.id} has an unsafe prefix.`)
    if (scope.accessMode === 'read' && scope.role !== 'roles/storage.objectViewer') blockers.push(`${scope.id} read scope must use storage.objectViewer.`)
    if (scope.accessMode === 'create' && scope.role !== 'roles/storage.objectCreator') blockers.push(`${scope.id} create scope must use storage.objectCreator.`)
    if (phase31ForbiddenRoles.includes(scope.role)) blockers.push(`${scope.id} uses forbidden role ${scope.role}.`)
  }
  return blockers
}

export function buildPhase31IamPlan(): Phase31IamPlan {
  const blockers = validatePhase31IamScopes()
  const bindings = phase31IamScopes.map((scope): Phase31IamBindingPlan => ({
    scope,
    member: phase31RenderServiceAccountMember,
    conditionExpression: buildPhase31IamConditionExpression(scope),
    command: [
      'gcloud',
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${scope.bucket}`,
      `--member=${phase31RenderServiceAccountMember}`,
      `--role=${scope.role}`,
      `--condition=${buildPhase31IamCondition(scope)}`,
    ],
  }))
  return {
    planId: 'phase31-render-audio-cleanup-iam',
    projectId: 'reeditpro',
    renderServiceAccountMember: phase31RenderServiceAccountMember,
    bindings,
    forbiddenRoles: phase31ForbiddenRoles,
    forbiddenMembers: phase31ForbiddenMembers,
    blockers,
    warnings: [
      'If conditional IAM is rejected, stop before broad grants.',
      'Output buckets use objectCreator only; the Phase 31 worker must not read target objects after upload.',
    ],
  }
}

export function summarizePhase31IamPlan(plan: Phase31IamPlan = buildPhase31IamPlan()): string {
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

function viewerScope(id: string, bucket: string, prefix: string): Phase31IamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectViewer',
    accessMode: 'read',
    conditionTitle: `phase31_render_view_${id}`,
    conditionDescription: `Phase 31 render worker read access for ${id}`,
  }
}

function creatorScope(id: string, bucket: string, prefix: string): Phase31IamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectCreator',
    accessMode: 'create',
    conditionTitle: `phase31_render_create_${id}`,
    conditionDescription: `Phase 31 render worker create access for ${id}`,
  }
}
