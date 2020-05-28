(function ( w, d, PKAE ) {
	'use strict';

	var _pid = 0;
	var _aid = 0;

	function FXAutomation ( app, filter_modal, val_cb, preview_cb ) {
		var q = this;

		q.modal = filter_modal;
		q.app  = app;
		q.wv    = app.engine.wavesurfer;
		q.points = {};
		q.act = null;
		q.act_point = null;
		q.in_auto = false;
		q.rbuff = null;

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

				if (q.rbuff)
					q.app.engine.GetWave (q.rbuff, 500, 200, null, null, q.canvas, q.ctx);

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

		// -------
		function _make_controls ( q ) {
			var click_time = 0;
			q.canvas.addEventListener ('click', function ( e ) {
				if (!q.act) return;
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

						//_process ( q, q.wv.backend.buffer );

						q.Render ();
						// ----
				}

				click_time = e.timeStamp;
			}, false);

			var is_dragging = false;
			var skip = 3;
			q.canvas.addEventListener ('mousemove', function ( e ) {
				if (!is_dragging || !q.act_point) return ;

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

				var bounds = q.canvas.getBoundingClientRect ();
				var cw = q.cw;
				var ch = q.ch;

				var posx = ex - bounds.left;
				var posy = ey - bounds.top;

				var rel_x = posx / cw;
				var rel_y = posy / ch;

				q.act_point.ax = posx;
				q.act_point.ay = posy;

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
				q.act_point.val  = ((1 - rel_y) * q.act.max - q.act.min) + q.act.min; 

				q.Render ();

				if (--skip === 0) {
					skip = 4;
					_process ( q, q.wv.backend.buffer );
				}
			});

			q.canvas.addEventListener ('mousedown', function ( e ) {
				is_dragging = false;
				if (!q.act) return ;

				var bounds = q.canvas.getBoundingClientRect ();
				var cw = q.cw;
				var ch = q.ch;

				var posx = e.clientX - bounds.left;
				var posy = e.clientY - bounds.top;

				var dist_x = e.is_touch ? 20 : 10;
				var dist_y = e.is_touch ? 20 : 9;

				if (!q.points[q.act.id]) q.points[q.act.id] = [];

				for (var o = 0; o < q.points[q.act.id].length; ++o)
				{
					var curr = q.points[q.act.id][ o ];
					if ( Math.abs (curr.ax - posx) < dist_x && Math.abs (curr.ay - posy) < dist_y)
					{
						is_dragging = true;
						q.act_point = curr;
						q.Render ();

						break;
					}
				}

				if (!is_dragging)
				{
					q.act_point = null;
					q.Render ();
				}
			});

			q.canvas.addEventListener ('mouseup', function ( e ) {
				is_dragging = false;
			});


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

			var buff = q.wv.backend.buffer;
			
			var img = new Image();
			img.onload = function () {
				ctx.drawImage (img, 0, 0);
			};

			var offset; var length;
			var region = q.wv.regions.list[0];
			if (region) {
				offset = (region.start * buff.sampleRate) >> 0;
				length = (region.end * buff.sampleRate) >> 0;
			}

			_process ( q, buff );

			img.src = q.app.engine.GetWave (buff, 500, 200, offset, length);

			return ([cc, ctx]);
  		};

		function _compare ( a, b ) {
				if (a.x > b.x) return 1;
				return -1;
		};

		function _process ( q, buffer ) {
			var getOfflineAudioContext = function (channels, sampleRate, duration) {
					return new (window.OfflineAudioContext ||
					window.webkitOfflineAudioContext)(channels, duration, sampleRate);
			};

			var region = q.wv.regions.list[0];
			var offs = 0;
			var durr = buffer.duration;
			if (region) {
				offs = region.start;
				durr = region.end - region.start;
			}

			var audio_ctx = getOfflineAudioContext (
					1, // orig_buffer.numberOfChannels,
					8000,
					(durr * 8000) >> 0
			);

			var newbuffer = audio_ctx.createBuffer (1, durr * buffer.sampleRate, buffer.sampleRate);
			newbuffer.getChannelData ( 0 ).set (
				buffer.getChannelData ( 0 ).slice ( (offs * buffer.sampleRate) / 4, ((offs + durr) * buffer.sampleRate)/4 ) 
			);

			var source = audio_ctx.createBufferSource ();
			source.buffer = newbuffer;

			//var fx = q.app.engine.GetFX ('Gain', q.GetValue ());
			//console.log ( fx.filter ( audio_ctx, audio_ctx.destination, source ) );

			source.connect (audio_ctx.destination);
			source.start (0); //, offs, durr);

			var offline_callback = function( rendered_buffer ) {
						q.rbuff = rendered_buffer;

						debugger;

						// var img = new Image();
						// img.src = q.app.engine.GetWave (rendered_buffer, 500, 200);

						q.Render ();

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

			// ---------
		};
	};

	PKAudioEditor._deps.FxAUT = FXAutomation;

})( window, document, PKAudioEditor );