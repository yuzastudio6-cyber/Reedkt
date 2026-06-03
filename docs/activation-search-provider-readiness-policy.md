# Phase 49N Search Provider Readiness Policy

SearXNG remains the default free/open-source provider for controlled internal
testing. The private authenticated Cloud Run service
`reeditpro-staging-private-searxng` is required; public SearXNG instances remain
blocked.

Brave Search is optional paid fallback/confidence-booster scope only. It is
disabled by default and requires backend-only secret access, explicit budget
gates, and storage-rights controls in later execution phases.

Phase 49N does not run provider calls. It audits evidence from Phase 49A through
Phase 49M and produces a readiness decision for controlled internal testing
only.

Blocked providers and modes:

- Tavily
- Exa
- Firecrawl
- Browserless
- Browserbase
- public SearXNG
- arbitrary URL capture
- broad crawling
- public artifacts
- production/external beta/paid production/broad media
