(function ( w, d, PKAE ) {
	'use strict';

	var modal_name = 'modalfx';
	var modal_esc_key = modal_name + 'esc';
	var max_db_val = 35;

	function PK_FX_PGEQ () {
		var q = this;
		var _id = 0;

		var _is_render_scheduled  = false;
		var _is_render_scheduled2 = false;

		q.act = null;
		q.ranges = [];
		q.ui = {};

		this.Callback = function(){};

		this.Init = function ( container ) {
			var q = this;

			q.el = container;
			_make_ui ( q );
			_make_evs ( q );

			q.Render ();
		};

		this.Add = function (type, is_on, freq, gain, qval, coords_x, coords_y) {
			var q = this;

			var new_range = {
				id: (++_id),
				type: type ? type : 'peaking',
				freq: freq || 0,
				gain: gain || 0,
				q: qval || 5,

				// interface
				_on:  is_on,
				_hov: false,
				_el: null,
				_coords: {
					x: coords_x || 0,
					y: coords_y || 0
				},
				_arr:[]
			};

			q.ranges.push (new_range);
			q.ranges.sort (_compare);

			if (q.act) {
				q.act.el.classList.remove ('pk_act');
			}

			q.act = new_range;

			_range_compute_arr (new_range);
			new_range.el = _range_render_el (q, new_range, ' pk_act');

			q.Callback && q.Callback ();

			q.Render ();
		};

		this.Remove = function (range) {
			var q = this;

			var l = q.ranges.length;

			while (l-- > 0) {
				if (q.ranges[l] === range) {
					q.ranges.splice (l, 1); 
					break;
				}
			}

			if (range.el) {
				range.el.parentNode.removeChild (range.el);
				range.el = null;
			}

			if (q.act && q.act === range) {
				q.act = null;
			}

			q.Render ();
		};

		var _fillstyle = '#d9d955';

		var _anim_render = function () {
			_render ( q );
		};

		this.Render = function () {
			var q = this;

			if (_is_render_scheduled) return ;
			_is_render_scheduled = true;

			requestAnimationFrame (_anim_render);
		};

		this.RenderBars = function (_, freq) {
			var q = this;

			if (_is_render_scheduled2) return ;
			_is_render_scheduled2 = true;

			requestAnimationFrame (function () {
				_render_bars ( q, freq );
			});
		};

		var _render_bars = function( q, freq ) {
			_is_render_scheduled2 = false;

			if (!freq) return ;

			var ctx    = q.ui.ctx_bars;
			var canvas = q.ui.canvas_bars;

			var cw = canvas.width;
			var ch = canvas.height;

			// ctx.fillStyle = '#000';
			// ctx.fillRect (0, 0, cw, ch);
			ctx.clearRect (0, 0, cw, ch);

			var bufferLength = 512; // 256
			var max_bars = 117 * 2;
			var barWidth = (cw / max_bars).toFixed(1)/1;
			var barHeight = 0;
			var x = 0;

			// 
			for (var i = 0; i < 117; ++i)
			{
				barHeight = freq[i];

				// map.push ( i * 43 );

				var newheight = ((barHeight / 256) * ch) >> 0;

				ctx.fillRect (x, ch - newheight, barWidth, newheight);
				x += barWidth;// + 1;
			}

			for (var i = 0; i < 117; ++i)
			{
				// (116*3.4)
				barHeight = freq[117 + ((i * 3.34) >> 0)];

				// map.push ( (120 + (i * 3)) * 43 );
				var newheight = ((barHeight / 256) * ch) >> 0;

				ctx.fillRect (x, ch - newheight, barWidth, newheight);
				x += barWidth;// + 1;
			}

//			console.log( map );

			// what if we care for the small bars first
/*
			var steps = (total_freq/bufferLength) >> 0;

			// we care for

			// 256 bars

			// 32
			// 64
			// 125
			// 250
			// 500
			// 1000
			// 2000
			// 4000
			// 8000
			// 16000
			// 20000
			var arr = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000];
			var curr = 0;
			var curr_bars = 0;
			var bars_per_entry = (bufferLength / 10) >> 0;

			for (var i = 0; i < bufferLength; ++i) {

				if (++curr_bars < bars_per_entry)
				{

					var ff = arr[ curr ];
					var ff_next = arr[ curr + 1];

					var m = 0;
					for (; m < bufferLength; ++m)
					{
						if (m * steps > ff) {
							--m;
							break;
						}
					}

					barHeight = freq[ m ];

					var newheight = ((barHeight / 256) * ch) >> 0;
					ctx.fillRect (x, ch - newheight, barWidth, newheight);
					x += barWidth;// + 1;
				}
				else
				{
					++curr;
					curr_bars = 0;
				}
			}
*/

//			for (var i = 0; i < bufferLength; ++i) {
//				barHeight = freq[i];
//				var newheight = ((barHeight / 256) * ch) >> 0;

//				ctx.fillRect (x, ch - newheight, barWidth, newheight);
//				x += barWidth;// + 1;
//			}
		};



		var line_arr = new Array (1000);
		var _render = function ( q ) {
			_is_render_scheduled = false;

			var ctx    = q.ui.ctx_eq;
			var canvas = q.ui.canvas_eq;

			var cw = canvas.width;
			var ch = canvas.height;

			var ch_half = ch / 2;

			// --------------------
			ctx.clearRect (0, 0, cw, ch);

			ctx.fillStyle   = _fillstyle;

			if (q.ranges.length === 0)
			{
				ctx.beginPath ();
				ctx.moveTo (0,  ch_half);
				ctx.lineTo (cw, ch_half);
				ctx.stroke ();

				return ;
			}

			// render the line based on the elements
			var first = true;
			var arr = [];
			for (var i = 0; i < total; ++i) {
				arr[i] = 0;
			}

			for (var o = 0; o < q.ranges.length; ++o)
			{
				var curr = q.ranges[ o ];

				if (!curr._on) continue;

				if (first)
				{
					first = false;
					for (var i = 0; i < total; ++i)
					{
						line_arr[i] = curr._arr[i];
					}
				}
				else
				{
					for (var i = 0; i < total; ++i)
					{
						line_arr[i] += curr._arr[i];
					}
				}
				// ---
			}


			if (first)
			{
				ctx.beginPath ();
				ctx.moveTo (0,  ch_half);
				ctx.lineTo (cw, ch_half);
				ctx.stroke ();
			}
			else
			{
				// --
				ctx.beginPath ();
				ctx.moveTo ( 0, ch_half - (line_arr[ 0 ] * (ch_half / max_db_val)) );

				for (var i = 0; i < (total / 4); i += 1) {
					var el = line_arr[ i ];

					var x = (i * 2) * (cw / total);
					var y = ch_half - (el * (ch_half / max_db_val));

					ctx.lineTo ( x, y );
				}

				var hh = 0;
				for (var i = (total / 4); i < total; i += 3) {
					var el = line_arr[ i ];

					hh += 2;

					var x = ((total / 2) + hh) * (cw / total);
					var y = ch_half - (el * (ch_half / max_db_val));

					ctx.lineTo ( x, y );
				}

				ctx.stroke ();
			}
			// ---


			// draw the dots
			var radius = 6;
			for (var o = 0; o < q.ranges.length; ++o)
			{
				var curr = q.ranges[ o ];

				var center_x = curr._coords.x;
				var center_y = curr._coords.y;

				ctx.beginPath ();
				ctx.arc (center_x, center_y, radius, 0, 2 * Math.PI, false);

				if (curr === q.act) {
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

			// ---
		};



		////////////////////////////////////////////
		// helpers
		var _dbncr = null;
		var total_freq = 20000; // 22000
		var total = 1000;
		var jump = (total_freq / total) >> 0;

		function _range_update ( q, range, new_range, compute_coords ) {
			var modified = false;
			var old_val = null;

			for (var key in new_range)
			{
				if (range[key] !== new_range[key])
				{
					modified = true;
					old_val = range[key];
					range[key] = new_range[key];

					if (key === '_on')
					{
						var el = document.getElementById ('pgon' + range.id);
						el.checked = range[key];
					}
					else if (key === 'freq')
					{
						var el = range.el.getElementsByClassName('pk_freq')[0];
						//requestAnimationFrame (function () {
							el.value = range[key];
						//});
					}
					else if (key === 'gain')
					{
						var el = range.el.getElementsByClassName('pk_gain')[0];
						//requestAnimationFrame (function () {
							el.value = range[key];
						//});
					}
					else if (key === 'q')
					{
						var el = range.el.getElementsByClassName('pk_q')[0];
						//requestAnimationFrame (function () {
							el.value = range[key];
						//});
					}
					else if (key === 'type')
					{
						// -----
						var el = range.el.getElementsByTagName('select')[0];
						if (range[key] === 'peaking') el.options[0].selected = true;
						else if (range[key] === 'lowpass') el.options[1].selected = true;
						else if (range[key] === 'highpass') el.options[2].selected = true;

						_range_compute_arr (range);
						q.ranges.sort (_compare);
					}
					// ---
				}
			}

			if (modified)
			{
				if (compute_coords)
				{
					// compute coords of the canvas
					var canvas = q.ui.canvas_eq;
					var cw = canvas.width;
					var ch = canvas.height;

					var tmp_x = 0;
					if (range.freq <= 5000) {
						range._coords.x = ((range.freq / 5000) * (cw / 2) ).toFixed(1)/1;
					} else {
						range._coords.x = ((cw / 2) + (((range.freq - 5000) / 15000) * (cw / 2))).toFixed(1)/1;
					}

					// range._coords.x = ((range.freq / total_freq) * cw).toFixed(1)/1;

					if (range.type === 'peaking')
						range._coords.y = ((1.0 - ((range.gain + max_db_val) / (max_db_val * 2))) * ch).toFixed(1)/1;
					else
						range._coords.y = (ch / 2).toFixed(1)/1;
				}

				if (_dbncr) {
					clearTimeout (_dbncr);
				}

				_dbncr = setTimeout (function () {
					q.Callback ();
					_dbncr = null;
				}, 38);

				q.Render ();
			}
			// ---
		};

		function _ease (t) { return t*t*t*t*t };
		function _ease_out (t) { return t*t*t*t  };

		function _range_compute_arr ( range ) {
			var arr = [];

			for (var i = 0; i < total; ++i) {
				arr[i] = 0;
			}

			range._arr = arr;

			// -------------
			var rounding      = total_freq * (2 / range.q);
			var half_rounding = (rounding / jump) >> 0;

			if (range.type === 'peaking')
			{
					var edge_left  = range.freq - (rounding / 2);
					var edge_right = range.freq + (rounding / 2);

					var start = (edge_left  / jump) >> 0;
					var end   = (edge_right / jump) >> 0;

					var j = 0;
					for (var i = start; i < end; ++i)
					{
						var ii = (i * jump);
						if (ii < range.freq)
						{
							++j;
							arr[i] += _ease (j / (half_rounding / 2)) * range.gain;
						}
						else
						{
							--j;
							arr[i] += _ease (j / (half_rounding / 2)) * range.gain;
						}
					}

					return ;
			}

			if (range.type === 'highpass')
			{
					var edge_left = range.freq - rounding;
					var start     = (edge_left  / jump) >> 0;
					var end       = (range.freq / jump) >> 0;

					for (var i = 0; i < start; ++i)
					{
						arr[i] = -max_db_val;
					}

					// todo improve this!!!
					var j = half_rounding;
					for (var i = start; i < end; ++i)
					{
						--j;
						arr[i] -= _ease_out (j / half_rounding) * max_db_val;
					}

					return ;
			}

			if (range.type === 'lowpass')
			{
					var edge_right = range.freq + rounding;
					var start      = (range.freq  / jump) >> 0;
					var end        = (edge_right  / jump) >> 0;

					for (var i = end; i < total; ++i)
					{
						arr[i] = -max_db_val;
					}

					// todo improve this!!!
					var j = 0;
					for (var i = start; i < end; ++i)
					{
						++j;
						arr[i] -= _ease_out (j / half_rounding) * max_db_val;
					}

					return ;
			}

			// -------------
		}

		function _make_ui ( q ) {
			var el_drawer = d.createElement ('div');
			el_drawer.className = 'pk_row';

			var canvas_bars = d.createElement ('canvas');
			var canvas_eq   = d.createElement ('canvas');

			canvas_bars.className = 'pk_peq2';
			canvas_eq.className   = 'pk_peq';

			canvas_bars.width  = 450 / 2;
			canvas_bars.height = 224 / 2;

			canvas_eq.width  = 450;
			canvas_eq.height = 225;

			var ctx_bars = canvas_bars.getContext ('2d', {alpha:true, antialias:false});
			var ctx_eq   = canvas_eq.getContext ('2d', {alpha:true, antialias:false});

			ctx_bars.fillStyle =  '#365457'; // '#486a6e';

			// ctx_eq.lineWidth = 2;
			ctx_eq.strokeStyle = '#FF0000';
			ctx_eq.shadowColor = '#FF2222';
			ctx_eq.shadowBlur  = 0;


			// render the decibel and the frequencies
			var marker_freqs = d.createElement ('div');
			marker_freqs.className = 'pk_peq3 pk_noselect';
			marker_freqs.innerHTML = '<span>32</span>' +
//			'<span>32</span>' +
//			'<span>64</span>' +
//			'<span>128</span>' +
//			'<span>250</span>' +
//			'<span>500</span>' +
			'<span style="position:absolute;left:3.5%">500<span></span></span>' +
			'<span style="position:absolute;left:9%">1k<span></span></span>' +
			'<span style="position:absolute;left:19%">2k<span></span></span>' +
			'<span style="position:absolute;left:38%">4k<span></span></span>' +
			'<span style="position:absolute;left:50%">5k<span></span></span>' +
			'<span style="position:absolute;left:59%">8k<span></span></span>' +
			'<span style="position:absolute;left:72%">12k<span></span></span>' +
			'<span style="position:absolute;left:85%">16k<span></span></span>' +
			'<span style="float:right">20k</span>';


			var marker_dbs = d.createElement ('div');
			marker_dbs.className = 'pk_peq4 pk_noselect';
			marker_dbs.innerHTML = '<span style="top:0">35</span>' +
			'<span style="top:10%">28<span></span></span>' +
			'<span style="top:20%">21<span></span></span>' +
			'<span style="top:30%">14<span></span></span>' +
			'<span style="top:40%">7<span></span></span>' +			
			'<span>0<span></span></span>' +
			'<span style="top:60%">-7<span></span></span>' +
			'<span style="top:70%">-14<span></span></span>' +
			'<span style="top:80%">-21<span></span></span>' +
			'<span style="top:90%">-28<span></span></span>' +			
			'<span style="top:100%">35</span>';

			el_drawer.appendChild ( canvas_bars );
			el_drawer.appendChild ( canvas_eq );
			el_drawer.appendChild ( marker_freqs );
			el_drawer.appendChild ( marker_dbs );

			q.el.appendChild ( el_drawer );

			// element's area
			var el_list = document.createElement ('div');
			el_list.className = 'pk_row pk_noselect pk_pglst';

			el_list.innerHTML = '<div class="pk_pgeq_els">' +
				'<span class="pk_txlft"> #</span><span>type</span><span>gain</span><span>freq</span><span>Q</span>' +
			'</div>';

			q.el.appendChild ( el_list );

			q.ui.ctx_bars = ctx_bars;
			q.ui.ctx_eq   = ctx_eq;

			q.ui.canvas_bars = canvas_bars;
			q.ui.canvas_eq   = canvas_eq;
			q.ui.el_list     = el_list;
		}

		function _make_evs ( q ) {
			var ctx    = q.ui.ctx_eq;
			var canvas = q.ui.canvas_eq;

			var click_time = 0;
			var is_dragging = false;


			var _move = function ( e ) {
				if (!is_dragging || !q.act) return ;

				var ex = 0;
				var ey = 0;

				if (e.touches) {
					if (e.touches.length > 1) { return ; }

					ex = e.touches[0].clientX;
					ey = e.touches[0].clientY;
				} else {
					ex = e.clientX;
					ey = e.clientY;
				}

				var bounds = canvas.getBoundingClientRect ();
				var cw = canvas.width;
				var ch = canvas.height;

				var posx = ex - bounds.left;
				var posy = ey - bounds.top;

				var rel_x = posx / cw;
				var rel_y = posy / ch;

				q.act._coords.x = posx;
				q.act._coords.y = posy;

				// up until half it's 0 - 5000, second half 5000 -> 2200
				var freq = 0;

				if (rel_x <= 0.5) {
					freq = (5000 * (rel_x * 2)) >> 0
				} else {
					freq = 5000 + ((((rel_x - 0.5) * 2) * 15000) >> 0);
				}

//				var freq = (rel_x * (total_freq) + 0) >> 0; // + 16 (min freq)
				var gain = (((rel_y - 0.5) * -2) * max_db_val).toFixed (2) / 1;

				_range_update (q, q.act, {
					'freq': freq,
					'gain': gain
				});
				_range_compute_arr (q.act);
			};

			var _end = function ( e ) {
				is_dragging = false;

				canvas.removeEventListener ('mousemove', _move);
				canvas.removeEventListener ('mouseup', _end);

				canvas.removeEventListener ('touchmove', _move);
				canvas.removeEventListener ('touchup', _end);
			};

			var mdown = function ( e ) {
					var unchecked = !!q.act;

					if (q.ranges.length === 0)
					{
						if (unchecked) q.Render ();
						return ;
					}

					var bounds = canvas.getBoundingClientRect ();
					var cw = canvas.width;
					var ch = canvas.height;

					var posx = e.clientX - bounds.left;
					var posy = e.clientY - bounds.top;

					var dist_x = e.is_touch ? 20 : 10;
					var dist_y = e.is_touch ? 20 : 9;

					for (var o = 0; o < q.ranges.length; ++o)
					{
						var curr = q.ranges[ o ];

						if ( Math.abs (curr._coords.x - posx) < dist_x && Math.abs (curr._coords.y - posy) < dist_y)
						{
							if (unchecked) {
								q.act.el.classList.remove ('pk_act');
							}

							q.act = curr;
							q.act.el.classList.add ('pk_act');

							is_dragging = true;

							q.Render ();

							// check if we are targetting a circle

							if (!e.is_touch)
							{
								canvas.addEventListener ('mousemove', _move, false);
								canvas.addEventListener ('mouseup', _end, false);
							}
							else
							{
								e.ev.preventDefault  ();
								e.ev.stopPropagation ();

								canvas.addEventListener ('touchmove', _move, false);
								canvas.addEventListener ('touchup', _end, false);	
							}

							return ;
						}
						// ---
					}

					if (unchecked) {
						q.act.el.classList.remove ('pk_act');
						// un-highlight
						q.act = null;

						q.Render ();
					}

					// ----
			};

			canvas.addEventListener ('mousedown', mdown, false);


			canvas.addEventListener ('touchstart', function ( e ) {
				if (e.touches.length > 1) {
					e.preventDefault ();
					e.stopPropagation ();

					return ;
				}

				var ev = {
					clientX  : e.touches[0].clientX,
					clientY  : e.touches[0].clientY,
					is_touch : true,
					ev       : e
				};

				mdown ( ev );
			});


			canvas.addEventListener ('click', function ( e ) {
				if (e.timeStamp - click_time < 260)
				{
						var bounds = canvas.getBoundingClientRect ();
						var cw = canvas.width;
						var ch = canvas.height;
						var posx = e.clientX - bounds.left;
						var posy = e.clientY - bounds.top;

						var rel_x = posx / cw;
						var rel_y = posy / ch;

						var freq = 0;
						if (rel_x <= 0.5) {
							freq = (5000 * (rel_x * 2)) >> 0
						} else {
							freq = 5000 + ((((rel_x - 0.5) * 2) * 15000) >> 0);
						}

						// var freq = (rel_x * (total_freq) + 0) >> 0; // + 16 (min freq)
						var gain = (((rel_y - 0.5) * -2) * max_db_val).toFixed(2)/1;
						var qval = 5;
						var type = 'peaking';

						q.Add (type, true, freq, gain, qval, posx, posy);
				}

				click_time = e.timeStamp;
			}, false);

			// ---

		}

		function _range_render_el ( q, range, clss ) {
			var el_list = q.ui.el_list;

			var el = d.createElement ('div');
			el.className = 'pk_pgeq_els' + (clss ? clss : '');
			el.setAttribute ('data-id', range.id);

			el.addEventListener ('click', function ( e ) {
				if (!range.el) return ;

				if (range !== q.act)
				{
					if (q.act)
					{
						q.act.el.classList.remove ('pk_act');
					}

					q.act = range;
					q.act.el.classList.add ('pk_act');

					q.Render ();
				}
			}, false);

			el.addEventListener ('mouseover', function ( e ) {
				if (!range.el) return ;

				if (!range._hov)
				{
					range._hov = true;
					q.Render ();
				}
			}, false);

			el.addEventListener ('mouseleave', function ( e ) {
				if (!range.el) return ;

				if (range._hov)
				{
					range._hov = false;
					q.Render ();
				}
			}, false);

			// # & on or off
			var chckd = range._on ? 'checked' : '';
			var num = '<i>' + range.id + '</i>';
			var el_num = d.createElement ('div');
			el_num.className = 'pk_txlft';
			el_num.innerHTML = num + 
				'<input type="checkbox" id="pgon' + range.id + '" class="pk_check" name="onoff" ' + chckd +'>' +
				'<label for="pgon' + range.id + '">ON</label>';

			el_num.getElementsByTagName('input')[0].onchange = function ( e ) {
				_range_update (q, range, {'_on': !!this.checked});

				var lbl = this.parentNode.getElementsByTagName('label')[0];
				lbl.innerHTML = this.checked ? 'ON' : 'OFF';
			};
			el.appendChild (el_num);

			// type
			var sel1 = range.type === 'lowpass' ? 'selected' : '';
			var sel2 = range.type === 'highpass' ? 'selected' : '';
			var el_type = d.createElement ('div');
			el_type.innerHTML = '<select><option>peaking</option><option ' + sel1 + '>lowpass</option><option ' + sel2 + '>highpass</option></select>';

			el_type.getElementsByTagName('select')[0].onchange = function ( e ) {
				var val = this.options[this.selectedIndex].value;

				if (val === 'peaking') {
					el.classList.remove ('pk_dis');
				} else {
					el.classList.add ('pk_dis');
				}

				_range_update (q, range, {'type': val}, 1);
			};

			el.appendChild (el_type);

			// gain
			var el_gain = d.createElement ('div');
			el_gain.innerHTML = '<input type="number" class="pk_val pk_gain" min="-35" max="35" value="' + range.gain + '">';

			el_gain.getElementsByClassName('pk_gain')[0].onchange = function ( e ) {
				if (!this.value) {
					this.value = 0;
				}

				if (this.hasAttribute ('data-open')) {
					this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
				}

				_range_update (q, range, {'gain': this.value / 1}, 1);
				_range_compute_arr (range);
			};
			el_gain.getElementsByClassName('pk_gain')[0].onfocus = function ( e ) {
				if (this.hasAttribute ('data-open')) return ;

				var self = this;
				var parent = this.parentNode;
				var bar = document.createElement ('div');
				bar.className = 'pk_pgeq_freq pk_gain';
				bar.innerHTML = '<div class="pk_arr"></div><input type="range" min="-35" max="35" class="pk_horiz pk_gain" step="0.1" value="' + range.gain + '">';

				bar.getElementsByClassName('pk_horiz')[0].oninput = function ( e ) {
					if (self.value != this.value) {
						self.value = this.value;
						self.onchange ();
					}
				};

				parent.appendChild (bar);
				this.setAttribute('data-open', '1');

				var down = function ( e ) {
					if ( !e.target.classList.contains ('pk_gain') || (e.target.type === self.type && e.target !== self) )
					{
						self.removeAttribute ('data-open');
						parent.removeChild (bar);
						q.el.removeEventListener ('mousedown', down);
						return ;
					}
				};
				q.el.addEventListener ('mousedown', down, false);
			};
			el.appendChild (el_gain);

			// freq
			var el_freq = d.createElement ('div');
			el_freq.innerHTML = '<input type="number" class="pk_val pk_freq" min="16" max="20000" value="' + range.freq + '">';
			el_freq.getElementsByClassName('pk_freq')[0].onchange = function ( e ) {
				if (!this.value) {
					this.value = 500;
				}

				if (this.hasAttribute ('data-open')) {
					this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
				}

				_range_update (q, range, {'freq': this.value / 1}, 1);
				_range_compute_arr (range);
			};

			el_freq.getElementsByClassName('pk_freq')[0].onfocus = function ( e ) {
				if (this.hasAttribute ('data-open')) return ;

				var self = this;
				var parent = this.parentNode;
				var bar = document.createElement ('div');
				bar.className = 'pk_pgeq_freq pk_freq';
				bar.innerHTML = '<div class="pk_arr"></div><input type="range" min="16" max="20000" class="pk_horiz pk_freq" step="1" value="' + range.freq + '">';

				bar.getElementsByClassName('pk_horiz')[0].oninput = function ( e ) {
					if (self.value != this.value) {
						self.value = this.value;
						self.onchange ();
					}
				};

				parent.appendChild (bar);
				this.setAttribute('data-open', '1');

				var down = function ( e ) {
					if ( !e.target.classList.contains ('pk_freq') || (e.target.type === self.type && e.target !== self) )
					{
						self.removeAttribute ('data-open');
						parent.removeChild (bar);
						q.el.removeEventListener ('mousedown', down);
					}
				};
				q.el.addEventListener ('mousedown', down, false);
			};

			el.appendChild (el_freq);

			// q
			var el_q = d.createElement ('div');
			el_q.innerHTML = '<input type="number" class="pk_val pk_q" min="1" max="50" value="' + range.q + '">';
			el_q.getElementsByClassName('pk_q')[0].onchange = function ( e ) {

				if (!this.value) {
					this.value = 1;
				}

				if (this.hasAttribute ('data-open')) {
					this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
				}

				_range_update (q, range, {'q': this.value / 1}, 1);
				_range_compute_arr (range);
			};

			el_q.getElementsByClassName('pk_q')[0].onfocus = function ( e ) {
				if (this.hasAttribute ('data-open')) return ;

				var self = this;
				var parent = this.parentNode;
				var bar = document.createElement ('div');
				bar.className = 'pk_pgeq_freq pk_q';
				bar.innerHTML = '<div class="pk_arr"></div><input type="range" min="1" max="50" class="pk_horiz pk_q" step="0.1" value="' + range.q + '">';

				bar.getElementsByClassName('pk_horiz')[0].oninput = function ( e ) {
					if (self.value != this.value) {
						self.value = this.value;
						self.onchange ();
					}
				};

				parent.appendChild (bar);
				this.setAttribute('data-open', '1');

				var down = function ( e ) {
					if ( !e.target.classList.contains ('pk_q') || (e.target.type === self.type && e.target !== self) )
					{
						self.removeAttribute ('data-open');
						parent.removeChild (bar);
						q.el.removeEventListener ('mousedown', down);
					}
				};
				q.el.addEventListener ('mousedown', down, false);
			};
			el.appendChild (el_q);

			// delete
			var el_del = d.createElement ('div');
			el_del.className = 'pk_del';
			el_del.innerHTML = '<a style="cursor:pointer">DELETE</a>';
			el_del.getElementsByTagName('a')[0].onclick = function ( e ) {
				q.Remove (range);
			};

			el.appendChild (el_del);

			// ----------------------
			el_list.appendChild (el);

			return (el);
		}

		function _compare ( a, b ) {
				if (a.type === 'peaking' && b.type !== 'peaking') return -1;
				if (b.type === 'peaking' && a.type !== 'peaking') return 1;

				return 0;
		}
		// ---
	};


	var ParagraphicModal = function ( app, custom_presets ) {

		app.fireEvent ('RequestSelect', 1);

		var filter_id = 'paragraphic_eq';

		// -------
		var PGEQ = new PK_FX_PGEQ ();
		var DrawBars = function (_, freq) {
			PGEQ.RenderBars (_, freq);
		};
		var updateFilter = function () {
			if (!PGEQ) return ;

			var val = [];
			var ranges = PGEQ.ranges;
			  
			for (var i = 0; i < ranges.length; ++i)
			{
				var range = ranges [ i ];
				if (range._on)
				{
					val.push ({
						'type' : range.type,
						'freq' : range.freq,
						'val'  : range.gain,
						'q'    : range.q
					});
				}
			}
			return (val);
		};

		var x = new PKAudioFXModal ({
			id: filter_id,
			title: 'Paragraphic EQ',

			ondestroy: function ( q ) {
				app.stopListeningFor ('DidAudioProcess', DrawBars);
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);

				PGEQ = null;
			},

			preview: function ( q ) {
				app.fireEvent ('RequestActionFX_PREVIEW_PARAMEQ', updateFilter ());
			},

			body: '',
			
			presets:[
					{name:'Old Telephone',val:'1,highpass,0,5800,5.8,1,lowpass,0,7060,5'}
			],

			custom_pres:custom_presets.Get (filter_id),

			onpreset: function ( val ) {
				var l = PGEQ.ranges.length;
				while (l-- > 0) {
					PGEQ.Remove (PGEQ.ranges[l]);
				}

				var canvas = PGEQ.ui.canvas_eq;
				var cw = canvas.width;
				var ch = canvas.height;

				var list = val.split(',');
				var len = list.length;
				var els = (len / 5) >> 0;

				for (var j = 0; j < els; ++j)
				{
					var curr = [];
					var offset = j * 5;

					curr[0] = !!(list[ offset + 0 ] / 1);
					curr[1] = list[ offset + 1 ];
					curr[2] = list[ offset + 2 ] / 1;
					curr[3] = list[ offset + 3 ] / 1;
					curr[4] = list[ offset + 4 ] / 1;

					var x = 0;
					var y = 0;

					if (curr[3] < 5000) {
						x = (curr[3] / 5000) * (cw / 2);
					} else {
						x = ((cw / 2) + (((curr[3] - 5000) / 15000) * (cw / 2))).toFixed(1)/1;
					}

					if (curr[1] === 'peaking')
						y = ((1.0 - (((curr[2]/1) + max_db_val) / (max_db_val * 2))) * ch).toFixed(1)/1;
					else
						y = (ch / 2).toFixed(1)/1;

					// (type, is_on, freq, gain, qval, coords_x, coords_y)
					PGEQ.Add (curr[1], !!curr[0], curr[3]/1, curr[2]/1, curr[4]/1, x, y);
				}
			},

			buttons: [{
				title:'Apply EQ',
				clss:'pk_modal_a_accpt',
				callback: function( q ) {

					app.fireEvent ('RequestActionFX_PARAMEQ', updateFilter ());
					q.Destroy ();
				}
			}],

			setup:function( q ) {
					PGEQ.Init ( q.el_body );

					PGEQ.Callback = function () {
						app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', updateFilter ());
					};

					app.listenFor ('DidAudioProcess', DrawBars);

					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
			}
		}, app);

		x.Show ();
	};

	PKAudioEditor._deps.FxEQ = ParagraphicModal;








	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	function getOfflineAudioContext (channels, sampleRate, duration) {
		return new (window.OfflineAudioContext ||
				window.webkitOfflineAudioContext)(channels, duration, sampleRate);
	};
	function _normalize_array (data) {
		var new_array = [];
		for (var i = 0; i < data.length; ++i) {
			new_array.push ( Math.abs (Math.round ((data[i + 1] - data[i]) * 1000)) );
		}

		return (new_array);
	};

	function _normalize_array2 (data) {
		var new_array = [];
		for (var i = 0; i < data.length; ++i) {
			new_array.push ( Math.round (Math.abs (data[i] * 1000)) );
		}

		return (new_array);
	};

	function _group_rhythm ( data, diff_arr ) {
 			if (diff_arr.length <= 1) return ;

			var peak_median = 0;
			for (var i = 0; i < data.length; ++i) {
				peak_median += data[i];
			}

			peak_median /= diff_arr.length;
			peak_median -= peak_median * 0.2;

			var diff_median = 0;
			for (var i = 0; i < diff_arr.length; ++i) {
				diff_median += diff_arr[i];
			}

			diff_median /= diff_arr.length;
			if (diff_median > 1) diff_median -= (diff_median * 0.2);

			var existing = 0;
			for (var i = 0; i < diff_arr.length; ++i) {
				if (diff_arr[i] <= diff_median) continue;
			 	++existing;
			}

			// console.log (" DIFF MEDIAN IS ", diff_median, "    and total beats: ", existing, "  out of: ", diff_arr.length);
			// clean-up the drums array - based on the median.
			// console.log ( JSON.stringify( data ) );
			// console.log ("----------");

			for (var i = 0, j = 0; i < data.length; ++i)
			{
				if (data[i] !== 0) {

					if (diff_arr[j] && diff_arr[j] < diff_median) {

						if (data[i] > peak_median && diff_arr[j] > (diff_median * 0.6)){
							//console.log ( 'ZEROEDC NOOOOT ', i, '    ',  data[i], ' with median ', peak_median , '  but diff was  ', diff_arr[j],  '   yet. ',  diff_median );
						}
						else {
							//console.log ( 'ZEROEDC ', i, '    ',  data[i], ' with median ', peak_median , '  but diff was  ', diff_arr[j],  '   yet. ',  diff_median );
							data[i] = 0;
						}
					}

					++j;
				}
				// ----
			}

			// console.log( data );
			window.final_arr = data;

			// console.log ( JSON.stringify( data ) );

			// now count distance between peaks
			var distances = {};
			var unique_distances = [];
			var first_found = 0;
			var is_first = true;
			for (var i = 0; i < data.length - 1; ++i) // #### do not litter the last data
			{
				if (data[i] === 0) {
					++first_found;
					continue;
				}

				//if (first_found < 1 && !is_first) {
				//	continue;
				//}

				if (is_first) {
					is_first = false;
				}

				first_found = 0;

				var own = [];
				unique_distances.push (own);

				// console.log ('----------------------------------');
				// console.log ('COMPUTING DISTANCE OF ' + i + '    value ' + data[i] );

				var interval = 0;
				var total = 12;
				var last_found = 0;
				for (var j = i + 1; j < 1000; ++j) {
					if (data[j] === 0) { ++interval; ++last_found; continue; }
					else if (!data[j]) { break; }

					if (last_found < 0) {
						continue;
					}
					last_found = 0;

					if (--total === 0) break;

					own.push (interval);

					// if it exists, immediately reach out for the next one.
					if (!distances[interval]) distances[interval] = 0;
					distances[interval] += 1;

					// console.log ('distance with index ' + j + '    value ' + data[j] + '    is ' + interval );
				}
				// break;
			}

			console.log(unique_distances);

			// grab only the big peaks.

			function getmax (a) {
				var m = -Infinity,
				i = 0,
				n = a.length;

				for (; i != n; ++i) {
					if (a[i] > m) {
						m = a[i];
					}
				}
				return m;
			}

			function getmin (a) {
				var m = Infinity,
				i = 0,
				n = a.length;

				for (; i != n; ++i) {
					if (a[i] !== 0 && a[i] < m) {
						m = a[i];
					}
				}
				return m;
			}

			var max = getmax (data);
			var min = getmin (data);
			var count = 0;
			var threshold = Math.round ((max - min) * 0.3);

			var velocities = [];
			for (var i = 0; i < data.length; ++i) {
				if (data[i] === 0) continue;

				if (data[i] >= (max - threshold)) {
					velocities.push (3);
				}
				else if (data[i] >= (max - (threshold * 2))) {
					velocities.push (2);
				}
				else if (data[i] >= (max - (threshold * 3))) {
					velocities.push (1);
				}
				else {
					velocities.push (0);
				}
			}


			return ([distances, velocities]);
	};

	var TempoToolsModal = function ( app ) {
		app.fireEvent ('RequestSelect', 1);
		var filter_id = 'tempo_tools';
		var act_index = 1;
		var act_tool  = null;

		// ------
		var TempoMetro = function ( app, modal ) {
			var q = this;
			q.app = app;

			var bpm = 120;
			var tick = null;
			var count = 0;
			var time = ((60.0 / bpm) * 1000) >> 0;
			var audioContext = null; // new AudioContext();
			var osc = null;
			var amp = null;
			var ready = false;
			var volume = 0.5;
			var accentuate = true;

			var DidStopPlay = null;
			var DidPlay = null;
			var MetronomeAct = null;
			var MetronomeInAct = null;

			q.Init = function ( container ) {
				var q = this;

				q.el = container;

				_make_ui ( q );
				_make_evs ( q );
			};

			q.Destroy = function () {
				q.app.stopListeningFor ('DidStopPlay', DidStopPlay);
				q.app.stopListeningFor ('DidPlay', DidPlay);
				q.app.stopListeningFor ('DidStartMetro', MetronomeAct);
				q.app.stopListeningFor ('DidStopMetro', MetronomeInAct);

				DidStopPlay = null;
				DidPlay = null;
				MetronomeAct = null;
				MetronomeInAct = null;

				if (ready) {
					if (tick) {
						clearTimeout (tick);
						tick = null;
					}

					if (audioContext) {
						var now = audioContext.currentTime;
						osc.stop (now);

						amp.disconnect ();
						osc.disconnect ();

						audioContext = null;

						ready = false;
					}
				}

				if (q.body) {
					q.body.parentNode.removeChild ( q.body );
					q.body = null;
				}

				q.app = null;
			};

			function _make_ui ( q ) {
				var el_drawer = d.createElement ('div');
				el_drawer.className = 'pk_row';

				el_drawer.innerHTML = '<div class="pk_row">'+
					'<label>BPM</label>'+
					'<input type="range" min="20" max="300" class="pk_horiz" step="1" value="120" />'+
					'<span class="pk_val">120</span>'+
					'</div>'+

					'<div class="pk_row">'+
					'<label>Volume</label>'+
					'<input type="range" min="0.0" max="1.0" class="pk_horiz" step="0.1" value="0.5" />'+
					'<span class="pk_val">50%</span>'+
					'</div>'+

					'<div class="pk_row">'+
			    	'<input type="checkbox" id="xxcjgs" class="pk_check" checked name="metroAccent">'+
					'<label for="xxcjgs">Accentuate metronome click</label></div>' + 

					'<div class="pk_row">'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Metronome</a>'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Track</a>'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Both</a>'+
					'</div>';

				q.body = el_drawer;
				q.el.appendChild ( el_drawer );
			};

			function _make_evs ( q ) {
				  var range = q.body.getElementsByClassName('pk_horiz')[0];
				  var span  = q.body.getElementsByClassName('pk_val')[0];

				  var range2 = q.body.getElementsByClassName('pk_horiz')[1];
				  var span2  = q.body.getElementsByClassName('pk_val')[1];

				  var checkbox = q.body.getElementsByClassName('pk_check')[0];

				  range.oninput = function() {
				  	bpm = (range.value/1);
					span.innerHTML = bpm;

					time = ((60.0 / bpm) * 1000) >> 0;
				  };

				  range2.oninput = function() {
				  	var val = (range2.value/1);
				  	volume = val;

					span2.innerHTML = ((val*100) >> 0) + '%';
				  };

				  checkbox.oninput = function() {
				  	accentuate = checkbox.checked;
				  };

				var metronome_btn = q.body.getElementsByClassName ('pk_modal_a_bottom')[0];
				var play_btn      = q.body.getElementsByClassName ('pk_modal_a_bottom')[1];
				var both_btn      = q.body.getElementsByClassName ('pk_modal_a_bottom')[2];

				metronome_btn.onclick = function () {
					if (tick) {
						clearTimeout (tick);
						tick = null;
						count = 0;

						q.app.fireEvent ('DidStopMetro');
						return ;
					}

					var play = function () {
						tick = setTimeout (function() {
							if (!tick) return ;

							if (++count % 4 === 0)
								_metronome (1);
							else
								_metronome (0);

							play ();
						}, time);
					};

					count = 0;
					if (!ready) _prepare ();

					q.app.fireEvent ('DidStartMetro');

					_metronome (1);
					play ();
				};

				MetronomeInAct = function() {
					metronome_btn.classList.remove ('pk_act');
				};
				MetronomeAct = function() {
					metronome_btn.classList.add ('pk_act');
				};
				q.app.listenFor ('DidStartMetro', MetronomeAct);
				q.app.listenFor ('DidStopMetro', MetronomeInAct);

				play_btn.onclick = function () {
					if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
						q.app.fireEvent ('RequestStop');
					}
					else {
						q.app.fireEvent ('RequestPlay');
					}
				};
				if (!PKAudioEditor.engine.wavesurfer.isReady)
				{
					play_btn.className += ' pk_inact';
					both_btn.className += ' pk_inact';
				}

				if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
					play_btn.className += ' pk_act';
				}

				DidStopPlay = function() {
					play_btn.classList.remove ('pk_act');
					play_btn.innerText = 'Play Track';
				};
				DidPlay = function() {
					play_btn.classList.add ('pk_act');
					play_btn.innerText = 'Stop Track';
				};
				q.app.listenFor ('DidStopPlay', DidStopPlay);
				q.app.listenFor ('DidPlay', DidPlay);

				both_btn.onclick = function () {
					if (tick) metronome_btn.onclick ();
					if (PKAudioEditor.engine.wavesurfer.isPlaying()) play_btn.onclick ();

					setTimeout(function() {
						if (!tick && !PKAudioEditor.engine.wavesurfer.isPlaying())
						{
							play_btn.onclick ();
							setTimeout(function(){
								metronome_btn.onclick ();
							},0);
						}
					},66);
				};
			};

			function _metronome ( type ) {
				if (type === 1 && accentuate) {
					osc.frequency.value = 880.0;
				} else {
					osc.frequency.value = 440.0;
				}

				amp.gain.setValueAtTime (amp.gain.value, audioContext.currentTime);
				amp.gain.linearRampToValueAtTime (volume, audioContext.currentTime + 0.01);
				amp.gain.linearRampToValueAtTime (0.0, audioContext.currentTime + 0.12);
			};

			function _prepare () {
				audioContext = new (window.AudioContext || window.webkitAudioContext)();

				osc = audioContext.createOscillator ();
				amp = audioContext.createGain();
				amp.gain.value = 0;

				osc.connect (amp);
				amp.connect (audioContext.destination);

				osc.start (0);

				ready = true;
				// osc.stop( time + 0.05 );
			};
		};

		var TempoTap = function ( app, modal ) {
			var q = this;
			q.app = app;

			var DidStopPlay = null;
			var DidPlay = null;
			var DidSetLoop = null;
			var DidAudioProcess = null;

			q.Init = function ( container ) {
				var q = this;

				q.el = container;

				_make_ui ( q );
				_make_evs ( q );
			};

			q.Destroy = function () {
				q.app.stopListeningFor ('DidStopPlay', DidStopPlay);
				q.app.stopListeningFor ('DidPlay', DidPlay);
				q.app.stopListeningFor ('DidSetLoop', DidSetLoop);
				q.app.stopListeningFor ('DidAudioProcess', DidAudioProcess);

				DidStopPlay = null;
				DidPlay = null;
				DidSetLoop = null;
				DidAudioProcess = null;

				q.app.ui.KeyHandler.removeCallback ('tmpTap');

				if (q.body) {
					q.body.parentNode.removeChild ( q.body );
					q.body = null;
				}

				q.app = null;
			};

			function _make_ui ( q ) {
				var el_drawer = d.createElement ('div');
				el_drawer.className = 'pk_row';

				// Estimate tempo for selected area button
				el_drawer.innerHTML = '<div class="pk_row pk_pgeq_els">' + 
					'<span>Average BPM</span>'+
					'<input style="margin-left:2px;min-width:64px;max-width:64px" '+
					'type="text" class="pk_val pk_gain" value="-">'+
					'</div>'+

					'<div class="pk_row pk_pgeq_els">'+
					'<span>Nearest BPM</span>'+
					'<input style="margin-left:2px;min-width:64px;max-width:64px" '+
					'type="text" class="pk_val pk_gain" value="-">'+
					'</div>'+

					'<div class="pk_row pk_pgeq_els">'+
					'<span>Timing Taps</span>'+
					'<input style="margin-left:2px;min-width:64px;max-width:64px" '+
					'type="text" class="pk_val pk_gain" value="-">'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Reset</a>'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Track</a>'+
					'<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Loop</a>'+
					'</div>'+

					'<div><div id="pk_tmp_tap">'+
					'<span style="opacity:0" class="pk_obj2">CLEARED...</span>'+
					'<span class="pk_obj2">STAND BY...</span>'+
					'</div>'+

					'<div id="pk_tmp_tap2" style="position:relative">'+
					'<canvas width="1000" height="200" style="image-rendering:pixelated;width:500px;height:100px;display:block;background:#000"></canvas>'+
					'<span style="z-index:3;background:red;position:absolute;display:block;width:2px;height:100px;'+
					'left:50%;margin-left:-1px;top:0"></span>'+
					'</div></div>'+

					'<div id="pk_tmp_tap3">'+
					'<span style="position:absolute;top:50%;display:block;width:80%;left:10%;font-size:12px;'+
					'margin-top:-20px;user-select:none;text-align:center;pointer-events:none;color:#ccc">'+
					'Tap in this area, or hit [SPACE] rhythmically, to measure BPM.'+
					'</span>'+
					'</div>';

				q.body = el_drawer;
				q.el.appendChild ( el_drawer );
			};

			function _make_evs ( q ) {
				var tap_graph = q.body.querySelectorAll('#pk_tmp_tap')[0];
				var tap_area  = q.body.querySelectorAll('#pk_tmp_tap3')[0];
				var reset_btn = q.body.getElementsByClassName ('pk_modal_a_bottom')[0];
				var play_btn  = q.body.getElementsByClassName ('pk_modal_a_bottom')[1];
				var loop_btn  = q.body.getElementsByClassName ('pk_modal_a_bottom')[2];

				var canvas    = q.body.getElementsByTagName('canvas')[0];
				var ctx       = canvas.getContext('2d', {alpha:false,antialias:false});

				var tempCanvas = document.createElement('canvas');
				tempCanvas.width = 500 * 2;
				tempCanvas.height = 100 * 2;
				var tempCtx = tempCanvas.getContext ('2d', {alpha:false,antialias:false});

				ctx.imageSmoothingEnabled = true;
				tempCtx.imageSmoothingEnabled = true;

				var value_els = q.body.getElementsByClassName ('pk_val');
				var tap_msg   = tap_graph.getElementsByClassName ('pk_obj2');
				var tap_msg2  = tap_area.getElementsByTagName('span')[0];

				var bpm_el       = value_els[ 0 ];
				var bpm_el_round = value_els[ 1 ];
				var bpm_el_count = value_els[ 2 ];
				var reset_wait   = 3000;

				var time_msec = 0;
				var time_msec_prev = 0;
				var time_msec_first = 0;
				var count = 0;
				var bpm = 0;
				var steps_count = 0;
				var first = true;
				var is_playing = false;

				var _reset_count = function ( force ) {
					if (first) {
						tap_msg[1].style.opacity = '0';
					}

					count = 0;
					steps_count = 0;
					first = true;

					setTimeout(function() {
						if (!first) return ;

					  	tap_msg[0].style.opacity = '0.5';
						if (!force) {
							reset_btn.className += ' pk_act';
						  	setTimeout(function() {
									reset_btn.classList.remove ('pk_act');
							},140);
						}

					  	setTimeout(function() {
					  		if (first) {
					  			tap_msg[0].style.opacity = '0';
					  			tap_msg[1].style.opacity = '0.5';
					  		} else {
					  			tap_msg[0].style.opacity = '0';
					  			tap_msg[1].style.opacity = '0';
					  		}
					  	}, force ? 490 : 874);
					}, (force ? 0 : 150));

					if (force)
					{
						bpm_el.value       = '-';
						bpm_el_round.value = '-';
						bpm_el_count.value = '-';

						var els = tap_graph.parentNode.getElementsByClassName('pk_obj');
						var l = els.length;

						while (l-- > 0) {
							if (els[l]) {
								els[l].parentNode.removeChild (els[l]);
							}
						}
					}
				};

				reset_btn.onclick = function () {
					_reset_count (true);
				};

				play_btn.onclick = function () {
					if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
						q.app.fireEvent ('RequestStop');
					}
					else {
						q.app.fireEvent ('RequestPlay');
					}
				};

				if (!PKAudioEditor.engine.wavesurfer.isReady)
				{
					play_btn.className += ' pk_inact';
					loop_btn.className += ' pk_inact';
				}
				if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
					play_btn.className += ' pk_act';
				}

				DidStopPlay = function() {
					is_playing = false;
					play_btn.classList.remove ('pk_act');
					play_btn.innerText = 'Play Track';
				};
				DidPlay = function() {
					is_playing = true;
					play_btn.classList.add ('pk_act');
					play_btn.innerText = 'Stop Track';
				};

				q.app.listenFor ('DidStopPlay', DidStopPlay);
				q.app.listenFor ('DidPlay', DidPlay);

				var old_left_time  = -999999;
				var old_right_time = -999999;
				var peaks          = [];
				var skipp = false;
				var remaining = 0;

				DidAudioProcess = function() {
					//if (skipp) {
					//	skipp = false;
					//	return ;
					//}
					//skipp = true;

					var wv = PKAudioEditor.engine.wavesurfer;
					var buffer = wv.backend.buffer;
					var chan_data = buffer.getChannelData ( 0 );
					var sample_rate = buffer.sampleRate;

					var curr_time = wv.getCurrentTime ();
					var width = 500;
					var height = 100;
					var half_height = (height / 2) * 2;
					var new_width = width;
					var cached_index = 0;
					var pixels = 0;
					var raw_pixels = 0;
					var limit = 3;

					var left_time = curr_time - (limit/2);
					var right_time = curr_time + (limit/2);
					var quick_render = false;

					var start_offset = (left_time * sample_rate) >> 0;
					var end_offset   = ((left_time + limit) * sample_rate) >> 0;
					var length       = end_offset - start_offset;
					var mod          = (length / width) >> 0;

					if (left_time < old_right_time)
					{
						// find pixels
						var diff   = right_time - old_right_time;
						// pixels = Math.round ( (diff / limit) * width);

						raw_pixels = ( (diff / limit) * width);
						pixels = Math.round ( raw_pixels );

						raw_pixels = ((raw_pixels*1000) >> 0)/1000;

						if (pixels >= 0) {
							if (pixels === 0) return ;

							new_width = pixels;

							start_offset = (old_right_time * sample_rate) >> 0;
							end_offset   = (right_time * sample_rate) >> 0;
							length       = end_offset - start_offset;
							mod          = (length / pixels) >> 0;

							peaks = peaks.slice (pixels * 2);
							cached_index = width - pixels;

							quick_render = true;
						}
					}

					old_right_time = right_time;

					var max   = 0;
					var min   = 0;

					for (var i = 0; i < new_width; ++i) {
						var new_offset = start_offset + (mod * i);

						max = 0;
						min = 0;

						if (new_offset >= 0)
						{
							for (var j = 0; j < mod; j += 3) {
								if ( chan_data[ new_offset + j] > max ) {
									max = chan_data[ new_offset + j];
								}
								else if ( chan_data[ new_offset + j] < min ) {
									min = chan_data[ new_offset + j];
								}
							}
						}

						peaks[2 * (i + cached_index)] = max;
						peaks[2 * (i + cached_index) + 1 ] = min;
					}

					if (quick_render)
					{
						// var imgdata = ctx.getImageData(0, 0, width, height);
						// tempCtx.putImageData (imgdata, 0, 0);
						tempCtx.drawImage (canvas, 0, 0); //, width, height, 0, 0, width, height);
					}

					ctx.fillStyle = "#000";
					// ctx.clearRect( 0, 0, width, height );
					ctx.fillRect ( 0, 0, width * 2, height * 2 );
					ctx.fillStyle = '#99c2c6';

					if (quick_render)
					{
						var forward = Math.round (raw_pixels * 2);
						remaining += forward - raw_pixels * 2;
						if (remaining > 1) {
							forward -= 1;
							remaining = 0;
						}

						// ctx.translate(-1.5, 0);
						ctx.translate (-forward, 0);
						ctx.drawImage (tempCanvas, 0, 0); //, width, height, 0, 0, width, height);
						ctx.setTransform (1, 0, 0, 1, 0, 0);

//						ctx.drawImage (tempCanvas, 0, 0, width, 100, -(raw_pixels.toFixed(1)/1), 0, width, 100);


			            ctx.beginPath ();

			            var peak = peaks[ (width - pixels - 2) * 2];
			            var _h = Math.round (peak * half_height);
			            ctx.moveTo ( (width - pixels - 2) * 2, half_height - _h);

						for (var i = (width - pixels - 1); i < width; ++i) {
							peak = peaks[i * 2];
							_h = Math.round (peak * half_height);
							ctx.lineTo ( i* 2, half_height - _h);
						}

						for (var i = width - 1; i >= (width - pixels - 1); --i) {
							var peak = peaks[ (i * 2) + 1];
							var _h = Math.round (peak * half_height);
							ctx.lineTo ( i* 2, half_height - _h);
						}

						ctx.closePath();
						ctx.fill();
					}
					else
					{
			            ctx.beginPath ();
			            ctx.moveTo ( 0, half_height );

						for (var i = 0; i < width; ++i) {
							var peak = peaks[i * 2];
							var _h = Math.round (peak * half_height);
							ctx.lineTo ( i * 2, half_height - _h);
						}

						for (var i = width - 1; i >= 0; --i) {
							var peak = peaks[ (i * 2) + 1];
							var _h = Math.round (peak * half_height);
							ctx.lineTo ( i * 2, half_height - _h);
						}

						ctx.closePath();
						ctx.fill();
					}

					//console.log( peaks );

				};

				q.app.listenFor ('DidAudioProcess', DidAudioProcess); 

				if (PKAudioEditor.engine.wavesurfer.regions.list[0])
				{
					if (PKAudioEditor.engine.wavesurfer.regions.list[0].loop)
						loop_btn.className += ' pk_act';
				}
				loop_btn.onclick = function() {
					q.app.fireEvent('RequestSetLoop');
				};

				DidSetLoop = function( val ) {
					val ? loop_btn.classList.add('pk_act') :
						  loop_btn.classList.remove('pk_act');
				};
				q.app.listenFor('DidSetLoop', DidSetLoop);

				tap_graph.parentNode.addEventListener ('transitionend', function ( e ) {
				  if (!tap_graph) return ;

				  var el = e.target;
				  if (el.tagName !== 'DIV') return ;

				  el.parentNode.removeChild ( el );
				  --steps_count;

				  if (steps_count === 0) {

				  	if (is_playing)
				  		setTimeout(function() {
				  			if (steps_count === 0)
				  				_reset_count ();
				  		},1100);
				  	else
				  		_reset_count ();
				  }
				});

				tap_area.onclick = function ( ev ) {
					if (ev) {
						ev.preventDefault ();
						ev.stopPropagation ();
					}

					if (first) {
						first = false;
						tap_msg[1].style.opacity = '0';
					}

					time_msec = Date.now ();

					if ((time_msec - time_msec_prev) > reset_wait) {
						count = 0;
					}

					if (count === 0)
					{
						time_msec_first = time_msec;
						count = 1;

						bpm_el.value       = 'First Beat';
						bpm_el_round.value = 'First Beat';
						bpm_el_count.value = count;
					}
					else
					{
						bpm = 60000 * count / (time_msec - time_msec_first);
						++count;

						bpm_el.value       = Math.round (bpm * 100) / 100;
						bpm_el_round.value = Math.round (bpm);
						bpm_el_count.value = count;
					}

					var step = document.createElement ('div');
					step.className = 'pk_obj';

					if (is_playing) {
						canvas.parentNode.appendChild (step);
					}
					else {
						tap_graph.appendChild (step);
					}
					++steps_count;

					tap_area.classList.add ('pk_act');

					requestAnimationFrame(function() {
						step.style.transform = 'translate3d(-10%,0,0)';

						setTimeout(function() {
							tap_area.classList.remove ('pk_act');
						},56);
					});

					time_msec_prev = time_msec;
				};

				app.ui.KeyHandler.addCallback ('tmpTap', function ( e, o, ev ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
					
					ev.preventDefault ();
					ev.stopPropagation ();

					tap_area.onclick (null);
				}, [32]);

				// ---
			};
		};


		// events
		var TempoEstimation = function ( app, modal ) {
			var q = this;
			q.app = app;

			q.Init = function ( container ) {
				var q = this;

				q.el = container;

				_make_ui ( q );
				_make_evs ( q );
			};

			q.Destroy = function () {
				if (q.body) {
					q.body.parentNode.removeChild ( q.body );
					q.body = null;
				}

				q.app = null;
			};

			q.Est = function ( selection ) {
				var q = this;

				var wavesurfer = q.app.engine.wavesurfer;
				var buffer     = wavesurfer.backend.buffer;

				var starting_time = 20.375;
				var ending_time   = wavesurfer.getDuration ();
				var sample_rate   = buffer.sampleRate;

				var look_ahead    = 10 * sample_rate;
				var offset_rate   = starting_time * sample_rate;
				var duration_rate = ending_time * sample_rate;
				var dist_rhythm   = {};

				// now run offline 
				var audio_ctx = getOfflineAudioContext (
						1,
						buffer.sampleRate,
						buffer.length
				);

				var source = audio_ctx.createBufferSource ();
				source.buffer = buffer;

                var filter = audio_ctx.createBiquadFilter ();
                filter.type = 'highpass';
                filter.frequency.value = 50;
                filter.Q.value = 1.1;
                source.connect (filter);

                var filter2 = audio_ctx.createBiquadFilter ();
                filter2.type = 'lowpass';
                filter2.frequency.value = 140;
                filter2.Q.value = 2.5;
                filter.connect (filter2);
                filter2.connect (audio_ctx.destination);

				source.start (0);

				var offline_callback = function( rendered_buffer ) {
					_pass ( rendered_buffer, offset_rate, duration_rate );
				};

				var _pass = function ( rendered_buffer, offset, duration ) {

					var chan_data = rendered_buffer.getChannelData ( 0 );
					var new_arr = [];
					var diff_arr = [];
	                var currval = 0;
	                var prev_val = 0;
	                var bottom = 100000;
	                var top = -100000;
	                var found_pick = false;
	                var going_up = false;
	                var peak_dist = 0;
	                var peak_prev = 0;
	                var next_offset = offset + look_ahead;

					var trimmed_arr = [];
					var modulus_coefficient = Math.round (look_ahead / 200);
					var plus_one = look_ahead + modulus_coefficient;

					for (var i = 0; i < plus_one; ++i) {
						if (i % modulus_coefficient === 0) {

							// look into 50 neighboring entries for higher values.
							var val_clean = chan_data[ offset + i ];
							var val = Math.abs (val_clean);

							//console.log( "was ", val_clean );

							var tmp_val = 0;
							for (var uu = 1; uu < 50; ++uu) {
								tmp_val = Math.abs (chan_data[ offset + i - uu ]);

								if (tmp_val > val) {
									val_clean = chan_data[ offset + i - uu ];
									val = Math.abs (val_clean);
								}
							}

							for (var uu = 1; uu < 50; ++uu) {
								tmp_val = Math.abs (chan_data[ offset + i + uu ]);

								if (tmp_val > val) {
									val_clean = chan_data[ offset + i + uu ];
									val = Math.abs (val_clean);
								}
							}

							//console.log( "added ", val_clean );
							//console.log("-----");

							trimmed_arr.push ( val_clean );
						}
					}

					trimmed_arr = _normalize_array2 (trimmed_arr);
					trimmed_arr.pop ();

					// ------------
					prev_val = trimmed_arr[0];
					for (var j = 1; j < trimmed_arr.length; ++j) {
						currval = trimmed_arr[j];

						if (currval > prev_val) {

               				if (!going_up) {
               					if (bottom > prev_val) {
               						bottom = prev_val;
               						top = -100000;
               					}
               				}

               				going_up = true;
						}
               			else if (currval < prev_val ) {

               				if (going_up) {

               					// console.log (":: peak: ", prev_val.toFixed(2)/1, "  bottom: ", bottom.toFixed(2)/1, "  diff: ", Math.abs(prev_val-bottom).toFixed(2)/1 );

               					found_pick = true;

               					if (peak_dist < 3 && Math.abs (new_arr[peak_prev] - prev_val) < 150) {
               						// debugger;

               						if (prev_val > new_arr[peak_prev]) {
               							new_arr[peak_prev] = 0;
               							diff_arr.pop ();
               						}
               						else {
               							found_pick = false;
               						}
               					}

               					if (found_pick) {
               						diff_arr.push (Math.abs (prev_val - bottom));

               						peak_dist = 0;
               						new_arr.push ( prev_val );

               						peak_prev = new_arr.length - 1;

               						if (prev_val > top) {
               							top = prev_val;
               							bottom = 100000;
               						}
               					}
               					// -----
               				}

               				going_up = false;
               			}

               			prev_val = currval;

						if (!found_pick) {
							new_arr.push ( 0 );
							//console.log( "ZEROED ", new_arr.length - 1 );
							++peak_dist;
						}
						else {
							found_pick = false;
						}
					}

					// console.log( trimmed_arr );
					// console.log( new_arr );
					// window.trimmed_arr = trimmed_arr;
					// window.new_arr = new_arr;
					// window.chan = chan_data;

					// ----
                    var ret = _group_rhythm ( new_arr, diff_arr );
                    if (!ret) {
                    	console.log ("something weird happened, error 244");
                    	return ;
                    }

                    var distances = ret[0];

                    // console.log( diff_arr );
                    // console.log( ret[1] );

                    for (var k in distances) {
                    	if (!dist_rhythm[ k ]) dist_rhythm[ k ] = 0;

                    	dist_rhythm[ k ] += distances[ k ];
                    }

                     
                    console.log ( distances );
                    // console.log( ' ---------------- ' );
                    // console.log ('--------- END OF PASS -------  ',  offset, ' / ', duration);

                    if (next_offset + look_ahead >= duration) {

                    	 // Done... 
                    	 console.log ( dist_rhythm );
                    } else {
                   // 	_pass ( rendered_buffer, next_offset, duration );
                    }
                    // ----
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

			function _make_ui ( q ) {
				var el_drawer = d.createElement ('div');
				el_drawer.className = 'pk_row';

				// Estimate tempo for selected area button
				el_drawer.innerHTML = '<div class="pk_row">' + 
				'<input type="radio" class="pk_check" id="tt4" name="xport" checked value="whole">'+
				'<label for="tt4">Whole track</label>'+
				'<input type="radio" class="pk_check" id="tt5" name="xport" value="sel">'+
				'<label class="pk_lblmp3" for="tt5">Estimate for Selection Only</label></div>' +
				'<div class="pk_row">' + 
				'<a class="pk_modal_a_bottom" style="margin:0;float:left">Estimate</a>'+
				'</div>';

				q.body = el_drawer;
				q.el.appendChild ( el_drawer );
			};

			function _make_evs ( q ) {
				var btn_est = q.body.getElementsByTagName ('a')[0];
				if (!btn_est) return ;

				btn_est.onclick = function () {
					q.Est && q.Est (1);
					// q.app && q.app.fireEvent ('ReqEst', 1);
				};
			};
		};

		var x = new PKAudioFXModal ({
			id: filter_id,
			title: 'Tempo & Rhythm Tools',

			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
				act_tool.Destroy ();
				act_tool = null;

				app.fireEvent ('RequestStop');
			},

			body: '<div class="pk_tbs">' +
				'<a class="pk_tbsa pk_inact">Tempo Estimation</a>' +
				'<a class="pk_tbsa">Tempo Tap</a>' +
				'<a class="pk_tbsa">Metronome</a></div>',

//			buttons: [{
//				title:'Apply EQ',
//				clss:'pk_modal_a_accpt',
//				callback: function( q ) {
//					q.Destroy ();
//				}
//			}],

			setup:function( q ) {
					var toplinks = q.el_body.getElementsByClassName('pk_tbsa');

					var destroy = function () {
						if (act_tool) {
							act_tool.Destroy ();
							act_tool = null;
							toplinks[act_index].classList.remove('pk_act');
						}
					};

					var activate = function () {
						// get the active state
						if (act_index === 0) {
							// toplinks[0].className += ' pk_act';
							// act_tool = new TempoEstimation ( app, q );
							return ;
						}
						else if (act_index === 1) {
							toplinks[1].className += ' pk_act';
							act_tool = new TempoTap ( app, q );
						}
						else if (act_index === 2) {
							toplinks[2].className += ' pk_act';
							act_tool = new TempoMetro ( app, q );
						}

						act_tool && act_tool.Init ( q.el_body );
					};

					//toplinks[0].onclick = function() {
					//	destroy ();
					//	act_index = 0;
					//	activate ();
					//};
					toplinks[1].onclick = function() {
						if (act_index === 1) return ;

						destroy (); act_index = 1;
						activate ();
					};
					toplinks[2].onclick = function() {
						if (act_index === 2) return ;

						destroy (); act_index = 2;
						activate ();
					};

					activate ();

					// ---
					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
			}
		}, app);

		x.Show ();
		// ------
	};


	PKAudioEditor._deps.FxTMP = TempoToolsModal;


	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////
	var RecModal = function ( app ) {
		var filter_id = 'rec_tools';

		var audio_stream = null;
		var audio_context = null;
		var script_processor = null;
		var media_stream_source = null;
		var temp_buffers = []
		var newbuff = null;
		var sample_rate = 44100;
		var buffer_size = 2048; // * 2 ?
		var channel_num = 1;
		var channel_num_out = 1;

		var stop_audio = function () {
			if (!audio_stream) return ;

			audio_stream.getTracks().forEach(function (stream) {
				stream.stop ();
			});

			if (script_processor) {
				script_processor.onaudioprocess = null;
			}
			media_stream_source && media_stream_source.disconnect ();
			script_processor && script_processor.disconnect ();
			media_stream_source = null;
			audio_stream = null; audio_context = null;
		};

		var x = new PKAudioFXModal ({
			id: filter_id,
			title: 'New Recording',

			ondestroy: function ( q ) {
				// destroy audio...
				stop_audio ();

				temp_buffers = [];
				newbuff = null;

				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);

				app.fireEvent ('RequestStop');
			},

			body: '<div class="pk_rec" style="user-select:none">' +
				'<div class="pk_row">' +
				  '<label>Devices:</label>' +
				  '<select style="max-width:220px"></select>' +
				'</div>' +
				'<div class="pk_row">' +

				  '<div style="float:left"><label>Volume</label>' +
				  '<canvas width="200" height="40"></canvas></div>' +

				  '<div style="float:left;margin-left:20px;"><label>Time</label>' +
				  '<span style="font-size: 24px;line-height: 50px;">0.0</span></div>' +
				  '<div style="clear:both;height:10px"></div>' +
				  '<div><label>Waveform</label><canvas width="1000" height="200" style="image-rendering:pixelated;width:500px;height:100px;display:block;background:#000"></canvas></div>'+
				'</div>' +
				'<div class="pk_row">' +
				  '<a class="pk_tbsa pk_inact" style="text-align: center;">START RECORDING</a>' +
				  '<a class="pk_tbsa pk_inact" style="margin-left: 24px; text-align: center;">PAUSE</a>' +
				'</div>' +
				'<div class="pk_row">' +
					'<a class="pk_tbsa" style="float:left;display:none;text-align:center;box-shadow:0 0 7px #3a6b79 inset;">OPEN RECORDING</a>' +
					'<a class="pk_tbsa" style="float:left;display:none;margin-left: 24px; text-align: center;">APPEND TO EXISTING</a>' +
				'</div>' +
				'</div>',

//			buttons: [{
//				title:'Apply EQ',
//				clss:'pk_modal_a_accpt',
//				callback: function( q ) {
//					q.Destroy ();
//				}
//			}],

			setup:function( q ) {
					var is_ready = false;
					var is_active = false;
					var is_paused = false;
					var has_recorded = false;

					var mainbtns = q.el_body.getElementsByClassName('pk_tbsa');
					var btn_start = mainbtns[0];
					var btn_pause = mainbtns[1];
					var btn_open  = mainbtns[2];
					var btn_add   = mainbtns[3];
					var time_span = q.el_body.getElementsByTagName('span')[0];
					var devices_sel = q.el_body.getElementsByTagName('select')[0];
					var devices = [];
					var volcanvas = q.el_body.getElementsByTagName('canvas')[0];
					var volctx = volcanvas.getContext('2d', {alpha:false,antialias:false});

					var freqcanvas = q.el_body.getElementsByTagName('canvas')[1];
					var freqctx = freqcanvas.getContext('2d', {alpha:false,antialias:false});
					var tempCanvas = document.createElement('canvas');
					tempCanvas.width = 500 * 2;
					tempCanvas.height = 100 * 2;
					var tempCtx = tempCanvas.getContext ('2d', {alpha:false,antialias:false});


					var first_skip = 12;
					var curr_offset = 0;
					var temp_buffer_index = -1;
					var volume = 0;
					var currtime = 0;
					var has_devices = false;

					var old_left_time  = -999999;
					var old_right_time = -999999;
					var peaks          = [];
					var skipp = false;
					var remaining = 0;
					var debounce = false;

					temp_buffers = [];
					newbuff = null;

					var draw_volume = function () {
						volctx.fillStyle = "#000";
						volctx.fillRect(0,0,200,40);

						if (!is_active) {
							return ;
						}

						volctx.fillStyle = "green";
						volctx.fillRect(0, 0, volume*200*1.67, 40);

						time_span.innerText = ((currtime * 10) >> 0) / 10;

						window.requestAnimationFrame( draw_volume );
					};

					var fetchBufferFunction = function (ev) {
						if (first_skip > 0) {
							--first_skip;
							return ;
						}

						if (is_paused) {
							return ;
						}

						curr_offset += ev.inputBuffer.duration * sample_rate;
						var float_array = ev.inputBuffer.getChannelData (0).slice (0);
						temp_buffers[ ++temp_buffer_index ]  = float_array;

						var sum = 0;
						var x;

						for (var i = 0; i < buffer_size; i += 2) {
							x = float_array[i];
							sum += x * x;
						}

						var rms =  Math.sqrt(sum / (buffer_size / 2) );
						volume = Math.max(rms, volume * 0.9);


						var curr_time = (temp_buffer_index * buffer_size) / sample_rate;
						currtime = curr_time;
						var width = 500;
						var height = 100;
						var half_height = (height / 2) * 2;
						var new_width = width;
						var cached_index = 0;
						var pixels = 0;
						var raw_pixels = 0;
						var limit = 3;

						var left_time = curr_time - limit;
						var right_time = curr_time; // + (limit/2);
						var quick_render = false;

						var start_offset = (left_time * sample_rate) >> 0;
						var end_offset   = ((left_time + limit) * sample_rate) >> 0;
						var length       = end_offset - start_offset;
						var mod          = (length / width) >> 0;

						if (left_time < old_right_time)
						{
							// find pixels
							var diff   = right_time - old_right_time;
							// pixels = Math.round ( (diff / limit) * width);

							raw_pixels = ( (diff / limit) * width);
							pixels = Math.round ( raw_pixels );

							raw_pixels = ((raw_pixels*1000) >> 0)/1000;

							if (pixels >= 0) {
								if (pixels === 0) return ;

								new_width = pixels;

								start_offset = (old_right_time * sample_rate) >> 0;
								end_offset   = (right_time * sample_rate) >> 0;
								length       = end_offset - start_offset;
								mod          = (length / pixels) >> 0;

								peaks = peaks.slice (pixels * 2);
								cached_index = width - pixels;

								quick_render = true;
							}
						}

						old_right_time = right_time;

						var max   = 0;
						var min   = 0;

						for (var i = 0; i < new_width; ++i)
						{
							var new_offset = start_offset + (mod * i);

							max = 0;
							min = 0;

							if (new_offset >= 0)
							{
								for (var j = 0; j < mod; j += 3) {
									var temp = new_offset + j;
									var temp2 = (temp/2048) >> 0;
									var temp3 = temp % 2048;

									if (!temp_buffers[temp2]) continue;

									if ( temp_buffers[temp2][ temp3 ] > max ) {
										max = temp_buffers[temp2][ temp3 ];
									}
									else if ( temp_buffers[temp2][ temp3 ] < min ) {
										min = temp_buffers[temp2][ temp3 ];
									}
								}
							}

							peaks[2 * (i + cached_index)] = max;
							peaks[2 * (i + cached_index) + 1 ] = min;
						}

						if (quick_render)
						{
							// var imgdata = ctx.getImageData(0, 0, width, height);
							// tempCtx.putImageData (imgdata, 0, 0);
							tempCtx.drawImage (freqcanvas, 0, 0); //, width, height, 0, 0, width, height);
						}

						freqctx.fillStyle = "#000";
						// freqctx.clearRect( 0, 0, width, height );
						freqctx.fillRect ( 0, 0, width * 2, height * 2 );
						freqctx.fillStyle = '#99c2c6';

						if (quick_render)
						{
							var forward = Math.round (raw_pixels * 2);
							remaining += forward - raw_pixels * 2;
							if (remaining > 1) {
								forward -= 1;
								remaining = 0;
							}

							// freqctx.translate(-1.5, 0);
							freqctx.translate (-forward, 0);
							freqctx.drawImage (tempCanvas, 0, 0); //, width, height, 0, 0, width, height);
							freqctx.setTransform (1, 0, 0, 1, 0, 0);

	//						freqctx.drawImage (tempCanvas, 0, 0, width, 100, -(raw_pixels.toFixed(1)/1), 0, width, 100);


				            freqctx.beginPath ();

				            var peak = peaks[ (width - pixels - 2) * 2];
				            var _h = Math.round (peak * half_height);
				            freqctx.moveTo ( (width - pixels - 2) * 2, half_height - _h);

							for (var i = (width - pixels - 1); i < width; ++i) {
								peak = peaks[i * 2];
								_h = Math.round (peak * half_height);
								freqctx.lineTo ( i* 2, half_height - _h);
							}

							for (var i = width - 1; i >= (width - pixels - 1); --i) {
								var peak = peaks[ (i * 2) + 1];
								var _h = Math.round (peak * half_height);
								freqctx.lineTo ( i* 2, half_height - _h);
							}

							freqctx.closePath();
							freqctx.fill();
						}
						else
						{
				            freqctx.beginPath ();
				            freqctx.moveTo ( 0, half_height );

							for (var i = 0; i < width; ++i) {
								var peak = peaks[i * 2];
								var _h = Math.round (peak * half_height);
								freqctx.lineTo ( i * 2, half_height - _h);
							}

							for (var i = width - 1; i >= 0; --i) {
								var peak = peaks[ (i * 2) + 1];
								var _h = Math.round (peak * half_height);
								freqctx.lineTo ( i * 2, half_height - _h);
							}

							freqctx.closePath();
							freqctx.fill();
						}

					};

					navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function( _stream ) {
						_stream.getTracks().forEach(function (stream) {
							stream.stop ();
						});

						enumerate ();
					}).catch(function(error) {
						alert("no microphone permissions found!");
					});

					var enumerate = function () {
						if (navigator.mediaDevices.enumerateDevices) {
							navigator.mediaDevices.enumerateDevices().then((devices) => {
							  devices = devices.filter((d) => d.kind === 'audioinput');
							  has_devices = true;

							  var len = devices.length;
							  for (var i = 0; i < len; ++i) {
							  		var el = document.createElement('option');
							  		el.value = devices[i].deviceId;
							  		el.innerText = devices[i].label;
							  		devices_sel.appendChild (el);
							  }

							  is_ready = true;
							  btn_start.classList.remove ('pk_inact');
							});
						}
						else {
							devices_sel.parentNode.style.display = 'none';
							has_devices = false;
							is_ready = true;
							btn_start.classList.remove ('pk_inact');
						}
					};

					var stop = function () {
						stop_audio ();

						is_active = false;
						is_paused = false;
						first_skip = 10;

						++temp_buffer_index;
						var k = -1;
						newbuff = new Float32Array (temp_buffer_index * buffer_size);
						for (var i = 0; i < temp_buffer_index; ++i)
						{
							for (var j = 0; j < buffer_size; ++j)
							{
								newbuff[++k] = temp_buffers[i][j];
							}
						}

						temp_buffer_index = -1;
						temp_buffers = [];

						// ------
						btn_open.style.display = 'block';

						// check to see if we are ready
						if (app.engine.is_ready) {
							btn_add.style.display = 'block';
						}

						has_recorded = true;
					};
					// ---

					btn_start.onclick = function () {
						if (!is_ready) return ;

						if (debounce) {
							return ;
						}

						debounce = true;
						setTimeout(function() {
							debounce = false;
						}, 260);

						// check if recording exists - ask for confirmation
						if (has_recorded) {
							if (!window.confirm("Are you sure? This will discard the current recording."))
							{
								return ;
							}
						}


						if (is_active) {
							stop ();

							btn_pause.classList.add ('pk_inact');
							btn_start.innerText = 'START RECORDING';
							btn_start.style.boxShadow = 'none';

							return ;
						}

						temp_buffer_index = -1;
						temp_buffers = [];
						newbuff = null;
						volume = 0;

						btn_open.style.display = 'none';
						btn_add.style.display = 'none';

						audio_context = new (window.AudioContext || window.webkitAudioContext)();
						sample_rate = audio_context.sampleRate;

						var audio_val = true;
						if (has_devices) {
							audio_val = {deviceId: devices_sel.value};
							// devices_sel.options[devices_sel.selectedIndex].value;
						}

						navigator.mediaDevices.getUserMedia({ audio: audio_val }).then(function( stream ) {
							audio_stream = stream;
							media_stream_source = audio_context.createMediaStreamSource ( stream );

			            	script_processor = audio_context.createScriptProcessor (
			                	buffer_size, channel_num, channel_num_out
			                );

			            	media_stream_source.connect ( script_processor );
			            	script_processor.connect ( audio_context.destination );

			            	is_active = true;
			            	btn_pause.classList.remove ('pk_inact');
			            	btn_start.innerText = 'FINISH RECORDING';
			            	btn_start.style.boxShadow = '#992222 0px 0px 6px inset';
			            	script_processor.onaudioprocess = fetchBufferFunction;

			            	draw_volume ();

						}).catch(function(error) {

						});

					};

					btn_pause.onclick = function () {
						if (!is_ready) return ;
						if (!is_active) return ;

						is_paused = !is_paused;

						btn_pause.innerText = is_paused ? 'UN-PAUSE' : 'PAUSE';
					};

					btn_open.onclick = function () {
						if (debounce) {
							return ;
						}

						debounce = true;
						setTimeout(function() {
							debounce = false;
						}, 150);

						app.engine.wavesurfer.backend._add = 0;
						app.engine.LoadDB ({
							samplerate: sample_rate,
							data: [
								newbuff.buffer
							]
						});

						// ----
						q.Destroy ();
					};

					btn_add.onclick = function () {
						if (debounce) {
							return ;
						}

						debounce = true;
						setTimeout(function() {
							debounce = false;
						}, 150);

						app.engine.wavesurfer.backend._add = 1;
						app.engine.LoadDB ({
							samplerate: sample_rate,
							data: [
								newbuff.buffer
							]
						});

						// ----
						q.Destroy ();
					};

					// ---
					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
			}
		}, app);

		x.Show ();
	};

	PKAudioEditor._deps.FxREC = RecModal;

})( window, document, PKAudioEditor );