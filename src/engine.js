(function ( w, d, PKAE ) {
	'use strict';

	function PKEng ( app ) {
		var q = this;
		
		var wavesurfer = WaveSurfer.create ({
			container: '#' + 'pk_av_' + app.id,
			scrollParent: false,
			hideScrollbar:true,
			partialRender:false,
			fillParent:false,
			pixelRatio:1,
			progressColor:'rgba(128,85,85,0.24)',
			splitChannels:true,
			autoCenter:true,
			height:w.innerHeight - 168,
			plugins: [
				WaveSurfer.regions.create({
					dragSelection: {
						slop: 5
					}
				})
			]
		});
		this.wavesurfer = wavesurfer;

		var AudioUtils = new app._deps.audioutils ( app, wavesurfer );
		q.is_ready = false;
		
		this.TrimTo = function( val, num ) {
			var nums = {'0':1, '1':10, '2':100,'3':1000,'4':10000,'5':100000};
			var dec = nums[num];
			return ((val *dec) >> 0) / dec;
		}

		this.LoadArrayBuffer = function ( e ) {

			app.listenFor ('RequestCancelModal', function() {
				wavesurfer.cancelBufferLoad ();
				if (wavesurfer.arraybuffer) q.is_ready = true;

				app.fireEvent ('RequestResize');
				setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
				app.stopListeningForName ('RequestCancelModal');

				OneUp ('Canceled Loading', 1350);
			});

			app.fireEvent ('RequestZoomUI', 0);

			app.fireEvent ('WillDownloadFile');
			q.is_ready = false;
			wavesurfer.loadBlob( e );
			app.fireEvent ('DidUnloadFile');
		};
		this.LoadFile = function ( e ) {
			if (e.files.length > 0) {
				if (e.files[0].type == "audio/mp3" || e.files[0].type == "audio/wave"
					|| e.files[0].type == "audio/ogg")
				{

					app.listenFor ('RequestCancelModal', function() {
						wavesurfer.cancelBufferLoad ();
						AudioUtils.DownloadFileCancel ();
						if (wavesurfer.arraybuffer) q.is_ready = true;

						app.fireEvent ('RequestResize');
						setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
						app.stopListeningForName ('RequestCancelModal');

						OneUp ('Canceled Loading', 1350);
					});

					app.fireEvent ('WillDownloadFile');
					q.is_ready = false;
					wavesurfer.loadBlob( e.files[0] );
					app.fireEvent ('DidUnloadFile');
				}
			}
		};
		
		this.DownloadFile = function ( name, kbps, selection ) {
			if (!q.is_ready) return ;

			app.fireEvent ('WillDownloadFile');

			app.listenFor ('RequestCancelModal', function() {
				AudioUtils.DownloadFileCancel ();
				if (wavesurfer.arraybuffer) q.is_ready = true;

				app.fireEvent ('RequestResize');
				setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
				app.stopListeningForName ('RequestCancelModal');
			});

			setTimeout(function() {
				AudioUtils.DownloadFile ( name, kbps, selection, function ( val ) {
					if (val === 'done')
					{
						setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
						app.stopListeningForName ('RequestCancelModal');
					}
					else
						app.fireEvent ('DidProgressModal', val);
				});
			}, 220);
		}
		this.LoadSample = function () {

			app.fireEvent ('WillDownloadFile');
			
			setTimeout(function () {

				app.listenFor ('RequestCancelModal', function() {
					if (wavesurfer.cancelAjax ())
					{
						if (wavesurfer.arraybuffer) q.is_ready = true;

						app.fireEvent ('RequestResize');
						setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
						app.stopListeningForName ('RequestCancelModal');

						OneUp ('Canceled Loading', 1350);
					}
				});

				wavesurfer.load ('test.mp3');
				q.is_ready = false;
			}, 180);
		}
		this.LoadURL = function ( url ) {

			app.fireEvent ('WillDownloadFile');

			setTimeout(function () {

				app.listenFor ('RequestCancelModal', function() {
					if (wavesurfer.cancelAjax())
					{
						if (wavesurfer.arraybuffer) q.is_ready = true;

						app.fireEvent ('RequestResize');
						setTimeout(function() { app.fireEvent ('DidDownloadFile'); }, 12);
						app.stopListeningForName ('RequestCancelModal');

						OneUp ('Canceled Loading', 1350);
					}
				});

				wavesurfer.load ( url );
				q.is_ready = false;
			}, 180);
		}

		app.listenFor ('RequestResize', function() {
			wavesurfer.fireEvent('resize');

			var h = window.innerHeight;
			var bottom = 0;

			if (app.ui && app.ui.BarBtm) {
				bottom = (app.ui.BarBtm.on ? app.ui.BarBtm.height : 0);
			}

			wavesurfer.setHeight( (h < 300 ? 300 : h) - 168 - bottom);
			// app.fireEvent ('DidResize');
		});

		wavesurfer.on ('ready', function() {
			app.fireEvent ('DidReadyFire');

			if (q.is_ready) return ;
			q.is_ready = true;

			// dirty hack for default message
			var dirtymsg = document.getElementsByClassName('pk_tmpMsg');
			if (dirtymsg.length > 0)
			{
				dirtymsg = dirtymsg[0];
				dirtymsg.parentNode.removeChild( dirtymsg );
			}

			copy_buffer = null;
			app.fireEvent ('DidDownloadFile');

			app.fireEvent ('StateRequestClearAll');
			app.fireEvent ('DidLoadFile');
			app.fireEvent ('DidUpdateLen', wavesurfer.getDuration ());
			app.fireEvent ('DidSetClipboard', 0);
			app.fireEvent ('RequestSeekTo', 0);

			app.fireEvent ('RequestResize');
			wavesurfer.getWaveEl().style.opacity = '1';

			// loaded succesfully
			app.stopListeningForName ('RequestCancelModal');

			setTimeout(function () {OneUp ('Loaded Succesfully')}, 180);

			// check if the audio file is mono or stereo and rebuild both UI and audio engine accordingly...
			if (wavesurfer.backend.buffer.numberOfChannels === 1) {
				wavesurfer.backend.SetNumberOfChannels (1);
				wavesurfer.ActiveChannels = [1];
				wavesurfer.drawer.params.ActiveChannels = wavesurfer.ActiveChannels;
				wavesurfer.SelectedChannelsLen = 1;

				app.el.classList.add ('pk_mono');
			} else if (wavesurfer.backend.buffer.numberOfChannels === 2) {
				wavesurfer.backend.SetNumberOfChannels (2);
				wavesurfer.ActiveChannels = [1, 1];
				wavesurfer.drawer.params.ActiveChannels = wavesurfer.ActiveChannels;
				wavesurfer.SelectedChannelsLen = 2;

				app.el.classList.remove ('pk_mono');
			}
			// ---
		});

		wavesurfer.on ('pause', function() {
			app.fireEvent ('DidStopPlay');
		});
		wavesurfer.on ('play', function() {
			app.fireEvent ('DidPlay');
		});
		wavesurfer.on ('seek', function() {
			var time = wavesurfer.getCurrentTime();
			var loudness = wavesurfer.getLoudness();

			app.fireEvent ('DidAudioProcess', [time, loudness]);
		});

		app.listenFor ('RequestStop', function( val ) {
			if (app.rec.isActive ()) {
				app.fireEvent ('RequestActionRecordStop');
				return (false);
			}

			var region = wavesurfer.regions.list[0];
			if (region) wavesurfer.ActiveMarker = region.start / wavesurfer.getDuration ();
			wavesurfer.stop ( val );
		});
		app.listenFor ('RequestPlay', function ( x ) { // unique listener
			app.fireEvent ('RequestActionRecordStop');

			if ( !x && wavesurfer.isPlaying ()) {
				wavesurfer.stop ();
				wavesurfer.play ();
			}
			else
				wavesurfer.play ();
		});
		app.listenFor ('RequestPause', function () {
			app.fireEvent ('RequestActionRecordStop');
			wavesurfer.pause();
		});

		app.listenFor ('RequestSetLoop', function () {
			if (!q.is_ready) return ;

			var skip_seek = false;

			if (wavesurfer.regions.list[0])
			{
				if (wavesurfer.regions.list[0].loop)
					wavesurfer.regions.list[0].loop = false;
				else
					wavesurfer.regions.list[0].loop = true;
			}
			else
			{
				skip_seek = true;
				wavesurfer.regions.add({
					start:0.01,
					end:wavesurfer.getDuration() - 0.01,
					id:'t'
				});
				wavesurfer.regions.list[0].loop = true;
			}
			
			var will_loop = wavesurfer.regions.list[0].loop;
			app.fireEvent('DidSetLoop', will_loop);
			if (will_loop && !skip_seek /*&& wavesurfer.isPlaying ()*/) {
				app.fireEvent ('RequestSeekTo', wavesurfer.regions.list[0].start / wavesurfer.getDuration ());
			}
		});
		app.listenFor ('RequestSkipBack', function( val ) {
			wavesurfer.skipBackward ( val )
		});
		app.listenFor ('RequestSkipFront', function( val ) {
			wavesurfer.skipForward ( val );
		});
		app.listenFor ('RequestSeekTo', function( val ) {
			wavesurfer.seekTo( val );
		});
		app.ui.KeyHandler.addCallback ('zkA', function ( key, m, e ) {
			e.preventDefault ();
		}, [38]);
		app.ui.KeyHandler.addCallback ('zkD', function ( key, m, e ) {
			e.preventDefault ();
		}, [40]);
		app.ui.KeyHandler.addSingleCallback ('KeyPlayPause', function ( e ) {
			if (app.ui.InteractionHandler.on) return ;
			e.preventDefault();
			//e.stopPropagation();
		}, 32);

		app.ui.KeyHandler.addSingleCallback ('KeyTilda', function ( e ) {
			if (app.ui.InteractionHandler.on) return ;
			e.preventDefault();
			app.fireEvent ('RequestDeselect');
		}, 96);


		app.ui.KeyHandler.addCallback ('kF12', function ( k, i, e ) {
			e.preventDefault();
			e.stopPropagation();
		}, [123]);
		/*app.ui.KeyHandler.addCallback ('kF5', function ( k, i, e ) {
			e.preventDefault();
			e.stopPropagation();
		}, [116]);
		*/

		app.ui.KeyHandler.addCallback ('KeyShiftSpace' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			wavesurfer.playPause();
			
		}, [16, 32]);
		app.ui.KeyHandler.addCallback ('KeySpace' + app.id, function ( key, map ) {
			if (app.ui.InteractionHandler.on) return ;			
			if (map[16] === 1) return ;

			if (PKAudioEditor.engine.wavesurfer.isPlaying())
			{
				app.fireEvent ('RequestStop');
			}
			else
			{
				app.fireEvent ('RequestPlay');
			}
		}, [32]);
		app.ui.KeyHandler.addCallback ('KeyShiftCopy' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			
			app.fireEvent( 'RequestActionCopy');
		}, [16, 67]);
		app.ui.KeyHandler.addCallback ('KeyShiftUndo' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			
			app.fireEvent ('StateRequestUndo');
		}, [16, 90]);
		app.ui.KeyHandler.addCallback ('KeyShiftRedo' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			
			app.fireEvent ('StateRequestRedo');
		}, [16, 89]);
		app.ui.KeyHandler.addCallback ('KeyShiftPaste' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			
			app.fireEvent( 'RequestActionPaste');
		}, [16, 86]);
		app.ui.KeyHandler.addCallback ('KeyShiftCut' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			
			app.fireEvent( 'RequestActionCut');
		}, [16, 88]);
		app.ui.KeyHandler.addCallback ('KeyShiftSelectAll' + app.id, function ( key ) {
			if (app.ui.InteractionHandler.on) return ;
			app.fireEvent ('RequestSelect');
		}, [16, 65]);
		app.ui.KeyHandler.addSingleCallback ('KeyLoopToggle', function ( e ) {
			if (app.ui.InteractionHandler.on) return ;
			e.preventDefault();
			e.stopPropagation();
			app.fireEvent ('RequestSetLoop');
		}, 108);
		
		wavesurfer.container.addEventListener('mousedown', function(e) {
			if (e.which === 3) {
				// wavesurfer.regions.clear();
				e.preventDefault();
			}
		},false);
		
		// select all... ####
		app.listenFor ('RequestSelect', function( ifnot, custom ) {
			if (!q.is_ready) return ;

			if (ifnot)
			{
				var region = wavesurfer.regions.list[0];
				if (region) return (false);
			}

			if (!custom)
			{
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				
				if (!wavesurfer.isPlaying ())
				setTimeout(function () {
					app.fireEvent ('RequestSeekTo',0.001);
				},0);	
			}
			else
			{
				wavesurfer.regions.add({
					start:custom[0],
					end:custom[1],
					id:'t'
				});
				if (!wavesurfer.isPlaying ())
				setTimeout(function () {
					app.fireEvent ('RequestSeekTo', custom[0]/wavesurfer.getDuration ());
				},0);	
			}
		});
		app.listenFor ('RequestDeselect', function() {
			wavesurfer.regions.clear ();
			app.fireEvent ('RequestSeekTo', 0);
		});
		
		(function() {
			var input = null;
			app.listenFor ('RequestLoadLocalFile', function () {
					wavesurfer.pause();
					
					if (input)
					{
						input.parentNode.removeChild( input );
						input.onchange = null;
					}

					input = d.createElement( 'input' );
					input.setAttribute ('type', 'file');
					input.setAttribute ('accept', 'audio/*');
					input.className = 'pk_inpfile';
					input.onchange = function () { 
						q.LoadFile ( input );

						input.parentNode.removeChild( input );
						input.onchange = null;
						input = null;
					};
					app.el.appendChild ( input ); // maybe not append?

					input.click ();
			});
		})();
		
		wavesurfer.container.addEventListener('dblclick', function(e){
			app.fireEvent ('RequestSelect', false, 
				[ wavesurfer.LeftProgress,
				wavesurfer.LeftProgress + wavesurfer.VisibleDuration ]
			);
		}, false);
		wavesurfer.container.addEventListener ('click', function( e ) {
			if (!q.is_ready) return ;
			
			if (!app.ui.KeyHandler.keyMap[16])
				wavesurfer.regions.clear();
		}, false);
		
		var dbncr = null;
		w.addEventListener('resize', function() {
			if (!wavesurfer) return ;

			if (dbncr) {
				clearTimeout (dbncr);
			}

			dbncr = setTimeout(function(){
				app.fireEvent ('RequestResize');
			},82);
		}, false);

		w.addEventListener('beforeunload', function (e) {
		  app.fireEvent ('WillUnload');

		  // e.preventDefault();
		  // e.returnValue = '';
		});

		wavesurfer.on('error', function (error_msg) {

			// if loading - cancel loading
			setTimeout(function() {
				app.fireEvent ('DidDownloadFile'); // just hides the interface
				q.is_ready = false;
			}, 20);

			app.fireEvent ('ShowError', error_msg);
		});

		wavesurfer.on('audioprocess', function ( e ) {
			var time = wavesurfer.getCurrentTime();
			var loudness = wavesurfer.getLoudness();
		
			app.fireEvent ('DidAudioProcess', [time, loudness], wavesurfer.backend.FreqArr);
		});
		wavesurfer.on('DidZoom', function ( e ) {
			app.fireEvent ('DidZoom', [wavesurfer.ZoomFactor, (wavesurfer.LeftProgress/wavesurfer.getDuration()) * 100, wavesurfer.params.verticalZoom], e);
		});
		 wavesurfer.on('region-removed', function (){
			app.fireEvent('DidSetLoop', 0);
			app.fireEvent('DidDestroyRegion');
		 });
		 app.listenFor ('RequestRegionClear', function () {
			wavesurfer.regions.clear();
		 });
		app.listenFor ('RequestRegionSet', function ( start, end ) {
			if (!q.is_ready) return ;

			if (!start) {
				start =  wavesurfer.LeftProgress / 1;
			}
			if (!end) {
				end = (wavesurfer.LeftProgress + wavesurfer.VisibleDuration) / 1;
			}

			// add a region where the paste happened
			wavesurfer.regions.clear();
			wavesurfer.regions.add({
				start: start,
				end:   end,
				id:'t'
			});
		});

		var copy_buffer = null;

		app.listenFor ('RequestActionCut', function () {
			if (!q.is_ready) return ;
			
			var region = wavesurfer.regions.list[0];
			if (!region) return (false);

			app.fireEvent ('RequestPause');

			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ( (region.end - region.start), 3)

			app.fireEvent ('StateRequestPush', {
				desc : 'Cut',
				meta : [ start, end ],
				data : wavesurfer.backend.buffer
			});

			var cutbuffer = AudioUtils.Trim (
				start,
				end
			);
			wavesurfer.regions.clear();

			var tmp = (start - 0.03);
			if (tmp < 0) tmp = 0;

			app.fireEvent ('RequestSeekTo', tmp / wavesurfer.getDuration ());
			
			copy_buffer = cutbuffer;
			app.fireEvent ('DidSetClipboard', 1);
			app.fireEvent ('DidCut', cutbuffer);
			
			OneUp ('Cut :: ' + q.TrimTo (start, 2) + ' to ' + q.TrimTo (start/1 + end/1, 2), 1100);
		});
		
		app.listenFor ('RequestActionCopy', function () {
			if (!q.is_ready) return ;
			
			var region = wavesurfer.regions.list[0];
			if (!region) return (false);
			
			app.fireEvent('RequestPause');

			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);
			
			var copybuffer = AudioUtils.Copy (
				start,
				end
			);

			copy_buffer = copybuffer;
			app.fireEvent ('DidSetClipboard', 1);
			app.fireEvent ('DidCopy', copybuffer);

			OneUp ('Copied range');
		});
		
		app.listenFor ('RequestActionSilence', function ( offset, silence_duration ) {
			if (!q.is_ready) return ;

			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];
			
			if (!silence_duration || silence_duration < 0) silence_duration = 1;

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Silence',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}

			var start = offset;
			var end = silence_duration;

			handleStateInline ( start, end );
			dims = AudioUtils.Insert (
				offset, 
				AudioUtils.MakeSilence ( silence_duration )
			);

			// add a region where the paste happened
			wavesurfer.regions.clear();
			wavesurfer.regions.add({
				start:dims[0],
				end:dims[1],
				id:'t'
			});

			app.fireEvent ('RequestSeekTo', (dims[0]/wavesurfer.getDuration()));
			
			OneUp ('Inserted Silence');
		});

		app.listenFor ('RequestActionPaste', function () {
			if (!q.is_ready) return ;
			if (!copy_buffer) return (false);

			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Paste',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				var offset = q.TrimTo (wavesurfer.getCurrentTime(), 3);
				
				handleStateInline ( offset );
				dims = AudioUtils.Insert ( offset, copy_buffer );
			}
			else {
				var start = q.TrimTo (region.start, 3);
				var end = q.TrimTo ((region.end - region.start), 3);

				handleStateInline ( start, end );

				dims = AudioUtils.Replace (
					start,
					end,
					copy_buffer
				);
			}

			// add a region where the paste happened
			wavesurfer.regions.clear();
			wavesurfer.regions.add({
				start:dims[0],
				end:dims[1],
				id:'t'
			});

			app.fireEvent ('RequestSeekTo', (dims[0]/wavesurfer.getDuration () ));

			OneUp ('Paste to ' + dims[0].toFixed(2), 982);
		});

		var _sk = false;
		app.listenFor ('RequestActionRecordToggle', function () {
			if (!q.is_ready) return ;
			
			if (app.rec.isActive ()) {
				app.fireEvent('RequestActionRecordStop');
			} else {
				// skipping the sounds of keyboard
				if (_sk) return ;

				_sk = true;
				setTimeout(function () {
					app.fireEvent('RequestActionRecordStart');
					setTimeout(function() {
						_sk = false;
					}, 50);
				},40);
			}
		});

		app.listenFor ('RequestActionRecordStop', function () {
			if (!q.is_ready) return ;
			if (!app.rec.isActive ()) return (false);

			app.rec.stop ();
		});

		app.listenFor ('RequestActionRecordStart', function () {
			if (!q.is_ready) return ;

			app.fireEvent ('RequestPause');

			if (app.rec.isActive ()) return (false);

			var pos = wavesurfer.getCurrentTime () * wavesurfer.backend.buffer.sampleRate;
			app.rec.start ( pos, function ( offset, buffers ) {

				// app.fireEvent ('RequestPause');
				function handleStateInline ( start, end ) {
					app.fireEvent ('StateRequestPush', {
						desc : 'Record Audio',
						meta : [ start, end ],
						data : wavesurfer.backend.buffer
					});
				}

				// fire did record event!
				app.fireEvent ('DidActionRecordStop', !!buffers);
				if (!buffers)
				{
					return ;
				}

				handleStateInline ( offset );
				var dims = AudioUtils.ReplaceFloatArrays ( offset, buffers );

				// add a region where the paste happened
				wavesurfer.regions.clear();
				wavesurfer.regions.add({
					start:dims[0],
					end:dims[1],
					id:'t'
				});

				app.fireEvent ('RequestSeekTo', (dims[0]/wavesurfer.getDuration()));
				OneUp ('Recorded Audio ' + dims[0].toFixed(2), 982);
			}, function () {
				// on start
				app.fireEvent ('DidActionRecordStart');
			});

			// --- ending offset is song full duration...
			// if we have a selected area - mark that one as the end
			var region = wavesurfer.regions.list[0];
			if (region)
				app.rec.setEndingOffset ( region.end * wavesurfer.backend.buffer.sampleRate );
			else
				app.rec.setEndingOffset ( wavesurfer.getDuration () * wavesurfer.backend.buffer.sampleRate );
		});
		
		app.listenFor ('RequestActionFX_PREVIEW_HardLimit', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.HardLimit ( val ) );
			app.fireEvent ('DidStartPreview');
		});
		app.listenFor ('RequestActionFX_HardLimit', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Hard Limit (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.HardLimit ( val ) );
			
			OneUp ('Applied Hard Limit (fx)');
		});
		
		app.listenFor ('RequestActionFX_PARAMEQ', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Parametric EQ (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.ParametricEQ ( val ) );
			
			OneUp ('Applied Parametric EQ (fx)');
		});
		app.listenFor ('RequestActionFX_PREVIEW_PARAMEQ', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.ParametricEQ ( val ) );
			app.fireEvent ('DidStartPreview');
		});

		app.listenFor ('RequestActionFX_PREVIEW_DISTORT', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Distortion ( val ) );
			app.fireEvent ('DidStartPreview');
		});
		app.listenFor ('RequestActionFX_DISTORT', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Distortion (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Distortion ( val ) );
			
			OneUp ('Applied Distortion (fx)');
		});

		app.listenFor ('RequestActionFX_PREVIEW_DELAY', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Delay ( val ) );
			app.fireEvent ('DidStartPreview');
		});
		app.listenFor ('RequestActionFX_DELAY', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Delay (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Delay ( val ) );
			
			OneUp ('Applied Delay (fx)');
		});

		app.listenFor ('RequestActionFX_PREVIEW_REVERB', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Reverb ( val ) );
			app.fireEvent ('DidStartPreview');
		});
		app.listenFor ('RequestActionFX_REVERB', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Reverb (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Reverb ( val ) );
			
			OneUp ('Applied Reverb (fx)');
		});

		app.listenFor ('RequestActionFX_PREVIEW_COMPRESSOR', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Compressor ( val ) );
			app.fireEvent ('DidStartPreview');
		});

		app.listenFor ('RequestActionFX_Compressor', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Compressor (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Compressor ( val ) );
			
			OneUp ('Applied Compressor (fx)');
		});
		app.listenFor ('RequestActionFX_Normalize', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Normalize ',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3)
			var end = q.TrimTo ((region.end - region.start), 3)

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Normalize ( val ) );
			
			OneUp ('Applied Normalize');
		});

		app.listenFor ('RequestActionFX_Invert', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Invert ',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3)
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Invert() );
			
			OneUp ('Applied Invert');
		});
		app.listenFor ('RequestActionFX_Reverse', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Reverse ',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3)
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Reverse() );
			
			OneUp ('Applied Reverse');
		});
		app.listenFor ('RequestActionFX_FadeIn', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Fade In (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.FadeIn() );
			
			OneUp ('Applied Fade In (fx)');
		});
		app.listenFor ('RequestActionFX_FadeOut', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Fade Out (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}
			
			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.FadeOut() );
			
			OneUp ('Applied Fade Out (fx)');
		});
		
		
		var fx_preview_debounce = null;
		app.listenFor ('RequestActionFX_UPDATE_PREVIEW', function ( val ) {
			if (!AudioUtils.previewing) return ;
			
			clearTimeout (fx_preview_debounce);
			fx_preview_debounce = setTimeout(function () {
				AudioUtils.FXPreviewUpdate ( val );
			}, 44);
		});
		app.listenFor ('RequestActionFX_TOGGLE', function ( val ) {

			if (val)
			{
				AudioUtils.FXPreviewInit (true);
				return ;
			}

			app.fireEvent ('DidTogglePreview', AudioUtils.FXPreviewToggle ());
		});
		app.listenFor ('RequestActionFX_PREVIEW_STOP', function () {
			AudioUtils.FXPreviewStop ();
			app.fireEvent ('DidStopPreview');
		});
		app.listenFor ('RequestActionFX_PREVIEW_GAIN', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}

			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Gain( val ) );
			
			app.fireEvent ('DidStartPreview');
		});

		app.listenFor ('RequestActionFX_GAIN', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Gain (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}
			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			handleStateInline ( start, end );
			AudioUtils.FX( start, end, AudioUtils.FXBank.Gain( val ) );
			
			OneUp ('Applied Gain (fx)');
		});

		app.listenFor ('RequestActionFX_PREVIEW_SPEED', function ( val ) {
			if (!q.is_ready) return ;
			if (AudioUtils.previewing) {
				AudioUtils.FXPreviewStop ();
				app.fireEvent ('DidStopPreview');
				return ;
			}

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}

			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);

			AudioUtils.FXPreview( start, end, AudioUtils.FXBank.Speed( val ) );
			
			app.fireEvent ('DidStartPreview');
		});

		app.listenFor ('RequestActionFX_SPEED', function ( val ) {
			if (!q.is_ready) return ;
			
			app.fireEvent('RequestPause');

			var region = wavesurfer.regions.list[0];
			var dims = [ 0, 0 ];

			function handleStateInline ( start, end ) {
				app.fireEvent ('StateRequestPush', {
					desc : 'Apply Speed (fx)',
					meta : [ start, end ],
					data : wavesurfer.backend.buffer
				});
			}

			if (!region) {
				wavesurfer.regions.add({
					start:0.001,
					end:wavesurfer.getDuration() - 0.001,
					id:'t'
				});
				region = wavesurfer.regions.list[0];
			}

			
			var start = q.TrimTo (region.start, 3);
			var end = q.TrimTo ((region.end - region.start), 3);
			var duration = (region.end - region.start) / val;
			duration = q.TrimTo (duration, 3);

			handleStateInline ( start, end );

			var fx_buffer = AudioUtils.Copy ( start, end );
			var originalBuffer = wavesurfer.backend.buffer;
			var new_offset = ((start/1)   * originalBuffer.sampleRate) >> 0;
			var new_len    = ((duration/1) * originalBuffer.sampleRate) >> 0;
			var old_len    = ((end/1) * originalBuffer.sampleRate) >> 0;

			/*
			var emptySegment = wavesurfer.backend.ac.createBuffer (
				wavesurfer.SelectedChannelsLen,
				new_len,
				originalBuffer.sampleRate
			);*/

			var fx = AudioUtils.FXBank.Speed( val );

			var getOfflineAudioContext = function (channels, sampleRate, duration) {
					return new (window.OfflineAudioContext ||
					window.webkitOfflineAudioContext)(channels, duration, sampleRate);
			};
			var audio_ctx = getOfflineAudioContext (
					wavesurfer.SelectedChannelsLen, // orig_buffer.numberOfChannels,
					originalBuffer.sampleRate,
					new_len
			);

			var source = audio_ctx.createBufferSource ();
			source.buffer = fx_buffer;

			var filter = fx.filter ( audio_ctx, audio_ctx.destination, source, duration );

			source.start ();

			var offline_callback = function( rendered_buffer ) {

				AudioUtils.Replace (start, end, rendered_buffer);

				wavesurfer.regions.clear();
				wavesurfer.regions.add({
					start:start,
					end: start + duration,
					id:'t'
				});

				app.fireEvent ('RequestSeekTo', (start/wavesurfer.getDuration()));

				OneUp ('Applied Speed (fx)');

//				AudioUtils.Insert (new_offset, rendered_buffer);

/*				var uber_buffer = wavesurfer.backend.ac.createBuffer(
					originalBuffer.numberOfChannels,
					originalBuffer.length + (new_len - old_len),
					originalBuffer.sampleRate
				);

				for (var i = 0; i < originalBuffer.numberOfChannels; ++i)
				{
					var uber_chan_data = uber_buffer.getChannelData (i);
					var chan_data = originalBuffer.getChannelData (i);

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

					//uber_chan_data.set (
					//	fx_chan_data, new_offset, fx_chan_data.length - new_offset
					//);
				}

				loadDecoded ( uber_buffer );
*/
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
		});
		
		app.listenFor ('StateDidPop', function ( state, undo ) {
			if (!q.is_ready) return ;
			app.fireEvent ('RequestPause');

			wavesurfer.regions.clear();
			wavesurfer.loadDecodedBuffer (state.data);

			if (state.meta && state.meta.length > 0)
			{
				if (state.meta[1])
				{
					wavesurfer.regions.add({
						start:state.meta[0]/1,
						end:state.meta[0]/1 + state.meta[1]/1,
						id:'t'
					});
				}
				else
				{
					app.fireEvent ('RequestSeekTo', (state.meta[0]/wavesurfer.getDuration()));
				}
			}
			
			if (undo) OneUp ('Undo ' + state.desc);
			else OneUp ('Redo ' + state.desc);
		});


		// --- 
		app.listenFor ('RequestChanToggle', function ( chan_index, force_val ) {
			if (!q.is_ready) return (false);

			if (wavesurfer.ActiveChannels.length <= chan_index) return (false);

			var oldval = wavesurfer.ActiveChannels[ chan_index ];
			var val = -1;

			if (force_val) val = force_val;
			else {
				if (oldval === 1) val = 0;
				else val = 1;
			}

			if (oldval !== val)
			{
				wavesurfer.ActiveChannels[ chan_index ] = val;
				if (val === 0) {
					--wavesurfer.SelectedChannelsLen;
					// silece the channel itself

					if (chan_index === 0) {
						wavesurfer.backend.gainNode2.gain.value = 0.0;
					} else {
						wavesurfer.backend.gainNode1.gain.value = 0.0;
					}
				}
				else {
					++wavesurfer.SelectedChannelsLen;

					if (chan_index === 0) {
						wavesurfer.backend.gainNode2.gain.value = 1.0;
					} else {
						wavesurfer.backend.gainNode1.gain.value = 1.0;
					}
				}

				wavesurfer.ForceDraw ();
				app.fireEvent ('DidChanToggle', chan_index, val);
			}
		});

		// ----
		wavesurfer.on( 'region-updated', function () {
			if (wavesurfer.regions.list[0])
			{
				app.fireEvent ('DidCreateRegion', wavesurfer.regions.list[0]);
			}
		});
		wavesurfer.on( 'region-update-end', function () {
			app.fireEvent ('DidCreateRegion', wavesurfer.regions.list[0]);

			var start = wavesurfer.regions.list[0].start;
			if (!wavesurfer.isPlaying ())
				app.fireEvent ('RequestSeekTo', (start/wavesurfer.getDuration() ));
		});
		wavesurfer.on( 'cursorcenter', function ( e ) {
			app.fireEvent ('DidCursorCenter', e);
		});
		
		var wave = wavesurfer.drawer.canvases[0].wave.parentNode;

		var drag_x = 0;
		var drag_move = function ( e ) {
			
			var diff = drag_x - e.clientX;
			
			// find diff percentage from full width...
			
			// drag the waveform now
			app.fireEvent ('RequestPan', diff );
			
			drag_x = e.clientX;
		};
		
		app.listenFor ('RequestZoom', function ( diff, mode ) {
			var wv = wavesurfer;

			// compute new ZoomFactor...
			diff *= wv.ZoomFactor;

			// compute availabel left ZoomFactor
			if (mode === -1)
			{
				var width = wv.drawer.width;
				var available_pixels = width - width/wv.ZoomFactor;
				var target = wv.ZoomFactor - 1;
				if (target <= 0) return ;

				 var old_zoomfactor = wv.ZoomFactor;
				 wv.ZoomFactor += (diff*target)/available_pixels;
				 if (wv.ZoomFactor < 1) wv.ZoomFactor = 1;
				 
				 var new_vis_dur = wv.getDuration() / wv.ZoomFactor;

				 if (new_vis_dur <= 0.5)
				 {
				 	wv.ZoomFactor = old_zoomfactor;
				 	return ;
				 }

				 wv.VisibleDuration = new_vis_dur;
				 
				var time_moved = wv.VisibleDuration * (diff / wv.drawer.width);
				wv.LeftProgress += time_moved;
				
				if (wv.LeftProgress + wv.VisibleDuration >= wv.getDuration ())
				{
					wv.LeftProgress = wv.getDuration () - wv.VisibleDuration;
				}
				else if (wv.LeftProgress < 0) {
					wv.LeftProgress = 0;
				}
			}
			else if (mode === 1)
			{
				var width = wv.drawer.width;
				var available_pixels = width - width/wv.ZoomFactor;
				var target = wv.ZoomFactor - 1;
				if (target <= 0) return ;

				var old_factor = wv.ZoomFactor; 
				wv.ZoomFactor -= (diff*target)/available_pixels;
				if (wv.ZoomFactor < 1) wv.ZoomFactor = 1;
				var temp = wv.getDuration() / wv.ZoomFactor;
				if (temp + wv.LeftProgress > wv.getDuration()) {
					wv.ZoomFactor = old_factor;
				}
				else
				{
					if (temp <= 0.5)
					{
						wv.ZoomFactor = old_factor;
						return ;
					}

					wv.VisibleDuration = temp;
				}
				// -
			}
			
			// wv.ZoomFactor -= Math.abs (diff / (wv.drawer.width / 2));
			// console.log( diff + " BLAH " + wv.ZoomFactor + '   ' +  (diff / wv.drawer.width) );
			wv.ForceDraw ();
			app.fireEvent ('DidZoom', [wavesurfer.ZoomFactor, (wavesurfer.LeftProgress/wavesurfer.getDuration()) * 100, wavesurfer.params.verticalZoom]);
		});
		
		app.listenFor ('RequestPan', function( diff, mode ) {
			var wv = wavesurfer;
			
			if (mode === 1) diff *= wv.ZoomFactor;
			else if (mode === 2) {
				var time_moved = wv.getDuration() * (diff / wv.drawer.width);
				wv.LeftProgress = time_moved;

				wv.ForceDraw ();
				app.fireEvent ('DidZoom', [wavesurfer.ZoomFactor, (wavesurfer.LeftProgress/wavesurfer.getDuration()) * 100, wavesurfer.params.verticalZoom]);

				return ;
			}
			
			if (wv.ZoomFactor > 0)
			{
				// drag and draw by X pixels...
				var time_moved = wv.VisibleDuration * (diff / wv.drawer.width);
				wv.LeftProgress += time_moved;
				
				if (wv.LeftProgress + wv.VisibleDuration >= wv.getDuration ())
				{
					wv.LeftProgress = wv.getDuration () - wv.VisibleDuration;
				}
				else if (wv.LeftProgress < 0) {
					wv.LeftProgress = 0;
				}

				wv.ForceDraw ();
				app.fireEvent ('DidZoom', [wavesurfer.ZoomFactor, (wavesurfer.LeftProgress/wavesurfer.getDuration()) * 100, wavesurfer.params.verticalZoom]);
			}
		});
		

		wave.addEventListener ('mousedown', function( e ) {
			if (e.which === 3) {
				e.preventDefault();
				
				wavesurfer.Interacting |= (1 << 1);

				drag_x = e.clientX;
				wave.className = 'pk_grabbing';
				
				document.addEventListener ('mousemove', drag_move, false);
				return (false);
			} else {
				app.fireEvent ('MouseDown');
				app.fireEvent ('RequestChanToggle', 0, 1);
				app.fireEvent ('RequestChanToggle', 1, 1);
			}
		}, false);
		wave.addEventListener ('mouseleave', function( e ) {
			document.removeEventListener ('mousemove', drag_move);

			if (wave.className !== '')
			{
				wave.className = '';
				setTimeout(function () {
					wavesurfer.Interacting &= ~(1 << 1);
				}, 20);

			}
		}, false);
		wave.addEventListener ('mouseup', function( e ) {
			if (e.which === 3)
			{
				if (wave.className !== '')
				{
					wave.className = '';
					setTimeout(function () {
						wavesurfer.Interacting &= ~(1 << 1);
					}, 20);
				}
				document.removeEventListener ('mousemove', drag_move);
			}
		}, false);

		app.fireEvent ('RequestResize');

		app.listenFor ('RequestViewFollowCursorToggle', function () {
			var val = !wavesurfer.FollowCursor;
			wavesurfer.FollowCursor = val;

			// jump to curr cursor position
			if (val && q.is_ready) {
				wavesurfer.CursorCenter ();
			}

			app.fireEvent ( 'DidViewFollowCursorToggle', val );
		});
		app.listenFor ('RequestViewPeakSeparatorToggle', function () {
			if (!q.is_ready) return ;

			var val = !wavesurfer.params.limits ;
			wavesurfer.params.limits = val;

			wavesurfer.ForceDraw ();

			app.fireEvent ( 'DidViewPeakSeparatorToggle', val );
		});

		
		app.listenFor ('RequestViewTimelineToggle', function () {
			if (!q.is_ready) return ;

			var val = !wavesurfer.params.timeline ;
			wavesurfer.params.timeline = val;

			wavesurfer.ForceDraw ();

			app.fireEvent ( 'DidViewTimelineToggle', val );
		});

		app.listenFor ('RequestViewCenterToCursor', function () {
			if (!q.is_ready) return ;
			wavesurfer.CursorCenter ();
		});


		app.listenFor ('RequestZoomUI', function (type, val) {
			if (!q.is_ready) return ;

			if (type === 0) {
				wavesurfer.ResetZoom ();
				return ;
			}

			if (type === 'h') {
				wavesurfer.SetZoom ( 0.5, val );
			}

			if (type === 'v') {
				wavesurfer.SetZoomVertical ( val );
			}
		});
		// -
	};

	PKAE._deps.engine = PKEng;

})( window, document, PKAudioEditor );