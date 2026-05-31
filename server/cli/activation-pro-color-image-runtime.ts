import {
  buildProColorImageRuntimeCommandPlans,
  proColorImageRuntimeEvidenceToTypeScript,
  runProColorImageRuntimeVerification,
} from '../activation/pro-color-image-runtime'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildProColorImageRuntimeCommandPlans()
  console.log([
    'Phase 40B pro color/image runtime CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true to build, deploy, and execute generated-fixture runtime verification.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runProColorImageRuntimeVerification({ execute: true, runId })
  if (emitEvidenceModule) console.log(proColorImageRuntimeEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
