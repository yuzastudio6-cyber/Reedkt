import {
  buildRealVideoSam2CommandPlans,
  realVideoSam2TemporalMaskEvidenceToTypeScript,
  runRealVideoSam2TemporalMask,
} from '../activation/real-video-sam2-temporal-mask'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildRealVideoSam2CommandPlans()
  console.log([
    'Phase 35D real-video SAM2 temporal mask CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true to build, deploy, and execute one bounded controlled real-video SAM2 temporal mask test.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runRealVideoSam2TemporalMask({
    execute: true,
    runId,
  })
  if (emitEvidenceModule) console.log(realVideoSam2TemporalMaskEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
