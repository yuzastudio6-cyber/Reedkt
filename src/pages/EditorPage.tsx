import { AppShell } from '../components/AppShell'
import { ChatNativeEditor } from '../components/editor/ChatNativeEditor'

export function EditorPage() {
  return (
    <AppShell
      description="Send clips, explain the edit, approve credits, and watch ReeditPro work through chat."
      eyebrow="AI Editor workspace"
      primaryAction={false}
      title="Chat-native editor"
    >
      <ChatNativeEditor onOpenTimeline={() => {}} />
    </AppShell>
  )
}
