import { buildBiRefNetRuntimeReport, summarizeBiRefNetRuntimeReport } from '../activation/mask-runtime'

const reportPathArg = process.argv.indexOf('--report')
const imageDigestArg = process.argv.indexOf('--image-digest')
const report = buildBiRefNetRuntimeReport({
  reportPath: reportPathArg >= 0 ? process.argv[reportPathArg + 1] : undefined,
  imageDigest: imageDigestArg >= 0 ? process.argv[imageDigestArg + 1] : undefined,
})

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeBiRefNetRuntimeReport(report))

if (report.blockers.length > 0) process.exitCode = 1
