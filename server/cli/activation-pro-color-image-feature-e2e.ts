import {
  buildProColorImageFeatureE2ECommandPlans,
  proColorImageFeatureE2EEvidenceToTypeScript,
  runProColorImageFeatureE2E,
} from '../activation/pro-color-image-feature-e2e'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildProColorImageFeatureE2ECommandPlans()
  console.log([
    'Phase 40D pro color/image feature E2E CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E=true to build, deploy, and execute the bounded sample.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runProColorImageFeatureE2E({ execute: true, runId })
  if (emitEvidenceModule) console.log(proColorImageFeatureE2EEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
