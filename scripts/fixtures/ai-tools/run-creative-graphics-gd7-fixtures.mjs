import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const groupATools = [
  {
    toolId: 'svg_js_vector_graphics',
    displayName: 'SVG.js',
    moduleName: '@svgdotjs/svg.js',
    outputKind: 'svg',
  },
  {
    toolId: 'satori_social_cards',
    displayName: 'Satori',
    moduleName: 'satori',
    outputKind: 'svg',
  },
  {
    toolId: 'resvg_js_svg_rasterization',
    displayName: '@resvg/resvg-js',
    moduleName: '@resvg/resvg-js',
    outputKind: 'png',
  },
  {
    toolId: 'd3_dataviz',
    displayName: 'D3.js',
    moduleName: 'd3',
    outputKind: 'svg',
  },
  {
    toolId: 'echarts_dataviz',
    displayName: 'Apache ECharts',
    moduleName: 'echarts',
    outputKind: 'svg',
  },
  {
    toolId: 'vega_lite_dataviz',
    displayName: 'Vega / Vega-Lite',
    moduleName: 'vega-lite',
    outputKind: 'json',
  },
  {
    toolId: 'viz_graphviz_diagrams',
    displayName: 'Viz.js / Graphviz',
    moduleName: '@viz-js/viz',
    outputKind: 'svg',
  },
];

const repoRoot = process.cwd();
const runId = `gd7-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputRoot = path.join(repoRoot, '.local-artifacts', 'ai-tools', 'gd-7', runId);

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

function syntheticSvg(toolId) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="${toolId} synthetic GD-7 fixture">
  <rect width="640" height="360" fill="#f7f7f2"/>
  <rect x="40" y="48" width="560" height="264" rx="0" fill="#ffffff" stroke="#202124" stroke-width="2"/>
  <text x="64" y="104" font-family="Arial, sans-serif" font-size="28" fill="#202124">GD-7 synthetic fixture</text>
  <text x="64" y="152" font-family="Arial, sans-serif" font-size="20" fill="#3c4043">${toolId}</text>
  <circle cx="500" cy="205" r="48" fill="#2f6fed" opacity="0.9"/>
  <path d="M120 250 L220 200 L320 230 L420 170 L520 210" fill="none" stroke="#0b8043" stroke-width="8"/>
</svg>
`;
}

function syntheticJson(toolId) {
  return JSON.stringify(
    {
      toolId,
      fixtureType: 'gd7_synthetic_local_candidate',
      privateArtifactOnly: true,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      supabaseEnvironmentTouched: 'none',
      sqlExecuted: 'none',
      migrationDeployed: 'no',
      syntheticData: [
        { label: 'A', value: 12 },
        { label: 'B', value: 19 },
        { label: 'C', value: 7 },
      ],
    },
    null,
    2,
  );
}

async function importAvailable(moduleName) {
  try {
    const runtime = await import(moduleName);
    return { available: true, runtime };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function maybeExecuteTool(tool) {
  const importResult = await importAvailable(tool.moduleName);
  if (!importResult.available) {
    return {
      toolId: tool.toolId,
      displayName: tool.displayName,
      attempted: true,
      executed: false,
      skipped: true,
      skipReason: 'package_runtime_unavailable',
      packageImport: tool.moduleName,
      importErrorSummary: importResult.reason,
    };
  }

  mkdirSync(outputRoot, { recursive: true });

  const extension = tool.outputKind === 'json' ? 'json' : tool.outputKind === 'png' ? 'png' : 'svg';
  const outputFileName = `${tool.toolId}.${extension}`;
  const outputPath = path.join(outputRoot, outputFileName);
  let content;

  if (tool.toolId === 'd3_dataviz' && typeof importResult.runtime.scaleLinear === 'function') {
    content = syntheticSvg(tool.toolId);
  } else if (tool.toolId === 'vega_lite_dataviz') {
    content = syntheticJson(tool.toolId);
  } else {
    return {
      toolId: tool.toolId,
      displayName: tool.displayName,
      attempted: true,
      executed: false,
      skipped: true,
      skipReason: 'package_importable_but_no_safe_gd7_handler',
      packageImport: tool.moduleName,
    };
  }

  writeFileSync(outputPath, content, 'utf8');

  return {
    toolId: tool.toolId,
    displayName: tool.displayName,
    attempted: true,
    executed: true,
    skipped: false,
    packageImport: tool.moduleName,
    localOutputPath: path.relative(repoRoot, outputPath),
    outputKind: tool.outputKind,
    checksumSha256: checksum(content),
    qaStatus: 'local_synthetic_fixture_created_pending_human_review',
  };
}

const results = [];
for (const tool of groupATools) {
  results.push(await maybeExecuteTool(tool));
}

const summary = {
  runId,
  capabilityEnabled: 'none; controlled local creative graphics fixture execution only',
  approvedScope: 'Group A controlled local synthetic fixtures only',
  outputRoot: path.relative(repoRoot, outputRoot),
  toolsAttempted: results.length,
  toolsExecuted: results.filter((result) => result.executed).length,
  toolsSkipped: results.filter((result) => result.skipped).length,
  groupBExecuted: false,
  groupCExecuted: false,
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  storageTransferPerformed: false,
  providerCalls: false,
  modelCalls: false,
  workerExecution: false,
  renderExportExecution: false,
  browserCapture: false,
  mediaProcessing: false,
  dockerCloudRunExecution: false,
  results,
};

if (summary.toolsExecuted > 0) {
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(path.join(outputRoot, 'gd7-local-fixture-evidence.json'), JSON.stringify(summary, null, 2));
}

console.log(JSON.stringify(summary, null, 2));
