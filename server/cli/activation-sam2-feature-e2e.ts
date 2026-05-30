import {
  buildSam2FeatureE2ECommandPlans,
  runSam2FeatureE2E,
  sam2FeatureE2EEvidenceToTypeScript,
} from '../activation/sam2-feature-e2e'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildSam2FeatureE2ECommandPlans()
  console.log([
    'Phase 35F SAM2 feature E2E CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true to run one private bounded SAM2 text-behind-subject feature gate.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runSam2FeatureE2E({ execute: true, runId })
  if (emitEvidenceModule) console.log(sam2FeatureE2EEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
