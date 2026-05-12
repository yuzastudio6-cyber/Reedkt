import { CheckCircle2, Database, FileVideo, ShieldCheck } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { MediaCard } from '../components/ProjectCard'
import { UploadDropzone } from '../components/UploadDropzone'
import { mediaAssets } from '../data/mockData'

export function UploadPage() {
  return (
    <AppShell description="Prepare media for AI transcript analysis, visual system suggestions, timing, and export presets." eyebrow="Media upload" title="Upload media">
      <UploadDropzone />

      <section className="upload-grid">
        <Card className="upload-info-card">
          <FileVideo size={24} />
          <h2>Accepted sources</h2>
          <p>Video, audio, images, product footage, b-roll, screenshots, and brand assets for future Brand Kit matching.</p>
        </Card>
        <Card className="upload-info-card">
          <Database size={24} />
          <h2>Metadata prepared</h2>
          <p>Duration, resolution, frame rate, transcript, scene boundaries, objects, emotions, and platform target.</p>
        </Card>
        <Card className="upload-info-card">
          <ShieldCheck size={24} />
          <h2>Backend later</h2>
          <p>Storage and database integration are placeholders. Future Supabase work must use the reeditpro project.</p>
        </Card>
      </section>

      <section className="media-library-section">
        <div className="panel-heading">
          <div>
            <span className="section-eyebrow">Recently uploaded</span>
            <h2>Mock media queue</h2>
          </div>
          <Badge accent="success">
            <CheckCircle2 size={14} /> Ready
          </Badge>
        </div>
        <div className="media-grid">
          {mediaAssets.map((asset) => (
            <MediaCard asset={asset} key={asset.name} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
