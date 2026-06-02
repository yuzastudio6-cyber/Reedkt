import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildSearxngGeneratedFixtureResponse, normalizeSearxngFixtureResults } from '../searxng-search-fixture'
import { readabilityExtractionConfig } from './readability-extraction-policy'
import type { LocalArticleFixtureResult } from './readability-extraction-types'

export function buildGeneratedLocalArticleFixture(): string {
  const normalized = normalizeSearxngFixtureResults(buildSearxngGeneratedFixtureResponse())
  const references = normalized.sources.slice(0, 3).map((source) => `
            <li>
              <a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>
              <span class="domain">${escapeHtml(source.domain)}</span>
            </li>`).join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${readabilityExtractionConfig.fixtureTitle}</title>
    <meta name="description" content="Generated local article fixture for ReeditPro source extraction validation." />
    <meta property="og:site_name" content="ReeditPro Fixture Lab" />
    <meta property="article:published_time" content="2026-06-02T00:00:00.000Z" />
    <link rel="canonical" href="https://example.invalid/reeditpro/phase49d/source-extraction-fixture" />
    <style>
      :root { color-scheme: light; font-family: Georgia, "Times New Roman", serif; }
      body { margin: 0; background: #f4f6f8; color: #151922; }
      header, footer, aside, nav { font-family: Arial, sans-serif; }
      .topnav { padding: 14px 32px; background: #172033; color: white; }
      .layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 28px; max-width: 1120px; margin: 0 auto; padding: 32px 24px 56px; }
      article { background: white; border: 1px solid #d5dae3; padding: 34px 40px; }
      article h1 { font-size: 38px; line-height: 1.12; margin: 0 0 12px; }
      article p, article li { font-size: 18px; line-height: 1.72; }
      .byline, .excerpt, .labels, .domain { color: #4d5666; font-family: Arial, sans-serif; }
      .labels { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
      .labels span { border: 1px solid #929aaa; border-radius: 6px; padding: 6px 9px; font-size: 12px; font-weight: 700; }
      aside { background: #e9edf4; padding: 18px; border: 1px solid #d2d8e2; }
      footer { padding: 18px 32px; background: #202634; color: white; }
    </style>
  </head>
  <body>
    <nav class="topnav" aria-label="non article navigation">Fixture Nav: dashboard | policy | generated sources</nav>
    <main class="layout">
      <article id="source-extraction-fixture">
        <h1>ReeditPro internal source extraction fixture</h1>
        <p class="byline">By ReeditPro Activation QA</p>
        <time datetime="2026-06-02T00:00:00.000Z">June 2, 2026</time>
        <p class="excerpt">This generated local article validates Mozilla Readability extraction, sanitization, and ReeditPro source-record normalization without touching public websites.</p>
        <div class="labels" aria-label="policy labels">
          <span>generated fixture</span>
          <span>no live web</span>
          <span>no paid providers</span>
          <span>no public extraction</span>
        </div>
        <h2>Why this fixture exists</h2>
        <p>Phase 49D proves the article extraction layer on deterministic HTML that ReeditPro controls. The fixture intentionally includes article text, references, and unrelated page furniture so the extraction step can demonstrate that article content is favored over navigation, sidebar, and footer material.</p>
        <p>The source is generated in a temporary non-repository directory. No network fetch is required, no browser is launched, and no screenshot is captured. Readability receives only this local HTML document through the selected DOM implementation.</p>
        <h2>Extraction expectations</h2>
        <p>The expected extraction includes a title, byline, publication timestamp, excerpt, article body text, and a bounded HTML representation. ReeditPro then sanitizes that HTML, removes unsafe tags and attributes, strips unsafe URLs, and stores display-safe content separately from raw private QA evidence.</p>
        <p>Normalization creates a stable extraction record with a generated source identifier, text preview, word count, language, artifact paths, and explicit false flags for public web extraction, live search, paid provider usage, and browser capture.</p>
        <h2>Generated source references</h2>
        <ul>
${references}
        </ul>
        <p>This article is not a public source and is not a source of truth for customer-facing claims. It is only a controlled internal fixture that exercises the open-source extraction path before any future private endpoint or allowlisted public-page policy is considered.</p>
      </article>
      <aside aria-label="non article sidebar">
        <h2>Sidebar clutter</h2>
        <p>This sidebar should not dominate the extracted article body. It exists to validate clutter reduction.</p>
        <ul><li>Internal link placeholder</li><li>Generated warning block</li><li>Fixture sidebar item</li></ul>
      </aside>
    </main>
    <footer>Generated footer clutter for Readability isolation testing. No public links are used for navigation.</footer>
  </body>
</html>
`
}

export async function writeGeneratedLocalArticleFixture(root: string): Promise<LocalArticleFixtureResult> {
  const fixturePath = path.join(root, 'generated-local-article.html')
  const html = buildGeneratedLocalArticleFixture()
  await writeFile(fixturePath, html, 'utf8')
  const stats = await stat(fixturePath)
  return {
    fixturePath,
    title: readabilityExtractionConfig.fixtureTitle,
    sourceReferenceCount: 3,
    articleParagraphCount: 6,
    clutterSections: ['navigation', 'sidebar', 'footer'],
    externalAssetCount: 0,
    hasScriptTags: false,
    hasIframes: false,
    hasExternalImages: false,
    hasRemoteFonts: false,
    policyLabels: ['generated fixture', 'no live web', 'no paid providers', 'no public extraction'],
    sha256: createHash('sha256').update(html).digest('hex'),
    sizeBytes: stats.size,
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
