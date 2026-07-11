import base64
import hashlib
import importlib
import importlib.metadata
import io
import json
import math
import os
import sys
import wave

_stdout_fd = os.dup(1)
_stderr_fd = os.dup(2)
_devnull_fd = os.open('/dev/null', os.O_WRONLY)
try:
    os.dup2(_devnull_fd, 1)
    os.dup2(_devnull_fd, 2)
    import numpy as np
    import torch
    import torchaudio
    import df.logger as df_logger
    enhance_module = importlib.import_module('df.enhance')
finally:
    os.dup2(_stdout_fd, 1)
    os.dup2(_stderr_fd, 2)
    os.close(_stdout_fd)
    os.close(_stderr_fd)
    os.close(_devnull_fd)

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 2 * 1024 * 1024
PROTOCOL = 'offline-deepfilternet-voice-cleanup-execution-v1'
CONTAINER_PROTOCOL = 'offline-deepfilternet-voice-cleanup-execution-container-v1'
TOOL_ID = 'deepfilternet'
OPERATION_ID = 'tool.deepfilternet.enhance_voice.v1'
MODEL_DIRECTORY = '/opt/reeditpro-models/DeepFilterNet3'
FIXTURE_PATH = '/opt/reeditpro-fixtures/approved-voice.wav'
MODEL_ARCHIVE_SHA256 = '49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2'
MODEL_CHECKPOINT_SHA256 = '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003'
MODEL_CONFIG_SHA256 = '415eb925d44990d938fb739f514aa3662c1ec0ea836cff044fa1291b82cb4290'
FIXTURE_SHA256 = 'db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec'
PACKAGE_IDENTITY = {'packageName': 'DeepFilterNet', 'version': '0.5.6', 'nativePackageName': 'DeepFilterLib', 'nativePackageVersion': '0.5.6', 'torchVersion': '2.2.2', 'torchaudioVersion': '2.2.2'}
MODEL_IDENTITY = {'modelId': 'DeepFilterNet3', 'archiveSha256': MODEL_ARCHIVE_SHA256, 'checkpointSha256': MODEL_CHECKPOINT_SHA256, 'configSha256': MODEL_CONFIG_SHA256, 'upstreamLicense': 'MIT', 'productionLicenseReviewRequired': True}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    if request['schemaVersion'] != PROTOCOL or request['toolId'] != TOOL_ID or request['operationId'] != OPERATION_ID:
        raise ValueError('request identity is unsupported')
    payload = exact(request['payload'], ['attenuationLimitDb', 'cleanupProfileId', 'preserveNaturalVoice', 'postFilterEnabled'], 'payload')
    expected = {'attenuationLimitDb': 12, 'cleanupProfileId': 'approved_gentle_voice_cleanup_v1', 'preserveNaturalVoice': True, 'postFilterEnabled': False}
    if payload != expected:
        raise ValueError('voice-cleanup policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'payload': expected}


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def load_fixture():
    if file_sha256(FIXTURE_PATH) != FIXTURE_SHA256:
        raise ValueError('approved voice fixture identity changed')
    with wave.open(FIXTURE_PATH, 'rb') as wav:
        if wav.getnchannels() != 1 or wav.getsampwidth() != 2:
            raise ValueError('approved voice fixture format changed')
        source_rate = wav.getframerate()
        source_frames = wav.getnframes()
        pcm = np.frombuffer(wav.readframes(source_frames), dtype='<i2').astype(np.float32) / 32768.0
    target_rate = 48000
    target_frames = int(round(source_frames * target_rate / source_rate))
    positions = np.linspace(0.0, source_frames - 1.0, target_frames, dtype=np.float64)
    clean = np.interp(positions, np.arange(source_frames, dtype=np.float64), pcm.astype(np.float64)).astype(np.float32)
    rng = np.random.default_rng(20260711)
    white = rng.normal(0.0, 0.055, target_frames).astype(np.float32)
    hum_phase = np.arange(target_frames, dtype=np.float32) / target_rate
    hum = (0.018 * np.sin(2.0 * math.pi * 120.0 * hum_phase)).astype(np.float32)
    noisy = np.clip(clean * 0.72 + white + hum, -0.98, 0.98).astype(np.float32)
    return clean, noisy, source_rate, target_rate


def snr_db(reference, candidate):
    signal = float(np.mean(np.square(reference.astype(np.float64))))
    error = float(np.mean(np.square(reference.astype(np.float64) - candidate.astype(np.float64))))
    return round(10.0 * math.log10(max(signal, 1e-12) / max(error, 1e-12)), 6)


def encode_wav(samples, sample_rate):
    normalized = np.clip(samples, -1.0, 1.0)
    pcm = np.round(normalized * 32767.0).astype('<i2')
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())
    return buffer.getvalue()


def execute(request):
    if importlib.metadata.version('DeepFilterNet') != '0.5.6' or importlib.metadata.version('DeepFilterLib') != '0.5.6' or torch.__version__ != '2.2.2' or torchaudio.__version__ != '2.2.2':
        raise ValueError('package identity changed')
    if file_sha256(f'{MODEL_DIRECTORY}/config.ini') != MODEL_CONFIG_SHA256 or file_sha256(f'{MODEL_DIRECTORY}/checkpoints/model_120.ckpt.best') != MODEL_CHECKPOINT_SHA256:
        raise ValueError('model identity changed')
    torch.manual_seed(20260711)
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    torch.use_deterministic_algorithms(True)
    df_logger.get_commit_hash = lambda: None
    df_logger.get_branch_name = lambda: None
    clean, noisy, source_rate, sample_rate = load_fixture()
    original_stdout = os.dup(1)
    original_stderr = os.dup(2)
    devnull = os.open('/dev/null', os.O_WRONLY)
    try:
        os.dup2(devnull, 1)
        os.dup2(devnull, 2)
        model, df_state, _ = enhance_module.init_df(model_base_dir=MODEL_DIRECTORY, post_filter=False, log_level='ERROR', log_file=None, config_allow_defaults=True)
        if int(df_state.sr()) != sample_rate:
            raise ValueError('DeepFilterNet sample rate changed')
        enhanced_tensor = enhance_module.enhance(model, df_state, torch.from_numpy(noisy).unsqueeze(0), pad=True, atten_lim_db=float(request['payload']['attenuationLimitDb']))
    finally:
        os.dup2(original_stdout, 1)
        os.dup2(original_stderr, 2)
        os.close(original_stdout)
        os.close(original_stderr)
        os.close(devnull)
    enhanced = enhanced_tensor.detach().cpu().numpy().reshape(-1).astype(np.float32)
    if enhanced.shape != noisy.shape or not np.isfinite(enhanced).all():
        raise ValueError('DeepFilterNet output contract is invalid')
    input_snr = snr_db(clean, noisy)
    output_snr = snr_db(clean, enhanced)
    input_rms = round(float(np.sqrt(np.mean(np.square(noisy.astype(np.float64))))), 9)
    output_rms = round(float(np.sqrt(np.mean(np.square(enhanced.astype(np.float64))))), 9)
    mean_abs_delta = round(float(np.mean(np.abs(enhanced.astype(np.float64) - noisy.astype(np.float64)))), 9)
    if mean_abs_delta <= 0.0001 or output_rms <= 0.0001 or float(np.max(np.abs(enhanced))) > 1.1:
        raise ValueError('DeepFilterNet bounded audio QA failed')
    data = encode_wav(enhanced, sample_rate)
    if not 1000 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    artifact = {'mimeType': 'audio/wav', 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    semantic = {'actualPackageEntrypointExecuted': True, 'entrypoint': 'df.enhance.enhance', 'modelId': 'DeepFilterNet3', 'modelArchiveSha256': MODEL_ARCHIVE_SHA256, 'modelCheckpointSha256': MODEL_CHECKPOINT_SHA256, 'modelConfigSha256': MODEL_CONFIG_SHA256, 'fixtureSha256': FIXTURE_SHA256, 'sourceFixtureSampleRate': source_rate, 'executionSampleRate': sample_rate, 'sampleCount': int(enhanced.size), 'inputSnrDb': input_snr, 'outputSnrDb': output_snr, 'inputRms': input_rms, 'outputRms': output_rms, 'meanAbsoluteDelta': mean_abs_delta, 'finiteOutputVerified': True, 'sampleCountPreserved': True, 'gentleAttenuationLimitDb': 12, 'postFilterEnabled': False, 'serverOwnedFixtureOnly': True, 'callerMediaAllowed': False, 'callerModelAllowed': False, 'runtimeModelDownloadAllowed': False, 'cpuExecutionOnly': True, 'zeroNetworkRuntimeRequired': True}
    return artifact, semantic


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'DEEPFILTERNET_VOICE_CLEANUP_EXECUTION_FAILED'
    artifact, semantic = execute(request)
    response = {'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'status': 'actual_deepfilternet_voice_cleanup_completed', 'packageIdentity': PACKAGE_IDENTITY, 'modelIdentity': MODEL_IDENTITY, 'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(), 'artifact': artifact, 'semanticEvidence': semantic, 'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False}}
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private DeepFilterNet voice-cleanup execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
