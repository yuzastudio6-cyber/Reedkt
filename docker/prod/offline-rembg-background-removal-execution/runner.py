import base64
import hashlib
import io
import json
import os
import sys

_stderr_fd = os.dup(2)
_devnull_fd = os.open('/dev/null', os.O_WRONLY)
try:
    os.dup2(_devnull_fd, 2)
    import numpy as np
    import onnxruntime as ort
    from PIL import Image, ImageDraw
    from rembg import new_session, remove
finally:
    os.dup2(_stderr_fd, 2)
    os.close(_stderr_fd)
    os.close(_devnull_fd)

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
PROTOCOL = 'offline-rembg-background-removal-execution-v1'
CONTAINER_PROTOCOL = 'offline-rembg-background-removal-execution-container-v1'
TOOL_ID = 'rembg'
OPERATION_ID = 'tool.rembg.remove_image_background.v1'
MODEL_SHA256 = '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
PACKAGE_IDENTITY = {'packageName': 'rembg', 'version': '2.0.76', 'onnxRuntimeVersion': '1.27.0'}
MODEL_IDENTITY = {'modelId': 'u2netp', 'sha256': MODEL_SHA256, 'byteLength': 4574861, 'upstreamLicense': 'Apache-2.0', 'productionLicenseReviewRequired': True}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    if request['schemaVersion'] != PROTOCOL or request['toolId'] != TOOL_ID or request['operationId'] != OPERATION_ID:
        raise ValueError('request identity is unsupported')
    payload = exact(request['payload'], ['confidenceThreshold', 'alphaMatteMode', 'edgeRefinementProfileId', 'maximumSubjects'], 'payload')
    expected = {'confidenceThreshold': 0.5, 'alphaMatteMode': 'straight', 'edgeRefinementProfileId': 'approved_u2netp_default_v1', 'maximumSubjects': 1}
    if payload != expected:
        raise ValueError('background-removal policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'payload': expected}


def build_fixture():
    image = Image.new('RGB', (128, 128), (43, 132, 166))
    draw = ImageDraw.Draw(image)
    for y in range(128):
        shade = int(24 * y / 127)
        draw.line((0, y, 127, y), fill=(43 + shade // 3, 132 + shade // 4, 166 + shade // 2))
    draw.ellipse((42, 12, 86, 56), fill=(242, 183, 116), outline=(66, 42, 32), width=3)
    draw.rounded_rectangle((30, 48, 98, 118), radius=18, fill=(185, 44, 55), outline=(66, 42, 32), width=4)
    draw.ellipse((45, 28, 51, 34), fill=(30, 26, 24))
    draw.ellipse((77, 28, 83, 34), fill=(30, 26, 24))
    draw.arc((52, 32, 76, 47), start=10, end=170, fill=(92, 38, 32), width=2)
    return image


def execute():
    model_bytes = open('/opt/reeditpro-models/u2netp.onnx', 'rb').read()
    if len(model_bytes) != 4574861 or hashlib.sha256(model_bytes).hexdigest() != MODEL_SHA256:
        raise ValueError('model identity changed')
    available_providers = ort.get_available_providers()
    if 'CPUExecutionProvider' not in available_providers or 'CUDAExecutionProvider' in available_providers or 'ROCMExecutionProvider' in available_providers:
        raise ValueError('unexpected ONNX execution provider')
    source = build_fixture()
    session = new_session('u2netp', providers=['CPUExecutionProvider'])
    if session.inner_session.get_providers() != ['CPUExecutionProvider']:
        raise ValueError('rembg session provider is not CPU-only')
    output = remove(source, session=session, alpha_matting=False, only_mask=False, post_process_mask=False)
    if not isinstance(output, Image.Image) or output.mode != 'RGBA' or output.size != (128, 128):
        raise ValueError('rembg output contract is invalid')
    alpha = np.asarray(output.getchannel('A'), dtype=np.uint8)
    foreground = alpha[24:112, 32:96]
    background = np.concatenate([alpha[:16, :].ravel(), alpha[:, :16].ravel(), alpha[:, 112:].ravel(), alpha[120:, :].ravel()])
    alpha_min = int(alpha.min()); alpha_max = int(alpha.max())
    foreground_mean = round(float(foreground.mean()), 6); background_mean = round(float(background.mean()), 6)
    if alpha_min >= alpha_max or np.unique(alpha).size < 16 or foreground_mean <= background_mean:
        raise ValueError('rembg alpha mask failed bounded semantic QA')
    buffer = io.BytesIO(); output.save(buffer, format='PNG', optimize=False, compress_level=9)
    data = buffer.getvalue()
    if not 100 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    artifact = {'mimeType': 'image/png', 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    semantic = {'actualPackageEntrypointExecuted': True, 'entrypoint': 'rembg.remove', 'modelId': 'u2netp', 'modelSha256': MODEL_SHA256, 'modelByteLength': 4574861, 'cpuExecutionProviderOnly': True, 'sourceFixtureWidth': 128, 'sourceFixtureHeight': 128, 'outputWidth': 128, 'outputHeight': 128, 'outputMode': 'RGBA', 'alphaMinimum': alpha_min, 'alphaMaximum': alpha_max, 'alphaUniqueValueCount': int(np.unique(alpha).size), 'foregroundAlphaMean': foreground_mean, 'backgroundAlphaMean': background_mean, 'foregroundSeparationVerified': True, 'serverOwnedFixtureOnly': True, 'callerMediaAllowed': False, 'callerModelAllowed': False, 'runtimeModelDownloadAllowed': False, 'zeroNetworkRuntimeRequired': True}
    return artifact, semantic


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'REMBG_BACKGROUND_REMOVAL_EXECUTION_FAILED'
    artifact, semantic = execute()
    response = {'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'status': 'actual_rembg_background_removal_completed', 'packageIdentity': PACKAGE_IDENTITY, 'modelIdentity': MODEL_IDENTITY, 'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(), 'artifact': artifact, 'semanticEvidence': semantic, 'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False}}
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private rembg background-removal execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
