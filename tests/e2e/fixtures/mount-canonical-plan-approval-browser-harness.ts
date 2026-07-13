import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { CanonicalPlanApprovalBrowserHarness } from './canonical-plan-approval-browser-harness'

let mountedRoot: Root | undefined

export function mountCanonicalPlanApprovalBrowserHarness(): void {
  mountedRoot?.unmount()
  document.querySelector('[data-testid="canonical-approval-browser-harness"]')?.remove()
  const container = document.createElement('div')
  container.dataset.testid = 'canonical-approval-browser-harness'
  document.body.append(container)
  mountedRoot = createRoot(container)
  mountedRoot.render(createElement(CanonicalPlanApprovalBrowserHarness))
}
