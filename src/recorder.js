(function ( w, d, PKAE ) {
	'use strict';

	var PKREC = function ( app ) {
		var q = this;

		var media_stream_source = null;
		var audio_stream = null;
		var audio_context = null;
		var script_processor = null;

		var buffer_size = 2048; // * 2 ?
		var channel_num = 1;
		var channel_num_out = 1;

		var is_active = false;

		var starting_offset = 0;
		var ending_offset = 0;

		var sample_rate = 0;

		var temp_buffers = [];
		var temp_buffer_index = -1;
		var jumps = 4;

		var end_record_func = null;
		var start_record_func = null;

		// temp vars
		var curr_offset = 0;
		var first_skip = 12; // skip first samples to evade the button's click
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
				jumps = 4;
				app.engine.wavesurfer.DrawTemp ( starting_offset, temp_buffers );
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
				if (app.engine.wavesurfer.backend.buffer)
					sample_rate = app.engine.wavesurfer.backend.buffer.sampleRate;
				else
					sample_rate = audio_context.sampleRate;
			}

			end_record_func = _end_callback;
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

			is_active = false;
			app.engine.wavesurfer.DrawTemp ( null );

			if (temp_buffers.length > 0 && !cancel_recording)
				end_record_func && end_record_func ( starting_offset / sample_rate, temp_buffers );
			else
				end_record_func && end_record_func ( null, null );

			sample_rate = 0;
			first_skip = 12;
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