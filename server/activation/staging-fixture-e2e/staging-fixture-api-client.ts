export function parseAuthenticatedHealthEvidence(text: string): { status: 'passed' | 'blocked'; serviceUrl?: string; warnings: string[] } {
  const serviceUrl = text.match(/https:\/\/[^\s]+\.run\.app/)?.[0]
  const passed = /HTTP_CODE=200|HTTP\/[0-9.]+\s+200|"ok"\s*:\s*true/.test(text)
  return {
    status: passed ? 'passed' : 'blocked',
    serviceUrl,
    warnings: passed ? [] : ['Authenticated API health evidence is missing or did not return 200.'],
  }
}

export function buildAuthenticatedHealthCommand(serviceName = 'reeditpro-staging-api'): string {
  return [
    `SERVICE_URL="$(gcloud run services describe ${serviceName} --region us-central1 --project reeditpro --format='value(status.url)')"`,
    'TOKEN="$(gcloud auth print-identity-token)"',
    'curl -sS -H "Authorization: Bearer ${TOKEN}" "${SERVICE_URL}/health"',
  ].join(' && ')
}
