import { buildOcrRuntimePlan } from '../activation/ocr-runtime'

const plan = buildOcrRuntimePlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 37C generated OCR runtime command plan')
  for (const command of plan.commands) {
    console.log('')
    console.log(`${command.commandId}: ${command.phase}`)
    console.log(command.commandString)
  }
}
