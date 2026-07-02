import type {
  EditLevelRepository,
  EditLevelRepositoryResult,
} from '../../types'
import { createEditLevelRepositoryFailure } from './edit-level-repository'

const disabledMessage = 'Supabase Edit Level repository is disabled in RP-EDITLEVEL-03.'

function disabled<TData>(): EditLevelRepositoryResult<TData> {
  return createEditLevelRepositoryFailure('supabase_disabled', disabledMessage, [
    'No Supabase client is constructed.',
    'No service-role client, table query, SQL migration, read, or write is attempted.',
  ])
}

export function createDisabledSupabaseEditLevelRepository(): EditLevelRepository {
  return {
    mode: 'supabase_disabled',
    listProfiles: () => disabled(),
    getProfile: () => disabled(),
    normalizeInput: () => disabled(),
    createUICards: () => disabled(),
    createRecommendation: () => disabled(),
    getRecommendation: () => disabled(),
    listRecommendations: () => disabled(),
    saveSelection: () => disabled(),
    getSelection: () => disabled(),
    updateSelection: () => disabled(),
    clearSelection: () => disabled(),
    createToolRoutingSummary: () => disabled(),
    createQwenRoutingSummary: () => disabled(),
    createQAProfileSummary: () => disabled(),
    createEstimateSummary: () => disabled(),
    createFallbackSummary: () => disabled(),
    createToolRoutingProfile: () => disabled(),
    createQAProfile: () => disabled(),
    createEstimateProfile: () => disabled(),
    createFallbackPolicy: () => disabled(),
    createReadiness: () => disabled(),
    getReadiness: () => disabled(),
    appendApplicationLog: () => disabled(),
    listApplicationLogs: () => disabled(),
    createRepositorySummary: () => disabled(),
  }
}
