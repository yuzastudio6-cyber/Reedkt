import { spawnSync } from 'node:child_process';
import process from 'node:process';

const includeFullBuild = process.env.REEDITPRO_INCLUDE_FULL_BUILD === 'true';

const nativeBuildBlockers = [
  /Cannot find module ['"]@rollup\/rollup-darwin-/i,
  /Cannot find module ['"]@rolldown\/binding-darwin-/i,
  /code signature/i,
  /Bad CPU type in executable/i,
];

function npmRun(scriptName) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  });

  return {
    scriptName,
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function isNativeBuildBlocked(result) {
  const output = `${result.stdout}\n${result.stderr}`;
  return nativeBuildBlockers.some((pattern) => pattern.test(output));
}

const requiredChecks = [
  'lint',
  'typecheck:server',
  'ai-tools:creative-graphics:audit:diagnostics',
  'ai-tools:creative-graphics:manifest:diagnostics',
  'ai-tools:creative-graphics:dry-run-fixtures:diagnostics',
  'ai-tools:creative-graphics:generated-local-candidates:diagnostics',
  'ai-tools:creative-graphics:static-gate:diagnostics',
];

const results = [];
let failed = false;

for (const check of requiredChecks) {
  const result = npmRun(check);
  results.push({
    check,
    status: result.status === 0 ? 'passed' : 'failed',
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    failed = true;
  }
}

if (includeFullBuild) {
  for (const check of ['build', 'build:server']) {
    const result = npmRun(check);
    const environmentBlocked = result.status !== 0 && isNativeBuildBlocked(result);
    results.push({
      check,
      status: result.status === 0 ? 'passed' : environmentBlocked ? 'environment_blocked' : 'failed',
    });
    if (result.status !== 0 && !environmentBlocked) {
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      failed = true;
    }
  }
}

const summary = {
  status: failed ? 'failed' : 'passed',
  includeFullBuild,
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (failed) {
  process.exit(1);
}
