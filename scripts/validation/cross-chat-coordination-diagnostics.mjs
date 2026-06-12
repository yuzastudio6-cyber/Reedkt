import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/cross-chat/README.md',
  'docs/cross-chat/chat-ownership-registry.md',
  'docs/cross-chat/workstream-status-ledger.md',
  'docs/cross-chat/integration-boundary-map.md',
  'docs/cross-chat/capability-handoff-contract.md',
  'docs/cross-chat/duplicate-work-prevention-policy.md',
  'docs/cross-chat/prompt-start-checklist.md',
  'docs/cross-chat/prompt-final-response-standard.md',
  'docs/cross-chat/open-dependencies-and-blockers.md',
  'docs/cross-chat/reeditpro-end-to-end-system-map.md',
  'docs/cross-chat/ai-tools-creative-graphics-ownership.md',
  'docs/cross-chat/map-stack-boundary-note.md',
  'docs/implementation-prompts/prompt-xchat-0-cross-chat-ownership-registry.md',
]

const trackerDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
]

const requiredWorkstreams = [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'MAP_GEOSPATIAL',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'COMPLIANCE_SECURITY',
  'OBSERVABILITY_AUDIT_COST',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
  'E2E_BETA_DEPLOYMENT',
]

const aiTools = [
  'Remotion',
  'D3.js',
  'Three.js',
  'PixiJS',
  'Anime.js',
  'Lottie-web',
  'SVG.js',
  'Apache ECharts',
  'Vega / Vega-Lite',
  'Viz.js / Graphviz',
  'Satori',
  '@resvg/resvg-js',
]

const requiredNoScope = 'No runtime implementation, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, render/export execution, tool execution, worker execution, media processing, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, production/beta unlock, dependency mutation, human approval grant, staging execution approval, or broad service-role handler was enabled.'

const unsafePositivePatterns = [
  /\bproduction capability enabled:\s*(?!none\b)/i,
  /\bproduction ready:\s*true\b/i,
  /\bexternal beta(?: ready| allowed| enabled)?:\s*true\b/i,
  /\bpaid production(?: ready| allowed| enabled)?:\s*true\b/i,
  /\bbroad media(?: ready| allowed| enabled)?:\s*true\b/i,
  /\bpublic artifacts? enabled\b/i,
  /\bsigned urls? as source of truth\b/i,
  /\bruntime implementation enabled\b/i,
  /\btool execution enabled\b/i,
  /\bworker execution enabled\b/i,
  /\bprovider calls? enabled\b/i,
  /\bSupabase mutation enabled\b/i,
  /\bSQL execution enabled\b/i,
]

const safeContextPattern = /\b(no|none|not|never|blocked|must not|do not|does not|did not|docs_only|docs-only|planning-only|coordination|source of truth|checklist|standard|question|required|final response)\b/i

function resolvePath(relativePath) {
  return path.join(root, relativePath)
}

function exists(relativePath) {
  return fs.existsSync(resolvePath(relativePath))
}

function read(relativePath) {
  return exists(relativePath) ? fs.readFileSync(resolvePath(relativePath), 'utf8') : ''
}

function pushMissing(failures, file, term) {
  failures.push(`${file} missing required term: ${term}`)
}

function requireTerms(failures, file, terms) {
  const content = read(file)
  for (const term of terms) {
    if (!content.includes(term)) pushMissing(failures, file, term)
  }
}

function scanUnsafeClaims(files) {
  const findings = []
  for (const file of files) {
    const content = read(file)
    content.split('\n').forEach((line, index) => {
      if (safeContextPattern.test(line)) return
      for (const pattern of unsafePositivePatterns) {
        if (pattern.test(line)) {
          findings.push(`${file}:${index + 1}: ${line.trim()}`)
        }
      }
    })
  }
  return findings
}

function main() {
  const failures = []
  const warnings = []

  for (const file of [...requiredDocs, ...trackerDocs]) {
    if (!exists(file)) failures.push(`Missing required file: ${file}`)
  }

  requireTerms(failures, 'docs/cross-chat/README.md', [
    'Direct chat-to-chat communication is not assumed',
    'No duplicate implementation',
    'Production capability enabled: none.',
  ])

  for (const id of requiredWorkstreams) {
    requireTerms(failures, 'docs/cross-chat/chat-ownership-registry.md', [id])
  }

  requireTerms(failures, 'docs/cross-chat/ai-tools-creative-graphics-ownership.md', aiTools)
  requireTerms(failures, 'docs/cross-chat/ai-tools-creative-graphics-ownership.md', [
    'Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit',
    'Map/geospatial tools and runtime.',
    'Sharp/libvips-style processing.',
  ])

  requireTerms(failures, 'docs/cross-chat/map-stack-boundary-note.md', [
    'Map/geospatial ownership belongs to another chat.',
    'must not claim ownership',
    'MapLibre',
    'Turf',
    'deck.gl',
    'CesiumJS',
  ])

  requireTerms(failures, 'docs/cross-chat/prompt-start-checklist.md', [
    'Workstream owner',
    'Cross-chat boundaries checked',
    'Duplicate-risk check',
    'Supabase update classification',
    'GCP Secret Manager rule',
    'Final handoff expected',
  ])

  requireTerms(failures, 'docs/cross-chat/prompt-final-response-standard.md', [
    'Branch.',
    'PR.',
    'Validation.',
    'Production capability enabled.',
    'Supabase update required/status.',
    requiredNoScope,
  ])

  requireTerms(failures, 'docs/cross-chat/duplicate-work-prevention-policy.md', [
    'Every prompt must check',
    'No route, service, schema, table, worker, provider adapter, tool contract, UI integration, or status ledger may be duplicated',
    'Conflicts create a coordination prompt',
  ])

  requireTerms(failures, 'docs/cross-chat/integration-boundary-map.md', [
    'AI Tools to Track A',
    'AI Tools to Track B',
    'AI Tools to Provider Gateway',
    'AI Tools to Worker Runtime',
    'AI Tools to Supabase',
    'Map stack to AI Tools',
  ])

  requireTerms(failures, 'docs/implementation-prompts/prompt-xchat-0-cross-chat-ownership-registry.md', [
    'PROMPT XCHAT-0',
    'codex/rp-foundation-xchat-0-cross-chat-ownership-registry',
    requiredNoScope,
  ])

  for (const file of trackerDocs) {
    requireTerms(failures, file, ['XCHAT-0'])
  }

  const packageJson = JSON.parse(read('package.json'))
  if (packageJson.scripts?.['cross-chat:diagnostics'] !== 'node scripts/validation/cross-chat-coordination-diagnostics.mjs') {
    failures.push('package.json missing cross-chat:diagnostics script')
  }

  const registry = read('docs/cross-chat/chat-ownership-registry.md')
  if (/AI_TOOLS_CREATIVE_GRAPHICS[\s\S]{0,500}(MapLibre|Turf|deck\.gl|CesiumJS)/i.test(registry)) {
    failures.push('AI_TOOLS_CREATIVE_GRAPHICS row appears to claim map/geospatial tools')
  }

  const crossChatFiles = requiredDocs.filter((file) => file.startsWith('docs/cross-chat/') || file.includes('prompt-xchat-0'))
  const unsafe = scanUnsafeClaims([...crossChatFiles, ...trackerDocs])
  failures.push(...unsafe.map((finding) => `Unsafe positive capability claim: ${finding}`))

  if (!read('scripts/validation/run-foundation-validation.mjs').includes('cross_chat_coordination_diagnostics')) {
    warnings.push('Foundation validation runner does not include cross_chat_coordination_diagnostics.')
  }

  const summary = {
    status: failures.length === 0 ? 'passed' : 'failed',
    requiredDocs: requiredDocs.length,
    workstreams: requiredWorkstreams.length,
    aiTools: aiTools.length,
    trackerDocs: trackerDocs.length,
    warnings,
    failures,
  }

  console.log(JSON.stringify(summary, null, 2))

  if (failures.length > 0) {
    process.exit(1)
  }
}

main()
