import { CloudUpload, Download, Share2 } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ExportQueueCard } from '../components/ExportQueueCard'
import { exportQueue } from '../data/mockData'

export function ExportQueuePage() {
  return (
    <AppShell description="Placeholder export queue for platform presets, render status, source-file errors, client previews, and share links." eyebrow="Export Queue" title="Exports">
      <section className="export-summary-grid">
        <Card className="export-summary-card">
          <CloudUpload size={24} />
          <h2>4 exports tracked</h2>
          <p>Rendering, queued, ready, and failed states are represented for later backend integration.</p>
        </Card>
        <Card className="export-summary-card">
          <Download size={24} />
          <h2>Platform presets</h2>
          <p>YouTube, Shorts, Reels, TikTok, client preview, caption burn-in, and clean audio stems.</p>
        </Card>
        <Card className="export-summary-card">
          <Share2 size={24} />
          <h2>Review links later</h2>
          <p>Share links, team approval, and storage delivery remain mocked in this frontend phase.</p>
        </Card>
      </section>

      <section className="export-list">
        <div className="panel-heading">
          <div>
            <span className="section-eyebrow">Render status</span>
            <h2>Export queue placeholder</h2>
          </div>
          <Badge accent="cyan">Static data</Badge>
        </div>
        {exportQueue.map((item) => (
          <ExportQueueCard item={item} key={`${item.title}-${item.destination}`} />
        ))}
      </section>
    </AppShell>
  )
}
