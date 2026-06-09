import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const resvgNativePackages = [
  '@resvg/resvg-js-android-arm-eabi',
  '@resvg/resvg-js-android-arm64',
  '@resvg/resvg-js-darwin-arm64',
  '@resvg/resvg-js-darwin-x64',
  '@resvg/resvg-js-linux-arm-gnueabihf',
  '@resvg/resvg-js-linux-arm64-gnu',
  '@resvg/resvg-js-linux-arm64-musl',
  '@resvg/resvg-js-linux-x64-gnu',
  '@resvg/resvg-js-linux-x64-musl',
  '@resvg/resvg-js-win32-arm64-msvc',
  '@resvg/resvg-js-win32-ia32-msvc',
  '@resvg/resvg-js-win32-x64-msvc',
];

function sanitizeMessage(message) {
  return String(message)
    .replaceAll(repoRoot, '<repo>')
    .replace(/\/[^)\s]*node_modules\/(@resvg\/resvg-js-[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+)/g, 'node_modules/$1')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function compactErrorClass(error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';

  if (code === 'ERR_MODULE_NOT_FOUND') {
    return 'module_not_found';
  }

  if (/code signature/i.test(message)) {
    return 'darwin_code_signature_native_binding_load_failure';
  }

  if (/dlopen|native binding/i.test(message) || code === 'ERR_DLOPEN_FAILED') {
    return 'native_binding_load_failure';
  }

  if (/\b(window|document|navigator|HTMLElement|HTMLCanvasElement)\b/i.test(message)) {
    return 'browser_only_import_requires_review';
  }

  return 'import_error_needs_review';
}

function readJsonIfPresent(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

function currentResvgNativePackageCandidates() {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return ['@resvg/resvg-js-darwin-arm64'];
  }
  if (process.platform === 'darwin' && process.arch === 'x64') {
    return ['@resvg/resvg-js-darwin-x64'];
  }
  if (process.platform === 'linux' && process.arch === 'x64') {
    return ['@resvg/resvg-js-linux-x64-gnu', '@resvg/resvg-js-linux-x64-musl'];
  }
  if (process.platform === 'linux' && process.arch === 'arm64') {
    return ['@resvg/resvg-js-linux-arm64-gnu', '@resvg/resvg-js-linux-arm64-musl'];
  }
  if (process.platform === 'win32' && process.arch === 'x64') {
    return ['@resvg/resvg-js-win32-x64-msvc'];
  }
  return [];
}

function nativePackageRelativePath(packageName) {
  return path.join('node_modules', ...packageName.split('/'));
}

function resvgNativeDiagnostics(error = null) {
  const packageJson = readJsonIfPresent('node_modules/@resvg/resvg-js/package.json');
  const lockfile = readJsonIfPresent('package-lock.json');
  const lockPackages = lockfile?.packages ?? {};
  const optionalNativePackagesInLock = resvgNativePackages.filter((packageName) =>
    Object.prototype.hasOwnProperty.call(lockPackages, nativePackageRelativePath(packageName)),
  );
  const currentNativePackageCandidates = currentResvgNativePackageCandidates();
  const installedNativePackageCandidates = currentNativePackageCandidates.filter((packageName) =>
    existsSync(path.join(repoRoot, nativePackageRelativePath(packageName))),
  );

  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    packageName: '@resvg/resvg-js',
    packageVersion: packageJson?.version ?? 'unknown',
    currentNativePackageCandidates,
    installedNativePackageCandidates,
    nativePackagePresent: installedNativePackageCandidates.length > 0,
    optionalNativePackagesInLock,
    errorName: error instanceof Error ? error.name : error ? 'ImportError' : null,
    errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : null,
    errorClass: error ? compactErrorClass(error) : null,
    errorSummary: error ? sanitizeMessage(error instanceof Error ? error.message : String(error)) : null,
  };
}

function classifyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const compactMessage = sanitizeMessage(message);

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
    const result = {
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
    if (probe.packageName === '@resvg/resvg-js') {
      result.resvgNativeDiagnostics = resvgNativeDiagnostics();
    }
    return result;
  } catch (error) {
    const result = {
      ...probe,
      ...classifyError(error),
      importOnly: true,
      fixtureGenerated: false,
      artifactGenerated: false,
      renderExportExecuted: false,
      workerExecuted: false,
      providerModelCalled: false,
    };
    if (probe.packageName === '@resvg/resvg-js') {
      result.resvgNativeDiagnostics = resvgNativeDiagnostics(error);
    }
    return result;
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
        errorClass: result.resvgNativeDiagnostics?.errorClass,
        nativePackagePresent: result.resvgNativeDiagnostics?.nativePackagePresent,
      })),
      reportPath: path.relative(repoRoot, path.join(outputDir, 'runtime-probe-report.json')),
    },
    null,
    2,
  ),
);
