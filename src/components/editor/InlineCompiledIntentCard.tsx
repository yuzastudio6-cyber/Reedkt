import { Badge } from '../Badge'
import { Button } from '../Button'
import { editLevelDefinitions, launchEditingCategories } from '../../lib/product-taxonomy'
import { visualPreferenceOptions } from '../../lib/workflow-profiles'
import type {
  AspectRatio,
  CompiledEditingIntent,
  EditLevel,
  EditingCategory,
  TargetPlatform,
  VisualPreference,
} from '../../types/reeditpro'

type InlineCompiledIntentCardProps = {
  intent: CompiledEditingIntent
  onApproveIntent?: () => void
  approved?: boolean
}

const platformLabels: Record<TargetPlatform, string> = {
  tiktok_reels_shorts: 'TikTok / Reels / Shorts',
  youtube: 'YouTube',
  website: 'Website',
  course_training: 'Course / training',
  client_review: 'Client review',
  custom: 'Custom',
}

const aspectRatioLabels: Record<AspectRatio, string> = {
  '9:16': '9:16',
  '16:9': '16:9',
  '1:1': '1:1',
  '4:5': '4:5',
  '4:3': '4:3',
  let_ai_decide: 'Let AI decide',
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function labelForCategory(value: EditingCategory) {
  return launchEditingCategories.find((category) => category.value === value)?.label ?? formatLabel(value)
}

function labelForLevel(value: EditLevel) {
  return editLevelDefinitions.find((level) => level.value === value)?.label ?? formatLabel(value)
}

function labelForVisualPreference(value: VisualPreference) {
  return visualPreferenceOptions.find((option) => option.value === value)?.label ?? formatLabel(value)
}

function veoPolicyForLevel(value: EditLevel) {
  if (value === 'premium') {
    return 'Veo Lite final fallback only'
  }

  return 'Veo locked for this tier'
}

export function InlineCompiledIntentCard({ approved = false, intent, onApproveIntent }: InlineCompiledIntentCardProps) {
  const settings = intent.resolvedSettings
  const directive = intent.professionalEditingDirective
  const appliedConstraints = intent.lockedTierConstraints.filter((constraint) => constraint.applies)
  const customDirectives = intent.customDirectives.slice(0, 2)
  const clarifyingQuestions = intent.clarifyingQuestions.slice(0, 3)

  return (
    <section className="inline-chat-card compiled-intent-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Compiled intent</span>
          <h3>What I understood</h3>
        </div>
        <Badge accent={settings.editLevel === 'premium' ? 'warning' : 'cyan'}>{veoPolicyForLevel(settings.editLevel)}</Badge>
      </div>

      <p className="inline-helper">This is the structured intent ReeditPro will use to build the edit plan.</p>

      <div className="compiled-intent-summary">
        <div>
          <span>Goal</span>
          <strong>{intent.goalSummary}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{formatLabel(intent.confidence)}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{labelForCategory(settings.editingCategory)}</strong>
        </div>
        <div>
          <span>Level</span>
          <strong>{labelForLevel(settings.editLevel)}</strong>
        </div>
        <div>
          <span>Format</span>
          <strong>{platformLabels[settings.targetPlatform]} / {aspectRatioLabels[settings.aspectRatio]}</strong>
        </div>
        <div>
          <span>Visuals</span>
          <strong>{labelForVisualPreference(settings.visualPreference)}</strong>
        </div>
      </div>

      <div className="intent-chip-grid" aria-label="Resolved professional editing settings">
        <span className="intent-chip"><small>Edit style</small>{formatLabel(directive.editStyle)}</span>
        <span className="intent-chip"><small>Pacing</small>{formatLabel(directive.pacingStyle)} / {formatLabel(directive.cutIntensity)}</span>
        <span className="intent-chip"><small>Color</small>{formatLabel(directive.colorGradeStyle)}</span>
        <span className="intent-chip"><small>Captions</small>{formatLabel(directive.captionStyle)}</span>
        <span className="intent-chip"><small>B-roll</small>{formatLabel(directive.brollPolicy)}</span>
        <span className="intent-chip"><small>Sound</small>{formatLabel(directive.soundStyle)}</span>
      </div>

      <div className="intent-rule-list">
        <strong>Must-follow</strong>
        {intent.mustFollowRules.slice(0, 5).map((rule) => (
          <span className="intent-rule-item" key={rule}>{rule}</span>
        ))}
      </div>

      <div className="intent-rule-list">
        <strong>Avoid</strong>
        {intent.avoidRules.slice(0, 5).map((rule) => (
          <span className="intent-rule-item" key={rule}>{rule}</span>
        ))}
      </div>

      {customDirectives.length > 0 && (
        <div className="intent-rule-list">
          <strong>Custom directives</strong>
          {customDirectives.map((directiveItem) => (
            <article className="custom-directive-card" key={directiveItem.id}>
              <span>Custom style request captured</span>
              <strong>{directiveItem.interpretedMeaning}</strong>
              <small>{directiveItem.customOverrides.join(' / ')}</small>
            </article>
          ))}
        </div>
      )}

      {clarifyingQuestions.length > 0 && (
        <div className="intent-question-list">
          <strong>Clarifying questions</strong>
          {clarifyingQuestions.map((question) => (
            <div className="intent-question-item" key={question.id}>
              <span>{question.priority}</span>
              <strong>{question.question}</strong>
              <small>{question.reason}</small>
            </div>
          ))}
        </div>
      )}

      <div className="intent-constraint-list">
        <strong>Tier and model constraints</strong>
        {appliedConstraints.map((constraint) => (
          <div className="intent-constraint-item" key={constraint.id}>
            <span>{constraint.label}</span>
            <strong>{constraint.userFacingMessage}</strong>
          </div>
        ))}
      </div>

      <div className="intent-rule-list">
        <strong>QA implications</strong>
        {intent.qaImplications.slice(0, 6).map((item) => (
          <span className="intent-rule-item" key={item}>{item}</span>
        ))}
      </div>

      {approved && <p className="intent-approved-note">Intent confirmed. This does not start generation; plan and credit approval still control progress.</p>}

      {onApproveIntent && (
        <div className="inline-card-actions">
          <Button disabled={approved} onClick={onApproveIntent} variant={approved ? 'secondary' : 'primary'}>
            {approved ? 'Intent confirmed' : 'Looks right'}
          </Button>
        </div>
      )}
    </section>
  )
}
