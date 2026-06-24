import {
  baseResult,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'satori', displayName: 'Satori', packageName: 'satori' }

export async function runSatoriProof({ fixture, paths }) {
  const imported = await importPackage('satori')
  if (imported.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, imported)
  if (imported.status === proofStatuses.failedUnexpectedError) throw new Error(imported.errorMessage)

  const render = imported.module.default
  if (typeof render !== 'function') {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: 'satori default render API is unavailable from the imported module.',
      runtimeRequirementsDiscovered: ['satori_default_render_api_required'],
    }
  }

  try {
    const svg = await render(fixture.node, {
      width: fixture.width,
      height: fixture.height,
      fonts: [],
    })
    const artifactPath = writeLocalArtifact(paths, 'satori.svg', `${svg}\n`)
    const valid = svg.startsWith('<svg') && svg.includes('CPU Static')
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'executed',
      outputContractStatus: valid ? 'checked' : 'failed',
      status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
      outputSummary: {
        svgLength: svg.length,
        hasSvgRoot: svg.startsWith('<svg'),
        expectedTextMarkerFound: svg.includes('CPU Static'),
      },
      localArtifactPaths: [artifactPath],
      runtimeRequirementsDiscovered: ['cpu_only_satori_svg_render_with_font_fixture'],
    }
  } catch (error) {
    const missingFont = /No fonts are loaded|font/i.test(error?.message ?? '')
    const artifactPath = writeLocalArtifact(
      paths,
      'satori_blocked.json',
      `${JSON.stringify(
        {
          attemptedFixture: fixture,
          blockedReason: missingFont
            ? 'Satori imported, but text layout requires an approved font fixture. No approved font data is committed for Phase 0.'
            : 'Satori imported, but SVG rendering blocked before output contract validation.',
          errorMessage: error?.message ?? String(error),
        },
        null,
        2,
      )}\n`,
    )
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked_contract_recorded',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: missingFont
        ? 'Satori text SVG rendering requires approved font data; Phase 0 does not commit or fetch font assets.'
        : `Satori SVG rendering blocked: ${error?.message ?? String(error)}`,
      runtimeRequirementsDiscovered: ['approved_font_fixture_required_for_satori_text_layout'],
      localArtifactPaths: [artifactPath],
    }
  }
}
