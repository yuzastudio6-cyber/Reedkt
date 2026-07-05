import { MessageCircle, Plus, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { createProjectHomePath } from '../lib/project-edit-session-navigation'
import { MOCK_PROJECT_HOME_PROJECT_ID } from '../lib/project-edit-session-project-home-ui-adapter'
import { launchEditingCategories } from '../lib/product-taxonomy'
import type { EditingCategory } from '../types/reeditpro'

const categoryDescriptions: Partial<Record<EditingCategory, string>> = {
  storytelling: 'Signature narrative edits with Stroke Motion, still cards, character consistency, and story beats.',
  lifestyle: 'Creator-style edits for day-in-life, travel, fitness, beauty, food, motivation, and casual stories.',
  business_brand: 'Product, service, offer, SaaS, ecommerce, coaching, agency, and brand content.',
  education_explainer: 'Graphic Design / VisualExplain for concepts, diagrams, steps, frameworks, and learning.',
  documentary_case_study: 'Timeline, evidence, scam/fraud, investigation, case study, and what-happened videos.',
}

export function CreateProjectPage() {
  function categoryStartPath(category: EditingCategory) {
    return `${createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID)}?newEdit=1&category=${encodeURIComponent(category)}`
  }

  return (
    <AppShell
      description="Pick a category, create an Edit Chat, then use the Brief tab for browser-local source video review and planning notes."
      eyebrow="New project"
      primaryAction="Start in chat"
      title="Start with a video category"
    >
      <section className="project-start-shell category-first-shell">
        <div className="category-entry-main">
          <Card className="project-start-card">
            <div className="project-start-heading">
              <Badge accent="cyan">Chat-native upload</Badge>
              <h2>Pick a category, then create an Edit Chat</h2>
              <p>
                Pick the type of video you're creating, then open the project-scoped Edit Chat setup. The Brief tab can load a local video
                preview for internal testing without uploading or processing media.
              </p>
              <p>The category gives planning context. It does not force a visual system.</p>
            </div>

            <label className="planning-field">
              <span>Project name</span>
              <input defaultValue="Untitled ReeditPro edit" />
              <small>Optional for this frontend mock. Real project creation is not wired yet.</small>
            </label>
          </Card>

          <div className="category-entry-grid">
            {launchEditingCategories.map((category) => (
              <article className="category-entry-card" key={category.value}>
                <div>
                  <span className="section-eyebrow">{category.label}</span>
                  <h3>{category.label}</h3>
                  <p>{categoryDescriptions[category.value] ?? 'Plan a professional edit from chat context.'}</p>
                </div>
                <small>{category.bestUseCases.slice(0, 5).join(' / ')}</small>
                <Button icon={Plus} to={categoryStartPath(category.value)} variant="primary">
                  Start Edit Chat
                </Button>
              </article>
            ))}
          </div>
        </div>

        <aside className="project-start-side">
          <Card>
            <UploadCloud size={24} />
            <h3>Local video review comes in Brief</h3>
            <p>Create an Edit Chat, open Brief, then select a local browser video preview. No upload, storage write, or media worker starts.</p>
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
