import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildSearxngGeneratedFixtureResponse, normalizeSearxngFixtureResults } from '../searxng-search-fixture'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'
import type { LocalHtmlFixtureResult } from './playwright-sharp-capture-types'

export function buildGeneratedLocalHtmlFixture(): string {
  const normalized = normalizeSearxngFixtureResults(buildSearxngGeneratedFixtureResponse())
  const cards = normalized.sources.slice(0, 3).map((source) => `
        <article class="source-card">
          <p class="rank">Source ${source.rank}</p>
          <h2>${escapeHtml(source.title)}</h2>
          <p>${escapeHtml(source.snippet)}</p>
          <dl>
            <dt>Source ID</dt><dd>${escapeHtml(source.sourceId)}</dd>
            <dt>Domain</dt><dd>${escapeHtml(source.domain)}</dd>
            <dt>Capture</dt><dd>blocked in Phase 49C public scope</dd>
          </dl>
        </article>`).join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${playwrightSharpCaptureConfig.fixtureTitle}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: #f6f7f9; color: #16181d; }
      main { max-width: 1040px; margin: 0 auto; padding: 48px 28px 64px; }
      header { border-bottom: 2px solid #20242c; padding-bottom: 24px; }
      h1 { font-size: 34px; line-height: 1.1; margin: 0 0 12px; }
      .lede { max-width: 780px; font-size: 17px; line-height: 1.55; margin: 0; color: #3d4350; }
      .labels { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 0; }
      .label { border: 1px solid #8790a1; background: #fff; border-radius: 6px; padding: 7px 10px; font-size: 13px; font-weight: 700; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 28px; }
      .source-card { min-height: 260px; border: 1px solid #ccd1da; border-radius: 8px; background: #fff; padding: 18px; box-shadow: 0 2px 0 rgba(22, 24, 29, 0.08); }
      .source-card h2 { font-size: 18px; line-height: 1.25; margin: 0 0 10px; }
      .source-card p { color: #434a57; line-height: 1.48; }
      .rank { color: #685200; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
      dl { display: grid; grid-template-columns: 82px 1fr; gap: 7px 10px; margin-top: 16px; font-size: 12px; }
      dt { color: #6d7480; font-weight: 800; }
      dd { margin: 0; overflow-wrap: anywhere; }
      .metadata { margin-top: 20px; border-left: 4px solid #20242c; padding: 12px 16px; background: #eceff4; }
    </style>
  </head>
  <body>
    <main data-fixture-mode="generated_local_html_capture">
      <header>
        <h1>ReeditPro internal web search capture fixture</h1>
        <p class="lede">Generated local page used to validate Playwright rendering and Sharp screenshot post-processing without live search or public web capture.</p>
        <div class="labels" aria-label="policy labels">
          <span class="label">generated fixture</span>
          <span class="label">no live search</span>
          <span class="label">no paid providers</span>
          <span class="label">no public web capture</span>
        </div>
      </header>
      <section class="grid" aria-label="generated source cards">
${cards}
      </section>
      <section class="metadata">
        <strong>Metadata:</strong> fixture generated from Phase 49B normalized source records; Playwright may open only this local page; Readability extraction is not run.
      </section>
    </main>
  </body>
</html>
`
}

export async function writeGeneratedLocalHtmlFixture(root: string): Promise<LocalHtmlFixtureResult> {
  const fixturePath = path.join(root, 'generated-local-page.html')
  const html = buildGeneratedLocalHtmlFixture()
  await writeFile(fixturePath, html, 'utf8')
  const stats = await stat(fixturePath)
  return {
    fixturePath,
    title: playwrightSharpCaptureConfig.fixtureTitle,
    sourceCardCount: 3,
    externalAssetCount: 0,
    hasScriptTags: false,
    hasIframes: false,
    hasExternalImages: false,
    hasRemoteFonts: false,
    policyLabels: ['generated fixture', 'no live search', 'no paid providers', 'no public web capture'],
    sha256: createHash('sha256').update(html).digest('hex'),
    sizeBytes: stats.size,
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
