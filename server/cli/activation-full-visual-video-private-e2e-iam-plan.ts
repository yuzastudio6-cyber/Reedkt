import { buildFullVisualVideoPrivateE2eIamPlan } from '../activation/full-visual-video-private-e2e'

console.log('Phase 45E full visual-video private E2E IAM plan')
for (const binding of buildFullVisualVideoPrivateE2eIamPlan()) console.log(`${binding.bindingId}: ${binding.commandString}`)
