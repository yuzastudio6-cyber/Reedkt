import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const dimensions = { width: 640, height: 360 };
const syntheticData = [
  { label: 'Plan', value: 12 },
  { label: 'Render', value: 19 },
  { label: 'QA', value: 7 },
];

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
    outputKind: 'svg',
  },
  {
    toolId: 'viz_graphviz_diagrams',
    displayName: 'Viz.js / Graphviz',
    moduleName: '@viz-js/viz',
    outputKind: 'svg',
  },
];

const repoRoot = process.cwd();
const runId = `gd7-retry-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputRoot = path.join(repoRoot, '.local-artifacts', 'ai-tools', 'gd-7-retry', runId);

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

function sanitizeMessage(message) {
  return String(message)
    .replaceAll(repoRoot, '<repo>')
    .replace(/\/[^)\s]*node_modules\/(@resvg\/resvg-js-[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+)/g, 'node_modules/$1')
    .replace(/\s+/g, ' ')
    .slice(0, 260);
}

function classifyImportError(moduleName, error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const message = error instanceof Error ? error.message : String(error);

  if (moduleName === '@resvg/resvg-js' && process.platform === 'darwin' && /code signature|native binding|dlopen/i.test(message)) {
    return 'local_darwin_native_blocker';
  }

  if (code === 'ERR_MODULE_NOT_FOUND') {
    return 'package_runtime_unavailable';
  }

  if (/\b(window|document|navigator|HTMLElement|HTMLCanvasElement)\b/i.test(message)) {
    return 'browser_or_dom_runtime_unavailable';
  }

  if (/code signature|native binding|dlopen/i.test(message) || code === 'ERR_DLOPEN_FAILED') {
    return 'native_binding_load_failure';
  }

  return 'package_import_failed_needs_review';
}

async function importAvailable(moduleName) {
  try {
    const runtime = await import(moduleName);
    return { available: true, runtime };
  } catch (error) {
    return {
      available: false,
      reason: classifyImportError(moduleName, error),
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED',
      errorSummary: sanitizeMessage(error instanceof Error ? error.message : String(error)),
    };
  }
}

function syntheticSvgShell(toolId, innerMarkup) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" role="img" aria-label="${toolId} synthetic GD-7 retry fixture">
  <rect width="${dimensions.width}" height="${dimensions.height}" fill="#f7f7f2"/>
  <rect x="36" y="42" width="572" height="276" rx="0" fill="#ffffff" stroke="#202124" stroke-width="2"/>
  <text x="60" y="88" font-family="Arial, sans-serif" font-size="24" fill="#202124">GD-7 retry synthetic fixture</text>
  <text x="60" y="122" font-family="Arial, sans-serif" font-size="16" fill="#3c4043">${toolId}</text>
  ${innerMarkup}
</svg>
`;
}

function genericSyntheticSvg(toolId) {
  return syntheticSvgShell(
    toolId,
    `<circle cx="502" cy="198" r="46" fill="#2f6fed" opacity="0.9"/>
  <path d="M112 258 L212 205 L312 232 L412 168 L524 210" fill="none" stroke="#0b8043" stroke-width="8"/>`,
  );
}

function d3SyntheticSvg(d3) {
  if (typeof d3.scaleBand !== 'function' || typeof d3.scaleLinear !== 'function') {
    throw new Error('d3_safe_handler_missing_expected_scale_api');
  }

  const x = d3.scaleBand().domain(syntheticData.map((datum) => datum.label)).range([92, 520]).padding(0.24);
  const y = d3.scaleLinear().domain([0, d3.max(syntheticData, (datum) => datum.value)]).nice().range([284, 152]);
  const bars = syntheticData
    .map((datum) => {
      const barX = x(datum.label);
      const barY = y(datum.value);
      const barHeight = 284 - barY;
      return `<rect x="${barX}" y="${barY}" width="${x.bandwidth()}" height="${barHeight}" fill="#2f6fed"/>
  <text x="${barX + x.bandwidth() / 2}" y="308" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#202124">${datum.label}</text>
  <text x="${barX + x.bandwidth() / 2}" y="${barY - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#202124">${datum.value}</text>`;
    })
    .join('\n  ');

  return syntheticSvgShell(
    'd3_dataviz',
    `<line x1="84" y1="284" x2="548" y2="284" stroke="#5f6368" stroke-width="2"/>
  <line x1="84" y1="146" x2="84" y2="284" stroke="#5f6368" stroke-width="2"/>
  ${bars}`,
  );
}

async function echartsSyntheticSvg(echarts) {
  if (typeof echarts.init !== 'function') {
    throw new Error('echarts_safe_handler_missing_init_api');
  }

  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: dimensions.width,
    height: dimensions.height,
  });
  try {
    chart.setOption({
      animation: false,
      backgroundColor: '#f7f7f2',
      title: {
        text: 'GD-7 retry ECharts fixture',
        left: 36,
        top: 24,
        textStyle: { color: '#202124', fontSize: 20 },
      },
      grid: { left: 70, right: 40, top: 92, bottom: 64 },
      xAxis: { type: 'category', data: syntheticData.map((datum) => datum.label) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: syntheticData.map((datum) => datum.value), color: '#2f6fed' }],
    });

    if (typeof chart.renderToSVGString !== 'function') {
      throw new Error('echarts_node_ssr_render_to_svg_unavailable');
    }

    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}

async function vegaLiteSyntheticSvg(vegaLite) {
  if (typeof vegaLite.compile !== 'function') {
    throw new Error('vega_lite_safe_handler_missing_compile_api');
  }

  const vega = await import('vega');
  const spec = {
    description: 'GD-7 retry synthetic Vega-Lite fixture',
    width: 520,
    height: 220,
    background: '#f7f7f2',
    data: { values: syntheticData },
    mark: { type: 'bar', color: '#2f6fed' },
    encoding: {
      x: { field: 'label', type: 'nominal', axis: { title: null } },
      y: { field: 'value', type: 'quantitative', axis: { title: null } },
    },
    title: 'GD-7 retry Vega-Lite fixture',
  };
  const compiled = vegaLite.compile(spec).spec;
  const view = new vega.View(vega.parse(compiled), { renderer: 'none' });
  return await view.toSVG();
}

async function vizSyntheticSvg(vizModule) {
  if (typeof vizModule.instance !== 'function') {
    throw new Error('viz_safe_handler_missing_instance_api');
  }

  const viz = await vizModule.instance();
  return viz.renderString(
    `digraph GD7Retry {
  graph [bgcolor="transparent", rankdir=LR]
  node [shape=box, style="rounded,filled", fillcolor="#f7f7f2", color="#202124", fontname="Arial"]
  edge [color="#2f6fed", penwidth=2]
  Synthetic -> Manifest -> QA -> Handoff
}`,
    { format: 'svg', engine: 'dot' },
  );
}

function localFontCandidate() {
  return [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/Library/Fonts/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
  ].find((fontPath) => existsSync(fontPath));
}

async function satoriSyntheticSvg(satoriModule) {
  const satori = satoriModule.default;
  if (typeof satori !== 'function') {
    throw new Error('satori_safe_handler_missing_default_export');
  }

  const fontPath = localFontCandidate();
  if (!fontPath) {
    return {
      skipped: true,
      skipReason: 'local_font_unavailable',
    };
  }

  const element = {
    type: 'div',
    props: {
      style: {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        background: '#f7f7f2',
        color: '#202124',
        fontFamily: 'GD7LocalFont',
      },
      children: [
        { type: 'div', props: { style: { fontSize: '34px', fontWeight: 700 }, children: 'GD-7 retry social card' } },
        {
          type: 'div',
          props: {
            style: { marginTop: '20px', fontSize: '20px', color: '#3c4043' },
            children: 'Synthetic local-only Satori fixture',
          },
        },
      ],
    },
  };

  return {
    content: await satori(element, {
      width: dimensions.width,
      height: dimensions.height,
      fonts: [
        {
          name: 'GD7LocalFont',
          data: readFileSync(fontPath),
          weight: 400,
          style: 'normal',
        },
      ],
    }),
  };
}

function svgJsSkipResult() {
  return {
    skipped: true,
    skipReason: 'node_dom_runtime_unavailable_no_dependency_mutation',
  };
}

async function resvgSyntheticPng(resvgModule) {
  if (typeof resvgModule.Resvg !== 'function') {
    throw new Error('resvg_safe_handler_missing_resvg_export');
  }

  const svg = genericSyntheticSvg('resvg_js_svg_rasterization');
  const rendered = new resvgModule.Resvg(svg).render();
  return rendered.asPng();
}

async function buildOutput(tool, importResult) {
  if (tool.toolId === 'svg_js_vector_graphics') {
    return svgJsSkipResult();
  }
  if (tool.toolId === 'satori_social_cards') {
    return await satoriSyntheticSvg(importResult.runtime);
  }
  if (tool.toolId === 'resvg_js_svg_rasterization') {
    return { content: await resvgSyntheticPng(importResult.runtime), outputKind: 'png' };
  }
  if (tool.toolId === 'd3_dataviz') {
    return { content: d3SyntheticSvg(importResult.runtime) };
  }
  if (tool.toolId === 'echarts_dataviz') {
    return { content: await echartsSyntheticSvg(importResult.runtime) };
  }
  if (tool.toolId === 'vega_lite_dataviz') {
    return { content: await vegaLiteSyntheticSvg(importResult.runtime) };
  }
  if (tool.toolId === 'viz_graphviz_diagrams') {
    return { content: await vizSyntheticSvg(importResult.runtime) };
  }

  return {
    skipped: true,
    skipReason: 'package_importable_but_no_safe_gd7_retry_handler',
  };
}

function outputExtension(outputKind) {
  if (outputKind === 'png') {
    return 'png';
  }
  if (outputKind === 'json') {
    return 'json';
  }
  return 'svg';
}

function writeToolOutput(tool, output) {
  mkdirSync(outputRoot, { recursive: true });
  const outputKind = output.outputKind ?? tool.outputKind;
  const extension = outputExtension(outputKind);
  const outputPath = path.join(outputRoot, `${tool.toolId}.${extension}`);
  const content = output.content;
  writeFileSync(outputPath, content);
  return {
    localOutputPath: path.relative(repoRoot, outputPath),
    outputKind,
    checksumSha256: checksum(content),
  };
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
      blocked: importResult.reason === 'local_darwin_native_blocker',
      skipReason: importResult.reason,
      packageImport: tool.moduleName,
      errorCode: importResult.errorCode,
      importErrorSummary: importResult.errorSummary,
      dimensions: null,
      checksumPresent: false,
      artifactManifestPresent: false,
      trackAHandoffReady: false,
      qaStatus: 'skipped_runtime_import_failed',
    };
  }

  try {
    const output = await buildOutput(tool, importResult);
    if (output.skipped) {
      return {
        toolId: tool.toolId,
        displayName: tool.displayName,
        attempted: true,
        executed: false,
        skipped: true,
        blocked: false,
        skipReason: output.skipReason,
        packageImport: tool.moduleName,
        dimensions: null,
        checksumPresent: false,
        artifactManifestPresent: false,
        trackAHandoffReady: false,
        qaStatus: 'skipped_no_safe_node_handler',
      };
    }

    const outputEvidence = writeToolOutput(tool, output);
    return {
      toolId: tool.toolId,
      displayName: tool.displayName,
      attempted: true,
      executed: true,
      skipped: false,
      blocked: false,
      packageImport: tool.moduleName,
      dimensions,
      checksumPresent: true,
      artifactManifestPresent: true,
      trackAHandoffReady: true,
      blockedUseCompliance: true,
      qaStatus: 'local_synthetic_fixture_created_pending_track_a_review',
      ...outputEvidence,
    };
  } catch (error) {
    return {
      toolId: tool.toolId,
      displayName: tool.displayName,
      attempted: true,
      executed: false,
      skipped: true,
      blocked: false,
      skipReason: 'safe_handler_failed_needs_review',
      packageImport: tool.moduleName,
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'HANDLER_FAILED',
      importErrorSummary: sanitizeMessage(error instanceof Error ? error.message : String(error)),
      dimensions: null,
      checksumPresent: false,
      artifactManifestPresent: false,
      trackAHandoffReady: false,
      qaStatus: 'skipped_safe_handler_failed',
    };
  }
}

const results = [];
for (const tool of groupATools) {
  results.push(await maybeExecuteTool(tool));
}

const executedResults = results.filter((result) => result.executed);
const skippedResults = results.filter((result) => result.skipped);
const blockedResults = results.filter((result) => result.blocked);
const runtimeStatus =
  executedResults.length === 0
    ? 'generated_local_fixture_blocked'
    : skippedResults.length > 0 || blockedResults.length > 0
      ? 'generated_local_fixture_partially_passed'
      : 'generated_local_fixture_executed';

const artifactManifest = {
  runId,
  manifestType: 'gd7_retry_local_artifact_manifest',
  sourceOfTruthPolicy: 'local_private_manifest_only',
  privateGcsPathPlaceholder: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
  supabaseArtifactRecordPlaceholder: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
  approvedPlanSnapshotPlaceholder: '<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>',
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  storageTransferPerformed: false,
  artifacts: executedResults.map((result) => ({
    toolId: result.toolId,
    outputKind: result.outputKind,
    localOutputPath: result.localOutputPath,
    checksumSha256: result.checksumSha256,
    dimensions: result.dimensions,
    trackAHandoffReady: result.trackAHandoffReady,
    futurePrivateGcsPath: '<PRIVATE_GCS_PATH_PLACEHOLDER>',
    futureSupabaseArtifactRecord: '<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>',
  })),
};

const qaEvidence = {
  runId,
  evidenceType: 'gd7_retry_local_qa_evidence',
  blockedUseCompliance: true,
  trackAFinalRenderExportExecuted: false,
  results: results.map((result) => ({
    toolId: result.toolId,
    displayName: result.displayName,
    executed: result.executed,
    skipped: result.skipped,
    blocked: result.blocked,
    outputKind: result.outputKind ?? null,
    dimensions: result.dimensions,
    checksumPresent: result.checksumPresent,
    artifactManifestPresent: result.artifactManifestPresent,
    trackAHandoffReady: result.trackAHandoffReady,
    qaStatus: result.qaStatus,
    blocker: result.skipReason ?? null,
  })),
};

const summary = {
  runId,
  capabilityEnabled: 'none; controlled local creative graphics fixture execution only',
  approvedScope: 'Group A controlled local synthetic fixtures only',
  outputRoot: path.relative(repoRoot, outputRoot),
  toolsAttempted: results.length,
  toolsExecuted: executedResults.length,
  toolsSkipped: skippedResults.length,
  toolsBlocked: blockedResults.length,
  runtimeStatus,
  groupBExecuted: false,
  groupCExecuted: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
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
  rawPromptExecution: false,
  localArtifactManifestPath: path.relative(repoRoot, path.join(outputRoot, 'local-artifact-manifest.json')),
  qaEvidencePath: path.relative(repoRoot, path.join(outputRoot, 'qa-evidence.json')),
  results,
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(path.join(outputRoot, 'gd7-retry-local-fixture-evidence.json'), JSON.stringify(summary, null, 2));
writeFileSync(path.join(outputRoot, 'local-artifact-manifest.json'), JSON.stringify(artifactManifest, null, 2));
writeFileSync(path.join(outputRoot, 'qa-evidence.json'), JSON.stringify(qaEvidence, null, 2));

console.log(
  JSON.stringify(
    {
      runId,
      runtimeStatus,
      toolsExecuted: summary.toolsExecuted,
      toolsSkipped: summary.toolsSkipped,
      toolsBlocked: summary.toolsBlocked,
      executedToolIds: executedResults.map((result) => result.toolId),
      skippedToolIds: skippedResults.map((result) => ({ toolId: result.toolId, reason: result.skipReason })),
      outputRoot: summary.outputRoot,
      evidenceReport: path.relative(repoRoot, path.join(outputRoot, 'gd7-retry-local-fixture-evidence.json')),
      localArtifactManifest: summary.localArtifactManifestPath,
      qaEvidence: summary.qaEvidencePath,
      supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
      sqlExecuted: summary.sqlExecuted,
      migrationDeployed: summary.migrationDeployed,
    },
    null,
    2,
  ),
);
