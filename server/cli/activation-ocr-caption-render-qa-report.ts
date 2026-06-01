import {
  buildOcrCaptionRenderQaEvidenceReport,
  summarizeOcrCaptionRenderQaEvidenceReport,
} from '../activation/ocr-caption-render-qa'

const report = buildOcrCaptionRenderQaEvidenceReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeOcrCaptionRenderQaEvidenceReport(report))
