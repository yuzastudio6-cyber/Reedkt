import { buildRealEsrganPolicyDecisionReport, summarizeRealEsrganPolicyDecisionReport } from '../activation/real-esrgan-policy-decision'

const report = buildRealEsrganPolicyDecisionReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeRealEsrganPolicyDecisionReport(report))
}
