import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../Button'
import { ChatMessage } from '../ChatMessage'
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
    setSFXRevisionMessage('SFX plan and SFX credits approved. Starting mock SoundSync SFX progress.')
  }

  function handlePlanApprove() {
    setSFXPlanApproved(true)
    if (sfxCreditsApproved) {
      startSFXProgress()
      return
    }
    setSFXRevisionMessage('SFX plan approved. SFX generation still waits for SFX credit approval.')
  }

  function handleCreditApprove() {
    setSFXCreditsApproved(true)
    if (sfxPlanApproved) {
      startSFXProgress()
      return
    }
    setSFXRevisionMessage('SFX credits approved for this mock SoundSync plan.')
  }

  return (
    <>
      <ChatMessage role="ai">
        <p>I found a few edit-layer SFX moments that can improve the polish. I will avoid fake source sounds unless you ask for full sound design.</p>
        <ProjectSFXIntegrationPanel
          eventCount={data.projectIntegration.eventCount}
          generationRequestCount={data.projectIntegration.generationRequestCount}
          providerRouteSummary={data.projectIntegration.providerRouteSummary}
          qaPassedCount={data.projectIntegration.qaPassedCount}
          queuedJobCount={data.projectIntegration.queuedJobCount}
          statusSummary={data.projectIntegration.statusSummary}
        />
        <InlineSFXDirectorPlanCard plan={data.directorPlan} />
        <div className="inline-card-actions">
          <Button disabled={sfxPlanApproved} onClick={handlePlanApprove} variant="primary">
            {sfxPlanApproved ? 'SFX plan approved' : 'Approve SFX plan'}
          </Button>
          <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated mock SFX preference: keep every cue premium soft and subtle.')} variant="secondary">
            Keep SFX subtle
          </Button>
          <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated mock SFX preference: remove decorative SFX and keep ambience only.')} variant="ghost">
            Remove SFX
          </Button>
          <Button disabled={sfxPlanApproved} onClick={() => setSFXRevisionMessage('Updated mock SFX preference: use internal library only where a safe approved cue exists.')} variant="ghost">
            Use internal library only
          </Button>
        </div>
      </ChatMessage>

      <ChatMessage role="ai">
        <p>Here are the SFX events I recommend before generation.</p>
        {data.eventPlans.map((eventPlan, index) => (
          <InlineSFXEventCard eventPlan={eventPlan} index={index} key={eventPlan.id} />
        ))}
      </ChatMessage>

      <ChatMessage role="ai">
        <p>I will route common cues through the future library first, then use draft or production providers only when needed.</p>
        <InlineSFXProviderRouteCard providerRoute={data.providerRoute} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>Prompt previews stay visible before any generation. This is still planning only.</p>
        <InlineSFXPromptPreviewCard promptPlan={data.promptPlan} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>This transition whoosh will be generated longer than needed, then trimmed so the hit lands exactly on the cut.</p>
        <InlineSFXTimingTrimCard
          generatedAsset={data.generatedAsset}
          timingAlignment={data.timingAlignment}
          trimPlan={data.trimPlan}
          validation={data.timingValidation}
        />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>This SFX is voice-first. It will stay under the speaker and duck when dialogue is present.</p>
        <InlineSFXMixPlanCard mixPlan={data.mixPlan} warnings={data.mixWarnings} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>This SFX passed QA in the mock flow. I also included a warning example so the guardrails are visible.</p>
        <InlineSFXQACard qaReport={data.qaReport} warningReport={data.warningQAReport} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>I am keeping generated sounds project-only unless QA, privacy, tags, and provenance make them safe as library candidates.</p>
        <InlineSFXLibraryCandidateCard candidate={data.libraryCandidate} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>I can start mock SFX progress after you approve the SFX plan and SFX credit estimate.</p>
        <InlineSFXCreditEstimateCard
          approved={sfxCreditsApproved}
          estimate={data.creditEstimate}
          onApprove={handleCreditApprove}
          onInternalLibraryOnly={() => setSFXRevisionMessage('Updated mock SFX plan: use the internal library first and skip provider generation when no approved cue exists.')}
          onLowerCost={() => setSFXRevisionMessage('Updated mock SFX plan: lower cost by reducing generated SFX and using library/no-SFX routes.')}
          onMMAudioDraftOnly={() => setSFXRevisionMessage('Updated mock SFX plan: use MMAudio draft-only routing where SFX is still useful.')}
          onSkipSFX={() => setSFXRevisionMessage('Updated mock SFX plan: skip generated SFX and preserve ambience only.')}
        />
      </ChatMessage>

      {sfxRevisionMessage && (
        <ChatMessage role="ai">
          <p>{sfxRevisionMessage}</p>
        </ChatMessage>
      )}

      {sfxProgressStarted && (
        <ChatMessage role="ai">
          <InlineSFXGenerationProgressCard
            activeIndex={sfxProgressIndex}
            complete={progressComplete}
            steps={data.progressSteps}
          />
        </ChatMessage>
      )}

      {progressComplete && (
        <ChatMessage role="ai">
          <InlineSFXRevisionOptionsCard onChoose={setSFXRevisionMessage} />
        </ChatMessage>
      )}
    </>
  )
}
