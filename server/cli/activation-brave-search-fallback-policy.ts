import { buildBraveSearchFallbackPolicyReport, summarizeBraveSearchFallbackPolicyReport } from '../activation/brave-search-fallback-policy'

if (process.argv.includes('--execute')) {
  console.error('Phase 49J is static policy only. Live Brave API execution is blocked.')
  process.exit(1)
}

const report = buildBraveSearchFallbackPolicyReport()
console.log(summarizeBraveSearchFallbackPolicyReport(report))
process.exit(report.status === 'completed' ? 0 : 1)
