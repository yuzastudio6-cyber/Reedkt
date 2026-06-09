import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const runId = `gd8a-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputDir = path.join(repoRoot, '.local-artifacts', 'ai-tools', 'gd-8a', runId);
const reportPath = path.join(outputDir, 'resvg-native-probe-report.json');

const nativePackages = [
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

function packageRelativePath(packageName) {
  return path.join('node_modules', ...packageName.split('/'));
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

function currentNativePackageCandidates() {
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
  if (process.platform === 'win32' && process.arch === 'arm64') {
    return ['@resvg/resvg-js-win32-arm64-msvc'];
  }
  return [];
}

function sanitizeMessage(message) {
  return String(message)
    .replaceAll(repoRoot, '<repo>')
    .replace(/\/[^)\s]*node_modules\/(@resvg\/resvg-js-[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+)/g, 'node_modules/$1')
    .replace(/\s+/g, ' ')
    .slice(0, 260);
}

function errorClass(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'ERR_MODULE_NOT_FOUND') {
    return 'module_not_found';
  }
  if (/code signature/i.test(message)) {
    return 'darwin_code_signature_native_binding_load_failure';
  }
  if (code === 'ERR_DLOPEN_FAILED' || /dlopen|native binding/i.test(message)) {
    return 'native_binding_load_failure';
  }
  return 'import_error_needs_review';
}

function classifyImportResult({ status, error = null }) {
  if (status === 'passed') {
    return 'fixed';
  }

  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'IMPORT_FAILED';
  const message = error instanceof Error ? error.message : String(error);
  if (process.platform === 'darwin' && /code signature|native binding|dlopen/i.test(message)) {
    return 'ci_linux_viability_unknown';
  }
  if (code === 'ERR_MODULE_NOT_FOUND') {
    return 'blocked_needs_runtime_review';
  }
  return 'blocked_needs_runtime_review';
}

function buildMetadata(error = null) {
  const packageJson = readJsonIfPresent('node_modules/@resvg/resvg-js/package.json');
  const lockfile = readJsonIfPresent('package-lock.json');
  const lockPackages = lockfile?.packages ?? {};
  const currentCandidates = currentNativePackageCandidates();
  const installedNativePackageCandidates = currentCandidates.filter((packageName) =>
    existsSync(path.join(repoRoot, packageRelativePath(packageName))),
  );
  const optionalNativePackagesInLock = nativePackages.filter((packageName) =>
    Object.prototype.hasOwnProperty.call(lockPackages, packageRelativePath(packageName)),
  );

  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    packageName: '@resvg/resvg-js',
    packageVersion: packageJson?.version ?? 'unknown',
    currentNativePackageCandidates: currentCandidates,
    installedNativePackageCandidates,
    nativePackagePresent: installedNativePackageCandidates.length > 0,
    optionalNativePackagesInLock,
    errorName: error instanceof Error ? error.name : error ? 'ImportError' : null,
    errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : null,
    errorClass: error ? errorClass(error) : null,
    errorSummary: error ? sanitizeMessage(error instanceof Error ? error.message : String(error)) : null,
  };
}

let importStatus = 'passed';
let importError = null;

try {
  await import('@resvg/resvg-js');
} catch (error) {
  importStatus = 'blocked';
  importError = error;
}

const metadata = buildMetadata(importError);
const report = {
  runId,
  status: importStatus,
  classification: classifyImportResult({ status: importStatus, error: importError }),
  productionCapabilityEnabled: 'none; AI Tools creative graphics resvg runtime review only',
  probeType: 'import_only_native_availability',
  svgInputUsed: false,
  constructorTested: false,
  rasterizationExecuted: false,
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
  metadata,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(
  JSON.stringify(
    {
      runId,
      status: report.status,
      classification: report.classification,
      platform: metadata.platform,
      arch: metadata.arch,
      packageName: metadata.packageName,
      packageVersion: metadata.packageVersion,
      nativePackagePresent: metadata.nativePackagePresent,
      errorCode: metadata.errorCode,
      errorClass: metadata.errorClass,
      reportPath: path.relative(repoRoot, reportPath),
    },
    null,
    2,
  ),
);
