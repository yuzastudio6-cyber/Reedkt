import {
  evaluateCanonicalProductUiIntegrationReadiness,
  readCanonicalProductUiSourceSnapshot,
} from '../config/canonical-product-ui-integration-readiness'

const report = evaluateCanonicalProductUiIntegrationReadiness(
  readCanonicalProductUiSourceSnapshot(),
)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

if (process.env.REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY === 'true' && !report.ok) {
  process.exitCode = 1
}
