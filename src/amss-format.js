(function ( w, d, PKAE ) {
	'use strict';

	function AMSSFormat ( app ) {
		var q = this;
		var enc = new TextEncoder ();
		var dec = new TextDecoder ();

		function nameOf ( name ) {
			name = (name || 'audiomass-session').trim ();
			return /\.amss$/i.test ( name ) ? name : name + '.amss';
		}

		function isFile ( file ) {
			return !!(file && /\.amss$/i.test (file.name || ''));
		}

		function ctx () {
			return app.engine.wavesurfer.backend.ac;
		}

		function pairKey ( a, b ) {
			return a < b ? a + ':' + b : b + ':' + a;
		}

		function writer () {
			var a = [];
			var tmp = new ArrayBuffer (4);
			var dv = new DataView ( tmp );
			var tb = new Uint8Array ( tmp );
			function u8 ( n ) { a.push ( n & 255 ); }
			function u16 ( n ) { u8 ( n ); u8 ( n >> 8 ); }
			function f32 ( n ) {
				dv.setFloat32 (0, n || 0, true);
				a.push (tb[0], tb[1], tb[2], tb[3]);
			}
			function str ( s ) {
				var b = enc.encode ( s || '' );
				var l = Math.min (255, b.length);
				u8 ( l );
				for (var i = 0; i < l; ++i) u8 ( b[i] );
			}
			return {a:a, u8:u8, u16:u16, f32:f32, str:str};
		}

		q.IsBuffer = function ( buf ) {
			if (!buf || buf.byteLength < 4) return false;
			var u = new Uint8Array ( buf, 0, 4 );
			return u[0] > 0 && u[1] === 65 && u[2] === 77 && u[3] === 83;
		};

		q.ReadFile = function ( file, cb ) {
			if (!isFile ( file )) return false;
			var r = new FileReader ();
			r.onload = function () { cb ( r.result, file.name ); };
			r.onerror = function () { cb ( null, file.name ); };
			r.readAsArrayBuffer ( file );
			return true;
		};

		q.ExportMultitrack = function ( name, st ) {
			var wtr = writer ();
			var parts = [];
			var audio = [];
			var track_map = {};
			var clip_map = {};
			var xf = [];
			var tracks = st.tracks || [];
			var clips = st.clips || [];
			var xfs = st.xfades || {};

			function audioIndex ( buffer, name ) {
				for (var i = 0; i < audio.length; ++i)
					if (audio[i].buffer === buffer) return i;
				audio.push ({buffer:buffer, name:name || 'Audio'});
				return audio.length - 1;
			}

			for (var i = 0; i < tracks.length; ++i)
				track_map[tracks[i].id] = i;
			for (i = 0; i < clips.length; ++i) {
				if (!clips[i].buffer || track_map[clips[i].track] === undefined)
					return false;
				clip_map[clips[i].id] = i;
				audioIndex ( clips[i].buffer, clips[i].name );
			}
			for (var k in xfs) {
				var ids = k.split ( ':' );
				if (clip_map[ids[0]] !== undefined && clip_map[ids[1]] !== undefined)
					xf.push ([clip_map[ids[0]], clip_map[ids[1]]]);
			}
			if (tracks.length > 65534 || clips.length > 65534 ||
				audio.length > 65534 || xf.length > 65534)
				return false;

			wtr.u8 (1); wtr.u8 (65); wtr.u8 (77); wtr.u8 (83);
			wtr.u8 (0);
			wtr.u16 (tracks.length);
			wtr.u16 (clips.length);
			wtr.u16 (audio.length);
			wtr.u16 (xf.length);
			wtr.u16 (st.selected_track && track_map[st.selected_track] !== undefined ? track_map[st.selected_track] : 65535);
			wtr.u16 (st.selected_clip && clip_map[st.selected_clip] !== undefined ? clip_map[st.selected_clip] : 65535);
			wtr.f32 (st.cursor);
			wtr.f32 (st.marker);
			wtr.f32 (st.px_per_sec);
			wtr.f32 (st.row_h);
			wtr.f32 (st.master_vol);

			for (i = 0; i < tracks.length; ++i) {
				var t = tracks[i];
				wtr.u8 ((t.mute ? 1 : 0) | (t.solo ? 2 : 0) | (t.rec ? 4 : 0));
				wtr.f32 (t.vol === undefined ? 1 : t.vol);
				wtr.f32 (t.pan || 0);
				wtr.f32 (t.h || 1);
				wtr.str (t.name);
			}
			for (i = 0; i < audio.length; ++i) {
				var b = audio[i].buffer;
				wtr.u8 (b.numberOfChannels);
				wtr.u16 (b.sampleRate & 65535);
				wtr.u16 (b.sampleRate / 65536);
				wtr.u16 (b.length & 65535);
				wtr.u16 (b.length / 65536);
				wtr.str (audio[i].name);
			}
			for (i = 0; i < clips.length; ++i) {
				var c = clips[i];
				wtr.u16 (track_map[c.track]);
				wtr.u16 (audioIndex (c.buffer, c.name));
				wtr.f32 (c.start);
				wtr.f32 (c.in || 0);
				wtr.f32 (c.out);
				wtr.f32 (c.fi || 0);
				wtr.f32 (c.fo || 0);
				wtr.str (c.name);
			}
			for (i = 0; i < xf.length; ++i) {
				wtr.u16 (xf[i][0]);
				wtr.u16 (xf[i][1]);
			}
			while (wtr.a.length & 3) wtr.u8 (0);

			parts.push (new Uint8Array (wtr.a));
			for (i = 0; i < audio.length; ++i) {
				b = audio[i].buffer;
				for (var ch = 0; ch < b.numberOfChannels; ++ch)
					parts.push (b.getChannelData ( ch ));
			}
			var meta = new ArrayBuffer (8);
			var mu = new Uint8Array ( meta );
			var md = new DataView ( meta );
			mu[0] = 66; mu[1] = 80; mu[2] = 77;
			md.setFloat32 (4, st.beat_bpm > 0 ? st.beat_bpm : 120, true);
			parts.push ( meta );
			meta = new ArrayBuffer (8);
			mu = new Uint8Array ( meta );
			var sig = (st.beat_sig || '4/4').split ('/');
			mu[0] = 83; mu[1] = 73; mu[2] = 71;
			mu[4] = sig[0] / 1 || 4;
			mu[5] = sig[1] / 1 || 4;
			parts.push ( meta );
			if (st.markers && st.markers.length) {
				var mb = enc.encode (JSON.stringify (st.markers));
				meta = new ArrayBuffer (8);
				mu = new Uint8Array ( meta );
				md = new DataView ( meta );
				mu[0] = 77; mu[1] = 82; mu[2] = 75;
				md.setUint32 (4, mb.length, true);
				parts.push ( meta );
				parts.push ( mb );
				if (mb.length & 3) parts.push (new Uint8Array (4 - (mb.length & 3)));
			}

			var blob = new Blob (parts, {type:'application/x-audiomass-session'});
			var url = (w.URL || w.webkitURL).createObjectURL ( blob );
			var a = d.createElement ('a');
			a.href = url;
			a.download = nameOf ( name );
			a.style.display = 'none';
			d.body.appendChild ( a );
			a.click ();
			setTimeout (function () {
				(w.URL || w.webkitURL).revokeObjectURL ( url );
				a.parentNode && a.parentNode.removeChild ( a );
			}, 0);
			return true;
		};

		q.DecodeMultitrack = function ( buf ) {
			if (!q.IsBuffer ( buf )) return null;
			try {

			var dv = new DataView ( buf );
			var o = 4;
			function u8 () { return dv.getUint8 ( o++ ); }
			function u16 () { var v = dv.getUint16 ( o, true ); o += 2; return v; }
			function f32 () { var v = dv.getFloat32 ( o, true ); o += 4; return v; }
			function str () {
				var l = u8 ();
				var s = dec.decode (new Uint8Array (buf, o, l));
				o += l;
				return s;
			}
			function none ( v ) { return v === 65535 ? null : v; }

			if (dv.getUint8 (0) !== 1) return null;
			u8 ();
			var nt = u16 ();
			var nc = u16 ();
			var na = u16 ();
			var nx = u16 ();
			var sel_t = none ( u16 () );
			var sel_c = none ( u16 () );
			var st = {
				track_uid: nt + 1,
				clip_uid: nc + 1,
				cursor: f32 (),
				marker: f32 (),
				px_per_sec: f32 (),
				row_h: f32 (),
				master_vol: f32 (),
				beat_bpm: 120,
				beat_sig: '4/4',
				markers: [],
				xfades: {},
				tracks: [],
				clips: []
			};

			for (var i = 0; i < nt; ++i) {
				var fl = u8 ();
				st.tracks.push ({
					id: 'mt' + (i + 1),
					mute: !!(fl & 1),
					solo: !!(fl & 2),
					rec: !!(fl & 4),
					vol: f32 (),
					pan: f32 (),
					h: f32 (),
					name: str ()
				});
			}

			var audio = [];
			for (i = 0; i < na; ++i)
				audio.push ({
					ch: u8 (),
					rate: u16 () + u16 () * 65536,
					len: u16 () + u16 () * 65536,
					name: str ()
				});

			var raw_clips = [];
			for (i = 0; i < nc; ++i)
				raw_clips.push ({
					track: u16 (),
					audio: u16 (),
					start: f32 (),
					inp: f32 (),
					out: f32 (),
					fi: f32 (),
					fo: f32 (),
					name: str ()
				});

			var raw_xf = [];
			for (i = 0; i < nx; ++i)
				raw_xf.push ([u16 (), u16 ()]);

			var need = (o + 3) & ~3;
			for (i = 0; i < audio.length; ++i) {
				var ai = audio[i];
				if (!ai.ch || ai.ch > 32 || !ai.rate || !ai.len) return null;
				need += ai.ch * ai.len * 4;
			}
			if (need > buf.byteLength) return null;

			o = (o + 3) & ~3;
			for (i = 0; i < audio.length; ++i) {
				ai = audio[i];
				ai.buffer = ctx ().createBuffer (ai.ch, ai.len, ai.rate);
				for (var ch = 0; ch < ai.ch; ++ch) {
					ai.buffer.getChannelData (ch).set (new Float32Array (buf, o, ai.len));
					o += ai.len * 4;
				}
			}
			while (buf.byteLength >= o + 8) {
				var mu = new Uint8Array (buf, o, 4);
				if (mu[0] === 66 && mu[1] === 80 && mu[2] === 77 && mu[3] === 0)
					st.beat_bpm = dv.getFloat32 (o + 4, true) || 120;
				else if (mu[0] === 83 && mu[1] === 73 && mu[2] === 71 && mu[3] === 0)
					st.beat_sig = (dv.getUint8 (o + 4) || 4) + '/' + (dv.getUint8 (o + 5) || 4);
				else if (mu[0] === 77 && mu[1] === 82 && mu[2] === 75 && mu[3] === 0) {
					var ml = dv.getUint32 (o + 4, true);
					if (ml > 65536 || o + 8 + ml > buf.byteLength) break;
					try {
						var parsed_markers = JSON.parse (dec.decode (new Uint8Array (buf, o + 8, ml)));
						st.markers = parsed_markers && parsed_markers.length ? parsed_markers : [];
					}
					catch (e) {
						st.markers = [];
					}
					o += 8 + ml;
					o = (o + 3) & ~3;
					continue;
				}
				o += 8;
			}
			for (i = 0; i < raw_clips.length; ++i) {
				var rc = raw_clips[i];
				if (!st.tracks[rc.track] || !audio[rc.audio]) return null;
				st.clips.push ({
					id: 'mc' + (i + 1),
					track: st.tracks[rc.track].id,
					start: rc.start,
					in: rc.inp,
					out: rc.out,
					fi: rc.fi || 0,
					fo: rc.fo || 0,
					name: rc.name || audio[rc.audio].name,
					buffer: audio[rc.audio].buffer
				});
			}
			for (i = 0; i < raw_xf.length; ++i)
				st.xfades[pairKey ('mc' + (raw_xf[i][0] + 1), 'mc' + (raw_xf[i][1] + 1))] = 1;

			st.selected_track = sel_t === null || !st.tracks[sel_t] ?
				(st.tracks[0] && st.tracks[0].id) :
				st.tracks[sel_t].id;
			st.selected_clip = sel_c === null || !st.clips[sel_c] ? null : st.clips[sel_c].id;
			return st;
			} catch (e) { return null; }
		};
	}

	PKAE._deps.amss = AMSSFormat;
})( window, document, PKAudioEditor );
