import { buildSam2RuntimeIamPlan } from '../activation/sam2-runtime'

const plans = buildSam2RuntimeIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plans, null, 2))
else {
  console.log('Phase 35C SAM2 runtime IAM plan')
  for (const plan of plans) {
    console.log('')
    console.log(`${plan.bindingId}: ${plan.role}`)
    console.log(plan.commandString)
  }
}
