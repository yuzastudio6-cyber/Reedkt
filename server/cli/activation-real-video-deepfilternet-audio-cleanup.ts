import {
  buildRealVideoDeepFilterNetCommandPlans,
  realVideoDeepFilterNetEvidenceToTypeScript,
  runRealVideoDeepFilterNetAudioCleanup,
} from '../activation/real-video-deepfilternet-audio-cleanup'

const execute = process.argv.includes('--execute')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=').slice(1).join('=')

if (!execute) {
  console.log(JSON.stringify({
    phase: '36D',
    status: 'static_plan_only',
    message: 'No real-video DeepFilterNet audio cleanup execution performed. Pass --execute with REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP=true to run the controlled sample.',
    commandPlans: buildRealVideoDeepFilterNetCommandPlans(),
  }, null, 2))
} else {
  const result = await runRealVideoDeepFilterNetAudioCleanup({
    execute: true,
    runId,
  })

  if (writeEvidenceModule) console.log(realVideoDeepFilterNetEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
