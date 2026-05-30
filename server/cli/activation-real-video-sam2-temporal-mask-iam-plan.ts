import { buildRealVideoSam2IamPlan } from '../activation/real-video-sam2-temporal-mask'

const json = process.argv.includes('--json')
const plan = buildRealVideoSam2IamPlan()

console.log(json ? JSON.stringify(plan, null, 2) : plan.map((binding) => `${binding.bindingId}: ${binding.commandString}`).join('\n'))
