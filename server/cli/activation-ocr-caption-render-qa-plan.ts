import { buildOcrCaptionRenderQaCommandPlans, buildOcrCaptionRenderQaPlan } from '../activation/ocr-caption-render-qa'

const plan = buildOcrCaptionRenderQaPlan()
const commandPlans = buildOcrCaptionRenderQaCommandPlans()

if (process.argv.includes('--json')) console.log(JSON.stringify({ ...plan, commandPlans }, null, 2))
else {
  console.log([
    'Phase 37E OCR safe-zone caption/render QA plan',
    `scope: ${plan.executionScope}`,
    `expectedArtifacts: ${plan.expectedArtifacts.length}`,
    `candidateZones: ${plan.candidateZones.map((zone) => zone.zoneId).join(',')}`,
    `blockedScopes: ${plan.blockedScopes.length}`,
    `executeScript: ${commandPlans.scripts.execute}`,
  ].join('\n'))
}
