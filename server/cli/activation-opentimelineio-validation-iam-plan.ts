import { buildOpenTimelineIoIamPlan } from '../activation/opentimelineio-validation'

console.log('Phase 45C OpenTimelineIO validation IAM plan')
for (const binding of buildOpenTimelineIoIamPlan()) console.log(`${binding.bindingId}: ${binding.commandString}`)
