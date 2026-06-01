import {
  buildDeepFilterNetFeatureE2ECommandPlans,
  deepFilterNetFeatureE2EEvidenceToTypeScript,
  runDeepFilterNetFeatureE2EAudioCleanup,
} from '../activation/deepfilternet-feature-e2e'

const execute = process.argv.includes('--execute')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=').slice(1).join('=')

if (!execute) {
  console.log(JSON.stringify({
    phase: '36E',
    status: 'static_plan_only',
    message: 'No DeepFilterNet private audio feature E2E execution performed. Pass --execute with REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true to run.',
    commandPlans: buildDeepFilterNetFeatureE2ECommandPlans(),
  }, null, 2))
} else {
  const result = await runDeepFilterNetFeatureE2EAudioCleanup({
    execute: true,
    runId,
  })

  if (writeEvidenceModule) console.log(deepFilterNetFeatureE2EEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
