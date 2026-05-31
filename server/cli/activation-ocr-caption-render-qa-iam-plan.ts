import {
  buildOcrCaptionRenderQaIamPlan,
  summarizeOcrCaptionRenderQaIamPlan,
} from '../activation/ocr-caption-render-qa'

const plan = buildOcrCaptionRenderQaIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else console.log(summarizeOcrCaptionRenderQaIamPlan(plan))
