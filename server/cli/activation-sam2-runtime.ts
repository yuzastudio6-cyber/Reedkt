import {
  buildSam2RuntimeCommandPlans,
  runSam2RuntimeVerification,
  sam2RuntimeEvidenceToTypeScript,
} from '../activation/sam2-runtime'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildSam2RuntimeCommandPlans()
  console.log([
    'Phase 35C SAM2 runtime CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_SAM2_RUNTIME=true to build, deploy, and execute the generated-fixture SAM2 runtime verification.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runSam2RuntimeVerification({
    execute: true,
    runId,
  })
  if (emitEvidenceModule) console.log(sam2RuntimeEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
