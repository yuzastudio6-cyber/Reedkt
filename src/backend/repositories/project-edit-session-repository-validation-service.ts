import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryOperation,
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
import type {
  ProjectEditSessionCardModel,
  ProjectEditSessionRecord,
} from '../../types/project-edit-session'
import type { ServiceResult } from '../service-result'
import { fail, ok } from '../service-result'

export function validateProjectEditSessionRepositoryContext(
  context: ProjectEditSessionRepositoryContext,
): ServiceResult<{ context: ProjectEditSessionRepositoryContext }> {
  if (!context.mockOnly) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession repository context must remain mockOnly in RP-EDITSESSION-03.', context)
  }
  if (context.mode === 'mock_database' && context.writeSafety !== 'mock_write_only') {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'Mock ProjectEditSession repository must use mock_write_only safety.', context)
  }
  if (context.mode === 'supabase_disabled' && context.writeSafety !== 'supabase_write_disabled') {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'Disabled Supabase ProjectEditSession repository must use supabase_write_disabled safety.', context)
  }
  return ok({ context })
}

export function validateProjectEditSessionRepositoryOperationAllowed(
  context: ProjectEditSessionRepositoryContext,
  operation: ProjectEditSessionRepositoryOperation,
): ServiceResult<{ operation: ProjectEditSessionRepositoryOperation }> {
  const contextValidation = validateProjectEditSessionRepositoryContext(context)
  if (!contextValidation.ok) return contextValidation
  if (context.mode === 'supabase_disabled') {
    return fail('EDIT_PREFERENCE_REPOSITORY_DISABLED', `Supabase ProjectEditSession repository blocks ${operation} until schema, auth/RLS, service-role, and deployment gates are ready.`, {
      operation,
      status: context.status,
    })
  }
  return ok({ operation })
}

export function validateProjectEditSessionRecord(
  session: ProjectEditSessionRecord,
): ServiceResult<{ session: ProjectEditSessionRecord }> {
  const warnings: string[] = []
  if (!session.id) warnings.push('Session ID is missing.')
  if (!session.projectId) warnings.push('Project ID is missing.')
  if (!session.name) warnings.push('Session name is missing.')
  if (!session.mockOnly) warnings.push('Session is not marked mockOnly.')
  if (!session.doNotCopyRulesActive) warnings.push('Do-not-copy rules are inactive.')
  if (warnings.length) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession record failed validation.', {
      sessionId: session.id,
      warnings,
    })
  }
  return ok({ session })
}

export function validateProjectEditSessionCardModel(
  cardModel: ProjectEditSessionCardModel,
): ServiceResult<{ cardModel: ProjectEditSessionCardModel }> {
  if (!cardModel.mockOnly || !cardModel.id || !cardModel.projectId) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession card model failed validation.', cardModel)
  }
  return ok({ cardModel })
}

export function validateProjectEditSessionBundle(
  bundle: ProjectEditSessionBundleRecord,
): ServiceResult<{ bundle: ProjectEditSessionBundleRecord }> {
  const allChildrenMatch = [
    ...bundle.messages,
    ...bundle.sources,
    ...bundle.memories,
    ...bundle.snapshots,
    ...bundle.versions,
    ...bundle.previews,
    ...bundle.revisions,
    ...bundle.events,
  ].every((record) => record.editSessionId === bundle.session.id && record.projectId === bundle.session.projectId && record.mockOnly)

  if (!bundle.mockOnly || !bundle.session.mockOnly || !bundle.cardModel.mockOnly || !allChildrenMatch) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession bundle failed mock/link validation.', {
      editSessionId: bundle.session.id,
    })
  }
  return ok({ bundle }, bundle.warnings)
}

export function validateNoProjectEditSessionSupabaseWriteInMock<T>(
  result: ProjectEditSessionRepositoryResult<T>,
): ServiceResult<{ result: ProjectEditSessionRepositoryResult<T> }> {
  if (result.supabaseReadMade || result.supabaseWriteMade) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession repository result reported a Supabase read or write.', result)
  }
  return ok({ result })
}

export function validateNoProjectEditSessionSideEffects<T>(
  result: ProjectEditSessionRepositoryResult<T>,
): ServiceResult<{ result: ProjectEditSessionRepositoryResult<T> }> {
  const unsafe = [
    result.storageReadMade,
    result.storageWriteMade,
    result.providerCallMade,
    result.workerJobCreated,
    result.renderJobCreated,
    result.creditReservedOrSpent,
  ].some(Boolean)
  if (unsafe) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession repository result reported a forbidden side effect.', result)
  }
  return validateNoProjectEditSessionSupabaseWriteInMock(result)
}

export function validateProjectEditSessionRepositoryResultSafety<T>(
  result: ProjectEditSessionRepositoryResult<T>,
): ServiceResult<{ result: ProjectEditSessionRepositoryResult<T> }> {
  if (!result.mockOnly) {
    return fail('EDIT_PREFERENCE_REPOSITORY_VALIDATION_FAILED', 'ProjectEditSession repository result must be mockOnly.', result)
  }
  return validateNoProjectEditSessionSideEffects(result)
}

export function createProjectEditSessionRepositoryValidationSummary(input: {
  context: ProjectEditSessionRepositoryContext
  bundle?: ProjectEditSessionBundleRecord
  result?: ProjectEditSessionRepositoryResult<unknown>
}): string[] {
  const summary = [
    `Repository context mode=${input.context.mode}, status=${input.context.status}, mockOnly=${input.context.mockOnly}.`,
    'Supabase, storage, provider, worker, render, and credit side-effect flags must remain false in RP-EDITSESSION-03.',
  ]
  if (input.bundle) {
    summary.push(`Bundle session=${input.bundle.session.id}; messages=${input.bundle.messages.length}; sources=${input.bundle.sources.length}; versions=${input.bundle.versions.length}.`)
  }
  if (input.result) {
    summary.push(`Result ok=${input.result.ok}; supabaseRead=${input.result.supabaseReadMade}; supabaseWrite=${input.result.supabaseWriteMade}; provider=${input.result.providerCallMade}.`)
  }
  return summary
}
