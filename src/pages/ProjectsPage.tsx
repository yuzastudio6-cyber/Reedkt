import { useEffect, useMemo, useState } from 'react'
import { Filter, FolderPlus, Grid3X3, ListFilter, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MediaCard, ProjectCard } from '../components/ProjectCard'
import { SearchInput } from '../components/SearchInput'
import { mediaAssets, projects, type Project } from '../data/mockData'
import { loadLocalMvpSession, LOCAL_MVP_SESSION_EVENT, type LocalMvpSession } from '../lib/local-mvp-state'

export function ProjectsPage() {
  const [localSession, setLocalSession] = useState<LocalMvpSession>(() => loadLocalMvpSession())
  const tabs = ['All', 'Draft', 'Planning', 'In review', 'Exported']
  const filters = ['Video', 'Audio', 'Image', 'Shared', 'Credit estimate', 'Approved']
  const localProjects = useMemo<Project[]>(
    () =>
      localSession.projects.map((project) => ({
        accent: project.status === 'preview_ready' ? 'success' : project.status === 'blocked' ? 'danger' : 'cyan',
        editorTo: `/editor?projectId=${project.id}&category=${project.editingCategory}`,
        format: `${project.sourceClips.length || 0} source clip${project.sourceClips.length === 1 ? '' : 's'} / local MVP`,
        owner: localSession.user.displayName,
        progress: project.status === 'preview_ready' ? 100 : project.status === 'mock_running' ? 78 : project.status === 'approved' ? 64 : 28,
        status: localStatusLabel(project.status),
        summary: project.runtime?.events.at(-1) ?? project.warnings[0] ?? 'Local demo project ready for source-order review and planning.',
        tags: ['Local MVP', project.approvals.planApproved ? 'Approved' : 'Planning', project.runtime?.previewReady ? 'Preview ready' : 'Mock runtime'],
        title: project.name,
        updated: `Updated ${new Date(project.updatedAt).toLocaleString()}`,
      })),
    [localSession],
  )
  const allProjects = [...localProjects, ...projects]

  useEffect(() => {
    function refresh() {
      setLocalSession(loadLocalMvpSession())
    }

    window.addEventListener(LOCAL_MVP_SESSION_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LOCAL_MVP_SESSION_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <AppShell description="Organize projects, source media, planning states, status filters, tags, and storage metadata." eyebrow="Projects and media" title="Projects">
      <section className="toolbar-panel">
        <div className="segmented-control" aria-label="Project status filters">
          {tabs.map((tab, index) => (
            <button className={index === 0 ? 'active' : ''} key={tab} type="button">
              {tab}
            </button>
          ))}
        </div>
        <SearchInput placeholder="Search projects and assets" />
        <Button icon={Filter} variant="secondary">
          Filters
        </Button>
        <Button icon={UploadCloud} to="/projects/new" variant="primary">
          Create project and chat
        </Button>
      </section>

      <section className="folder-grid">
        {['Launch videos', 'Course assets', 'Product demos'].map((folder) => (
          <Card className="folder-card" key={folder}>
            <FolderPlus size={22} />
            <h3>{folder}</h3>
            <p>Shared project folder with AI-ready assets and review notes.</p>
          </Card>
        ))}
      </section>

      <section className="project-grid">
        {allProjects.map((project) => (
          <ProjectCard key={`${project.title}-${project.editorTo ?? 'static'}`} project={project} />
        ))}
      </section>

      <section className="projects-support-grid">
        <Card className="upload-placeholder-card">
          <UploadCloud size={26} />
          <h2>Upload placeholder</h2>
          <p>Real upload storage is not connected. Start a mock project, then send clips in source order inside the AI chat editor.</p>
          <Button to="/projects/new" variant="primary">
            Create project and chat
          </Button>
          <Button to="/editor" variant="secondary">
            Open AI chat editor
          </Button>
        </Card>
        <Card className="storage-widget-card">
          <h2>Storage placeholder</h2>
          <p>68% of mock workspace storage used. Future storage must connect to the reeditpro Supabase project.</p>
          <div className="storage-bar" aria-label="Storage 68 percent used">
            <span style={{ width: '68%' }} />
          </div>
          <Badge accent="cyan">Frontend mock</Badge>
        </Card>
      </section>

      <section className="media-library-section" id="media-library">
        <div className="panel-heading">
          <div>
            <span className="section-eyebrow">Media library</span>
            <h2>Assets ready for transcript, overlays, and exports</h2>
          </div>
          <div className="filter-chip-row">
            <Grid3X3 size={17} />
            <ListFilter size={17} />
            {filters.slice(0, 4).map((filter) => (
              <Badge key={filter}>{filter}</Badge>
            ))}
          </div>
        </div>
        <div className="media-grid">
          {mediaAssets.map((asset) => (
            <MediaCard asset={asset} key={asset.name} />
          ))}
        </div>
      </section>

      <Card className="library-empty-state">
        <h2>Empty state example</h2>
        <p>No clips uploaded yet. Send clips in source order inside chat so ReeditPro can understand your raw story.</p>
      </Card>
    </AppShell>
  )
}

function localStatusLabel(status: LocalMvpSession['projects'][number]['status']) {
  const labels: Record<typeof status, string> = {
    approved: 'Plan + credits approved',
    blocked: 'Gate blocked',
    draft: 'Draft local project',
    mock_running: 'Mock job running',
    plan_ready: 'Plan ready',
    planning: 'Planning in chat',
    preview_ready: 'Mock preview ready',
    upload_planned: 'Upload plans ready',
  }

  return labels[status]
}
