import { Mic2, Music2, Play, ShieldCheck, SplitSquareHorizontal, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { callReeditProApi } from '../../backend/api'
import {
  DEEPFILTERNET_VOICE_CLEANUP_ACTIONS,
  DEMUCS_AUDIO_SEPARATION_ACTIONS,
  getAudioSeparationRightsNotice,
  type AudioSeparationJob,
  type AudioSeparationMode,
} from '../../backend/audio-separation'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import './AudioSeparationPanel.css'

const separationModes: Array<{
  mode: AudioSeparationMode
  label: string
  description: string
}> = [
  {
    mode: 'vocals',
    label: 'Separate Vocals',
    description: 'Create vocal and no-vocals stems for review.',
  },
  {
    mode: 'instrumental',
    label: 'Create Instrumental',
    description: 'Prepare an instrumental/no-background-music stem.',
  },
  {
    mode: 'stems-4',
    label: 'Split Stems',
    description: 'Separate vocals, drums, bass, and other stems.',
  },
]

export function AudioSeparationPanel() {
  const [selectedMode, setSelectedMode] = useState<AudioSeparationMode>('vocals')
  const [job, setJob] = useState<AudioSeparationJob | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  async function createJob() {
    setLoading(true)
    setError(undefined)
    const response = await callReeditProApi<
      {
        mode: AudioSeparationMode
        engine: 'demucs'
        workspaceId: string
        projectId: string
        mediaAssetId: string
      },
      AudioSeparationJob
    >('audio.separation.job.create', {
      mode: selectedMode,
      engine: 'demucs',
      workspaceId: 'mock-workspace',
      projectId: 'mock-project',
      mediaAssetId: 'demo-audio-separation-source',
    })
    setLoading(false)
    if (!response.ok || !response.data) {
      setError(response.error?.message ?? 'Audio separation job could not be created.')
      return
    }
    setJob(response.data)
  }

  return (
    <section className="audio-feature-shell">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">Audio AI tools</span>
          <h2>Voice cleanup and stem separation</h2>
        </div>
        <Badge accent="cyan">
          <ShieldCheck size={14} /> Manifest gated
        </Badge>
      </div>

      <div className="audio-feature-grid">
        <Card className="audio-tool-section audio-tool-section-cleanup">
          <div className="audio-tool-header">
            <span className="audio-tool-icon"><Mic2 size={20} /></span>
            <div>
              <span className="section-eyebrow">Voice Cleanup / DeepFilterNet</span>
              <h3>Speech cleanup</h3>
            </div>
          </div>
          <div className="audio-tool-action-grid">
            {DEEPFILTERNET_VOICE_CLEANUP_ACTIONS.map((action) => (
              <span className="audio-tool-action" key={action}>
                <Wand2 size={14} />
                {action}
              </span>
            ))}
          </div>
          <p className="audio-tool-policy">DeepFilterNet owns denoise and voice cleanup. Demucs is never used for speech enhancement.</p>
        </Card>

        <Card className="audio-tool-section audio-tool-section-separation">
          <div className="audio-tool-header">
            <span className="audio-tool-icon"><Music2 size={20} /></span>
            <div>
              <span className="section-eyebrow">Vocal & Music Separation / Demucs</span>
              <h3>Stem separation</h3>
            </div>
          </div>
          <div className="audio-tool-action-grid">
            {DEMUCS_AUDIO_SEPARATION_ACTIONS.map((action) => (
              <span className="audio-tool-action" key={action}>
                <SplitSquareHorizontal size={14} />
                {action}
              </span>
            ))}
          </div>

          <div className="audio-separation-mode-list" role="group" aria-label="Demucs separation mode">
            {separationModes.map((option) => (
              <button
                className={option.mode === selectedMode ? 'audio-separation-mode audio-separation-mode-active' : 'audio-separation-mode'}
                key={option.mode}
                onClick={() => setSelectedMode(option.mode)}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>

          <Button disabled={loading} icon={Play} onClick={createJob} variant="primary">
            {loading ? 'Creating job' : 'Create mock stem job'}
          </Button>
          {error && <p className="audio-feature-error">{error}</p>}
        </Card>
      </div>

      {job && (
        <Card className="audio-stem-preview-panel">
          <div className="panel-heading">
            <div>
              <span className="section-eyebrow">Mock Demucs job</span>
              <h3>{job.jobId}</h3>
            </div>
            <Badge accent="success">{job.status}</Badge>
          </div>
          <div className="audio-stem-grid">
            {job.stems.map((stem) => (
              <article className="audio-stem-item" key={stem.stemId}>
                <strong>{stem.label}</strong>
                <span>{stem.storageObjectPath}</span>
                <div className="audio-stem-actions">
                  <button type="button">Preview</button>
                  <button type="button">Download</button>
                </div>
              </article>
            ))}
          </div>
          <p className="audio-tool-policy">Runtime downloads are disabled. Non-mock Demucs runs require a valid approved model artifact and checksum manifest.</p>
        </Card>
      )}

      <p className="audio-rights-notice">{getAudioSeparationRightsNotice()}</p>
    </section>
  )
}
