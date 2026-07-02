import { buildSecurityReviewReport } from '../security-review'

const report = buildSecurityReviewReport()

console.log([
  `Security review: ${report.blockers.length > 0 ? 'blocked' : 'passed'}`,
  `Secret safety: ${report.secretSafetyStatus}`,
  `Signed URL safety: ${report.signedUrlSafetyStatus}`,
  `Raw prompt execution: ${report.rawPromptExecutionStatus}`,
  `Model weight security: ${report.modelWeightSecurityStatus}`,
  `Blockers: ${report.blockers.length}`,
  'Static summary only; no providers, deployment, media processing, or secrets are used.',
].join('\n'))
