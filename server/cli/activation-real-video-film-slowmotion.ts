import {
  buildRealVideoFilmCommandPlans,
  realVideoFilmSlowmotionEvidenceToTypeScript,
  runRealVideoFilmSlowmotion,
} from '../activation/real-video-film-slowmotion'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildRealVideoFilmCommandPlans()
  console.log([
    'Phase 38D real-video FILM slow-motion CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true to build, deploy, and execute the selected-segment sample.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runRealVideoFilmSlowmotion({ execute: true, runId })
  if (emitEvidenceModule) console.log(realVideoFilmSlowmotionEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
