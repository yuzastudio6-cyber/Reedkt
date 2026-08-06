import { Network } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import {
  createProfessionalSkillDisplayModel,
  professionalSkillReviewContextSummary,
} from '../../lib/professional-skills'
import type { ProfessionalSkillPlan } from '../../types'

type PreviewReadyCardProps = {
  creditsUsed: number
  onOpenEditMap?: () => void
  privateReviewReady?: boolean
  reviewSummary?: string | null
  skillPlan?: ProfessionalSkillPlan | null
}

export function PreviewReadyCard({ creditsUsed, onOpenEditMap, privateReviewReady = false, reviewSummary, skillPlan }: PreviewReadyCardProps) {
  const skillDisplay = skillPlan
    ? createProfessionalSkillDisplayModel(skillPlan, { activityLimit: 4, evidenceLimit: 0, preparationLimit: 0 })
    : null

  if (privateReviewReady) {
    return (
      <section className="inline-chat-card preview-ready-card" data-testid="preview-ready-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Private review ready</span>
            <h3>Private review is ready</h3>
          </div>
          <Badge accent="success">{creditsUsed} estimated credits</Badge>
        </div>
        <div className="preview-system-row">
          <Badge accent="success">Approved plan used</Badge>
          <Badge accent="blue">Private source files</Badge>
          <Badge accent="cyan">Playback check required</Badge>
          <Badge accent="violet">Release still gated</Badge>
        </div>
        <p className="inline-helper">
          A private review video has been prepared from your approved plan and uploaded sources.
        </p>
        {reviewSummary && <p className="inline-helper">{reviewSummary}</p>}
        {skillPlan && (
          <div className="preview-ready-skill-trace" data-testid="preview-ready-skill-trace">
            <div className="preview-ready-skill-trace-heading">
              <strong>Review built from</strong>
              <span>{skillPlan.selectedSkillCount} activities</span>
            </div>
            <p>
              {professionalSkillReviewContextSummary(skillPlan)}
            </p>
            {skillDisplay && skillDisplay.activityItems.length > 0 && (
              <ul>
                {skillDisplay.activityItems.map((group) => (
                  <li key={group.id}>
                    <span>{group.label}</span>
                    {group.summary && <small>{group.summary}</small>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="inline-helper">
          Load the review video below to verify playback, then approve the edit or request changes. Sharing, billing, and external release stay off.
        </p>
        <div className="inline-card-actions">
          <Button icon={Network} onClick={onOpenEditMap} variant="primary">Open edit workspace</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="inline-chat-card preview-ready-card" data-testid="preview-ready-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Review ready</span>
          <h3>Your edit is ready for review</h3>
        </div>
        <Badge accent="success">{creditsUsed} estimated credits</Badge>
      </div>
      <div className="chat-preview-frame" aria-label="Edited video preview">
        <div className="speaker-frame">
          <div className="speaker-silhouette" />
          <div className="caption-strip">"This is a major investment."</div>
          <div className="visual-overlay compact-visual-overlay">
            <strong>Property details</strong>
            <small>Location / Space / Finish</small>
          </div>
          <div className="real-motion-overlay compact-real-motion">
            <span>Face-safe overlay</span>
          </div>
        </div>
      </div>
      <div className="preview-system-row">
        <Badge accent="cyan">Motion highlights: 2 moments</Badge>
        <Badge accent="blue">Graphic overlay: 1</Badge>
        <Badge accent="violet">Optional realism layer</Badge>
        <Badge accent="success">Music + sound mix</Badge>
      </div>
      <p className="inline-helper">
        Private review only. Sharing, billing, and release stay gated until you approve a release path.
      </p>
      <p className="inline-helper">
        Open the edit workspace to inspect the planned changes and request adjustments before any public delivery step.
      </p>
      <div className="inline-card-actions">
        <Button icon={Network} onClick={onOpenEditMap} variant="primary">Open edit workspace</Button>
      </div>
    </section>
  )
}
