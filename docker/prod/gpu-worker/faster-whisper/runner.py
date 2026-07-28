import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import re
import stat
import sys
import wave


REQUEST_VERSION = 'canonical-faster-whisper-gpu-runtime-request-v1'
RESPONSE_VERSION = 'canonical-faster-whisper-gpu-runtime-response-v1'
OPERATION_ID = 'tool.faster_whisper.transcribe_private_audio.v1'
SOURCE_AUDIO_PATH = Path('/mnt/reeditpro/private-input/source.wav')
MODEL_DIRECTORY = Path(
    '/mnt/reeditpro/model-artifacts/faster-whisper-small'
)
PRIVATE_OUTPUT_DIRECTORY = Path('/mnt/reeditpro/private-output')
MAXIMUM_REQUEST_BYTES = 65_536
MAXIMUM_SOURCE_AUDIO_BYTES = 2_147_483_648
MAXIMUM_SOURCE_DURATION_MILLISECONDS = 7_200_000
MAXIMUM_SINGLE_OUTPUT_BYTES = 32 * 1_024 * 1_024
MAXIMUM_COMBINED_OUTPUT_BYTES = 64 * 1_024 * 1_024
DIGEST_PATTERN = re.compile(r'^[a-f0-9]{64}$')
SAFE_ID_PATTERN = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$')

PACKAGE_VERSIONS = {
    'faster-whisper': '1.2.1',
    'ctranslate2': '4.6.2',
    'numpy': '1.26.4',
    'av': '14.2.0',
    'onnxruntime': '1.16.3',
}

MODEL_FILES = (
    {
        'canonicalOrder': 0,
        'slotId': 'faster_whisper_config',
        'fileName': 'config.json',
        'byteLength': 2_370,
        'contentSha256':
            'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828',
    },
    {
        'canonicalOrder': 1,
        'slotId': 'faster_whisper_model',
        'fileName': 'model.bin',
        'byteLength': 483_546_902,
        'contentSha256':
            '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671',
    },
    {
        'canonicalOrder': 2,
        'slotId': 'faster_whisper_tokenizer',
        'fileName': 'tokenizer.json',
        'byteLength': 2_203_239,
        'contentSha256':
            'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
    },
    {
        'canonicalOrder': 3,
        'slotId': 'faster_whisper_vocabulary',
        'fileName': 'vocabulary.txt',
        'byteLength': 459_861,
        'contentSha256':
            '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
    },
)

SETTINGS = {
    'device': 'cuda',
    'computeType': 'float16',
    'beamSize': 5,
    'wordTimestamps': True,
    'vadFilter': True,
    'languagePolicy': 'auto_detect_v1',
    'temperature': 0,
    'conditionOnPreviousText': True,
}

OUTPUT_FILES = (
    ('transcript_json', 'transcript.json'),
    ('caption_segments_json', 'caption-segments.json'),
    ('analysis_report', 'analysis-report.json'),
)


def exact_object(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def exact_digest(value, label):
    if not isinstance(value, str) or DIGEST_PATTERN.fullmatch(value) is None:
        raise ValueError(f'{label} is invalid')
    return value


def exact_id(value, label):
    if (
        not isinstance(value, str)
        or SAFE_ID_PATTERN.fullmatch(value) is None
        or '..' in value
    ):
        raise ValueError(f'{label} is invalid')
    return value


def exact_positive_integer(value, maximum, label):
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < 1
        or value > maximum
    ):
        raise ValueError(f'{label} is invalid')
    return value


def validate_request(value):
    request = exact_object(
        value,
        [
            'schemaVersion',
            'operationId',
            'admissionDigestSha256',
            'dispatch',
            'source',
            'modelArtifacts',
            'settings',
            'requestBindingSha256',
        ],
        'request',
    )
    if (
        request['schemaVersion'] != REQUEST_VERSION
        or request['operationId'] != OPERATION_ID
    ):
        raise ValueError('request identity is unsupported')
    exact_digest(
        request['admissionDigestSha256'],
        'admission digest',
    )
    dispatch = exact_object(
        request['dispatch'],
        [
            'dispatchIntentId',
            'dispatchBindingHash',
            'attemptPlanHash',
            'runtimeRegion',
        ],
        'dispatch',
    )
    exact_id(dispatch['dispatchIntentId'], 'dispatch intent')
    exact_digest(dispatch['dispatchBindingHash'], 'dispatch binding')
    exact_digest(dispatch['attemptPlanHash'], 'attempt plan')
    if dispatch['runtimeRegion'] != 'europe-west1':
        raise ValueError('runtime region is not admitted for L4')
    source = exact_object(
        request['source'],
        [
            'artifactId',
            'contentSha256',
            'byteLength',
            'durationMilliseconds',
            'contentType',
            'sampleRateHz',
            'channelCount',
            'sampleFormat',
        ],
        'source',
    )
    exact_id(source['artifactId'], 'source artifact')
    exact_digest(source['contentSha256'], 'source digest')
    exact_positive_integer(
        source['byteLength'],
        MAXIMUM_SOURCE_AUDIO_BYTES,
        'source byte length',
    )
    exact_positive_integer(
        source['durationMilliseconds'],
        MAXIMUM_SOURCE_DURATION_MILLISECONDS,
        'source duration',
    )
    if {
        'contentType': source['contentType'],
        'sampleRateHz': source['sampleRateHz'],
        'channelCount': source['channelCount'],
        'sampleFormat': source['sampleFormat'],
    } != {
        'contentType': 'audio/wav',
        'sampleRateHz': 16_000,
        'channelCount': 1,
        'sampleFormat': 'pcm_s16le',
    }:
        raise ValueError('source audio format is unsupported')
    if request['settings'] != SETTINGS:
        raise ValueError('runtime settings are unsupported')
    if request['modelArtifacts'] != list(MODEL_FILES):
        raise ValueError('model artifact set is unsupported')
    request_binding = exact_digest(
        request['requestBindingSha256'],
        'request binding',
    )
    request_without_binding = {
        key: nested
        for key, nested in request.items()
        if key != 'requestBindingSha256'
    }
    expected_request_binding = hashlib.sha256(
        json.dumps(
            request_without_binding,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=True,
            allow_nan=False,
        ).encode('utf-8')
    ).hexdigest()
    if request_binding != expected_request_binding:
        raise ValueError('runtime request binding changed')
    return request


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        while True:
            chunk = handle.read(1_024 * 1_024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def assert_regular_file(path, expected_bytes, expected_sha256, label):
    metadata = path.lstat()
    if (
        not stat.S_ISREG(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
        or metadata.st_size != expected_bytes
        or file_sha256(path) != expected_sha256
    ):
        raise ValueError(f'{label} identity changed')


def validate_model_files():
    metadata = MODEL_DIRECTORY.lstat()
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        raise ValueError('model directory is invalid')
    names = sorted(path.name for path in MODEL_DIRECTORY.iterdir())
    expected_names = sorted(item['fileName'] for item in MODEL_FILES)
    if names != expected_names:
        raise ValueError('model directory contains an unsupported file set')
    for item in MODEL_FILES:
        assert_regular_file(
            MODEL_DIRECTORY / item['fileName'],
            item['byteLength'],
            item['contentSha256'],
            item['slotId'],
        )


def validate_source_audio(source):
    assert_regular_file(
        SOURCE_AUDIO_PATH,
        source['byteLength'],
        source['contentSha256'],
        'source audio',
    )
    with wave.open(str(SOURCE_AUDIO_PATH), 'rb') as wav:
        if (
            wav.getnchannels() != 1
            or wav.getsampwidth() != 2
            or wav.getframerate() != 16_000
            or wav.getcomptype() != 'NONE'
        ):
            raise ValueError('source WAV structure is unsupported')
        duration_milliseconds = round(
            wav.getnframes() * 1_000 / wav.getframerate()
        )
    if abs(duration_milliseconds - source['durationMilliseconds']) > 1:
        raise ValueError('source WAV duration changed')


def validate_output_directory():
    metadata = PRIVATE_OUTPUT_DIRECTORY.lstat()
    if (
        not stat.S_ISDIR(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
    ):
        raise ValueError('private output directory is invalid')
    if any(PRIVATE_OUTPUT_DIRECTORY.iterdir()):
        raise ValueError('private output directory must begin empty')


def validate_packages_and_gpu():
    for package_name, expected_version in PACKAGE_VERSIONS.items():
        if importlib.metadata.version(package_name) != expected_version:
            raise ValueError('runtime package identity changed')
    import ctranslate2

    if ctranslate2.get_cuda_device_count() < 1:
        raise ValueError('CUDA device is unavailable')
    supported = ctranslate2.get_supported_compute_types('cuda', 0)
    if 'float16' not in supported:
        raise ValueError('CUDA float16 is unavailable')
    return ctranslate2


def safe_float(value, digits=8):
    numeric = float(value)
    if not math.isfinite(numeric):
        raise ValueError('inference returned a non-finite value')
    return round(numeric, digits)


def milliseconds(value):
    numeric = safe_float(value, 6)
    if numeric < 0:
        raise ValueError('inference returned a negative timestamp')
    return round(numeric * 1_000)


def normalize_word(word):
    start = milliseconds(word.start)
    end = milliseconds(word.end)
    if end < start:
        raise ValueError('word timestamps are reversed')
    return {
        'startMilliseconds': start,
        'endMilliseconds': end,
        'text': str(word.word),
        'probability': safe_float(word.probability),
    }


def normalize_segment(segment):
    start = milliseconds(segment.start)
    end = milliseconds(segment.end)
    if end < start:
        raise ValueError('segment timestamps are reversed')
    words = [normalize_word(word) for word in (segment.words or [])]
    return {
        'id': int(segment.id),
        'seek': int(segment.seek),
        'startMilliseconds': start,
        'endMilliseconds': end,
        'text': str(segment.text),
        'averageLogProbability': safe_float(segment.avg_logprob),
        'compressionRatio': safe_float(segment.compression_ratio),
        'noSpeechProbability': safe_float(segment.no_speech_prob),
        'words': words,
    }


def run_inference(request):
    from faster_whisper import WhisperModel

    model = WhisperModel(
        str(MODEL_DIRECTORY),
        device='cuda',
        compute_type='float16',
        cpu_threads=0,
        num_workers=1,
        local_files_only=True,
    )
    generator, info = model.transcribe(
        str(SOURCE_AUDIO_PATH),
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
        language=None,
        temperature=0.0,
        condition_on_previous_text=True,
    )
    segments = [normalize_segment(segment) for segment in generator]
    if len(segments) > 100_000:
        raise ValueError('inference returned too many segments')
    word_count = sum(len(segment['words']) for segment in segments)
    if word_count > 1_000_000:
        raise ValueError('inference returned too many words')
    full_text = ''.join(segment['text'] for segment in segments).strip()
    transcript = {
        'schemaVersion': 'faster-whisper-word-timed-transcript-json-v1',
        'operationId': OPERATION_ID,
        'sourceArtifactId': request['source']['artifactId'],
        'sourceContentSha256': request['source']['contentSha256'],
        'language': str(info.language),
        'languageProbability': safe_float(info.language_probability),
        'durationMilliseconds': milliseconds(info.duration),
        'durationAfterVadMilliseconds': milliseconds(
            info.duration_after_vad
        ),
        'text': full_text,
        'segments': segments,
    }
    captions = {
        'schemaVersion': 'faster-whisper-caption-segments-json-v1',
        'operationId': OPERATION_ID,
        'sourceArtifactId': request['source']['artifactId'],
        'segments': [
            {
                'canonicalOrder': index,
                'startMilliseconds': segment['startMilliseconds'],
                'endMilliseconds': segment['endMilliseconds'],
                'text': segment['text'].strip(),
            }
            for index, segment in enumerate(segments)
            if segment['text'].strip()
        ],
    }
    analysis = {
        'schemaVersion':
            'faster-whisper-transcription-analysis-report-json-v1',
        'operationId': OPERATION_ID,
        'admissionDigestSha256': request['admissionDigestSha256'],
        'dispatchIntentId': request['dispatch']['dispatchIntentId'],
        'sourceArtifactId': request['source']['artifactId'],
        'sourceContentSha256': request['source']['contentSha256'],
        'modelRevision':
            '536b0662742c02347bc0e980a01041f333bce120',
        'fasterWhisperVersion': PACKAGE_VERSIONS['faster-whisper'],
        'ctranslate2Version': PACKAGE_VERSIONS['ctranslate2'],
        'device': 'cuda',
        'computeType': 'float16',
        'language': str(info.language),
        'languageProbability': safe_float(info.language_probability),
        'segmentCount': len(segments),
        'wordCount': word_count,
        'textCharacterCount': len(full_text),
        'sourceBytesVerified': True,
        'modelArtifactBytesVerified': True,
        'cudaDeviceVerified': True,
        'cpuFallbackAllowed': False,
        'runtimeDownloadAllowed': False,
        'networkFetchAllowed': False,
    }
    return {
        'transcript_json': transcript,
        'caption_segments_json': captions,
        'analysis_report': analysis,
    }


def stable_json_bytes(value):
    encoded = json.dumps(
        value,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
        allow_nan=False,
    ).encode('utf-8')
    if (
        len(encoded) < 2
        or len(encoded) > MAXIMUM_SINGLE_OUTPUT_BYTES
    ):
        raise ValueError('private output is outside bounds')
    return encoded


def write_private_outputs(outputs):
    encoded_outputs = [
        (
            canonical_order,
            artifact_kind,
            file_name,
            stable_json_bytes(outputs[artifact_kind]),
        )
        for canonical_order, (artifact_kind, file_name) in enumerate(
            OUTPUT_FILES
        )
    ]
    if (
        sum(len(data) for _, _, _, data in encoded_outputs)
        > MAXIMUM_COMBINED_OUTPUT_BYTES
    ):
        raise ValueError('combined private output is outside bounds')
    receipts = []
    for canonical_order, artifact_kind, file_name, data in encoded_outputs:
        destination = PRIVATE_OUTPUT_DIRECTORY / file_name
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        if hasattr(os, 'O_NOFOLLOW'):
            flags |= os.O_NOFOLLOW
        descriptor = os.open(destination, flags, 0o600)
        try:
            with os.fdopen(descriptor, 'wb', closefd=False) as handle:
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
        finally:
            os.close(descriptor)
        receipts.append({
            'canonicalOrder': canonical_order,
            'artifactKind': artifact_kind,
            'fileName': file_name,
            'byteLength': len(data),
            'contentSha256': hashlib.sha256(data).hexdigest(),
        })
    return receipts


def success_response(request, ctranslate2, outputs):
    return {
        'schemaVersion': RESPONSE_VERSION,
        'ok': True,
        'status': 'controlled_faster_whisper_gpu_inference_completed',
        'operationId': OPERATION_ID,
        'admissionDigestSha256': request['admissionDigestSha256'],
        'requestBindingSha256': request['requestBindingSha256'],
        'dispatchIntentId': request['dispatch']['dispatchIntentId'],
        'runtimeIdentity': {
            'fasterWhisperVersion': PACKAGE_VERSIONS['faster-whisper'],
            'ctranslate2Version': PACKAGE_VERSIONS['ctranslate2'],
            'cudaDeviceCount': ctranslate2.get_cuda_device_count(),
            'device': 'cuda',
            'computeType': 'float16',
            'runtimeRegion': 'europe-west1',
        },
        'outputs': outputs,
        'receiptBoundaries': {
            'outputBytesIncluded': False,
            'transcriptTextIncluded': False,
            'sourceBytesIncluded': False,
            'modelBytesIncluded': False,
            'pathsIncluded': False,
            'urlsIncluded': False,
            'credentialsIncluded': False,
            'cpuFallbackAllowed': False,
            'runtimeDownloadAllowed': False,
            'networkFetchAllowed': False,
            'artifactCommitAuthority': False,
            'qaPassAuthority': False,
            'productionReady': False,
        },
    }


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw_request = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw_request) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request_value = json.loads(raw_request.decode('utf-8'))
    request = validate_request(request_value)

    stage = 'MODEL_ARTIFACT_VALIDATION_FAILED'
    validate_model_files()

    stage = 'PRIVATE_AUDIO_VALIDATION_FAILED'
    validate_source_audio(request['source'])
    validate_output_directory()

    stage = 'CUDA_PREFLIGHT_FAILED'
    ctranslate2_module = validate_packages_and_gpu()

    stage = 'FASTER_WHISPER_INFERENCE_FAILED'
    output_values = run_inference(request)

    stage = 'PRIVATE_OUTPUT_WRITE_FAILED'
    output_receipts = write_private_outputs(output_values)

    sys.stdout.write(json.dumps(
        success_response(
            request,
            ctranslate2_module,
            output_receipts,
        ),
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
    ))
except Exception:
    sys.stderr.write('Private Faster Whisper GPU execution failed.\n')
    sys.stdout.write(json.dumps(
        {
            'schemaVersion': RESPONSE_VERSION,
            'ok': False,
            'code': stage
            if 'stage' in locals()
            else 'GPU_RUNTIME_EXECUTION_FAILED',
        },
        separators=(',', ':'),
    ))
    sys.exit(3)
