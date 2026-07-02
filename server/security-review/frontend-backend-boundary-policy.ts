import type { SecurityReviewFinding, SourceFileSnapshot } from './security-review-types'

export function detectFrontendBackendBoundaryFindings(files: SourceFileSnapshot[]): SecurityReviewFinding[] {
  const findings: SecurityReviewFinding[] = []

  for (const file of files) {
    const frontendFile = /(^|[\\/])src[\\/].*\.(ts|tsx|js|jsx)$/.test(file.path)
    if (!frontendFile) continue

    if (/from\s+['"].*server[\\/](workers|tool-registry|model-weights|security-review|production-hardening)/.test(file.content)) {
      findings.push({
        area: 'frontend_backend_boundary',
        status: 'blocked',
        path: file.path,
        message: 'Frontend code must not import server workers or heavy tool adapters.',
      })
    }
    if (/(SERVICE_ROLE|service_role|providerApiKey|PROVIDER_API_KEY|gcloud|docker build)/.test(file.content)) {
      findings.push({
        area: 'frontend_backend_boundary',
        status: 'blocked',
        path: file.path,
        message: 'Frontend code must not access service-role env, providers, deploy, or worker runtime controls.',
      })
    }
  }

  return findings
}
