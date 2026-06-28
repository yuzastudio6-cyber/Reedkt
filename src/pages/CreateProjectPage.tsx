import { MessageCircle, Plus, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
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
} from '../components/edit-level'
import {
  createEditLevelBoundarySummary,
  createEditLevelCardGroupModel,
  createEditLevelSelectedSummaryModel,
  createEditLevelToolDepthSummaryModel,
  loadEditLevelCardsForUI,
  saveEditLevelSelectionForUI,
  updateEditLevelSelectionForUI,
} from '../lib/edit-level-ui-adapter'
import {
  createEditLevelToolCapabilityListModel,
  createEditLevelToolCapabilitySummaryModel,
  createEditLevelToolFallbackNoticeModel,
} from '../lib/edit-level-tool-router-ui-adapter'
import {
  createEditLevelMarkerContextPolicyModel,
  createEditLevelSourceContextLayerListModel,
  createEditLevelSourceUnderstandingFallbackNoticeModel,
  createEditLevelSourceUnderstandingSummaryModel,
} from '../lib/edit-level-source-understanding-ui-adapter'
import {
  createEditLevelQwenFallbackNoticeModel,
  createEditLevelQwenPlanningDimensionListModel,
  createEditLevelQwenPlanningSummaryModel,
  createEditLevelQwenUsageEstimateNoticeModel,
} from '../lib/edit-level-qwen-planning-ui-adapter'
import {
  createEditLevelQAFallbackNoticeModel,
  createEditLevelQAGateListModel,
  createEditLevelQAGateSummaryModel,
  createEditLevelQAReadinessCardModel,
} from '../lib/edit-level-qa-gates-ui-adapter'
import {
  createEditLevelCreditEstimateNoticeModel,
  createEditLevelEstimateBoundaryNoticeModel,
  createEditLevelEstimateItemListModel,
  createEditLevelEstimateSummaryModel,
  createEditLevelRenderBudgetNoticeModel,
  createEditLevelRevisionBudgetNoticeModel,
} from '../lib/edit-level-estimates-ui-adapter'
import { launchEditingCategories } from '../lib/product-taxonomy'
import type {
  EditLevelRecommendationResult,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import type { EditingCategory } from '../types/reeditpro'

const categoryDescriptions: Record<EditingCategory, string> = {
  storytelling: 'Signature narrative edits with Stroke Motion, still cards, character consistency, and story beats.',
  lifestyle: 'Creator-style edits for day-in-life, travel, fitness, beauty, food, motivation, and casual stories.',
  business_brand: 'Product, service, offer, SaaS, ecommerce, coaching, agency, and brand content.',
  education_explainer: 'Graphic Design / VisualExplain for concepts, diagrams, steps, frameworks, and learning.',
  documentary_case_study: 'Timeline, evidence, scam/fraud, investigation, case study, and what-happened videos.',
}

export function CreateProjectPage() {
  const [selectedEditLevel, setSelectedEditLevel] = useState<ReEditProCanonicalEditLevel>('premium')
  const [recommendedLevel, setRecommendedLevel] = useState<ReEditProCanonicalEditLevel | undefined>('premium')
  const [cards, setCards] = useState<EditLevelUICardModel[]>(() =>
    createEditLevelCardGroupModel({ selectedLevel: 'premium', recommendedLevel: 'premium' }).cards,
  )
  const [recommendation, setRecommendation] = useState<EditLevelRecommendationResult | undefined>(undefined)
  const [selectionId, setSelectionId] = useState<string | undefined>(undefined)
  const [saveLabel, setSaveLabel] = useState('Selection saves through the mock Edit Level API/client.')

  useEffect(() => {
    let cancelled = false

    loadEditLevelCardsForUI({
      selectedLevel: selectedEditLevel,
      recommendationInput: {
        platformTarget: 'tiktok_reels_shorts',
        userPrompt: 'Start a new professional edit with stronger storytelling options.',
        desiredPolish: 'enhanced',
        editBriefMarkerCount: 1,
      },
    }).then((result) => {
      if (cancelled || !result.data) return
      setCards(result.data.cards)
      setRecommendedLevel(result.data.recommendedLevel)
      if (result.data.recommendedLevel) {
        const recommendedCard = result.data.cards.find((card) => card.level === result.data?.recommendedLevel)
        setRecommendation({
          recommendedLevel: result.data.recommendedLevel,
          confidence: result.data.recommendedLevel === 'normal' ? 'medium' : 'high',
          reasons: [
            recommendedCard?.tagline ?? 'Mock/local recommendation uses current setup context.',
            recommendedCard?.estimateSummary ?? 'Credit estimate only; no credits are reserved or spent.',
          ],
          warnings: ['Recommendation is based on current mock/local project context.'],
          degradedCapabilityNotices: ['Tool capability routing is mock/local; no tools execute.'],
          userOverrideAllowed: true,
          mockOnly: true,
        })
      }
    }).catch(() => {
      if (!cancelled) {
        setCards(createEditLevelCardGroupModel({ selectedLevel: selectedEditLevel, recommendedLevel }).cards)
      }
    })

    return () => {
      cancelled = true
    }
  }, [recommendedLevel, selectedEditLevel])

  const selectedSummary = useMemo(
    () => createEditLevelSelectedSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const toolDepthSummary = useMemo(
    () => createEditLevelToolDepthSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const toolCapabilitySummary = useMemo(
    () => createEditLevelToolCapabilitySummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const toolCapabilityList = useMemo(
    () => createEditLevelToolCapabilityListModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const toolFallbackNotice = useMemo(
    () => createEditLevelToolFallbackNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const sourceUnderstandingSummary = useMemo(
    () => createEditLevelSourceUnderstandingSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const sourceLayerList = useMemo(
    () => createEditLevelSourceContextLayerListModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const markerContextPolicy = useMemo(
    () => createEditLevelMarkerContextPolicyModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const sourceFallbackNotice = useMemo(
    () => createEditLevelSourceUnderstandingFallbackNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qwenPlanningSummary = useMemo(
    () => createEditLevelQwenPlanningSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qwenDimensionList = useMemo(
    () => createEditLevelQwenPlanningDimensionListModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qwenFallbackNotice = useMemo(
    () => createEditLevelQwenFallbackNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qwenUsageEstimateNotice = useMemo(
    () => createEditLevelQwenUsageEstimateNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qaGateSummary = useMemo(
    () => createEditLevelQAGateSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qaGateList = useMemo(
    () => createEditLevelQAGateListModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qaReadiness = useMemo(
    () => createEditLevelQAReadinessCardModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const qaFallbackNotice = useMemo(
    () => createEditLevelQAFallbackNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const estimateSummary = useMemo(
    () => createEditLevelEstimateSummaryModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const estimateItemList = useMemo(
    () => createEditLevelEstimateItemListModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const creditEstimateNotice = useMemo(
    () => createEditLevelCreditEstimateNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const renderBudgetNotice = useMemo(
    () => createEditLevelRenderBudgetNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const revisionBudgetNotice = useMemo(
    () => createEditLevelRevisionBudgetNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )
  const estimateBoundaryNotice = useMemo(
    () => createEditLevelEstimateBoundaryNoticeModel(selectedEditLevel),
    [selectedEditLevel],
  )

  async function handleSelectEditLevel(level: ReEditProCanonicalEditLevel) {
    setSelectedEditLevel(level)
    setSaveLabel('Saving mock/local Edit Level selection...')

    const result = selectionId
      ? await updateEditLevelSelectionForUI({ selectionId, level })
      : await saveEditLevelSelectionForUI({ level })

    if (result.ok && result.data) {
      setSelectionId(result.data.id)
      setSaveLabel('Mock/local Edit Level selection saved.')
    } else {
      setSaveLabel('Selection stayed local; no render, worker, provider, or credit operation started.')
    }
  }

  return (
    <AppShell
      description="Pick a category, upload clips, and let ReeditPro ask the rest inside the AI chat editor."
      eyebrow="New project"
      primaryAction={false}
      title="Start with a video category"
    >
      <section className="project-start-shell category-first-shell">
        <div className="category-entry-main">
          <Card className="project-start-card">
            <div className="project-start-heading">
              <Badge accent="cyan">Chat-native upload</Badge>
              <h2>Pick a category, then upload in chat</h2>
              <p>
                Pick the type of video you're creating, upload clips, then ReeditPro will ask the rest inside chat.
              </p>
              <p>The category gives planning context. It does not force a visual system.</p>
            </div>

            <label className="planning-field">
              <span>Project name</span>
              <input defaultValue="Untitled ReeditPro edit" />
              <small>Optional for this frontend mock. Real project creation is not wired yet.</small>
            </label>
          </Card>

          <section className="edit-level-setup-section" data-testid="project-edit-level-setup">
            <div className="edit-level-setup-heading">
              <Badge accent="cyan">Edit Level beta</Badge>
              <div>
                <span className="section-eyebrow">Depth and polish</span>
                <h2>Choose how much creative treatment this edit should get</h2>
                <p>Normal, Premium, and Ultra Premium are all professional edits. Higher levels add deeper analysis, creative layering, stricter QA, and future budget.</p>
              </div>
            </div>
            <EditLevelRecommendationBanner recommendation={recommendation} />
            <EditLevelCardGroup
              cards={cards}
              onSelect={handleSelectEditLevel}
              recommendedLevel={recommendedLevel}
              selectedLevel={selectedEditLevel}
            />
            <EditLevelSelectedSummary summary={selectedSummary} />
            <EditLevelToolDepthSummary summary={toolDepthSummary} />
            <EditLevelToolCapabilitySummary summary={toolCapabilitySummary} />
            <EditLevelToolCapabilityList model={toolCapabilityList} />
            <EditLevelToolFallbackNotice notice={toolFallbackNotice} />
            <EditLevelSourceUnderstandingSummary summary={sourceUnderstandingSummary} />
            <EditLevelMarkerContextPolicyCard policy={markerContextPolicy} />
            <EditLevelSourceContextLayerList model={sourceLayerList} />
            <EditLevelSourceUnderstandingFallbackNotice notice={sourceFallbackNotice} />
            <EditLevelQwenPlanningSummary summary={qwenPlanningSummary} />
            <EditLevelQwenPlanningDimensionList model={qwenDimensionList} />
            <EditLevelQwenFallbackNotice notice={qwenFallbackNotice} />
            <EditLevelQwenUsageEstimateNotice notice={qwenUsageEstimateNotice} />
            <EditLevelQAGateSummary summary={qaGateSummary} />
            <EditLevelQAReadinessCard readiness={qaReadiness} />
            <EditLevelQAGateList model={qaGateList} />
            <EditLevelQAFallbackNotice notice={qaFallbackNotice} />
            <EditLevelEstimateSummary summary={estimateSummary} />
            <EditLevelCreditEstimateNotice notice={creditEstimateNotice} />
            <EditLevelRenderBudgetNotice notice={renderBudgetNotice} />
            <EditLevelRevisionBudgetNotice notice={revisionBudgetNotice} />
            <EditLevelEstimateItemList model={estimateItemList} />
            <EditLevelEstimateBoundaryNotice notice={estimateBoundaryNotice} />
            <EditLevelBoundaryNotice summary={createEditLevelBoundarySummary()} />
            <p className="inline-helper" data-testid="project-edit-level-save-state">{saveLabel}</p>
          </section>

          <div className="category-entry-grid">
            {launchEditingCategories.map((category, index) => (
              <article className="category-entry-card" key={category.value}>
                <div>
                  <span className="section-eyebrow">{category.label}</span>
                  <h3>{category.label}</h3>
                  <p>{categoryDescriptions[category.value]}</p>
                </div>
                <small>{category.bestUseCases.slice(0, 5).join(' / ')}</small>
                <Button icon={Plus} to={`/editor?category=${category.value}`} variant={index === 0 ? 'primary' : 'secondary'}>
                  Upload / start
                </Button>
              </article>
            ))}
          </div>
        </div>

        <aside className="project-start-side">
          <Card>
            <UploadCloud size={24} />
            <h3>Upload comes next</h3>
            <p>Use the plus/upload button to enter the chat editor. This mock uses sample clips instead of a real uploader.</p>
          </Card>
          <Card>
            <MessageCircle size={24} />
            <h3>The chat is the editor</h3>
            <p>Source order, format, edit level, visual preference, reference videos, plans, credits, approval, progress, and preview all happen inside chat.</p>
          </Card>
          <Card>
            <h3>Core rule</h3>
            <p>Plan first. Approve credits. Then the AI edits in the background. This demo does not deduct real credits.</p>
          </Card>
        </aside>
      </section>
    </AppShell>
  )
}
