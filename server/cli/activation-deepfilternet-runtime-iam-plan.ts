import { buildDeepFilterNetRuntimeIamPlan } from '../activation/deepfilternet-runtime'

const plan = buildDeepFilterNetRuntimeIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log([
    'Phase 36C DeepFilterNet runtime IAM plan',
    '',
    ...plan.flatMap((binding) => [
      `${binding.bindingId}`,
      `- bucket: ${binding.bucket}`,
      `- role: ${binding.role}`,
      `- member: ${binding.member}`,
      `- condition: ${binding.conditionExpression}`,
      `- command: ${binding.commandString}`,
      '',
    ]),
  ].join('\n'))
}
