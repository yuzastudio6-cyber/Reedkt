import { ArrowRight, CheckCircle2, Coins, Lock, Play, ShieldCheck, Sparkles } from 'lucide-react'
import { featureCards, signatureSystems } from '../data/mockData'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { MarketingNav } from '../components/MarketingNav'

export function LandingPage() {
  return (
    <div className="marketing-page">
      <MarketingNav />
      <section className="hero-section">
        <div className="hero-background" aria-hidden="true">
          <div className="hero-timeline" />
          <div className="hero-grid-plane" />
          <div className="hero-waveform" />
        </div>
        <div className="hero-content">
          <Badge accent="cyan">AI editing, reimagined</Badge>
          <h1>AI-powered editing. Like ChatGPT for video.</h1>
          <p>Upload your clips, explain the idea, and ReeditPro plans the edit before spending credits.</p>
          <div className="hero-actions">
            <Button icon={Sparkles} to="/projects/new" variant="primary">
              Start editing
            </Button>
            <Button icon={Play} to="/pricing" variant="secondary">
              See pricing
            </Button>
          </div>
        </div>
        <div className="hero-product" id="product">
          <div className="mock-editor-window">
            <div className="mock-window-top">
              <span />
              <span />
              <span />
              <strong>Founder story edit</strong>
            </div>
            <div className="mock-editor-grid">
              <div className="mock-scene-list">
                <span>Scene 01</span>
                <span className="active">Story beat</span>
                <span>Proof moment</span>
              </div>
              <div className="mock-video">
                <div className="mock-speaker" />
                <div className="mock-overlay-card">VisualExplain framework</div>
                <div className="mock-real-motion">Real Motion proof</div>
              </div>
              <div className="mock-chat">
                <strong>ReeditPro AI</strong>
                <p>Plan ready: approve the edit strategy and 92-credit estimate before generation.</p>
              </div>
            </div>
            <div className="mock-timeline">
              <span className="track-cyan" />
              <span className="track-violet" />
              <span className="track-blue" />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section trust-strip">
        {['Creators', 'Studios', 'Educators', 'Agencies', 'Product teams'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </section>

      <section className="landing-section" id="features">
        <div className="section-heading">
          <span className="section-eyebrow">Web-first editing system</span>
          <h2>A premium creative operating system for planned AI edits.</h2>
          <p>Upload clips in order, let AI map the story, review the plan, approve credits, then open the desktop editor shell.</p>
        </div>
        <div className="feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon
            return (
              <Card className={`feature-card feature-${feature.accent}`} key={feature.title}>
                <Icon aria-hidden="true" size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="landing-section signature-band">
        <div className="section-heading">
          <span className="section-eyebrow">Signature visual systems</span>
          <h2>Three visual engines, one timing brain.</h2>
          <p>SoundSync supports the edit with music, SFX, ducking, and beat timing while visual systems stay in control of what appears on video.</p>
        </div>
        <div className="signature-marketing-grid">
          {signatureSystems.map((system) => {
            const Icon = system.icon
            return (
              <article className={`signature-marketing-card signature-${system.accent}`} key={system.title}>
                <Icon aria-hidden="true" size={24} />
                <span>{system.subtitle}</span>
                <h3>{system.title}</h3>
                <p>{system.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="landing-section how-it-works-grid">
        {[
          ['1', 'Upload clips in order', 'Source order tells ReeditPro how the footage was filmed or how you believe it belongs.'],
          ['2', 'AI creates an edit plan', 'The planner maps source sequence, recommended structure, Reference DNA, StoryTiming, and visual routing.'],
          ['3', 'Approve before generation', 'ReeditPro shows a credit estimate first. No expensive AI generation starts until you approve.'],
        ].map(([number, title, text]) => (
          <article key={title}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="landing-section credit-model-band">
        <Coins size={26} />
        <div>
          <span className="section-eyebrow">Credit-aware editing</span>
          <h2>Subscription gives software access. Edit Credits pay for AI generation.</h2>
          <p>Personal is $10/week with 100 weekly bonus credits. Business is $20/week for stronger brand, team, and client workflows. ReeditPro does not offer unlimited AI editing for one flat weekly price.</p>
        </div>
      </section>

      <section className="landing-section use-case-grid" id="use-cases">
        {['Founder stories', 'Course lessons', 'Product demos', 'Podcast clips'].map((useCase) => (
          <article key={useCase}>
            <CheckCircle2 size={18} />
            <h3>{useCase}</h3>
            <p>AI maps the spoken idea to cuts, overlays, timing, captions, and export format.</p>
          </article>
        ))}
      </section>

      <section className="landing-section pricing-preview">
        <div>
          <span className="section-eyebrow">Plans</span>
          <h2>Personal and Business access, with credits estimated before generation.</h2>
          <p>Credits are deducted only after approval in production. This MVP keeps pricing and payments mocked.</p>
        </div>
        <Button icon={ArrowRight} to="/pricing" variant="primary">
          View pricing
        </Button>
      </section>

      <section className="landing-section security-strip" id="security">
        <ShieldCheck size={24} />
        <div>
          <h2>Built for private source media and review-ready exports.</h2>
          <p>Backend, auth, storage, billing, and Supabase integration are intentionally deferred. Future backend work must use the reeditpro Supabase project.</p>
        </div>
        <Lock size={22} />
      </section>

      <footer className="marketing-footer">
        <span>ReeditPro</span>
        <span>AI editing that understands your story.</span>
      </footer>
    </div>
  )
}
