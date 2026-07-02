import type {
  ProjectEditBriefBundleRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefRepositoryContext,
  ProjectEditBriefRepositoryOperation,
  ProjectEditBriefRepositoryResult,
  ProjectEditBriefRepositorySummary,
} from '../../types/project-edit-brief-repository'
import {
  createProjectEditBriefBundleReadableSummary,
  createProjectEditBriefExportSettingsSummary,
} from '../../lib/project-edit-brief-summary-mappers'

export function createProjectEditBriefRepositorySummary(
  context: ProjectEditBriefRepositoryContext,
  operationCount = 0,
): ProjectEditBriefRepositorySummary {
  return {
    repositoryMode: context.mode,
    status: context.status,
    operationCount,
    mockOnly: context.mockOnly,
    supabaseEnabled: false,
    summary: [
      context.mode === 'mock_database'
        ? 'ProjectEditBrief repository is using in-memory MockDatabase collections seeded from RP-EDITBRIEF-02 fixtures.'
        : 'ProjectEditBrief Supabase repository is disabled until schema, auth/RLS, service-role boundaries, and deployment gates are approved.',
      'Repository covers briefs, markers, attachments, Marker Chat, intent, confirmations, conflicts, revisions, application logs, export settings, timeline, drawer, bundle, and summary operations.',
    ],
    warnings: context.notes,
  }
}

export function createProjectEditBriefRepositoryModeSummary(
  context: ProjectEditBriefRepositoryContext,
): string {
  if (context.mode === 'mock_database') return 'MockDatabase ProjectEditBrief repository ready; no Supabase reads or writes occur.'
  if (context.mode === 'supabase_disabled') return 'Supabase ProjectEditBrief repository disabled; all operations return blocked results.'
  return 'Future ProjectEditBrief Supabase repository mode is not enabled in this milestone.'
}

export function createProjectEditBriefRepositoryOperationSummary(
  operation: ProjectEditBriefRepositoryOperation,
): string {
  return `ProjectEditBrief repository operation ${operation} is handled through the RP-EDITBRIEF-03 mock persistence seam.`
}

export function createProjectEditBriefBundleSummaryFromRepository(
  bundle: ProjectEditBriefBundleRecord,
): string[] {
  const summary = [
    createProjectEditBriefBundleReadableSummary(bundle),
    `${bundle.markers.length} marker(s), ${bundle.attachments.length} attachment(s), ${bundle.messages.length} Marker Chat message(s), and ${bundle.intents.length} structured intent record(s) are included.`,
    `${bundle.confirmations.length} confirmation(s), ${bundle.conflicts.length} conflict(s), ${bundle.revisions.length} revision(s), and ${bundle.applicationLogs.length} application log(s) are included.`,
    'All Edit Brief attachments remain metadata-only mock records; no uploads, file reads, storage writes, or media processing occur.',
  ]
  if (bundle.exportSettings) summary.push(createProjectEditBriefExportSettingsSummary(bundle.exportSettings))
  return summary
}

export function createProjectEditBriefRepositoryReadinessSummary(
  context: ProjectEditBriefRepositoryContext,
): string[] {
  return [
    createProjectEditBriefRepositoryModeSummary(context),
    'Production persistence requires owner-approved project_edit_briefs schema, remote ReEditPro Supabase deployment, auth/RLS, service-role boundaries, and API/runtime gates.',
    'No API handlers, UI routes, provider/model calls, uploads, workers, render jobs, or credit reservation/spend are part of RP-EDITBRIEF-03.',
  ]
}

export function createProjectEditBriefRepositoryResultSummary<T>(
  result: ProjectEditBriefRepositoryResult<T>,
): string {
  return result.ok
    ? `Repository operation succeeded in ${result.repositoryMode}; Supabase read=${result.supabaseReadMade}, write=${result.supabaseWriteMade}, storage write=${result.storageWriteMade}.`
    : `Repository operation failed in ${result.repositoryMode}: ${result.error?.message ?? 'unknown error'}.`
}
