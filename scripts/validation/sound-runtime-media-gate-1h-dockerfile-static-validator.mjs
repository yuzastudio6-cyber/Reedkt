#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_SOURCE = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const COPIED_REQUIREMENTS = './requirements.sound-oss-tools.txt';

function check(name, passed, evidence, blocker = null) {
  return { name, passed, evidence, blocker };
}

function main() {
  const failures = [];
  const checks = [];
  const dockerfileExists = existsSync(DOCKERFILE_PATH);
  const dockerfile = dockerfileExists ? readFileSync(DOCKERFILE_PATH, 'utf8') : '';
  const executableDockerfile = dockerfile
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

  const add = (name, passed, evidence, blocker) => {
    checks.push(check(name, passed, evidence, passed ? null : blocker));
    if (!passed) failures.push({ name, blocker });
  };

  add('dockerfile_exists', dockerfileExists, DOCKERFILE_PATH, 'missing Dockerfile source');
  add('source_only_comment', dockerfile.includes('SOUND-RUNTIME-MEDIA-GATE-1G source-only Dockerfile'), 'Gate 1G source-only comment', 'missing source-only comment');
  add('no_build_comment', dockerfile.includes('No Docker build has been run'), 'No Docker build has been run', 'missing no-build source comment');
  add('base_image_python_313_slim', /^FROM\s+python:3\.13-slim\s*$/m.test(dockerfile), 'FROM python:3.13-slim', 'base image is not the accepted Python 3.13 slim image');
  add('approved_requirements_copy', dockerfile.includes(`COPY ${REQUIREMENTS_SOURCE} ${COPIED_REQUIREMENTS}`), `COPY ${REQUIREMENTS_SOURCE} ${COPIED_REQUIREMENTS}`, 'requirements copy does not use approved SOUND requirements source');
  add('pip_install_from_approved_requirements', dockerfile.includes(`pip install --no-cache-dir --requirement ${COPIED_REQUIREMENTS}`), `pip install --no-cache-dir --requirement ${COPIED_REQUIREMENTS}`, 'pip install does not use the approved copied requirements file');
  add('sound_runtime_disabled_env', /\bREEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0\b/.test(dockerfile), 'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0', 'missing disabled SOUND runtime flag');
  add('worker_execution_disabled_env', /\bREEDITPRO_WORKER_EXECUTION_ENABLED=0\b/.test(dockerfile), 'REEDITPRO_WORKER_EXECUTION_ENABLED=0', 'missing disabled worker execution flag');
  add('media_processing_disabled_env', /\bREEDITPRO_MEDIA_PROCESSING_ENABLED=0\b/.test(dockerfile), 'REEDITPRO_MEDIA_PROCESSING_ENABLED=0', 'missing disabled media processing flag');
  add('non_root_user_created', /adduser\s+--system[\s\S]*\breeditpro\b/.test(dockerfile), 'adduser --system ... reeditpro', 'missing non-root user creation');
  add('non_root_user_selected', /^USER\s+reeditpro\s*$/m.test(dockerfile), 'USER reeditpro', 'missing non-root USER instruction');
  add('fail_closed_cmd', /^CMD\s+\[/m.test(dockerfile) && dockerfile.includes('runtime execution is disabled pending owner gates'), 'CMD exits with disabled-runtime message', 'missing fail-closed placeholder command');

  const prohibitedScans = [
    ['ffmpeg_or_ffprobe_install', /(?:apt-get|apt|apk|pip|COPY|ADD|curl|wget)[^\n]*(?:ffmpeg|ffprobe)/i, 'FFmpeg/ffprobe install, copy, or fetch command'],
    ['docker_build_or_push', /\b(?:docker\s+(?:build|push|run)|buildx|docker-compose)\b/i, 'Docker build/push/run command'],
    ['gcp_or_cloud_run', /\b(?:gcloud|cloud\s*run|run\.googleapis|secret\s*manager)\b/i, 'GCP/Cloud Run/Secret Manager action'],
    ['service_account', /\b(?:service[-_ ]?account|GOOGLE_APPLICATION_CREDENTIALS|\.json\s*service)\b/i, 'service account reference'],
    ['model_weights', /\b(?:safetensors|huggingface|model[-_ ]?weight|\.pt\b|\.pth\b|\.onnx\b|\.ckpt\b)\b/i, 'model weight reference'],
    ['media_fixture', /\b(?:\.wav|\.mp3|\.mp4|\.mov|fixtures?\/(?:audio|media|video)|media fixtures?)\b/i, 'media fixture reference'],
    ['supabase_credentials', /\b(?:SUPABASE_(?:URL|ANON|SERVICE|KEY)|supabase\.co|service_role)\b/i, 'Supabase credential or URL'],
    ['provider_credentials', /\b(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_API_KEY|MIRELO|LYRIA|PROVIDER_API_KEY)\b/i, 'provider credential marker'],
    ['signed_or_public_artifacts', /\b(?:signedUrl|signed_url|publicUrl|public_url|artifact write|storage transfer)\b/i, 'signed/public artifact marker'],
    ['unsafe_true_runtime_flags', /\bREEDITPRO_(?:SOUND_CPU_RUNTIME|WORKER_EXECUTION|MEDIA_PROCESSING)_ENABLED\s*=\s*(?:1|true)\b/i, 'unsafe runtime true flag'],
    ['readiness_claims', /\b(?:docker|image|worker|runtime|media|beta|production)\s+readiness\s+(?:passed|ready|enabled|claimed)\b/i, 'readiness claim']
  ];

  const prohibited = prohibitedScans.map(([name, pattern, description]) => {
    const matched = pattern.test(executableDockerfile);
    if (matched) failures.push({ name, blocker: description });
    return { name, passed: !matched, description, matched };
  });

  const result = {
    status: failures.length === 0 ? 'passed' : 'failed',
    decision: failures.length === 0
      ? 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review'
      : 'sound_runtime_media_gate_1h_blocked_static_validation_failure',
    dockerfilePath: DOCKERFILE_PATH,
    requirementsSource: REQUIREMENTS_SOURCE,
    dockerfileExists,
    checks,
    prohibited,
    failures,
    dockerBuildRun: false,
    dockerPushRun: false,
    dockerRunRun: false,
    gcpTouched: false,
    cloudRunTouched: false,
    secretManagerTouched: false,
    workerExecutionRun: false,
    routeExecutionRun: false,
    toolExecutionRun: false,
    mediaProcessingRun: false,
    ffmpegOrFfprobeRun: false,
    modelWeightsDownloaded: false,
    supabaseTouched: false,
    sqlExecuted: false,
    artifactCreated: false
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length > 0) process.exit(1);
}

main();
