import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ReeditProChatMessage } from '../../../types'
import { Button } from '../../Button'
import { ChatMessageList } from '../ChatMessageList'
import {
  createChatCard,
  createSFXAssistantMessage,
  createSFXCreditApprovalMessage,
  createSFXPlanMessage,
  createSFXProgressMessage,
  createSFXRevisionMessage,
} from '../chatMessageBuilders'
import { InlineSFXCreditEstimateCard } from './InlineSFXCreditEstimateCard'
import { InlineSFXDirectorPlanCard } from './InlineSFXDirectorPlanCard'
import { InlineSFXEventCard } from './InlineSFXEventCard'
import { InlineSFXGenerationProgressCard } from './InlineSFXGenerationProgressCard'
import { InlineSFXLibraryCandidateCard } from './InlineSFXLibraryCandidateCard'
import { InlineSFXMixPlanCard } from './InlineSFXMixPlanCard'
import { InlineSFXPromptPreviewCard } from './InlineSFXPromptPreviewCard'
import { InlineSFXProviderRouteCard } from './InlineSFXProviderRouteCard'
import { InlineSFXQACard } from './InlineSFXQACard'
import { InlineSFXRevisionOptionsCard } from './InlineSFXRevisionOptionsCard'
import { InlineSFXTimingTrimCard } from './InlineSFXTimingTrimCard'
import { ProjectSFXIntegrationPanel } from './ProjectSFXIntegrationPanel'
import { createSFXChatUiData } from './sfxChatUiData'

export function SFXPlanChatFlow() {
  const data = useMemo(() => createSFXChatUiData(), [])
  const [sfxPlanApproved, setSFXPlanApproved] = useState(false)
  const [sfxCreditsApproved, setSFXCreditsApproved] = useState(false)
  const [sfxProgressStarted, setSFXProgressStarted] = useState(false)
  const [sfxProgressIndex, setSFXProgressIndex] = useState(0)
  const [sfxRevisionMessage, setSFXRevisionMessage] = useState('')
  const timerRef = useRef<number | null>(null)
  const progressComplete = sfxProgressStarted && sfxProgressIndex >= data.progressSteps.length - 1

  useEffect(() => {
    if (!sfxProgressStarted || progressComplete) return

    timerRef.current = window.setTimeout(() => {
      setSFXProgressIndex((current) => Math.min(current + 1, data.progressSteps.length - 1))
    }, 520)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [data.progressSteps.length, progressComplete, sfxProgressIndex, sfxProgressStarted])

  function startSFXProgress() {
    setSFXProgressStarted(true)
    setSFXProgressIndex(0)
    setSFXRevisionMessage('SFX plan and credits approved. Preparing the cues.')
  }

  function handlePlanApprove() {
    setSFXPlanApproved(true)
    if (sfxCreditsApproved) {
      startSFXProgress()
      return
    }
    setSFXRevisionMessage('SFX plan approved. Credit approval is still needed before cues start.')
  }

  function handleCreditApprove() {
    setSFXCreditsApproved(true)
    if (sfxPlanApproved) {
      startSFXProgress()
      return
    }
    setSFXRevisionMessage('Sound effect credits approved for this plan.')
  }

  const sfxMessages = useMemo(() => {
    const messages: ReeditProChatMessage[] = [
      createSFXPlanMessage('I found a few subtle SFX moments that can polish the edit.', {
        id: 'sfx-message-director-plan',
        status: sfxPlanApproved ? 'approved' : 'pending',
        cards: [
          createChatCard('sfx-card-director-plan', 'sfx_director_plan', {
            priority: 'required',
            requiredBeforeApproval: true,
            status: sfxPlanApproved ? 'approved' : 'pending',
          }),
        ],
      }),
      createSFXCreditApprovalMessage('SFX starts only after you approve the plan and credits.', {
        id: 'sfx-message-credit-estimate',
        status: sfxCreditsApproved ? 'approved' : 'pending',
        cards: [
          createChatCard('sfx-card-credit-estimate', 'sfx_credit_estimate', {
            priority: 'required',
            requiredBeforeApproval: true,
            status: sfxCreditsApproved ? 'approved' : 'pending',
          }),
        ],
      }),
      createSFXAssistantMessage('SFX planning details are available if you want to inspect timing, mix, QA, and audio asset notes.', {
        id: 'sfx-message-advanced-details',
        cards: [
          createChatCard('sfx-card-advanced-details', 'sfx_advanced_details', {
            priority: 'advanced',
            defaultOpen: false,
          }),
        ],
      }),
    ]

    if (sfxRevisionMessage) {
      messages.push(createSFXRevisionMessage(sfxRevisionMessage, {
        id: 'sfx-message-revision-response',
      }))
    }

    if (sfxProgressStarted) {
      messages.push(createSFXProgressMessage(
        progressComplete
          ? 'SFX progress is complete. QA and revision choices are ready.'
          : 'SFX cues are being prepared after plan and credit approval.',
        {
          id: 'sfx-message-progress',
          status: progressComplete ? 'success' : 'generating',
          cards: [
            createChatCard('sfx-card-generation-progress', 'sfx_generation_progress', {
              priority: 'summary',
              status: progressComplete ? 'success' : 'generating',
            }),
          ],
        },
      ))
    }

    if (progressComplete) {
      messages.push(createSFXAssistantMessage('SFX QA passed. You can keep the cue plan or ask for a calmer revision.', {
        id: 'sfx-message-revision-options',
        status: 'success',
        cards: [
          createChatCard('sfx-card-revision-options', 'sfx_revision_options', {
            priority: 'summary',
            status: 'success',
          }),
        ],
      }))
    }

    return messages
  }, [progressComplete, sfxCreditsApproved, sfxPlanApproved, sfxProgressStarted, sfxRevisionMessage])

  function renderCardsForMessage(message: ReeditProChatMessage): ReactNode {
    const renderedCards = message.cards
      ?.map((card) => {
        switch (card.type) {
          case 'sfx_director_plan':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineSFXDirectorPlanCard plan={data.directorPlan} />
                <div className="inline-card-actions soundflow-action-row">
                  <Button disabled={sfxPlanApproved} onClick={handlePlanApprove} variant="primary">
                    {sfxPlanApproved ? 'SFX plan approved' : 'Approve SFX plan'}
                  </Button>
                  <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated SFX preference: keep every cue soft and subtle.')} variant="secondary">
                    Keep SFX subtle
                  </Button>
                  <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated SFX preference: remove decorative SFX and keep ambience only.')} variant="ghost">
                    Remove SFX
                  </Button>
                  <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated SFX preference: use the internal library only where a safe cue exists.')} variant="ghost">
                    Use internal library only
                  </Button>
                </div>
              </div>
            )
          case 'sfx_credit_estimate':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineSFXCreditEstimateCard
                  approved={sfxCreditsApproved}
                  estimate={data.creditEstimate}
                  onApprove={handleCreditApprove}
                  onInternalLibraryOnly={() => setSFXRevisionMessage('Updated SFX plan: use the internal library first and skip generation when no safe cue exists.')}
                  onLowerCost={() => setSFXRevisionMessage('Updated SFX plan: lower cost with fewer generated cues and more library/no-SFX routes.')}
                  onMMAudioDraftOnly={() => setSFXRevisionMessage('Updated SFX plan: use draft-only routing where SFX still helps.')}
                  onSkipSFX={() => setSFXRevisionMessage('Updated SFX plan: skip generated SFX and preserve ambience only.')}
                />
              </div>
            )
          case 'sfx_advanced_details':
            return (
              <details className="soundflow-detail-toggle" key={card.id}>
                <summary>
                  <span>SFX planning details</span>
                  <small>Events, audio asset route, prompts, timing, mix, QA, and library notes</small>
                </summary>
                <div className="soundflow-technical-stack">
                  <ProjectSFXIntegrationPanel
                    eventCount={data.projectIntegration.eventCount}
                    generationRequestCount={data.projectIntegration.generationRequestCount}
                    providerRouteSummary={data.projectIntegration.providerRouteSummary}
                    qaPassedCount={data.projectIntegration.qaPassedCount}
                    queuedJobCount={data.projectIntegration.queuedJobCount}
                    statusSummary={data.projectIntegration.statusSummary}
                  />

                  <div className="soundflow-card-slot">
                    <p>Recommended SFX moments before generation.</p>
                    {data.eventPlans.map((eventPlan, index) => (
                      <InlineSFXEventCard eventPlan={eventPlan} index={index} key={eventPlan.id} />
                    ))}
                  </div>

                  <div className="soundflow-card-slot">
                    <p>Common cues use the future library first; generated audio is planned only when needed.</p>
                    <InlineSFXProviderRouteCard providerRoute={data.providerRoute} />
                  </div>

                  <div className="soundflow-card-slot">
                    <p>Prompt previews are planning only. No sound preparation starts here.</p>
                    <InlineSFXPromptPreviewCard promptPlan={data.promptPlan} />
                  </div>

                  <div className="soundflow-card-slot">
                    <p>The generated cue would be trimmed so the hit lands exactly on the cut.</p>
                    <InlineSFXTimingTrimCard
                      generatedAsset={data.generatedAsset}
                      timingAlignment={data.timingAlignment}
                      trimPlan={data.trimPlan}
                      validation={data.timingValidation}
                    />
                  </div>

                  <div className="soundflow-card-slot">
                    <p>This SFX remains voice-first and ducks when dialogue is present.</p>
                    <InlineSFXMixPlanCard mixPlan={data.mixPlan} warnings={data.mixWarnings} />
                  </div>

                  <div className="soundflow-card-slot">
                    <p>QA checks voice safety, timing, and mix before any real AI asset preparation.</p>
                    <InlineSFXQACard qaReport={data.qaReport} warningReport={data.warningQAReport} />
                  </div>

                  <div className="soundflow-card-slot">
                    <p>Generated sounds stay project-only unless QA, privacy, tags, and provenance make reuse safe.</p>
                    <InlineSFXLibraryCandidateCard candidate={data.libraryCandidate} />
                  </div>
                </div>
              </details>
            )
          case 'sfx_generation_progress':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineSFXGenerationProgressCard
                  activeIndex={sfxProgressIndex}
                  complete={progressComplete}
                  steps={data.progressSteps}
                />
              </div>
            )
          case 'sfx_revision_options':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineSFXRevisionOptionsCard onChoose={setSFXRevisionMessage} />
              </div>
            )
          default:
            return null
        }
      })
      .filter(Boolean)

    return renderedCards?.length ? renderedCards : null
  }

  return (
    <div aria-label="Sound effects planning flow" className="soundflow-panel sfx-flow-panel" data-testid="sfx-flow">
      <div className="soundflow-message-list">
        <ChatMessageList messages={sfxMessages} renderCards={renderCardsForMessage} />
      </div>
    </div>
  )
}
