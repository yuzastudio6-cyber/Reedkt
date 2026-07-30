import base64
import hashlib
import io
import json
import os
import sys
import time

_stderr_fd = os.dup(2)
_devnull_fd = os.open('/dev/null', os.O_WRONLY)
try:
    os.dup2(_devnull_fd, 2)
    import numpy as np
    import onnxruntime as ort
    from PIL import Image
    from rembg import new_session, remove
finally:
    os.dup2(_stderr_fd, 2)
    os.close(_stderr_fd)
    os.close(_devnull_fd)

PROTOCOL = 'living-frame-rembg-approved-asset-internal-test-v1'
CONTAINER_PROTOCOL = 'living-frame-rembg-approved-asset-internal-test-container-v1'
TOOL_ID = 'rembg'
OPERATION_ID = 'tool.rembg.remove_image_background.v1'
SOURCE_ARTIFACT_ID = 'lf.animation-aware-illustration.musashi.v1'
SOURCE_SHA256 = '15dae1bc8cbd6549fea2b0cf389a38e5dd5b6750745650fe91b22eb398171a1e'
SOURCE_BYTE_LENGTH = 925492
WIDTH = 1024
HEIGHT = 1024
MODEL_SHA256 = '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
MODEL_BYTE_LENGTH = 4574861
MAXIMUM_REQUEST_BYTES = 4 * 1024 * 1024
MAXIMUM_MASK_BYTES = 4 * 1024 * 1024


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    if request['schemaVersion'] != PROTOCOL or request['toolId'] != TOOL_ID or request['operationId'] != OPERATION_ID:
        raise ValueError('request identity is unsupported')
    payload = exact(
        request['payload'],
        [
            'sourceArtifactId',
            'sourceSha256',
            'sourceByteLength',
            'widthPixels',
            'heightPixels',
            'sourcePngBase64',
            'sourceVariant',
            'modelId',
            'outputMode',
        ],
        'payload',
    )
    if (
        payload['sourceArtifactId'] != SOURCE_ARTIFACT_ID
        or payload['sourceSha256'] != SOURCE_SHA256
        or payload['sourceByteLength'] != SOURCE_BYTE_LENGTH
        or payload['widthPixels'] != WIDTH
        or payload['heightPixels'] != HEIGHT
        or payload['sourceVariant'] != 'animation_aware_illustration_fixture'
        or payload['modelId'] != 'u2netp'
        or payload['outputMode'] != 'mask_only_png'
        or not isinstance(payload['sourcePngBase64'], str)
    ):
        raise ValueError('approved source binding is unsupported')
    try:
        source_bytes = base64.b64decode(payload['sourcePngBase64'], validate=True)
    except Exception as error:
        raise ValueError('approved source bytes are invalid') from error
    if (
        len(source_bytes) != SOURCE_BYTE_LENGTH
        or hashlib.sha256(source_bytes).hexdigest() != SOURCE_SHA256
        or base64.b64encode(source_bytes).decode('ascii') != payload['sourcePngBase64']
    ):
        raise ValueError('approved source byte commitment changed')
    return request, source_bytes


def verify_source(source_bytes):
    source = Image.open(io.BytesIO(source_bytes))
    source.load()
    if source.format != 'PNG' or source.size != (WIDTH, HEIGHT) or source.mode != 'RGB':
        raise ValueError('approved source PNG profile is invalid')
    return source


def execute(source):
    model_bytes = open('/opt/reeditpro-models/u2netp.onnx', 'rb').read()
    if len(model_bytes) != MODEL_BYTE_LENGTH or hashlib.sha256(model_bytes).hexdigest() != MODEL_SHA256:
        raise ValueError('model identity changed')
    providers = ort.get_available_providers()
    if 'CPUExecutionProvider' not in providers or 'CUDAExecutionProvider' in providers or 'ROCMExecutionProvider' in providers:
        raise ValueError('internal test requires the exact CPU-only provider boundary')
    session = new_session('u2netp', providers=['CPUExecutionProvider'])
    if session.inner_session.get_providers() != ['CPUExecutionProvider']:
        raise ValueError('rembg session provider is not CPU-only')
    started = time.monotonic()
    output = remove(
        source,
        session=session,
        alpha_matting=False,
        only_mask=True,
        post_process_mask=False,
    )
    elapsed_milliseconds = int(round((time.monotonic() - started) * 1000))
    if not isinstance(output, Image.Image) or output.size != (WIDTH, HEIGHT):
        raise ValueError('rembg mask output contract is invalid')
    mask = output.convert('L')
    pixels = np.asarray(mask, dtype=np.uint8)
    minimum = int(pixels.min())
    maximum = int(pixels.max())
    unique = int(np.unique(pixels).size)
    transparent = int(np.count_nonzero(pixels == 0))
    opaque = int(np.count_nonzero(pixels == 255))
    partial = int(pixels.size - transparent - opaque)
    foreground = int(np.count_nonzero(pixels >= 128))
    border = np.concatenate([
        pixels[:32, :].ravel(),
        pixels[-32:, :].ravel(),
        pixels[:, :32].ravel(),
        pixels[:, -32:].ravel(),
    ])
    border_mean = round(float(border.mean()), 6)
    foreground_ratio = round(float(foreground / pixels.size), 6)
    if (
        minimum >= maximum
        or unique < 32
        or partial < 1
        or foreground < 50_000
        or foreground > 900_000
        or border_mean >= 32.0
    ):
        raise ValueError('rembg mask failed bounded internal semantic QA')
    buffer = io.BytesIO()
    mask.save(buffer, format='PNG', optimize=False, compress_level=9)
    data = buffer.getvalue()
    if len(data) < 67 or len(data) > MAXIMUM_MASK_BYTES:
        raise ValueError('mask artifact is outside bounds')
    return {
        'mask': {
            'mimeType': 'image/png',
            'encodingProfile': 'gray8_mask_png_v1',
            'byteLength': len(data),
            'sha256': hashlib.sha256(data).hexdigest(),
            'bytesBase64': base64.b64encode(data).decode('ascii'),
        },
        'semanticEvidence': {
            'actualPackageEntrypointExecuted': True,
            'entrypoint': 'rembg.remove',
            'modelId': 'u2netp',
            'modelSha256': MODEL_SHA256,
            'modelByteLength': MODEL_BYTE_LENGTH,
            'cpuExecutionProviderOnly': True,
            'cpuSubstituteNotCanonicalGpuEquivalent': True,
            'sourceArtifactId': SOURCE_ARTIFACT_ID,
            'sourceSha256': SOURCE_SHA256,
            'sourceWidth': WIDTH,
            'sourceHeight': HEIGHT,
            'outputWidth': WIDTH,
            'outputHeight': HEIGHT,
            'outputMode': 'L',
            'minimumMaskValue': minimum,
            'maximumMaskValue': maximum,
            'uniqueMaskValueCount': unique,
            'transparentPixelCount': transparent,
            'partialPixelCount': partial,
            'opaquePixelCount': opaque,
            'foregroundPixelCountAtThreshold': foreground,
            'foregroundRatioAtThreshold': foreground_ratio,
            'borderMeanMaskValue': border_mean,
            'elapsedMilliseconds': elapsed_milliseconds,
            'serverOwnedApprovedFixtureOnly': True,
            'callerMediaAllowed': False,
            'callerModelAllowed': False,
            'runtimeModelDownloadAllowed': False,
            'zeroNetworkRuntimeRequired': True,
        },
    }


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request, source_bytes = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'SOURCE_VALIDATION_FAILED'
    source = verify_source(source_bytes)
    stage = 'REMBG_INTERNAL_TEST_EXECUTION_FAILED'
    result = execute(source)
    response = {
        'schemaVersion': CONTAINER_PROTOCOL,
        'ok': True,
        'toolId': TOOL_ID,
        'operationId': OPERATION_ID,
        'status': 'actual_rembg_approved_asset_internal_test_completed',
        'packageIdentity': {
            'packageName': 'rembg',
            'version': '2.0.76',
            'onnxRuntimeVersion': '1.27.0',
        },
        'requestEnvelopeSha256': hashlib.sha256(
            json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
        ).hexdigest(),
        **result,
        'readiness': {
            'privateInternalOnly': True,
            'canonicalDispatchIntegrated': False,
            'customerBillingAuthority': False,
            'publicDeliveryAuthority': False,
            'productReady': False,
            'externalBetaReady': False,
            'productionReady': False,
        },
    }
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private Living Frame approved-asset rembg internal test failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
