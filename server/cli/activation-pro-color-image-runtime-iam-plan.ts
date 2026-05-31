import { buildProColorImageRuntimeIamPlan } from '../activation/pro-color-image-runtime'

const plan = buildProColorImageRuntimeIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 40B pro color/image runtime IAM plan')
  for (const binding of plan) {
    console.log(`${binding.bindingId}: ${binding.commandString}`)
  }
}
