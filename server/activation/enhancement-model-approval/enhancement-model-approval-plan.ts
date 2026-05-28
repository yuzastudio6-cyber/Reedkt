import { buildEnhancementModelApprovalReport } from './enhancement-model-approval-report-builder'
import type { EnhancementModelApprovalReport } from './enhancement-model-approval-types'

export interface EnhancementModelApprovalPlan {
  planId: 'activation-phase-34a-enhancement-model-approval-plan'
  executionMode: 'static_report_only'
  approvedCandidate: string
  evaluatedOnlyCandidates: string[]
  futureDownloadScope: string[]
  blockedExecution: string[]
  report: EnhancementModelApprovalReport
}

export function buildEnhancementModelApprovalPlan(): EnhancementModelApprovalPlan {
  const report = buildEnhancementModelApprovalReport()
  return {
    planId: 'activation-phase-34a-enhancement-model-approval-plan',
    executionMode: 'static_report_only',
    approvedCandidate: 'RealESRGAN_x4plus for staging sample-first representative-frame or short-sample enhancement planning only',
    evaluatedOnlyCandidates: ['RealESRGAN_x2plus / smaller general alternatives', 'FILM frame interpolation'],
    futureDownloadScope: ['Phase 34B may download only RealESRGAN_x4plus into private staging model storage.'],
    blockedExecution: [
      'no Real-ESRGAN download in Phase 34A',
      'no Real-ESRGAN execution in Phase 34A',
      'no FILM download or execution',
      'no slow motion',
      'no full-video blind enhancement',
      'no GPU deploy or GPU job',
      'no frame/video processing',
      'no providers',
      'no public URLs',
      'no production, external beta, paid production, or broad real-media unlock',
    ],
    report,
  }
}

export function summarizeEnhancementModelApprovalPlan(plan: EnhancementModelApprovalPlan): string {
  return [
    `Enhancement model approval plan: ${plan.planId}`,
    `Execution mode: ${plan.executionMode}`,
    `Approved candidate: ${plan.approvedCandidate}`,
    `Phase 34B ready: ${plan.report.phase34BReadiness.ready}`,
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
