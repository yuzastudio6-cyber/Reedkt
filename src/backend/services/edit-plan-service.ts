import type {
  EditInstructionRecord,
  EditPlanRecord,
  EditPlanSegmentRecord,
  SignatureRouteRecord,
  StoryBeatMapRecord,
  StoryBeatRecord,
} from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createEditPlan(
  db: MockDatabase,
  input: {
    projectId: string
    chatSessionId: string
    intentAnalysisId: string
    sourceClipSequenceId: string
    sourceSequenceMapId?: string
    recommendedEditStructureId?: string
  },
): ServiceResult<EditPlanRecord> {
  const intent = findMockRecord(db, 'intentAnalyses', input.intentAnalysisId)

  if (!intent) {
    return fail('INTENT_ANALYSIS_NOT_FOUND', `Intent analysis ${input.intentAnalysisId} was not found.`)
  }

  const editPlan: EditPlanRecord = {
    id: createMockId('edit-plan'),
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    intentAnalysisId: input.intentAnalysisId,
    sourceClipSequenceId: input.sourceClipSequenceId,
    sourceSequenceMapId: input.sourceSequenceMapId,
    recommendedEditStructureId: input.recommendedEditStructureId,
    status: 'planning',
    complexity: intent.requestedEditComplexity ?? 'basic_edit',
    professionalStandardRequired: true,
    goalSummary: intent.userGoalSummary,
    strategySummary: 'Professional clean edit plan with segment-level routing before generation.',
    hookPolicy: 'recommended',
    hookRecommendation: 'Use a contextual hook only if it improves clarity.',
    approvalStatus: 'pending',
    approvalRequiredBeforeGeneration: true,
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      generationAllowed: false,
      basicEditIsNotLowQuality: true,
    },
  }

  return ok(insertMockRecord(db, 'editPlans', editPlan))
}

export function createStoryBeatMap(
  db: MockDatabase,
  editPlanId: string,
  projectId: string,
): ServiceResult<StoryBeatMapRecord> {
  const storyBeatMap: StoryBeatMapRecord = {
    id: createMockId('story-beat-map'),
    projectId,
    editPlanId,
    title: 'Mock story beat map',
    summary: 'A clear source-to-preview story path for the edit plan.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'storyBeatMaps', storyBeatMap))
}

export function createEditPlanSegments(
  db: MockDatabase,
  input: {
    projectId: string
    editPlanId: string
    storyBeatMapId: string
  },
): ServiceResult<EditPlanSegmentRecord[]> {
  const sequenceItems = db.sourceClipSequenceItems.slice(0, 3)
  const segments = sequenceItems.map((item, index) => {
    const beat: StoryBeatRecord = {
      id: createMockId('story-beat'),
      storyBeatMapId: input.storyBeatMapId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      beatOrder: index + 1,
      beatType: index === 0 ? 'hook' : 'context',
      status: 'planned',
      label: index === 0 ? 'Opening context' : `Support beat ${index + 1}`,
      purpose: 'Keep the edit understandable and professionally paced.',
      active: true,
      linkedSegmentIds: [],
      linkedTranscriptSegmentIds: [],
      metadata: { mockOnly: true },
    }

    insertMockRecord(db, 'storyBeats', beat)

    const segment: EditPlanSegmentRecord = {
      id: createMockId('edit-plan-segment'),
      editPlanId: input.editPlanId,
      projectId: input.projectId,
      segmentOrder: index + 1,
      sourceClipId: item.mediaAssetId,
      outputStartSeconds: index * 6,
      outputEndSeconds: index * 6 + 6,
      storyBeatId: beat.id,
      segmentPurpose: beat.purpose,
      recommendedAction: index === 1 ? 'Use as clean supporting detail with subtle transition.' : 'Use with clean professional pacing.',
      signatureSystem: index === 1 ? 'stroke_motion' : 'none',
      signatureReason: index === 1 ? 'Optional explanation overlay may clarify value.' : 'Basic clean edit does not need a signature system here.',
      creditImpact: index === 1 ? 'medium' : 'low',
      notesForEditor: ['Keep the edit clean and intentional.'],
      notesForWorker: ['Video type gives context but does not force signature usage.'],
      mustFollowRules: ['Do not start generation before approval.'],
      avoidRules: ['Do not imply Basic Edit is low quality.'],
      metadata: { mockOnly: true },
    }

    beat.linkedSegmentIds = [segment.id]
    return insertMockRecord(db, 'editPlanSegments', segment)
  })

  return ok(segments)
}

export function createSignatureRoutes(
  db: MockDatabase,
  editPlanId: string,
  projectId: string,
): ServiceResult<SignatureRouteRecord[]> {
  const routes = db.editPlanSegments
    .filter((segment) => segment.editPlanId === editPlanId)
    .map((segment) => {
      const route: SignatureRouteRecord = {
        id: createMockId('signature-route'),
        projectId,
        editPlanId,
        editPlanSegmentId: segment.id,
        signatureSystem: segment.signatureSystem,
        requirement: segment.signatureSystem === 'none' ? 'optional' : 'recommended',
        reason: segment.signatureReason,
        timing: {
          startSeconds: segment.outputStartSeconds,
          endSeconds: segment.outputEndSeconds,
        },
        creditImpact: segment.creditImpact,
        optional: segment.signatureSystem === 'none',
        approvalNeeded: segment.signatureSystem !== 'none',
        workerTarget: segment.signatureSystem === 'stroke_motion' ? 'stroke_motion_story_agent' : 'none',
        status: 'draft',
        metadata: { routedPerSegment: true },
      }

      return insertMockRecord(db, 'signatureRoutes', route)
    })

  return ok(routes)
}

export function createEditInstructions(
  db: MockDatabase,
  input: {
    projectId: string
    editPlanId: string
    sourceChatMessageId?: string
  },
): ServiceResult<EditInstructionRecord[]> {
  const instructions: EditInstructionRecord[] = [
    {
      id: createMockId('edit-instruction'),
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      sourceChatMessageId: input.sourceChatMessageId,
      instructionType: 'worker_note',
      targetWorker: 'generation_orchestrator',
      text: 'Basic edit remains professional clean editing; generation still requires approval.',
      appliesToSegmentIds: [],
      priority: 'must_follow',
      mustFollow: true,
      avoid: false,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    },
  ]

  instructions.forEach((instruction) => insertMockRecord(db, 'editInstructions', instruction))
  return ok(instructions)
}

export function markEditPlanAwaitingApproval(
  db: MockDatabase,
  editPlanId: string,
): ServiceResult<EditPlanRecord> {
  return updateEditPlan(db, editPlanId, { status: 'awaiting_approval', approvalStatus: 'pending' })
}

export function approveEditPlan(
  db: MockDatabase,
  editPlanId: string,
  approvedByUserId: string,
): ServiceResult<EditPlanRecord> {
  return updateEditPlan(db, editPlanId, {
    status: 'approved',
    approvalStatus: 'approved',
    approvedByUserId,
    approvedAt: nowIso(),
  })
}

export function reviseEditPlan(
  db: MockDatabase,
  editPlanId: string,
  requestedChange: string,
): ServiceResult<EditPlanRecord> {
  return updateEditPlan(db, editPlanId, {
    status: 'revision_requested',
    approvalStatus: 'revise_requested',
    metadata: { requestedChange },
  })
}

function updateEditPlan(
  db: MockDatabase,
  editPlanId: string,
  patch: Partial<EditPlanRecord>,
): ServiceResult<EditPlanRecord> {
  const editPlan = findMockRecord(db, 'editPlans', editPlanId)

  if (!editPlan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Edit plan ${editPlanId} was not found.`)
  }

  Object.assign(editPlan, patch, { updatedAt: nowIso() })
  return ok(editPlan)
}
