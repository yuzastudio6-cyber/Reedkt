import { buildRealVideoDeepFilterNetIamPlan } from '../activation/real-video-deepfilternet-audio-cleanup'

const plan = buildRealVideoDeepFilterNetIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 36D real-video DeepFilterNet audio cleanup IAM plan')
  for (const binding of plan) {
    console.log(`- ${binding.bindingId}: ${binding.role} on gs://${binding.bucket}`)
    console.log(`  ${binding.conditionExpression}`)
  }
}
