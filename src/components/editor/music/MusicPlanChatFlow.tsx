import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessage } from '../ChatMessage'
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
    setMusicRevisionMessage('Music plan and music credits approved. Starting mock SoundSync progress.')
  }

  function handleMusicPlanApprove() {
    setMusicPlanApproved(true)
    if (musicCreditsApproved) {
      startMusicProgress()
      return
    }
    setMusicRevisionMessage('Music plan approved. Music generation still waits for music credit approval.')
  }

  function handleMusicCreditsApprove() {
    setMusicCreditsApproved(true)
    if (musicPlanApproved) {
      startMusicProgress()
      return
    }
    setMusicRevisionMessage('Music credits approved for this mock SoundSync plan.')
  }

  return (
    <>
      <ChatMessage role="ai">
        <p>I found this is a lifestyle/vacation edit with dialogue, montage, food/social moments, and an outro. I recommend a multi-cue music plan instead of one track.</p>
        <InlineMusicContextCard context={data.context} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>Here is the music cue sheet before generating anything.</p>
        <InlineMusicCueSheetCard
          approved={musicPlanApproved}
          context={data.context}
          cueSheet={data.cueSheet}
          onAmbienceOnly={() => setMusicRevisionMessage('Updated mock music preference: keep natural ambience and skip generated music where possible.')}
          onApprove={handleMusicPlanApprove}
          onInstrumentalOnly={() => setMusicRevisionMessage('Updated mock music preference: make all cues instrumental-first.')}
          onLowerCost={() => setMusicRevisionMessage('Updated mock music preference: lower cost by generating fewer cues.')}
        />
        {data.cueCards.map((cue) => (
          <InlineMusicCueCard cue={cue} key={cue.id} />
        ))}
      </ChatMessage>

      <ChatMessage role="ai">
        <p>Lyrics can work in the montage sections, but I’ll keep dialogue sections instrumental-only so the voice stays clear.</p>
        <InlineLyriaPromptPreviewCard
          cue={data.promptCue}
          onAction={setMusicRevisionMessage}
          promptPlan={data.promptPlan}
        />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>I can generate these with Lyria Pro after you approve the music credit estimate.</p>
        <InlineMusicCreditEstimateCard
          approved={musicCreditsApproved}
          estimate={data.creditEstimate}
          onApprove={handleMusicCreditsApprove}
          onDialogueBedOnly={() => setMusicRevisionMessage('Updated mock music plan: generate only the dialogue bed and keep the rest ambience/editorial.')}
          onLowerCost={() => setMusicRevisionMessage('Updated mock music plan: reduce generated cue count to lower cost.')}
          onSkipMusic={() => setMusicRevisionMessage('Updated mock music plan: skip generated music and preserve ambience only.')}
        />
      </ChatMessage>

      {musicRevisionMessage && (
        <ChatMessage role="ai">
          <p>{musicRevisionMessage}</p>
        </ChatMessage>
      )}

      {musicProgressStarted && (
        <ChatMessage role="ai">
          <InlineMusicGenerationProgressCard
            activeIndex={musicProgressIndex}
            complete={musicProgressComplete}
            steps={data.progressSteps}
          />
        </ChatMessage>
      )}

      {musicProgressComplete && (
        <>
          <ChatMessage role="ai">
            <p>The music QA passed for the dialogue-safe cue. I also checked a failed example so the lyrics-under-dialogue guard is visible in this mock.</p>
            <InlineMusicQACard
              primaryResult={data.qaPassResult}
              warningResult={data.qaFailResult}
            />
          </ChatMessage>

          <ChatMessage role="ai">
            <p>I built the mix plan around the video. Voice stays first, montage can carry stronger music, and ambience is preserved where it matters.</p>
            <InlineMusicMixPlanCard mixPlan={data.qaPassResult.mixPlan} />
          </ChatMessage>

          <ChatMessage role="ai">
            <InlineMusicRevisionOptionsCard onChoose={setMusicRevisionMessage} />
          </ChatMessage>
        </>
      )}
    </>
  )
}
