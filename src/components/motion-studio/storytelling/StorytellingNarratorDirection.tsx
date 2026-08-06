import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Mic2,
  RefreshCw,
} from 'lucide-react'

import type { UseMotionStudioVoiceCastingWorkspaceResult } from '../../../hooks/useMotionStudioVoiceCastingWorkspace'
import { safeMotionStudioResourceMessage } from '../../../lib/motion-studio/user-facing-resource-message'
import { Button } from '../../Button'
import styles from './StorytellingNarratorDirection.module.css'

interface StorytellingNarratorDirectionProps {
  voiceCasting: UseMotionStudioVoiceCastingWorkspaceResult
  onReturnToChat: () => void
}

export function StorytellingNarratorDirection({
  voiceCasting,
  onReturnToChat,
}: StorytellingNarratorDirectionProps) {
  const workspace = voiceCasting.workspace
  const selectionKey = `${workspace?.catalogVersion ?? 'no-catalog'}:${workspace?.selectedCandidateReference ?? 'no-selection'}`
  const [selection, setSelection] = useState({
    key: selectionKey,
    candidateReference: workspace?.selectedCandidateReference ?? '',
  })
  const candidateReference = selection.key === selectionKey
    ? selection.candidateReference
    : workspace?.selectedCandidateReference ?? ''

  const candidate = useMemo(
    () => workspace?.candidates.find((item) => item.candidateReference === candidateReference),
    [candidateReference, workspace?.candidates],
  )

  if (voiceCasting.state === 'inactive' || voiceCasting.state === 'loading') {
    return (
      <section className={styles.compactState} data-testid="storytelling-voice-casting-loading">
        <LoaderCircle aria-hidden="true" className={styles.spin} size={18} />
        <div aria-live="polite" role="status">
          <strong>Checking narrator direction</strong>
          <span>Reading the current Voice Bible draft.</span>
        </div>
      </section>
    )
  }

  if (['permission_denied', 'not_found', 'conflict', 'failure', 'catalog_unavailable'].includes(voiceCasting.state)) {
    const denied = voiceCasting.state === 'permission_denied'
    return (
      <section className={`${styles.compactState} ${styles.attention}`} data-testid={`storytelling-voice-casting-${voiceCasting.state}`}>
        {denied ? <LockKeyhole aria-hidden="true" size={18} /> : <AlertTriangle aria-hidden="true" size={18} />}
        <div aria-live={denied ? 'polite' : 'assertive'} role={denied ? 'status' : 'alert'}>
          <strong>{denied ? 'Narrator direction is private' : 'Narrator choices need attention'}</strong>
          <span>{safeMotionStudioResourceMessage(
            voiceCasting.message ?? workspace?.notice,
            'Narrator choices could not be loaded. The Voice Bible was not changed.',
          )}</span>
        </div>
        {!denied ? (
          <Button icon={RefreshCw} onClick={() => { void voiceCasting.refresh() }} variant="secondary">Try again</Button>
        ) : null}
      </section>
    )
  }

  if (voiceCasting.state === 'not_prepared') {
    return (
      <section className={styles.compactState} data-testid="storytelling-voice-casting-not-prepared">
        <Mic2 aria-hidden="true" size={19} />
        <div role="status">
          <strong>Narrator direction</strong>
          <span>{workspace?.notice ?? 'Prepare narrator direction in Chat before choosing a voice.'}</span>
        </div>
        <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Prepare in Chat</Button>
      </section>
    )
  }

  if (voiceCasting.state === 'uploaded_narration') {
    return (
      <section className={styles.compactState} data-testid="storytelling-voice-casting-uploaded-narration">
        <Mic2 aria-hidden="true" size={19} />
        <div role="status">
          <strong>Uploaded narration</strong>
          <span>{workspace?.notice}</span>
        </div>
      </section>
    )
  }

  if (!workspace || !workspace.catalogVersion || workspace.candidates.length === 0) {
    return null
  }

  const locked = voiceCasting.state === 'locked_read_only'
  const unchanged = candidateReference === workspace.selectedCandidateReference
  const saving = voiceCasting.operation === 'saving'
  const actionLabel = saving
    ? 'Saving…'
    : unchanged && workspace.selectedCandidateReference
      ? 'Used for planning'
      : workspace.selectedCandidateReference
        ? 'Update direction'
        : 'Use for planning'

  return (
    <section
      aria-labelledby="storytelling-narrator-direction-heading"
      className={styles.section}
      data-testid={`storytelling-voice-casting-${voiceCasting.state}`}
    >
      <header className={styles.heading}>
        <span aria-hidden="true" className={styles.icon}><Mic2 size={20} /></span>
        <div>
          <span className={styles.eyebrow}>{locked ? 'Read only' : 'Voice Bible draft'}</span>
          <h3 id="storytelling-narrator-direction-heading">Narrator direction</h3>
          <p>{workspace.notice}</p>
        </div>
        {locked ? <LockKeyhole aria-hidden="true" className={styles.lock} size={18} /> : null}
      </header>

      <div className={styles.selectorRow}>
        <label htmlFor="storytelling-narrator-choice">Narrator</label>
        <select
          disabled={locked || saving}
          id="storytelling-narrator-choice"
          onChange={(event) => setSelection({ key: selectionKey, candidateReference: event.target.value })}
          value={candidateReference}
        >
          <option value="">Choose a narrator</option>
          {workspace.candidates.map((item) => (
            <option key={item.candidateReference} value={item.candidateReference}>{item.displayName}</option>
          ))}
        </select>
      </div>

      {candidate ? (
        <div className={styles.candidate} data-testid="storytelling-narrator-candidate-details">
          <div>
            <strong>{candidate.displayName}</strong>
            {candidate.description ? <p>{candidate.description}</p> : null}
          </div>
          <ul aria-label="Narrator characteristics">
            {traitValues(candidate.traits).map((trait) => <li key={trait}>{trait}</li>)}
          </ul>
        </div>
      ) : null}

      <footer className={styles.footer}>
        <p>Auditions are not available from this private catalog yet. Saving a direction does not generate speech, approve the plan, or use credits.</p>
        {!locked ? (
          <Button
            disabled={!candidateReference || unchanged || saving}
            icon={Mic2}
            onClick={() => { void voiceCasting.selectCandidate(candidateReference) }}
            variant="primary"
          >
            {actionLabel}
          </Button>
        ) : (
          <Button icon={MessageCircle} onClick={onReturnToChat} variant="secondary">Request change in Chat</Button>
        )}
      </footer>

      {voiceCasting.message ? (
        <p aria-live="polite" className={styles.feedback} role="status">{voiceCasting.message}</p>
      ) : null}
    </section>
  )
}

function traitValues(traits: {
  accent?: string
  age?: string
  gender?: string
  language?: string
  useCase?: string
  character?: string
}): string[] {
  return [...new Set([
    traits.accent,
    traits.age,
    traits.gender,
    traits.language,
    traits.useCase,
    traits.character,
  ].filter((value): value is string => Boolean(value)).map(humanize))]
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
