import { Paperclip } from 'lucide-react'

import type { UseMotionStudioResearchWorkspaceResult } from '../../../hooks/useMotionStudioResearchWorkspace'
import { ResearchWorkspace } from '../ResearchWorkspace'
import styles from './StorytellingSourcesWorkspace.module.css'

interface StorytellingSourcesWorkspaceProps {
  editPath: string
  research: UseMotionStudioResearchWorkspaceResult
  sourceCount: number
}

export function StorytellingSourcesWorkspace({
  editPath,
  research,
  sourceCount,
}: StorytellingSourcesWorkspaceProps) {
  const attachedButUnindexed = sourceCount > 0 && research.workspace?.state === 'empty'

  return (
    <div className={styles.workspace} data-testid="storytelling-sources-workspace">
      {attachedButUnindexed ? (
        <section className={styles.attachmentNotice} data-testid="storytelling-sources-attachment-notice" role="status">
          <Paperclip aria-hidden="true" size={18} />
          <div>
            <strong>{countLabel(sourceCount, 'Chat attachment')} preserved</strong>
            <span>
              {sourceCount === 1 ? 'It remains' : 'They remain'} attached to this named edit, but no reviewed research source record exists yet.
            </span>
          </div>
        </section>
      ) : null}
      <ResearchWorkspace editPath={editPath} focus="sources" mode="studio" research={research} />
    </div>
  )
}

function countLabel(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}
