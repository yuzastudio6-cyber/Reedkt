import { buildControlledRealVideoOcrSafeZoneIamPlan } from '../activation/controlled-real-video-ocr-safe-zone'

const plans = buildControlledRealVideoOcrSafeZoneIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plans, null, 2))
else {
  console.log('Phase 37D controlled real-video OCR safe-zone IAM plan')
  console.log('Text-only plan. Phase 37D does not mutate IAM.')
  for (const plan of plans) {
    console.log('')
    console.log(`${plan.bindingId}: ${plan.role} (${plan.required ? 'required' : 'future only'})`)
    console.log(plan.commandString)
  }
}
