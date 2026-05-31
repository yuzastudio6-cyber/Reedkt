import { buildRemotionRenderIamPlan } from '../activation/remotion-render-validation'

console.log('Phase 45B Remotion render validation IAM plan')
for (const binding of buildRemotionRenderIamPlan()) console.log(`${binding.bindingId}: ${binding.commandString}`)
