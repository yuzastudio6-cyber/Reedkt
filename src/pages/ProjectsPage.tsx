import { Filter, FolderPlus, Grid3X3, ListFilter, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MediaCard, ProjectCard } from '../components/ProjectCard'
import { SearchInput } from '../components/SearchInput'
import { mediaAssets, projects } from '../data/mockData'

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
