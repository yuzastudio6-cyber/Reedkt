import { buildControlledRealVideoOcrSafeZonePlan } from '../activation/controlled-real-video-ocr-safe-zone'

const plan = buildControlledRealVideoOcrSafeZonePlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 37D controlled real-video OCR safe-zone command plan')
  console.log('Metadata-only plan. Do not set future execution confirmations in Phase 37D.')
  for (const command of plan.commands) {
    console.log('')
    console.log(`${command.commandId}: ${command.phase}`)
    console.log(command.commandString)
  }
}
