import assert from 'node:assert/strict'

import { isCanonicalStructuredSvgSafe } from '../services/canonical-structured-svg-safety-policy'

const safeCases = [
  '<svg xmlns="http://www.w3.org/2000/svg"><text>Evidence</text></svg>',
  '<svg><defs><clipPath id="clip_1"><rect width="10" height="10"/></clipPath></defs><g clip-path="url(#clip_1)"><text>Evidence</text></g></svg>',
  '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="path-1" d="M0 0L1 1"/></defs><use href="#path-1"/><use xlink:href="#path-1"/></svg>',
]
const unsafeCases = [
  '<svg><script>throw new Error()</script></svg>',
  '<svg><foreignObject><div>unsafe</div></foreignObject></svg>',
  '<svg><text onload="run()">unsafe</text></svg>',
  '<svg><use href="https://example.invalid/asset.svg#shape"/></svg>',
  '<svg><use href="data:image/svg+xml;base64,AAAA"/></svg>',
  '<svg><use href="javascript:run()"/></svg>',
  '<svg><use href="relative-file.svg#shape"/></svg>',
  '<svg><use href=relative-file.svg#shape/></svg>',
  '<svg><rect fill="url(https://example.invalid/gradient.svg#g)"/></svg>',
]

for (const svg of safeCases) assert.equal(isCanonicalStructuredSvgSafe(svg), true)
for (const svg of unsafeCases) assert.equal(isCanonicalStructuredSvgSafe(svg), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'local_fragment_href_and_xlink_href_allowed',
    'local_fragment_css_url_allowed',
    'scripts_foreign_objects_and_event_handlers_rejected',
    'external_data_javascript_relative_and_unquoted_references_rejected',
  ],
}))
