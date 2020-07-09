function interleave(inputL, inputR) {
    var length = inputL.length + inputR.length;
    var result = new Int16Array(length);

    var index = 0,
        inputIndex = 0;

    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        ++inputIndex;
    }
    return result;
}

function floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        output.setInt16(offset, input[i], true);
    }
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function encodeWAV(samples, numChannels, sampleRate) {
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
}



var sample_rate = 44100;
var kbps = 128;
var channels = 1;
var mp3encoder = null;

var samples_left = null;
var samples_right = null;
var first_buffer = true;

onmessage = function( ev ) {
    if (!ev.data) return ;

	if (ev.data.sample_rate) {
		sample_rate = ev.data.sample_rate / 1;
		kbps = ev.data.kbps / 1;
        channels = ev.data.channels / 1;

		return ;
	}

    if (first_buffer) {
        samples_left = new Int16Array (ev.data, 0);
        first_buffer = false;

        if (channels > 1) return ;
    }

    if (ev.data && channels > 1) {
        samples_right = new Int16Array (ev.data, 0);
    }

    ///
    var interleaved = undefined;
    if (channels > 1) {
        interleaved = interleave(samples_left, samples_right);
    } else {
        interleaved = samples_left;
    }

    var dataview = encodeWAV(interleaved, channels, sample_rate);
    var audioBlob = new Blob([dataview], { type: 'audio/wav' });

    postMessage( audioBlob );
}