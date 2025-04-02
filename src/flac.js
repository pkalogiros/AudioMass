// FLAC worker for encoding audio using libflac.js

importScripts('libflac.js');

var flacEncoder;
var FLAC_INITIALIZED = false;
var sample_rate = 44100;
var compression = 5; // Default compression (0-8)
var channels = 1;
var buffers = [];
var bufIndex = 0;
var first_buffer = true;
var samples_left = null;
var samples_right = null;

function convert(n) {
    var v = n < 0 ? n * 32768 : n * 32767;
    return Math.max(-32768, Math.min(32768, v));
}

function initFLAC() {
    if (FLAC_INITIALIZED) return true;
    
    //                                        SAMPLERATE, CHANNELS, BPS, COMPRESSION, 0, VERIFY, BLOCK_SIZE);
    flacEncoder = Flac.create_libflac_encoder(sample_rate, channels, 16, compression, 0, true, 0);
    if (flacEncoder != 0) {
        var status = Flac.init_encoder_stream(flacEncoder, function(buffer, bytes) {
            buffers.push(new Uint8Array(buffer));
            bufIndex += buffer.byteLength;
        });
        
        FLAC_INITIALIZED = true;
        return status == 0;
    }
    
    return false;
}

function interleave(inputL, inputR) {
    var length = inputL.length + inputR.length;
    var result = new Int32Array(length);

    var index = 0,
        inputIndex = 0;

    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        ++inputIndex;
    }
    return result;
}

onmessage = function(ev) {
    if (!ev.data) return;

    if (ev.data.sample_rate) {
        sample_rate = ev.data.sample_rate / 1;
        compression = ev.data.flac_compression;
        channels = ev.data.channels / 1;
        
        initFLAC();
        return;
    }

    if (first_buffer) {
        samples_left = new Int16Array(ev.data, 0);
        first_buffer = false;

        if (channels > 1) return;
    }

    if (ev.data && channels > 1) {
        samples_right = new Int16Array(ev.data, 0);
    }

    if (!FLAC_INITIALIZED) {
        postMessage({percentage: 0});
        return;
    }

    // Progress update
    postMessage({percentage: 50});

    // Process the audio data
    var interleaved = null;
    var samples = null;
    
    if (channels > 1) {
        // Create interleaved buffer for stereo
        interleaved = interleave(samples_left, samples_right);
        samples = interleaved;
    } else {
        // Use mono buffer directly
        samples = samples_left;
    }

    // Encode the audio data
    if (channels > 1) {
        Flac.FLAC__stream_encoder_process_interleaved(flacEncoder, samples, samples_left.length);
    } else {
        var tmp_samples = new Int32Array(samples_left.length);
        var tmp_index = 0;
        while (tmp_index < samples_left.length) {
            tmp_samples[tmp_index] = samples_left[tmp_index];
            ++tmp_index;
        }
        Flac.FLAC__stream_encoder_process(flacEncoder, [tmp_samples], samples_left.length);
    }
    
    // Finish encoding
    Flac.FLAC__stream_encoder_finish(flacEncoder);

    // Combine all buffers into a single Uint8Array
    var outputData = new Uint8Array(bufIndex);
    var offset = 0;
    for (var i = 0; i < buffers.length; i++) {
        outputData.set(buffers[i], offset);
        offset += buffers[i].length;
    }
    
    // Create blob and return
    var blob = new Blob([outputData], {type: 'audio/flac'});
    postMessage(blob);
    
    // Clean up
    Flac.FLAC__stream_encoder_delete(flacEncoder);
    FLAC_INITIALIZED = false;
    buffers = [];
    bufIndex = 0;
}