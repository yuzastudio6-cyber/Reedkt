import { buildDeepFilterNetFeatureE2EIamPlan } from '../activation/deepfilternet-feature-e2e'

const plan = buildDeepFilterNetFeatureE2EIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 36E DeepFilterNet private audio feature E2E IAM plan')
  for (const binding of plan) {
    console.log(`- ${binding.bindingId}: ${binding.role} on gs://${binding.bucket}`)
    console.log(`  ${binding.conditionExpression}`)
  }
}
