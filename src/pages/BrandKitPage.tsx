import { BriefcaseBusiness, Palette, Sparkles } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { brandKitFields } from '../data/mockData'

export function BrandKitPage() {
  return (
    <AppShell description="Business Brand Kit placeholder for logos, fonts, colors, captions, visual system preferences, and export defaults." eyebrow="Business Brand Kit" title="Brand Kit placeholder">
      <section className="brand-kit-hero">
        <Card className="brand-preview-card">
          <BriefcaseBusiness size={28} />
          <h2>Business brand system</h2>
          <p>Future backend integration will save brand assets and apply them to captions, overlays, Stroke Motion, VisualExplain, Real Motion, and export presets.</p>
          <div className="brand-swatches" aria-label="Brand color swatches">
            <span />
            <span />
            <span />
            <span />
          </div>
          <Button icon={Palette} variant="primary">
            Configure brand
          </Button>
        </Card>
        <Card className="brand-rules-card">
          <div className="panel-heading">
            <h2>AI influence</h2>
            <Badge accent="violet">Placeholder</Badge>
          </div>
          <p>Brand Kit should influence caption style, lower thirds, motion intensity, graphic overlays, Real Motion realism, soundtrack mood, and export presets.</p>
          <Button icon={Sparkles} variant="secondary">
            Preview branded edit
          </Button>
        </Card>
      </section>

      <section className="brand-field-grid">
        {brandKitFields.map((field) => (
          <Card className="brand-field-card" key={field.label}>
            <field.icon size={20} />
            <h3>{field.label}</h3>
            <Badge>{field.status}</Badge>
          </Card>
        ))}
      </section>
    </AppShell>
  )
}
