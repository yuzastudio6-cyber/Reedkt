import { useNavigate } from 'react-router'
import { AppShell } from '../components/AppShell'
import {
  MotionStudioHome,
  MotionStudioStorytellingLibrary,
} from '../components/motion-studio/MotionStudioHome'
import { MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE } from '../types/motion-studio/storytelling-workflow'

export function MotionStudioPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      chrome="standard"
      description="Create and continue professional motion-design workflows without leaving ReEditPro."
      eyebrow="Creative workspace"
      primaryAction={false}
      title="Motion Studio"
    >
      <MotionStudioHome onOpenStorytelling={() => navigate(MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE)} />
    </AppShell>
  )
}

export function MotionStudioStorytellingLibraryPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      chrome="editor"
      description="Create or resume a Motion Studio story, then direct it in its dedicated Storytelling Director Chat."
      eyebrow="Motion Studio"
      primaryAction={false}
      title="Storytelling"
    >
      <MotionStudioStorytellingLibrary onBack={() => navigate('/motion-studio')} />
    </AppShell>
  )
}
