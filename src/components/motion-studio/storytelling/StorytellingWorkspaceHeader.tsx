import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import type { StorytellingWorkspace } from '../../../lib/motion-studio/storytelling-workspace-model'
import { StorytellingWorkspaceSwitcher } from './StorytellingWorkspaceSwitcher'
import styles from './StorytellingWorkspaceHeader.module.css'

interface StorytellingWorkspaceHeaderProps {
  activeWorkspace: StorytellingWorkspace
  backLabel: string
  backPath: string
  editName: string
  onSelectWorkspace: (workspace: StorytellingWorkspace) => void
  parentProjectName: string
  projectPath: string
}

export function StorytellingWorkspaceHeader({
  activeWorkspace,
  backLabel,
  backPath,
  editName,
  onSelectWorkspace,
  parentProjectName,
  projectPath,
}: StorytellingWorkspaceHeaderProps) {
  return (
    <header
      aria-label="Storytelling project workspace"
      className={styles.header}
      data-testid="editor-header"
    >
      <div className={styles.identity}>
        <Link
          aria-label={backLabel}
          className={styles.back}
          title={backLabel}
          to={backPath}
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>
        <div className={styles.identityCopy}>
          <Link className={styles.projectLink} to={projectPath}>{parentProjectName}</Link>
          <h1 title={editName}>{editName}</h1>
        </div>
      </div>

      <StorytellingWorkspaceSwitcher
        activeWorkspace={activeWorkspace}
        onSelect={onSelectWorkspace}
        variant="header"
      />
    </header>
  )
}
