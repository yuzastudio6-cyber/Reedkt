import { runMediaDataReportingQaAuthPreflight } from '../activation/media-data-reporting-qa/auth-preflight'

const execute = process.argv.includes('--execute')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 46D-AUTH-RERUN noninteractive auth preflight CLI',
    'No diagnostics performed.',
    'Pass --execute with REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT=true to run guarded noninteractive auth/access probes.',
    'This CLI never prints access tokens, refresh tokens, credential file contents, JSON keys, or secrets.',
  ].join('\n'))
} else {
  const result = await runMediaDataReportingQaAuthPreflight({ execute: true, reportDir, runId })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 46D-AUTH-RERUN noninteractive auth preflight completed.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Auth path used: ${result.authPathUsed}`,
      `Active principal: ${result.activePrincipal}`,
      'Token output: not printed',
      `Blockers: ${result.blockers.length ? result.blockers.join('; ') : 'none'}`,
    ].join('\n'))
  }
}
