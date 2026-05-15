import { ArrowRight, Clock, MessageCircle, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MetricCard } from '../components/MetricCard'
import { ProjectCard } from '../components/ProjectCard'
import { EmptyState, ErrorState, LoadingState } from '../components/StateBlocks'
import { activeEdits, activityFeed, aiSuggestions, dashboardInsights, exportQueue, metrics, projects } from '../data/mockData'

export function DashboardPage() {
  return (
    <AppShell
      description="Command center for projects, AI suggestions, visual systems, team updates, and exports."
      eyebrow="Desktop web dashboard"
      title="Welcome back, Tommy"
    >
      <section className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard accent={metric.accent} detail={metric.detail} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main">
          <div className="section-heading compact">
            <span className="section-eyebrow">Featured project</span>
            <h2>Continue the edit plan waiting on approval</h2>
          </div>
          <ProjectCard project={projects[0]} />

          <Card className="suggestion-panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">AI suggestions</span>
                <h2>Plan improvements before spending credits</h2>
              </div>
              <Button icon={ArrowRight} to="/projects/new" variant="secondary">
                Start with chat
              </Button>
            </div>
            {aiSuggestions.map((suggestion) => (
              <div className="suggestion-row" key={suggestion}>
                <MessageCircle size={17} />
                <span>{suggestion}</span>
                <Badge accent="cyan">Preview</Badge>
              </div>
            ))}
          </Card>
        </div>

        <aside className="dashboard-side">
          <Card>
            <div className="panel-heading">
              <h2>Active edits</h2>
              <Badge accent="violet">Live</Badge>
            </div>
            {activeEdits.map((edit) => (
              <div className="activity-row" key={edit.label}>
                <span>{edit.label}</span>
                <small>{edit.time}</small>
              </div>
            ))}
          </Card>

          <Card>
            <div className="panel-heading">
              <h2>Export queue</h2>
              <Badge accent="blue">7 mock jobs</Badge>
            </div>
            {exportQueue.slice(0, 3).map((item) => (
              <div className="activity-row" key={item.title}>
                <span>{item.destination}</span>
                <Badge accent={item.accent}>{item.status}</Badge>
              </div>
            ))}
          </Card>

          <Card>
            <div className="panel-heading">
              <h2>Credit wallet preview</h2>
              <Badge accent="cyan">100 available</Badge>
            </div>
            <p className="feed-item">Personal plan: $10/week software access.</p>
            <p className="feed-item">Weekly bonus credits: 100. Purchased credits: 0.</p>
            <p className="feed-item">Credits are deducted only after approval in production.</p>
            <Button to="/wallet" variant="secondary">
              Open wallet
            </Button>
          </Card>

          <Card>
            <div className="panel-heading">
              <h2>Activity feed</h2>
              <Clock size={17} />
            </div>
            {activityFeed.map((item) => (
              <p className="feed-item" key={item}>{item}</p>
            ))}
          </Card>
        </aside>
      </section>

      <section className="insight-grid">
        {dashboardInsights.map((item) => (
          <Card className="insight-card" key={item.label}>
            <item.icon size={20} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Card>
        ))}
      </section>

      <section className="state-grid">
        <LoadingState />
        <EmptyState />
        <ErrorState />
      </section>

      <div className="quick-action-row">
        <Button icon={UploadCloud} to="/projects/new" variant="primary">
          Create project and chat
        </Button>
        <Button to="/editor" variant="secondary">
          Open AI chat editor
        </Button>
        <Button to="/projects" variant="secondary">
          Browse projects
        </Button>
      </div>
    </AppShell>
  )
}
