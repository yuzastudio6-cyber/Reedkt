import {
  buildFirstRealVideoReport,
  firstRealVideoConfig,
  summarizeFirstRealVideoReport,
  uploadFirstRealVideoSource,
} from '../activation/first-real-video'

const jsonOutput = process.argv.includes('--json')
const mode = readArg('--mode') ?? 'report'

if (mode === 'upload-source') {
  const sourceVideoPath = process.env.REEDITPRO_PHASE28_SOURCE_VIDEO_PATH ?? firstRealVideoConfig.sourceVideoPath
  const result = await uploadFirstRealVideoSource({
    sourceVideoPath,
    sourceGcsUri: process.env.REEDITPRO_PHASE28_SOURCE_GCS_URI,
    repoRoot: process.cwd(),
  })
  console.log(JSON.stringify(result, null, 2))
} else {
  const report = buildFirstRealVideoReport()
  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeFirstRealVideoReport(report))
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
