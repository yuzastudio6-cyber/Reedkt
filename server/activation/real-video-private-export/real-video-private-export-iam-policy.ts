export type Phase30BIamAccessMode = 'read' | 'create'

export interface Phase30BIamScope {
  id: string
  bucket: string
  prefix: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  accessMode: Phase30BIamAccessMode
  conditionTitle: string
  conditionDescription: string
}

export const phase30BRenderServiceAccount = 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
export const phase30BRenderServiceAccountMember = `serviceAccount:${phase30BRenderServiceAccount}`

export const phase30BForbiddenRoles = [
  'roles/owner',
  'roles/editor',
  'roles/storage.admin',
  'roles/storage.objectAdmin',
  'roles/storage.objectUser',
]

export const phase30BForbiddenMembers = [
  'allUsers',
  'allAuthenticatedUsers',
  'serviceAccount:reeditpro-staging-api-sa@reeditpro.iam.gserviceaccount.com',
]

export const phase30BIamScopes: Phase30BIamScope[] = [
  viewerScope('source_phase28', 'reeditpro-staging-reeditpro-source-media', 'activation-real-video/phase28/phase28-20260528T01552/'),
  viewerScope('analysis_phase28', 'reeditpro-staging-reeditpro-analysis-artifacts', 'activation-real-video/phase28/phase28-20260528T01552/'),
  viewerScope('transcripts_phase28', 'reeditpro-staging-reeditpro-transcripts', 'activation-real-video/phase28/phase28-20260528T01552/'),
  viewerScope('qa_phase28', 'reeditpro-staging-reeditpro-qa-artifacts', 'activation-real-video/phase28/phase28-20260528T01552/'),
  viewerScope('analysis_phase29', 'reeditpro-staging-reeditpro-analysis-artifacts', 'activation-real-video/phase29/phase29-20260528T02254/'),
  viewerScope('transcripts_phase29', 'reeditpro-staging-reeditpro-transcripts', 'activation-real-video/phase29/phase29-20260528T02254/'),
  viewerScope('qa_phase29', 'reeditpro-staging-reeditpro-qa-artifacts', 'activation-real-video/phase29/phase29-20260528T02254/'),
  creatorScope('final_exports_phase30', 'reeditpro-staging-reeditpro-final-exports', 'activation-real-video/phase30/'),
  creatorScope('previews_phase30', 'reeditpro-staging-reeditpro-previews', 'activation-real-video/phase30/'),
  creatorScope('qa_phase30', 'reeditpro-staging-reeditpro-qa-artifacts', 'activation-real-video/phase30/'),
  creatorScope('worker_temp_phase30', 'reeditpro-staging-reeditpro-worker-temp', 'activation-real-video/phase30/'),
]

export function buildPhase30BIamConditionExpression(scope: Phase30BIamScope): string {
  return `resource.name.startsWith("projects/_/buckets/${scope.bucket}/objects/${scope.prefix}")`
}

export function buildPhase30BIamCondition(scope: Phase30BIamScope): string {
  return [
    `expression=${buildPhase30BIamConditionExpression(scope)}`,
    `title=${scope.conditionTitle}`,
    `description=${scope.conditionDescription}`,
  ].join(',')
}

export function validatePhase30BIamScopes(scopes: Phase30BIamScope[] = phase30BIamScopes): string[] {
  const blockers: string[] = []
  for (const scope of scopes) {
    if (!scope.prefix.startsWith('activation-real-video/phase')) blockers.push(`${scope.id} does not use an activation real-video prefix.`)
    if (scope.prefix.includes('..') || scope.prefix.startsWith('/')) blockers.push(`${scope.id} has an unsafe prefix.`)
    if (scope.accessMode === 'read' && scope.role !== 'roles/storage.objectViewer') blockers.push(`${scope.id} read scope must use storage.objectViewer.`)
    if (scope.accessMode === 'create' && scope.role !== 'roles/storage.objectCreator') blockers.push(`${scope.id} create scope must use storage.objectCreator.`)
    if (phase30BForbiddenRoles.includes(scope.role)) blockers.push(`${scope.id} uses forbidden role ${scope.role}.`)
  }
  return blockers
}

function viewerScope(id: string, bucket: string, prefix: string): Phase30BIamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectViewer',
    accessMode: 'read',
    conditionTitle: `phase30b_render_view_${id}`,
    conditionDescription: `Phase 30B render worker read access for ${id}`,
  }
}

function creatorScope(id: string, bucket: string, prefix: string): Phase30BIamScope {
  return {
    id,
    bucket,
    prefix,
    role: 'roles/storage.objectCreator',
    accessMode: 'create',
    conditionTitle: `phase30b_render_create_${id}`,
    conditionDescription: `Phase 30B render worker create access for ${id}`,
  }
}
