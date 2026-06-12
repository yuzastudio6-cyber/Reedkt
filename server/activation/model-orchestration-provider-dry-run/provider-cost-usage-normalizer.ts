import type { ProviderCallResult } from './model-provider-dry-run-types'

export function buildProviderCostUsageReport(results: ProviderCallResult[]) {
  const totalTokens = results.reduce((sum, result) => sum + (result.usage?.totalTokens ?? 0), 0)
  return {
    phase: 'MODEL_DRYRUN_1',
    status: results.every((result) => result.status === 'passed' || result.status === 'skipped') ? 'passed' : 'blocked',
    pricingTableApproved: false,
    estimatedUsdRecordedAsUpperBoundOnly: true,
    configuredUpperBoundUsd: 2,
    maxProviderCallsApproved: 2,
    providerCallsAttempted: results.filter((result) => result.status !== 'skipped').length,
    totalTokens,
    byCase: results.map((result) => ({
      caseId: result.caseId,
      providerId: result.providerId,
      modelId: result.modelId,
      status: result.status,
      latencyMs: result.latencyMs,
      promptTokens: result.usage?.promptTokens ?? null,
      completionTokens: result.usage?.completionTokens ?? null,
      totalTokens: result.usage?.totalTokens ?? null,
      costUsdExact: null,
      costClassification: 'usage_metadata_recorded_without_exact_pricing',
    })),
  }
}
