(function ( w, d, PKAE ) {
	'use strict';

	var _pid = 0;
	var _aid = 0;

	function FXAutomation ( app, filter_modal, val_cb, preview_cb ) {
		var q = this;

		q.modal = filter_modal;
		q.app  = app;
		q.wv    = app.engine.wavesurfer;
		var mt = app.multitrack;
		var mt_buffer = mt && mt.IsOn && mt.IsOn () && mt.GetFxBuffer ?
			mt.GetFxBuffer () :
			null;
		if (mt_buffer) q.wv = {
			backend:{buffer:mt_buffer},
			regions:{list:[]},
			getDuration:function () { return mt_buffer.duration; }
		};
		q.points = {};
		q.act = null;
		q.act_point = null;
		q.in_auto = false;
		q._bg = null;
		q._bg_src = null;
		q.waveDarken = filter_modal.waveDarken || 0;

		q.btn_auto = _make_btn_auto ( q );

		q.GetValue = function () {
			var data = [];

			var inputs = q.modal.el_body.getElementsByTagName('input');
			var plen = q.points.length;

			for (var i = 0; i < inputs.length; ++i)
			{
				var curr = inputs[i];
				if (q.points[curr.id])
				{
					var arr = [];
					var p = q.points[curr.id];
					for (var j = 0; j < p.length; ++j)
					{
						var tmp = {
							time: p[j].time,
							val: p[j].val
						};
						arr.push(tmp);
						val_cb && val_cb (tmp, curr);
					}
					data.push (arr);
				}
				else
				{
					var tmp = {
						val: curr.value
					};

					data.push (tmp);
					val_cb && val_cb (tmp, curr);
				}
			}
			return (data);
		};
		q.DelAct = function ( min ) {
			var p = q.act && q.points[q.act.id], i = p && p.indexOf (q.act_point);
			if (!p || i < 0 || p.length <= min) return ;
			p.splice (i, 1);
			q.act_point = p[Math.min (i, p.length - 1)];
			q.Render ();
			return 1;
		};

		q.cw = 500;
		q.ch = 200;
		var els  = _make_canvas ( q, q.cw, q.ch );
		q.canvas = els[0];
		q.ctx    = els[1];


		var _fillstyle = '#d9d955';
		q.Render = function () {
				var ctx = q.ctx;
				var cw = q.cw;
				var ch = q.ch;

				if (q._bg) {
					// pre-rendered waveform background - a cheap blit per frame
					ctx.drawImage (q._bg, 0, 0);
				}

				// ctx.clearRect (0, 0, q.cw, q.ch);
				ctx.fillStyle   = _fillstyle;
				ctx.strokeStyle = '#FF0000';

				if (!q.act) return ;

				ctx.beginPath ();
				ctx.moveTo ( 0, ch / 2 );
				var last_y = ch / 2;

				for (var o = 0; o < q.points[q.act.id].length; ++o)
				{
					var curr = q.points[q.act.id][ o ];

					var center_x = curr.ax;
					var center_y = curr.ay;

					ctx.lineTo ( center_x, center_y );
					last_y = center_y;
				}

				ctx.lineTo ( cw, last_y );
				ctx.stroke ();

				var radius = 6;
				for (var o = 0; o < q.points[q.act.id].length; ++o)
				{
					var curr = q.points[q.act.id][ o ];

					var center_x = curr.ax;
					var center_y = curr.ay;

					ctx.beginPath ();
					ctx.arc (center_x, center_y, radius, 0, 2 * Math.PI, false);

					if (curr === q.act_point) {
						ctx.shadowBlur = 24;

						if (curr._on)
							ctx.fillStyle = '#fff';
						else 
							ctx.fillStyle = '#686868';

						ctx.stroke ();
						ctx.fill ();

						ctx.shadowBlur = 0;
						ctx.fillStyle = _fillstyle;
					}
					else if (curr._hov) {

						if (curr._on)
							ctx.fillStyle = 'blue';
						else 
							ctx.fillStyle = 'darkblue';

						ctx.stroke ();
						ctx.fill ();

						ctx.fillStyle = _fillstyle;
					}
					else if (curr._on) {
						ctx.fill ();
					}
					else {
						ctx.fillStyle = '#555';
						ctx.fill ();
						ctx.fillStyle = _fillstyle;
					}
				}
		};


		_make_controls ( q );
		_renderBG ( q );
		q.Render ();

		// -------
		function _make_controls ( q ) {
			var click_time = 0, seek_t = 0, no_seek = 0;
			q.canvas.addEventListener ('click', function ( e ) {
				if (!q.act) return;
				var h = q.app.engine.FXPreviewHost;
				if (seek_t) { clearTimeout (seek_t); seek_t = 0; }
				if (e.timeStamp - click_time < 260)
				{
						var bounds = q.canvas.getBoundingClientRect ();
						var cw = q.cw;
						var ch = q.ch;
						var posx = e.clientX - bounds.left;
						var posy = e.clientY - bounds.top;

						var rel_x = posx / cw;
						var rel_y = posy / ch;

						if (!q.points[q.act.id]) q.points[q.act.id] = [];

						var duration;
						var region = q.wv.regions.list[0];
						if (region) {
							duration = region.end - region.start;
						} else {
							duration = q.wv.getDuration();
						}

						q.points[q.act.id].push ({
							// el:q.act.el,
							id: ++_pid,
							x: rel_x,
							y: rel_y,
							ax: rel_x * cw,
							ay: rel_y * ch,
							time: duration * rel_x,
							val : ((1 - rel_y) * (q.act.max - q.act.min)) + q.act.min,
							_on:  true,
							_hov: false,
						});

						q.points[q.act.id].sort( _compare );
						q.act_point = q.points[q.act.id][q.points[q.act.id].length - 1];

						q.Render ();
						q.onChange && q.onChange ();
						// ----
				}
				else if (!no_seek && preview_cb && h && (h.previewing || h.MTPreviewing))
				{
					var bounds = q.canvas.getBoundingClientRect ();
					var sx = Math.max (0, Math.min (1, (e.clientX - bounds.left) / bounds.width));
					seek_t = setTimeout (function () { seek_t = 0; preview_cb (sx); }, 260);
				}

				no_seek = 0;
				click_time = e.timeStamp;
			}, false);

			var is_dragging = false;
			var drag_pid;
			var last_cursor = '';

			function setCursor ( v ) {
				if (v === last_cursor) return ;
				last_cursor = v;
				q.canvas.style.cursor = v;
			}

			function pointAt ( e ) {
				if (!q.act) return null;
				var bounds = q.canvas.getBoundingClientRect ();
				var posx = e.clientX - bounds.left;
				var posy = e.clientY - bounds.top;
				var slop_x = e.pointerType === 'touch' ? 20 : 10;
				var slop_y = e.pointerType === 'touch' ? 20 : 9;
				var p = q.points[q.act.id] || [];
				for (var o = 0; o < p.length; ++o)
					if (Math.abs (p[o].ax - posx) < slop_x && Math.abs (p[o].ay - posy) < slop_y)
						return p[o];
				return null;
			}

			function dragMove ( e ) {
				if (!q.act_point) return ;
				// only the pointer that started the drag may steer it
				if (e.pointerId !== drag_pid) return ;

				var bounds = q.canvas.getBoundingClientRect ();
				var cw = q.cw;
				var ch = q.ch;

				var rel_x = (e.clientX - bounds.left) / cw;
				var rel_y = (e.clientY - bounds.top) / ch;

				// keep the dragged point inside the canvas and between its
				// neighbors - crossing them would break the curve ordering
				var pts = q.points[q.act.id];
				var pi = pts ? pts.indexOf (q.act_point) : -1;
				var lo = pi > 0 ? pts[pi - 1].x : 0;
				var hi = pi !== -1 && pi < pts.length - 1 ? pts[pi + 1].x : 1;
				rel_x = Math.max (pi > 0 ? lo + 0.002 : 0, Math.min (pi !== -1 && pi < pts.length - 1 ? hi - 0.002 : 1, rel_x));
				// neighbors closer than the gap above must still never be crossed
				rel_x = Math.max (lo, Math.min (hi, rel_x));
				rel_y = Math.max (0, Math.min (1, rel_y));

				q.act_point.ax = rel_x * cw;
				q.act_point.ay = rel_y * ch;

				q.act_point.x = rel_x;
				q.act_point.y = rel_y;

				var duration;
				var region = q.wv.regions.list[0];
				if (region) {
					duration = region.end - region.start;
				} else {
					duration = q.wv.getDuration();
				}

				q.act_point.time = duration * rel_x;
				q.act_point.val  = ((1 - rel_y) * (q.act.max - q.act.min)) + q.act.min;
				no_seek = 1;

				q.Render ();
				q.onChange && q.onChange ();
			}

			function dragEnd ( e ) {
				if (!is_dragging) return ;
				if (e && e.pointerId !== drag_pid) return ;
				is_dragging = false;
				drag_pid = undefined;
				// touch drags and pointercancel never produce the click that
				// resets no_seek - re-arm seeking after any compat click ran
				setTimeout (function () { no_seek = 0; }, 0);
				setCursor (pointAt (e) ? 'grab' : '');
			}

			// pointer events unify mouse + touch and, with capture, keep the
			// drag alive when the cursor leaves the small canvas
			var p_down = w.PointerEvent ? 'pointerdown' : 'mousedown';
			var p_move = w.PointerEvent ? 'pointermove' : 'mousemove';
			var p_up   = w.PointerEvent ? 'pointerup'   : 'mouseup';
			q.canvas.style.touchAction = 'none';

			q.canvas.addEventListener (p_move, function ( e ) {
				if (is_dragging) return dragMove ( e );
				// hover affordance over a draggable point
				if (q.act) setCursor (pointAt (e) ? 'grab' : '');
			});

			q.canvas.addEventListener (p_down, function ( e ) {
				// primary button and primary pointer only - a second finger
				// or a right-click must not hijack or abort a drag
				if (e.button > 0 || e.isPrimary === false) return ;
				is_dragging = false;
				if (!q.act) return ;

				if (!q.points[q.act.id]) q.points[q.act.id] = [];

				var hit = pointAt ( e );
				if (hit)
				{
					is_dragging = true;
					drag_pid = e.pointerId;
					no_seek = 1;
					q.act_point = hit;
					setCursor ('grabbing');
					if (e.pointerId !== undefined && q.canvas.setPointerCapture)
						try { q.canvas.setPointerCapture (e.pointerId); } catch ( err ) {}
					q.Render ();
				}
				else
				{
					q.act_point = null;
					q.Render ();
				}
			});

			q.canvas.addEventListener (p_up, dragEnd);
			if (w.PointerEvent) q.canvas.addEventListener ('pointercancel', dragEnd);


			var act_el = null;
	  		q.modal.el_body.addEventListener ('mouseover', function(e) {
	  			if (!q.in_auto) return ;
	  			if (e.target.tagName === 'INPUT') {
	  				e.target.classList.add ('pk_aut');
	  			}
	  		});
	  		q.modal.el_body.addEventListener ('mouseout', function(e) {
	  			if (!q.in_auto) return ;
	  			if (e.target.tagName === 'INPUT') {
	  				e.target.classList.remove ('pk_aut');
	  			}
	  		});
	  		q.modal.el_body.addEventListener ('click', function(e) {
	  			if (!q.in_auto) return ;
	  			if (e.target.classList.contains ('pk_aut'))
	  			{
	  				if (act_el) {
	  					act_el.classList.remove ('pk_aut_act');
	  					act_el = null;
	  				}

	  				e.target.classList.add ('pk_aut_act');
	  				act_el = e.target;

	  				if (!e.target.id) e.target.id = 'pk' + (++_aid);

	  				q.act = {
	  					id: e.target.id,
	  					el: e.target,
	  					type:e.target.range,
	  					min:e.target.min/1,
	  					max:e.target.max/1,
	  					step:e.target.step/1
	  				};

	  				if (!q.points[q.act.id]) q.points[q.act.id] = [];

	  				q.Render ();
	  			}

	  			// console.log( 'click ', e.target );
	  		});
		};


		function _make_btn_auto ( q ) {
			var btn_automate = d.createElement ('a');
			btn_automate.className = 'pk_modal_a_bottom';
			btn_automate.innerHTML = 'AUTOMATE';

			var in_auto = false;
  			btn_automate.onclick = function () {
  				q.in_auto = !q.in_auto;

  				if (q.in_auto) {
  					btn_automate.classList.add ('pk_act');
  				} else {
					btn_automate.classList.remove ('pk_act');
  				}
  			};

  			q.modal.el_body.appendChild( btn_automate );

  			return (btn_automate);
  		};

  		function _make_canvas ( q ) {
			var cc = document.createElement ('canvas');
			cc.width = 500; cc.height = 200;
			cc.style.background = '#000';
			var ctx = cc.getContext('2d');

			q.modal.el_body.appendChild( cc );

			return ([cc, ctx]);
  		};

		function _compare ( a, b ) {
				if (a.x > b.x) return 1;
				return -1;
		};

		function _renderBG ( q ) {
			var buffer = q.wv.backend.buffer;
			if (!buffer) return ;

			var rate = buffer.sampleRate;
			var from = 0;
			var to = buffer.length;
			var region = q.wv.regions.list[0];
			if (region) {
				from = Math.min (buffer.length, Math.max (0, (region.start * rate) >> 0));
				to = Math.min (buffer.length, Math.max (from + 1, (region.end * rate) >> 0));
			}

			// the background only depends on the source segment: render its
			// peaks once into an offscreen canvas, Render () just blits it
			if (q._bg_src &&
				q._bg_src.b === buffer && q._bg_src.f === from && q._bg_src.t === to) return ;
			q._bg_src = {b:buffer, f:from, t:to};

			var bg = q._bg || d.createElement ('canvas');
			bg.width = q.cw;
			bg.height = q.ch;
			var bctx = bg.getContext ('2d');

			q.app.engine.GetWave (buffer, q.cw, q.ch, from, to, bg, bctx);
			if (q.waveDarken) {
				bctx.fillStyle = 'rgba(0,0,0,' + q.waveDarken + ')';
				bctx.fillRect (0, 0, q.cw, q.ch);
			}
			q._bg = bg;
		};
	};

	PKAudioEditor._deps.FxAUT = FXAutomation;

})( window, document, PKAudioEditor );
