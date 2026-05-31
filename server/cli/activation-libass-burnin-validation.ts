import { buildLibassBurninCommandPlans, runLibassBurninValidation } from '../activation/libass-burnin-validation'

const execute = process.argv.includes('--execute')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildLibassBurninCommandPlans()
  console.log([
    'Phase 45A libass burn-in validation CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true to build, deploy, and execute the bounded preview sample.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runLibassBurninValidation({ execute: true, runId })
  console.log(JSON.stringify(result, null, 2))
}
