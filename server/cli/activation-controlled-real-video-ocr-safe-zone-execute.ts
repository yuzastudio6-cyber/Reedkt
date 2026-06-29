import {
  buildControlledRealVideoOcrExecutionPlan,
  controlledRealVideoOcrExecutionEvidenceToTypeScript,
  runControlledRealVideoOcrSafeZoneExecution,
} from '../activation/controlled-real-video-ocr-safe-zone'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plan = buildControlledRealVideoOcrExecutionPlan()
  console.log([
    'Phase 37D controlled real-video OCR safe-zone execution CLI',
    'No execution performed.',
    'Pass --execute with the five Phase 37D current-shell confirmation env vars to copy the approved private sample, extract six frames, run CPU PaddleOCR, and upload private JSON QA artifacts.',
    '',
    `sampleId: ${plan.sample.sampleId}`,
    `source: ${plan.sample.sourceGcsUri}`,
    `window: ${plan.sample.window.startSeconds}-${plan.sample.window.endSeconds}s`,
    `offsets: ${plan.sample.frameOffsetsSeconds.join(',')}`,
  ].join('\n'))
} else {
  const result = await runControlledRealVideoOcrSafeZoneExecution({
    execute: true,
    keepTemp,
    runId,
  })
  if (emitEvidenceModule) console.log(controlledRealVideoOcrExecutionEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
