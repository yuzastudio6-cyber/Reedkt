import { runVlmSglangFixedKernel } from '../activation/vlm-sglang-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-SG-FIXED Cloud Build profile CLI',
    'No execution performed.',
    'Cloud Build profile execution is confirmation-gated and runs through the fixed-kernel compatibility runner.',
    'No model files, secrets, public artifacts, real media, provider calls, beta/production unlocks, or Track A paths are allowed.',
  ].join('\n'))
} else {
  const result = await runVlmSglangFixedKernel({
    execute: true,
    keepTemp,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result.buildAttempts, null, 2))
  else {
    console.log([
      'Phase 39C-SG-FIXED Cloud Build profile matrix completed through the guarded compatibility runner.',
      `Run: ${result.runId}`,
      `Build profiles: ${result.buildAttempts.map((attempt) => `${attempt.profile.id}:${attempt.status}`).join(', ')}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
    ].join('\n'))
  }
}
