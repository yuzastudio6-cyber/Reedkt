import { buildTrackAVisualReadinessClosureIamPlan } from '../activation/track-a-visual-readiness-closure'

console.log('Phase 45F Track A visual-video readiness closure IAM plan')
for (const binding of buildTrackAVisualReadinessClosureIamPlan()) console.log(`${binding.bindingId}: ${binding.commandString}`)
