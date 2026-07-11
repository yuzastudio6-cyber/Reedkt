import {
  listProvenToolIdentityCatalog,
  summarizeProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'

const catalog = listProvenToolIdentityCatalog()
console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  summary: summarizeProvenToolIdentityCatalog(),
  tools: catalog,
}, null, 2))
