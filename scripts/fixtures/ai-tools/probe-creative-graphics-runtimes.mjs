import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const probes = [
  {
    toolIds: ['remotion_graphics'],
    packageName: 'remotion',
    executionGroup: 'Group B',
  },
  {
    toolIds: ['d3_dataviz'],
    packageName: 'd3',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['three_js_visuals'],
    packageName: 'three',
    executionGroup: 'Group C',
  },
  {
    toolIds: ['pixijs_canvas_graphics'],
    packageName: 'pixi.js',
    executionGroup: 'Group C',
  },
  {
    toolIds: ['anime_js_motion'],
    packageName: 'animejs',
    executionGroup: 'Group B',
  },
  {
    toolIds: ['lottie_web_overlays'],
    packageName: 'lottie-web',
    executionGroup: 'Group B',
  },
  {
    toolIds: ['svg_js_vector_graphics'],
    packageName: '@svgdotjs/svg.js',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['echarts_dataviz'],
    packageName: 'echarts',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['vega_lite_dataviz'],
    packageName: 'vega',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['vega_lite_dataviz'],
    packageName: 'vega-lite',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['viz_graphviz_diagrams'],
    packageName: '@viz-js/viz',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['satori_social_cards'],
    packageName: 'satori',
    executionGroup: 'Group A',
  },
  {
    toolIds: ['resvg_js_svg_rasterization'],
    packageName: '@resvg/resvg-js',
    executionGroup: 'Group A',
  },
];

const repoRoot = process.cwd();
const runId = `gd8-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputDir = path.join(repoRoot, '.local-artifacts', 'ai-tools', 'gd-8', runId);

function classifyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const compactMessage = message.replace(/\s+/g, ' ').slice(0, 240);

  if (code === 'ERR_MODULE_NOT_FOUND') {
    return {
      status: 'failed',
      blocker: 'package_runtime_missing',
      errorCode: code,
      errorSummary: compactMessage,
    };
  }

  if (/dlopen|native binding|code signature|ERR_DLOPEN_FAILED/i.test(message) || code === 'ERR_DLOPEN_FAILED') {
    return {
      status: 'blocked',
      blocker: 'needs_runtime_review',
      errorCode: code,
      errorSummary: compactMessage,
    };
  }

  if (/\b(window|document|navigator|HTMLElement|HTMLCanvasElement)\b/i.test(message)) {
    return {
      status: 'blocked',
      blocker: 'browser_only_import_review',
      errorCode: code,
      errorSummary: compactMessage,
    };
  }

  return {
    status: 'blocked',
    blocker: 'import_error_needs_review',
    errorCode: code,
    errorSummary: compactMessage,
  };
}

async function probeRuntime(probe) {
  try {
    await import(probe.packageName);
    return {
      ...probe,
      status: 'passed',
      blocker: null,
      importOnly: true,
      fixtureGenerated: false,
      artifactGenerated: false,
      renderExportExecuted: false,
      workerExecuted: false,
      providerModelCalled: false,
    };
  } catch (error) {
    return {
      ...probe,
      ...classifyError(error),
      importOnly: true,
      fixtureGenerated: false,
      artifactGenerated: false,
      renderExportExecuted: false,
      workerExecuted: false,
      providerModelCalled: false,
    };
  }
}

const results = [];
for (const probe of probes) {
  results.push(await probeRuntime(probe));
}

const summary = {
  runId,
  status: results.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
  capabilityEnabled: 'none; AI Tools creative graphics package runtime enablement only',
  probeType: 'import_only',
  packagesProbed: results.length,
  packagesPassed: results.filter((result) => result.status === 'passed').length,
  packagesFailed: results.filter((result) => result.status === 'failed').length,
  packagesBlocked: results.filter((result) => result.status === 'blocked').length,
  fixtureGeneration: 'none',
  generatedArtifacts: 'none',
  renderExportExecution: 'none',
  workerExecution: 'none',
  providerModelCalls: 'none',
  browserCapture: 'none',
  mediaProcessing: 'none',
  dockerCloudRunExecution: 'none',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  results,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, 'runtime-probe-report.json'), JSON.stringify(summary, null, 2));

console.log(
  JSON.stringify(
    {
      runId,
      status: summary.status,
      packagesProbed: summary.packagesProbed,
      packagesPassed: summary.packagesPassed,
      packagesFailed: summary.packagesFailed,
      packagesBlocked: summary.packagesBlocked,
      results: results.map((result) => ({
        packageName: result.packageName,
        toolIds: result.toolIds,
        status: result.status,
        blocker: result.blocker,
        errorCode: result.errorCode,
      })),
      reportPath: path.relative(repoRoot, path.join(outputDir, 'runtime-probe-report.json')),
    },
    null,
    2,
  ),
);
