import { buildToolReadinessReport } from '../foundation/tool-readiness'

const report = buildToolReadinessReport()

console.log(JSON.stringify(report, null, 2))

if (report.status === 'blocked') {
  process.exitCode = 1
}
