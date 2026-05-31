import { buildLibassBurninIamPlan } from '../activation/libass-burnin-validation'

console.log('Phase 45A libass burn-in validation IAM plan')
for (const binding of buildLibassBurninIamPlan()) {
  console.log(`${binding.bindingId}: ${binding.commandString}`)
}
