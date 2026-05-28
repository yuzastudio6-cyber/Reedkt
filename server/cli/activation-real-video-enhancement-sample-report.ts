import { buildRealVideoEnhancementSampleReport, summarizeRealVideoEnhancementSampleReport } from '../activation/real-video-enhancement-sample'

const reportPathArg = process.argv.indexOf('--report')
const imageDigestArg = process.argv.indexOf('--image-digest')
const report = buildRealVideoEnhancementSampleReport({
  reportPath: reportPathArg >= 0 ? process.argv[reportPathArg + 1] : undefined,
  imageDigest: imageDigestArg >= 0 ? process.argv[imageDigestArg + 1] : undefined,
})

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeRealVideoEnhancementSampleReport(report))
}

if (report.blockers.length > 0 && report.executionReport) process.exitCode = 1
