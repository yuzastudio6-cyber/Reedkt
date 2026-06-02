import { searxngSearchFixtureConfig } from './searxng-search-fixture-policy'
import type { SearxngFixtureResponse, SearxngFixtureResult } from './searxng-search-fixture-types'

export const SEARXNG_FIXTURE_RETRIEVED_AT = '2026-06-01T00:00:00.000Z'

export const searxngGeneratedFixtureResults: SearxngFixtureResult[] = [
  {
    title: 'ReeditPro Open Source Tool Registry',
    url: 'https://docs.example.test/reeditpro/open-source-tool-registry',
    content: 'Fixture-safe documentation record describing deterministic FFmpeg, Remotion, OCR, audio, and search tool planning boundaries.',
    engine: 'searxng',
    category: 'documentation',
    score: 0.982,
    rank: 1,
    publishedDate: '2026-05-01',
    language: 'en',
  },
  {
    title: 'ReeditPro Browser Capture Policy',
    url: 'https://docs.example.test/reeditpro/browser-capture-policy',
    content: 'Generated policy result covering worker-side browser capture, private screenshots, no login bypass, and no public artifact rules.',
    engine: 'searxng',
    category: 'policy',
    score: 0.941,
    rank: 2,
    publishedDate: '2026-05-03',
    language: 'en',
  },
  {
    title: 'Controlled Render Toolchain Source Notes',
    url: 'https://source.example.test/reeditpro/remotion-ffmpeg-toolchain',
    content: 'Fixture source record summarizing Remotion, FFmpeg, FFprobe, libass, and OpenTimelineIO private render validation handoffs.',
    engine: 'searxng',
    category: 'source',
    score: 0.918,
    rank: 3,
    publishedDate: '2026-05-05',
    language: 'en',
  },
  {
    title: 'Private Artifact Policy For Search Capture',
    url: 'https://source.example.test/reeditpro/private-artifact-policy',
    content: 'Generated source note for private GCS prefixes, source manifests, attribution records, and blocked public/signed URL behavior.',
    engine: 'searxng',
    category: 'policy',
    score: 0.887,
    rank: 4,
    language: 'en',
  },
  {
    title: 'Search Citation Manifest Fixture',
    url: 'https://example.invalid/reeditpro/search-citation-manifest',
    content: 'Fixture-only invalid TLD record used to prove citation manifests without contacting public web infrastructure.',
    engine: 'searxng',
    category: 'documentation',
    score: 0.861,
    rank: 5,
    language: 'en',
  },
  {
    title: 'Worker Plan Snapshot Boundary',
    url: 'https://docs.example.test/reeditpro/worker-plan-snapshot-boundary',
    content: 'Generated tooling result documenting approved plan snapshots, raw chat blocking, and worker execution boundaries.',
    engine: 'searxng',
    category: 'tooling',
    score: 0.834,
    rank: 6,
    publishedDate: '2026-05-08',
    language: 'en',
  },
]

export function buildSearxngGeneratedFixtureResponse(): SearxngFixtureResponse {
  return {
    query: searxngSearchFixtureConfig.query,
    provider: 'searxng',
    mode: 'generated_private_fixture',
    generatedFixture: true,
    liveSearchUsed: false,
    results: searxngGeneratedFixtureResults.map((result) => ({ ...result })),
  }
}
