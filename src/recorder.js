(function ( w, d, PKAE ) {
	'use strict';

	var PKREC = function ( app ) {
		var q = this;

		var media_stream_source = null;
		var audio_stream = null;
		var audio_context = null;
		var script_processor = null;

		var buffer_size = 2048 * 2; // * 2 ?
		var channel_num = 1;
		var channel_num_out = 1;

		var is_active = false;

		var starting_offset = 0;
		var ending_offset = 0;

		var sample_rate = 0;

		var temp_buffers = [];
		var temp_buffer_index = -1;
		var jumps = 1;

		var end_record_func = null;
		var start_record_func = null;

		// temp vars
		var curr_offset = 0;
		var first_skip = 8; // skip first samples to evade the button's click
		var fetchBufferFunction = function( ev ) {

			if (first_skip > 0) {
				--first_skip;
				return ;
			}

			curr_offset += ev.inputBuffer.duration * sample_rate;
			if (ending_offset <= curr_offset)
			{
				ending_offset > 0 && q.stop ();
				return ;
			}

			var float_array = ev.inputBuffer.getChannelData (0).slice (0);
			temp_buffers[ ++temp_buffer_index ]  = float_array;

			if (--jumps === 0)
			{
				requestAnimationFrame(function(){
					jumps = 4;
					app.engine.wavesurfer.DrawTemp ( starting_offset, temp_buffers );
				});
			}
		};

		this.isActive = function () {
			return (is_active);
		};

		this.setEndingOffset = function ( ending_offset_seconds ) {
			ending_offset = ending_offset_seconds; // ####  * 100
		};

		this.start = function ( _at_offset, _end_callback, _start_callback, _sample_rate ) {
			if (is_active) return (false);
			if (!navigator.mediaDevices)
			{
				app.fireEvent ('ErrorRec');
				app.fireEvent ('ShowError', 'No recording device found');
				return (false);
			}

			starting_offset = _at_offset / 1;
			if (isNaN (starting_offset) || !starting_offset) starting_offset = 0;
			curr_offset = starting_offset;

			audio_context = app.engine.wavesurfer.backend.getAudioContext ();
			if (!audio_context)
			{
				app.fireEvent ('ErrorRec');
				app.fireEvent ('ShowError', 'No recording device found');
				return (false);
			}

			if (audio_context.currentTime === 0) {
				app.engine.wavesurfer.backend.source.start (0);
				app.engine.wavesurfer.backend.source.stop (0);
			}

			if (!_sample_rate)
			{
				if (app.engine.wavesurfer.backend.buffer) {
					sample_rate = app.engine.wavesurfer.backend.buffer.sampleRate;
				}
				else {
					sample_rate = audio_context.sampleRate;
				}
			}

			end_record_func = function (offset, buffers, _callback) {
				async function downsampleAudioBuffer(buffers, sourceSampleRate, targetSampleRate) {
					// Step 1: Concatenate the Float32Array chunks
					const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
					const concatenated = new Float32Array(totalLength);
					let offset = 0;
					for (let i = 0; i < buffers.length; i++) {
						concatenated.set(buffers[i], offset);
						offset += buffers[i].length;
					}

					// Step 2: Create an AudioBuffer from the concatenated data at the source sample rate
					// Create a temporary AudioContext to build the AudioBuffer
					const tempCtx = new AudioContext({ sampleRate: sourceSampleRate });
					const audioBuffer = tempCtx.createBuffer(1, totalLength, sourceSampleRate);
					audioBuffer.copyToChannel(concatenated, 0, 0);

					// Release the temporary context if you don't need it anymore
					tempCtx.close();

					// Step 3: Use an OfflineAudioContext to resample the AudioBuffer to the target sample rate
					const duration = audioBuffer.duration;
					const newLength = Math.ceil(duration * targetSampleRate);
					const offlineCtx = new OfflineAudioContext(1, newLength, targetSampleRate);

					const source = offlineCtx.createBufferSource();
					source.buffer = audioBuffer;
					source.connect(offlineCtx.destination);
					source.start(0);

					// Render the resampled AudioBuffer
					const renderedBuffer = await offlineCtx.startRendering();

					// Return the downsampled Float32Array
					return renderedBuffer.getChannelData(0);
				}

				var source_sample_rate = audio_context ? audio_context.sampleRate : 48000;
				if (source_sample_rate === sample_rate) {
					_callback ();
					_end_callback (offset, buffers);	
					return ;
				}

				downsampleAudioBuffer(buffers, source_sample_rate, sample_rate).then(newBuffer => {
					_callback ();
					_end_callback (offset, [newBuffer]);
				}).catch(error => {
					_callback ();
					console.error("Error during downsampling:", error);
				});

				// _end_callback (offset, buffers);
			};
			start_record_func = _start_callback;

			navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function( stream ) {
				audio_stream = stream;
				media_stream_source = audio_context.createMediaStreamSource ( stream );

            	script_processor = audio_context.createScriptProcessor (
                	buffer_size, channel_num, channel_num_out
                );

            	media_stream_source.connect ( script_processor );
            	script_processor.connect ( audio_context.destination );

            	is_active = true;
            	start_record_func && start_record_func ();

            	script_processor.onaudioprocess = fetchBufferFunction;
			}).catch(function(error) {
				app.fireEvent ('ErrorRec');

				if (error && error.message)
				{
					app.fireEvent ('ShowError', error.message);
				}
			});

			return (true);
		};

		this.stop = function ( cancel_recording ) {
			if (!is_active) return ;

			// fire one last callback to clean temp_buffers?
			audio_stream.getTracks().forEach(function (stream) {
				stream.stop ();
			});

			script_processor.onaudioprocess = null;
			media_stream_source.disconnect ();
			script_processor.disconnect ();

			app.engine.wavesurfer.DrawTemp ( null );

			if (temp_buffers.length > 0 && !cancel_recording)
				end_record_func && end_record_func ( starting_offset / sample_rate, temp_buffers, function (){
					is_active = false;
				});
			else
				end_record_func && end_record_func ( null, null, function(){
					is_active = false;
				});

			sample_rate = 0;
			first_skip = 8;
			jumps = 1;
			temp_buffer_index = -1;
			starting_offset = ending_offset = 0;
			temp_buffers = [];
			audio_stream = null; audio_context = null;
			end_record_func = start_record_func = null;
		};
		// ---
	};

	PKAE._deps.rec = PKREC;

})( window, document, PKAudioEditor );