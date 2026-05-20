import { useMemo, useState } from 'react'
import { ChatMessage } from '../ChatMessage'
import { InlineRenderTimingManifestCard } from './InlineRenderTimingManifestCard'
import { InlineStoryTimingMapCard } from './InlineStoryTimingMapCard'
import { InlineStoryTimingSegmentCard } from './InlineStoryTimingSegmentCard'
import { InlineTimingAdjustmentCard } from './InlineTimingAdjustmentCard'
import { InlineTimingAnchorCard } from './InlineTimingAnchorCard'
import { InlineTimingConflictCard } from './InlineTimingConflictCard'
import { InlineTimingEventCard } from './InlineTimingEventCard'
import { InlineTimingQACard } from './InlineTimingQACard'
import { InlineTimingReadinessCard } from './InlineTimingReadinessCard'
import { InlineTimingRevisionOptionsCard } from './InlineTimingRevisionOptionsCard'
import { createTimingReviewChatData } from './timingChatUiData'

export function TimingReviewChatFlow() {
  const data = useMemo(() => createTimingReviewChatData(), [])
  const [timingRevisionMessage, setTimingRevisionMessage] = useState('')

  return (
    <>
      <ChatMessage role="ai">
        <p>{data.copy.mapCreated}</p>
        <p>Captions, cuts, music cues, SFX hits, and signature animations are now coordinated around speech meaning and story beats.</p>
        <InlineStoryTimingMapCard data={data} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.segments}</p>
        <InlineStoryTimingSegmentCard segments={data.segments} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.anchorsEvents}</p>
        <InlineTimingAnchorCard anchors={data.topAnchors} totalAnchorCount={data.allAnchors.length} />
        <InlineTimingEventCard eventGroups={data.eventGroups} totalEventCount={data.events.length} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.qaResult}</p>
        <InlineTimingQACard conflicts={data.conflicts} qaChecks={data.qaChecks} qaReport={data.qaReport} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.conflicts}</p>
        <InlineTimingConflictCard conflicts={data.conflicts} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.recommendations}</p>
        <InlineTimingAdjustmentCard
          onAction={setTimingRevisionMessage}
          recommendations={data.adjustmentRecommendations}
        />
      </ChatMessage>

      <ChatMessage role="ai">
        <InlineTimingReadinessCard nextStep={data.nextStep} qaReport={data.qaReport} />
      </ChatMessage>

      <ChatMessage role="ai">
        <p>{data.copy.mockOnly}</p>
        <InlineRenderTimingManifestCard manifest={data.renderManifest} />
      </ChatMessage>

      <ChatMessage role="ai">
        <InlineTimingRevisionOptionsCard onChoose={setTimingRevisionMessage} />
      </ChatMessage>

      {timingRevisionMessage && (
        <ChatMessage role="ai">
          <p>{timingRevisionMessage}</p>
        </ChatMessage>
      )}
    </>
  )
}
