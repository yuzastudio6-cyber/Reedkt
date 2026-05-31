import {
  buildOcrCaptionRenderQaPlan,
  ocrCaptionRenderQaEvidenceToTypeScript,
  runOcrCaptionRenderQa,
} from '../activation/ocr-caption-render-qa'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  const plan = buildOcrCaptionRenderQaPlan()
  console.log([
    'Phase 37E OCR caption/render QA metadata integration CLI',
    'No execution performed.',
    'Pass --execute with the three Phase 37E current-shell confirmation env vars to read private JSON evidence and upload private JSON QA artifacts.',
    '',
    `expectedArtifacts: ${plan.expectedArtifacts.length}`,
    `candidateZones: ${plan.candidateZones.map((zone) => zone.zoneId).join(',')}`,
  ].join('\n'))
} else {
  const result = await runOcrCaptionRenderQa({
    execute: true,
    keepTemp,
    runId,
  })
  if (emitEvidenceModule) console.log(ocrCaptionRenderQaEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
