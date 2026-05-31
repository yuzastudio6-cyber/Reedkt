import { buildRealVideoFilmIamPlan } from '../activation/real-video-film-slowmotion'

const plan = buildRealVideoFilmIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 38D real-video FILM slow-motion IAM plan')
  for (const binding of plan) {
    console.log(`- ${binding.bindingId}: ${binding.role} on gs://${binding.bucket}`)
    console.log(`  ${binding.commandString}`)
  }
}
