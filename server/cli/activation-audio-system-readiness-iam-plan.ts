import { buildAudioSystemReadinessIamPlan } from '../activation/audio-system-readiness'

const plan = buildAudioSystemReadinessIamPlan()
console.log('Phase 36F audio system internal readiness IAM plan')
for (const binding of plan) {
  console.log(`- ${binding.bindingId}: ${binding.role} on gs://${binding.bucket}`)
  console.log(`  ${binding.conditionExpression}`)
  console.log(`  ${binding.commandString}`)
}
