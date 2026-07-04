import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryOperation,
  ProjectEditSessionRepositoryResult,
  ProjectEditSessionRepositorySummary,
} from '../../types/project-edit-session-repository'

export function createProjectEditSessionRepositorySummary(
  context: ProjectEditSessionRepositoryContext,
  operationCount = 0,
): ProjectEditSessionRepositorySummary {
  return {
    repositoryMode: context.mode,
    status: context.status,
    operationCount,
    mockOnly: context.mockOnly,
    supabaseEnabled: context.mode !== 'mock_database' && context.mode !== 'supabase_disabled',
    summary: [
      context.mode === 'mock_database'
        ? 'ProjectEditSession repository is using in-memory MockDatabase collections.'
        : 'ProjectEditSession Supabase repository is disabled until schema, auth/RLS, service-role, and deployment gates are approved.',
      'Repository covers sessions, messages, sources, memory, snapshots, versions, previews, revisions, events, card models, and bundles.',
    ],
    warnings: context.notes,
  }
}

export function createProjectEditSessionRepositoryModeSummary(
  context: ProjectEditSessionRepositoryContext,
): string {
  if (context.mode === 'mock_database') return 'MockDatabase ProjectEditSession repository ready; no Supabase reads or writes occur.'
  if (context.mode === 'supabase_disabled') return 'Supabase ProjectEditSession repository disabled; all operations return blocked results.'
  return 'Future ProjectEditSession Supabase repository mode is not enabled in this milestone.'
}

export function createProjectEditSessionOperationSummary(
  operation: ProjectEditSessionRepositoryOperation,
): string {
  return `ProjectEditSession repository operation ${operation} is handled through the RP-EDITSESSION-03 mock persistence seam.`
}

export function createProjectEditSessionBundleSummaryFromRepository(
  bundle: ProjectEditSessionBundleRecord,
): string[] {
  return [
    `Edit Chat ${bundle.session.name} (${bundle.session.id}) is loaded with status ${bundle.session.status}.`,
    `${bundle.messages.length} message(s), ${bundle.sources.length} source(s), ${bundle.memories.length} memory layer(s), and ${bundle.events.length} event(s) are included.`,
    `${bundle.snapshots.length} snapshot(s), ${bundle.versions.length} version(s), ${bundle.previews.length} preview(s), and ${bundle.revisions.length} revision(s) are included.`,
    bundle.session.preferenceDNAApplicationId
      ? 'Preference DNA metadata is present as adapted-not-copied planning context.'
      : 'No Preference DNA metadata is attached to this Edit Chat.',
  ]
}

export function createProjectEditSessionRepositoryReadinessSummary(
  context: ProjectEditSessionRepositoryContext,
): string[] {
  return [
    createProjectEditSessionRepositoryModeSummary(context),
    'Production persistence requires owner-approved schema, remote ReEditPro Supabase deployment, auth/RLS, service-role boundaries, and route/runtime gates.',
    'No API handlers, UI routes, provider/model calls, uploads, workers, render jobs, or credit reservation/spend are part of RP-EDITSESSION-03.',
  ]
}

export function createProjectEditSessionRepositoryResultSummary<T>(
  result: ProjectEditSessionRepositoryResult<T>,
): string {
  return result.ok
    ? `Repository operation succeeded in ${result.repositoryMode}; Supabase read=${result.supabaseReadMade}, write=${result.supabaseWriteMade}.`
    : `Repository operation failed in ${result.repositoryMode}: ${result.error?.message ?? 'unknown error'}.`
}
