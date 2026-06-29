import { buildOcrRuntimeIamPlan } from '../activation/ocr-runtime'

const plans = buildOcrRuntimeIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plans, null, 2))
else {
  console.log('Phase 37C generated OCR runtime IAM plan')
  console.log('Text-only plan. Phase 37C runner does not mutate IAM.')
  for (const plan of plans) {
    console.log('')
    console.log(`${plan.bindingId}: ${plan.role} (${plan.required ? 'required' : 'diagnostic only'})`)
    console.log(plan.commandString)
  }
}
