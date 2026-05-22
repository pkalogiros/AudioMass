function interleave(L, R, Arr) {
    var len = L.length + R.length;
    var out = new Arr(len);
    var i = 0, j = 0, n = L.length;
    while (j < n) {
        out[i++] = L[j];
        out[i++] = R[j];
        ++j;
    }
    return out;
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function encodeWAV(samples, numChannels, sampleRate, bitDepth) {
    var bytesPerSample = bitDepth / 8;
    var dataLen = samples.length * bytesPerSample;
    var isFloat = bitDepth === 32;
    var fmtSize = isFloat ? 18 : 16;
    var factSize = isFloat ? 12 : 0;
    var totalSize = 12 + 8 + fmtSize + factSize + 8 + dataLen;
    var buffer = new ArrayBuffer(totalSize);
    var view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(view, 8, 'WAVE');

    var p = 12;
    writeString(view, p, 'fmt ');
    view.setUint32(p + 4, fmtSize, true);
    view.setUint16(p + 8, isFloat ? 3 : 1, true);
    view.setUint16(p + 10, numChannels, true);
    view.setUint32(p + 12, sampleRate, true);
    view.setUint32(p + 16, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(p + 20, numChannels * bytesPerSample, true);
    view.setUint16(p + 22, bitDepth, true);
    if (isFloat) view.setUint16(p + 24, 0, true);
    p += 8 + fmtSize;

    if (isFloat) {
        writeString(view, p, 'fact');
        view.setUint32(p + 4, 4, true);
        view.setUint32(p + 8, samples.length / numChannels, true);
        p += 12;
    }

    writeString(view, p, 'data');
    view.setUint32(p + 4, dataLen, true);
    p += 8;

    if (bitDepth === 16) {
        for (var i = 0; i < samples.length; ++i, p += 2)
            view.setInt16(p, samples[i], true);
    } else if (bitDepth === 24) {
        for (var i = 0; i < samples.length; ++i, p += 3) {
            var v = samples[i];
            view.setUint8(p,     v & 0xff);
            view.setUint8(p + 1, (v >> 8) & 0xff);
            view.setUint8(p + 2, (v >> 16) & 0xff);
        }
    } else {
        for (var i = 0; i < samples.length; ++i, p += 4)
            view.setFloat32(p, samples[i], true);
    }

    return buffer;
}


var sample_rate = 44100;
var kbps = 128;
var channels = 1;
var bit_depth = 16;

var left_buf = null;
var right_buf = null;
var first_buffer = true;

onmessage = function( ev ) {
    if (!ev.data) return ;

	if (ev.data.sample_rate) {
		sample_rate = ev.data.sample_rate / 1;
		kbps = ev.data.kbps / 1;
        channels = ev.data.channels / 1;
        bit_depth = (ev.data.bit_depth / 1) || 16;

		return ;
	}

    if (first_buffer) {
        left_buf = ev.data;
        first_buffer = false;

        if (channels > 1) return ;
    }
    else if (channels > 1) {
        right_buf = ev.data;
    }

    var Arr = bit_depth === 32 ? Float32Array :
              bit_depth === 24 ? Int32Array :
              Int16Array;

    var L = new Arr (left_buf);
    var R = right_buf ? new Arr (right_buf) : null;
    var interleaved = R ? interleave (L, R, Arr) : L;

    var encoded = encodeWAV(interleaved, channels, sample_rate, bit_depth);
    var audioBlob = new Blob([encoded], { type: 'audio/wav' });

    postMessage( audioBlob );
}
