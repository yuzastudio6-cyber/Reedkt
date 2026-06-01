import {
  buildDeepFilterNetRuntimeCommandPlans,
  deepFilterNetRuntimeEvidenceToTypeScript,
  runDeepFilterNetRuntimeVerification,
} from '../activation/deepfilternet-runtime'

const execute = process.argv.includes('--execute')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=').slice(1).join('=')

if (!execute) {
  console.log(JSON.stringify({
    phase: '36C',
    status: 'static_plan_only',
    message: 'No DeepFilterNet runtime execution performed. Pass --execute with REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true to build, deploy, and run the generated-audio runtime verification.',
    commandPlans: buildDeepFilterNetRuntimeCommandPlans(),
  }, null, 2))
} else {
  const result = await runDeepFilterNetRuntimeVerification({
    execute: true,
    runId,
  })

  if (writeEvidenceModule) console.log(deepFilterNetRuntimeEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
