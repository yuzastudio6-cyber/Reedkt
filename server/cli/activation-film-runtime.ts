import {
  buildFilmRuntimeCommandPlans,
  filmRuntimeEvidenceToTypeScript,
  runFilmRuntimeVerification,
} from '../activation/film-runtime'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildFilmRuntimeCommandPlans()
  console.log([
    'Phase 38C FILM runtime CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_FILM_RUNTIME=true to build, deploy, and execute generated-frame FILM runtime verification.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runFilmRuntimeVerification({ execute: true, runId })
  if (emitEvidenceModule) console.log(filmRuntimeEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
