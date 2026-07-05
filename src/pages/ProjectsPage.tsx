import { Filter, FolderPlus, Grid3X3, ListFilter, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MediaCard, ProjectCard } from '../components/ProjectCard'
import { SearchInput } from '../components/SearchInput'
import { mediaAssets, projects } from '../data/mockData'
import {
  createProjectEditSessionBriefPath,
  createProjectHomePath,
} from '../lib/project-edit-session-navigation'
import {
  MOCK_PROJECT_HOME_PROJECT_ID,
} from '../lib/project-edit-session-project-home-ui-adapter'

const MOCK_SOURCE_VIDEO_EDIT_SESSION_ID = 'edit-session-youtube-wide'
const mockProjectHomePath = createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID)
const mockSourceVideoBriefPath = createProjectEditSessionBriefPath(
  MOCK_PROJECT_HOME_PROJECT_ID,
  MOCK_SOURCE_VIDEO_EDIT_SESSION_ID,
)

export function ProjectsPage() {
  const tabs = ['All', 'Draft', 'Planning', 'In review', 'Exported']
  const filters = ['Video', 'Audio', 'Image', 'Shared', 'Credit estimate', 'Approved']

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
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </section>

      <section className="projects-support-grid">
        <Card className="upload-placeholder-card" data-testid="projects-source-video-test-card">
          <UploadCloud size={26} />
          <h2>Source video test</h2>
          <p>
            Use Edit Brief to select a browser-local source video, review playback metadata, add markers, and inspect Qwen 3.7 Max readiness
            without starting generation.
          </p>
          <Button to={mockSourceVideoBriefPath} variant="primary">
            Open source video Brief
          </Button>
          <Button to="/projects/new" variant="secondary">
            Create project and chat
          </Button>
          <Button to={mockProjectHomePath} variant="secondary">
            Open Project Home
          </Button>
          <Badge accent="cyan">Local preview only</Badge>
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
