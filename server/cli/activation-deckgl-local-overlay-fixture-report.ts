import { buildDeckGlLocalOverlayReport, summarizeDeckGlLocalOverlayReport } from '../activation/deckgl-local-overlay-fixture'

const report = buildDeckGlLocalOverlayReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeDeckGlLocalOverlayReport(report))
}
