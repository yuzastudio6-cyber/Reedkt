import {
  buildSegmentTextBehindSubjectPreviewReport,
  summarizeSegmentTextBehindSubjectPreviewReport,
} from '../activation/segment-text-behind-subject-preview'

const json = process.argv.includes('--json')
const report = buildSegmentTextBehindSubjectPreviewReport()

console.log(json ? JSON.stringify(report, null, 2) : summarizeSegmentTextBehindSubjectPreviewReport(report))
