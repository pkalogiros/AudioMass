(function ( w, d, PKAE ) {
	'use strict';

	function PKMultitrack ( app ) {
		var q = this;
		var on = false;
		var tracks = [];
		var clips = [];
		var track_uid = 1;
		var clip_uid = 1;
		var selected_track = null;
		var selected_clip = null;
		var editing_clip = null;
		var default_px_per_sec = 86;
		var default_row_h = 76;
		var min_track_h = 44;
		var max_track_h = 220;
		var px_per_sec = 86;
		var row_h = 76;
		var cursor = 0;
		var marker = 0;
		var region = null;
		var raf = 0;
		var play_sync = 0;
		var throttle_wheel = 0;

		var el = null;
		var side = null;
		var tracks_el = null;
		var main = null;
		var ruler = null;
		var ruler_canvas = null;
		var lanes = null;
		var region_el = null;
		var playhead = null;
		var marker_el = null;
		var btn_toggle = null;
		var lane_by_track = {};

		var play = null;
		var rec = null;

		function audioCtx () {
			var wv = app.engine && app.engine.wavesurfer;
			if (wv && wv.backend && wv.backend.ac) return wv.backend.ac;
			if (!w.WaveSurferAudioContext)
				w.WaveSurferAudioContext = new (w.AudioContext || w.webkitAudioContext)();
			return w.WaveSurferAudioContext;
		}

		function makeTrack ( name ) {
			return {
				id: 'mt' + (track_uid++),
				name: name || ('Channel ' + track_uid),
				mute: false,
				solo: false,
				vol: 1,
				pan: 0,
				rec: false
			};
		}

		function cloneState () {
			return {
				track_uid: track_uid,
				clip_uid: clip_uid,
				selected_track: selected_track,
				selected_clip: selected_clip,
				cursor: cursor,
				marker: marker,
				px_per_sec: px_per_sec,
				row_h: row_h,
				tracks: tracks.map (function ( t ) {
					return {
						id: t.id,
						name: t.name,
						mute: t.mute,
						solo: t.solo,
						vol: t.vol,
						pan: t.pan,
						h: t.h || 1,
						rec: t.rec
					};
				}),
				clips: clips.map (function ( c ) {
					return {
						id: c.id,
						track: c.track,
						start: c.start,
						in: c.in || 0,
						out: c.out,
						name: c.name,
						buffer: c.buffer
					};
				})
			};
		}

		function pushState ( prev, desc ) {
			app.fireEvent ('StateRequestPush', {
				type: 'multitrack',
				desc: desc,
				mt: prev,
				data: app.engine.wavesurfer.backend.buffer
			});
		}

		function restoreState ( state ) {
			if (!state) return ;

			Stop ();
			tracks = state.tracks.map (function ( t ) {
				return {
					id: t.id,
					name: t.name,
					mute: !!t.mute,
					solo: !!t.solo,
					vol: t.vol === undefined ? 1 : t.vol,
					pan: t.pan || 0,
					h: t.h || 1,
					rec: !!t.rec
				};
			});
			clips = state.clips.map (function ( c ) {
				return {
					id: c.id,
					track: c.track,
					start: c.start || 0,
					in: c.in || 0,
					out: c.out,
					name: c.name,
					buffer: c.buffer
				};
			});
			track_uid = state.track_uid || nextNum (tracks, 'mt');
			clip_uid = state.clip_uid || nextNum (clips, 'mc');
			selected_track = state.selected_track || (tracks[0] && tracks[0].id);
			selected_clip = state.selected_clip || null;
			cursor = state.cursor || 0;
			marker = state.marker === undefined ? cursor : state.marker;
			px_per_sec = state.px_per_sec || default_px_per_sec;
			row_h = state.row_h || default_row_h;
			render ();
			if (selected_clip) app.fireEvent ('DidSelectClip', findClip ( selected_clip ));
			else app.fireEvent ('DidDeselectClip');
			updatePlayhead ();
			fireZoom ();
			app.fireEvent ('DidUpdateMultitrack');
		}

		function nextNum ( arr, pref ) {
			var max = 0;
			for (var i = 0; i < arr.length; ++i) {
				var n = (arr[i].id || '').replace(pref, '') / 1;
				if (n > max) max = n;
			}
			return max + 1;
		}

		q.getState = cloneState;

		function duration () {
			var dur = 30;
			for (var i = 0; i < clips.length; ++i) {
				var c = clips[i];
				dur = Math.max (dur, c.start + clipLen ( c ) + 2);
			}
			return dur;
		}

		function clampTime ( time ) {
			return Math.max (0, Math.min (duration (), time || 0));
		}

		function clipIn ( clip ) {
			return clip.in || 0;
		}

		function clipOut ( clip ) {
			return clip.out === undefined ? clip.buffer.duration : clip.out;
		}

		function clipLen ( clip ) {
			return Math.max (0.01, clipOut (clip) - clipIn (clip));
		}

		function findTrack ( id ) {
			for (var i = 0; i < tracks.length; ++i)
				if (tracks[i].id === id) return tracks[i];
			return null;
		}

		function findClip ( id ) {
			for (var i = 0; i < clips.length; ++i)
				if (clips[i].id === id) return clips[i];
			return null;
		}

		function activeTrack () {
			for (var i = 0; i < tracks.length; ++i)
				if (tracks[i].rec) return tracks[i];
			return null;
		}

		function hasSolo () {
			for (var i = 0; i < tracks.length; ++i)
				if (tracks[i].solo) return true;
			return false;
		}

		function trackAudible ( track, solo ) {
			if (!track || track.mute) return false;
			return solo ? track.solo : true;
		}

		function trackGain ( track, solo ) {
			return trackAudible ( track, solo ) ?
				(track.vol === undefined ? 1 : track.vol) :
				0;
		}

		function trackHeight ( track ) {
			return Math.max (min_track_h, Math.min (max_track_h,
				row_h * (track && track.h ? track.h : 1)));
		}

		function trackTop ( id ) {
			var top = 0;
			for (var i = 0; i < tracks.length; ++i) {
				if (tracks[i].id === id) return top;
				top += trackHeight ( tracks[i] );
			}
			return top;
		}

		function trackIndexAt ( y ) {
			var top = 0;
			for (var i = 0; i < tracks.length; ++i) {
				top += trackHeight ( tracks[i] );
				if (y < top) return i;
			}
			return Math.max (0, tracks.length - 1);
		}

		function tracksHeight () {
			var h = 0;
			for (var i = 0; i < tracks.length; ++i)
				h += trackHeight ( tracks[i] );
			return h;
		}

		function formatTime ( val ) {
			if (app.ui && app.ui.formatTime) return app.ui.formatTime ( val );
			var s = val >> 0;
			var m = (s / 60) >> 0;
			s = s % 60;
			return m + ':' + (s < 10 ? '0' : '') + s;
		}

		function blurActive () {
			var ae = d.activeElement;
			if (ae && /INPUT|TEXTAREA|SELECT/.test ( ae.tagName || '' ))
				ae.blur ();
		}

		function focusMain () {
			blurActive ();
			if (main) main.focus ();
		}

		function build () {
			var footer = app.el.getElementsByClassName ('pk_ftr')[0];
			el = d.createElement ('div');
			el.className = 'pk_mt pk_noselect';
			el.innerHTML =
				'<div class="pk_mt_side">' +
					'<div class="pk_mt_head"><button tabIndex="-1">+</button><span>Channels</span></div>' +
					'<div class="pk_mt_tracks"></div>' +
				'</div>' +
				'<div class="pk_mt_main">' +
					'<div class="pk_mt_ruler"></div>' +
					'<div class="pk_mt_lanes"></div>' +
					'<div class="pk_mt_region wavesurfer-region"></div>' +
					'<div class="pk_mt_playhead"></div>' +
					'<div class="pk_mt_marker"></div>' +
				'</div>';

			app.el.insertBefore ( el, footer );

			side = el.getElementsByClassName ('pk_mt_side')[0];
			tracks_el = el.getElementsByClassName ('pk_mt_tracks')[0];
			main = el.getElementsByClassName ('pk_mt_main')[0];
			main.tabIndex = -1;
			ruler = el.getElementsByClassName ('pk_mt_ruler')[0];
			lanes = el.getElementsByClassName ('pk_mt_lanes')[0];
			region_el = el.getElementsByClassName ('pk_mt_region')[0];
			playhead = el.getElementsByClassName ('pk_mt_playhead')[0];
			marker_el = el.getElementsByClassName ('pk_mt_marker')[0];
			addRegionHandles ();
			ruler.onclick = function ( e ) {
				focusMain ();
				setCursorTime ( timeFromEvent ( e ) );
			};

			el.getElementsByTagName ('button')[0].onclick = function () {
				var prev = cloneState ();
				var tr = makeTrack ();
				tr.name = 'Channel ' + (tracks.length + 1);
				tracks.push ( tr );
				selected_track = tr.id;
				pushState ( prev, 'Add Channel' );
				render ();
			};

			main.addEventListener ('wheel', wheelZoom, {passive:false});
			main.addEventListener ('mousedown', startRangeSelect, false);

			attachToolbarButton ();
			render ();
		}

		function attachToolbarButton () {
			var actions = app.el.getElementsByClassName ('pk_ctns')[0];
			if (!actions) return ;

			btn_toggle = d.createElement ('button');
			btn_toggle.setAttribute ('tabIndex', -1);
			btn_toggle.className = 'pk_btn pk_mt_btn';
			btn_toggle.innerHTML = '<span>Multitrack Mode</span>';
			btn_toggle.onclick = function () {
				Toggle ();
				this.blur ();
			};
			actions.appendChild ( btn_toggle );
		}

		function IsOn () {
			return on || app.el.classList.contains ('pk_mt_on');
		}

		function Toggle ( force ) {
			on = force === undefined ? !IsOn () : !!force;
			app.el.classList[on ? 'add' : 'remove'] ('pk_mt_on');
			if (btn_toggle) btn_toggle.classList[on ? 'add' : 'remove'] ('pk_act');
			if (!on) {
				Stop ();
			}
				else {
					syncEditingClip ();
					app.engine.wavesurfer.pause ();
				main.scrollTop = 0;
				tracks_el.style.transform = 'translateY(0)';
				render ();
				updatePlayhead ();
					fireZoom ();
				}
				app.fireEvent ('DidUpdateMultitrack');
				app.fireEvent ('RequestResize');
			}

		function addTip ( el, text ) {
			var s = d.createElement ('span');
			s.textContent = text;
			el.appendChild ( s );
		}

		function makeButton ( text, title, active, cls ) {
			var b = d.createElement ('button');
			b.type = 'button';
			b.tabIndex = -1;
			b.title = title;
			b.className = (cls || '') + (active ? ' pk_act' : '');
			b.appendChild ( d.createTextNode ( text ) );
			addTip ( b, title );
			return b;
		}

		function addRegionHandles () {
			var l = d.createElement ('handle');
			var r = d.createElement ('handle');
			l.className = 'wavesurfer-handle wavesurfer-handle-start';
			r.className = 'wavesurfer-handle wavesurfer-handle-end';
			region_el.appendChild ( l );
			region_el.appendChild ( r );
			region_el.onmousedown = startRegionEdit;
			region_el.ondblclick = passRegionEventToClip;
		}

		function render () {
			if (!el) return ;

			lane_by_track = {};
			tracks_el.innerHTML = '';
			lanes.innerHTML = '';

			var dur = duration ();
			var width = Math.max (800, (dur * px_per_sec) >> 0);
			var top = 0;
			lanes.style.width = width + 'px';
			lanes.style.height = tracksHeight () + 'px';
			ruler.style.width = width + 'px';
			drawRuler ( dur, width );

			for (var i = 0; i < tracks.length; ++i) {
				var h = trackHeight ( tracks[i] );
				renderTrack ( tracks[i], top, h );
				top += h;
			}

			for (var j = 0; j < clips.length; ++j) {
				renderClip ( clips[j] );
			}

			renderRegion ();
			updatePlayhead ();
			fireZoom ();
		}

		function drawRuler ( dur, width ) {
			var left = main ? main.scrollLeft : 0;
			var visible = Math.max (1, main ? main.clientWidth : (ruler.clientWidth || width));
			var ratio = w.devicePixelRatio || 1;

			if (app.ui && app.ui.drawTimelineRuler) {
				if (!ruler_canvas) {
					ruler.innerHTML = '';
					ruler_canvas = d.createElement ('canvas');
					ruler_canvas.className = 'pk_mt_timeline';
					ruler.appendChild ( ruler_canvas );
				}
				ruler_canvas.width = (visible * ratio) >> 0;
				ruler_canvas.height = (24 * ratio) >> 0;
				ruler_canvas.style.left = (left >> 0) + 'px';
				ruler_canvas.style.width = visible + 'px';
				ruler_canvas.style.height = '24px';

				var ctx = ruler_canvas.getContext ('2d', {alpha:false});
				ctx.setTransform (ratio, 0, 0, ratio, 0, 0);
				app.ui.drawTimelineRuler ( ctx, dur, width, left, visible );
				return ;
			}

			ruler.innerHTML = '';
			ruler_canvas = null;
			{
				var step = dur > 90 ? 10 : 5;
				for (var t = 0; t <= dur; t += step) {
					var old_tick = d.createElement ('div');
					old_tick.className = 'pk_mt_tick';
					old_tick.style.left = ((t * px_per_sec) >> 0) + 'px';
					old_tick.textContent = formatTime ( t );
					ruler.appendChild ( old_tick );
				}
			}
		}

		function redrawRuler () {
			if (ruler) drawRuler ( duration (), totalPixels () );
		}

		function renderTrack ( track, top, h ) {
			var row = d.createElement ('div');
			row.className = 'pk_mt_track' + (track.id === selected_track ? ' pk_mt_sel' : '');
			row.setAttribute ('data-track', track.id);
			row.style.height = h + 'px';

			var input = d.createElement ('input');
			input.type = 'text';
			input.value = track.name;
			input.spellcheck = false;
			input.onmousedown = stopTrackInputEvent;
			input.onclick = stopTrackInputEvent;
			input.onkeydown = function ( e ) {
				e.stopPropagation ();
				if (e.keyCode === 13) input.blur ();
			};
			input.onfocus = function () {
				input._old = track.name;
			};
			input.onchange = function () {
				var val = input.value.trim ();
				if (!val) val = track.name;
				if (val === track.name) {
					input.value = track.name;
					return ;
				}
				var prev = cloneState ();
				track.name = val;
				input.value = val;
				pushState ( prev, 'Rename Channel' );
			};

			var mute = makeButton ('M', 'Mute', track.mute, 'pk_mt_mute');
			var solo = makeButton ('S', 'Solo', track.solo, 'pk_mt_solo');
			var arm = makeButton ('R', 'Rec Trigger', track.rec, 'pk_mt_rec');
			var del = makeButton ('x', 'Delete Channel', false, 'pk_mt_del');
			var resize = d.createElement ('b');
			resize.className = 'pk_mt_resize';

			mute.onclick = function ( e ) {
				e.stopPropagation ();
				setTrackFlag ( track, 'mute', !track.mute, 'Mute Channel' );
			};
			solo.onclick = function ( e ) {
				e.stopPropagation ();
				setTrackFlag ( track, 'solo', !track.solo, 'Solo Channel' );
			};
			arm.onclick = function ( e ) {
				e.stopPropagation ();
				setRecordArm ( track, !track.rec );
			};
			del.onclick = function ( e ) {
				e.stopPropagation ();
				removeTrack ( track );
			};

			var pan = d.createElement ('div');
			pan.className = 'pk_mt_knob pk_mt_pan';
			pan.title = 'Pan L/R';
			var needle = d.createElement ('i');
			pan.appendChild ( needle );
			addTip ( pan, 'Pan L/R' );
			updateKnob ( pan, track.pan );
			bindPan ( pan, track );

			var vol = d.createElement ('div');
			vol.className = 'pk_mt_knob pk_mt_vol';
			vol.title = 'Volume';
			needle = d.createElement ('i');
			vol.appendChild ( needle );
			addTip ( vol, 'Volume' );
			updateVolume ( vol, track.vol === undefined ? 1 : track.vol );
			bindVolume ( vol, track );
			bindTrackResize ( resize, track );

			row.appendChild ( input );
			row.appendChild ( mute );
			row.appendChild ( solo );
			row.appendChild ( vol );
			row.appendChild ( pan );
			row.appendChild ( arm );
			row.appendChild ( del );
			row.appendChild ( resize );
			tracks_el.appendChild ( row );

			row.onclick = function ( e ) {
				if (e.target === input) return ;
				blurActive ();
				selected_track = track.id;
				render ();
			};
			row.onmousedown = function ( e ) {
				var rect = row.getBoundingClientRect ();
				if (rect.bottom - e.clientY < 12)
					startTrackResize ( e, track );
			};
			row.addEventListener ('dragover', stopDrag, false);
			row.addEventListener ('drop', function ( e ) {
				stopDrag ( e );
				selected_track = track.id;
				addFiles ( e.dataTransfer.files, track.id, cursor );
			}, false);

			var lane = d.createElement ('div');
			lane.className = 'pk_mt_lane' + (track.id === selected_track ? ' pk_mt_sel' : '');
			lane.style.top = top + 'px';
			lane.style.height = h + 'px';
			lane.setAttribute ('data-track', track.id);
			lane.addEventListener ('dragover', stopDrag, false);
			lane.addEventListener ('drop', function ( e ) {
				stopDrag ( e );
				var tid = this.getAttribute ('data-track');
				selected_track = tid;
				addFiles ( e.dataTransfer.files, tid, timeFromEvent ( e ) );
			}, false);
			lanes.appendChild ( lane );
			lane_by_track[track.id] = lane;
		}

		function stopTrackInputEvent ( e ) {
			e.stopPropagation ();
		}

		function setTrackFlag ( track, flag, value, desc ) {
			if (track[flag] === value) return ;
			var prev = cloneState ();
			track[flag] = value;
			pushState ( prev, desc );
			refreshMix ();
			render ();
		}

		function setRecordArm ( track, value ) {
			var prev = cloneState ();
			var changed = false;
			for (var i = 0; i < tracks.length; ++i) {
				if (tracks[i].rec !== (tracks[i] === track && value)) {
					tracks[i].rec = (tracks[i] === track && value);
					changed = true;
				}
			}
			if (!changed) return ;
			selected_track = track.id;
			pushState ( prev, 'Arm Channel' );
			render ();
		}

		function removeTrack ( track ) {
			if (tracks.length < 2) return ;
			var prev = cloneState ();
			for (var i = tracks.length - 1; i >= 0; --i)
				if (tracks[i].id === track.id) tracks.splice (i, 1);
			for (var j = clips.length - 1; j >= 0; --j)
				if (clips[j].track === track.id) clips.splice (j, 1);
			if (selected_track === track.id)
				selected_track = tracks[0] && tracks[0].id;
				pushState ( prev, 'Remove Channel' );
				queuePlayRefresh ( true );
				render ();
				app.fireEvent ('DidUpdateMultitrack');
			}

		function updateKnob ( el, val ) {
			el.getElementsByTagName ('i')[0].style.transform =
				'rotate(' + (val * 65) + 'deg)';
			el.setAttribute ('data-val', val.toFixed (2));
		}

		function updateVolume ( el, val ) {
			el.getElementsByTagName ('i')[0].style.transform =
				'rotate(' + (-135 + val * 270) + 'deg)';
			el.setAttribute ('data-val', ((val * 100) >> 0) + '%');
		}

		function bindVolume ( knob, track ) {
			var start_y = 0;
			var start_vol = 1;
			var prev = null;
			var moved = false;

			knob.onmousedown = function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();
				prev = cloneState ();
				start_y = e.clientY;
				start_vol = track.vol === undefined ? 1 : track.vol;
				moved = false;
				d.addEventListener ('mousemove', move, false);
				d.addEventListener ('mouseup', up, false);
			};
			knob.ondblclick = function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();
				if (track.vol === 1 || track.vol === undefined) return ;
				var p = cloneState ();
				track.vol = 1;
				pushState ( p, 'Volume Channel' );
				refreshMix ();
				render ();
			};

			function move ( e ) {
				var val = Math.max (0, Math.min (1, start_vol - ((e.clientY - start_y) / 90)));
				if (Math.abs (val - (track.vol === undefined ? 1 : track.vol)) > 0.001) moved = true;
				track.vol = val;
				updateVolume ( knob, val );
				refreshMix ();
			}

			function up () {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				if (moved) pushState ( prev, 'Volume Channel' );
			}
		}

		function bindPan ( knob, track ) {
			var start_x = 0;
			var start_pan = 0;
			var prev = null;
			var moved = false;

			knob.onmousedown = function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();
				prev = cloneState ();
				start_x = e.clientX;
				start_pan = track.pan;
				moved = false;
				d.addEventListener ('mousemove', move, false);
				d.addEventListener ('mouseup', up, false);
			};
			knob.ondblclick = function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();
				if (track.pan === 0) return ;
				var p = cloneState ();
				track.pan = 0;
				pushState ( p, 'Pan Channel' );
				refreshMix ();
				render ();
			};

			function move ( e ) {
				var val = Math.max (-1, Math.min (1, start_pan + ((e.clientX - start_x) / 80)));
				if (Math.abs (val - track.pan) > 0.001) moved = true;
				track.pan = val;
				updateKnob ( knob, val );
				refreshMix ();
			}

			function up () {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				if (moved) pushState ( prev, 'Pan Channel' );
			}
		}

		function startTrackResize ( e, track ) {
			var start_y = 0;
			var start_h = 0;
			var prev = null;
			var moved = false;

			e.preventDefault ();
			e.stopPropagation ();
			if (!app.ui.InteractionHandler.checkAndSet ('multitrack-resize')) return (false);
			prev = cloneState ();
			start_y = e.clientY;
			start_h = trackHeight ( track );
			d.addEventListener ('mousemove', move, false);
			d.addEventListener ('mouseup', up, false);

			function move ( e ) {
				var h = Math.max (min_track_h, Math.min (max_track_h, start_h + e.clientY - start_y));
				if (Math.abs (h - start_h) > 1) moved = true;
				track.h = h / row_h;
				render ();
			}

			function up () {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				app.ui.InteractionHandler.forceUnset ('multitrack-resize');
				if (moved) pushState ( prev, 'Resize Channel' );
			}
		}

		function bindTrackResize ( handle, track ) {
			handle.onmousedown = function ( e ) {
				startTrackResize ( e, track );
			};
		}

		function renderClip ( clip ) {
			var lane = lane_by_track[clip.track];
			if (!lane) return ;

			var ce = d.createElement ('div');
			ce.className = 'pk_mt_clip' + (clip.id === selected_clip ? ' pk_mt_clip_sel' : '');
			ce.setAttribute ('data-clip', clip.id);
			ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';
			ce.style.width = Math.max (36, (clipLen ( clip ) * px_per_sec) >> 0) + 'px';
			ce.style.height = Math.max (30, trackHeight ( findTrack ( clip.track ) ) - 16) + 'px';

			var label = d.createElement ('span');
			label.textContent = clip.name || 'Audio';

			var canvas = d.createElement ('canvas');
			var trim_l = d.createElement ('i');
			var trim_r = d.createElement ('i');
			trim_l.className = 'pk_mt_trim pk_mt_trim_l';
			trim_r.className = 'pk_mt_trim pk_mt_trim_r';

			ce.appendChild ( canvas );
			ce.appendChild ( trim_l );
			ce.appendChild ( trim_r );
			ce.appendChild ( label );
			lane.appendChild ( ce );

			drawWave ( clip, canvas );
			bindClipDrag ( ce, clip );
			ce.ondblclick = function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();
				selectClip ( clip );
				loadClip ( clip );
			};
		}

		function selectClip ( clip ) {
			if (selected_clip === clip.id && selected_track === clip.track) {
				app.fireEvent ('DidSelectClip', clip);
				return ;
			}
			selected_clip = clip.id;
			selected_track = clip.track;
			render ();
			app.fireEvent ('DidSelectClip', clip);
		}

		function clearSelectedClip ( silent ) {
			if (!selected_clip) return false;
			selected_clip = null;
			app.fireEvent ('DidDeselectClip');
			if (!silent) app.fireEvent ('DidDestroyRegion');
			render ();
			return true;
		}

		function regionTrack ( e ) {
			var node = e.target;
			while (node && node !== main) {
				if (node.getAttribute && node.getAttribute ('data-track'))
					return node.getAttribute ('data-track');
				node = node.parentNode;
			}
			return null;
		}

		function makeRegion ( start, end, loop ) {
			return {
				id: 't',
				start: start,
				end: end,
				loop: !!loop,
				mt: true,
				element: region_el
			};
		}

		function setRegion ( start, end ) {
			var a = clampTime ( start );
			var b = clampTime ( end );
			if (b < a) {
				var t = a;
				a = b;
				b = t;
			}
			if (b - a < 0.005) return clearRegion ();

			region = makeRegion ( a, b, region && region.loop );
			renderRegion ();
			app.fireEvent ('DidCreateRegion', region);
			return region;
		}

		function clearRegion () {
			if (!region) return false;
			region = null;
			renderRegion ();
			app.fireEvent ('DidSetLoop', 0);
			app.fireEvent ('DidDestroyRegion');
			return true;
		}

		function renderRegion () {
			if (!region_el) return ;
			if (!region) {
				region_el.style.display = 'none';
				return ;
			}

			var start = clampTime ( region.start );
			var end = clampTime ( region.end );
			if (end <= start) {
				region_el.style.display = 'none';
				return ;
			}

			region_el.style.display = 'block';
			region_el.style.left = ((start * px_per_sec) >> 0) + 'px';
			region_el.style.width = Math.max (1, ((end - start) * px_per_sec) >> 0) + 'px';
		}

		function clipNodeFrom ( node ) {
			while (node && node !== main) {
				if (node.classList && node.classList.contains ('pk_mt_clip'))
					return node;
				node = node.parentNode;
			}
			return null;
		}

		function regionNodeAtEvent ( e ) {
			var pe = region_el.style.pointerEvents;
			region_el.style.pointerEvents = 'none';
			var node = d.elementFromPoint ( e.clientX, e.clientY );
			region_el.style.pointerEvents = pe;
			return node;
		}

		function clipNodeAtEvent ( e ) {
			var node = regionNodeAtEvent ( e );
			return clipNodeFrom ( node ) ? node : null;
		}

		function cloneMouseEvent ( e ) {
			return new MouseEvent (e.type, {
				bubbles: true,
				cancelable: true,
				view: w,
				detail: e.detail,
				screenX: e.screenX,
				screenY: e.screenY,
				clientX: e.clientX,
				clientY: e.clientY,
				ctrlKey: e.ctrlKey,
				altKey: e.altKey,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
				button: e.button,
				buttons: e.buttons
			});
		}

		function isRegionHandleEvent ( e ) {
			var cls = e.target && e.target.classList;
			return !!(cls && (
				cls.contains ('wavesurfer-handle-start') ||
				cls.contains ('wavesurfer-handle-end')
			));
		}

		function passMouseEventTo ( target, e ) {
			if (!target) return false;

			e.preventDefault ();
			e.stopPropagation ();
			target.dispatchEvent ( cloneMouseEvent ( e ) );
			return true;
		}

		function passRegionEventToClip ( e ) {
			if (isRegionHandleEvent ( e )) return false;
			return passMouseEventTo ( clipNodeAtEvent ( e ), e );
		}

		function startRegionEdit ( e ) {
			if (!region || (e.button !== undefined && e.button !== 0)) return ;
			if (passRegionEventToClip ( e )) return ;
			if (!isRegionHandleEvent ( e )) {
				startRegionBodyEdit ( e );
				return ;
			}

			focusMain ();
			e.preventDefault ();
			e.stopPropagation ();
			if (!app.ui.InteractionHandler.checkAndSet ('multitrack-region')) return ;

			var cls = e.target && e.target.classList;
			var mode = cls && cls.contains ('wavesurfer-handle-start') ? -1 :
				(cls && cls.contains ('wavesurfer-handle-end') ? 1 : 0);
			var down_x = e.clientX;
			var old_start = region.start;
			var old_end = region.end;
			var moved = false;

			d.addEventListener ('mousemove', move, false);
			d.addEventListener ('mouseup', up, false);

			function move ( ev ) {
				var diff = (ev.clientX - down_x) / px_per_sec;
				var min = 0.005;
				var start = old_start;
				var end = old_end;

				ev.preventDefault ();
				moved = true;

				if (mode < 0) {
					start = Math.max (0, Math.min (old_end - min, old_start + diff));
				}
				else {
					end = Math.min (duration (), Math.max (old_start + min, old_end + diff));
				}

				setRegion ( start, end );
			}

			function up () {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				app.ui.InteractionHandler.forceUnset ('multitrack-region');
				if (moved && region) setCursorTime ( region.start );
			}
		}

		function startRegionBodyEdit ( e ) {
			focusMain ();
			e.preventDefault ();
			e.stopPropagation ();

			var down_x = e.clientX;
			var down_y = e.clientY;
			var old_start = region.start;
			var old_end = region.end;
			var active = false;

			d.addEventListener ('mousemove', move, false);
			d.addEventListener ('mouseup', up, false);

			function move ( ev ) {
				var dx = ev.clientX - down_x;
				var dy = ev.clientY - down_y;
				if (!active) {
					if (Math.abs ( dx ) + Math.abs ( dy ) < 5) return ;
					if (!app.ui.InteractionHandler.checkAndSet ('multitrack-region')) {
						up ( ev );
						return ;
					}
					active = true;
				}

				var len = old_end - old_start;
				var start = Math.max (0, Math.min (duration () - len,
					old_start + dx / px_per_sec));
				ev.preventDefault ();
				setRegion ( start, start + len );
			}

			function up ( ev ) {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				if (active) {
					app.ui.InteractionHandler.forceUnset ('multitrack-region');
					if (region) setCursorTime ( region.start );
					return ;
				}

				var target = regionNodeAtEvent ( ev );
				var track = regionTrack ({target: target});
				if (track) selected_track = track;
				clearRegion ();
				setCursorTime ( timeFromEvent ( ev ) );
				render ();
			}
		}

		function drawWave ( clip, canvas ) {
			var buffer = clip.buffer;
			var wdt = Math.min (1000, Math.max (64, canvas.parentNode.offsetWidth || 64));
			var hgt = Math.max (22, canvas.parentNode.offsetHeight - 8);
			canvas.width = wdt;
			canvas.height = hgt;

			var ctx = canvas.getContext ('2d', {alpha:false});
			ctx.fillStyle = '#071010';
			ctx.fillRect (0, 0, wdt, hgt);
			ctx.fillStyle = '#88c7c1';

			var data = buffer.getChannelData (0);
			var from = Math.max (0, (clipIn ( clip ) * buffer.sampleRate) >> 0);
			var to = Math.min (data.length, (clipOut ( clip ) * buffer.sampleRate) >> 0);
			var len = Math.max (1, to - from);
			var step = Math.max (1, (len / wdt) >> 0);
			var mid = hgt >> 1;

			ctx.beginPath ();
			ctx.moveTo (0, mid);
			for (var x = 0; x < wdt; ++x) {
				var max = 0;
				var min = 0;
				var off = from + x * step;
				for (var j = 0; j < step; j += 24) {
					var v = data[off + j] || 0;
					if (v > max) max = v;
					else if (v < min) min = v;
				}
				ctx.fillRect (x, mid - (max * mid), 1, Math.max (1, (max - min) * mid));
			}
		}

		function bindClipDrag ( ce, clip ) {
			var down_x = 0;
			var down_y = 0;
			var old_start = 0;
			var old_track = null;
			var old_top = 0;
			var old_h = 0;
			var old_in = 0;
			var old_out = 0;
			var drag_mode = 0;
			var prev = null;
			var moved = false;
			var did_move = false;

			ce.onmousedown = function ( e ) {
				focusMain ();
				e.preventDefault ();
				e.stopPropagation ();
				var cls = e.target && e.target.classList;
				prev = cloneState ();
				down_x = e.clientX;
				down_y = e.clientY;
				old_start = clip.start;
				old_track = clip.track;
				old_top = trackTop ( old_track );
				old_h = trackHeight ( findTrack ( old_track ) );
				old_in = clipIn ( clip );
				old_out = clipOut ( clip );
				drag_mode = cls && cls.contains ('pk_mt_trim_l') ? 1 :
					(cls && cls.contains ('pk_mt_trim_r') ? 2 : 0);
				moved = false;
				did_move = false;
				if (!app.ui.InteractionHandler.checkAndSet ('multitrack')) return (false);
				ce.classList.add ('pk_drag');
				d.addEventListener ('mousemove', move, false);
				d.addEventListener ('mouseup', up, false);
			};

			function move ( e ) {
				var dx = e.clientX - down_x;
				var dy = e.clientY - down_y;
				if (!moved && Math.abs (dx) + Math.abs (dy) < 4) return ;
				moved = true;
				did_move = true;

				if (drag_mode) {
					trimClip ( dx / px_per_sec );
					ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';
					ce.style.width = Math.max (36, (clipLen ( clip ) * px_per_sec) >> 0) + 'px';
					drawWave ( clip, ce.getElementsByTagName ('canvas')[0] );
					queuePlayRefresh ();
					return ;
				}

				clip.start = Math.max (0, old_start + dx / px_per_sec);
				ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';

				var new_index = trackIndexAt ( old_top + (old_h / 2) + dy );
				if (tracks[new_index] && tracks[new_index].id !== clip.track) {
					clip.track = tracks[new_index].id;
					selected_track = clip.track;
					lane_by_track[clip.track].appendChild ( ce );
					ce.style.height = Math.max (30, trackHeight ( tracks[new_index] ) - 16) + 'px';
				}
				queuePlayRefresh ();
			}

			function up ( e ) {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				ce.classList.remove ('pk_drag');
				app.ui.InteractionHandler.forceUnset ('multitrack');

				if (did_move && (
					Math.abs (clip.start - old_start) > 0.001 ||
					Math.abs (clipIn (clip) - old_in) > 0.001 ||
					Math.abs (clipOut (clip) - old_out) > 0.001 ||
					clip.track !== old_track
				)) {
					pushState ( prev, drag_mode ? 'Trim Clip' : 'Move Clip' );
					queuePlayRefresh ( true );
					render ();
					return ;
				}

				setCursorTime ( timeFromEvent ( e ) );
				selectClip ( clip );
			}

			function trimClip ( diff ) {
				var min = Math.min (0.05, clip.buffer.duration);
				if (drag_mode === 1) {
					var next_in = old_in + diff;
					var next_start = old_start + diff;

					if (next_start < 0) {
						next_in -= next_start;
						next_start = 0;
					}
					if (next_in < 0) {
						next_start -= next_in;
						next_in = 0;
					}
					if (next_in > old_out - min) {
						next_in = old_out - min;
						next_start = old_start + (next_in - old_in);
					}

					clip.in = Math.max (0, next_in);
					clip.start = Math.max (0, next_start);
				}
				else {
					clip.out = Math.max (old_in + min, Math.min (clip.buffer.duration, old_out + diff));
				}
			}
		}

		function trackIndex ( id ) {
			for (var i = 0; i < tracks.length; ++i)
				if (tracks[i].id === id) return i;
			return 0;
		}

		function stopDrag ( e ) {
			e.preventDefault ();
			e.stopPropagation ();
		}

		function wheelZoom ( e ) {
			e.preventDefault ();
			e.stopPropagation ();

			if (e.deltaY === 0) return ;
			if (e.timeStamp - throttle_wheel < 46) return ;

			throttle_wheel = e.timeStamp;
			var rect = main.getBoundingClientRect ();
			var where = (e.clientX - rect.left) / Math.max (1, main.clientWidth);
			if (where < 0) where = 0;
			else if (where > 1) where = 1;
			zoomTo ( px_per_sec * (e.deltaY < 0 ? 1.25 : 0.8),
				(main.scrollLeft + where * main.clientWidth) / px_per_sec,
				where );
		}

		function timeFromEvent ( e ) {
			var rect = lanes.getBoundingClientRect ();
			return Math.max (0, (e.clientX - rect.left) / px_per_sec);
		}

		function canRangeSelect ( e ) {
			if (e.button !== undefined && e.button !== 0) return false;
			if (e.target === main || e.target === lanes || e.target === ruler)
				return true;
			if (e.target.classList && e.target.classList.contains ('pk_mt_tick'))
				return true;
			return !!(e.target.classList && e.target.classList.contains ('pk_mt_lane'));
		}

		function startRangeSelect ( e ) {
			if (!canRangeSelect ( e )) return ;

			focusMain ();
			e.preventDefault ();
			e.stopPropagation ();

			var track = regionTrack ( e );
			var start = timeFromEvent ( e );
			var down_x = e.clientX;
			var down_y = e.clientY;
			var active = false;

			if (track) selected_track = track;

			d.addEventListener ('mousemove', move, false);
			d.addEventListener ('mouseup', up, false);

			function move ( ev ) {
				var dx = ev.clientX - down_x;
				var dy = ev.clientY - down_y;
				if (!active) {
					if (Math.abs ( dx ) + Math.abs ( dy ) < 5) return ;
					if (!app.ui.InteractionHandler.checkAndSet ('multitrack-region')) {
						up ( ev );
						return ;
					}
					active = true;
					clearSelectedClip ( true );
				}
				ev.preventDefault ();
				setRegion ( start, timeFromEvent ( ev ) );
			}

			function up ( ev ) {
				d.removeEventListener ('mousemove', move);
				d.removeEventListener ('mouseup', up);
				if (active) {
					app.ui.InteractionHandler.forceUnset ('multitrack-region');
					if (setRegion ( start, timeFromEvent ( ev ) ))
						setCursorTime ( region.start );
					else
						setCursorTime ( start );
				}
				else {
					clearRegion ();
					setCursorTime ( start );
				}
				render ();
			}
		}

		function setCursorTime ( time ) {
			marker = clampTime ( time );
			cursor = marker;
			if (play) {
				stopNodes ();
				play = null;
				schedulePlayback ( true );
			}
			else {
				app.fireEvent ('DidAudioProcess', [cursor, null, w.performance.now ()]);
			}
			updatePlayhead ();
			fireZoom ();
		}

		function SeekTo ( progress ) {
			if (progress > 1) return ;
			setCursorTime ( progress * duration () );
		}

		function Skip ( seconds ) {
			setCursorTime ( (play ? playingCursor () : cursor) + seconds );
		}

		function addFiles ( file_list, track_id, start ) {
			if (!file_list || !file_list.length) return ;
			var files = [];
			for (var i = 0; i < file_list.length; ++i)
				files.push ( file_list[i] );

			var prev = cloneState ();
			var pending = files.length;
			var added = 0;
			app.fireEvent ('WillDownloadFile');

			files.forEach (function ( file, index ) {
				decodeFile ( file, function ( buffer ) {
					clips.push ( makeClip (
						track_id,
						start + (index * 0.1),
						buffer,
						file.name || 'Audio'
					));
					++added;
					render ();
					done ();
				}, done);
			});

			function done () {
				if (--pending > 0) return ;
				app.fireEvent ('DidDownloadFile');
					if (added) {
						pushState ( prev, 'Add Clip' );
						queuePlayRefresh ( true );
						app.fireEvent ('DidUpdateMultitrack');
						OneUp ('Added ' + added + ' clip' + (added === 1 ? '' : 's'));
					}
				else {
					OneUp ('Could not decode audio', 1200);
				}
			}
		}

		function makeClip ( track_id, start, buffer, name ) {
			return {
				id: 'mc' + (clip_uid++),
				track: track_id,
				start: Math.max (0, start || 0),
				in: 0,
				out: buffer.duration,
				name: name || 'Audio',
				buffer: buffer
			};
		}

		function makeSilenceBuffer ( seconds ) {
			var ctx = audioCtx ();
			var wv = app.engine && app.engine.wavesurfer;
			var src = wv && wv.backend && wv.backend.buffer;
			var rate = src ? src.sampleRate : ctx.sampleRate;
			var chans = src ? src.numberOfChannels : 1;

			return ctx.createBuffer (
				chans,
				Math.max (1, (seconds * rate) >> 0),
				rate
			);
		}

		function contentDuration () {
			var dur = 0;
			for (var i = 0; i < clips.length; ++i)
				dur = Math.max (dur, clips[i].start + clipLen ( clips[i] ));
			return dur;
		}

		function mixSample ( buffer, channel, time ) {
			var data = buffer.getChannelData ( Math.min (channel, buffer.numberOfChannels - 1) );
			var pos = time * buffer.sampleRate;
			var idx = pos >> 0;
			var frac = pos - idx;
			var a = data[idx] || 0;
			var b = data[idx + 1] || a;
			return a + ((b - a) * frac);
		}

		function Mixdown ( selection ) {
			if (!clips.length) return null;

			var ctx = audioCtx ();
			var rate = clips[0].buffer.sampleRate || ctx.sampleRate;
			var from = 0;
			var to = contentDuration ();
			if (selection) {
				from = Math.max (0, selection[0] || 0);
				to = Math.max (from, selection[1] || 0);
			}
			if (to <= from) return null;

			var out = ctx.createBuffer (2, Math.max (1, ((to - from) * rate) >> 0), rate);
			var left = out.getChannelData (0);
			var right = out.getChannelData (1);
			var solo = hasSolo ();

			for (var i = 0; i < clips.length; ++i) {
				var clip = clips[i];
				var tr = findTrack ( clip.track );
				var gain = trackGain ( tr, solo );
				var start = Math.max (from, clip.start);
				var end = Math.min (to, clip.start + clipLen ( clip ));
				if (!tr || gain <= 0 || end <= start) continue;

				var off = ((start - from) * rate) >> 0;
				var len = Math.min (left.length - off, ((end - start) * rate) >> 0);
				var src = clipIn ( clip ) + start - clip.start;
				var pan = tr.pan || 0;
				var gl = gain * (pan > 0 ? 1 - pan : 1);
				var gr = gain * (pan < 0 ? 1 + pan : 1);

				for (var j = 0; j < len; ++j) {
					var t = src + (j / rate);
					left[off + j] += mixSample ( clip.buffer, 0, t ) * gl;
					right[off + j] += mixSample (
						clip.buffer,
						clip.buffer.numberOfChannels > 1 ? 1 : 0,
						t
					) * gr;
				}
			}
			return out;
		}

		function addSilence ( offset, seconds ) {
			var track = selected_track || (tracks[0] && tracks[0].id);
			if (!track) return true;
			if (!seconds || seconds < 0) seconds = 1;
			if (offset === undefined) offset = cursor;

			Pause ();
			var prev = cloneState ();
			var clip = makeClip (
				track,
				offset,
				makeSilenceBuffer ( seconds ),
				'Silence'
			);

			clips.push ( clip );
			selected_track = track;
			selected_clip = clip.id;
			clearRegion ();
			setCursorTime ( clip.start );
			pushState ( prev, 'Silence' );
				queuePlayRefresh ( true );
				render ();
				app.fireEvent ('DidUpdateMultitrack');
				app.fireEvent ('DidSelectClip', clip);
				OneUp ('Inserted Silence');
			return true;
		}

		function addURL ( url, name ) {
			fetch ( url ).then (function ( res ) {
				if (!res.ok) throw 1;
				return res.blob ();
			}).then (function ( blob ) {
				blob.name = name ||
					((url.split ('/').pop () || '').split ('?')[0]) ||
					'Audio';
				addFiles ( [ blob ], selected_track || (tracks[0] && tracks[0].id), cursor );
			}).catch (function () {
				OneUp ('Could not load audio', 1200);
			});
		}

		function decodeFile ( file, ok, bad ) {
			var reader = new FileReader ();
			reader.onerror = bad;
			reader.onload = function () {
				var arr = reader.result;
				var ctx = audioCtx ();
				var called = false;
				var done = function ( buffer ) {
					if (called) return ;
					called = true;
					ok ( buffer );
				};
				var fail = function () {
					if (called) return ;
					called = true;
					bad && bad ();
				};

				var ret = ctx.decodeAudioData ( arr.slice (0), done, fail );
				if (ret && ret.then) ret.then (done).catch (fail);
			};
			reader.readAsArrayBuffer ( file );
		}

		function loadClip ( clip ) {
			var buffer = clip.buffer;
			var wv = app.engine.wavesurfer;

			Stop ();
			Toggle ( false );
			editing_clip = clip.id;
			app.engine.is_ready = true;
			wv.loadDecodedBuffer ( buffer );

			if (buffer.numberOfChannels === 1) {
				wv.backend.SetNumberOfChannels (1);
				wv.ActiveChannels = [1];
				wv.SelectedChannelsLen = 1;
				app.el.classList.add ('pk_mono');
			}
			else {
				wv.backend.SetNumberOfChannels (2);
				wv.ActiveChannels = [1, 1];
				wv.SelectedChannelsLen = 2;
				app.el.classList.remove ('pk_mono');
			}

			wv.drawer.params.ActiveChannels = wv.ActiveChannels;
			wv.getWaveEl().style.opacity = '1';
			app.fireEvent ('DidLoadFile');
			app.fireEvent ('DidUpdateLen', wv.getDuration ());
			app.fireEvent ('RequestSeekTo', 0);
			app.fireEvent ('RequestResize');
			wv.drawBuffer ();

			var dirty = d.getElementsByClassName ('pk_tmpMsg');
			if (dirty.length) dirty[0].parentNode.removeChild (dirty[0]);
			OneUp ('Loaded clip in editor', 1000);
		}

		function syncEditingClip () {
			if (!editing_clip || on) return ;
			var clip = findClip ( editing_clip );
			var buffer = app.engine &&
				app.engine.wavesurfer &&
				app.engine.wavesurfer.backend &&
				app.engine.wavesurfer.backend.buffer;

			if (!clip || !buffer) return ;
			clip.buffer = buffer;
			if (clipOut ( clip ) > buffer.duration) clip.out = buffer.duration;
			if (clipIn ( clip ) > clipOut ( clip ) - 0.05)
				clip.in = Math.max (0, clipOut ( clip ) - 0.05);
		}

		function Play ( x ) {
			if (!clips.length) return ;
			if (rec) {
				RecordStop ();
				return ;
			}
			if (play && !x) {
				Stop ();
				return ;
			}
			if (play) {
				cursor = playingCursor ();
				stopNodes ();
				play = null;
			}

			schedulePlayback ( false );
		}

		function schedulePlayback ( silent ) {
			var ctx = audioCtx ();
			var start_ctx = ctx.currentTime;
			var solo = hasSolo ();
			var nodes = [];
			var dur = region && region.loop ? region.end : duration ();
			var analyser = ctx.createAnalyser ();
			var master = ctx.createGain ();
			var meter = new Float32Array (128);
			analyser.fftSize = 256;
			master.connect ( analyser );
			analyser.connect ( ctx.destination );

			for (var i = 0; i < clips.length; ++i) {
				var clip = clips[i];
				var tr = findTrack ( clip.track );
				var clip_len = clipLen ( clip );
				var clip_end = clip.start + clip_len;
				if (!tr || clip_end <= cursor) continue;
				if (region && region.loop && clip.start >= region.end) continue;

				var source = ctx.createBufferSource ();
				var gain = ctx.createGain ();
				var pan = ctx.createStereoPanner ? ctx.createStereoPanner () : null;
				var when = start_ctx + Math.max (0, clip.start - cursor);
				var offset = clipIn ( clip ) + Math.max (0, cursor - clip.start);
				var play_len = Math.max (0.01, clipOut ( clip ) - offset);
				if (region && region.loop)
					play_len = Math.min ( play_len, Math.max (0.01, region.end - Math.max (cursor, clip.start)) );

				source.buffer = clip.buffer;
				gain.gain.value = trackGain ( tr, solo );
				if (pan) {
					pan.pan.value = tr.pan;
					source.connect ( pan );
					pan.connect ( gain );
				}
				else {
					source.connect ( gain );
				}
				gain.connect ( master );
				source.start ( when, offset, play_len );
				nodes.push ({src: source, gain: gain, pan: pan, track: tr.id});
			}

			play = {
				ctx: ctx,
				start: start_ctx,
				cursor: cursor,
				nodes: nodes,
				dur: dur,
				analyser: analyser,
				master: master,
				meter: meter
			};
			if (!silent) app.fireEvent ('DidPlay');
			tick ();
		}

		function playingCursor () {
			return play ? play.cursor + (play.ctx.currentTime - play.start) : cursor;
		}

		function refreshPlayNow () {
			if (!play) return ;
			if (play_sync) {
				w.clearTimeout ( play_sync );
				play_sync = 0;
			}

			cursor = playingCursor ();
			stopNodes ();
			play = null;
			if (clips.length) {
				schedulePlayback ( true );
			}
			else {
				app.fireEvent ('DidAudioProcess', [cursor, null, w.performance.now ()]);
				app.fireEvent ('DidStopPlay');
				updatePlayhead ();
				fireZoom ();
			}
		}

		function queuePlayRefresh ( force ) {
			if (!play) return ;
			if (force) {
				refreshPlayNow ();
				return ;
			}
			if (play_sync) return ;

			play_sync = w.setTimeout (function () {
				play_sync = 0;
				refreshPlayNow ();
			}, 1000);
		}

		function tick () {
			if (!play) return ;
			cursor = playingCursor ();
			if (region && region.loop && cursor >= region.end) {
				setCursorTime ( region.start );
				return ;
			}
			if (cursor >= play.dur) {
				Stop ();
				return ;
			}
			play.analyser.getFloatTimeDomainData ( play.meter );
			var sum = 0;
			for (var i = 0; i < play.meter.length; ++i)
				sum += play.meter[i] * play.meter[i];
			var rms = Math.sqrt (sum / play.meter.length);
			var db = rms > 0.00001 ? 20 * Math.log (rms) / Math.LN10 : -100;
			app.fireEvent ('DidAudioProcess', [cursor, [db, db], w.performance.now ()]);
			updatePlayhead ();
			raf = w.requestAnimationFrame ( tick );
		}

		function Pause () {
			if (rec) {
				RecordStop ();
				return ;
			}
			if (!play) return ;
			cursor = playingCursor ();
			stopNodes ();
			play = null;
			app.fireEvent ('DidAudioProcess', [cursor, null, w.performance.now ()]);
			app.fireEvent ('DidStopPlay');
			updatePlayhead ();
			fireZoom ();
		}

		function Stop () {
			if (rec) {
				RecordStop ();
				return ;
			}
			if (play) {
				stopNodes ();
				play = null;
			}
			if (region) marker = region.start;
			cursor = marker;
			app.fireEvent ('DidAudioProcess', [cursor, null, w.performance.now ()]);
			app.fireEvent ('DidStopPlay');
			updatePlayhead ();
			fireZoom ();
		}

		function stopNodes () {
			if (raf) {
				w.cancelAnimationFrame ( raf );
				raf = 0;
			}
			if (play_sync) {
				w.clearTimeout ( play_sync );
				play_sync = 0;
			}
			if (!play) return ;
			for (var i = 0; i < play.nodes.length; ++i) {
				try { play.nodes[i].src.stop (0); } catch (e) {}
				try { play.nodes[i].src.disconnect (); } catch (e2) {}
				try { play.nodes[i].gain.disconnect (); } catch (e3) {}
				if (play.nodes[i].pan) {
					try { play.nodes[i].pan.disconnect (); } catch (e4) {}
				}
			}
			if (play.master) {
				try { play.master.disconnect (); } catch (e5) {}
			}
			if (play.analyser) {
				try { play.analyser.disconnect (); } catch (e6) {}
			}
		}

		function refreshMix () {
			if (!play) return ;
			var solo = hasSolo ();
			for (var i = 0; i < play.nodes.length; ++i) {
				var node = play.nodes[i];
				var tr = findTrack ( node.track );
				node.gain.gain.value = trackGain ( tr, solo );
				if (node.pan && tr) node.pan.pan.value = tr.pan;
			}
		}

		function updatePlayhead () {
			if (playhead)
				playhead.style.left = ((cursor * px_per_sec) >> 0) + 'px';
			if (marker_el)
				marker_el.style.left = ((marker * px_per_sec) >> 0) + 'px';
		}

		function totalPixels () {
			return Math.max (1, duration () * px_per_sec);
		}

		function GetZoomFactor () {
			if (!main) return 1;
			return Math.max (1, totalPixels () / Math.max (1, main.clientWidth));
		}

		function GetSeekZoomFactor () {
			return Math.max (1, px_per_sec / default_px_per_sec);
		}

		function GetCursorPercent () {
			return cursor / Math.max (0.0001, duration ());
		}

		function leftPercent () {
			if (!main) return 0;
			return (main.scrollLeft / totalPixels ()) * 100;
		}

		function fireZoom () {
			if (!on || !main) return ;
			app.fireEvent ('DidZoom', [
				GetZoomFactor (),
				leftPercent (),
				row_h / default_row_h,
				GetCursorPercent ()
			]);
		}

		function clampScroll () {
			if (!main) return ;
			var max = Math.max (0, totalPixels () - main.clientWidth);
			if (main.scrollLeft < 0) main.scrollLeft = 0;
			else if (main.scrollLeft > max) main.scrollLeft = max;
		}

		function zoomTo ( next_pps, center_time, where ) {
			next_pps = Math.max (12, Math.min (1200, next_pps));
			if (!main) {
				px_per_sec = next_pps;
				return ;
			}
			if (where === undefined) where = 0.5;
			if (center_time === undefined)
				center_time = (main.scrollLeft + main.clientWidth * where) / px_per_sec;

			px_per_sec = next_pps;
			render ();
			main.scrollLeft = (center_time * px_per_sec) - main.clientWidth * where;
			clampScroll ();
			redrawRuler ();
			fireZoom ();
		}

		function ZoomUI ( type, val ) {
			if (type === 0) {
				px_per_sec = default_px_per_sec;
				row_h = default_row_h;
				main.scrollLeft = 0;
				main.scrollTop = 0;
				render ();
				fireZoom ();
				return ;
			}

			if (type === 'h') {
				zoomTo ( px_per_sec * (val < 0 ? 1.25 : 0.8) );
				return ;
			}

			if (type === 'v') {
				row_h = Math.max (44, Math.min (130, row_h * (val < 0 ? 1.15 : 1 / 1.15)));
				render ();
				fireZoom ();
			}
		}

		function Zoom ( diff, mode ) {
			var factor = 1;

			if (mode === -1) {
				factor = 1 + (diff / Math.max (160, main.clientWidth));
				main.scrollLeft += diff;
			}
			else if (mode === 1) {
				factor = 1 - (diff / Math.max (160, main.clientWidth));
			}

			if (factor <= 0.05) factor = 0.05;
			zoomTo ( px_per_sec * factor );
		}

		function Pan ( diff, mode ) {
			if (!main) return ;
			var wave = app.el.getElementsByClassName ('pk_wavescroll')[0];
			var ww = wave ? wave.clientWidth : main.clientWidth;
			if (mode === 2) {
				main.scrollLeft = (diff / Math.max (1, ww)) * totalPixels ();
			}
			else {
				main.scrollLeft += diff * (totalPixels () / Math.max (1, ww));
			}
			clampScroll ();
			redrawRuler ();
			fireZoom ();
		}

		function CenterToCursor () {
			if (!main) return ;
			main.scrollLeft = (cursor * px_per_sec) - (main.clientWidth / 2);
			clampScroll ();
			redrawRuler ();
			fireZoom ();
		}

		function RecordToggle () {
			if (rec) RecordStop ();
			else RecordStart ();
		}

		function RecordStart () {
			if (rec) return ;
			var tr = activeTrack ();
			if (!tr) {
				OneUp ('Arm a channel to record', 1200);
				return ;
			}

			Pause ();
			var ctx = audioCtx ();
			var size = 4096;
			var buffers = [];
			var stream = null;
			var source = null;
			var node = null;
			var skip = 8;

			navigator.mediaDevices.getUserMedia ({audio:true, video:false}).then (function ( s ) {
				stream = s;
				source = ctx.createMediaStreamSource ( stream );
				node = ctx.createScriptProcessor ( size, 1, 1 );
				source.connect ( node );
				node.connect ( ctx.destination );
				node.onaudioprocess = function ( ev ) {
					if (skip > 0) {
						--skip;
						return ;
					}
					buffers.push ( ev.inputBuffer.getChannelData (0).slice (0) );
				};

				rec = {
					ctx: ctx,
					track: tr.id,
					size: size,
					buffers: buffers,
					stream: stream,
					source: source,
					node: node,
					start: cursor
				};
				app.fireEvent ('DidActionRecordStart');
				OneUp ('Recording ' + tr.name, 1000);
			}).catch (function () {
				OneUp ('No recording device found', 1200);
			});
		}

		function RecordStop () {
			if (!rec) return ;
			var r = rec;
			rec = null;

			if (r.node) {
				r.node.onaudioprocess = null;
				try { r.node.disconnect (); } catch (e) {}
			}
			if (r.source) {
				try { r.source.disconnect (); } catch (e2) {}
			}
			if (r.stream) {
				r.stream.getTracks ().forEach (function ( stream ) {
					stream.stop ();
				});
			}

			app.fireEvent ('DidActionRecordStop', !!r.buffers.length);
			if (!r.buffers.length) return ;

			var prev = cloneState ();
			var len = r.buffers.length * r.size;
			var buffer = r.ctx.createBuffer (1, len, r.ctx.sampleRate);
			var chan = buffer.getChannelData (0);
			for (var i = 0, off = 0; i < r.buffers.length; ++i) {
				chan.set ( r.buffers[i], off );
				off += r.buffers[i].length;
			}

				clips.push ( makeClip ( r.track, r.start, buffer, 'Recording' ) );
				pushState ( prev, 'Record Clip' );
				render ();
				app.fireEvent ('DidUpdateMultitrack');
				OneUp ('Recorded clip', 1000);
		}

		function deleteSelectedClip () {
			if (!selected_clip) return false;
			var removed = false;
			var prev = cloneState ();
			for (var i = clips.length - 1; i >= 0; --i) {
				if (clips[i].id === selected_clip) {
					clips.splice (i, 1);
					removed = true;
					break;
				}
			}
			if (!removed) return false;
			if (editing_clip === selected_clip) editing_clip = null;
			selected_clip = null;
			app.fireEvent ('DidDeselectClip');
				pushState ( prev, 'Delete Clip' );
				queuePlayRefresh ( true );
				render ();
				app.fireEvent ('DidUpdateMultitrack');
				return true;
		}

		function splitSelectedClip () {
			if (!selected_clip) return false;

			var clip = findClip ( selected_clip );
			if (!clip) return false;

			var at = play ? playingCursor () : marker;
			var rel = at - clip.start;
			var len = clipLen ( clip );

			if (rel <= 0.005 || rel >= len - 0.005) {
				OneUp ('Move cursor inside selected clip', 1200);
				return false;
			}

			var prev = cloneState ();
			var split = clipIn ( clip ) + rel;
			var right = {
				id: 'mc' + (clip_uid++),
				track: clip.track,
				start: at,
				in: split,
				out: clipOut ( clip ),
				name: clip.name,
				buffer: clip.buffer
			};

			clip.out = split;
			clips.splice (clips.indexOf ( clip ) + 1, 0, right);
			selected_clip = right.id;
			selected_track = right.track;
			pushState ( prev, 'Split Clip' );
			queuePlayRefresh ( true );
			render ();
			app.fireEvent ('DidSelectClip', right);
			OneUp ('Split Clip', 900);
			return true;
		}

		q.IsOn = IsOn;
		q.IsRecording = function () { return !!rec; };
		q.IsPlaying = function () { return !!play; };
		q.Play = Play;
		q.Pause = Pause;
		q.Stop = Stop;
		q.ZoomUI = ZoomUI;
		q.Zoom = Zoom;
		q.Pan = Pan;
		q.GetZoomFactor = GetZoomFactor;
		q.GetSeekZoomFactor = GetSeekZoomFactor;
		q.GetCursor = function () { return cursor; };
		q.GetMarker = function () { return marker; };
		q.GetCursorPercent = GetCursorPercent;
		q.GetDuration = duration;
		q.GetRegion = function () { return region; };
		q.HasClips = function () { return !!clips.length; };
		q.Mixdown = Mixdown;
		q.RecordToggle = RecordToggle;
		q.RecordStart = RecordStart;
		q.RecordStop = RecordStop;
		q.Propagate = function ( id, arg1, arg2 ) {
			if (!IsOn () && id !== 'RequestActionRecordStop') return false;

			if (id === 'RequestTransportToggle') {
				if (arg1 === 'pause') {
					if (play) Pause ();
					else Play ();
				}
				else {
					if (play) Stop ();
					else Play ();
				}
				return true;
			}
			if (id === 'RequestStop') {
				Stop ();
				return true;
			}
			if (id === 'RequestPlay') {
				Play ( arg1 );
				return true;
			}
			if (id === 'RequestPause') {
				Pause ();
				return true;
			}
			if (id === 'RequestSeekTo') {
				SeekTo ( arg1 );
				return true;
			}
			if (id === 'RequestSkipBack') {
				Skip ( -(arg1 || 0) );
				return true;
			}
			if (id === 'RequestSkipFront') {
				Skip ( arg1 || 0 );
				return true;
			}
			if (id === 'RequestZoom') {
				Zoom ( arg1, arg2 );
				return true;
			}
			if (id === 'RequestPan') {
				Pan ( arg1, arg2 );
				return true;
			}
			if (id === 'RequestViewCenterToCursor') {
				CenterToCursor ();
				return true;
			}
			if (id === 'RequestLoadPickedFiles') {
				var track = selected_track || (tracks[0] && tracks[0].id);
				if (track) addFiles ( arg1, track, cursor );
				return true;
			}
			if (id === 'RequestLoadSampleFile') {
				addURL ( 'test.mp3', 'Sample File' );
				return true;
			}
			if (id === 'RequestLoadURL') {
				addURL ( arg1 );
				return true;
			}
			if (id === 'RequestZoomUI') {
				ZoomUI ( arg1, arg2 );
				return true;
			}
			if (id === 'RequestSelect') {
				clearSelectedClip ( true );
				setRegion ( 0, duration () );
				setCursorTime ( 0 );
				return true;
			}
			if (id === 'RequestRegionSet') {
				if (arg1 === undefined)
					arg1 = main.scrollLeft / px_per_sec;
				if (arg2 === undefined)
					arg2 = (main.scrollLeft + main.clientWidth) / px_per_sec;
				clearSelectedClip ( true );
				setRegion ( arg1, arg2 );
				return true;
			}
			if (id === 'RequestSetLoop') {
				if (!region) setRegion (0.01, duration () - 0.01);
				region.loop = !region.loop;
				app.fireEvent ('DidSetLoop', region.loop);
				if (region.loop) setCursorTime ( region.start );
				return true;
			}
			if (id === 'RequestDeselect' || id === 'RequestRegionClear') {
				var cleared_region = clearRegion ();
				clearSelectedClip ( cleared_region );
				return true;
			}
			if (id === 'RequestActionCopy' || id === 'RequestActionPaste') {
				return true;
			}
			if (id === 'RequestActionSilence') {
				return addSilence ( arg1, arg2 );
			}
			if (id === 'RequestActionCut') {
				if (/INPUT|TEXTAREA|SELECT/.test ((d.activeElement && d.activeElement.tagName) || ''))
					return true;
				if (arg1) {
					splitSelectedClip ();
					return true;
				}
				if (region) return true;
				deleteSelectedClip ();
				return true;
			}
			if (id === 'RequestActionRecordToggle') {
				RecordToggle ();
				return true;
			}
			if (id === 'RequestActionRecordStart') {
				RecordStart ();
				return true;
			}
			if (id === 'RequestActionRecordStop' && rec) {
				RecordStop ();
				return true;
			}

			return false;
		};

		app.listenFor ('StateDidPop', function ( state, undo ) {
			if (state.type !== 'multitrack') return ;
			restoreState ( state.mt );
			if (undo) OneUp ('Undo ' + state.desc);
			else OneUp ('Redo ' + state.desc);
		});
		app.listenFor ('DidUpdateLen', syncEditingClip);
		app.listenFor ('DidUnloadFile', function () {
			if (!on) editing_clip = null;
		});

		tracks.push ( makeTrack ('Channel 1') );
		tracks.push ( makeTrack ('Channel 2') );
		selected_track = tracks[0].id;
		build ();
	}

	PKAE._deps.multitrack = PKMultitrack;
})( window, document, PKAudioEditor );
