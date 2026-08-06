import base64
import hashlib
import json
import sys

import audioflux as af
import numpy as np
from audioflux.type import SpectralDataType, SpectralFilterBankScaleType

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
PROTOCOL = 'offline-audioflux-analysis-execution-v1'
CONTAINER_PROTOCOL = 'offline-audioflux-analysis-execution-container-v1'
TOOL_ID = 'audioflux'
OPERATION_ID = 'tool.audioflux.analyze_beat_and_energy.v1'
PACKAGE_IDENTITY = {
    'packageName': 'audioflux',
    'version': '0.1.9',
    'sourceSha256': '538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b',
    'nativeArchitecture': 'linux_arm64_source_build',
}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    if request['schemaVersion'] != PROTOCOL or request['toolId'] != TOOL_ID or request['operationId'] != OPERATION_ID:
        raise ValueError('request identity is unsupported')
    payload = exact(request['payload'], ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold'], 'payload')
    expected = {
        'sampleRate': 16000,
        'channelMode': 'mono',
        'analysisProfileId': 'approved_server_owned_beat_energy_fixture_v1',
        'confidenceThreshold': 0.75,
    }
    if payload != expected:
        raise ValueError('audio analysis policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'payload': expected}


def rounded(value):
    return round(float(value), 8)


def execute():
    sample_rate = 16000
    sample_count = sample_rate * 2
    time = np.arange(sample_count, dtype=np.float32) / np.float32(sample_rate)
    audio = (np.sin(np.float32(2 * np.pi * 220) * time) * np.float32(0.08)).astype(np.float32)
    pulse_width = 160
    pulse = np.hanning(pulse_width).astype(np.float32) * np.float32(0.8)
    pulse_samples = [4000, 8000, 12000, 16000, 20000, 24000, 28000]
    for start in pulse_samples:
        audio[start:start + pulse_width] += pulse
    audio = np.ascontiguousarray(audio, dtype=np.float32)

    bft = af.BFT(
        num=257,
        radix2_exp=9,
        samplate=sample_rate,
        slide_length=128,
        scale_type=SpectralFilterBankScaleType.LINEAR,
        data_type=SpectralDataType.MAG,
        is_temporal=True,
    )
    spectrum = np.abs(bft.bft(audio)).astype(np.float32)
    spectral = af.Spectral(num=bft.num, fre_band_arr=bft.get_fre_band_arr())
    spectral.set_time_length(spectrum.shape[-1])
    flux = np.asarray(spectral.flux(spectrum, step=1, p=2, is_positive=True), dtype=np.float32)
    spectral_energy = np.asarray(spectral.energy(spectrum), dtype=np.float32)
    temporal_energy, rms, zero_crossing_rate = bft.get_temporal_data()
    temporal_energy = np.asarray(temporal_energy, dtype=np.float32)
    rms = np.asarray(rms, dtype=np.float32)
    zero_crossing_rate = np.asarray(zero_crossing_rate, dtype=np.float32)

    if spectrum.shape[0] != 257 or spectrum.shape[1] < 200:
        raise ValueError('BFT result shape is invalid')
    if not (len(flux) == len(spectral_energy) == len(temporal_energy) == len(rms) == len(zero_crossing_rate) == spectrum.shape[1]):
        raise ValueError('analysis feature lengths are inconsistent')
    if not all(np.all(np.isfinite(value)) for value in [spectrum, flux, spectral_energy, temporal_energy, rms, zero_crossing_rate]):
        raise ValueError('analysis contains non-finite values')

    strongest_flux_frames = np.argsort(flux)[-8:][::-1].astype(int).tolist()
    document = {
        'analysisProfileId': 'approved_server_owned_beat_energy_fixture_v1',
        'audioFixture': {
            'channelMode': 'mono',
            'durationSamples': sample_count,
            'pulseSamples': pulse_samples,
            'sampleRate': sample_rate,
            'sha256': hashlib.sha256(audio.tobytes()).hexdigest(),
        },
        'bft': {
            'frequencyBins': int(spectrum.shape[0]),
            'frameCount': int(spectrum.shape[1]),
            'fftLength': 512,
            'slideLength': 128,
        },
        'features': {
            'fluxMaximum': rounded(np.max(flux)),
            'fluxMean': rounded(np.mean(flux)),
            'rmsMaximum': rounded(np.max(rms)),
            'spectralEnergyMaximum': rounded(np.max(spectral_energy)),
            'temporalEnergyMaximum': rounded(np.max(temporal_energy)),
            'zeroCrossingRateMean': rounded(np.mean(zero_crossing_rate)),
        },
        'strongestFluxFrames': strongest_flux_frames,
    }
    data = json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    if not 2 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    artifact = {
        'mimeType': 'application/json',
        'bytesBase64': base64.b64encode(data).decode('ascii'),
        'byteLength': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
    }
    semantic = {
        'actualPackageEntrypointExecuted': True,
        'entrypoint': 'audioflux.BFT+audioflux.Spectral.flux+energy',
        'bftExecuted': True,
        'spectralFluxExecuted': True,
        'spectralEnergyExecuted': True,
        'temporalEnergyExecuted': True,
        'serverOwnedFixtureOnly': True,
        'callerMediaAllowed': False,
        'sourceBuiltNativeLibrary': True,
        'frameCount': int(spectrum.shape[1]),
        'frequencyBins': int(spectrum.shape[0]),
        'sampleRate': sample_rate,
        'zeroNetworkRuntimeRequired': True,
    }
    return artifact, semantic


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'AUDIOFLUX_ANALYSIS_EXECUTION_FAILED'
    artifact, semantic = execute()
    response = {
        'schemaVersion': CONTAINER_PROTOCOL,
        'ok': True,
        'toolId': TOOL_ID,
        'operationId': OPERATION_ID,
        'status': 'actual_audioflux_analysis_operation_completed',
        'packageIdentity': PACKAGE_IDENTITY,
        'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(),
        'artifact': artifact,
        'semanticEvidence': semantic,
        'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False},
    }
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private AudioFlux analysis execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
