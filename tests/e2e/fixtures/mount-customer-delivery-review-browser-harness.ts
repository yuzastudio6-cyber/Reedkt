import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import {
  CustomerDeliveryReviewBrowserHarness,
} from './customer-delivery-review-browser-harness'

let mountedRoot: Root | undefined

export function mountCustomerDeliveryReviewBrowserHarness(): void {
  mountedRoot?.unmount()
  document
    .querySelector('[data-testid="customer-delivery-review-browser-harness"]')
    ?.remove()
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  mountedRoot = createRoot(container)
  mountedRoot.render(createElement(CustomerDeliveryReviewBrowserHarness))
}
