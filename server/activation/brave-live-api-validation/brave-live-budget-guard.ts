import { braveLiveApiConfig } from './brave-live-api-policy'
import type { BraveLiveBudgetGuardResult } from './brave-live-api-types'

export function buildBraveLiveBudgetGuard(input: {
  dailyLimit?: string
  monthlyBudgetUsd?: string
  maxResults?: string
  maxQueriesPerRun?: string
} = {}): BraveLiveBudgetGuardResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const dailyLimit = Number(input.dailyLimit ?? process.env.BRAVE_SEARCH_DAILY_LIMIT ?? '0')
  const monthlyBudgetUsd = Number(input.monthlyBudgetUsd ?? process.env.BRAVE_SEARCH_MONTHLY_BUDGET_USD ?? '0')
  const maxResults = Number(input.maxResults ?? process.env.BRAVE_SEARCH_MAX_RESULTS ?? '0')
  const maxQueriesPerRun = Number(input.maxQueriesPerRun ?? process.env.BRAVE_SEARCH_MAX_QUERIES_PER_RUN ?? '0')

  if (!Number.isFinite(dailyLimit) || dailyLimit < 1) blockers.push('Daily Brave Search call limit must be at least 1.')
  if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd <= 0) blockers.push('Monthly Brave Search budget must be greater than 0 USD.')
  if (!Number.isFinite(maxResults) || maxResults < 1 || maxResults > braveLiveApiConfig.maxResults) blockers.push('Max Brave Search results must be between 1 and 5.')
  if (!Number.isFinite(maxQueriesPerRun) || maxQueriesPerRun < 1 || maxQueriesPerRun > braveLiveApiConfig.maxQueriesPerRun) blockers.push('Max Brave Search queries per run must be exactly 1 or lower.')

  warnings.push('Phase 49L records estimated call count as 1 and does not use pagination or extra snippets.')
  return {
    passed: blockers.length === 0,
    dailyLimit: Number.isFinite(dailyLimit) ? dailyLimit : 0,
    monthlyBudgetUsd: Number.isFinite(monthlyBudgetUsd) ? monthlyBudgetUsd : 0,
    maxResults: Number.isFinite(maxResults) ? maxResults : 0,
    maxQueriesPerRun: Number.isFinite(maxQueriesPerRun) ? maxQueriesPerRun : 0,
    estimatedCallCount: 1,
    retriesAllowed: 0,
    blockers,
    warnings,
  }
}
