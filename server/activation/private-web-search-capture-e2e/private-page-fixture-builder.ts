import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateFixturePage } from './private-web-search-capture-e2e-types'

const pageSeeds = [
  {
    sourceId: 'source-001',
    title: 'Controlled Search Capture Architecture',
    category: 'documentation',
    excerpt: 'A generated fixture article describing private search result attribution, capture, and extraction contracts.',
  },
  {
    sourceId: 'source-002',
    title: 'Private Fixture Source Manifest Guide',
    category: 'source',
    excerpt: 'A generated fixture article explaining source IDs, source manifests, and capture/extraction linkage.',
  },
  {
    sourceId: 'source-003',
    title: 'Readability Sanitization QA Policy',
    category: 'policy',
    excerpt: 'A generated fixture article covering local Readability extraction, sanitizer scope, and blocked public web behavior.',
  },
] as const

export async function writePrivateFixturePages(outputRoot: string): Promise<PrivateFixturePage[]> {
  const pages: PrivateFixturePage[] = []
  for (const [index, seed] of pageSeeds.entries()) {
    const rank = index + 1
    const fileName = `page-${String(rank).padStart(3, '0')}.html`
    const fixturePath = path.join(outputRoot, fileName)
    const url = `https://fixture.local/phase49e/${fileName}`
    const html = buildPageHtml({
      title: seed.title,
      sourceId: seed.sourceId,
      rank,
      excerpt: seed.excerpt,
      category: seed.category,
      url,
    })
    await writeFile(fixturePath, html, 'utf8')
    const stats = await stat(fixturePath)
    if (stats.size > privateWebE2EConfig.maxPageBytes) throw new Error(`Fixture page ${fileName} exceeds Phase 49E max page bytes.`)
    pages.push({
      sourceId: seed.sourceId,
      rank,
      title: seed.title,
      url,
      domain: 'fixture.local',
      fixturePath,
      byline: 'ReeditPro Fixture Desk',
      publishedDate: '2026-06-02',
      excerpt: seed.excerpt,
      sizeBytes: stats.size,
      sha256: createHash('sha256').update(html).digest('hex'),
      externalAssetCount: 0,
      hasScriptTags: false,
      hasIframes: false,
      hasExternalImages: false,
      hasRemoteFonts: false,
      policyLabels: ['phase49e', 'controlled-private', 'no-public-web', 'fixture-only'],
    })
  }
  return pages
}

function buildPageHtml(input: {
  title: string
  sourceId: string
  rank: number
  excerpt: string
  category: string
  url: string
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${input.title}</title>
  <meta name="description" content="${input.excerpt}">
  <meta name="author" content="ReeditPro Fixture Desk">
  <meta property="article:published_time" content="2026-06-02T00:00:00Z">
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #202124; background: #f7f8fb; }
    main { max-width: 860px; margin: 32px auto; padding: 28px; background: #fff; border: 1px solid #d7dce5; }
    nav, aside, footer { color: #657083; font-size: 14px; }
    .label { display: inline-block; margin-right: 8px; padding: 3px 7px; border: 1px solid #b8c2d4; border-radius: 4px; }
    article p { line-height: 1.62; font-size: 17px; }
  </style>
</head>
<body>
  <nav>Fixture navigation / no external links / no remote assets</nav>
  <main>
    <article data-source-id="${input.sourceId}" data-fixture-url="${input.url}">
      <header>
        <p><span class="label">Phase 49E</span><span class="label">Controlled Private Fixture</span><span class="label">No Public Capture</span></p>
        <h1>${input.title}</h1>
        <p class="byline">By ReeditPro Fixture Desk</p>
        <time datetime="2026-06-02T00:00:00Z">June 2, 2026</time>
        <p class="excerpt">${input.excerpt}</p>
      </header>
      <p>This generated article is source ${input.rank} in the controlled private web search and capture E2E run. It is designed to validate source attribution, screenshot capture, image processing, Readability extraction, sanitization, and manifest linkage without opening the public web.</p>
      <p>The fixture represents a ${input.category} result from a SearXNG-compatible provider contract. It contains article-like content, useful metadata, and visible policy labels, while deliberately excluding remote scripts, external images, iframes, public navigation targets, and login-only content.</p>
      <p>ReeditPro workers must execute the approved Phase 49E plan snapshot, not raw chat instructions. Every artifact produced by this fixture remains private and is referenced through a source, capture, and extraction manifest.</p>
      <p>Public crawling, CAPTCHA bypass, paywall bypass, paid providers, arbitrary URL capture, signed URLs as source of truth, production, external beta, and broad media are all blocked by policy for this phase.</p>
    </article>
    <aside>Non-article sidebar clutter for Readability reduction. It should not become the main extraction.</aside>
  </main>
  <footer>Generated local fixture. No public web content.</footer>
</body>
</html>
`
}
