import {
  audioAiApprovalCommandPlans,
  buildAudioAiApprovalReport,
} from '../activation/audio-ai-approval'

const report = buildAudioAiApprovalReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    phase: report.phase,
    approvalDecision: report.approvalDecision,
    planningRecommendation: report.futureScope.audioAiPlanningRecommendation,
    phase36BReadiness: report.phase36BReadiness,
    commandPlans: audioAiApprovalCommandPlans,
    audioAiDownloadAllowed: report.audioAiDownloadAllowed,
    audioAiRuntimeAllowed: report.audioAiRuntimeAllowed,
    realVideoAudioAiCleanupAllowed: report.realVideoAudioAiCleanupAllowed,
  }, null, 2))
} else {
  console.log([
    'Phase 36A audio AI approval plan',
    `Approval decision: ${report.approvalDecision}`,
    `Planning recommendation: ${report.futureScope.audioAiPlanningRecommendation}`,
    `Phase 36B ready: ${report.phase36BReadiness.ready}`,
    `Command plans: ${audioAiApprovalCommandPlans.length} (text-only, blocked)`,
    `Audio AI download allowed: ${report.audioAiDownloadAllowed}`,
    `Audio AI runtime allowed: ${report.audioAiRuntimeAllowed}`,
    `Real-video audio AI cleanup allowed: ${report.realVideoAudioAiCleanupAllowed}`,
    '',
    'Future command plans:',
    ...audioAiApprovalCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandText}`),
  ].join('\n'))
}
