import base64
import hashlib
import json
import os
import struct
import subprocess
import sys
import tempfile

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 8 * 1024 * 1024
PROTOCOL = 'offline-native-image-pipeline-execution-v1'
CONTAINER_PROTOCOL = 'offline-native-image-pipeline-execution-container-v1'
OPERATIONS = {
    'opencolorio': 'tool.opencolorio.apply_color_transform.v1',
    'openimageio': 'tool.openimageio.process_image_sequence.v1',
    'streamer_render_pipeline_support': 'tool.streamer_render_pipeline_support.verify_render_pipeline_support.v1',
}
PACKAGE_IDENTITIES = {
    'opencolorio': {'packageName': 'opencolorio-tools', 'version': '2.1.2+dfsg1-4+b3'},
    'openimageio': {'packageName': 'openimageio-tools', 'version': '2.4.7.1+dfsg-2'},
    'streamer_render_pipeline_support': {'packageName': 'gstreamer1.0-tools+plugins-base', 'version': '1.22.0-2+deb12u1+1.22.0-3+deb12u6'},
}
FIXED_ENV = {
    'HOME': '/tmp', 'LANG': 'C', 'LC_ALL': 'C', 'PATH': '/usr/bin:/bin',
    'GST_REGISTRY': '/tmp/gstreamer-registry.bin', 'GST_REGISTRY_REUSE_PLUGIN_SCANNER': 'no',
}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    tool_id = request['toolId']
    if request['schemaVersion'] != PROTOCOL or tool_id not in OPERATIONS or request['operationId'] != OPERATIONS[tool_id]:
        raise ValueError('request identity is unsupported')
    if tool_id == 'opencolorio':
        payload = exact(request['payload'], ['transformProfileId', 'inputColorSpace', 'outputColorSpace', 'strength', 'preserveSkinTone', 'fixtureProfileId'], 'opencolorio payload')
        if payload != {'transformProfileId': 'approved_srgb_to_rec709_v1', 'inputColorSpace': 'srgb', 'outputColorSpace': 'rec709', 'strength': 1, 'preserveSkinTone': True, 'fixtureProfileId': 'approved_color_chart_v1'}:
            raise ValueError('opencolorio policy is unsupported')
    elif tool_id == 'openimageio':
        payload = exact(request['payload'], ['transformProfileId', 'outputFormat', 'outputWidth', 'outputHeight', 'preserveMetadata', 'fixtureProfileId'], 'openimageio payload')
        if payload != {'transformProfileId': 'approved_sequence_resize_v1', 'outputFormat': 'png', 'outputWidth': 64, 'outputHeight': 64, 'preserveMetadata': False, 'fixtureProfileId': 'approved_two_frame_sequence_v1'}:
            raise ValueError('openimageio policy is unsupported')
    else:
        payload = exact(request['payload'], ['probeProfileId', 'requireVideoPipeline', 'requireAudioPipeline'], 'gstreamer payload')
        if payload != {'probeProfileId': 'approved_av_pipeline_probe_v1', 'requireVideoPipeline': True, 'requireAudioPipeline': True}:
            raise ValueError('gstreamer policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': tool_id, 'operationId': OPERATIONS[tool_id], 'payload': payload}


def run_fixed(arguments, timeout=30):
    result = subprocess.run(arguments, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=FIXED_ENV, timeout=timeout, check=False)
    if result.returncode != 0:
        raise ValueError('fixed native command failed')
    return result.stdout, result.stderr


def package_version(name):
    stdout, _ = run_fixed(['/usr/bin/dpkg-query', '-W', '-f=${Version}', name])
    return stdout.decode('utf-8').strip()


def verify_package_identity(tool_id):
    if tool_id == 'streamer_render_pipeline_support':
        actual = f"{package_version('gstreamer1.0-tools')}+{package_version('gstreamer1.0-plugins-base')}"
    else:
        actual = package_version(PACKAGE_IDENTITIES[tool_id]['packageName'])
    if actual != PACKAGE_IDENTITIES[tool_id]['version']:
        raise ValueError('package identity mismatch')


def ppm(width, height, variant):
    pixels = bytearray()
    for y in range(height):
        for x in range(width):
            if variant == 1:
                pixels.extend(((x * 255) // (width - 1), (y * 255) // (height - 1), ((x + y) * 255) // (width + height - 2)))
            else:
                pixels.extend(((y * 255) // (height - 1), ((width - 1 - x) * 255) // (width - 1), ((x * 3 + y * 5) * 255) // (8 * (width - 1))))
    return f'P6\n{width} {height}\n255\n'.encode('ascii') + bytes(pixels)


def png_dimensions(data):
    if len(data) < 33 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('native output is not png')
    width, height = struct.unpack('>II', data[16:24])
    return width, height


def execute_opencolorio():
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        source = os.path.join(directory, 'approved-input.ppm')
        output = os.path.join(directory, 'approved-output.png')
        with open(source, 'xb') as handle:
            handle.write(ppm(64, 64, 1))
        stdout, stderr = run_fixed(['/usr/bin/ocioconvert', '--lut', '/app/approved-color.spi1d', source, output])
        with open(output, 'rb') as handle:
            data = handle.read(MAXIMUM_ARTIFACT_BYTES + 1)
        width, height = png_dimensions(data)
        if width != 64 or height != 64 or len(data) < 256:
            raise ValueError('opencolorio output is invalid')
        return binary_artifact('image/png', data), {
            'entrypoint': 'ocioconvert --lut', 'approvedLutHashVerified': hashlib.sha256(open('/app/approved-color.spi1d', 'rb').read()).hexdigest() == '6958954b4e3d500948bf94822e99aa159c0efbacf027d201ea85852c4d31dbf1',
            'cpuColorTransformExecuted': True, 'inputColorSpace': 'srgb', 'outputColorSpace': 'rec709',
            'width': width, 'height': height, 'nativeStdoutBytes': len(stdout), 'nativeStderrBytes': len(stderr),
        }


def execute_openimageio():
    outputs = []
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        for index in (1, 2):
            source = os.path.join(directory, f'approved-{index}.ppm')
            output = os.path.join(directory, f'approved-{index}.png')
            with open(source, 'xb') as handle:
                handle.write(ppm(32, 32, index))
            run_fixed(['/usr/bin/oiiotool', source, '--resize', '64x64', '--eraseattrib', '.*', '--nosoftwareattrib', '-o', output])
            with open(output, 'rb') as handle:
                data = handle.read(MAXIMUM_ARTIFACT_BYTES + 1)
            if png_dimensions(data) != (64, 64) or len(data) < 256:
                raise ValueError('openimageio output is invalid')
            outputs.append(data)
        if hashlib.sha256(outputs[0]).digest() == hashlib.sha256(outputs[1]).digest():
            raise ValueError('openimageio sequence frames are unexpectedly identical')
        return binary_artifact('image/png', outputs[0]), {
            'entrypoint': 'oiiotool --resize', 'sequenceFramesProcessed': 2, 'resizeExecuted': True,
            'metadataPreserved': False, 'outputFormat': 'png', 'width': 64, 'height': 64,
            'secondFrameSha256': hashlib.sha256(outputs[1]).hexdigest(),
        }


def execute_gstreamer():
    run_fixed(['/usr/bin/gst-inspect-1.0', 'videotestsrc'])
    run_fixed(['/usr/bin/gst-inspect-1.0', 'audiotestsrc'])
    run_fixed(['/usr/bin/gst-launch-1.0', '-q', 'videotestsrc', 'num-buffers=10', 'pattern=smpte', '!', 'video/x-raw,width=64,height=64,framerate=10/1', '!', 'videoconvert', '!', 'fakesink', 'sync=false'])
    run_fixed(['/usr/bin/gst-launch-1.0', '-q', 'audiotestsrc', 'num-buffers=20', 'wave=sine', '!', 'audio/x-raw,rate=48000,channels=1', '!', 'audioconvert', '!', 'audioresample', '!', 'fakesink', 'sync=false'])
    document = {'probeProfileId': 'approved_av_pipeline_probe_v1', 'videoPipelineCompleted': True, 'audioPipelineCompleted': True, 'networkRequired': False, 'gstreamerToolsVersion': package_version('gstreamer1.0-tools'), 'gstreamerPluginsBaseVersion': package_version('gstreamer1.0-plugins-base')}
    return json_artifact(document), {'entrypoint': 'gst-launch-1.0', 'videoPipelineExecuted': True, 'audioPipelineExecuted': True, 'fixedTestSourcesUsed': True, 'networkRequired': False}


def json_artifact(document):
    return binary_artifact('application/json', json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8'))


def binary_artifact(mime_type, data):
    if not 2 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    return {'mimeType': mime_type, 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    verify_package_identity(request['toolId'])
    if request['toolId'] == 'opencolorio':
        stage = 'OPENCOLORIO_EXECUTION_FAILED'; artifact, semantic = execute_opencolorio()
    elif request['toolId'] == 'openimageio':
        stage = 'OPENIMAGEIO_EXECUTION_FAILED'; artifact, semantic = execute_openimageio()
    else:
        stage = 'GSTREAMER_EXECUTION_FAILED'; artifact, semantic = execute_gstreamer()
    response = {
        'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': request['toolId'], 'operationId': request['operationId'],
        'status': 'actual_native_image_pipeline_operation_completed', 'packageIdentity': PACKAGE_IDENTITIES[request['toolId']],
        'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(),
        'artifact': artifact, 'semanticEvidence': {'actualPackageEntrypointExecuted': True, **semantic, 'zeroNetworkRuntimeRequired': True},
        'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False},
    }
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private native image pipeline execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
