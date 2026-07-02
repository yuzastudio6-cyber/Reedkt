import type { EditLevelRepositoryResult } from '../types'

export function summarizeEditLevelApiClientResult(result: EditLevelRepositoryResult<unknown>): string[] {
  return [
    `ok=${result.ok}`,
    `mode=${result.mode}`,
    `mockOnly=${result.mockOnly}`,
    `providerCallMade=${result.providerCallMade}`,
    `mediaProcessingStarted=${result.mediaProcessingStarted}`,
    `workerJobCreated=${result.workerJobCreated}`,
    `renderJobCreated=${result.renderJobCreated}`,
    `creditReservedOrSpent=${result.creditReservedOrSpent}`,
    `supabaseReadMade=${result.supabaseReadMade}`,
    `supabaseWriteMade=${result.supabaseWriteMade}`,
    `fileBytesRead=${result.fileBytesRead}`,
    `externalUrlFetched=${result.externalUrlFetched}`,
    ...(result.error ? [`error=${result.error}`] : []),
    ...result.warnings,
  ]
}

export function assertEditLevelApiClientResultIsMockOnly(result: EditLevelRepositoryResult<unknown>): boolean {
  return result.mockOnly &&
    !result.providerCallMade &&
    !result.mediaProcessingStarted &&
    !result.workerJobCreated &&
    !result.renderJobCreated &&
    !result.creditReservedOrSpent &&
    !result.supabaseReadMade &&
    !result.supabaseWriteMade &&
    !result.fileBytesRead &&
    !result.externalUrlFetched
}
