import { Film, Frame, Layers3 } from 'lucide-react'
import type { AspectRatio } from '../../types/reeditpro'
import type { EditWorkspaceStage } from './EditWorkspaceProgressCard'

type EditWorkspaceRailProps = {
  aspectRatio: AspectRatio
  editName: string
  estimateReady: boolean
  projectName: string
  sourceCount: number
  stage: EditWorkspaceStage
}

const stagePresentation: Record<EditWorkspaceStage, {
  description: string
  label: string
  tone: 'active' | 'attention' | 'neutral' | 'success'
}> = {
  upload_required: {
    description: 'Your source preview will appear here after upload.',
    label: 'Waiting for source',
    tone: 'neutral',
  },
  planning_setup: {
    description: 'ReeditPro is shaping the source, brief, and edit direction.',
    label: 'Preparing the edit',
    tone: 'active',
  },
  plan_review: {
    description: 'Review the plan and credit estimate in Chat before work starts.',
    label: 'Plan ready for review',
    tone: 'attention',
  },
  approved_review_building: {
    description: 'The approved private workflow is preparing the review.',
    label: 'Building private review',
    tone: 'active',
  },
  review_ready: {
    description: 'The latest private review is ready in Chat.',
    label: 'Private review ready',
    tone: 'success',
  },
  revision_requested: {
    description: 'Use Chat to confirm the requested changes before a new approval.',
    label: 'Changes requested',
    tone: 'attention',
  },
  blocked: {
    description: 'Resolve the current blocker in Chat before continuing.',
    label: 'Action needed',
    tone: 'attention',
  },
}

export function EditWorkspaceRail({
  aspectRatio,
  editName,
  estimateReady,
  projectName,
  sourceCount,
  stage,
}: EditWorkspaceRailProps) {
  const presentation = stagePresentation[stage]

  return (
    <aside aria-label="Edit preview and status" className="edit-preview-rail" data-testid="edit-preview-rail">
      <div className="edit-preview-placeholder" data-tone={presentation.tone}>
        <span aria-hidden="true" className="edit-preview-placeholder-icon"><Film size={24} /></span>
        <div>
          <span className="section-eyebrow">Preview</span>
          <strong>{presentation.label}</strong>
          <p>{presentation.description}</p>
        </div>
      </div>

      <section aria-labelledby="edit-rail-status-heading" className="edit-preview-status">
        <div className="edit-preview-status-heading">
          <div>
            <span className="section-eyebrow">Current edit</span>
            <h2 id="edit-rail-status-heading">{editName}</h2>
          </div>
          <span>{projectName}</span>
        </div>
        <dl>
          <div>
            <dt><Film aria-hidden="true" size={15} />Source</dt>
            <dd>{sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'file' : 'files'}` : 'Needed'}</dd>
          </div>
          <div>
            <dt><Frame aria-hidden="true" size={15} />Output</dt>
            <dd>{formatAspectRatio(aspectRatio)}</dd>
          </div>
          <div>
            <dt><Layers3 aria-hidden="true" size={15} />Plan</dt>
            <dd>{estimateReady ? 'Estimate ready' : 'Before approval'}</dd>
          </div>
        </dl>
      </section>
    </aside>
  )
}

function formatAspectRatio(aspectRatio: AspectRatio): string {
  if (aspectRatio === 'let_ai_decide') return 'Choose before approval'
  return aspectRatio
}
