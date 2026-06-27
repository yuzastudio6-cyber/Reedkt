import { useEffect, useMemo, useState } from 'react'
import { Button } from '../Button'
import type { EditLevel } from '../../types/reeditpro'
import type {
  EditLevelRecommendationResult,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createEditLevelBoundarySummary,
  createEditLevelCardGroupModel,
  createEditLevelSelectedSummaryModel,
  createEditLevelToolDepthSummaryModel,
  loadEditLevelCardsForUI,
  mapCanonicalEditLevelToLegacyRuntime,
  mapLegacyRuntimeEditLevelToCanonical,
  saveEditLevelSelectionForUI,
  updateEditLevelSelectionForUI,
} from '../../lib/edit-level-ui-adapter'
import {
  EditLevelBoundaryNotice,
  EditLevelCardGroup,
  EditLevelCreditEstimateNotice,
  EditLevelEstimateBoundaryNotice,
  EditLevelEstimateItemList,
  EditLevelEstimateSummary,
  EditLevelMarkerContextPolicyCard,
  EditLevelQAFallbackNotice,
  EditLevelQAGateList,
  EditLevelQAGateSummary,
  EditLevelQAReadinessCard,
  EditLevelQwenFallbackNotice,
  EditLevelQwenPlanningDimensionList,
  EditLevelQwenPlanningSummary,
  EditLevelQwenUsageEstimateNotice,
  EditLevelRecommendationBanner,
  EditLevelRenderBudgetNotice,
  EditLevelRevisionBudgetNotice,
  EditLevelSelectedSummary,
  EditLevelSourceContextLayerList,
  EditLevelSourceUnderstandingFallbackNotice,
  EditLevelSourceUnderstandingSummary,
  EditLevelToolCapabilityList,
  EditLevelToolCapabilitySummary,
  EditLevelToolDepthSummary,
  EditLevelToolFallbackNotice,
} from '../edit-level'
import {
  createEditLevelToolCapabilityListModel,
  createEditLevelToolCapabilitySummaryModel,
  createEditLevelToolFallbackNoticeModel,
} from '../../lib/edit-level-tool-router-ui-adapter'
import {
  createEditLevelMarkerContextPolicyModel,
  createEditLevelSourceContextLayerListModel,
  createEditLevelSourceUnderstandingFallbackNoticeModel,
  createEditLevelSourceUnderstandingSummaryModel,
} from '../../lib/edit-level-source-understanding-ui-adapter'
import {
  createEditLevelQwenFallbackNoticeModel,
  createEditLevelQwenPlanningDimensionListModel,
  createEditLevelQwenPlanningSummaryModel,
  createEditLevelQwenUsageEstimateNoticeModel,
} from '../../lib/edit-level-qwen-planning-ui-adapter'
import {
  createEditLevelQAFallbackNoticeModel,
  createEditLevelQAGateListModel,
  createEditLevelQAGateSummaryModel,
  createEditLevelQAReadinessCardModel,
} from '../../lib/edit-level-qa-gates-ui-adapter'
import {
  createEditLevelCreditEstimateNoticeModel,
  createEditLevelEstimateBoundaryNoticeModel,
  createEditLevelEstimateItemListModel,
  createEditLevelEstimateSummaryModel,
  createEditLevelRenderBudgetNoticeModel,
  createEditLevelRevisionBudgetNoticeModel,
} from '../../lib/edit-level-estimates-ui-adapter'

type InlineEditLevelCardProps = {
  selectedLevel: EditLevel
  onSelect: (value: EditLevel) => void
  onConfirm?: () => void
  confirmed?: boolean
}

export function InlineEditLevelCard({ confirmed = false, onConfirm, onSelect, selectedLevel }: InlineEditLevelCardProps) {
  const selectedCanonical = mapLegacyRuntimeEditLevelToCanonical(selectedLevel)
  const [cards, setCards] = useState<EditLevelUICardModel[]>(() =>
    createEditLevelCardGroupModel({ selectedLevel: selectedCanonical }).cards,
  )
  const [recommendedLevel, setRecommendedLevel] = useState<ReEditProCanonicalEditLevel | undefined>(selectedCanonical)
  const [selectionId, setSelectionId] = useState<string | undefined>(undefined)
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    let cancelled = false

    loadEditLevelCardsForUI({
      selectedLevel: selectedCanonical,
      recommendationInput: {
        userPrompt: 'Clean professional edit with balanced creative polish.',
        desiredPolish: selectedCanonical === 'normal' ? 'fast_clean' : selectedCanonical === 'premium' ? 'enhanced' : 'studio',
      },
    }).then((result) => {
      if (cancelled || !result.data) return
      setCards(result.data.cards)
      setRecommendedLevel(result.data.recommendedLevel)
    }).catch(() => {
      if (!cancelled) {
        setCards(createEditLevelCardGroupModel({ selectedLevel: selectedCanonical }).cards)
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedCanonical])

  const effectiveRecommendedLevel = recommendedLevel ?? cards.find((card) => card.recommended)?.level
  const recommendation = useMemo<EditLevelRecommendationResult | undefined>(() => {
    const card = cards.find((item) => item.level === effectiveRecommendedLevel)
    if (!card) return undefined

    return {
      recommendedLevel: card.level,
      confidence: card.level === 'normal' ? 'medium' : 'high',
      reasons: [card.tagline, card.estimateSummary],
      warnings: ['Recommendation is based on current mock/local project context.'],
      degradedCapabilityNotices: ['Tool capability routing is mock/local; no tools execute.'],
      userOverrideAllowed: true,
      mockOnly: true,
    }
  }, [cards, effectiveRecommendedLevel])
  const selectedSummary = useMemo(
    () => createEditLevelSelectedSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const toolDepthSummary = useMemo(
    () => createEditLevelToolDepthSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const toolCapabilitySummary = useMemo(
    () => createEditLevelToolCapabilitySummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const toolCapabilityList = useMemo(
    () => createEditLevelToolCapabilityListModel(selectedCanonical),
    [selectedCanonical],
  )
  const toolFallbackNotice = useMemo(
    () => createEditLevelToolFallbackNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const sourceUnderstandingSummary = useMemo(
    () => createEditLevelSourceUnderstandingSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const sourceLayerList = useMemo(
    () => createEditLevelSourceContextLayerListModel(selectedCanonical),
    [selectedCanonical],
  )
  const markerContextPolicy = useMemo(
    () => createEditLevelMarkerContextPolicyModel(selectedCanonical),
    [selectedCanonical],
  )
  const sourceFallbackNotice = useMemo(
    () => createEditLevelSourceUnderstandingFallbackNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const qwenPlanningSummary = useMemo(
    () => createEditLevelQwenPlanningSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const qwenDimensionList = useMemo(
    () => createEditLevelQwenPlanningDimensionListModel(selectedCanonical),
    [selectedCanonical],
  )
  const qwenFallbackNotice = useMemo(
    () => createEditLevelQwenFallbackNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const qwenUsageEstimateNotice = useMemo(
    () => createEditLevelQwenUsageEstimateNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const qaGateSummary = useMemo(
    () => createEditLevelQAGateSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const qaGateList = useMemo(
    () => createEditLevelQAGateListModel(selectedCanonical),
    [selectedCanonical],
  )
  const qaReadiness = useMemo(
    () => createEditLevelQAReadinessCardModel(selectedCanonical),
    [selectedCanonical],
  )
  const qaFallbackNotice = useMemo(
    () => createEditLevelQAFallbackNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const estimateSummary = useMemo(
    () => createEditLevelEstimateSummaryModel(selectedCanonical),
    [selectedCanonical],
  )
  const estimateItemList = useMemo(
    () => createEditLevelEstimateItemListModel(selectedCanonical),
    [selectedCanonical],
  )
  const creditEstimateNotice = useMemo(
    () => createEditLevelCreditEstimateNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const renderBudgetNotice = useMemo(
    () => createEditLevelRenderBudgetNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const revisionBudgetNotice = useMemo(
    () => createEditLevelRevisionBudgetNoticeModel(selectedCanonical),
    [selectedCanonical],
  )
  const estimateBoundaryNotice = useMemo(
    () => createEditLevelEstimateBoundaryNoticeModel(selectedCanonical),
    [selectedCanonical],
  )

  async function handleSelect(level: ReEditProCanonicalEditLevel) {
    setSavingState('saving')
    onSelect(mapCanonicalEditLevelToLegacyRuntime(level))

    const result = selectionId
      ? await updateEditLevelSelectionForUI({ selectionId, level })
      : await saveEditLevelSelectionForUI({ level })

    if (result.ok && result.data) {
      setSelectionId(result.data.id)
      setSavingState('saved')
    } else {
      setSavingState('idle')
    }
  }

  return (
    <section className="inline-chat-card edit-level-inline-card" data-testid="edit-level-inline-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit Level</span>
          <h3>Choose the depth and polish for this edit</h3>
        </div>
      </div>
      <p className="inline-helper">
        Every level is professionally edited. Higher levels add deeper analysis, creative layering, QA strictness, and future budget.
      </p>

      <EditLevelRecommendationBanner recommendation={recommendation} />
      <EditLevelCardGroup
        cards={cards}
        onSelect={handleSelect}
        recommendedLevel={effectiveRecommendedLevel}
        selectedLevel={selectedCanonical}
      />
      <EditLevelSelectedSummary compact summary={selectedSummary} />
      <EditLevelToolDepthSummary summary={toolDepthSummary} />
      <EditLevelToolCapabilitySummary compact summary={toolCapabilitySummary} />
      <EditLevelToolCapabilityList model={toolCapabilityList} />
      <EditLevelToolFallbackNotice notice={toolFallbackNotice} />
      <EditLevelSourceUnderstandingSummary compact summary={sourceUnderstandingSummary} />
      <EditLevelMarkerContextPolicyCard compact policy={markerContextPolicy} />
      <EditLevelSourceContextLayerList model={sourceLayerList} />
      <EditLevelSourceUnderstandingFallbackNotice notice={sourceFallbackNotice} />
      <EditLevelQwenPlanningSummary compact summary={qwenPlanningSummary} />
      <EditLevelQwenPlanningDimensionList model={qwenDimensionList} />
      <EditLevelQwenFallbackNotice notice={qwenFallbackNotice} />
      <EditLevelQwenUsageEstimateNotice notice={qwenUsageEstimateNotice} />
      <EditLevelQAGateSummary compact summary={qaGateSummary} />
      <EditLevelQAReadinessCard readiness={qaReadiness} />
      <EditLevelQAGateList model={qaGateList} />
      <EditLevelQAFallbackNotice notice={qaFallbackNotice} />
      <EditLevelEstimateSummary compact summary={estimateSummary} />
      <EditLevelCreditEstimateNotice notice={creditEstimateNotice} />
      <EditLevelRenderBudgetNotice notice={renderBudgetNotice} />
      <EditLevelRevisionBudgetNotice notice={revisionBudgetNotice} />
      <EditLevelEstimateItemList model={estimateItemList} />
      <EditLevelEstimateBoundaryNotice notice={estimateBoundaryNotice} />
      <EditLevelBoundaryNotice summary={createEditLevelBoundarySummary()} />

      <p className="inline-helper" data-testid="edit-level-save-state">
        {savingState === 'saving'
          ? 'Saving mock/local Edit Level selection...'
          : savingState === 'saved'
            ? 'Mock/local Edit Level selection saved.'
            : 'Selection saves through the mock Edit Level API/client.'}
      </p>

      {onConfirm && (
        <div className="inline-card-actions">
          <Button onClick={onConfirm} variant={confirmed ? 'secondary' : 'primary'}>
            {confirmed ? 'Level selected' : 'Use this level'}
          </Button>
        </div>
      )}
    </section>
  )
}
