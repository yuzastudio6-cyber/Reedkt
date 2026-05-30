import { buildSegmentTextBehindSubjectPreviewIamPlan } from '../activation/segment-text-behind-subject-preview'

const plans = buildSegmentTextBehindSubjectPreviewIamPlan()

console.log(JSON.stringify({
  phase: '35E',
  default: 'no IAM mutation required for local authenticated execution',
  plans,
}, null, 2))
