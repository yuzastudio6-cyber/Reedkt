import { buildFinalRenderHardeningIamPlan } from '../activation/final-render-hardening'

console.log('Phase 45D FFmpeg/FFprobe final render hardening IAM plan')
for (const binding of buildFinalRenderHardeningIamPlan()) console.log(`${binding.bindingId}: ${binding.commandString}`)
