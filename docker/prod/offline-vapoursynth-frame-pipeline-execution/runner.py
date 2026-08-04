import base64
import hashlib
import json
import sys

import vapoursynth as vs

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
PROTOCOL = 'offline-vapoursynth-frame-pipeline-execution-v1'
CONTAINER_PROTOCOL = 'offline-vapoursynth-frame-pipeline-execution-container-v1'
TOOL_ID = 'vapoursynth'
OPERATION_ID = 'tool.vapoursynth.process_approved_frame_pipeline.v1'
PACKAGE_IDENTITY = {'packageName': 'vapoursynth', 'version': '77'}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    if request['schemaVersion'] != PROTOCOL or request['toolId'] != TOOL_ID or request['operationId'] != OPERATION_ID:
        raise ValueError('request identity is unsupported')
    payload = exact(request['payload'], ['pipelineProfileId', 'pluginPackProfileId', 'frameRate', 'callerScriptAllowed'], 'payload')
    expected = {'pipelineProfileId': 'approved_frame_preprocess_v1', 'pluginPackProfileId': 'reviewed_builtin_plugins_v1', 'frameRate': 24, 'callerScriptAllowed': False}
    if payload != expected:
        raise ValueError('frame pipeline policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'payload': expected}


def execute():
    core = vs.core
    source = core.std.BlankClip(width=64, height=64, format=vs.RGB24, length=24, fpsnum=24, fpsden=1, color=[12, 34, 56])
    cropped = core.std.CropRel(source, left=4, right=4, top=4, bottom=4)
    processed = core.resize.Point(cropped, width=64, height=64)
    first = processed.get_frame(0)
    last = processed.get_frame(23)
    first_hashes = [hashlib.sha256(bytes(first[plane])).hexdigest() for plane in range(len(first))]
    last_hashes = [hashlib.sha256(bytes(last[plane])).hexdigest() for plane in range(len(last))]
    if processed.width != 64 or processed.height != 64 or processed.num_frames != 24 or processed.fps_num != 24 or processed.fps_den != 1 or first_hashes != last_hashes:
        raise ValueError('frame pipeline result is invalid')
    document = {
        'callerScriptAllowed': False,
        'firstFramePlaneSha256': first_hashes,
        'frameCount': 24,
        'frameRate': {'denominator': 1, 'numerator': 24},
        'lastFramePlaneSha256': last_hashes,
        'operations': ['std.BlankClip', 'std.CropRel', 'resize.Point'],
        'output': {'format': 'RGB24', 'height': 64, 'width': 64},
        'pipelineProfileId': 'approved_frame_preprocess_v1',
        'pluginPackProfileId': 'reviewed_builtin_plugins_v1',
    }
    data = json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    if not 2 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    artifact = {'mimeType': 'application/json', 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    semantic = {'actualPackageEntrypointExecuted': True, 'entrypoint': 'vapoursynth.core.std+resize', 'blankClipExecuted': True, 'cropRelExecuted': True, 'resizePointExecuted': True, 'firstAndLastFrameVerified': True, 'frameCount': 24, 'frameRateNumerator': 24, 'frameRateDenominator': 1, 'outputWidth': 64, 'outputHeight': 64, 'approvedServerOwnedFixtureOnly': True, 'reviewedBuiltinPluginsOnly': True, 'callerScriptAllowed': False, 'zeroNetworkRuntimeRequired': True}
    return artifact, semantic


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'FRAME_PIPELINE_EXECUTION_FAILED'
    artifact, semantic = execute()
    response = {'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': TOOL_ID, 'operationId': OPERATION_ID, 'status': 'actual_vapoursynth_frame_pipeline_operation_completed', 'packageIdentity': PACKAGE_IDENTITY, 'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(), 'artifact': artifact, 'semanticEvidence': semantic, 'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False}}
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private VapourSynth frame pipeline execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
