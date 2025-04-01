(function( PKAE ) {
	'use strict';

	function AudioUtils ( master, wavesurfer ) {

		// audio destination
		var audio_destination = wavesurfer.backend.analyser;
		var audio_ctx   = wavesurfer.backend.ac;
		var audio_script_node = audio_ctx.createScriptProcessor(256);

		function loadDecoded ( new_buffer ) {
			wavesurfer.loadDecodedBuffer ( new_buffer );
			master.fireEvent ('DidUpdateLen', wavesurfer.getDuration ());
		};

		function OverwriteBufferWithSegment (_offset, _duration, withBuffer ) {
			var originalBuffer = wavesurfer.backend.buffer;
			TrimBuffer( _offset, _duration, true );
			var ret = InsertSegmentToBuffer ( _offset, withBuffer );

			setTimeout (function() {
				wavesurfer.drawBuffer();
			},40);

			return (ret);
		}

		function OverwriteBuffer ( withBuffer ) {
			loadDecoded ( withBuffer );
			setTimeout (function() {
				wavesurfer.drawBuffer();
			},40);
		}
		
		function MakeSilenceBuffer ( _duration ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var emptySegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				_duration * originalBuffer.sampleRate,
				originalBuffer.sampleRate
			);

			return (emptySegment);
		}


		function CopyBufferSegment( _offset, _duration ) {
			var originalBuffer = wavesurfer.backend.buffer;

			var new_len    = ((_duration/1) * originalBuffer.sampleRate) >> 0;
			var new_offset = ((_offset/1)   * originalBuffer.sampleRate) >> 0;

			var emptySegment = wavesurfer.backend.ac.createBuffer (
				wavesurfer.SelectedChannelsLen,
				new_len,
				originalBuffer.sampleRate
			);

			for (var i = 0, u = 0; i < wavesurfer.ActiveChannels.length; ++i) {
				if (wavesurfer.ActiveChannels[ i ] === 0) continue;

				emptySegment.getChannelData ( u ).set (
					originalBuffer.getChannelData ( i ).slice ( new_offset, new_len + new_offset )
				);

				++u;
			}
			return (emptySegment);
		};
		
		
		function TrimBuffer( _offset, _duration, force ) {
			var originalBuffer = wavesurfer.backend.buffer;

			var new_len    = ((_duration/1) * originalBuffer.sampleRate) >> 0;
			var new_offset = ((_offset/1)   * originalBuffer.sampleRate) >> 0;

			var emptySegment = wavesurfer.backend.ac.createBuffer (
				!force ? wavesurfer.SelectedChannelsLen : originalBuffer.numberOfChannels,
				new_len,
				originalBuffer.sampleRate
			);

			var uberSegment = null;

			if (!force && wavesurfer.SelectedChannelsLen < originalBuffer.numberOfChannels)
			{
				uberSegment = wavesurfer.backend.ac.createBuffer (
					originalBuffer.numberOfChannels,
					originalBuffer.length,
					originalBuffer.sampleRate
				);

				for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {
					var chan_data = originalBuffer.getChannelData ( i );
					var uber_chan_data = uberSegment.getChannelData ( i );

					if (wavesurfer.ActiveChannels[ i ] === 0)
					{
						uber_chan_data.set (
							chan_data
						);
					}
					else
					{
						var segment_chan_data = emptySegment.getChannelData (0);

						segment_chan_data.set (
							chan_data.slice ( new_offset, new_offset + new_len )
						);
						
						uber_chan_data.set (
							chan_data.slice ( 0, new_offset )
						);

						uber_chan_data.set (
							chan_data.slice ( new_offset + new_len ), new_offset + new_len
						);
					}
				}
			}
			else
			{
				uberSegment = wavesurfer.backend.ac.createBuffer(
					originalBuffer.numberOfChannels,
					originalBuffer.length - new_len,
					originalBuffer.sampleRate
				);

				for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {
					var chan_data = originalBuffer.getChannelData(i);
					var segment_chan_data = emptySegment.getChannelData(i);
					var uber_chan_data = uberSegment.getChannelData(i);

					segment_chan_data.set (
						chan_data.slice ( new_offset, new_offset + new_len )
					);
					
					uber_chan_data.set (
						chan_data.slice ( 0, new_offset )
					);
					
					uber_chan_data.set (
						chan_data.slice ( new_offset + new_len ), new_offset
					);
				}
			}

			loadDecoded ( uberSegment, originalBuffer );

			return (emptySegment);
		};
		
		
		
		function InsertSegmentToBuffer( _offset, buffer ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var uberSegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				originalBuffer.length + buffer.length,
				originalBuffer.sampleRate
			);

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {

				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );
				var segment_chan_data = null;

				if (buffer.numberOfChannels === 1)
					segment_chan_data = buffer.getChannelData( 0 );
				else
					segment_chan_data = buffer.getChannelData( i );

				// check to see if we have only 1 channel selected
				if (wavesurfer.SelectedChannelsLen === 1)
				{
					// check if we have the selected channel
					if (wavesurfer.ActiveChannels[ i ] === 0)
					{
						// keep original
						uberChanData.set (
							chan_data
						);
					
						continue;
					}
				}

				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				uberChanData.set (
					segment_chan_data, _offset
				);

				if (_offset < (originalBuffer.length + buffer.length) )
				{
					uberChanData.set (
						chan_data.slice( _offset ), _offset + segment_chan_data.length
					);
				}
			}
			
			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate), 
				(_offset / originalBuffer.sampleRate) + (buffer.length / originalBuffer.sampleRate)
			];
		};


		function ReplaceFloatArrays ( _offset, arrays ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var arr_len = arrays.length;
			var arr_samples = arrays[0].length;

			var new_len = (arr_samples * arr_len);
			var buff_len = originalBuffer.length;

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			if (buff_len < (_offset + new_len)) {
				buff_len = (_offset + new_len);
			}

			var uberSegment = wavesurfer.backend.ac.createBuffer (
				originalBuffer.numberOfChannels,
				buff_len,
				originalBuffer.sampleRate
			);

			for (var i = 0; i < originalBuffer.numberOfChannels; i++) {
				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );


				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				for (var j = 0; j < arr_len; ++j)
				{
					uberChanData.set (
						arrays[ j ], _offset + (j * arr_samples)
					);
				}

				if (_offset < (originalBuffer.length + new_len) )
				{
					uberChanData.set (
						chan_data.slice( _offset + new_len ), _offset + new_len
					);
				}
			}

			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate), 
				(_offset / originalBuffer.sampleRate) + (new_len / originalBuffer.sampleRate)
			];
		};

		function InsertFloatArrays( _offset, arrays ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var arr_len = arrays.length;
			var arr_samples = arrays[0].length;

			var new_len = (arr_samples * arr_len);

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			var uberSegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				originalBuffer.length + new_len,
				originalBuffer.sampleRate
			);

			for (var i = 0; i < originalBuffer.numberOfChannels; i++) {
				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );


				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				for (var j = 0; j < arr_len; ++j)
				{
					uberChanData.set (
						arrays[ j ], _offset + (j * arr_samples)
					);
				}

				if (_offset < (originalBuffer.length + new_len) )
				{
					uberChanData.set (
						chan_data.slice( _offset ), _offset + new_len
					);
				}
			}

			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate), 
				(_offset / originalBuffer.sampleRate) + (new_len / originalBuffer.sampleRate)
			];
		};
		
		function getAudioContext() {
			if (!window.WaveSurferAudioContext) {
				window.WaveSurferAudioContext = new (window.AudioContext ||
					window.webkitAudioContext)();
			}
			return window.WaveSurferAudioContext;
		}
		function getOfflineAudioContext (channels, sampleRate, duration) {
			return new (window.OfflineAudioContext ||
					window.webkitOfflineAudioContext)(channels, duration, sampleRate);
		};

		function initPreview (val) {
			this.previewVal = val;
		};

		function stopPreview (_fx) {
			if (!this.previewing) return ;

			if (_fx) {
				_fx.destroy && _fx.destroy ();
			}

			if (this.PreviewFilter)
			{
				if (this.PreviewFilter.length > 0)
				{
					for (var ii = 0; ii < this.PreviewFilter.length; ++ii)
						this.PreviewFilter[ ii ].disconnect ();
				}
				else
					this.PreviewFilter.disconnect ();
			}

			var script_node = audio_script_node; // wavesurfer.backend.scriptNode

			script_node.disconnect ();
			wavesurfer.backend.scriptNode.connect (audio_ctx.destination);
			// wavesurfer.backend.scriptNode.connect (audio_ctx.destination);
			// wavesurfer.backend.scriptNode.onaudioprocess = null;

			this.PreviewSource.stop();
			this.PreviewSource.disconnect ();

			this.PreviewDestination = this.PreviewSource = this.PreviewFilter = this.PreviewUpdate = null;
			this.previewing = 0;
		}
		function togglePreview () {
			if (!this.previewing) {

				this.previewVal = !this.previewVal;
				return (this.previewVal);
			}

			if (this.previewing === 2)
			{
//				if (this.PreviewFilter)
//				{
//					if (this.PreviewFilter.length > 0)
//					{
//						for (var ii = 0; ii < this.PreviewFilter.length; ++ii)
//							this.PreviewFilter[ ii ].disconnect ();
//					}
//					else
//						this.PreviewFilter.disconnect ();
//				}

				if (this.PreviewTog) {
					this.PreviewTog (false, this.PreviewSource);
				}

				this.PreviewSource.disconnect ();
				this.PreviewSource.connect (this.PreviewDestination);
				this.previewing = 1;
				this.previewVal = false;
				
				return (false);
			}
			else
			{
				this.PreviewSource.disconnect ();

				if (this.PreviewFilter)
				{
					if (this.PreviewFilter.length > 0)
					{
						!this.PreviewFilter[ 0 ].buffer && this.PreviewSource.connect (this.PreviewFilter[ 0 ]);
//						var ii = 0;
//						for (; ii < this.PreviewFilter.length - 1; ++ii)
//						{
//							this.PreviewFilter[ ii ].disconnect ();
//							this.PreviewFilter[ ii ].connect (this.PreviewFilter[ ii + 1 ]);
//						}
//						this.PreviewFilter[ ii ].connect (this.PreviewDestination);
					}
					else
					{
						!this.PreviewFilter.buffer && this.PreviewSource.connect (this.PreviewFilter);
						this.PreviewFilter.disconnect ();
						this.PreviewFilter.connect (this.PreviewDestination);
					}
				}

				if (this.PreviewTog) {
					this.PreviewTog (true, this.PreviewSource);
				}

				this.previewing = 2;
				this.previewVal = true;

				return (true);
			}
		}


		function previewEffect ( _offset, _duration, _fx ) {
			if (this.previewing) stopPreview (_fx);

			var orig_buffer = wavesurfer.backend.buffer;

			if (!_offset && !_duration)
			{
				_offset = 0;
				_duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
			}

			var script_node = audio_script_node; //wavesurfer.backend.scriptNode;
			var fx_buffer = CopyBufferSegment (_offset, _duration);
			var audio_ctx = wavesurfer.backend.ac || getAudioContext ();
			var source = audio_ctx.createBufferSource ();
			source.buffer = fx_buffer;
			source.loop = true;

			this.PreviewFilter = this.PreviewTog = null;
			if (!_fx)
				source.connect (audio_destination);
			else
			{
				this.PreviewTog    = _fx.preview;
				this.PreviewUpdate = _fx.update;
				this.PreviewFilter = _fx.filter ( audio_ctx, audio_destination, source, _duration/1 );
			}

			script_node.disconnect ();
			wavesurfer.backend.scriptNode.disconnect ();
			script_node.connect( audio_ctx.destination );

			var skipp = 1;
			var prev_fft = 0;
			var dataArray = null;

			script_node.onaudioprocess = ( e ) => {

				var loudness = [0, 0];
				var temp = 0;
				// var flip = false;
				--skipp;

				if (skipp === 0)
				{
					if (audio_destination.getFloatTimeDomainData)
					{
						if (prev_fft !== audio_destination.fftSize)
						{
		                	dataArray = new Float32Array(audio_destination.fftSize); // Float32Array needs to be the same length as the fftSize 
		                	prev_fft = audio_destination.fftSize;
		                }
		                audio_destination.getFloatTimeDomainData (dataArray); // fill the Float32Array with data returned from getFloatTimeDomainData()

		                for (var j = 0; j < audio_destination.fftSize; j += 1) {
		                    var x = dataArray[j];
		                    if (Math.abs(x) >= temp) {
		                        temp = Math.abs(x);
		                    }
		                }

		                loudness[0] = 20 * Math.log10(temp) + 0.001;
					}
					else
					{
						if (prev_fft !== audio_destination.fftSize)
						{
		                	dataArray = new Uint8Array(audio_destination.fftSize); // Float32Array needs to be the same length as the fftSize 
		                	prev_fft = audio_destination.fftSize;
		                }
		                audio_destination.getByteTimeDomainData (dataArray); // fill the Float32Array with data returned from getFloatTimeDomainData()

		                var total_float = 0;

						for (var j = 0; j < audio_destination.fftSize; j += 1) {
						    var float = ( dataArray[j] / 0x80 ) - 1;
						    total_float += ( float * float );
						}
						var rms = Math.sqrt (total_float / audio_destination.fftSize);
						loudness[0] = 20 * ( Math.log(rms) / Math.log(10) );
					}

	                if (loudness[0] < -100) loudness[0] = -100;
	                loudness[1] = loudness[0];

					// audio_destination.fftSize = 512;
					audio_destination.getByteFrequencyData( wavesurfer.backend.FreqArr );

					//wavesurfer.backend.peak_frequency = Math.max.apply( null, wavesurfer.backend.FreqArr );
					master.fireEvent ('DidAudioProcess',[-1, loudness, e.timeStamp], wavesurfer.backend.FreqArr);
					// wavesurfer.backend.peak_frequency = [0, 0];
					skipp = 2;
				}
			};

			source.start ();

			this.PreviewSource = source;
			this.PreviewDestination = audio_destination;
			this.previewing = 2;

			if (!this.previewVal)
			{
				togglePreview.call (this);
			}

			return (source);
		}

		function applyEffect( _offset, _duration, _fx ) {
			var orig_buffer = wavesurfer.backend.buffer;

			if (!_offset && !_duration)
			{
				_offset = 0;
				_duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
			}

			if (_offset <0) _offset = 0;
			if (wavesurfer.getDuration () < _duration)
				_duration  = wavesurfer.getDuration ();

			var fx_buffer = CopyBufferSegment ( _offset, _duration );
			var new_offset = ((_offset/1)   * orig_buffer.sampleRate) >> 0;

			var audio_ctx = getOfflineAudioContext (
					wavesurfer.SelectedChannelsLen, // orig_buffer.numberOfChannels,
					orig_buffer.sampleRate,
					fx_buffer.length
			);

			var source = audio_ctx.createBufferSource ();
			source.buffer = fx_buffer;

			var filter = null;
			if (_fx) {
				filter = _fx.filter ( audio_ctx, audio_ctx.destination, source, _duration/1 );
				filter.destroy && filter.destroy ();
			}

			source.start ();

			var offline_callback = function( rendered_buffer ) {
				var uber_buffer = wavesurfer.backend.ac.createBuffer(
					orig_buffer.numberOfChannels,
					orig_buffer.length,
					orig_buffer.sampleRate
				);
				
				for (var i = 0; i < orig_buffer.numberOfChannels; ++i)
				{
					var uber_chan_data = uber_buffer.getChannelData (i);
					var chan_data = orig_buffer.getChannelData (i);

					// check if channel is active
					if (wavesurfer.ActiveChannels[ i ] === 0)
					{
						uber_chan_data.set (
							chan_data
						);
						continue;
					}

					var fx_chan_data = null;
					if (rendered_buffer.numberOfChannels === 1)
						fx_chan_data = rendered_buffer.getChannelData( 0 );
					else
						fx_chan_data = rendered_buffer.getChannelData( i );

					uber_chan_data.set (
						chan_data
					);

					uber_chan_data.set (
						fx_chan_data, new_offset, fx_chan_data.length - new_offset
					);
				}

				loadDecoded ( uber_buffer );
				
				if (filter.length > 0) {
					for (var i = 0; i < filter.length; ++i) filter[i].disconnect ();
				} else filter && filter.disconnect && filter.disconnect ();

				// is this needed?
				rendered_buffer = fx_buffer = filter = null;
				source.disconnect ();
				// audio_ctx.close ();
				// -
			};

			var offline_renderer = audio_ctx.startRendering(); 
			if (offline_renderer)
				offline_renderer.then( offline_callback ).catch(function(err) {
					console.log('Rendering failed: ' + err);
				});
			else
				audio_ctx.oncomplete = function ( e ) {
					offline_callback ( e.renderedBuffer );
				};
		};


/*
		/////////////// -----------------------
		// ATTEMPTING BACKGROUND NOISE REMOVAL
		function findTopFrequencies (_offset, _duration, callback) {
			var q = this;

			var audio_ctx = getAudioContext ();
			var buffer_source = audio_ctx.createBufferSource();
			buffer_source.buffer = CopyBufferSegment (_offset, _duration);

			var analyser = audio_ctx.createAnalyser ();
			analyser.fftSize  = 2048;
			analyser.minDecibelsis  = -40;
			analyser.maxDecibelsis  = 0;
			var scp = audio_ctx.createScriptProcessor (256, 0, 1);

			buffer_source.connect (analyser);
			scp.connect (audio_ctx.destination);
			// buffer_source.loop = true;

			var samples = 0;
			var finger_print = new Uint16Array (analyser.frequencyBinCount);
			var freq_data = new Uint8Array (analyser.frequencyBinCount);
			scp.onaudioprocess = function () {
				analyser.getByteFrequencyData (freq_data);

				for (var i = 0; i < freq_data.length; ++i)
				{
					finger_print[ i ] += freq_data [ i ];
				}
				++samples;
			};
			buffer_source.onended = function() {

				   var sampleRate = buffer_source.buffer.sampleRate;
				   buffer_source.stop ();
				   buffer_source.disconnect ();
				   scp.disconnect ();
				   
				for (var i = 0; i < finger_print.length; ++i)
				{
					finger_print[ i ] /= samples >> 0;
					if (finger_print[ i ] < 10) {
						finger_print[ i ] = 0;
					}
				}

				callback && callback.apply (q, [finger_print] );
			};
			buffer_source.start (0);
		}
		function killdTopFrequencies (_offset, _duration, _noise_profile) {
			var q = this;
			var step = function ( _offset, _duration, callback ) {
				findTopFrequencies (_offset, _duration, function( frequencies ) {
					var similarity = [];
					var similar_frequencies = 0;

					for (var i = 0; i < _noise_profile.length; ++i)
					{
						var val = Math.abs ( frequencies[ i ] - _noise_profile[ i ] );
						if (val < 10)
						{
							similarity[ i ] = (val == 0 && _noise_profile[ i ] > 0) ? 5 : val;
							++similar_frequencies;
						}
					}

					if ( similar_frequencies > _noise_profile.length / 3)
					{
						cleanUpSpecificAudioRange.apply (q, [_offset, _duration, similarity]);
					}
					
					callback && callback ();
				});
			};
			if (_duration <= 0.1) step ( _offset, _duration );
			else
			{
				var new_offset = _offset;
				var goal = _offset + _duration;

				var test = function () {
					if ( new_offset < goal ) {
						var dur_step = 0.1;
						if (new_offset + dur_step > goal) dur_step = goal - new_offset;

						step ( new_offset, dur_step, test );
						new_offset += dur_step;
					}
				}
				test ();
				// -
				
			}
		}
		function cleanUpSpecificAudioRange (_offset, _duration, _frequencies) {
			// var fx_buffer = CopyBufferSegment (_offset, _duration);
			var val = [];
			var all_ok = false;
			
			for (var i = 0; i < _frequencies.length; ++i)
			{
				if (!_frequencies[i]) continue;
				val.push({
					'type' : 'notch',
					'freq' : (i * wavesurfer.backend.ac.sampleRate/_frequencies.length)/2,
					'val'  : -35,//(_frequencies[i]),
					'q'	   : 10.0
				});
				all_ok = true;
			}

			if (all_ok)
			{
				var ff = this.FXBank.ParametricEQ( val );
				this.FX( _offset, _duration, ff );
			}

*/

/*
						var bands = [];
						var len = val.length;

						var makeEQ = function ( band ) {
							var eq = audio_ctx.createBiquadFilter ();
							eq.type = band.type;
							eq.gain.value = ~~band.val;
							eq.Q.value = 1;
							eq.frequency.value = band.freq;

							return (eq);
						};
						
						var eq = makeEQ ( val [0] );
						bands.push ( eq );
						source.connect (eq);

						for (var i = 1; i < len - 1; ++i)
						{
							eq = makeEQ ( val [ i ] );
							bands [ i - 1 ].connect ( eq );
							bands.push ( eq );
						}
						eq = makeEQ ( val [ len - 1 ] );
						bands [ bands.length - 1 ].connect ( eq );
						bands.push ( eq );
						eq.connect (audio_ctx.destination);

						return (bands);
*/
//		}
		// ENDOF ATTEMPTING BACKGROUND NOISE REMOVAL
		/////////////// -----------------------
		

		var worker = null;
		function DownloadFileCancel () {
			if (worker) {
				worker.terminate ();
				worker = null;
			}
		}

		function DownloadFile( with_name, format, kbps, selection, stereo, callback ) {
			if (wavesurfer && wavesurfer.backend && wavesurfer.backend.buffer){}
			else {
				return false;
			}
			

			if (format === 'mp3') {
				worker = new Worker('lame.js');
			}
			else if (format === 'flac') {
				worker = new Worker('flac.js');
			}
			else {
				worker = new Worker('wav.js');
			}

			var originalBuffer = wavesurfer.backend.buffer;
			var sample_rate = originalBuffer.sampleRate;

			var channels = originalBuffer.numberOfChannels;

			var data_left = originalBuffer.getChannelData ( 0 );
			var data_right = null;
			if (channels === 2)
				data_right = originalBuffer.getChannelData ( 1 );

			if (!stereo && channels === 2)
			{
				if (!wavesurfer.ActiveChannels[0] && wavesurfer.ActiveChannels[1])
				{
					data_left  = originalBuffer.getChannelData ( 1 );
					data_right = null;
					channels   = 1;
				}
			}

			if (stereo && !data_right)
			{
				data_right = data_left;
				channels   = 2;
			}
			else if (!stereo && data_right)
			{
				data_right = null;
				channels   = 1;
			}

			var len = data_left.length, i = 0;
			var offset = 0;

			if (selection)
			{
				offset = (selection[0] * sample_rate) >> 0;
				len = ((selection[1] * sample_rate) >> 0) - offset;
			}

			var dataAsInt16ArrayLeft = new Int16Array(len);
			var dataAsInt16ArrayRight = null;


			if (data_right)
			{
				dataAsInt16ArrayRight = new Int16Array(len);

				while(i < len) {
					dataAsInt16ArrayLeft[i] = convert(data_left[offset + i]);
				 	dataAsInt16ArrayRight[i] = convert(data_right[offset + i]);
				 	++i;
				}
			}
			else
			{
				while(i < len) {
					dataAsInt16ArrayLeft[i] = convert(data_left[offset + i]);
				 	++i;
				}
			}
			function convert ( n ) {
				 var v = n < 0 ? n * 32768 : n * 32767;       // convert in range [-32768, 32767]
				 return Math.max(-32768, Math.min(32768, v)); // clamp
			}

			worker.onmessage = function( ev ) {
				if (ev.data.percentage)
				{
					callback && callback ( ev.data.percentage );
					return ;
				}
				forceDownload( ev.data );

				worker.terminate ();
				worker = null;
			}

			worker.postMessage ({
				sample_rate: sample_rate,
				kbps:!kbps ? 128 : kbps,
				flac_compression: kbps,
				channels: channels
			});
			worker.postMessage ( dataAsInt16ArrayLeft.buffer, [dataAsInt16ArrayLeft.buffer] );
			if (data_right)
				worker.postMessage ( dataAsInt16ArrayRight.buffer, [dataAsInt16ArrayRight.buffer] );
			else
				worker.postMessage (null);

			// function forceDownload ( mp3Data ) {
			// 	var blob = new Blob (mp3Data, {type:'audio/mp3'});
			function forceDownload ( blob ) {			
				var url = (window.URL || window.webkitURL).createObjectURL(blob);

				var a = document.createElement( 'a' );
				a.href = url;
				a.download = with_name ? with_name : 'output.mp3';
				a.style.display = 'none';
				document.body.appendChild( a );
				a.click();

				callback && callback ('done');
			}
		}
		
		function updatePreview ( val ) {
			if (!this.previewing) return ;
			this.PreviewUpdate && this.PreviewUpdate ( this.PreviewFilter, audio_ctx, val, this.PreviewSource );
		}
		

		// EFFECTS LOGIC
		var FXBank = {
			Gain : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();

						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									gain.gain.linearRampToValueAtTime (curr[i].val, audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								gain.gain.setValueAtTime ( curr.val, audio_ctx.currentTime );
							}
						}

						gain.connect (destination);
						source.connect (gain);

						return (gain);
					},
					update : function ( gain, audio_ctx, val ) {
						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									gain.gain.linearRampToValueAtTime (curr[i].val, audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								gain.gain.setValueAtTime ( curr.val, audio_ctx.currentTime );
							}
						}
						// ----
					}
				};
			},
			
			FadeIn : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();
						gain.gain.setValueAtTime (0, audio_ctx.currentTime);
						gain.gain.linearRampToValueAtTime (1, audio_ctx.currentTime + duration/1);
						gain.connect (destination);	
						source.connect (gain);

						return (gain);
					}
				};
			},
			
			FadeOut : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();
						gain.gain.setValueAtTime (1, audio_ctx.currentTime);
						gain.gain.linearRampToValueAtTime (0, audio_ctx.currentTime + duration/1);
						gain.connect (destination);			
						source.connect (gain);

						return (gain);
					}
				};
			},
			
			Compressor : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var compressor = audio_ctx.createDynamicsCompressor ();

						for (var k in val)
						{
							if (val[k].length)
							{
								for (var i = 0; i < val[k].length; ++i)
								{
									var curr = val[k][i];
									compressor[k].linearRampToValueAtTime (curr.val, audio_ctx.currentTime + curr.time);
								}
							}
							else
							{
								compressor[k].setValueAtTime ( val[k].val, audio_ctx.currentTime );
							}
						}

						compressor.connect (destination);
						source.connect (compressor);

						return (compressor);
					},
					update : function ( compressor, audio_ctx, val ) {
						for (var k in val)
						{
							if (val[k].length)
							{
								for (var i = 0; i < val[k].length; ++i)
								{
									var curr = val[k][i];
									compressor[k].linearRampToValueAtTime (curr.val, audio_ctx.currentTime + curr.time);
								}
							}
							else
							{
								compressor[k].setValueAtTime ( val[k].val, audio_ctx.currentTime );
							}
						}
						// ---
					}
				};
			},

			Reverse : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							Array.prototype.reverse.call( source.buffer.getChannelData (i) );
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},
			
			Invert : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							var channel = source.buffer.getChannelData (i);
							
							for (var j = 0; j < channel.length; ++j)
								channel[j] *= -1;
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},

			Flip : function ( val, val2 ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						if (val === 'flip')
						{
							var chan0 = source.buffer.getChannelData (0);
							var chan1 = source.buffer.getChannelData (1);
							var tmp   = 0;

							for (var j = 0; j < chan0.length; ++j)
							{
								tmp = chan0[j];
								chan0[j] = chan1[j];
								chan1[j] = tmp;
							}
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},

			Normalize : function ( val ) { //todo ASM JS??
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var max_val = val[1] || 1.0;
						var equally = val[0];
						var max_peak = 0;

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							var chan_data = source.buffer.getChannelData (i);

							// iterating faster first time...
							for (var k = 1, len = chan_data.length; k < len; k = k + 10) {
								var curr = Math.abs ( chan_data [ k ] );
								if (max_peak < curr)
									max_peak = curr;
							}

							var diff = max_val / max_peak;

							if (!equally) {
								for (var k = 0, len = chan_data.length; k < len; ++k) {
									chan_data[ k ] *= diff;
								}
								max_peak = 0;
							}
						}
						
						if (equally) {
							var diff = max_val / max_peak;

							for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
								var chan_data = source.buffer.getChannelData (i);

								for (var k = 0, len = chan_data.length; k < len; ++k) {
									chan_data[ k ] *= diff;
								}
							}
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},
			
			HardLimit : function ( val ) { //todo ASM JS??
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var max_val = val[1] || 1.0;
						var ratio = val[2] || 0.0;
						var look_ahead = val[3] || 15; // ms
						var equally = false; //val[0];
						var max_peak = 0;

						var buffer = audio_ctx.createBuffer(
							source.buffer.numberOfChannels,
							source.buffer.length,
							source.buffer.sampleRate
						);
						
						look_ahead = (look_ahead * buffer.sampleRate/1000) >> 0;
						
						for (var i = 0; i < buffer.numberOfChannels; ++i) {
							var chan_data = buffer.getChannelData (i);
							chan_data.set ( source.buffer.getChannelData (i) );

							// iterating faster first time...
							for (var b = 0, len = chan_data.length; b < len; ++b)
							{
								for (var k = 0; k < look_ahead; k = k + 10) {
									var curr = Math.abs ( chan_data [ b + k ] );
									if (max_peak < curr)
										max_peak = curr;
								}
								
								var diff = (max_val / max_peak);

								if (!equally) {
									for (var k = 0; k < look_ahead; ++k) {
										var orig_val = chan_data[ b + k ];
										var new_val = orig_val * diff;

										var peak_diff = max_val - Math.abs (new_val);
										peak_diff *= orig_val < 0 ? -ratio : ratio;

										chan_data[ b + k ] = (new_val + peak_diff);
									}
									b += look_ahead;
									max_peak = 0;
								}
							}
							// -----
						}

						// todo handle disconnected LEFT AND RIGHT
						var temp_source = audio_ctx.createBufferSource ();
						temp_source.buffer = buffer;
						temp_source.loop = true;
						temp_source.start ();

						temp_source.connect (destination);
						return (temp_source);
					},
					update : function ( filtered_source, audio_ctx, val, source ) {
						// stop the existing onerror
						filtered_source.disconnect ();
						filtered_source.buffer = null;
						filtered_source = null;

						var ff = this.FXBank.HardLimit( val );
						this.PreviewFilter = ff.filter ( audio_ctx, audio_destination, source, 0 );
					}
				};
			},
			
			ParametricEQ : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var bands = [];
						var len = val.length;

						var makeEQ = function ( band ) {
							var eq = audio_ctx.createBiquadFilter ();

							if (band.length)
							{
								for (var i = 0; i < band.length; ++i)
								{
									eq.gain.linearRampToValueAtTime (~~band[i].val, audio_ctx.currentTime + band[i].time);
								}

								band = band[0];
							}
							else eq.gain.value = ~~band.val;

							eq.type = band.type;
							eq.Q.value = band.q || 1.0;
							eq.frequency.value = band.freq;

							return (eq);
						};

						if (!val[0])
						{
							val[0] = {
								type:'peaking',
								val:0,
								q:1,
								freq:500
							};
						}

						var eq = makeEQ ( val[0] );
						bands.push ( eq );
						source.connect (eq);

						if (val.length === 1)
						{
							eq.connect (destination);
							return (bands);
						}

						for (var i = 1; i < len - 1; ++i)
						{
							eq = makeEQ ( val [ i ] );
							bands [ i - 1 ].connect ( eq );
							bands.push ( eq );
						}
						eq = makeEQ ( val[ len - 1 ] );
						bands [ bands.length - 1 ].connect ( eq );
						bands.push ( eq );
						eq.connect (destination);

						return (bands);
					},
					update : function ( bands, audio_ctx, val, source ) {

						if (bands.length !== val.length)
						{
							var makeEQ = function ( band ) {
								var eq = audio_ctx.createBiquadFilter ();
								return (eq);
							};

							if (bands.length < val.length)
							{
								var l = val.length - bands.length;
								while (l-- > 0)
								{
									var eq = makeEQ ();
									var connect_to = bands[0];
									bands.unshift (eq);
									eq.connect (connect_to);
								}

								source.disconnect ();
								source.connect (bands[0]);
							}
							else
							{
								if (val.length > 0)
								{
										var l = bands.length - val.length;
										source.disconnect ();

										for (var i = 0; i < l; ++i)
										{
											var eq = bands.shift();
											eq.disconnect ();
										}

										source.connect (bands[0]);
								}
								else
								{
										val[0] = {
											type:'peaking',
											val:0,
											q:1,
											freq:500
										};
								}
							}
						}

						var len = val.length;
						for (var i = 0; i < len; ++i)
						{
							var eq = bands [ i ];
							eq.type = val[ i ].type;
							eq.gain.value =  ~~val[ i ].val;
							eq.Q.value = val[ i ].q || 1.0;
							eq.frequency.value = val[ i ].freq;
						}
						// -
					}
				};
			},

			Rate : function ( val ) {
				var prev_val = 1.0;
				var temp_source = [];

				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var fx_buffer = source.buffer;

						var stretch_ratio = val;
						let grainDuration = 0.05;  // 50 ms grain
						const analysisHop = 0.025;   // 25 ms step (50% overlap)
						const desiredOverlap = 0.5;            // 50% overlap
						const synthesisHop = analysisHop * stretch_ratio;  //  output hop

						if (stretch_ratio > 1) {
							grainDuration = synthesisHop / (1 - desiredOverlap); // 0.15 sec (150 ms
						}

						var offlineCtx = audio_ctx;
						const now = audio_ctx.currentTime;

						// var filter = fx.filter ( offlineCtx, offlineCtx.destination, null, duration );
						var applyHannWindowFast = function (gainNode, outputTime, grainDuration) {
							// The automation curve using a Hann window shape
							const numSteps = 50;

							for (let i = 0; i <= numSteps; i++) {
								const t = (i / numSteps) * grainDuration;
								const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
								gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
							}
						};

						// Schedule grains
						var grainIndex = 0;
						var filter_chain = [];

						for (let t = 0; t < fx_buffer.duration; t += analysisHop) {
								const offset = t;
								const outputTime = grainIndex * synthesisHop;
								if (offset + grainDuration > fx_buffer.duration) break;  // stop if beyond source

								const grainSource = offlineCtx.createBufferSource();
								grainSource.buffer = fx_buffer;

								const grainGain = offlineCtx.createGain();
								grainSource.connect(grainGain);
								grainGain.connect(offlineCtx.destination);

								applyHannWindowFast (grainGain, now + outputTime, grainDuration);

								grainSource.start(now + outputTime, offset, grainDuration);
								filter_chain.push (grainGain);
								temp_source[grainIndex] = grainSource;

								++grainIndex;
						}

						return (filter_chain);
					},

					destroy : function () {
						temp_source = [];
					},

					update : function ( filter_chain, audio_ctx, val, source ) {
						prev_val = 1 / val;
						var fx_buffer = source.buffer;

						let grainDuration = 0.05;  // 50 ms grain
						const analysisHop = 0.025;   // 25 ms step (50% overlap)
						const desiredOverlap = 0.5;            // 50% overlap
						const synthesisHop = analysisHop * prev_val;  //  output hop

						if (prev_val > 1) {
							grainDuration = synthesisHop / (1 - desiredOverlap); // 0.15 sec (150 ms
						}

						const now = audio_ctx.currentTime;

						// var filter = fx.filter ( offlineCtx, offlineCtx.destination, null, duration );
						var applyHannWindowFast = function (gainNode, outputTime, grainDuration) {
							// The automation curve using a Hann window shape
							const numSteps = 50;

							for (let i = 0; i <= numSteps; i++) {
								const t = (i / numSteps) * grainDuration;
								const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
								gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
							}
						};

						// Schedule grains
						var l = filter_chain.length;
						var t = 0;
						for (var i = 0; i < l; ++i) {
								const offset = t;
								const outputTime = i * synthesisHop;
								//if (offset + grainDuration > fx_buffer.duration) break;
								const grainGain = filter_chain[i];
								let grainSource = temp_source[i];
								grainSource.stop();

								grainSource = audio_ctx.createBufferSource();
								grainGain.gain.setValueAtTime(grainGain.gain.value, now);
								grainGain.gain.cancelScheduledValues(now);

								grainSource.buffer = fx_buffer;
								grainSource.connect(grainGain);
								temp_source[i] = grainSource;

								applyHannWindowFast (grainGain, outputTime + now, grainDuration);

								grainSource.start(now + outputTime, offset, grainDuration);
								t += analysisHop;
						}
						// --
					}
				};
			},

			Speed : function ( val ) {
				var prev_val = 1.0;

				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var inputNode = audio_ctx.createGain();

						source.playbackRate.value = val;
						source.connect (inputNode);

						// line in to dry mix
						inputNode.connect (destination);

						var filter_chain = [ inputNode ];

						return (filter_chain);
					},

					preview: function (state, source) {
						if (!state) source.playbackRate.value = 1.0;
						else source.playbackRate.value = prev_val;
					},

					update : function ( filter_chain, audio_ctx, val, source ) {
						prev_val = val;
						source.playbackRate.value = val;
					}
				};
			},

			Delay : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var inputNode = audio_ctx.createGain();
						var outputNode = audio_ctx.createGain();
						var dryGainNode = audio_ctx.createGain();
						var wetGainNode = audio_ctx.createGain();
						var feedbackGainNode = audio_ctx.createGain();
						var delayNode = audio_ctx.createDelay();

						source.connect (inputNode);

						// line in to dry mix
						inputNode.connect (dryGainNode);
						// dry line out
						dryGainNode.connect (outputNode);

						// feedback loop
						delayNode.connect (feedbackGainNode);
						feedbackGainNode.connect (delayNode);

						// line in to wet mix
						inputNode.connect (delayNode);
						// wet out
						delayNode.connect (wetGainNode);

						// wet line out
						wetGainNode.connect (outputNode);
						outputNode.connect (destination);

						var filter_chain = [ inputNode, outputNode, dryGainNode,
							wetGainNode, feedbackGainNode, delayNode ];

						if (!val.delay.length)
							delayNode.delayTime.value = val.delay.val;
						else {
							for (var i = 0; i < val.delay.length; ++i) {
								delayNode.delayTime.linearRampToValueAtTime (val.delay[i].val, val.delay[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.feedback.length)
							feedbackGainNode.gain.value = val.feedback.val;
						else {
							for (var i = 0; i < val.feedback.length; ++i) {
								feedbackGainNode.gain.linearRampToValueAtTime (val.feedback[i].val, val.feedback[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.mix.length) {
							dryGainNode.gain.value = 1 - ((val.mix.val - 0.5) * 2);
							wetGainNode.gain.value = 1 - ((0.5 - val.mix.val) * 2);
						}
						else {
							for (var i = 0; i < val.mix.length; ++i) {
								dryGainNode.gain.linearRampToValueAtTime (1 - ((val.mix[i].val - 0.5) * 2), val.mix[i].time + audio_ctx.currentTime );
								wetGainNode.gain.linearRampToValueAtTime (1 - ((0.5 - val.mix[i].val) * 2), val.mix[i].time + audio_ctx.currentTime );
							}
						}

						return (filter_chain);
					},

					update : function ( filter_chain, audio_ctx, val ) {
						// update filter chain...
						var inputNode = filter_chain[0];
						var outputNode = filter_chain[1];
						var dryGainNode = filter_chain[2];
						var wetGainNode = filter_chain[3];
						var feedbackGainNode = filter_chain[4];
						var delayNode = filter_chain[5];

						if (!val.delay.length)
							delayNode.delayTime.value = val.delay.val;
						else {
							for (var i = 0; i < val.delay.length; ++i) {
								delayNode.delayTime.linearRampToValueAtTime (val.delay[i].val, val.delay[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.feedback.length)
							feedbackGainNode.gain.value = val.feedback.val;
						else {
							for (var i = 0; i < val.feedback.length; ++i) {
								feedbackGainNode.gain.linearRampToValueAtTime (val.feedback[i].val, val.feedback[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.mix.length) {
							dryGainNode.gain.value = 1 - ((val.mix.val - 0.5) * 2);
							wetGainNode.gain.value = 1 - ((0.5 - val.mix.val) * 2);
						}
						else {
							for (var i = 0; i < val.mix.length; ++i) {
								dryGainNode.gain.linearRampToValueAtTime (1 - ((val.mix[i].val - 0.5) * 2), val.mix[i].time + audio_ctx.currentTime );
								wetGainNode.gain.linearRampToValueAtTime (1 - ((0.5 - val.mix[i].val) * 2), val.mix[i].time + audio_ctx.currentTime );
							}
						}
						// ---
					}
				};
			},

			Distortion : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var wave_shaper = audio_ctx.createWaveShaper ();
						// var gain = parseInt (0.5 * 100, 10);
						var compute_dist = function ( val ) {
							var gain = parseInt ( (val / 1) * 100, 10);
							var n_samples = 44100;
							var curve = new Float32Array (n_samples);
							var deg = Math.PI / 180;
							var x;

							for (var i = 0; i < n_samples; ++i ) {
								x = i * 2 / n_samples - 1;
								curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x));
							}

							return (curve);
						};


						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									wave_shaper.curve.linearRampToValueAtTime (compute_dist(curr[i].val), audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								wave_shaper.curve = compute_dist (curr.val);
							}
						}

						source.connect (wave_shaper);
						wave_shaper.connect (destination);

						return (wave_shaper);
					},

					update : function ( filter, audio_ctx, val ) {

						var compute_dist = function ( val ) {
							var gain = parseInt ( (val / 1) * 100, 10);
							var n_samples = 44100;
							var curve = new Float32Array (n_samples);
							var deg = Math.PI / 180;
							var x;

							for (var i = 0; i < n_samples; ++i ) {
								x = i * 2 / n_samples - 1;
								curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x));
							}

							return (curve);
						};


						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									filter.curve.linearRampToValueAtTime (compute_dist(curr[i].val), audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								filter.curve = compute_dist (curr.val);
							}
						}
						// ----
					}
				};
			},

			Reverb : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						// ----
						var inputNode = audio_ctx.createGain();
						var reverbNode = audio_ctx.createConvolver();
						var outputNode = audio_ctx.createGain();
						var wetGainNode = audio_ctx.createGain();
						var dryGainNode = audio_ctx.createGain();

						source.connect (inputNode);

						inputNode.connect (reverbNode);
						reverbNode.connect (wetGainNode);
						inputNode.connect (dryGainNode);
						dryGainNode.connect (outputNode);
						wetGainNode.connect (outputNode);
						outputNode.connect (destination);

						var filter_chain = [ inputNode, outputNode, reverbNode, dryGainNode, wetGainNode ];

						// set defaults
						dryGainNode.gain.value = 1 - ((val.mix - 0.5) * 2);
						wetGainNode.gain.value = 1 - ((0.5 - val.mix) * 2);

						var length = audio_ctx.sampleRate * val.time;
						var impulse = audio_ctx.createBuffer (2, length, audio_ctx.sampleRate);
						var impulseL = impulse.getChannelData(0);
						var impulseR = impulse.getChannelData(1);
						var n, i;

						for (i = 0; i < length; i++) {
							n = val.reverse ? length - i : i;
							impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
							impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
						}
						reverbNode.buffer = impulse;

						return (filter_chain);
					},

					update : function ( filter_chain, audio_ctx, val ) {

						audio_ctx   = wavesurfer.backend.ac;

						var reverbNode = filter_chain[2];
						var dryGainNode = filter_chain[3];
						var wetGainNode = filter_chain[4];

						dryGainNode.gain.value = 1 - ((val.mix - 0.5) * 2);
						wetGainNode.gain.value = 1 - ((0.5 - val.mix) * 2);

						var length = audio_ctx.sampleRate * val.time;
						var impulse = audio_ctx.createBuffer (2, length, audio_ctx.sampleRate);
						var impulseL = impulse.getChannelData(0);
						var impulseR = impulse.getChannelData(1);
						var n, i;

						for (i = 0; i < length; i++) {
							n = val.reverse ? length - i : i;
							impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
							impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
						}
						reverbNode.buffer = impulse;
					}
				};
			}
		};


		this.FXPreviewUpdate = updatePreview;
		this.FXPreviewStop = stopPreview;
		this.FXPreviewToggle = togglePreview;
		this.FXPreviewInit = initPreview;
		this.FXPreview = previewEffect;
		this.FX = applyEffect;
		this.FXBank = FXBank;

		this.Trim = TrimBuffer;
		this.Copy = CopyBufferSegment;
		this.Insert = InsertSegmentToBuffer;
		this.InsertFloatArrays = InsertFloatArrays;
		this.ReplaceFloatArrays = ReplaceFloatArrays;
		this.Replace = OverwriteBufferWithSegment;
		this.FullReplace = OverwriteBuffer;
		this.MakeSilence = MakeSilenceBuffer;
		this.DownloadFile = DownloadFile;
		this.DownloadFileCancel = DownloadFileCancel;
		// this.ComputeTopFrequencies = findTopFrequencies;
		// this.MatchTopFrequencies= killdTopFrequencies;
		// ---
	};
	
	PKAE._deps.audioutils = AudioUtils;
})( PKAudioEditor );