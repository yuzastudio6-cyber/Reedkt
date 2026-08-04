import type { EditLevelRepositoryResult } from '../../types'

export function validateEditLevelRepositoryNoSideEffects(result: EditLevelRepositoryResult<unknown>): string[] {
  const errors: string[] = []

  if (!result.mockOnly) errors.push('mockOnly must remain true.')
  if (result.providerCallMade) errors.push('providerCallMade must remain false.')
  if (result.mediaProcessingStarted) errors.push('mediaProcessingStarted must remain false.')
  if (result.workerJobCreated) errors.push('workerJobCreated must remain false.')
  if (result.renderJobCreated) errors.push('renderJobCreated must remain false.')
  if (result.creditReservedOrSpent) errors.push('creditReservedOrSpent must remain false.')
  if (result.supabaseReadMade) errors.push('supabaseReadMade must remain false.')
  if (result.supabaseWriteMade) errors.push('supabaseWriteMade must remain false.')
  if (result.fileBytesRead) errors.push('fileBytesRead must remain false.')
  if (result.externalUrlFetched) errors.push('externalUrlFetched must remain false.')

  return errors
}

export function assertEditLevelRepositoryResultIsMockOnly(result: EditLevelRepositoryResult<unknown>): void {
  const errors = validateEditLevelRepositoryNoSideEffects(result)
  if (errors.length > 0) {
    throw new Error(errors.join(' '))
  }
}
