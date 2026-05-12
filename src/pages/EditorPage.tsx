import { Captions, Download, Layers3, RotateCcw, Scissors, SlidersHorizontal } from 'lucide-react'
import { AIChatPanel } from '../components/AIChatPanel'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { SignatureSystemPanel, SoundSyncSupportPanel } from '../components/SignatureSystemPanel'
import { Timeline } from '../components/Timeline'
import { VideoPreview } from '../components/VideoPreview'
import { signatureSystems, storyBeats } from '../data/mockData'

export function EditorPage() {
  return (
    <AppShell description="Full desktop workspace for AI chat editing, video preview, visual layers, StoryTiming, SoundSync support, and export settings." eyebrow="AI Editor workspace" title="Founder story launch cut">
      <section className="editor-layout">
        <aside className="scene-list">
          <div className="panel-heading">
            <h2>Scenes</h2>
            <Badge accent="cyan">6 beats</Badge>
          </div>
          {storyBeats.map((beat) => (
            <button className={beat.state === 'active' ? 'active' : ''} key={beat.label} type="button">
              <span>{beat.time}</span>
              <strong>{beat.label}</strong>
              <small>{beat.state}</small>
            </button>
          ))}
        </aside>

        <div className="editor-center">
          <div className="editor-toolbar">
            {[
              { label: 'Preview', icon: Layers3 },
              { label: 'Split', icon: Scissors },
              { label: 'Captions', icon: Captions },
              { label: 'Adjust', icon: SlidersHorizontal },
              { label: 'Regenerate', icon: RotateCcw },
            ].map((tool) => (
              <Button icon={tool.icon} key={tool.label} size="sm" variant="secondary">
                {tool.label}
              </Button>
            ))}
          </div>
          <VideoPreview />
          <Timeline />
        </div>

        <AIChatPanel />
      </section>

      <section className="signature-grid">
        {signatureSystems.map((system) => (
          <SignatureSystemPanel key={system.title} system={system} />
        ))}
        <SoundSyncSupportPanel />
      </section>

      <section className="editor-settings-grid">
        <Card>
          <div className="panel-heading">
            <h2>Captions panel</h2>
            <Badge accent="blue">Editable</Badge>
          </div>
          <p>Word-level captions stay aligned with visual overlays and avoid collisions with product proof graphics.</p>
        </Card>
        <Card>
          <div className="panel-heading">
            <h2>Export settings</h2>
            <Badge accent="success">Ready</Badge>
          </div>
          <p>Prepare 16:9 master, 9:16 social cut, 1:1 preview, captions, and clean audio stems.</p>
          <Button icon={Download} variant="primary">
            Queue export
          </Button>
        </Card>
      </section>
    </AppShell>
  )
}
