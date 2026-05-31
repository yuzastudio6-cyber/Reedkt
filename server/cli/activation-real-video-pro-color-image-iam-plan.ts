import { buildRealVideoProColorImageIamPlan } from '../activation/real-video-pro-color-image'

const plan = buildRealVideoProColorImageIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 40C real-video pro color/image IAM plan')
  for (const binding of plan) {
    console.log(`${binding.bindingId}: ${binding.commandString}`)
  }
}
