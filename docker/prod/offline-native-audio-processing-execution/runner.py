import base64
import hashlib
import io
import json
import math
import os
import random
import struct
import subprocess
import sys
import tempfile
import wave

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 8 * 1024 * 1024
PROTOCOL = 'offline-native-audio-processing-execution-v1'
CONTAINER_PROTOCOL = 'offline-native-audio-processing-execution-container-v1'
OPERATIONS = {'rnnoise': 'tool.rnnoise.denoise_voice.v1', 'signalsmith_stretch': 'tool.signalsmith_stretch.stretch_approved_music_asset.v1'}
PACKAGE_IDENTITIES = {'rnnoise': {'packageName': 'rnnoise+embedded-model', 'version': 'v0.2+0b50c45'}, 'signalsmith_stretch': {'packageName': 'signalsmith-stretch', 'version': '1.1.0'}}
FIXED_ENV = {'HOME': '/tmp', 'LANG': 'C', 'LC_ALL': 'C', 'PATH': '/usr/bin:/bin'}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    tool_id = request['toolId']
    if request['schemaVersion'] != PROTOCOL or tool_id not in OPERATIONS or request['operationId'] != OPERATIONS[tool_id]:
        raise ValueError('request identity is unsupported')
    if tool_id == 'rnnoise':
        payload = exact(request['payload'], ['sampleRate', 'channelMode', 'processingProfileId', 'strength', 'preserveVoice', 'fixtureProfileId'], 'rnnoise payload')
        if payload != {'sampleRate': 48000, 'channelMode': 'mono', 'processingProfileId': 'approved_voice_denoise_v1', 'strength': 1, 'preserveVoice': True, 'fixtureProfileId': 'approved_noisy_voice_fixture_v1'}:
            raise ValueError('rnnoise policy is unsupported')
    else:
        payload = exact(request['payload'], ['stretchProfileId', 'speedRatio', 'pitchSemitones', 'preserveVoice', 'fixtureProfileId'], 'signalsmith payload')
        if payload != {'stretchProfileId': 'approved_music_bed_fit_v1', 'speedRatio': 1.25, 'pitchSemitones': 0, 'preserveVoice': False, 'fixtureProfileId': 'approved_music_tone_fixture_v1'}:
            raise ValueError('signalsmith policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': tool_id, 'operationId': OPERATIONS[tool_id], 'payload': payload}


def run_fixed(arguments, timeout=60):
    result = subprocess.run(arguments, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=FIXED_ENV, timeout=timeout, check=False)
    if result.returncode != 0:
        raise ValueError('fixed native audio command failed')
    return result.stdout, result.stderr


def fixture_samples():
    generator = random.Random(7)
    samples = []
    for index in range(48000):
        time = index / 48000
        speech = (0.33 * math.sin(2 * math.pi * 180 * time) + 0.15 * math.sin(2 * math.pi * 360 * time) + 0.08 * math.sin(2 * math.pi * 720 * time)) if index < 36000 else 0
        noise = generator.uniform(-0.16, 0.16)
        samples.append(max(-32767, min(32767, round((speech + noise) * 32767))))
    return samples


def music_samples():
    return [round((0.34 * math.sin(2 * math.pi * 220 * index / 48000) + 0.17 * math.sin(2 * math.pi * 440 * index / 48000) + 0.08 * math.sin(2 * math.pi * 660 * index / 48000)) * 32767) for index in range(48000)]


def wav_bytes(samples):
    output = io.BytesIO()
    with wave.open(output, 'wb') as audio:
        audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(48000)
        audio.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
    return output.getvalue()


def read_wav(data):
    with wave.open(io.BytesIO(data), 'rb') as audio:
        if audio.getnchannels() != 1 or audio.getsampwidth() != 2 or audio.getframerate() != 48000:
            raise ValueError('wav format is unsupported')
        frames = audio.getnframes(); samples = struct.unpack('<' + 'h' * frames, audio.readframes(frames))
    return frames, samples


def rms(samples):
    return math.sqrt(sum(value * value for value in samples) / max(1, len(samples)))


def execute_rnnoise():
    source_samples = fixture_samples(); source_raw = struct.pack('<' + 'h' * len(source_samples), *source_samples)
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        source = os.path.join(directory, 'approved-noisy-voice.raw'); output = os.path.join(directory, 'approved-denoised-voice.raw')
        with open(source, 'xb') as handle: handle.write(source_raw)
        run_fixed(['/opt/reeditpro-rnnoise/bin/rnnoise_demo', source, output])
        with open(output, 'rb') as handle: output_raw = handle.read(MAXIMUM_ARTIFACT_BYTES + 1)
    if len(output_raw) != 47520 * 2 or output_raw == source_raw[:len(output_raw)]:
        raise ValueError('rnnoise output is invalid')
    output_samples = struct.unpack('<' + 'h' * (len(output_raw) // 2), output_raw)
    input_noise_rms = rms(source_samples[36000:]); output_noise_rms = rms(output_samples[36000:])
    if not 0 < output_noise_rms < input_noise_rms:
        raise ValueError('rnnoise did not reduce fixture noise')
    output_voice_rms = rms(output_samples[:35000])
    if output_voice_rms <= max(100, output_noise_rms * 10):
        raise ValueError('rnnoise did not preserve fixture voice energy')
    data = wav_bytes(output_samples)
    return binary_artifact('audio/wav', data), {'entrypoint': 'rnnoise_demo', 'embeddedModelVersion': '0b50c45', 'embeddedModelHashVerifiedAtBuild': True, 'denoiseExecuted': True, 'inputFrames': 48000, 'outputFrames': len(output_samples), 'algorithmicLatencyFrames': 480, 'inputNoiseRms': round(input_noise_rms, 6), 'outputNoiseRms': round(output_noise_rms, 6), 'outputVoiceRms': round(output_voice_rms, 6), 'noiseReductionVerified': True, 'voiceEnergyPreserved': True, 'preserveVoicePolicyApplied': True}


def execute_signalsmith():
    source = wav_bytes(music_samples())
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        source_path = os.path.join(directory, 'approved-music.wav'); output_path = os.path.join(directory, 'approved-stretched.wav')
        with open(source_path, 'xb') as handle: handle.write(source)
        run_fixed(['/opt/reeditpro-signalsmith-stretch-adapter', source_path, output_path])
        with open(output_path, 'rb') as handle: data = handle.read(MAXIMUM_ARTIFACT_BYTES + 1)
    frames, samples = read_wav(data)
    if frames != 60000 or rms(samples) <= 1:
        raise ValueError('signalsmith output is invalid')
    return binary_artifact('audio/wav', data), {'entrypoint': 'SignalsmithStretch.process', 'timeStretchExecuted': True, 'pitchShiftSemitones': 0, 'speedRatio': 1.25, 'exactLengthApplied': True, 'inputFrames': 48000, 'outputFrames': frames, 'outputRms': round(rms(samples), 6)}


def binary_artifact(mime_type, data):
    if not 44 <= len(data) <= MAXIMUM_ARTIFACT_BYTES: raise ValueError('artifact is outside bounds')
    return {'mimeType': mime_type, 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


try:
    stage = 'REQUEST_VALIDATION_FAILED'; raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES: raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    if request['toolId'] == 'rnnoise': stage = 'RNNOISE_EXECUTION_FAILED'; artifact, semantic = execute_rnnoise()
    else: stage = 'SIGNALSMITH_STRETCH_EXECUTION_FAILED'; artifact, semantic = execute_signalsmith()
    response = {'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': request['toolId'], 'operationId': request['operationId'], 'status': 'actual_native_audio_processing_operation_completed', 'packageIdentity': PACKAGE_IDENTITIES[request['toolId']], 'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(), 'artifact': artifact, 'semanticEvidence': {'actualPackageEntrypointExecuted': True, **semantic, 'zeroNetworkRuntimeRequired': True}, 'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False}}
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private native audio processing execution failed.\n'); sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':'))); sys.exit(3)
