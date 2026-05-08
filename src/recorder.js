(function ( w, d, PKAE ) {
	'use strict';

	var PKREC = function ( app ) {
		var q = this;

		var media_stream_source = null;
		var audio_stream = null;
		var audio_context = null;
		var script_processor = null;
		var recorder_node = null;
		var monitor_node = null;
		var capture_opts = null;
		var capture_id = 0;

		var buffer_size = 2048 * 2;
		var channel_num = 1;
		var channel_num_out = 1;

		var is_active = false;
		var is_starting = false;
		var is_stopping = false;

		var starting_offset = 0;
		var ending_offset = 0;

		var sample_rate = 0;
		var source_sample_rate = 0;

		var temp_buffers = [];
		var temp_buffer_index = -1;
		var draw_samples = 0;
		var skip_samples = 0;
		var aggr = null;
		var aggr_i = 0;

		var end_record_func = null;
		var start_record_func = null;

		var curr_offset = 0;
		var first_skip = 8;

		function reportError ( error, cb ) {
			is_starting = false;
			stopCapture ();
			if (cb) {
				cb ( error );
				return ;
			}
			app.fireEvent ('ErrorRec');
			app.fireEvent ('ShowError', error && error.message ? error.message : 'No recording device found');
		}

		function flushAgg () {
			if (!aggr || !aggr_i || !capture_opts || !capture_opts.ondata) return ;
			capture_opts.ondata ( aggr.subarray (0, aggr_i).slice (0) );
			aggr_i = 0;
		}

		function pushInput ( input, owned ) {
			if (!capture_opts || !capture_opts.ondata || !input) return ;

			var size = capture_opts.chunkSize || buffer_size;
			if (input.length === size && !aggr_i) {
				capture_opts.ondata ( owned ? input : input.slice (0) );
				return ;
			}
			if (!aggr || aggr.length !== size) aggr = new Float32Array ( size );

			for (var off = 0; off < input.length;) {
				var n = Math.min (size - aggr_i, input.length - off);
				aggr.set (input.subarray (off, off + n), aggr_i);
				aggr_i += n;
				off += n;
				if (aggr_i === size) {
					capture_opts.ondata ( aggr );
					aggr = new Float32Array ( size );
					aggr_i = 0;
				}
			}
		}

		function connectNode () {
			monitor_node = audio_context.createGain ();
			monitor_node.gain.value = 0;
			media_stream_source.connect ( recorder_node );
			recorder_node.connect ( monitor_node );
			monitor_node.connect ( audio_context.destination );
		}

		function startScriptNode () {
			script_processor = audio_context.createScriptProcessor (
				buffer_size, channel_num, channel_num_out
			);
			recorder_node = script_processor;
			script_processor.onaudioprocess = function ( ev ) {
				pushInput ( ev.inputBuffer.getChannelData (0) );
			};
			connectNode ();
		}

		function startWorkletNode () {
			recorder_node = new w.AudioWorkletNode (audio_context, 'pk-recorder', {
				numberOfInputs: 1,
				numberOfOutputs: 1,
				outputChannelCount: [1],
				processorOptions: {size: capture_opts.chunkSize || buffer_size}
			});
			recorder_node._pk_wk = true;
			recorder_node.port.onmessage = function ( ev ) {
				if (ev.data !== 0) pushInput ( ev.data, true );
			};
			connectNode ();
		}

		function loadWorklet () {
			if (!audio_context.audioWorklet || !w.AudioWorkletNode)
				return Promise.reject ();
			if (!audio_context._pk_rec_wk)
				audio_context._pk_rec_wk = audio_context.audioWorklet.addModule ('recorder-worklet.js');
			return audio_context._pk_rec_wk;
		}

		this.startCapture = function ( opts ) {
			if (is_active || is_starting || is_stopping) return false;
			opts = opts || {};
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !opts.ctx) {
				reportError ( null, opts.onerror );
				return false;
			}

			audio_context = opts.ctx;
			audio_context.resume && audio_context.resume ();
			capture_opts = opts;
			source_sample_rate = audio_context.sampleRate;
			is_starting = true;
			aggr = null;
			aggr_i = 0;

			var id = ++capture_id;
			var audio_constraints = {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			};
			navigator.mediaDevices.getUserMedia ({
				audio: audio_constraints,
				video: false
			}).then(function ( stream ) {
				if (id !== capture_id) {
					stream.getTracks ().forEach (function ( t ) { t.stop (); });
					return ;
				}
				audio_stream = stream;
				media_stream_source = audio_context.createMediaStreamSource ( stream );
				return loadWorklet ().then ( startWorkletNode, startScriptNode );
			}).then(function () {
				if (id !== capture_id || !recorder_node) return ;
				is_starting = false;
				is_active = true;
				capture_opts.onstart && capture_opts.onstart ();
			}).catch(function ( error ) {
				if (id === capture_id) reportError ( error, opts.onerror );
			});

			return true;
		};

		function finishCapture ( done ) {
			flushAgg ();

			if (script_processor) script_processor.onaudioprocess = null;
			if (recorder_node && recorder_node.port) recorder_node.port.onmessage = null;
			if (recorder_node) { try { recorder_node.disconnect (); } catch (e) {} }
			if (monitor_node) { try { monitor_node.disconnect (); } catch (e2) {} }
			if (media_stream_source) { try { media_stream_source.disconnect (); } catch (e3) {} }
			if (audio_stream) {
				audio_stream.getTracks ().forEach(function ( stream ) {
					stream.stop ();
				});
			}

			media_stream_source = null;
			audio_stream = null;
			script_processor = null;
			recorder_node = null;
			monitor_node = null;
			capture_opts = null;
			aggr = null;
			aggr_i = 0;
			is_stopping = false;
			done && done ();
		}

		function stopCapture ( done ) {
			if (is_stopping) return ;
			++capture_id;
			is_starting = false;
			is_active = false;
			is_stopping = true;

			if (recorder_node && recorder_node._pk_wk && recorder_node.port) {
				var did = false;
				recorder_node.port.onmessage = function ( ev ) {
					if (ev.data === 0) {
						if (did) return ;
						did = true;
						finishCapture ( done );
					}
					else pushInput ( ev.data, true );
				};
				recorder_node.port.postMessage (0);
				w.setTimeout(function () {
					if (did) return ;
					did = true;
					finishCapture ( done );
				}, 60);
				return ;
			}

			finishCapture ( done );
		}

		this.stopCapture = stopCapture;

		function fetchBufferFunction ( float_array ) {
			if (skip_samples > 0) {
				skip_samples -= float_array.length;
				return ;
			}

			curr_offset += float_array.length / source_sample_rate * sample_rate;
			if (ending_offset <= curr_offset) {
				ending_offset > 0 && q.stop ();
				return ;
			}

			temp_buffers[ ++temp_buffer_index ] = float_array;
			draw_samples += float_array.length;

			if (temp_buffer_index === 0 || draw_samples >= buffer_size * 4) {
				requestAnimationFrame(function () {
					draw_samples = 0;
					app.engine.wavesurfer.DrawTemp ( starting_offset, temp_buffers );
				});
			}
		}

		this.isActive = function () {
			return (is_active || is_starting);
		};

		this.setEndingOffset = function ( ending_offset_seconds ) {
			ending_offset = ending_offset_seconds;
		};

		this.start = function ( _at_offset, _end_callback, _start_callback, _sample_rate ) {
			if (is_active || is_starting) return (false);

			starting_offset = _at_offset / 1;
			if (isNaN (starting_offset) || !starting_offset) starting_offset = 0;
			curr_offset = starting_offset;

			audio_context = app.engine.wavesurfer.backend.getAudioContext ();
			if (!audio_context) {
				app.fireEvent ('ErrorRec');
				app.fireEvent ('ShowError', 'No recording device found');
				return (false);
			}

			if (audio_context.currentTime === 0) {
				app.engine.wavesurfer.backend.source.start (0);
				app.engine.wavesurfer.backend.source.stop (0);
				app.engine.wavesurfer.backend.createSource ();
			}

			sample_rate = _sample_rate || (
				app.engine.wavesurfer.backend.buffer ?
					app.engine.wavesurfer.backend.buffer.sampleRate :
					audio_context.sampleRate
			);
			source_sample_rate = audio_context.sampleRate;
			skip_samples = first_skip * buffer_size;
			draw_samples = 0;

			end_record_func = function (offset, buffers, _callback) {
				async function downsampleAudioBuffer ( buffers, sourceSampleRate, targetSampleRate ) {
					var totalLength = buffers.reduce(function (sum, buf) {
						return sum + buf.length;
					}, 0);
					var concatenated = new Float32Array ( totalLength );
					var off = 0;
					for (var i = 0; i < buffers.length; ++i) {
						concatenated.set (buffers[i], off);
						off += buffers[i].length;
					}

					var OfflineCtx = w.OfflineAudioContext || w.webkitOfflineAudioContext;
					var audioBuffer = new OfflineCtx (1, totalLength, sourceSampleRate)
						.createBuffer (1, totalLength, sourceSampleRate);
					audioBuffer.copyToChannel (concatenated, 0, 0);

					var duration = audioBuffer.duration;
					var newLength = Math.ceil (duration * targetSampleRate);
					var offlineCtx = new OfflineCtx (1, newLength, targetSampleRate);
					var source = offlineCtx.createBufferSource ();
					source.buffer = audioBuffer;
					source.connect (offlineCtx.destination);
					source.start (0);

					var renderedBuffer = await offlineCtx.startRendering ();
					return renderedBuffer.getChannelData (0);
				}

				if (source_sample_rate === sample_rate) {
					_callback ();
					_end_callback (offset, buffers);
					return ;
				}

				downsampleAudioBuffer (buffers, source_sample_rate, sample_rate).then(function ( newBuffer ) {
					_callback ();
					_end_callback (offset, [newBuffer]);
				}).catch(function () {
					_callback ();
					app.fireEvent ('ShowError', 'Could not resample recording');
				});
			};
			start_record_func = _start_callback;

			return q.startCapture ({
				ctx: audio_context,
				chunkSize: buffer_size,
				ondata: fetchBufferFunction,
				onstart: function () {
					start_record_func && start_record_func ();
				},
				onerror: function ( error ) {
					app.fireEvent ('ErrorRec');
					if (error && error.message) app.fireEvent ('ShowError', error.message);
					else app.fireEvent ('ShowError', 'No recording device found');
				}
			});
		};

		this.stop = function ( cancel_recording ) {
			if (!is_active && !is_starting) return ;

			stopCapture (function () {
				app.engine.wavesurfer.DrawTemp ( null );

				if (temp_buffers.length > 0 && !cancel_recording)
					end_record_func && end_record_func ( starting_offset / sample_rate, temp_buffers, function () {});
				else
					end_record_func && end_record_func ( null, null, function () {});

				sample_rate = 0;
				source_sample_rate = 0;
				first_skip = 8;
				draw_samples = 0;
				skip_samples = 0;
				temp_buffer_index = -1;
				starting_offset = ending_offset = 0;
				temp_buffers = [];
				audio_context = null;
				end_record_func = start_record_func = null;
			});
		};
	};

	PKAE._deps.rec = PKREC;

})( window, document, PKAudioEditor );
