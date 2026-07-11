import { Badge } from '../Badge'
import { frameLayoutTemplates } from '../../lib/frame-layouts'
import { launchEditingCategories } from '../../lib/product-taxonomy'
import { getSourceSequenceModeLabel } from '../../lib/source-sequence'
import { visualPreferenceOptions } from '../../lib/workflow-profiles'
import {
  createEditLevelSelectedSummaryModel,
  mapLegacyRuntimeEditLevelToCanonical,
} from '../../lib/edit-level-ui-adapter'
import { createEditLevelToolCapabilitySummaryModel } from '../../lib/edit-level-tool-router-ui-adapter'
import { createEditLevelSourceUnderstandingSummaryModel } from '../../lib/edit-level-source-understanding-ui-adapter'
import { createEditLevelQwenPlanningSummaryModel } from '../../lib/edit-level-qwen-planning-ui-adapter'
import {
  createEditLevelQAGateSummaryModel,
  createEditLevelQAReadinessCardModel,
} from '../../lib/edit-level-qa-gates-ui-adapter'
import { createEditLevelEstimateSummaryModel } from '../../lib/edit-level-estimates-ui-adapter'
import {
  EditLevelEstimateSummary,
  EditLevelQAGateSummary,
  EditLevelQAReadinessCard,
  EditLevelQwenPlanningSummary,
  EditLevelSelectedSummary,
  EditLevelSourceUnderstandingSummary,
  EditLevelToolCapabilitySummary,
} from '../edit-level'
import type {
  AspectRatio,
  ClipSource,
  EditLevel,
  EditingCategory,
  FrameTemplateType,
  SourceSequenceMode,
  TargetPlatform,
  VisualPreference,
} from '../../types/reeditpro'

type InlinePlanningContextCardProps = {
  editingCategory: EditingCategory
  editLevel: EditLevel
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  frameTemplateType: FrameTemplateType
  visualPreference: VisualPreference
  clips: ClipSource[]
  sourceOrderConfirmed: boolean
  sourceSequenceMode: SourceSequenceMode
  aspectRatioConfirmed: boolean
  editLevelConfirmed: boolean
}

const platformLabels: Record<TargetPlatform, string> = {
  tiktok_reels_shorts: 'TikTok / Reels / Shorts',
  youtube: 'YouTube',
  website: 'Website',
  course_training: 'Course / training',
  client_review: 'Client review',
  custom: 'Custom',
}

function labelForCategory(value: EditingCategory) {
  return launchEditingCategories.find((category) => category.value === value)?.label ?? value
}

function labelForFrame(value: FrameTemplateType) {
  return frameLayoutTemplates[value]?.animationZone.label ?? value.replaceAll('_', ' ')
}

function labelForVisualPreference(value: VisualPreference) {
  return visualPreferenceOptions.find((option) => option.value === value)?.label ?? value.replaceAll('_', ' ')
}

function veoPolicyForLevel(value: EditLevel) {
  if (value === 'basic') {
    return 'Premium video fallback locked for Basic'
  }

  if (value === 'pro') {
    return 'Premium video fallback locked for Pro'
  }

  return 'Premium video fallback only'
}

export function InlinePlanningContextCard({
  aspectRatio,
  aspectRatioConfirmed,
  editLevelConfirmed,
  editingCategory,
  editLevel,
  frameTemplateType,
  clips,
  sourceOrderConfirmed,
  sourceSequenceMode,
  targetPlatform,
  visualPreference,
}: InlinePlanningContextCardProps) {
  const veoPolicy = veoPolicyForLevel(editLevel)
  const publicEditLevel = mapLegacyRuntimeEditLevelToCanonical(editLevel)
  const selectedEditLevelSummary = createEditLevelSelectedSummaryModel(publicEditLevel)
  const selectedToolCapabilitySummary = createEditLevelToolCapabilitySummaryModel(publicEditLevel)
  const selectedSourceUnderstandingSummary = createEditLevelSourceUnderstandingSummaryModel(publicEditLevel)
  const selectedQwenPlanningSummary = createEditLevelQwenPlanningSummaryModel(publicEditLevel)
  const selectedQAGateSummary = createEditLevelQAGateSummaryModel(publicEditLevel)
  const selectedQAReadiness = createEditLevelQAReadinessCardModel(publicEditLevel)
  const selectedEstimateSummary = createEditLevelEstimateSummaryModel(publicEditLevel)
  const importantClipCount = clips.filter((clip) => clip.isImportant).length
  const optionalClipCount = clips.filter((clip) => clip.isOptional || clip.sourceRole === 'optional').length

  return (
    <section className="inline-chat-card planning-context-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Current planning context</span>
          <h3>ReeditPro will plan with these choices</h3>
        </div>
        <Badge accent={editLevel === 'premium' ? 'warning' : 'cyan'}>{veoPolicy}</Badge>
      </div>

      <div className="planning-context-grid">
        <div>
          <span>Category</span>
          <strong>{labelForCategory(editingCategory)}</strong>
        </div>
        <div>
          <span>Source mode</span>
          <strong>{getSourceSequenceModeLabel(sourceSequenceMode)}</strong>
        </div>
        <div>
          <span>Source order</span>
          <strong>{sourceOrderConfirmed ? 'Confirmed' : 'Needs review'}</strong>
        </div>
        <div>
          <span>Clip count</span>
          <strong>{clips.length} total / {importantClipCount} important / {optionalClipCount} optional</strong>
        </div>
        <div>
          <span>Public Edit Level</span>
          <strong>{selectedEditLevelSummary.displayName} / {editLevelConfirmed ? 'confirmed' : 'pending'}</strong>
        </div>
        <div>
          <span>Output frame</span>
          <strong>{platformLabels[targetPlatform]} / {aspectRatio} / {aspectRatioConfirmed ? 'confirmed' : 'pending'}</strong>
        </div>
        <div>
          <span>Frame template</span>
          <strong>{labelForFrame(frameTemplateType)}</strong>
        </div>
        <div>
          <span>Visual preference</span>
          <strong>{labelForVisualPreference(visualPreference)}</strong>
        </div>
        <div>
          <span>Video fallback rule</span>
          <strong>{veoPolicy}</strong>
        </div>
        <div>
          <span>Background policy</span>
          <strong>AI video visuals use matching panel backgrounds by default.</strong>
        </div>
      </div>
      <EditLevelSelectedSummary compact summary={selectedEditLevelSummary} />
      <EditLevelToolCapabilitySummary compact summary={selectedToolCapabilitySummary} />
      <EditLevelSourceUnderstandingSummary compact summary={selectedSourceUnderstandingSummary} />
      <EditLevelQwenPlanningSummary compact summary={selectedQwenPlanningSummary} />
      <EditLevelQAGateSummary compact summary={selectedQAGateSummary} />
      <EditLevelQAReadinessCard readiness={selectedQAReadiness} />
      <EditLevelEstimateSummary compact summary={selectedEstimateSummary} />
      <p className="inline-helper">
        Category guides context. Edit Level changes planned capability depth, source understanding, planning depth, QA strictness, and estimate depth; execution still waits for plan and credit approval.
      </p>
    </section>
  )
}
