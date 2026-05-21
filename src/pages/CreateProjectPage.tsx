import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Plus, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { createLocalMvpProject } from '../lib/local-mvp-state'
import { launchEditingCategories } from '../lib/product-taxonomy'
import type { EditingCategory } from '../types/reeditpro'

const categoryDescriptions: Record<EditingCategory, string> = {
  storytelling: 'Signature narrative edits with Stroke Motion, still cards, character consistency, and story beats.',
  lifestyle: 'Creator-style edits for day-in-life, travel, fitness, beauty, food, motivation, and casual stories.',
  business_brand: 'Product, service, offer, SaaS, ecommerce, coaching, agency, and brand content.',
  education_explainer: 'Graphic Design / VisualExplain for concepts, diagrams, steps, frameworks, and learning.',
  documentary_case_study: 'Timeline, evidence, scam/fraud, investigation, case study, and what-happened videos.',
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('Untitled ReeditPro edit')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [customInstructions, setCustomInstructions] = useState('')
  const totalFileSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles],
  )

  function handleCreateLocalProject(editingCategory: EditingCategory) {
    const project = createLocalMvpProject({
      customInstructions,
      editingCategory,
      files: selectedFiles,
      name: projectName,
    })

    navigate(`/editor?projectId=${project.id}&category=${editingCategory}`)
  }

  return (
    <AppShell
      description="Pick a category, upload clips, and let ReeditPro ask the rest inside the AI chat editor."
      eyebrow="New project"
      primaryAction="Start in chat"
      title="Start with a video category"
    >
      <section className="project-start-shell category-first-shell">
        <div className="category-entry-main">
          <Card className="project-start-card">
            <div className="project-start-heading">
              <Badge accent="cyan">Chat-native upload</Badge>
              <h2>Pick a category, then upload in chat</h2>
              <p>
                Pick the type of video you're creating, upload clips, then ReeditPro will ask the rest inside chat.
              </p>
              <p>The category gives planning context. It does not force a visual system.</p>
            </div>

            <label className="planning-field">
              <span>Project name</span>
              <input onChange={(event) => setProjectName(event.target.value)} value={projectName} />
              <small>This creates a local demo project in your browser. It does not write to Supabase.</small>
            </label>

            <label className="planning-field">
              <span>Source clips</span>
              <input
                accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aac"
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              <small>
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} selected / ${(totalFileSize / 1_000_000).toFixed(1)} MB metadata planned`
                  : 'Choose local files to create upload plans. No upload happens in this MVP.'}
              </small>
            </label>

            {selectedFiles.length > 0 && (
              <div className="local-upload-file-list">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${index}`}>
                    <strong>{index + 1}. {file.name}</strong>
                    <span>{file.type || 'unknown type'} / {(file.size / 1_000_000).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>
            )}

            <label className="planning-field">
              <span>Custom instructions</span>
              <textarea
                onChange={(event) => setCustomInstructions(event.target.value)}
                placeholder="Tell ReeditPro the goal, tone, platform, reference notes, or anything it should preserve."
                rows={4}
                value={customInstructions}
              />
              <small>These instructions are loaded into the chat editor after project creation.</small>
            </label>
          </Card>

          <div className="category-entry-grid">
            {launchEditingCategories.map((category) => (
              <article className="category-entry-card" key={category.value}>
                <div>
                  <span className="section-eyebrow">{category.label}</span>
                  <h3>{category.label}</h3>
                  <p>{categoryDescriptions[category.value]}</p>
                </div>
                <small>{category.bestUseCases.slice(0, 5).join(' / ')}</small>
                <Button icon={Plus} onClick={() => handleCreateLocalProject(category.value)} variant="primary">
                  Create local project
                </Button>
              </article>
            ))}
          </div>
        </div>

        <aside className="project-start-side">
          <Card>
            <UploadCloud size={24} />
            <h3>Upload comes next</h3>
            <p>Use the plus/upload button to enter the chat editor. This mock uses sample clips instead of a real uploader.</p>
          </Card>
          <Card>
            <MessageCircle size={24} />
            <h3>The chat is the editor</h3>
            <p>Source order, format, edit level, visual preference, reference videos, plans, credits, approval, progress, and preview all happen inside chat.</p>
          </Card>
          <Card>
            <h3>Core rule</h3>
            <p>Plan first. Approve credits. Then the AI edits in the background. This demo does not deduct real credits.</p>
          </Card>
        </aside>
      </section>
    </AppShell>
  )
}
