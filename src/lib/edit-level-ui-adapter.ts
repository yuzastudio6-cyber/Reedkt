import type {
  EditLevelEstimateProfile,
  EditLevelFallbackPolicy,
  EditLevelRecommendationInput,
  EditLevelRecommendationResult,
  EditLevelRepositoryResult,
  EditLevelSelectionRecord,
  EditLevelToolRoutingProfile,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
  ReEditProLegacyEditLevel,
} from '../types'
import type { EditLevel } from '../types/reeditpro'
import { createMockEditLevelApiClient } from './edit-level-api-client-adapter'
import { createMockEditLevelRecommendationInput } from './edit-level-recommendation-fixtures'
import {
  createEditLevelEstimateProfile,
  createEditLevelFallbackPolicy,
  createEditLevelToolRoutingProfile,
  createEditLevelUICardModels,
} from './edit-level-profile-mappers'
import {
  createEditLevelEstimateSummary,
  createEditLevelFallbackSummary,
  createEditLevelQAProfileSummary,
  createEditLevelQwenRoutingSummary,
  createEditLevelReadableSummary,
  createEditLevelToolRoutingSummary,
} from './edit-level-summary-mappers'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'

export interface EditLevelCardGroupModel {
  cards: EditLevelUICardModel[]
  selectedLevel?: ReEditProCanonicalEditLevel
  recommendedLevel?: ReEditProCanonicalEditLevel
  boundarySummary: string[]
  mockOnly: boolean
}

export interface EditLevelSelectedSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: string
  promise: string
  editBriefGuidance: string
  qaSummary: string
  estimateSummary: string
  boundarySummary: string
}

export interface EditLevelToolDepthSummaryModel {
  level: ReEditProCanonicalEditLevel
  displayName: string
  qwenReasoningDepth: string
  visualUnderstandingDepth: string
  transcriptPolicy: string
  audioPolicy: string
  graphicsPolicy: string
  qaProfile: string
  summary: string[]
}

export interface EditLevelEstimateNoticeModel {
  level: ReEditProCanonicalEditLevel
  displayName: string
  estimateOnly: true
  creditEstimateMultiplier: number
  creditsReservedOrSpent: false
  renderBudgetFuture: number
  revisionBudgetFuture: number
  variantBudgetFuture: number
  notice: string
}

export interface EditLevelUIRecommendationModel {
  recommendation: EditLevelRecommendationResult
  recordId?: string
}

const client = createMockEditLevelApiClient()

export function mapCanonicalEditLevelToLegacyRuntime(
  level: ReEditProCanonicalEditLevel,
): EditLevel {
  if (level === 'normal') return 'basic'
  if (level === 'premium') return 'pro'
  return 'premium'
}

export function mapLegacyRuntimeEditLevelToCanonical(
  level: EditLevel | ReEditProLegacyEditLevel,
): ReEditProCanonicalEditLevel {
  if (level === 'basic') return 'normal'
  if (level === 'pro') return 'premium'
  return 'ultra_premium'
}

export function createEditLevelBoundarySummary(): string[] {
  return [
    'Changing level adjusts the planned depth and polish.',
    'Billing policy: final charge is actual billable tool cost + ReEditPro service/edit fee; this UI does not calculate, reserve, or spend it.',
    'Rendering, workers, tool execution, provider calls, and credits remain future-gated.',
    'Selecting a level does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, media workers, render/export, or credit spend.',
  ]
}

export function createEditLevelCardGroupModel(input: {
  cards?: EditLevelUICardModel[]
  selectedLevel?: ReEditProCanonicalEditLevel
  recommendedLevel?: ReEditProCanonicalEditLevel
} = {}): EditLevelCardGroupModel {
  const cards = input.cards ?? createEditLevelUICardModels(input.recommendedLevel)

  return {
    cards: cards.map((card) => ({
      ...card,
      recommended: card.level === input.recommendedLevel || card.recommended,
    })),
    selectedLevel: input.selectedLevel,
    recommendedLevel: input.recommendedLevel,
    boundarySummary: createEditLevelBoundarySummary(),
    mockOnly: true,
  }
}

export function createEditLevelSelectedSummaryModel(
  level: ReEditProCanonicalEditLevel,
): EditLevelSelectedSummaryModel {
  const card = createEditLevelUICardModels().find((item) => item.level === level)

  return {
    level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    promise: card?.tagline ?? createEditLevelReadableSummary(level),
    editBriefGuidance: card?.editBriefGuidance ?? `${mapCanonicalEditLevelToPublicLabel(level)} Edit Brief guidance.`,
    qaSummary: createEditLevelQAProfileSummary(level),
    estimateSummary: createEditLevelEstimateSummary(level),
    boundarySummary: 'Mock/local selection only. Final charge policy is actual billable tool cost + ReEditPro service/edit fee; selecting this level does not start render, workers, tool execution, reservation, or credit spend.',
  }
}

export function createEditLevelToolDepthSummaryModel(
  level: ReEditProCanonicalEditLevel,
  routing: EditLevelToolRoutingProfile = createEditLevelToolRoutingProfile(level),
): EditLevelToolDepthSummaryModel {
  return {
    level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    qwenReasoningDepth: routing.qwen3ReasoningDepth,
    visualUnderstandingDepth: routing.qwen25vlVisualDepth,
    transcriptPolicy: routing.transcriptPolicy,
    audioPolicy: routing.audioPolicy,
    graphicsPolicy: routing.graphicsPolicy,
    qaProfile: createEditLevelQAProfileSummary(level),
    summary: [
      createEditLevelToolRoutingSummary(level),
      createEditLevelQwenRoutingSummary(level),
      createEditLevelFallbackSummary(level),
    ],
  }
}

export function createEditLevelEstimateNoticeModel(
  level: ReEditProCanonicalEditLevel,
  estimate: EditLevelEstimateProfile = createEditLevelEstimateProfile(level),
): EditLevelEstimateNoticeModel {
  return {
    level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    estimateOnly: estimate.estimateOnly,
    creditEstimateMultiplier: estimate.creditEstimateMultiplier,
    creditsReservedOrSpent: estimate.creditsReservedOrSpent,
    renderBudgetFuture: estimate.renderPassBudgetFuture,
    revisionBudgetFuture: estimate.revisionBudgetFuture,
    variantBudgetFuture: estimate.variantBudgetFuture,
    notice: `${estimate.creditEstimateMultiplier}x credit estimate only. Final charge policy is actual billable tool cost + ReEditPro service/edit fee. No credits are reserved or spent by selecting ${mapCanonicalEditLevelToPublicLabel(level)}; render, revision, and variant budgets are future metadata.`,
  }
}

function assertNoSideEffects(result: EditLevelRepositoryResult<unknown>) {
  return result.mockOnly &&
    !result.providerCallMade &&
    !result.mediaProcessingStarted &&
    !result.workerJobCreated &&
    !result.renderJobCreated &&
    !result.creditReservedOrSpent &&
    !result.supabaseReadMade &&
    !result.supabaseWriteMade &&
    !result.fileBytesRead &&
    !result.externalUrlFetched
}

export async function loadEditLevelRecommendationForUI(
  input: Partial<EditLevelRecommendationInput> = {},
): Promise<EditLevelRepositoryResult<EditLevelUIRecommendationModel>> {
  const recommendationInput = createMockEditLevelRecommendationInput(input)
  const result = await client.recommendation.create({
    projectId: 'mock-ui-edit-level',
    sessionId: 'mock-ui-edit-level-session',
    input: recommendationInput,
  })

  if (!result.ok || !result.data) {
    return {
      ...result,
      data: undefined,
      error: result.error ?? 'Unable to load Edit Level recommendation.',
    }
  }

  return {
    ...result,
    data: {
      recommendation: result.data.recommendation,
      recordId: result.data.id,
    },
    warnings: [
      ...result.warnings,
      'Recommendation is based on current mock/local project context.',
    ],
  }
}

export async function loadEditLevelCardsForUI(input: {
  selectedLevel?: ReEditProCanonicalEditLevel
  recommendationInput?: Partial<EditLevelRecommendationInput>
} = {}): Promise<EditLevelRepositoryResult<EditLevelCardGroupModel>> {
  const recommendation = await loadEditLevelRecommendationForUI(input.recommendationInput)
  const recommendedLevel = recommendation.data?.recommendation.recommendedLevel
  const cards = await client.uiCards.create({ recommendedLevel })

  return {
    ...cards,
    data: createEditLevelCardGroupModel({
      cards: cards.data,
      recommendedLevel,
      selectedLevel: input.selectedLevel ?? recommendedLevel,
    }),
    warnings: [
      ...cards.warnings,
      ...recommendation.warnings,
      'Cards are visible/product-facing, but selection remains mock/local.',
    ],
  }
}

export async function loadEditLevelSelectionForUI(
  selectionId?: string,
): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord | undefined>> {
  if (!selectionId) {
    const summary = await client.repository.summary()
    return {
      ...summary,
      data: undefined,
      warnings: [
        ...summary.warnings,
        'No existing mock selection id was provided.',
      ],
    }
  }

  return client.selection.get({ id: selectionId })
}

export async function saveEditLevelSelectionForUI(input: {
  level: ReEditProCanonicalEditLevel
  recommendationId?: string
}): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord>> {
  return client.selection.save({
    projectId: 'mock-ui-edit-level',
    sessionId: 'mock-ui-edit-level-session',
    input: {
      value: input.level,
      inputSource: 'explicit_canonical',
    },
    recommendationId: input.recommendationId,
  })
}

export async function updateEditLevelSelectionForUI(input: {
  selectionId: string
  level: ReEditProCanonicalEditLevel
  recommendationId?: string
}): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord>> {
  return client.selection.update({
    id: input.selectionId,
    input: {
      value: input.level,
      inputSource: 'explicit_canonical',
    },
    recommendationId: input.recommendationId,
  })
}

export async function clearEditLevelSelectionForUI(
  selectionId: string,
): Promise<EditLevelRepositoryResult<{ cleared: boolean; id: string }>> {
  return client.selection.clear({ id: selectionId })
}

export function createEditLevelFallbackPolicyForUI(
  level: ReEditProCanonicalEditLevel,
): EditLevelFallbackPolicy {
  return createEditLevelFallbackPolicy(level)
}

export function editLevelUIResultHasNoSideEffects(result: EditLevelRepositoryResult<unknown>): boolean {
  return assertNoSideEffects(result)
}
