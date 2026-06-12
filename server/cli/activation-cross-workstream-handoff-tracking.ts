import { runCrossWorkstreamHandoffTracking, summarizeCrossWorkstreamHandoffReport } from '../activation/cross-workstream-handoff-tracking'

const execute = process.argv.includes('--execute')

if (!execute) {
  throw new Error('Phase 52H execution requires --execute and confirmation env vars. Use activation:cross-workstream-handoff-tracking:report for static report mode.')
}

const result = await runCrossWorkstreamHandoffTracking({ execute })
console.log(summarizeCrossWorkstreamHandoffReport({ ...result.executionReport, reportId: 'activation-phase-52h-cross-workstream-handoff-tracking', executionReport: result.executionReport }))
console.log(`Local report: ${result.localReportPath}`)
console.log(`IAM changes: ${result.iamChanges.join('; ')}`)
