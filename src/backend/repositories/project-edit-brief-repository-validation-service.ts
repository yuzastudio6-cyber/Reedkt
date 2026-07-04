import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefRecord,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefRepositoryContext,
  ProjectEditBriefRepositoryOperation,
  ProjectEditBriefRepositoryResult,
} from '../../types/project-edit-brief-repository'
import type { ServiceResult } from '../service-result'
import { fail, ok } from '../service-result'

export function validateProjectEditBriefRepositoryContext(
  context: ProjectEditBriefRepositoryContext,
): ServiceResult<{ context: ProjectEditBriefRepositoryContext }> {
  if (!context.mockOnly) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditBrief repository context must remain mockOnly in RP-EDITBRIEF-03.', context)
  }
  if (context.mode === 'mock_database' && context.writeSafety !== 'mock_write_only') {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'Mock ProjectEditBrief repository must use mock_write_only safety.', context)
  }
  if (context.mode === 'supabase_disabled' && context.writeSafety !== 'supabase_write_disabled') {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'Disabled Supabase ProjectEditBrief repository must use supabase_write_disabled safety.', context)
  }
  return ok({ context })
}

export function validateProjectEditBriefRepositoryOperationAllowed(
  context: ProjectEditBriefRepositoryContext,
  operation: ProjectEditBriefRepositoryOperation,
): ServiceResult<{ operation: ProjectEditBriefRepositoryOperation }> {
  const contextValidation = validateProjectEditBriefRepositoryContext(context)
  if (!contextValidation.ok) return contextValidation
  if (context.mode === 'supabase_disabled') {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_DISABLED', `Supabase ProjectEditBrief repository blocks ${operation} until edit_briefs/edit_cues schema roots, auth/RLS, explicit Data API grants, service-role, and deployment gates are ready.`, {
      operation,
      status: context.status,
    })
  }
  return ok({ operation })
}

export function validateProjectEditBriefRecord(
  brief: ProjectEditBriefRecord,
): ServiceResult<{ brief: ProjectEditBriefRecord }> {
  const warnings: string[] = []
  if (!brief.id) warnings.push('Brief ID is missing.')
  if (!brief.projectId) warnings.push('Project ID is missing.')
  if (!brief.editSessionId) warnings.push('Edit Session ID is missing.')
  if (!brief.title) warnings.push('Brief title is missing.')
  if (!brief.mockOnly) warnings.push('Brief is not marked mockOnly.')
  if (warnings.length) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditBrief record failed validation.', {
      briefId: brief.id,
      warnings,
    })
  }
  return ok({ brief })
}

export function validateProjectEditBriefBundle(
  bundle: ProjectEditBriefBundleRecord,
): ServiceResult<{ bundle: ProjectEditBriefBundleRecord }> {
  const childRecords = [
    ...bundle.markers,
    ...bundle.attachments,
    ...bundle.messages,
    ...bundle.intents,
    ...bundle.confirmations,
    ...bundle.conflicts,
    ...bundle.revisions,
    ...bundle.applicationLogs,
  ]
  const childrenMatch = childRecords.every((record) =>
    record.projectId === bundle.brief.projectId
    && record.editSessionId === bundle.brief.editSessionId
    && record.briefId === bundle.brief.id
    && record.mockOnly,
  )
  const exportSettingsMatch = !bundle.exportSettings
    || (bundle.exportSettings.editSessionId === bundle.brief.editSessionId && bundle.exportSettings.mockOnly)

  if (!bundle.mockOnly || !bundle.brief.mockOnly || !childrenMatch || !exportSettingsMatch) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditBrief bundle failed mock/link validation.', {
      briefId: bundle.brief.id,
    })
  }
  return ok({ bundle }, bundle.warnings)
}

export function validateProjectEditBriefDrawerModel(
  drawer: ProjectEditBriefMarkerDrawerModel,
): ServiceResult<{ drawer: ProjectEditBriefMarkerDrawerModel }> {
  if (!drawer.mockOnly || !drawer.marker.id || drawer.attachments.some((attachment) => !attachment.mockOnly)) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditBrief drawer model failed validation.', drawer)
  }
  return ok({ drawer }, drawer.warnings)
}

export function validateProjectEditSessionExportSettings(
  settings: ProjectEditSessionExportSettingsRecord,
): ServiceResult<{ settings: ProjectEditSessionExportSettingsRecord }> {
  if (!settings.id || !settings.editSessionId || !settings.projectId || !settings.mockOnly) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession export settings failed Edit Brief repository validation.', settings)
  }
  return ok({ settings })
}

export function validateProjectEditBriefRepositoryResultSafety<T>(
  result: ProjectEditBriefRepositoryResult<T>,
): ServiceResult<{ result: ProjectEditBriefRepositoryResult<T> }> {
  const unsafe = [
    !result.mockOnly,
    result.supabaseReadMade,
    result.supabaseWriteMade,
    result.storageReadMade,
    result.storageWriteMade,
    result.fileBytesRead,
    result.externalUrlFetched,
    result.mediaProcessingStarted,
    result.providerCallMade,
    result.workerJobCreated,
    result.generationRequestCreated,
    result.renderJobCreated,
    result.creditReservedOrSpent,
  ].some(Boolean)

  if (unsafe) {
    return fail('PROJECT_EDIT_BRIEF_REPOSITORY_VALIDATION_FAILED', 'ProjectEditBrief repository result reported a forbidden side effect.', result)
  }
  return ok({ result })
}

export function createProjectEditBriefRepositoryValidationSummary(input: {
  context: ProjectEditBriefRepositoryContext
  bundle?: ProjectEditBriefBundleRecord
  result?: ProjectEditBriefRepositoryResult<unknown>
}): string[] {
  const summary = [
    `Repository context mode=${input.context.mode}, status=${input.context.status}, mockOnly=${input.context.mockOnly}.`,
    'Supabase, storage, file-byte, URL fetch, media processing, provider, worker, generation, render, and credit flags must remain false in RP-EDITBRIEF-03.',
  ]
  if (input.bundle) {
    summary.push(`Bundle brief=${input.bundle.brief.id}; markers=${input.bundle.markers.length}; messages=${input.bundle.messages.length}; conflicts=${input.bundle.conflicts.length}.`)
  }
  if (input.result) {
    summary.push(`Result ok=${input.result.ok}; supabaseRead=${input.result.supabaseReadMade}; supabaseWrite=${input.result.supabaseWriteMade}; provider=${input.result.providerCallMade}.`)
  }
  return summary
}
