import { BookOpenText, FileText, Sparkles } from 'lucide-react'
import { Button } from '../Button'
import styles from './StorytellingDirectorStart.module.css'

type StorytellingDirectorStartProps = {
  hasDirection: boolean
  onChoosePrompt: (prompt: string) => void
}

const IDEA_PROMPT = 'I want to tell a story about '
const PREPARED_STORY_PROMPT = 'I already have a prepared story. Help me understand it and plan the motion design from '

export function StorytellingDirectorStart({
  hasDirection,
  onChoosePrompt,
}: StorytellingDirectorStartProps) {
  return (
    <section
      aria-labelledby="storytelling-director-start-title"
      className={styles.surface}
      data-state={hasDirection ? 'direction-captured' : 'ready'}
      data-testid="storytelling-director-start"
    >
      <div className={styles.heading}>
        <span aria-hidden="true" className={styles.icon}>
          <BookOpenText size={22} />
        </span>
        <div>
          <span className={styles.eyebrow}>Storytelling Director</span>
          <h2 id="storytelling-director-start-title">
            {hasDirection ? 'Your story direction is captured' : 'Choose a starting point'}
          </h2>
          <p>
            {hasDirection
              ? 'Keep shaping the story with Director, or add source footage when it becomes useful. Nothing is generated or charged before the plan review.'
              : 'Start from an idea or prepared story material. You can add footage later.'}
          </p>
        </div>
      </div>

      {!hasDirection ? (
        <div aria-label="Storytelling starting points" className={styles.actions}>
          <Button
            icon={Sparkles}
            onClick={() => onChoosePrompt(IDEA_PROMPT)}
            variant="primary"
          >
            Start with an idea
          </Button>
          <Button
            icon={FileText}
            onClick={() => onChoosePrompt(PREPARED_STORY_PROMPT)}
            variant="secondary"
          >
            Use prepared story
          </Button>
        </div>
      ) : (
        <p aria-live="polite" className={styles.status}>
          Continue in the message field below. Source footage is optional during this first conversation.
        </p>
      )}
    </section>
  )
}
