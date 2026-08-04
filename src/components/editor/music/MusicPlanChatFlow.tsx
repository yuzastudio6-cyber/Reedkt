import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ReeditProChatMessage } from '../../../types'
import { ChatMessageList } from '../ChatMessageList'
import {
  createChatCard,
  createMusicAssistantMessage,
  createMusicCreditApprovalMessage,
  createMusicPlanMessage,
  createMusicProgressMessage,
  createMusicRevisionMessage,
} from '../chatMessageBuilders'
import { InlineLyriaPromptPreviewCard } from './InlineLyriaPromptPreviewCard'
import { InlineMusicContextCard } from './InlineMusicContextCard'
import { InlineMusicCreditEstimateCard } from './InlineMusicCreditEstimateCard'
import { InlineMusicCueCard } from './InlineMusicCueCard'
import { InlineMusicCueSheetCard } from './InlineMusicCueSheetCard'
import { InlineMusicGenerationProgressCard } from './InlineMusicGenerationProgressCard'
import { InlineMusicMixPlanCard } from './InlineMusicMixPlanCard'
import { InlineMusicQACard } from './InlineMusicQACard'
import { InlineMusicRevisionOptionsCard } from './InlineMusicRevisionOptionsCard'
import { createMusicChatUiData } from './musicChatUiData'

export function MusicPlanChatFlow() {
  const data = useMemo(() => createMusicChatUiData(), [])
  const [musicPlanApproved, setMusicPlanApproved] = useState(false)
  const [musicCreditsApproved, setMusicCreditsApproved] = useState(false)
  const [musicProgressStarted, setMusicProgressStarted] = useState(false)
  const [musicProgressIndex, setMusicProgressIndex] = useState(0)
  const [musicRevisionMessage, setMusicRevisionMessage] = useState('')
  const timerRef = useRef<number | null>(null)
  const musicProgressComplete = musicProgressStarted && musicProgressIndex >= data.progressSteps.length - 1

  useEffect(() => {
    if (!musicProgressStarted || musicProgressComplete) {
      return
    }

    timerRef.current = window.setTimeout(() => {
      setMusicProgressIndex((current) => Math.min(current + 1, data.progressSteps.length - 1))
    }, 520)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [data.progressSteps.length, musicProgressComplete, musicProgressIndex, musicProgressStarted])

  function startMusicProgress() {
    setMusicProgressStarted(true)
    setMusicProgressIndex(0)
    setMusicRevisionMessage('Music plan and credits approved. Preparing the cue.')
  }

  function handleMusicPlanApprove() {
    setMusicPlanApproved(true)
    if (musicCreditsApproved) {
      startMusicProgress()
      return
    }
    setMusicRevisionMessage('Music plan approved. Credit approval is still needed before cues start.')
  }

  function handleMusicCreditsApprove() {
    setMusicCreditsApproved(true)
    if (musicPlanApproved) {
      startMusicProgress()
      return
    }
    setMusicRevisionMessage('Music credits approved for this plan.')
  }

  const musicMessages = useMemo(() => {
    const messages: ReeditProChatMessage[] = [
      createMusicAssistantMessage('I found dialogue, montage, social moments, and an outro. A voice-safe cue plan fits better than one generic track.', {
        id: 'music-message-context',
        cards: [
          createChatCard('music-card-context', 'music_context', {
            priority: 'summary',
          }),
        ],
      }),
      createMusicPlanMessage('Here is the music cue sheet before generating anything.', {
        id: 'music-message-cue-sheet',
        status: musicPlanApproved ? 'approved' : 'pending',
        cards: [
          createChatCard('music-card-cue-sheet', 'music_cue_sheet', {
            priority: 'required',
            requiredBeforeApproval: true,
            status: musicPlanApproved ? 'approved' : 'pending',
          }),
        ],
      }),
      createMusicCreditApprovalMessage('Music starts only after you approve the cue plan and credits.', {
        id: 'music-message-credit-estimate',
        status: musicCreditsApproved ? 'approved' : 'pending',
        cards: [
          createChatCard('music-card-credit-estimate', 'music_credit_estimate', {
            priority: 'required',
            requiredBeforeApproval: true,
            status: musicCreditsApproved ? 'approved' : 'pending',
          }),
        ],
      }),
      createMusicAssistantMessage('Music cue details stay tucked away so the approval path stays readable.', {
        id: 'music-message-advanced-details',
        cards: [
          createChatCard('music-card-advanced-details', 'music_advanced_details', {
            priority: 'advanced',
            defaultOpen: false,
          }),
        ],
      }),
    ]

    if (musicRevisionMessage) {
      messages.push(createMusicRevisionMessage(musicRevisionMessage, {
        id: 'music-message-revision-response',
      }))
    }

    if (musicProgressStarted) {
      messages.push(createMusicProgressMessage(
        musicProgressComplete
          ? 'Music progress is complete. QA, mix, and revision options are ready.'
          : 'Music cues are being prepared after plan and credit approval.',
        {
          id: 'music-message-progress',
          status: musicProgressComplete ? 'success' : 'generating',
          cards: [
            createChatCard('music-card-generation-progress', 'music_generation_progress', {
              priority: 'summary',
              status: musicProgressComplete ? 'success' : 'generating',
            }),
          ],
        },
      ))
    }

    if (musicProgressComplete) {
      messages.push(createMusicAssistantMessage('Music QA passed. Voice stays first, ambience is protected, and revision options are ready.', {
        id: 'music-message-qa-and-revision',
        status: 'success',
        cards: [
          createChatCard('music-card-qa', 'music_qa', {
            priority: 'summary',
            status: 'success',
          }),
          createChatCard('music-card-mix-plan', 'music_mix_plan', {
            priority: 'summary',
            status: 'success',
          }),
          createChatCard('music-card-revision-options', 'music_revision_options', {
            priority: 'summary',
            status: 'success',
          }),
        ],
      }))
    }

    return messages
  }, [musicCreditsApproved, musicPlanApproved, musicProgressComplete, musicProgressStarted, musicRevisionMessage])

  function renderCardsForMessage(message: ReeditProChatMessage): ReactNode {
    const renderedCards = message.cards
      ?.map((card) => {
        switch (card.type) {
          case 'music_context':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicContextCard context={data.context} />
              </div>
            )
          case 'music_cue_sheet':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicCueSheetCard
                  approved={musicPlanApproved}
                  context={data.context}
                  cueSheet={data.cueSheet}
                  onAmbienceOnly={() => setMusicRevisionMessage('Updated music preference: keep natural ambience and skip generated music where possible.')}
                  onApprove={handleMusicPlanApprove}
                  onInstrumentalOnly={() => setMusicRevisionMessage('Updated music preference: make all cues instrumental-first.')}
                  onLowerCost={() => setMusicRevisionMessage('Updated music preference: lower cost by generating fewer cues.')}
                />
              </div>
            )
          case 'music_credit_estimate':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicCreditEstimateCard
                  approved={musicCreditsApproved}
                  estimate={data.creditEstimate}
                  onApprove={handleMusicCreditsApprove}
                  onDialogueBedOnly={() => setMusicRevisionMessage('Updated music plan: generate only the dialogue bed and keep the rest ambience/editorial.')}
                  onLowerCost={() => setMusicRevisionMessage('Updated music plan: reduce generated cue count to lower cost.')}
                  onSkipMusic={() => setMusicRevisionMessage('Updated music plan: skip generated music and preserve ambience only.')}
                />
              </div>
            )
          case 'music_advanced_details':
            return (
              <details className="soundflow-detail-toggle" key={card.id}>
                <summary>
                  <span>Music cue details</span>
                  <small>Cue cards, music brief preview, and dialogue-safety notes</small>
                </summary>
                <div className="soundflow-technical-stack">
                  <div className="soundflow-card-slot">
                    <p>Detailed cue cards stay optional so the approval path stays readable.</p>
                    {data.cueCards.map((cue) => (
                      <InlineMusicCueCard cue={cue} key={cue.id} />
                    ))}
                  </div>

                  <div className="soundflow-card-slot">
                    <p>Lyrics can work only in montage or no-speech sections. Dialogue sections stay instrumental-first.</p>
                    <InlineLyriaPromptPreviewCard
                      cue={data.promptCue}
                      onAction={setMusicRevisionMessage}
                      promptPlan={data.promptPlan}
                    />
                  </div>
                </div>
              </details>
            )
          case 'music_generation_progress':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicGenerationProgressCard
                  activeIndex={musicProgressIndex}
                  complete={musicProgressComplete}
                  steps={data.progressSteps}
                />
              </div>
            )
          case 'music_qa':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicQACard
                  primaryResult={data.qaPassResult}
                  warningResult={data.qaFailResult}
                />
              </div>
            )
          case 'music_mix_plan':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicMixPlanCard mixPlan={data.qaPassResult.mixPlan} />
              </div>
            )
          case 'music_revision_options':
            return (
              <div className="soundflow-card-slot" key={card.id}>
                <InlineMusicRevisionOptionsCard onChoose={setMusicRevisionMessage} />
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
    <div aria-label="Music planning flow" className="soundflow-panel music-flow-panel" data-testid="music-flow">
      <div className="soundflow-message-list">
        <ChatMessageList messages={musicMessages} renderCards={renderCardsForMessage} />
      </div>
    </div>
  )
}
