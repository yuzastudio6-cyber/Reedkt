import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { CanonicalRevisionPlanBrowserHarness } from './canonical-revision-plan-browser-harness'

let mountedRoot: Root | undefined

export function mountCanonicalRevisionPlanBrowserHarness(): void {
  mountedRoot?.unmount()
  document
    .querySelector('[data-testid="canonical-revision-plan-browser-harness"]')
    ?.remove()
  const container = document.createElement('div')
  container.dataset.testid = 'canonical-revision-plan-browser-harness'
  document.body.append(container)
  mountedRoot = createRoot(container)
  mountedRoot.render(createElement(CanonicalRevisionPlanBrowserHarness))
}
