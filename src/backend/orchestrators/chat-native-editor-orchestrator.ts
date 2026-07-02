import type { ChatNativePlanningInput, ChatNativePlanningState, MusicDirectorPlanningInput, MusicDirectorPlanningResult } from '../backend-types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import { MOCK_USER_ID, MOCK_WORKSPACE_ID, mockClips, mockRealEstatePrompt } from '../mock/mock-service-data'
import { createInlineCreditEstimateCard, createInlineEditPlanCard, createInlineSourceSequenceCard, sendUserMessage, startChatEditorSession } from '../services/chat-editor-service'
import { createCreditEstimate } from '../services/credit-service'
import {
  createAmbientSoundPlan,
  createAudioEnvironmentAnalysis,
  createCaptionPlan,
  createCutDecisions,
  createEditQualityChecks,
  createEditQualityProfile,
  createMusicPlan,
  createPacingAnalysis,
  createSoundEffectPlan,
  createTransitionPlans,
} from '../services/edit-quality-service'
import {
  createEditInstructions,
  createEditPlan,
  createEditPlanSegments,
  createSignatureRoutes,
  createStoryBeatMap,
  markEditPlanAwaitingApproval,
} from '../services/edit-plan-service'
import { analyzeUserIntent, chooseHookPolicy, createRecommendedEditStructure, createSourceSequenceMap } from '../services/intent-planning-service'
import { attachClipsInChat } from '../services/media-service'
import { createProject, markProjectAwaitingApproval, markProjectPlanning, setCurrentChatSession, setCurrentEditPlan } from '../services/project-service'
import {
  createMeaningExpansion,
  createStrokeMotionBeats,
  createStrokeMotionCharacters,
  createStrokeMotionGenerationSpec,
  createStrokeMotionPlan,
  createStrokeMotionStoryboardFrames,
  createStrokeMotionSymbols,
  createStrokeMotionTimingAnchors,
  createStrokeMotionTransitions,
} from '../services/stroke-motion-service'
import { fail, ok, type ServiceResult, unwrapServiceResult } from '../service-result'
import { runMockMusicDirectorPlanningFlow } from './mock-music-planning-orchestrator'

export function runChatNativeEditPlanningFlow(
  input: ChatNativePlanningInput = {},
  db: MockDatabase = createMockDatabase(),
): ServiceResult<ChatNativePlanningState> {
  const workspaceId = input.workspaceId ?? MOCK_WORKSPACE_ID
  const userId = input.userId ?? MOCK_USER_ID
  const prompt = input.prompt ?? mockRealEstatePrompt
  const project = unwrapServiceResult(
    createProject(db, {
      workspaceId,
      userId,
      title: input.projectTitle ?? 'Mock ReeditPro chat-native edit',
      description: 'Mock project for RP-DB-12 backend skeleton.',
    }),
  )
  const chatSession = unwrapServiceResult(
    startChatEditorSession(db, {
      workspaceId,
      userId,
      projectId: project.id,
      title: 'Mock planning chat',
    }),
  )

  unwrapServiceResult(setCurrentChatSession(db, project.id, chatSession))
  unwrapServiceResult(markProjectPlanning(db, project.id))

  const userMessage = unwrapServiceResult(
    sendUserMessage(db, {
      projectId: project.id,
      chatSessionId: chatSession.id,
      role: 'user',
      content: prompt,
    }),
  )
  const clipAttachment = unwrapServiceResult(
    attachClipsInChat(db, {
      workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      chatMessageId: userMessage.id,
      uploadedByUserId: userId,
      clips: input.clips ?? mockClips,
    }),
  )

  unwrapServiceResult(
    createInlineSourceSequenceCard(db, chatSession.id, userMessage.id, project.id, {
      sourceClipSequenceId: clipAttachment.sourceSequence.id,
      uploadedClipCount: clipAttachment.sourceSequenceItems.length,
      sourceOrderIsNotFinalOrder: true,
    }),
  )

  const intentAnalysis = unwrapServiceResult(
    analyzeUserIntent(db, {
      workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      chatMessageId: userMessage.id,
      prompt,
    }),
  )
  const sourceSequenceMap = unwrapServiceResult(
    createSourceSequenceMap(db, {
      workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      sourceClipSequenceId: clipAttachment.sourceSequence.id,
      intentAnalysisId: intentAnalysis.id,
    }),
  )
  const recommendedStructure = unwrapServiceResult(
    createRecommendedEditStructure(db, {
      workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      intentAnalysisId: intentAnalysis.id,
      sourceSequenceMapId: sourceSequenceMap.id,
      hookPolicy: chooseHookPolicy(prompt),
    }),
  )
  const editPlan = unwrapServiceResult(
    createEditPlan(db, {
      projectId: project.id,
      chatSessionId: chatSession.id,
      intentAnalysisId: intentAnalysis.id,
      sourceClipSequenceId: clipAttachment.sourceSequence.id,
      sourceSequenceMapId: sourceSequenceMap.id,
      recommendedEditStructureId: recommendedStructure.id,
    }),
  )
  const storyBeatMap = unwrapServiceResult(createStoryBeatMap(db, editPlan.id, project.id))

  unwrapServiceResult(createEditPlanSegments(db, { projectId: project.id, editPlanId: editPlan.id, storyBeatMapId: storyBeatMap.id }))
  unwrapServiceResult(createSignatureRoutes(db, editPlan.id, project.id))
  unwrapServiceResult(createEditInstructions(db, { projectId: project.id, editPlanId: editPlan.id, sourceChatMessageId: userMessage.id }))

  const awaitingPlan = unwrapServiceResult(markEditPlanAwaitingApproval(db, editPlan.id))
  unwrapServiceResult(setCurrentEditPlan(db, project.id, awaitingPlan.id))
  unwrapServiceResult(markProjectAwaitingApproval(db, project.id))

  const qualityProfile = unwrapServiceResult(createEditQualityProfile(db, project.id, awaitingPlan.id))

  unwrapServiceResult(createPacingAnalysis(db, project.id, awaitingPlan.id))
  unwrapServiceResult(createCutDecisions(db, project.id, awaitingPlan.id))
  unwrapServiceResult(createTransitionPlans(db, project.id, awaitingPlan.id))
  const audioEnvironmentAnalyses = unwrapServiceResult(createAudioEnvironmentAnalysis(db, project.id, awaitingPlan.id))
  const ambientSoundPlan = unwrapServiceResult(createAmbientSoundPlan(db, project.id, awaitingPlan.id))
  const musicDirectorPlan = input.includeMusicDirectorPlanning
    ? unwrapServiceResult(
        runMockMusicDirectorPlanningFlow(
          {
            workspaceId,
            projectId: project.id,
            editPlanId: awaitingPlan.id,
            chatSessionId: chatSession.id,
            userPrompt: prompt,
            transcriptSummary: intentAnalysis.userGoalSummary,
            videoType: intentAnalysis.selectedWorkflowContext ?? 'chat_native_edit',
            targetPlatform: intentAnalysis.targetPlatform as MusicDirectorPlanningInput['targetPlatform'],
            sceneDescriptions: db.editPlanSegments
              .filter((segment) => segment.editPlanId === awaitingPlan.id)
              .map((segment, index) => ({
                id: segment.id,
                sceneType: index === 0 ? 'intro' : 'custom',
                label: `Edit segment ${segment.segmentOrder}`,
                summary: `${segment.segmentPurpose}. ${segment.recommendedAction}`,
                startTimeSeconds: segment.outputStartSeconds,
                endTimeSeconds: segment.outputEndSeconds,
                hasSpeech: Boolean(segment.transcriptText) || prompt.toLowerCase().includes('speaker'),
                isMontage: segment.signatureSystem !== 'none',
              })),
            sourceClipSummaries: clipAttachment.mediaAssets.map((asset) => `${asset.fileName} (${asset.durationSeconds ?? 0}s)`),
            referenceSummary: prompt.toLowerCase().includes('lake como')
              ? 'Lake Como luxury lifestyle vacation reference with dialogue, boat movement, food/social moments, ambience, and premium casual pacing.'
              : undefined,
            audioEnvironmentSummary: [
              ...audioEnvironmentAnalyses.map((analysis) => analysis.ambientEnvironment),
              ambientSoundPlan.preserveNaturalRoomTone ? 'Preserve natural room tone.' : '',
            ]
              .filter(Boolean)
              .join(' '),
            editQualitySummary: qualityProfile.audioStrategy,
            userMusicInstructions: [prompt],
            avoidMusicInstructions: ['No random music.', 'No lyrics under important speech.', 'Do not copy reference tracks.'],
            spokenLanguages: ['english'],
            audience: 'Mock ReeditPro planning audience',
            settingSummary: prompt,
          },
          db,
        ),
      )
    : undefined

  unwrapServiceResult(
    createMusicPlan(db, project.id, awaitingPlan.id, {
      musicContextAnalysisId: musicDirectorPlan?.musicContextAnalysis.id,
      musicCueSheetId: musicDirectorPlan?.cueSheet.id,
      referenceMusicDNAId: musicDirectorPlan?.referenceMusicDNA?.id,
      musicMixPlanId: musicDirectorPlan?.mixPlans[0]?.id,
    }),
  )
  unwrapServiceResult(createSoundEffectPlan(db, project.id, awaitingPlan.id))
  unwrapServiceResult(createCaptionPlan(db, project.id, awaitingPlan.id))
  unwrapServiceResult(createEditQualityChecks(db, project.id, awaitingPlan.id))

  const shouldCreateStrokeMotion = input.requestedStrokeMotion ?? true
  const strokeMotionPlan = shouldCreateStrokeMotion
    ? unwrapServiceResult(
        createStrokeMotionPlan(db, {
          workspaceId,
          projectId: project.id,
          chatSessionId: chatSession.id,
          editPlanId: awaitingPlan.id,
          mode: input.strokeMotionMode ?? 'source_reading_mode',
        }),
      )
    : undefined

  if (strokeMotionPlan) {
    unwrapServiceResult(createMeaningExpansion(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionBeats(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionCharacters(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionSymbols(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionTransitions(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionTimingAnchors(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionStoryboardFrames(db, strokeMotionPlan.id, workspaceId, project.id))
    unwrapServiceResult(createStrokeMotionGenerationSpec(db, strokeMotionPlan.id, workspaceId, project.id))
  }

  const creditEstimate = unwrapServiceResult(
    createCreditEstimate(db, {
      workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      editPlanId: awaitingPlan.id,
    }),
  )
  const assistantMessage = unwrapServiceResult(
    sendUserMessage(db, {
      projectId: project.id,
      chatSessionId: chatSession.id,
      role: 'assistant',
      content: 'Here is the mock edit plan and credit estimate. Generation is blocked until approval.',
    }),
  )

  unwrapServiceResult(
    createInlineEditPlanCard(db, chatSession.id, assistantMessage.id, project.id, {
      editPlanId: awaitingPlan.id,
      status: awaitingPlan.status,
      approvalRequiredBeforeGeneration: true,
    }),
  )
  unwrapServiceResult(
    createInlineCreditEstimateCard(db, chatSession.id, assistantMessage.id, project.id, {
      creditEstimateId: creditEstimate.id,
      totalEstimatedCredits: creditEstimate.totalEstimatedCredits,
      approvalRequiredBeforeReservation: true,
    }),
  )

  const state: ChatNativePlanningState = {
    project,
    chatSession,
    messages: [userMessage, assistantMessage],
    sourceAssets: clipAttachment.mediaAssets,
    sourceSequence: clipAttachment.sourceSequence,
    intentAnalysis,
    editPlan: awaitingPlan,
    qualityProfile,
    strokeMotionPlan,
    musicDirectorPlan,
    creditEstimate,
    nextRequiredAction: 'approve_plan_and_credits',
  }

  return ok(state, ['Mock planning flow stops before generation until plan and credits are approved.'])
}

export function getLatestPlanningState(db: MockDatabase): ServiceResult<ChatNativePlanningState> {
  const project = db.projects.at(-1)
  const chatSession = db.chatSessions.at(-1)
  const intentAnalysis = db.intentAnalyses.at(-1)
  const editPlan = db.editPlans.at(-1)
  const qualityProfile = db.editQualityProfiles.at(-1)
  const creditEstimate = db.creditEstimates.at(-1)
  const sourceSequence = db.sourceClipSequences.at(-1)

  if (!project || !chatSession || !intentAnalysis || !editPlan || !qualityProfile || !creditEstimate || !sourceSequence) {
    return fail('UNKNOWN_ERROR', 'No complete mock planning state is available.')
  }

  return ok({
    project,
    chatSession,
    messages: db.chatMessages,
    sourceAssets: db.mediaAssets,
    sourceSequence,
    intentAnalysis,
    editPlan,
    qualityProfile,
    strokeMotionPlan: db.strokeMotionPlans.at(-1),
    musicDirectorPlan: getLatestMockMusicDirectorPlan(db),
    creditEstimate,
    nextRequiredAction: 'approve_plan_and_credits',
  })
}

function getLatestMockMusicDirectorPlan(db: MockDatabase): MusicDirectorPlanningResult | undefined {
  const cueSheet = db.musicCueSheets.at(-1)

  if (!cueSheet) {
    return undefined
  }

  const musicContextAnalysis = db.musicContextAnalyses.find((analysis) => analysis.id === cueSheet.musicContextAnalysisId)

  if (!musicContextAnalysis) {
    return undefined
  }

  const cues = db.musicCues
    .filter((cue) => cue.musicCueSheetId === cueSheet.id)
    .sort((a, b) => a.cueOrder - b.cueOrder)

  return {
    musicContextAnalysis,
    languageContexts: db.musicLanguageContexts.filter((context) => context.musicContextAnalysisId === musicContextAnalysis.id),
    referenceMusicDNA: cueSheet.referenceDnaUsed
      ? db.musicReferenceDna.find((dna) => dna.id === cueSheet.metadata?.musicReferenceDnaId) ?? db.musicReferenceDna.at(-1)
      : undefined,
    cueSheet,
    cues,
    mixPlans: db.musicMixPlans.filter((plan) => plan.musicCueSheetId === cueSheet.id),
    nextStep: 'create_lyria_prompt_plan',
    warnings: ['Music plan created. Next required action: create Lyria Pro prompt plan and credit estimate.'],
  }
}
