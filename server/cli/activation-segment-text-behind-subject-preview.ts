import {
  buildSegmentTextBehindSubjectPreviewCommandPlans,
  runSegmentTextBehindSubjectPreview,
  segmentTextBehindSubjectPreviewEvidenceToTypeScript,
} from '../activation/segment-text-behind-subject-preview'

const execute = process.argv.includes('--execute')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plans = buildSegmentTextBehindSubjectPreviewCommandPlans()
  console.log([
    'Phase 35E segment text-behind-subject preview CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW=true to compose one controlled private segment preview from Phase 35D artifacts.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runSegmentTextBehindSubjectPreview({
    execute: true,
    runId,
  })
  if (emitEvidenceModule) console.log(segmentTextBehindSubjectPreviewEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
