import { Badge } from '../Badge'
import { frameLayoutTemplates } from '../../lib/frame-layouts'
import { editLevelDefinitions, launchEditingCategories } from '../../lib/product-taxonomy'
import { getSourceSequenceModeLabel } from '../../lib/source-sequence'
import { visualPreferenceOptions } from '../../lib/workflow-profiles'
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

function labelForLevel(value: EditLevel) {
  return editLevelDefinitions.find((level) => level.value === value)?.label ?? value
}

function labelForFrame(value: FrameTemplateType) {
  return frameLayoutTemplates[value]?.animationZone.label ?? value.replaceAll('_', ' ')
}

function labelForVisualPreference(value: VisualPreference) {
  return visualPreferenceOptions.find((option) => option.value === value)?.label ?? value.replaceAll('_', ' ')
}

function veoPolicyForLevel(value: EditLevel) {
  if (value === 'basic') {
    return 'Veo locked for Basic'
  }

  if (value === 'pro') {
    return 'Veo locked for Pro'
  }

  return 'Veo Lite final fallback only'
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
          <span>Level</span>
          <strong>{labelForLevel(editLevel)} / {editLevelConfirmed ? 'confirmed' : 'pending'}</strong>
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
          <span>Model rule</span>
          <strong>{veoPolicy}</strong>
        </div>
        <div>
          <span>Background policy</span>
          <strong>AI video visuals use matching panel backgrounds by default.</strong>
        </div>
      </div>
      <p className="inline-helper">
        Category guides context. Edit level changes complexity and fallback depth. The frame system owns the final canvas.
      </p>
    </section>
  )
}
