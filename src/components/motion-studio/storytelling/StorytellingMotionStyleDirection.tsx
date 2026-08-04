import {
  Clapperboard,
  DraftingCompass,
  Layers3,
  MessageCircle,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'

import type {
  StorytellingMotionStyleDirectionDto,
  StorytellingMotionStyleDecisionDto,
  StorytellingMotionStyleProfileId,
  StorytellingMotionStyleReviewDto,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import styles from './StorytellingMotionStyleDirection.module.css'

interface StorytellingMotionStyleDirectionProps {
  decision: StorytellingMotionStyleDecisionDto
  onDiscussStyle: (displayName: string) => void
  onReturnToChat: () => void
  review: StorytellingMotionStyleReviewDto
}

const icons: Record<StorytellingMotionStyleProfileId, LucideIcon> = {
  'storytelling_style.editorial_collage': Newspaper,
  'storytelling_style.cinematic_realist_documentary': Clapperboard,
  'storytelling_style.paper_diorama_documentary': Layers3,
  'storytelling_style.technical_blueprint': DraftingCompass,
}

export function StorytellingMotionStyleDirection({
  decision,
  onDiscussStyle,
  onReturnToChat,
  review,
}: StorytellingMotionStyleDirectionProps) {
  const [activeId, setActiveId] = useState<StorytellingMotionStyleProfileId>(
    decision.selectedStyleProfileId ?? review.directions[0]!.styleProfile.styleProfileId,
  )
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(0, review.directions.findIndex(
    (direction) => direction.styleProfile.styleProfileId === activeId,
  ))
  const active = review.directions[activeIndex]!

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = review.directions.length - 1
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index === lastIndex ? 0 : index + 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index === 0 ? lastIndex : index - 1
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex
    if (nextIndex === undefined) return
    event.preventDefault()
    const next = review.directions[nextIndex]!
    setActiveId(next.styleProfile.styleProfileId)
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <section
      aria-labelledby="storytelling-motion-style-heading"
      className={styles.surface}
      data-testid="storytelling-motion-style-review"
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Motion direction</span>
          <h3 id="storytelling-motion-style-heading">{decision.title}</h3>
          <p>{decision.summary}</p>
        </div>
        <span className={styles.planningOnly} data-state={decision.state}>{decision.statusLabel}</span>
      </header>

      <div
        aria-describedby="storytelling-motion-style-notice"
        aria-label="Preview Storytelling motion directions"
        className={styles.selector}
        role="radiogroup"
      >
        {review.directions.map((direction, index) => {
          const selected = direction.styleProfile.styleProfileId === active.styleProfile.styleProfileId
          const authoritative = direction.styleProfile.styleProfileId === decision.selectedStyleProfileId
          const Icon = icons[direction.styleProfile.styleProfileId]
          return (
            <button
              aria-checked={selected}
              aria-label={direction.displayName}
              className={styles.option}
              data-authoritative={authoritative ? 'true' : 'false'}
              data-testid={`storytelling-motion-style-${direction.styleProfile.styleProfileId.split('.').at(-1)}`}
              key={direction.styleProfile.styleProfileId}
              onClick={() => setActiveId(direction.styleProfile.styleProfileId)}
              onKeyDown={(event) => moveFocus(event, index)}
              ref={(element) => { optionRefs.current[index] = element }}
              role="radio"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <Icon aria-hidden="true" size={17} />
              <span className={styles.optionLabel}>{direction.displayName}</span>
              {authoritative ? <span aria-hidden="true" className={styles.authorityMarker}>Current</span> : null}
            </button>
          )
        })}
      </div>

      <StyleDirectionDetail
        actionLabel={active.styleProfile.styleProfileId === decision.selectedStyleProfileId
          ? decision.nextAction.label
          : `Discuss ${active.displayName} in Chat`}
        direction={active}
        onDiscussStyle={onDiscussStyle}
        onReturnToChat={onReturnToChat}
      />

      {decision.changeImpact ? <StyleChangeImpact decision={decision} /> : null}

      <p className={styles.notice} id="storytelling-motion-style-notice">
        {decision.state === 'comparison_only'
          ? review.notice
          : 'This view is read-only. Chat proposes changes, and the existing Plan Review remains the only approval point.'}
      </p>
    </section>
  )
}

function StyleDirectionDetail({
  actionLabel,
  direction,
  onDiscussStyle,
  onReturnToChat,
}: {
  actionLabel: string
  direction: StorytellingMotionStyleDirectionDto
  onDiscussStyle: (displayName: string) => void
  onReturnToChat: () => void
}) {
  const Icon = icons[direction.styleProfile.styleProfileId]
  return (
    <div aria-live="polite" className={styles.detail} data-testid="storytelling-motion-style-detail">
      <div className={styles.detailLead}>
        <span aria-hidden="true" className={styles.detailIcon}><Icon size={24} /></span>
        <div>
          <h4>{direction.displayName}</h4>
          <p>{direction.shortDescription}</p>
        </div>
      </div>

      <dl className={styles.facts}>
        <div><dt>Construction</dt><dd>{direction.constructionLabel}</dd></div>
        <div><dt>Editability</dt><dd>{editabilityLabel(direction.editability)}</dd></div>
        <div><dt>Production weight</dt><dd>{productionWeightLabel(direction.relativeCostTendency)}</dd></div>
      </dl>

      <div className={styles.bestFor}>
        <span>Best for</span>
        <ul>
          {direction.bestFor.slice(0, 4).map((value) => <li key={value}>{value}</li>)}
        </ul>
      </div>

      <div className={styles.action}>
        <Button
          icon={MessageCircle}
          onClick={() => {
            onReturnToChat()
            onDiscussStyle(direction.displayName)
          }}
          variant="secondary"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

function StyleChangeImpact({ decision }: { decision: StorytellingMotionStyleDecisionDto }) {
  const impact = decision.changeImpact
  if (!impact) return null
  return (
    <section aria-label="Style change impact" className={styles.impact}>
      <span>Change impact</span>
      <dl>
        <div><dt>Keep</dt><dd>{impact.preservedVersionCount}</dd></div>
        <div><dt>Review</dt><dd>{impact.reviewRequiredVersionCount}</dd></div>
        <div><dt>Rebuild</dt><dd>{impact.rebuildRequiredVersionCount}</dd></div>
      </dl>
      <p>The earlier approved version remains unchanged while the replacement plan is reviewed.</p>
    </section>
  )
}

function editabilityLabel(value: StorytellingMotionStyleDirectionDto['editability']): string {
  return value === 'high' ? 'Highly editable' : 'Selective generated shots'
}

function productionWeightLabel(
  value: StorytellingMotionStyleDirectionDto['relativeCostTendency'],
): string {
  const labels: Record<StorytellingMotionStyleDirectionDto['relativeCostTendency'], string> = {
    lower: 'Lighter',
    moderate: 'Balanced',
    higher: 'Premium',
  }
  return labels[value]
}
