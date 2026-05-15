import type {
  EditComplexity,
  HookPolicy,
  IntentAnalysisRecord,
  RecommendedEditStructureRecord,
  SourceSequenceMapItemRecord,
  SourceSequenceMapRecord,
} from '../../types'
import type { AnalyzeIntentRequest } from '../contracts/planning-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function analyzeUserIntent(
  db: MockDatabase,
  input: AnalyzeIntentRequest,
): ServiceResult<IntentAnalysisRecord> {
  if (!input.prompt.trim()) {
    return fail('MISSING_USER_INTENT', 'A user instruction is required before planning.')
  }

  const intentAnalysis: IntentAnalysisRecord = {
    id: createMockId('intent-analysis'),
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    sourceChatMessageIds: input.chatMessageId ? [input.chatMessageId] : [],
    userGoalSummary: input.prompt,
    explicitInstructions: [input.prompt],
    inferredIntent: 'Create a professional chat-native edit plan before generation.',
    missingInformationQuestions: [],
    selectedWorkflowContext: 'real_estate_property_tour',
    workflowContextOnly: true,
    targetPlatform: 'tiktok_reels_shorts',
    requestedEditComplexity: chooseEditComplexity(input.prompt),
    confidence: 'high',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      userInstructionWins: true,
      videoTypeDoesNotForceSignatureSystem: true,
      basicEditIsProfessional: true,
    },
  }

  return ok(insertMockRecord(db, 'intentAnalyses', intentAnalysis))
}

export function createSourceSequenceMap(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    chatSessionId: string
    sourceClipSequenceId: string
    intentAnalysisId: string
  },
): ServiceResult<SourceSequenceMapRecord> {
  const items = db.sourceClipSequenceItems
    .filter((item) => item.sourceClipSequenceId === input.sourceClipSequenceId)
    .sort((left, right) => left.uploadedOrder - right.uploadedOrder)

  if (items.length === 0) {
    return fail('NO_SOURCE_CLIPS', 'Source sequence mapping requires at least one source clip.')
  }

  const sourceSequenceMap: SourceSequenceMapRecord = {
    id: createMockId('source-sequence-map'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    sourceClipSequenceId: input.sourceClipSequenceId,
    intentAnalysisId: input.intentAnalysisId,
    summary: 'The uploaded clip order gives the planner source context for the story.',
    detectedStoryOrder: 'entry -> details -> speaker value line -> exterior close',
    strongMoments: [{ label: 'speaker_value_line', reason: 'Clear value statement.' }],
    weakMoments: [{ label: 'raw_order', reason: 'May need final structure refinement.' }],
    clipRoleSummary: items.map((item) => ({
      sourceClipSequenceItemId: item.id,
      uploadedOrder: item.uploadedOrder,
      role: item.uploadedOrder === 1 ? 'opening_context' : 'supporting_context',
    })),
    aiNotes: {
      sourceOrderIsNotFinalOrder: true,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  insertMockRecord(db, 'sourceSequenceMaps', sourceSequenceMap)

  items.forEach((item) => {
    const mapItem: SourceSequenceMapItemRecord = {
      id: createMockId('source-sequence-map-item'),
      sourceSequenceMapId: sourceSequenceMap.id,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sourceClipSequenceItemId: item.id,
      mediaAssetId: item.mediaAssetId,
      uploadedOrder: item.uploadedOrder,
      detectedRole: item.uploadedOrder === 1 ? 'opening' : 'support',
      storyFunction: 'Provide source context for the planned edit.',
      strengths: ['Useful visual context'],
      concerns: ['Needs edit-quality pass before rendering'],
      possibleUses: ['final_edit_candidate', 'b_roll_context'],
      recommendedUse: 'Use if it supports the approved structure.',
      shouldPreserveOrder: true,
      aiNotes: 'Preserve source order as context, not as automatic output order.',
      createdAt: nowIso(),
      metadata: { mockOnly: true },
    }

    insertMockRecord(db, 'sourceSequenceMapItems', mapItem)
  })

  return ok(sourceSequenceMap)
}

export function createRecommendedEditStructure(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    chatSessionId: string
    intentAnalysisId: string
    sourceSequenceMapId: string
    hookPolicy?: HookPolicy
  },
): ServiceResult<RecommendedEditStructureRecord> {
  const recommendedStructure: RecommendedEditStructureRecord = {
    id: createMockId('recommended-structure'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    intentAnalysisId: input.intentAnalysisId,
    sourceSequenceMapId: input.sourceSequenceMapId,
    structureSummary: 'Open with the strongest context, clarify value, then close with exterior proof.',
    preserveSourceOrder: false,
    restructureReason: 'Final edit order can improve clarity, but must be shown before generation.',
    hookPolicy: input.hookPolicy ?? 'recommended',
    structureSteps: [
      { order: 1, label: 'premium opening context' },
      { order: 2, label: 'interior detail support' },
      { order: 3, label: 'speaker value line' },
      { order: 4, label: 'exterior close' },
    ],
    userApprovalRequired: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      sourceSequenceSeparateFromFinalStructure: true,
      generationBlockedUntilApproval: true,
    },
  }

  return ok(insertMockRecord(db, 'recommendedEditStructures', recommendedStructure))
}

export function chooseEditComplexity(prompt: string): EditComplexity {
  const normalizedPrompt = prompt.toLowerCase()

  if (normalizedPrompt.includes('premium')) {
    return 'premium_signature_edit'
  }

  if (normalizedPrompt.includes('stroke') || normalizedPrompt.includes('signature')) {
    return 'signature_edit'
  }

  if (normalizedPrompt.includes('pro') || normalizedPrompt.includes('polished')) {
    return 'pro_edit'
  }

  return 'basic_edit'
}

export function chooseHookPolicy(prompt: string): HookPolicy {
  const normalizedPrompt = prompt.toLowerCase()

  if (normalizedPrompt.includes('no hook') || normalizedPrompt.includes('avoid hook')) {
    return 'avoid'
  }

  if (normalizedPrompt.includes('hook')) {
    return 'required'
  }

  return 'recommended'
}
