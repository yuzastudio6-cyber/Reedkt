import hashlib
import importlib.metadata
import io
import json
import os
from pathlib import Path
import re
import stat
import sys


REQUEST_VERSION = 'canonical-rembg-gpu-runtime-request-v1'
RESPONSE_VERSION = 'canonical-rembg-gpu-runtime-response-v1'
OPERATION_ID = 'tool.rembg.remove_image_background.v1'
SOURCE_FRAME_PATH = Path(
    '/mnt/reeditpro/private-input/source-frame.png'
)
MODEL_DIRECTORY = Path(
    '/mnt/reeditpro/model-artifacts/rembg-u2netp'
)
MODEL_PATH = MODEL_DIRECTORY / 'u2netp.onnx'
PRIVATE_OUTPUT_DIRECTORY = Path('/mnt/reeditpro/private-output')
MASK_OUTPUT_PATH = PRIVATE_OUTPUT_DIRECTORY / 'mask.png'
ANALYSIS_OUTPUT_PATH = (
    PRIVATE_OUTPUT_DIRECTORY / 'mask-analysis.json'
)
QA_OUTPUT_PATH = (
    PRIVATE_OUTPUT_DIRECTORY / 'mask-qa-measurement.json'
)
MAXIMUM_REQUEST_BYTES = 65_536
MAXIMUM_SOURCE_BYTES = 16_777_216
MAXIMUM_SOURCE_DIMENSION = 4_096
MAXIMUM_SOURCE_PIXELS = 16_777_216
MAXIMUM_MASK_BYTES = 16_777_216
MAXIMUM_EVIDENCE_BYTES = 65_536
DIGEST_PATTERN = re.compile(r'^[a-f0-9]{64}$')
SAFE_ID_PATTERN = re.compile(
    r'^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$'
)
MODEL_FILE = {
    'canonicalOrder': 0,
    'slotId': 'rembg_u2netp_onnx',
    'fileName': 'u2netp.onnx',
    'byteLength': 4_574_861,
    'contentSha256':
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
}
SETTINGS = {
    'device': 'cuda',
    'modelId': 'u2netp',
    'outputMode': 'mask_only_png',
    'confidenceThreshold': 0.5,
    'alphaMatteMode': 'straight',
    'edgeRefinementProfileId': 'approved_u2netp_default_v1',
    'maximumSubjects': 1,
    'preserveSourceDimensions': True,
    'runtimeDownloadAllowed': False,
    'networkFetchAllowed': False,
}
PACKAGE_VERSIONS = {
    'rembg': '2.0.76',
    'onnxruntime-gpu': '1.27.0',
    'numpy': '2.4.6',
    'pillow': '12.3.0',
}
stage = 'REQUEST_VALIDATION_FAILED'


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
            'contentType',
            'width',
            'height',
            'decodedRgbaSha256',
            'opaquePixelCount',
        ],
        'source',
    )
    exact_id(source['artifactId'], 'source artifact')
    exact_digest(source['contentSha256'], 'source digest')
    exact_positive_integer(
        source['byteLength'],
        MAXIMUM_SOURCE_BYTES,
        'source byte length',
    )
    width = exact_positive_integer(
        source['width'],
        MAXIMUM_SOURCE_DIMENSION,
        'source width',
    )
    height = exact_positive_integer(
        source['height'],
        MAXIMUM_SOURCE_DIMENSION,
        'source height',
    )
    if (
        width * height > MAXIMUM_SOURCE_PIXELS
        or source['contentType'] != 'image/png'
        or source['opaquePixelCount'] != width * height
    ):
        raise ValueError('source image contract is unsupported')
    exact_digest(
        source['decodedRgbaSha256'],
        'source decoded RGBA digest',
    )
    if request['modelArtifacts'] != [MODEL_FILE]:
        raise ValueError('model artifact set is unsupported')
    if request['settings'] != SETTINGS:
        raise ValueError('runtime settings are unsupported')
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


def assert_regular_file(
    path,
    expected_bytes,
    expected_sha256,
    label,
):
    metadata = path.lstat()
    if (
        not stat.S_ISREG(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
        or metadata.st_size != expected_bytes
        or file_sha256(path) != expected_sha256
    ):
        raise ValueError(f'{label} identity changed')


def validate_model_file():
    metadata = MODEL_DIRECTORY.lstat()
    if (
        not stat.S_ISDIR(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
    ):
        raise ValueError('model directory is invalid')
    names = sorted(path.name for path in MODEL_DIRECTORY.iterdir())
    if names != [MODEL_FILE['fileName']]:
        raise ValueError('model directory file set is unsupported')
    assert_regular_file(
        MODEL_PATH,
        MODEL_FILE['byteLength'],
        MODEL_FILE['contentSha256'],
        MODEL_FILE['slotId'],
    )


def validate_source_structure(source):
    assert_regular_file(
        SOURCE_FRAME_PATH,
        source['byteLength'],
        source['contentSha256'],
        'source frame',
    )
    with SOURCE_FRAME_PATH.open('rb') as handle:
        header = handle.read(33)
    if (
        len(header) != 33
        or header[:8] != b'\x89PNG\r\n\x1a\n'
        or header[12:16] != b'IHDR'
        or int.from_bytes(header[16:20], 'big') != source['width']
        or int.from_bytes(header[20:24], 'big') != source['height']
        or header[24] != 8
        or header[25] != 6
        or header[28] != 0
    ):
        raise ValueError('source frame PNG structure changed')


def validate_output_directory():
    metadata = PRIVATE_OUTPUT_DIRECTORY.lstat()
    if (
        not stat.S_ISDIR(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
        or any(PRIVATE_OUTPUT_DIRECTORY.iterdir())
    ):
        raise ValueError('private output directory must begin empty')


def stable_json_bytes(value):
    return json.dumps(
        value,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
        allow_nan=False,
    ).encode('utf-8')


def write_exclusive(path, value, maximum_bytes, label):
    if len(value) < 1 or len(value) > maximum_bytes:
        raise ValueError(f'{label} exceeds its output ceiling')
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
        0o600,
    )
    try:
        with os.fdopen(descriptor, 'wb') as handle:
            descriptor = None
            handle.write(value)
            handle.flush()
            os.fsync(handle.fileno())
    finally:
        if descriptor is not None:
            os.close(descriptor)
    metadata = path.lstat()
    if (
        not stat.S_ISREG(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
        or metadata.st_size != len(value)
        or stat.S_IMODE(metadata.st_mode) != 0o600
    ):
        raise ValueError(f'{label} output identity changed')


def load_runtime():
    os.environ['U2NET_HOME'] = str(MODEL_DIRECTORY)
    os.environ.pop('MODEL_CHECKSUM_DISABLED', None)
    import numpy as np
    import onnxruntime as ort
    from PIL import Image
    import rembg
    from rembg import remove
    from rembg.sessions.u2netp import U2netpSession

    for package_name, version in PACKAGE_VERSIONS.items():
        if importlib.metadata.version(package_name) != version:
            raise ValueError(f'{package_name} identity changed')
    if rembg.__version__ != '2.0.76' or ort.__version__ != '1.27.0':
        raise ValueError('rembg GPU runtime identity changed')
    available = ort.get_available_providers()
    if (
        ort.get_device() != 'GPU'
        or 'CUDAExecutionProvider' not in available
        or 'ROCMExecutionProvider' in available
    ):
        raise ValueError('CUDA execution provider is unavailable')
    return np, ort, Image, remove, U2netpSession


def execute_inference(request):
    np, ort, Image, remove, U2netpSession = load_runtime()
    with Image.open(SOURCE_FRAME_PATH) as opened:
        opened.load()
        if (
            opened.mode != 'RGBA'
            or opened.size
            != (
                request['source']['width'],
                request['source']['height'],
            )
        ):
            raise ValueError('decoded source frame shape changed')
        source = opened.copy()
    rgba = source.tobytes()
    if (
        hashlib.sha256(rgba).hexdigest()
        != request['source']['decodedRgbaSha256']
        or len(rgba) != source.width * source.height * 4
        or any(rgba[index] != 255 for index in range(3, len(rgba), 4))
    ):
        raise ValueError('decoded source RGBA identity changed')

    session_options = ort.SessionOptions()
    session_options.add_session_config_entry(
        'session.disable_cpu_ep_fallback',
        '1',
    )
    session = U2netpSession(
        'u2netp',
        session_options,
        providers=['CUDAExecutionProvider'],
    )
    providers = session.inner_session.get_providers()
    if providers != ['CUDAExecutionProvider']:
        raise ValueError('rembg session did not bind CUDA exclusively')
    mask = remove(
        source,
        session=session,
        alpha_matting=False,
        only_mask=True,
        post_process_mask=False,
    )
    if mask.mode != 'L' or mask.size != source.size:
        raise ValueError('rembg mask output shape is invalid')
    histogram = mask.histogram()
    unique_value_count = sum(1 for value in histogram if value)
    minimum, maximum = mask.getextrema()
    transparent_pixel_count = histogram[0]
    opaque_pixel_count = histogram[255]
    partial_pixel_count = (
        source.width * source.height
        - transparent_pixel_count
        - opaque_pixel_count
    )
    threshold_mask_value = round(
        SETTINGS['confidenceThreshold'] * 255
    )
    foreground_pixel_count_at_threshold = sum(
        histogram[threshold_mask_value:]
    )
    if (
        minimum >= maximum
        or unique_value_count < 2
        or partial_pixel_count < 1
    ):
        raise ValueError('rembg mask contains no usable variation')
    mask_buffer = io.BytesIO()
    mask.save(
        mask_buffer,
        format='PNG',
        optimize=False,
        compress_level=9,
    )
    mask_bytes = mask_buffer.getvalue()
    mask_sha256 = hashlib.sha256(mask_bytes).hexdigest()
    analysis = {
        'schemaVersion': 'rembg-u2netp-mask-analysis-v1',
        'sourceArtifactSha256':
            request['source']['contentSha256'],
        'sourceDecodedRgbaSha256':
            request['source']['decodedRgbaSha256'],
        'maskSha256': mask_sha256,
        'width': source.width,
        'height': source.height,
        'minimumMaskValue': minimum,
        'maximumMaskValue': maximum,
        'uniqueMaskValueCount': unique_value_count,
        'transparentPixelCount': transparent_pixel_count,
        'partialPixelCount': partial_pixel_count,
        'opaquePixelCount': opaque_pixel_count,
        'confidenceThreshold': SETTINGS['confidenceThreshold'],
        'thresholdMaskValue': threshold_mask_value,
        'foregroundPixelCountAtThreshold':
            foreground_pixel_count_at_threshold,
        'maskVariationObserved': True,
    }
    analysis_bytes = stable_json_bytes(analysis)
    analysis_sha256 = hashlib.sha256(analysis_bytes).hexdigest()
    qa = {
        'schemaVersion': 'rembg-mask-qa-measurement-v1',
        'analysisSha256': analysis_sha256,
        'maskSha256': mask_sha256,
        'requiredQaGates': [
            'mask_edge_quality',
            'mask_subject_coverage',
        ],
        'findingCodes': [],
        'measurementOnly': True,
        'qaPassAuthority': False,
    }
    qa_bytes = stable_json_bytes(qa)
    write_exclusive(
        MASK_OUTPUT_PATH,
        mask_bytes,
        MAXIMUM_MASK_BYTES,
        'mask PNG',
    )
    write_exclusive(
        ANALYSIS_OUTPUT_PATH,
        analysis_bytes,
        MAXIMUM_EVIDENCE_BYTES,
        'mask analysis',
    )
    write_exclusive(
        QA_OUTPUT_PATH,
        qa_bytes,
        MAXIMUM_EVIDENCE_BYTES,
        'mask QA measurement',
    )
    return {
        'mask': {
            'canonicalOrder': 0,
            'artifactKind': 'mask_image',
            'fileName': 'mask.png',
            'contentType': 'image/png',
            'encodingProfile': 'gray8_mask_png_v1',
            'byteLength': len(mask_bytes),
            'contentSha256': mask_sha256,
            'width': source.width,
            'height': source.height,
            'minimumMaskValue': minimum,
            'maximumMaskValue': maximum,
            'uniqueMaskValueCount': unique_value_count,
            'transparentPixelCount': transparent_pixel_count,
            'partialPixelCount': partial_pixel_count,
            'opaquePixelCount': opaque_pixel_count,
        },
        'evidence': [
            {
                'canonicalOrder': 0,
                'evidenceKind': 'mask_analysis_receipt',
                'fileName': 'mask-analysis.json',
                'byteLength': len(analysis_bytes),
                'contentSha256': analysis_sha256,
            },
            {
                'canonicalOrder': 1,
                'evidenceKind': 'mask_qa_measurement_receipt',
                'fileName': 'mask-qa-measurement.json',
                'byteLength': len(qa_bytes),
                'contentSha256':
                    hashlib.sha256(qa_bytes).hexdigest(),
            },
        ],
        'providerCount': len(providers),
    }


def success_response(request, result):
    return {
        'schemaVersion': RESPONSE_VERSION,
        'ok': True,
        'status': 'controlled_rembg_gpu_inference_completed',
        'operationId': OPERATION_ID,
        'admissionDigestSha256':
            request['admissionDigestSha256'],
        'requestBindingSha256':
            request['requestBindingSha256'],
        'dispatchIntentId':
            request['dispatch']['dispatchIntentId'],
        'runtimeIdentity': {
            'rembgVersion': '2.0.76',
            'onnxRuntimeGpuVersion': '1.27.0',
            'executionProvider': 'CUDAExecutionProvider',
            'providerCount': result['providerCount'],
            'device': 'cuda',
            'runtimeRegion': 'europe-west1',
            'cpuFallbackDisabled': True,
        },
        'outputs': [result['mask']],
        'processEvidence': result['evidence'],
        'receiptBoundaries': {
            'outputBytesIncluded': False,
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


def failure_response(code):
    return {
        'schemaVersion': RESPONSE_VERSION,
        'ok': False,
        'code': code,
    }


def main():
    global stage
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'MODEL_ARTIFACT_VALIDATION_FAILED'
    validate_model_file()
    stage = 'SOURCE_ARTIFACT_VALIDATION_FAILED'
    validate_source_structure(request['source'])
    stage = 'PRIVATE_OUTPUT_VALIDATION_FAILED'
    validate_output_directory()
    stage = 'REMBG_GPU_INFERENCE_FAILED'
    result = execute_inference(request)
    sys.stdout.write(json.dumps(
        success_response(request, result),
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
    ))


try:
    main()
except Exception:
    sys.stderr.write('Private rembg GPU execution failed.\n')
    sys.stdout.write(json.dumps(
        failure_response(
            stage
            if 'stage' in globals()
            else 'EXECUTION_FAILED'
        ),
        sort_keys=True,
        separators=(',', ':'),
    ))
    sys.exit(3)
