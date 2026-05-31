import {
  buildRealVideoProColorImageCommandPlans,
  realVideoProColorImageEvidenceToTypeScript,
  runRealVideoProColorImageSample,
} from '../activation/real-video-pro-color-image'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildRealVideoProColorImageCommandPlans()
  console.log([
    'Phase 40C real-video pro color/image sample CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE=true to build, deploy, and execute the bounded sample.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runRealVideoProColorImageSample({ execute: true, runId })
  if (emitEvidenceModule) console.log(realVideoProColorImageEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
