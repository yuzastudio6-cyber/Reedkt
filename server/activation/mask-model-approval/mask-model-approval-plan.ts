import { buildMaskModelApprovalReport } from './mask-model-approval-report-builder'
import type { MaskModelApprovalReport } from './mask-model-approval-types'

export interface MaskModelApprovalPlan {
  planId: 'activation-phase-33a-mask-model-approval-plan'
  executionMode: 'static_report_only'
  approvedCandidate: string
  evaluatedOnlyCandidates: string[]
  futureDownloadScope: string[]
  blockedExecution: string[]
  report: MaskModelApprovalReport
}

export function buildMaskModelApprovalPlan(): MaskModelApprovalPlan {
  const report = buildMaskModelApprovalReport()
  return {
    planId: 'activation-phase-33a-mask-model-approval-plan',
    executionMode: 'static_report_only',
    approvedCandidate: 'ZhengPeng7/BiRefNet for staging representative-frame/single-frame background-removal planning only',
    evaluatedOnlyCandidates: ['facebook/sam2-hiera-tiny', 'Meta SAM2 official checkpoints/code'],
    futureDownloadScope: ['Phase 33B may download only ZhengPeng7/BiRefNet into private staging model storage.'],
    blockedExecution: [
      'no BiRefNet download in Phase 33A',
      'no SAM2 download or execution',
      'no GPU deploy or GPU job',
      'no frame/video processing',
      'no mask execution',
      'no text-behind-subject execution',
      'no providers',
      'no public URLs',
      'no production, external beta, paid production, or broad real-media unlock',
    ],
    report,
  }
}

export function summarizeMaskModelApprovalPlan(plan: MaskModelApprovalPlan): string {
  return [
    `Mask model approval plan: ${plan.planId}`,
    `Execution mode: ${plan.executionMode}`,
    `Approved candidate: ${plan.approvedCandidate}`,
    `Phase 33B ready: ${plan.report.phase33BReadiness.ready}`,
    '',
    'Evaluated-only:',
    ...plan.evaluatedOnlyCandidates.map((candidate) => `- ${candidate}`),
    '',
    'Future download scope:',
    ...plan.futureDownloadScope.map((scope) => `- ${scope}`),
    '',
    'Blocked execution:',
    ...plan.blockedExecution.map((blocked) => `- ${blocked}`),
  ].join('\n')
}
