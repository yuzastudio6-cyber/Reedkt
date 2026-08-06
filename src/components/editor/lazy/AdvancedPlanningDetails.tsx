import { useEffect, useMemo, useState } from 'react'
import type { PlanValidationReport, PlannerRegressionReport } from '../../../lib/planner-validation'
import type { ChatPlanningCardDescriptor, EditLevel, EditPlan, PlannerInput } from '../../../types/reeditpro'
import { InlineAgentQAFallbackCard } from '../InlineAgentQAFallbackCard'
import { InlineAsyncAssetReconciliationCard } from '../InlineAsyncAssetReconciliationCard'
import { InlineAudioPipelineCard } from '../InlineAudioPipelineCard'
import { InlineCharacterConsistencyCard } from '../InlineCharacterConsistencyCard'
import { InlineColorPipelineCard } from '../InlineColorPipelineCard'
import { InlineDataVizPlanCard } from '../InlineDataVizPlanCard'
import { InlineDepthAwareOverlayCard } from '../InlineDepthAwareOverlayCard'
import { InlineDocumentaryFactSafetyCard } from '../InlineDocumentaryFactSafetyCard'
import { InlineEditingAgentExecutionPlanCard } from '../InlineEditingAgentExecutionPlanCard'
import { InlineLaunchToolStackCard } from '../InlineLaunchToolStackCard'
import { InlineMapAnimationPlanCard } from '../InlineMapAnimationPlanCard'
import { InlineMigrationDraftPlanCard } from '../InlineMigrationDraftPlanCard'
import { InlineMigrationReviewCard } from '../InlineMigrationReviewCard'
import { InlinePlannerRegressionCard } from '../InlinePlannerRegressionCard'
import { InlinePlanningSystemAuditCard } from '../InlinePlanningSystemAuditCard'
import { InlinePlanValidationCard } from '../InlinePlanValidationCard'
import { InlinePromptPreviewCard } from '../InlinePromptPreviewCard'
import { InlineQAPlanCard } from '../InlineQAPlanCard'
import { InlineRendererPlanCard } from '../InlineRendererPlanCard'
import { InlineRenderStrategyCard } from '../InlineRenderStrategyCard'
import { InlineSegmentEditPlanCard } from '../InlineSegmentEditPlanCard'
import { InlineSpeakerVisualLayoutCard } from '../InlineSpeakerVisualLayoutCard'
import { InlineSupabaseProductionReadinessCard } from '../InlineSupabaseProductionReadinessCard'
import { InlineSupabaseSchemaPlanCard } from '../InlineSupabaseSchemaPlanCard'
import { InlineToolRegistryCard } from '../InlineToolRegistryCard'
import { InlineToolStrategyCard } from '../InlineToolStrategyCard'
import { InlineVisualAssetPlanCard } from '../InlineVisualAssetPlanCard'

type AdvancedPlanningDetailsProps = {
  cardById: Record<string, ChatPlanningCardDescriptor | undefined>
  planEditLevel: EditLevel
  plannerInput: PlannerInput
  selectedScenarioId: string
  visibleCards: Record<string, boolean>
}

type AdvancedPlanningCardId =
  | 'tool_registry'
  | 'segment_operations'
  | 'color_pipeline'
  | 'audio_pipeline'
  | 'visual_asset_plan'
  | 'speaker_visual_layout'
  | 'depth_aware_overlay'
  | 'render_strategy'
  | 'tool_strategy'
  | 'map_animation_plan'
  | 'dataviz_plan'
  | 'character_consistency'
  | 'fact_safety'
  | 'renderer_plan'
  | 'qa_plan'
  | 'prompt_preview'
  | 'plan_validation'
  | 'planner_regression'
  | 'editing_agent_execution'
  | 'async_asset_reconciliation'
  | 'agent_qa_fallback'
  | 'launch_tool_stack'
  | 'planning_system_audit'
  | 'supabase_schema_bridge'
  | 'migration_drafts'
  | 'migration_review_rls'
  | 'supabase_production_readiness'

export function AdvancedPlanningDetails({
  cardById,
  planEditLevel,
  plannerInput,
  selectedScenarioId,
  visibleCards,
}: AdvancedPlanningDetailsProps) {
  const visibleKey = useMemo(
    () => Object.entries(visibleCards).filter(([, visibleCard]) => visibleCard).map(([id]) => id).sort().join('|'),
    [visibleCards],
  )
  const loadKey = useMemo(
    () => JSON.stringify({ plannerInput, selectedScenarioId, visibleKey }),
    [plannerInput, selectedScenarioId, visibleKey],
  )
  const [advancedState, setAdvancedState] = useState<{
    key: string
    plan: EditPlan
    regressionReport: PlannerRegressionReport
    validationReport: PlanValidationReport
  } | null>(null)
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      import('../../../lib/mock-planner/full-loader'),
      import('../../../lib/planner-validation'),
      import('../../../lib/planner-regression'),
    ])
      .then(([plannerModule, validationModule, regressionModule]) => {
        // Full planner diagnostics are loaded only when advanced cards become visible.
        const fullPlan = plannerModule.loadAdvancedMockEditPlan(plannerInput)

        return fullPlan.then((loadedPlan) => ({
          plan: loadedPlan,
          validationReport: validationModule.validateMockEditPlan({
            input: plannerInput,
            plan: loadedPlan,
            scenarioId: selectedScenarioId,
          }),
          regressionReport: regressionModule.runPlannerRegression(),
          key: loadKey,
        }))
      })
      .then((nextState) => {
        if (!active) return
        setAdvancedState(nextState)
      })
      .catch(() => {
        if (!active) return
        setLoadError({
          key: loadKey,
          message: 'Advanced planning details could not load. Guided plan review is still available.',
        })
      })

    return () => {
      active = false
    }
  }, [loadKey, plannerInput, selectedScenarioId])

  function visible(id: AdvancedPlanningCardId) {
    return Boolean(visibleCards[id])
  }

  if (loadError?.key === loadKey) {
    return (
      <div className="advanced-card-fallback advanced-card-fallback-error" role="status">
        <span aria-hidden="true" />
        <strong>{loadError.message}</strong>
      </div>
    )
  }

  if (!advancedState || advancedState.key !== loadKey) {
    return (
      <div className="advanced-card-fallback" role="status">
        <span aria-hidden="true" />
        <strong>Loading full planning details...</strong>
      </div>
    )
  }

  const advancedPlan = advancedState.plan
  const validationReport = advancedState.validationReport
  const regressionReport = advancedState.regressionReport

  return (
    <>
      {visible('tool_registry') && (
        <InlineToolRegistryCard descriptor={cardById.tool_registry} plan={advancedPlan} />
      )}
      {visible('segment_operations') && (
        <InlineSegmentEditPlanCard descriptor={cardById.segment_operations} plan={advancedPlan} />
      )}
      {visible('color_pipeline') && (
        <InlineColorPipelineCard descriptor={cardById.color_pipeline} plan={advancedPlan} />
      )}
      {visible('audio_pipeline') && (
        <InlineAudioPipelineCard descriptor={cardById.audio_pipeline} plan={advancedPlan} />
      )}
      {visible('visual_asset_plan') && (
        <InlineVisualAssetPlanCard descriptor={cardById.visual_asset_plan} editLevel={planEditLevel} plan={advancedPlan} />
      )}
      {visible('speaker_visual_layout') && (
        <InlineSpeakerVisualLayoutCard descriptor={cardById.speaker_visual_layout} plan={advancedPlan} />
      )}
      {visible('depth_aware_overlay') && (
        <InlineDepthAwareOverlayCard descriptor={cardById.depth_aware_overlay} plan={advancedPlan} />
      )}
      {visible('render_strategy') && (
        <InlineRenderStrategyCard descriptor={cardById.render_strategy} plan={advancedPlan} />
      )}
      {visible('tool_strategy') && (
        <InlineToolStrategyCard descriptor={cardById.tool_strategy} plan={advancedPlan} />
      )}
      {visible('map_animation_plan') && (
        <InlineMapAnimationPlanCard descriptor={cardById.map_animation_plan} plan={advancedPlan} />
      )}
      {visible('dataviz_plan') && (
        <InlineDataVizPlanCard descriptor={cardById.dataviz_plan} plan={advancedPlan} />
      )}
      {visible('character_consistency') && (
        <InlineCharacterConsistencyCard descriptor={cardById.character_consistency} plan={advancedPlan} />
      )}
      {visible('fact_safety') && (
        <InlineDocumentaryFactSafetyCard descriptor={cardById.fact_safety} plan={advancedPlan} />
      )}
      {visible('renderer_plan') && (
        <InlineRendererPlanCard descriptor={cardById.renderer_plan} plan={advancedPlan} />
      )}
      {visible('qa_plan') && (
        <InlineQAPlanCard descriptor={cardById.qa_plan} plan={advancedPlan} />
      )}
      {visible('prompt_preview') && (
        <InlinePromptPreviewCard descriptor={cardById.prompt_preview} plan={advancedPlan} />
      )}
      {visible('plan_validation') && (
        <InlinePlanValidationCard descriptor={cardById.plan_validation} report={validationReport} />
      )}
      {visible('planner_regression') && (
        <InlinePlannerRegressionCard descriptor={cardById.planner_regression} report={regressionReport} />
      )}
      {visible('editing_agent_execution') && (
        <InlineEditingAgentExecutionPlanCard descriptor={cardById.editing_agent_execution} plan={advancedPlan} />
      )}
      {visible('async_asset_reconciliation') && (
        <InlineAsyncAssetReconciliationCard descriptor={cardById.async_asset_reconciliation} plan={advancedPlan} />
      )}
      {visible('agent_qa_fallback') && (
        <InlineAgentQAFallbackCard descriptor={cardById.agent_qa_fallback} plan={advancedPlan} />
      )}
      {visible('launch_tool_stack') && (
        <InlineLaunchToolStackCard plan={advancedPlan} />
      )}
      {visible('planning_system_audit') && (
        <InlinePlanningSystemAuditCard plan={advancedPlan} />
      )}
      {visible('supabase_schema_bridge') && (
        <InlineSupabaseSchemaPlanCard plan={advancedPlan} />
      )}
      {visible('migration_drafts') && (
        <InlineMigrationDraftPlanCard plan={advancedPlan} />
      )}
      {visible('migration_review_rls') && (
        <InlineMigrationReviewCard plan={advancedPlan} />
      )}
      {visible('supabase_production_readiness') && (
        <InlineSupabaseProductionReadinessCard plan={advancedPlan} />
      )}
    </>
  )
}
