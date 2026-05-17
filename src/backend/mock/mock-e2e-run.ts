import type { ReeditProMockE2ESummary } from '../backend-types'
import { runChatNativeEditPlanningFlow } from '../orchestrators/chat-native-editor-orchestrator'
import { runMockApprovedGenerationFlow } from '../orchestrators/mock-e2e-orchestrator'
import { createMockDatabase, resetMockIds } from './mock-database'
import { unwrapServiceResult } from '../service-result'

export function runReeditProMockE2E(): ReeditProMockE2ESummary {
  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({ includeMusicDirectorPlanning: true }, db))
  const approvedState = unwrapServiceResult(runMockApprovedGenerationFlow(db, planningState))
  const musicDirectorPlan = approvedState.musicDirectorPlan

  return {
    projectId: approvedState.project.id,
    chatSessionId: approvedState.chatSession.id,
    sourceClipCount: approvedState.sourceAssets.length,
    editPlanStatus: approvedState.editPlan.status,
    editComplexity: approvedState.editPlan.complexity,
    strokeMotionMode: approvedState.strokeMotionPlan?.understandingMode,
    creditEstimateTotal: approvedState.creditEstimate.totalEstimatedCredits,
    creditsReserved: approvedState.creditReservation.reservedCredits,
    jobCount: db.jobs.length,
    generationRequestCount: db.generationRequests.length,
    renderStatus: approvedState.previewRender.status,
    qaStatus: approvedState.qaReport.status,
    previewReady: approvedState.previewReady,
    musicNeedDecision: musicDirectorPlan?.musicContextAnalysis.musicNeedDecision,
    musicCueCountDecision: musicDirectorPlan?.musicContextAnalysis.musicCueCountDecision,
    musicCueCount: musicDirectorPlan?.cues.length,
    lyricsAllowedSomewhere: musicDirectorPlan?.cueSheet.lyricsAllowedSomewhere,
    musicNextStep: musicDirectorPlan?.nextStep,
  }
}
