import { buildBraveSearchFallbackPolicyReport, summarizeBraveSearchFallbackPolicyReport } from '../activation/brave-search-fallback-policy'

const report = buildBraveSearchFallbackPolicyReport()
console.log(summarizeBraveSearchFallbackPolicyReport(report))
process.exit(report.status === 'completed' ? 0 : 1)
