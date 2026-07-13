import {
  ArrowRight,
  Check,
  Coins,
  FileVideo2,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/Button'
import { MarketingNav } from '../components/MarketingNav'
import { signatureSystems } from '../data/productContent'

const workflowSteps = [
  ['01', 'Add source', 'Upload clips in the order you filmed them or let ReeditPro help organize the sequence.'],
  ['02', 'Describe the edit', 'Explain the goal naturally. ReeditPro asks only the questions that change the result.'],
  ['03', 'Review the plan', 'See the story structure, visual systems, timing direction, and estimated credits together.'],
  ['04', 'Approve, then edit', 'Generation starts only after you approve. Preview, revise, and export without leaving the conversation.'],
] as const

const useCases = [
  ['Creator stories', 'Turn a rough talking-head recording into a paced, captioned story without losing the speaker.'],
  ['Product demos', 'Keep required steps clear while ReeditPro adds proof, callouts, and platform-ready structure.'],
  ['Education', 'Translate spoken ideas into readable diagrams, visual cues, and carefully timed explanations.'],
  ['Client work', 'Keep every source, plan, approval, revision, and review tied to one named edit.'],
] as const

export function LandingPage() {
  return (
    <div className="marketing-page">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <MarketingNav />

      <main id="main-content">
        <section className="marketing-hero" id="product">
          <div aria-hidden="true" className="marketing-hero-topology" />
          <div className="marketing-hero-copy">
            <span className="section-eyebrow">Chat-first AI video editing</span>
            <h1>ChatGPT for video editing.</h1>
            <p>Upload your clips, explain the goal, and review a professional edit plan before ReeditPro spends a single credit.</p>
            <div className="marketing-hero-actions">
              <Button icon={Sparkles} to="/projects/new" variant="primary">Start with chat</Button>
              <a className="rp-button rp-button-secondary rp-button-md" href="#workflow">
                <Play aria-hidden="true" size={18} />
                <span>See how it works</span>
              </a>
            </div>
            <ul aria-label="Product principles" className="marketing-hero-principles">
              <li><MessageSquareText aria-hidden="true" size={16} /> Chat is the editor</li>
              <li><ShieldCheck aria-hidden="true" size={16} /> Plan before generation</li>
              <li><Layers3 aria-hidden="true" size={16} /> Pro controls on demand</li>
            </ul>
          </div>

          <div aria-label="ReeditPro chat editor preview" className="marketing-product-demo">
            <header className="marketing-demo-header">
              <div>
                <span className="marketing-demo-back">Project / Founder launch</span>
                <strong>Product story v1</strong>
              </div>
              <span className="marketing-demo-status"><i /> Waiting for approval</span>
            </header>

            <div className="marketing-demo-layout">
              <div className="marketing-demo-chat">
                <div className="marketing-demo-message is-user">
                  Turn these clips into a sharp 45-second launch story. Keep the founder visible and make the proof easy to follow.
                </div>
                <div className="marketing-demo-message is-assistant">
                  <span className="marketing-demo-ai-mark"><Sparkles aria-hidden="true" size={14} /> ReeditPro</span>
                  <p>I found a clean founder-led structure with one VisualExplain proof moment and restrained motion.</p>
                  <div className="marketing-demo-plan">
                    <span><strong>Story</strong> Hook → problem → proof → action</span>
                    <span><strong>Visuals</strong> Speaker-first · 2 controlled overlays</span>
                    <span><strong>Timing</strong> 45 seconds · captions protected</span>
                  </div>
                  <div className="marketing-demo-approval">
                    <span><small>Estimated</small><strong>92 credits</strong></span>
                    <strong>Approve plan</strong>
                  </div>
                </div>
                <div className="marketing-demo-composer">
                  <span>+</span>
                  <p>Ask ReeditPro to edit your video…</p>
                  <span>↑</span>
                </div>
              </div>

              <aside className="marketing-demo-preview">
                <div className="marketing-demo-frame">
                  <FileVideo2 aria-hidden="true" size={24} />
                  <span>Preview appears after approval</span>
                </div>
                <div className="marketing-demo-preview-copy">
                  <span className="section-eyebrow">Current edit</span>
                  <strong>Product story v1</strong>
                  <small>3 source clips · 9:16 output</small>
                </div>
                <dl className="marketing-demo-facts">
                  <div><dt>Source</dt><dd>Ready</dd></div>
                  <div><dt>Plan</dt><dd>Reviewing</dd></div>
                  <div><dt>Editing</dt><dd>Not started</dd></div>
                </dl>
              </aside>
            </div>
          </div>
        </section>

        <section aria-label="ReeditPro trust principles" className="marketing-trust-rail">
          <span><strong>Private by default</strong> Source media stays inside the signed-in workspace.</span>
          <span><strong>Credits stay transparent</strong> Cost is visible before approval.</span>
          <span><strong>Professional at every level</strong> Lower compute never means careless editing.</span>
        </section>

        <section className="marketing-section marketing-workflow" id="workflow">
          <header className="marketing-section-heading">
            <span className="section-eyebrow">One calm workflow</span>
            <h2>From raw clips to a review-ready edit—without learning a timeline first.</h2>
            <p>The intelligence can be deep. The experience stays focused on what ReeditPro understood, what it proposes, and what you need to do next.</p>
          </header>

          <div className="marketing-workflow-layout">
            <ol className="marketing-workflow-steps">
              {workflowSteps.map(([number, title, description]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </li>
              ))}
            </ol>
            <aside className="marketing-workflow-principle">
              <MessageSquareText aria-hidden="true" size={22} />
              <span className="section-eyebrow">Chat first</span>
              <h3>The conversation is the workspace.</h3>
              <p>Edit Brief, Edit Preferences, preview, and an advanced timeline appear only when they help the current decision.</p>
              <div><Check aria-hidden="true" size={15} /> No technical card wall</div>
              <div><Check aria-hidden="true" size={15} /> One clear approval moment</div>
              <div><Check aria-hidden="true" size={15} /> Revisions stay in context</div>
            </aside>
          </div>
        </section>

        <section className="marketing-section marketing-signatures" id="features">
          <header className="marketing-section-heading">
            <span className="section-eyebrow">Signature systems</span>
            <h2>Use the right visual language for each beat—not random effects.</h2>
            <p>ReeditPro routes story, information, motion, and sound deliberately. Every system remains visible in the plan before generation.</p>
          </header>
          <div className="marketing-signature-list">
            {signatureSystems.map((system, index) => {
              const Icon = system.icon
              return (
                <article key={system.title}>
                  <span className="marketing-signature-index">0{index + 1}</span>
                  <Icon aria-hidden="true" size={21} />
                  <h3>{system.title}</h3>
                  <p>{system.description}</p>
                </article>
              )
            })}
          </div>
          <div className="marketing-soundsync-rail">
            <Sparkles aria-hidden="true" size={18} />
            <div><strong>SoundSync supports the whole edit.</strong><span>Music, SFX, ducking, transitions, and beat timing protect speech clarity instead of competing with it.</span></div>
          </div>
        </section>

        <section className="marketing-section marketing-approval-section" id="approval">
          <div className="marketing-approval-copy">
            <Coins aria-hidden="true" size={24} />
            <span className="section-eyebrow">Approval-aware editing</span>
            <h2>Nothing expensive starts behind your back.</h2>
            <p>Review the edit structure, visual systems, timing direction, and credit estimate as one clear decision. Ask for changes or a lower-cost route before approving.</p>
            <Button icon={ArrowRight} to="/projects/new" variant="primary">Start an edit</Button>
          </div>
          <div className="marketing-approval-facts">
            <span><strong>Plan first</strong><small>Understand the edit before generation.</small></span>
            <span><strong>Credits second</strong><small>Approve the exact estimate you reviewed.</small></span>
            <span><strong>Preview next</strong><small>Revise or export from the same conversation.</small></span>
          </div>
        </section>

        <section className="marketing-section marketing-use-cases" id="use-cases">
          <header className="marketing-section-heading">
            <span className="section-eyebrow">Built around intent</span>
            <h2>Different videos deserve different editing strategies.</h2>
          </header>
          <div className="marketing-use-case-grid">
            {useCases.map(([title, description]) => (
              <article key={title}><Check aria-hidden="true" size={16} /><div><h3>{title}</h3><p>{description}</p></div></article>
            ))}
          </div>
        </section>

        <section className="marketing-section marketing-final" id="security">
          <div className="marketing-final-security">
            <LockKeyhole aria-hidden="true" size={22} />
            <div><span className="section-eyebrow">Private workspace</span><h2>Your source, decisions, and reviews stay attached to the edit.</h2></div>
          </div>
          <p>ReeditPro keeps the normal user experience calm while technical readiness and internal diagnostics remain outside the creative workflow.</p>
          <div className="marketing-final-actions">
            <Button icon={Sparkles} to="/projects/new" variant="primary">Start with chat</Button>
            <Button to="/sign-in" variant="ghost">Open workspace</Button>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <span>ReeditPro</span>
        <span>Plan first. Approve credits. Then edit.</span>
      </footer>
    </div>
  )
}
