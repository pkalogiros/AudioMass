(function ( w, d, PKAE ) {
	'use strict';

	function PKMrk ( app ) {
		var q = this, max = 11, raf = 0;
		var cols = ['#9dff6a', '#5af2ff', '#f557d2', '#ffd15c', '#ff8c35', '#b9c6ff'];
		var ed = mk (), mt = mk ();

		function mk () { return {l:[], u:1, a:null, v:null, off:null, s:1}; }
		function mtOn () { var m = app.multitrack; return !!(m && m.IsOn && m.IsOn ()); }
		function cx ( n ) { return n === 'mt' ? mt : n === 'ed' ? ed : mtOn () ? mt : ed; }
		function nm ( s ) { s = (s || '').replace (/[\r\n\t]/g, ' ').trim (); return s ? s.substr (0, max) : ''; }
		function color ( s ) { return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test (s || '') ? s : 0; }
		function redraw () { if (!raf) raf = w.requestAnimationFrame (function () { raf = 0; q.draw (); }); }
		function emit ( c, id ) {
			if (id) c.a = id;
			redraw ();
		}
		function dur ( c ) {
			if (c === mt) {
				var m = app.multitrack;
				return m && m.GetDuration ? m.GetDuration () || 0 : 0;
			}
			var ws = app.engine && app.engine.wavesurfer;
			return ws && ws.getDuration ? ws.getDuration () || 0 : 0;
		}
		function can ( c ) {
			var m = app.multitrack;
			return c === mt ? !!(m && m.HasClips && m.HasClips ()) : dur (c) > 0;
		}
		function at ( c, t ) {
			var durr = dur ( c );
			t = isFinite (t) ? +t : 0;
			return t < 0 ? 0 : durr > 0 && t > durr ? durr : t;
		}
		function now ( c ) {
			if (c === mt) {
				var m = app.multitrack;
				return m && m.GetCursor ? m.GetCursor () || 0 : 0;
			}
			var ws = app.engine && app.engine.wavesurfer;
			return ws && ws.getDuration ? (ws.ActiveMarker || 0) * (ws.getDuration () || 0) : 0;
		}
		function seek ( c, t ) {
			var durr = dur ( c );
			app.fireEvent ('RequestSeekTo', durr > 0 ? at (c, t) / durr : 0);
		}
		function playing ( c ) {
			var m = app.multitrack, ws = app.engine && app.engine.wavesurfer;
			return c === mt ? !!(m && m.IsPlaying && m.IsPlaying ()) : !!(ws && ws.isPlaying && ws.isPlaying ());
		}
		function sort ( c ) {
			c.l.sort (function ( a, b ) { return a.time === b.time ? (a.id > b.id ? 1 : -1) : a.time - b.time; });
		}
		function ix ( c, id ) {
			for (var i = 0; i < c.l.length; ++i)
				if (c.l[i].id === id) return i;
			return -1;
		}
		function ser ( c ) {
			for (var a = [], i = 0, m; i < c.l.length; ++i) {
				m = c.l[i];
				a[i] = {id:m.id, time:m.time, name:m.name, color:m.color, loop:!!m.loop};
			}
			return a;
		}
		function hist ( c, prev, desc ) {
			app.fireEvent ('StateRequestPush', {type:'mrk', ctx:c === mt ? 'mt' : 'ed', desc:desc, markers:prev});
		}
		function make ( c, o ) {
			o = o || {};
			var a = at (c, o.time), id, n;
			id = o.id || ('m' + c.u++);
			n = ((id || '').match (/^m(\d+)$/) || 0)[1] / 1;
			if (n >= c.u) c.u = n + 1;
			return {
				id:id,
				time:a,
				name:nm (o.name) || nm ('Marker ' + id.substr (1)),
				color:color (o.color) || cols[(c.u - 2) % cols.length],
				loop:!!o.loop
			};
		}
		function load ( c, a, h ) {
			var old = ser ( c );
			c.l = [];
			c.u = 1;
			for (var i = 0; a && i < a.length; ++i) c.l[i] = make (c, a[i]);
			if (h !== false) hist (c, old, 'Load Markers');
			sort ( c );
			c.a = c.l[0] ? c.l[0].id : null;
			emit ( c );
		}
		function clear ( c, h ) {
			if (!c.l.length) return false;
			if (h !== false) hist (c, ser (c), 'Clear Markers');
			c.l = [];
			c.u = 1;
			c.a = null;
			emit ( c );
			return true;
		}
		function add ( c, o, h ) {
			if (!can (c)) return false;
			var old = ser ( c ), m = make (c, o);
			if (h !== false) hist (c, old, 'Add Marker');
			c.l[c.l.length] = m;
			sort ( c );
			emit (c, m.id);
			return m;
		}
		function rem ( c, id, h ) {
			var i = ix (c, id);
			if (i < 0) return false;
			if (h !== false) hist (c, ser (c), 'Delete Marker');
			c.l.splice (i, 1);
			c.a = c.l[0] ? c.l[0].id : null;
			emit ( c );
			return true;
		}
		function ren ( c, id, name, h ) {
			var i = ix (c, id);
			if (i < 0) return false;
			name = nm ( name );
			if (!name || c.l[i].name === name) return false;
			if (h !== false) hist (c, ser (c), 'Rename Marker');
			c.l[i].name = name;
			emit (c, id);
			return true;
		}
		function jump ( c, dir, sel ) {
			if (!c.l.length) return ;
			for (var t = now (c), m = null, i = dir < 0 ? c.l.length - 1 : 0; dir < 0 ? i >= 0 : i < c.l.length; i += dir)
				if (dir < 0 ? c.l[i].time < t - 0.001 : c.l[i].time > t + 0.001) { m = c.l[i]; break; }
			if (!m) m = dir < 0 ? c.l[c.l.length - 1] : c.l[0];
			if (sel) app.fireEvent ('RequestRegionSet', Math.min (t, m.time), Math.max (t, m.time));
			else { emit (c, m.id); seek (c, m.time); }
		}
		function drop ( o ) {
			var c = cx ();
			o = o || {};
			if (o.time !== undefined) return add (c, o);
			add (c, {time:now (c), name:o.name, color:o.color});
		}
		function renameUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_ren';
			if (i < 0) return ;
			new PKSimpleModal ({
				title:'Rename Marker',
				clss:'pk_fnt10',
				ondestroy:function () {
					app.ui.InteractionHandler.forceUnset (mid);
					app.ui.KeyHandler.removeCallback (mid + 'esc');
					app.ui.KeyHandler.removeCallback (mid + 'en');
				},
				buttons:[{title:'Save', clss:'pk_modal_a_accpt', callback:function ( m ) {
					var v = nm (m.el_body.getElementsByTagName ('input')[0].value);
					if (v) { ren (c, id, v); m.Destroy (); }
					else OneUp ('Name is too short...', 1200);
				}}],
				body:'<label for="k_mrkr">Marker Name</label><input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' + max + '" class="pk_txt" type="text" id="k_mrkr" />',
				setup:function ( m ) {
					app.ui.InteractionHandler.forceSet (mid);
					app.ui.KeyHandler.addCallback (mid + 'esc', function () { if (app.ui.InteractionHandler.check (mid)) m.Destroy (); }, [27]);
					app.ui.KeyHandler.addCallback (mid + 'en', function () { if (app.ui.InteractionHandler.check (mid)) m.els.bottom[0].click (); }, [13]);
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = c.l[i].name;
						inp.focus ();
						inp.selectionStart = inp.selectionEnd = inp.value.length;
					}, 20);
				}
			}).Show ();
		}
		function view ( c, o ) {
			var layer, nodes = {}, menu, rmenu, td, hs;
			function host () { return o.h (); }
			function stop ( e ) { e.preventDefault (); e.stopImmediatePropagation ? e.stopImmediatePropagation () : e.stopPropagation (); }
			function hit ( e, m ) { return e.clientY - m.r.top <= 24; }
			function node ( t ) {
				while (t && t !== host ()) {
					if (t.classList && t.classList.contains ('pk_mrkr')) return t;
					t = t.parentNode;
				}
			}
			function ensure ( p ) {
				if (layer && layer.parentNode === p) return layer;
				layer = d.createElement ('div');
				layer.className = 'pk_mrkrl';
				p.appendChild ( layer );
				nodes = {};
				return layer;
			}
			function mkNode ( id ) {
				var n = d.createElement ('div'), b = d.createElement ('b');
				n.className = 'pk_mrkr';
				n.setAttribute ('data-id', id);
				n.lbl = b;
				n.appendChild ( b );
				layer.appendChild ( n );
				return nodes[id] = n;
			}
			function paint () {
				var p = o.p (), mtr, h, stamp, i, m, n, cls, x, tr, id, lim;
				if (!p) return ;
				ensure ( p );
				if (o.v && !o.v ()) {
					if (layer._d !== 'none') { layer.style.display = 'none'; layer._d = 'none'; }
					return ;
				}
				if (layer._d) { layer.style.display = ''; layer._d = ''; }
				mtr = o.m ();
				lim = p.scrollWidth || p.clientWidth || 0;
				h = (Math.max (1, o.lh () - 24) >> 0) + 'px';
				if (layer._h !== h) { layer.style.setProperty ('--m', h); layer._h = h; }
				stamp = ++c.s;
				for (i = 0; i < c.l.length; ++i) {
					m = c.l[i]; n = nodes[m.id] || mkNode (m.id); x = mtr.x (m.time) >> 0;
					if (lim && x >= lim) x = lim - 1;
					tr = 'translate3d(' + x + 'px,0,0)';
					cls = 'pk_mrkr' + (m.id === c.a ? ' pk_act' : '');
					n._s = stamp;
					if (n._c !== cls) { n.className = cls; n._c = cls; }
					if (n._n !== m.name) { n.lbl.textContent = m.name; n._n = m.name; }
					if (n._o !== m.color) { n.style.color = m.color; n._o = m.color; }
					if (n._t !== tr) { n.style.transform = tr; n._t = tr; }
				}
				for (id in nodes)
					if (nodes[id]._s !== stamp) { nodes[id].parentNode && nodes[id].parentNode.removeChild (nodes[id]); delete nodes[id]; }
			}
			function openMenu ( e, id ) {
				if (!app._deps.ContextMenu) return false;
				if (!menu) {
					menu = new app._deps.ContextMenu (d.createElement ('div'));
					menu.addOption ('Rename Marker', function () { renameUi (menu.c, menu.id); }, false);
					menu.addOption ('Delete Marker', function () { rem (menu.c, menu.id); }, false);
					menu.addOption ('Play From Here', function () {
						var i = ix (menu.c, menu.id);
						if (i >= 0) { seek (menu.c, menu.c.l[i].time); if (!playing (menu.c)) app.fireEvent ('RequestPlay'); }
					}, false);
				}
				menu.c = c; menu.id = id; menu.open ( e );
				return true;
			}
			function openRulerMenu ( e, t ) {
				if (!app._deps.ContextMenu || !can (c)) return false;
				if (!rmenu) {
					rmenu = new app._deps.ContextMenu (d.createElement ('div'));
					rmenu.addOption ('Add Marker Here', function () { add (rmenu.c, {time:rmenu.t}); }, false);
				}
				rmenu.c = c; rmenu.t = t; rmenu.open ( e );
				return true;
			}
			function markerDown ( e, n ) {
				var id = n.getAttribute ('data-id'), i = ix (c, id), m, start, old, sx, moved = false;
				if (i < 0) return ;
				stop ( e );
				emit (c, id);
				if (e.button === 2 || e.which === 3) return openMenu (e, id);
				if (e.altKey) return renameUi (c, id);
				if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ('marker')) return ;
				m = c.l[i]; start = m.time; old = ser ( c ); sx = e.clientX;
				function move ( ev ) {
					var t = o.m ().t (ev.clientX);
					if (Math.abs (ev.clientX - sx) > 2 || Math.abs (t - start) > 0.001) moved = true;
					m.time = t; emit (c, id);
					ev.preventDefault ();
				}
				function up ( ev ) {
					d.removeEventListener ('mousemove', move);
					d.removeEventListener ('mouseup', up);
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset ('marker');
					if (moved) { sort ( c ); hist (c, old, 'Move Marker'); emit (c, id); }
					else seek (c, start);
					ev && ev.preventDefault ();
				}
				d.addEventListener ('mousemove', move, false);
				d.addEventListener ('mouseup', up, false);
			}
			function down ( e ) {
				var n = node (e.target), m;
				if (n) return markerDown (e, n);
				m = o.m ();
				if (!hit (e, m)) return ;
				if (e.button === 2 || e.which === 3) { stop ( e ); openRulerMenu (e, m.t (e.clientX)); return ; }
				if ((e.button !== undefined && e.button !== 0) || (e.which && e.which !== 1)) return ;
				td = {x:e.clientX, y:e.clientY};
			}
			function click ( e ) {
				var n = node (e.target), m;
				if (n) return stop ( e );
				m = o.m ();
				if (!hit (e, m)) return ;
				stop ( e );
				if (e.detail > 1) return add (c, {time:m.t (e.clientX)});
				if (!td || Math.abs (e.clientX - td.x) + Math.abs (e.clientY - td.y) < 4) seek (c, m.t (e.clientX));
				td = null;
			}
			if (c.off) c.off ();
			hs = host ();
			hs.addEventListener ('mousedown', down, true);
			hs.addEventListener ('click', click, true);
			c.off = function () {
				hs.removeEventListener ('mousedown', down, true);
				hs.removeEventListener ('click', click, true);
				if (layer && layer.parentNode) layer.parentNode.removeChild (layer);
				if (menu) menu.destroy ();
				if (rmenu) rmenu.destroy ();
			};
			c.v = paint;
			paint ();
		}
		q.edge = function ( dir ) {
			var c = cx (), t = now ( c ), m = null, i;
			if (!c.l.length) return false;
			for (i = dir < 0 ? c.l.length - 1 : 0; dir < 0 ? i >= 0 : i < c.l.length; i += dir)
				if (dir < 0 ? c.l[i].time < t - 0.004 : c.l[i].time > t + 0.004) { m = c.l[i]; break; }
			if (!m) return false;
			emit (c, m.id);
			seek (c, m.time);
			return true;
		};
		q.ser = function ( n ) { return ser (cx (n)); };
		q.serEd = function () { return ser (ed); };
		q.serMt = function () { return ser (mt); };
		q.loadEd = function ( a, h ) { load (ed, a, h); };
		q.loadMt = function ( a, h ) { load (mt, a, h); };
		q.clearEd = function ( h ) { return clear (ed, h); };
		q.wave = function ( ws, wave ) {
			if (!ws || !wave) return ;
			view (ed, {
				h:function () { return wave; },
				p:function () { return wave; },
				lh:function () { return wave.clientHeight || 24; },
				m:function () {
					var r = wave.getBoundingClientRect (), durr = ws.getDuration ? ws.getDuration () || 0 : 0;
					var vis = ws.VisibleDuration || durr || 1, left = ws.LeftProgress || 0, scale = r.width / Math.max (0.0001, vis);
					return {r:r, x:function ( t ) { return (t - left) * scale; }, t:function ( x ) { return at (ed, left + (x - r.left) / scale); }};
				}
			});
		};
		q.mt = function ( main, ruler, px, vis ) {
			if (!main || !ruler || !px) return ;
			view (mt, {
				h:function () { return ruler; },
				p:function () { return ruler; },
				v:vis,
				lh:function () { return main.clientHeight || 24; },
				m:function () {
					var r = ruler.getBoundingClientRect (), scale = Math.max (1, px ());
					return {r:r, x:function ( t ) { return t * scale; }, t:function ( x ) { return at (mt, (x - r.left) / scale); }};
				}
			});
		};
		function draw ( c ) { c.v && c.v (); }
		q.drawEd = function () { draw ( ed ); };
		q.drawMt = function () { draw ( mt ); };
		q.draw = function () { draw (ed); draw (mt); };

		app.listenFor ('MrkrAdd', drop);
		app.listenFor ('MrkrPrv', function ( sel ) { jump (cx (), -1, sel); });
		app.listenFor ('MrkrNxt', function ( sel ) { jump (cx (), 1, sel); });
		app.listenFor ('DidZoom', redraw);
		app.listenFor ('DidCursorCenter', redraw);
		app.listenFor ('DidUpdateLen', redraw);
		app.listenFor ('RequestResize', redraw);
		app.listenFor ('DidUnloadFile', function () { clear (ed, false); });
		app.listenFor ('StateDidPop', function ( state, undo ) {
			if (!state || state.type !== 'mrk') return ;
			load (cx (state.ctx), state.markers, false);
			OneUp ((undo ? 'Undo ' : 'Redo ') + state.desc);
		});
	}

	PKAE._deps.mrk = PKMrk;

})( window, document, PKAudioEditor );
