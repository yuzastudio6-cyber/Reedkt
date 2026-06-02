import { runVlmSgAuthPreflight } from '../activation/vlm-sglang-runtime'

const execute = process.argv.includes('--execute')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-SG-AUTH-RERUN noninteractive auth preflight CLI',
    'No diagnostics performed.',
    'Pass --execute with REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT=true to run non-mutating gcloud auth and permission probes.',
    'This CLI never prints access tokens, credential file contents, JSON keys, refresh tokens, or secrets.',
  ].join('\n'))
} else {
  const result = await runVlmSgAuthPreflight({
    execute: true,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C-SG-AUTH-RERUN noninteractive auth preflight completed.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Auth path used: ${result.authPathUsed}`,
      `Active principal: ${result.activePrincipal}`,
      'Token output: not printed',
      `Blockers: ${result.blockers.length ? result.blockers.join('; ') : 'none'}`,
    ].join('\n'))
  }
}
