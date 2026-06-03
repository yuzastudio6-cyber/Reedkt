import { runMediaDataReportingQaAuthRerun } from '../activation/media-data-reporting-qa/auth-preflight'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 46D-AUTH-RERUN DuckDB/Polars reporting QA rerun CLI',
    'No execution performed.',
    'Pass --execute with auth, reporting QA, private metadata read, and private artifact upload confirmations in the current shell.',
    'Execution stops before private metadata reads when noninteractive auth/access preflight fails.',
    'This CLI never creates service-account keys, prints tokens, processes media, calls providers, runs OCR/VLM, unlocks beta/production, or touches Track A.',
  ].join('\n'))
} else {
  const result = await runMediaDataReportingQaAuthRerun({ execute: true, keepTemp, reportDir, runId })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 46D-AUTH-RERUN completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Auth status: ${result.authPreflight.status}`,
      `Auth path used: ${result.authPreflight.authPathUsed}`,
      `Private artifact prefix: ${result.privateArtifactPrefix}`,
      `Media/data tool-family beta status: ${result.mediaDataToolFamilyBetaStatus}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.localArtifactDir}`,
    ].join('\n'))
  }
}
