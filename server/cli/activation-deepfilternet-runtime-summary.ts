import { buildDeepFilterNetRuntimeReport } from '../activation/deepfilternet-runtime'

const report = buildDeepFilterNetRuntimeReport()
console.log(JSON.stringify({
  phase: report.config.phase,
  status: report.status,
  reportId: report.reportId,
  runtimeImage: report.config.runtimeTargetImage,
  runtimeJobName: report.config.runtimeJobName,
  blockerCount: report.blockers.length,
  deepFilterNetRuntimeVerified: report.deepFilterNetRuntimeVerified,
}, null, 2))
