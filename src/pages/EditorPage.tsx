import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ChatNativeEditor } from '../components/editor/ChatNativeEditor'
import { DetailedTimelineDrawer } from '../components/editor/DetailedTimelineDrawer'

export function EditorPage() {
  const location = useLocation()
  const [timelineOpen, setTimelineOpen] = useState(false)

  return (
    <AppShell
      description="Send clips, explain the edit, approve credits, and watch ReeditPro work through chat."
      eyebrow="AI Editor workspace"
      mode="chat"
      primaryAction="Create project and chat"
      title="Chat-native editor"
    >
      <ChatNativeEditor key={location.search} onOpenTimeline={() => setTimelineOpen(true)} />
      <DetailedTimelineDrawer onClose={() => setTimelineOpen(false)} open={timelineOpen} />
    </AppShell>
  )
}
