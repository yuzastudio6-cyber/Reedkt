import { Badge } from '../Badge'
import type { BrowserCapturePlanItem, EditPlan } from '../../types/reeditpro'

type InlineBrowserCapturePlanCardProps = {
  plan: EditPlan
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function BadgeRow({ item }: { item: BrowserCapturePlanItem }) {
  const badges = [
    item.toolIds.includes('playwright') ? 'Playwright planned' : '',
    item.toolIds.includes('sharp') ? 'Sharp planned' : '',
    item.toolIds.includes('remotion') ? 'Remotion composed' : '',
    'No real browser access',
    item.source.sourceNeeded ? 'Source needed' : '',
    item.source.permissionStatus === 'user_provided' ? 'User-provided source' : '',
    item.source.evidenceStatus === 'mock_example' || item.source.mockOnly ? 'Mock/example page' : '',
    item.redaction.redactionNeeded ? 'Redaction planned' : '',
    item.redaction.privacyRisk !== 'none' ? `Privacy risk: ${item.redaction.privacyRisk}` : '',
    'Controlled capture, not AI video',
  ].filter(Boolean)

  return (
    <div className="browser-plan-meta">
      {badges.map((badge) => (
        <span
          className={
            badge.includes('Privacy')
              ? 'browser-privacy-risk-badge'
              : badge.includes('Redaction')
                ? 'browser-redaction-badge'
                : badge.includes('Source needed')
                  ? 'browser-source-needed-badge'
                  : badge.includes('User-provided')
                    ? 'browser-permission-badge'
                    : 'browser-tool-badge'
          }
          key={badge}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

function SummaryBlock({ label: blockLabel, children }: { label: string; children: string }) {
  return (
    <div>
      <strong>{blockLabel}</strong>
      <p>{children}</p>
    </div>
  )
}

function ListBlock({ label: blockLabel, items }: { label: string; items: string[] }) {
  return (
    <div>
      <strong>{blockLabel}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function InlineBrowserCapturePlanCard({ plan }: InlineBrowserCapturePlanCardProps) {
  const browserPlan = plan.browserCapturePlan

  if (!browserPlan) {
    return null
  }

  return (
    <section className="inline-chat-card browser-capture-plan-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Browser/app visuals</span>
          <h3>Browser/app visual plan</h3>
        </div>
        <Badge accent={browserPlan.active ? 'cyan' : 'muted'}>{browserPlan.active ? 'Active' : 'Inactive'}</Badge>
      </div>

      <p className="inline-helper">
        ReeditPro uses controlled browser/app capture planning for websites, dashboards, product pages, articles, and UI walkthroughs. This is planning only; no browser tools run in this demo.
      </p>

      <div className="browser-plan-summary-grid">
        <SummaryBlock label="Summary" >{browserPlan.summary}</SummaryBlock>
        <SummaryBlock label="Items" >{`${browserPlan.items.length} planned item${browserPlan.items.length === 1 ? '' : 's'}`}</SummaryBlock>
        <SummaryBlock label="Tools" >{browserPlan.browserToolsPlanned.length ? browserPlan.browserToolsPlanned.join(', ') : 'none planned'}</SummaryBlock>
        <SummaryBlock label="Execution" >No browser access, scraping, capture, provider calls, or rendering in this frontend demo.</SummaryBlock>
      </div>

      <div className="browser-controlled-tool-note">Controlled capture planning, not AI-video invention.</div>
      <div className="browser-no-access-note">No Playwright installation, browser execution, website access, scraping, or screenshot capture has been run.</div>

      {browserPlan.globalRules.length > 0 && <ListBlock label="Global rules" items={browserPlan.globalRules} />}
      {browserPlan.limitations.length > 0 && <ListBlock label="Limitations" items={browserPlan.limitations} />}

      {browserPlan.items.map((item) => (
        <details className="browser-plan-item" key={item.id} open>
          <summary>
            <span>{item.title}</span>
            <Badge accent="blue">{label(item.browserVisualType)}</Badge>
          </summary>

          <BadgeRow item={item} />

          <div className="browser-plan-summary-grid">
            <SummaryBlock label="Purpose" >{item.purpose}</SummaryBlock>
            <SummaryBlock label="Reason" >{item.reason}</SummaryBlock>
          </div>

          <div className="browser-source-summary">
            <SummaryBlock label="Source type" >{label(item.source.sourceType)}</SummaryBlock>
            <SummaryBlock label="Permission" >{label(item.source.permissionStatus)}</SummaryBlock>
            <SummaryBlock label="Evidence status" >{label(item.source.evidenceStatus)}</SummaryBlock>
            <SummaryBlock label="Safe wording" >{item.source.safeWording}</SummaryBlock>
          </div>

          <div className="browser-capture-summary">
            <SummaryBlock label="Capture mode" >{label(item.capture.captureMode)}</SummaryBlock>
            <SummaryBlock label="Viewport" >{`${item.capture.viewportWidth} x ${item.capture.viewportHeight} @${item.capture.deviceScaleFactor}x`}</SummaryBlock>
            <SummaryBlock label="Frame style" >{label(item.frameStyle.styleFamily)}</SummaryBlock>
            <SummaryBlock label="Theme" >{item.frameStyle.theme}</SummaryBlock>
          </div>

          <div className="browser-highlight-summary">
            <SummaryBlock label="Highlight" >{label(item.highlight.highlightStyle)}</SummaryBlock>
            <SummaryBlock label="Annotation" >{item.highlight.annotationStyle}</SummaryBlock>
            <SummaryBlock label="Cursor" >{item.highlight.cursorMotion ? 'planned' : 'not planned'}</SummaryBlock>
            <SummaryBlock label="Click pulse" >{item.highlight.clickPulse ? 'planned' : 'not planned'}</SummaryBlock>
          </div>

          <div className="browser-redaction-summary">
            <SummaryBlock label="Privacy risk" >{item.redaction.privacyRisk}</SummaryBlock>
            <SummaryBlock label="Redaction" >{item.redaction.redactionNeeded ? label(item.redaction.redactionStyle) : 'not needed in mock plan'}</SummaryBlock>
            <SummaryBlock label="User confirmation" >{item.redaction.userConfirmationRequired ? 'required' : 'not required'}</SummaryBlock>
            <SummaryBlock label="Targets" >{item.redaction.redactionTargets.length ? item.redaction.redactionTargets.join(', ') : 'none'}</SummaryBlock>
          </div>

          <div className="browser-layout-summary">
            <SummaryBlock label="Layout" >{label(item.layout.layoutMode)}</SummaryBlock>
            <SummaryBlock label="Template" >{label(item.layout.frameTemplateType)}</SummaryBlock>
            <SummaryBlock label="Tool chain" >{label(item.toolChain)}</SummaryBlock>
            <SummaryBlock label="Credit impact" >{item.creditImpact}</SummaryBlock>
          </div>

          <div className="browser-plan-summary-grid">
            <SummaryBlock label="Tier allowed" >{`Basic: ${item.tierAllowed.basic ? 'yes' : 'no'} / Pro: ${item.tierAllowed.pro ? 'yes' : 'no'} / Premium: ${item.tierAllowed.premium ? 'yes' : 'no'}`}</SummaryBlock>
            <SummaryBlock label="Why not AI video" >{item.whyNotAiVideo}</SummaryBlock>
          </div>

          <ListBlock label="Fallback strategy" items={item.fallbackStrategy} />
          <ListBlock label="QA checks" items={item.qaChecks} />
          <ListBlock label="Worker notes" items={item.workerNotes} />
          <ListBlock label="Remotion capabilities" items={item.remotionCapabilities.map(label)} />
        </details>
      ))}
    </section>
  )
}
