(function ( w, d, PKAE ) {
	'use strict';


	// STORING THE CUSTOM FX PRESETS IN LOCALSTORAGE
	function PK_FX_PRESETS () {
		var presets = {};

		this.Set = function (filter_id, obj) {
			var arr = presets[ filter_id ];

			if (!arr) {
				arr = [];
				presets[ filter_id ] = arr;
			}

			arr.push (obj);
			localStorage.setItem ('pk_presetfx', JSON.stringify (presets));

			return (arr);
		}

		this.Save = function () {
			localStorage.setItem ('pk_presetfx', JSON.stringify (presets));
		};

		this.Get = function ( filter_id ) {
			if (!filter_id) return (presets);
			return (presets[ filter_id ]);
		};

		this.GetSingle = function ( filter_id, custom_id ) {
			if (!filter_id) return (false);
			if (!custom_id) return (false);

			var arr = presets[ filter_id ];
			var l = arr.length;
			var found = null;

			while (l-- > 0) {
				if (arr[l].id === custom_id)
				{
					found = arr[l];
					break;
				}
			}

			if (found) return (found);
			return (false);
		};

		this.Del = function ( filter_id, custom_id ) {
			if (!filter_id) return (presets);

			var arr = presets[ filter_id ];
			var l = arr.length;
			var found = false;

			while (l-- > 0) {
				if (arr[l].id === custom_id)
				{
					arr.splice (l, 1);
					found = true;
					break;
				}
			}

			if (found)
				localStorage.setItem ('pk_presetfx', JSON.stringify (presets));

			return (arr);
		};

		// loadCustomPresets
		if (!w.localStorage)
		{
			this.Set = function(){};
			return ;
		}

		var json = w.localStorage.getItem ('pk_presetfx');
		var tmp = null;

		if (!json) return ;
		try { tmp = JSON.parse (json); } catch (e){}

		if (tmp) presets = tmp;
	};



	function PKUI_FX ( app ) {
		var UI = app.ui;

		var curr_filter_ui = null;
		var modal_name = 'modalfx';
		var modal_esc_key = modal_name + 'esc';

		var custom_presets = new PK_FX_PRESETS ();

		function activeCursor () {
			return UI.GetActiveCursor ?
				UI.GetActiveCursor () :
				PKAudioEditor.engine.wavesurfer.getCurrentTime ();
		}


		app.listenFor ('DidCloseFX_UI', function () {
			curr_filter_ui = null;
		});

		app.listenFor ('DidOpenFX_UI', function ( modal ) {
			curr_filter_ui = modal;
		});

		app.listenFor ('RequestFXUI_SELCUT', function () {
			var eng  = app.engine;
			var wv   = eng.wavesurfer;
			var bk   = wv.backend;
			var rate = bk.buffer.sampleRate;

			var region = wv.regions.list[0];
			if (!region) return (false);

			app.fireEvent('RequestPause');

			// mark the region as
			region.element.style.background = 'red';

			var reg = {
                    pos: {
                        start: (region.start * rate) >> 0,
                        end:   (region.end * rate) >> 0
                    },
                    initpos: {
                        start: (region.start * rate) >> 0,
                        end:   (region.end * rate) >> 0
                    }
			};

			wv.backend.reg = reg;

			var update_reg = function( region ) {
				reg.pos.start = (region.start * rate) >> 0;
				reg.pos.end = (region.end * rate) >> 0;

				wv.drawBuffer (true);
			};

			wv.on ('region-updated', update_reg);
			// -- now make sure we resize it if needed be
		});

		app.listenFor ('RequestFXUI_Gain', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'gain';
			var auto = null;

			var getvalue = function ( q ) {
				var value;

				if (auto) {
					value = auto.GetValue ();
				} else {
					var input = q.el_body.getElementsByTagName('input')[0];
					value = [{val: input.value / 1}];
				}

				return (value);
			};

			var x = new PKAudioFXModal({
				id: filter_id,
			    title:'Apply Gain to selected range',

				presets:[
					{name:'Silence',val:0},
					{name:'-50%',val:0.5},
					{name:'-25%',val:0.75},
					{name:'+25%',val:1.25},
					{name:'+50%',val:1.5},
					{name:'+100%',val:2}
				],
				custom_pres:custom_presets.Get (filter_id),
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var value = getvalue ( q );
				app.fireEvent ('RequestActionFX_PREVIEW_GAIN', value);
			},
			  buttons: [
				{
					title:'Apply Gain',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var value = getvalue ( q );

						if (value[0].val != 1.0)
							app.fireEvent ('RequestActionFX_GAIN', value);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row" style="border:none"><label>Gain percentage</label>' +
				'<input type="range" class="pk_horiz" min="0.0" max="2.5" step="0.01" value="1.0" />'+
				'<span class="pk_val">100%</span></div>' +
				'<div class="pk_row" style="border:none;padding:0">',
				// '<a style="float:left;margin:0" class="pk_modal_a_bottom">Volume Graph</a></div>',

			  setup:function( q ) {
				  var range = q.el_body.getElementsByTagName ('input')[0];
				  var span = q.el_body.getElementsByTagName  ('span')[0];
				  var graph_btn = q.el_body.getElementsByTagName  ('a')[0];

				  range.oninput = function() {
					span.innerHTML = ((range.value * 100) >> 0) + '%';
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', [{val: range.value / 1}]);
				  };

				  //graph_btn.onclick = function () {
				  //	auto = new PKAudioEditor._deps.FxAUT (app, q);
				  //};

				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet (modal_name);
				  app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;

				    q.Destroy ();
				  }, [27]);
			  }
			}, app);
			x.Show();
		});

		app.listenFor ('RequestActionFXUI_Rate', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'speed';

			var x = new PKAudioFXModal({
				id: filter_id,
			  title:'Change Speed',
				presets:[
					{name:'A lot slower',val:0.65},
					{name:'Slightly slower',val:0.85},
					{name:'Slightly faster',val:1.15},
					{name:'Blazing Fast',val:1.4}
				],
				custom_pres:custom_presets.Get (filter_id),
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var input = q.el_body.getElementsByTagName('input')[0];
				var value = input.value.trim() / 1;
				app.fireEvent ('RequestActionFX_PREVIEW_RATE', value);
			},

			  buttons: [
				{
					title:'Apply Rate',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var input = q.el_body.getElementsByTagName('input')[0];
						var value = input.value.trim() / 1;

						if (value != 1.0)
							app.fireEvent ('RequestActionFX_RATE', value);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row" style="border:none"><label>Playback Rate</label>' +
				'<input type="range" class="pk_horiz" min="0.2" max="2.0" step="0.01" value="1.0" />'+
				'<span class="pk_val">1.0</span></div>',
			  setup:function( q ) {
				  var range = q.el_body.getElementsByTagName('input')[0];
				  var span = q.el_body.getElementsByTagName('span')[0];

				  range.oninput = function() {
					span.innerHTML = range.value;
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', range.value/1);
				  };

				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet (modal_name);

				  app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;

				    q.Destroy ();
				  }, [27]);
			  }
			}, app);
			x.Show();
		});

		app.listenFor ('RequestActionFXUI_Speed', function () {
			var mt = app.multitrack;
			if (!(app.engine && app.engine.wavesurfer.backend.buffer) && !(mt && mt.IsOn && mt.IsOn ()))
				return OneUp ('Load audio first', 1200);
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'speed';
			var auto = null;

			var getvalue = function ( q ) {
				var input = q.el_body.getElementsByTagName('input')[0];
				var points = auto && auto.GetValue ()[0];

				if (points && points.length > 1) {
					return {
						type: 'profile',
						points: points
					};
				}

				return input.value / 1;
			};

			var profile_points = function ( val ) {
				var raw = val.substring (8).split ('|');
				var points = [];

				for (var i = 0; i < raw.length; ++i) {
					var pair = raw[i].split (':');
					if (pair.length !== 2) continue;

					points.push ({
						x: pair[0] / 1,
						val: pair[1] / 1
					});
				}

				return points;
			};

			var draw_axis = function () {
				if (!auto || !auto.act) return ;

				var ctx = auto.ctx;
				var min = auto.act.min;
				var max = auto.act.max;
				var vals = [max, 1, min];
				var pts = auto.points[auto.act.id] || [];

				ctx.save ();
				ctx.font = '10px Arial';
				ctx.textBaseline = 'middle';
				var y1 = (1 - ((1 - min) / (max - min))) * auto.ch;
				ctx.strokeStyle = 'rgba(217,217,85,0.35)';
				ctx.beginPath ();
				ctx.moveTo (0, y1);
				ctx.lineTo (auto.cw, y1);
				ctx.stroke ();
				for (var i = 0; i < vals.length; ++i) {
					var y = (1 - ((vals[i] - min) / (max - min))) * auto.ch;
					var txt = vals[i].toFixed (2) + 'x';
					var w = ctx.measureText (txt).width + 8;

					if (y < 8) y = 8;
					else if (y > auto.ch - 8) y = auto.ch - 8;

					ctx.fillStyle = 'rgba(0,0,0,0.65)';
					ctx.fillRect (3, y - 7, w, 14);
					ctx.fillStyle = '#d9d955';
					ctx.fillText (txt, 7, y);
				}
				ctx.fillStyle = '#fff';
				for (var i = 0; i < pts.length; ++i) {
					var txt = pts[i].val.toFixed (2) + 'x';
					var w = ctx.measureText (txt).width;
					var x = pts[i].ax + 9;
					var y = pts[i].ay - 10;
					if (x + w > auto.cw - 3) x = pts[i].ax - w - 9;
					if (y < 8) y = pts[i].ay + 12;
					ctx.fillText (txt, x, y);
				}
				ctx.restore ();
			};

			var setpoints = function ( q, points ) {
				if (!auto || !points.length) return ;

				var input = q.el_body.getElementsByTagName('input')[0];
				var min = input.min / 1;
				var max = input.max / 1;
				var duration = auto.wv.getDuration ();
				var region = auto.wv.regions.list[0];
				if (region) duration = region.end - region.start;

				if (!input.id) input.id = 'pk_speed';
				auto.act = {id:input.id, el:input, min:min, max:max, step:input.step/1};
				auto.points[input.id] = [];

				for (var i = 0; i < points.length; ++i) {
					var xval = Math.max (0, Math.min (1, points[i].x / 1));
					var yval = Math.max (min, Math.min (max, points[i].val / 1));
					var y = 1 - ((yval - min) / (max - min));

					auto.points[input.id].push ({
						id:i, x:xval, y:y, ax:xval * auto.cw, ay:y * auto.ch,
						time:duration * xval, val:yval, _on:true, _hov:false
					});
				}

				auto.points[input.id].sort (function (a, b) { return a.x > b.x ? 1 : -1; });
				auto.act_point = auto.points[input.id][auto.points[input.id].length - 1];
				auto.Render ();
			};

				var x = new PKAudioFXModal({
					id: filter_id,
				  title:'Pitch / Speed Profile',
					presets:[
						{name:'-1/4',val:0.25},
						{name:'-1/2',val:0.5},
						{name:'Slightly slower',val:0.85},
						{name:'Slightly faster',val:1.1},
						{name:'+1/4',val:1.25},
						{name:'+1/2',val:1.5},
						{name:'Doppler Pass',val:'profile:0:1.35|0.5:0.72|1:1.35'},
						{name:'Accelerate',val:'profile:0:0.70|0.55:1.00|1:1.65'},
						{name:'Engine Rev',val:'profile:0:0.82|0.25:1.35|0.58:1.08|1:1.55'},
						{name:'Car Approaching',val:'profile:0:0.72|0.3:0.88|0.65:1.18|1:1.55'},
						{name:'Car Driving Away',val:'profile:0:1.55|0.35:1.18|0.7:0.88|1:0.72'}
					],
				custom_pres:custom_presets.Get (filter_id),
				ondestroy: function ( q ) {
					if (q._spRAF) cancelAnimationFrame (q._spRAF);
					app.stopListeningFor ('DidStartPreview', q._spStart);
					app.stopListeningFor ('DidStopPreview', q._spStop);
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback (modal_esc_key);
					auto = null;
				},
				preview: function ( q ) {
					app.fireEvent ('RequestActionFX_PREVIEW_SPEED', getvalue ( q ));
				},
				onpreset: function ( val ) {
					var range = x.el_body.getElementsByTagName('input')[0];
					var span = x.el_body.getElementsByTagName('span')[0];

					if ((val + '').indexOf ('profile:') === 0) {
						var points = profile_points ( val );
						if (!points.length) return ;

						range.value = points[0].val.toFixed (2);
						span.innerHTML = range.value;
						setpoints (x, points);
					}
					else {
						range.value = val;
						span.innerHTML = range.value;
						setpoints (x, [{x:0, val:range.value}, {x:1, val:range.value}]);
					}

					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', getvalue ( x ));
				},

			  buttons: [
				{
					title:'Apply Profile',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var value = getvalue ( q );

						if (value != 1.0)
							app.fireEvent ('RequestActionFX_SPEED', value);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row" style="border:none"><label>Playback Rate</label>' +
				'<input type="range" class="pk_horiz" min="0.2" max="2.0" step="0.01" value="1.0" />'+
				'<span class="pk_val">1.0</span></div>',
				  setup:function( q ) {
					  var range = q.el_body.getElementsByTagName('input')[0];
					  var span = q.el_body.getElementsByTagName('span')[0];

						  range.oninput = function() {
							span.innerHTML = range.value;
							if (auto)
								setpoints (q, [{x:0, val:range.value}, {x:1, val:range.value}]);
							app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', getvalue (q));
						  };

					  q.waveDarken = 0.45;
					  auto = new PKAudioEditor._deps.FxAUT (app, q, null, function ( p ) {
							var r = auto.wv.regions.list[0], d = r ? r.end - r.start : auto.wv.getDuration ();
							app.fireEvent ('RequestActionFX_PREVIEW_SPEED', {val:getvalue (q), seek:p * d});
					  });
						  var pc = d.createElement ('canvas'), px = pc.getContext ('2d'), pp = 0, pt = 0, po = 0;
						  q.el_body.style.position || (q.el_body.style.position = 'relative');
						  pc.width = auto.cw; pc.height = auto.ch; pc.style.cssText = 'position:absolute;pointer-events:none;z-index:3';
						  q.el_body.appendChild (pc);
						  function pcn () { return ((w.performance && w.performance.now ? w.performance.now () : Date.now ()) / 1000); }
						  function pcd () { var r = auto.wv.regions.list[0]; return r ? r.end - r.start : auto.wv.getDuration (); }
						  function pcl (x) { px.clearRect (0, 0, pc.width, pc.height); if (x >= 0) { px.fillStyle = '#ff3355'; px.fillRect ((x * pc.width) >> 0, 0, 2, pc.height); } }
						  function pcr (x) {
							var p = auto.act && auto.points[auto.act.id], i = 1, a, b;
							if (!p || p.length < 2) return getvalue (q) / 1 || 1;
							for (; i < p.length && x > p[i].x; ++i) {}
							a = p[i - 1] || p[0]; b = p[i] || a;
							return a.val + (b.val - a.val) * (x - a.x) / (b.x - a.x || 1);
						  }
						  function pct () {
							var n = pcn (), du = pcd ();
							if (!po || !(du > 0)) return ;
							pp = (pp + (n - pt) * pcr (pp / du)) % du; pt = n; pcl (pp / du);
							q._spRAF = requestAnimationFrame (pct);
						  }
						  q._spStart = function ( seek ) { var du = pcd (); if (!(du > 0)) return ; po = 1; pp = Math.max (0, Math.min (seek || 0, du - 0.001)); pt = pcn (); pct (); };
						  q._spStop = function () { po = 0; if (q._spRAF) cancelAnimationFrame (q._spRAF); q._spRAF = 0; pcl (-1); };
						  app.listenFor ('DidStartPreview', q._spStart); app.listenFor ('DidStopPreview', q._spStop);
					  auto.btn_auto.style.display = 'none';
					  var rm = d.createElement ('a');
					  rm.className = 'pk_modal_a_bottom';
					  rm.innerHTML = 'Delete';
					  rm.style.cssText = 'display:none;position:absolute;z-index:4;margin:0';
					  q.el_body.appendChild (rm);
					  function rmb () {
						var p = auto.act_point, a = auto.act && auto.points[auto.act.id];
						if (!p || !a || a.length < 3) return rm.style.display = 'none';
						rm.style.display = 'block';
						rm.style.left = auto.canvas.offsetLeft + auto.canvas.offsetWidth - rm.offsetWidth - 6 + 'px';
						rm.style.top = auto.canvas.offsetTop + auto.canvas.offsetHeight - rm.offsetHeight - 6 + 'px';
					  }
					  rm.onclick = function (e) {
						e.preventDefault ();
						auto.DelAct (2) && app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', getvalue (q));
					  };
					  var render = auto.Render;
					  auto.Render = function () {
						render.call (auto);
						draw_axis ();
						pc.style.left = auto.canvas.offsetLeft + 'px';
						pc.style.top = auto.canvas.offsetTop + 'px';
						rmb ();
					  };
					  setpoints (q, [{x:0, val:range.value}, {x:1, val:range.value}]);

					  app.fireEvent ('RequestPause');
					  app.ui.InteractionHandler.checkAndSet (modal_name);

				  app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;

				    q.Destroy ();
				  }, [27]);
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Flip', function () {
			if (!PKAudioEditor.engine.is_ready) return ;

			app.fireEvent ( 'RequestRegionClear');
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'flip';
			var mode = 0;

			var x = new PKAudioFXModal({
				id: filter_id,
			  	title:'Channel Info',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			buttons: [
				{
					title:'Apply Changes',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						if (mode === 1)
						{
							// check if we are doing force mono, or force flip
							var mono  = q.el_body.getElementsByClassName('pk_c_mm')[0];
							var flip  = q.el_body.getElementsByClassName('pk_c_fl')[0];

							if (mono.checked)
							{
								var chans = q.el_body.getElementsByClassName('pk_c_c');
								// check which channel we pick

								if (chans[0].checked) {
									app.fireEvent ('RequestActionFX_Flip', 'mono', 0);
								}
								else if (chans[1].checked) {
									app.fireEvent ('RequestActionFX_Flip', 'mono', 1);
								}
							}
							else if (flip.checked) {
								app.fireEvent ('RequestActionFX_Flip', 'flip');
							}
						}

						else if (mode === 2)
						{
							var stereo  = q.el_body.getElementsByClassName('pk_c_ms')[0];
							if (stereo.checked) {
								app.fireEvent ('RequestActionFX_Flip', 'stereo');
							}
						}

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row pk_mm" style="border:none;display:none">'+

					'<div class="pk_row">'+
					'<input type="checkbox" class="pk_check pk_c_mm" id="xmm" name="makeMono">'+
					'<label for="xmm">Make Mono</label></div>' +
			  		'<div class="pk_row" style="padding-left:30px">' +
					'<input type="radio" class="pk_check pk_c_c" id="kf6" name="chnl" value="left">'+
					'<label class="pk_dis" for="kf6">Left Channel</label>'+
					'<input type="radio" class="pk_check pk_c_c" id="kf7" name="chnl" value="right">'+
					'<label class="pk_dis" for="kf7">Right Channel</label>'+
					'</div>'+

					'<div class="pk_row"><input type="checkbox" class="pk_check pk_c_fl" id="xfc" name="flipChn">'+
					'<label for="xfc">Flip Channels</label></div>' +
					'</div>' +

					'<div class="pk_row pk_ms" style="border:none;display:none">'+
						'<div class="pk_row"><input type="checkbox" class="pk_check pk_c_ms" id="xms" checked name="makeStereo">'+
						'<label for="xms">Make Stereo</label></div>' +
					'</div>',
			  setup:function( q ) {
			  	  var main = null;
				  var num = PKAudioEditor.engine.wavesurfer.backend.buffer.numberOfChannels;
				  if (num === 2)
				  {
					mode = 1;
					main = q.el_body.getElementsByClassName('pk_mm')[0];

					var mono  = main.getElementsByClassName('pk_c_mm')[0];
					var flip  = main.getElementsByClassName('pk_c_fl')[0];
					var chans = main.getElementsByClassName('pk_c_c');
					var tmp   = main.getElementsByClassName('pk_dis');
					var lbls  = [tmp[0], tmp[1]];

					mono.onchange = function( e ) {
						if (mono.checked) {
							flip.checked = false;
							chans[0].checked = true;
							lbls[0].className = '';
							lbls[1].className = '';
						}
						else {
							chans[0].checked = false;
							chans[1].checked = false;
							lbls[0].className = 'pk_dis';
							lbls[1].className = 'pk_dis';
						}
					};

					flip.onchange = function( e ) {
						if (flip.checked) {
							mono.checked = false;
							mono.onchange ();
						}
					};

				  }
				  else
				  {
					mode = 2;
					main = q.el_body.getElementsByClassName('pk_ms')[0];
				  }

				  main.style.display = 'block';

				  // --

				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet (modal_name);
				  app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
				    q.Destroy ();
				  }, [27]);
			  }
			}, app);
			x.Show();
		});



		app.listenFor ('RequestFXUI_Silence', function () {
			var x = new PKSimpleModal({
			  title: 'Insert Silence',
			  ondestroy: function( q ) {
				UI.InteractionHandler.on = false;
				UI.KeyHandler.removeCallback ('modalTemp');
			  },
			  buttons:[
				{
					title:'Insert Silence',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var input = q.el_body.getElementsByClassName('pk_horiz')[0];
						var value = input.value.trim() / 1;

						var radios = q.el_body.getElementsByClassName('pk_check');
						var offset = 0;

						if (radios[1].checked)
							offset = activeCursor ().toFixed(3)/1;

						if (value > 0.001)
							UI.fireEvent ('RequestActionSilence', offset, value);
						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><input type="radio" class="pk_check" id="ifeq" name="rdslnc" value="beginning">'+
				'<label  for="ifeq">Insert silence at beginning</label><br/>' +
				'<input type="radio" class="pk_check"  id="vgdja" name="rdslnc" checked value="cursor">'+
				'<label for="vgdja">Insert silence at current cursor (<span class="pkcdpk"></span>)</label></div>'+
				'<div class="pk_row"><label>Silence in seconds</label>'+
				'<input type="range" min="0.0" max="30.0" class="pk_horiz" step="0.01" value="5.0" />'+
				'<span class="pk_val">5s</span></div>',
			  setup:function( q ) {
					var cursor_pos_el = q.el_body.getElementsByClassName('pkcdpk')[0];
					cursor_pos_el.innerHTML = activeCursor ().toFixed(2) + 's';

					var range = q.el_body.getElementsByClassName('pk_horiz')[0];
					var span = q.el_body.getElementsByClassName('pk_val')[0];

					range.oninput = function() {
						span.innerHTML = (range.value/1).toFixed (2) + 's';
					};

					UI.fireEvent ('RequestPause');
					UI.InteractionHandler.checkAndSet ('modal');
					UI.KeyHandler.addCallback ('modalTemp', function ( e ) {
						q.Destroy ();
					}, [27]);
			  }
			});
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Compressor', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'compressor';
			var auto = null;
			var getvalue = function ( q ) {
				var ret;
				var value = [];

				if (auto) {
					value = auto.GetValue ();
				} else {
					var inputs = q.el_body.getElementsByTagName('input');
					value[0] = {val:+inputs[0].value};
					value[1] = {val:+inputs[1].value};
					value[2] = {val:+inputs[2].value};
					value[3] = {val:+inputs[3].value};
					value[4] = {val:+inputs[4].value};
					value[5] = {val:+inputs[5].value};
				}

				ret = {
					threshold: value[0],
					knee:  value[1],
					ratio:  value[2],
					attack:  value[3],
					release:  value[4],
					makeup: value[5]
				};

				return (ret);
			};

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Compression to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				if (q._grRAF) cancelAnimationFrame (q._grRAF);
				q._grRAF = null;
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
				presets:[
					{name:'Vocal — Lead',val:'-18,6,3,0.005,0.15,6'},
					{name:'Vocal — Broadcast',val:'-20,2,4,0.003,0.1,7.5'},
					{name:'Drum Bus Glue',val:'-10,3,2,0.03,0.3,2.5'},
					{name:'Snare Punch',val:'-15,1,4,0.001,0.06,5.5'},
					{name:'Kick Tighten',val:'-12,2,4,0.01,0.1,4.5'},
					{name:'Bass Even-Out',val:'-15,4,3,0.015,0.15,5'},
					{name:'Acoustic Smooth',val:'-18,6,2.5,0.01,0.15,5.5'},
					{name:'Master Glue',val:'-8,6,1.5,0.03,0.3,1.5'},
					{name:'Heavy Crush',val:'-30,0,8,0.002,0.1,8'},
					{name:'Brickwall Limit',val:'-3,0,20,0.001,0.05,1.5'},
					{name:'Classic 3:1',val:'-18,6,3,0.01,0.1,6'},
					{name:'Light Touch',val:'-12,2,2,0.005,0.08,3'},
					{name:'Classic',val:'-40,5,7,0.002,0.1,12'},
					{name:'Dashed Distortion',val:'-45,26,2.05,0.233,0.0,0'}
				],
				custom_pres:custom_presets.Get (filter_id),
			preview: function ( q ) {
				var inputs = q.el_body.getElementsByTagName('input');
				var val = getvalue (q);
				app.fireEvent ('RequestActionFX_PREVIEW_COMPRESSOR', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var inputs = q.el_body.getElementsByTagName('input');
						var val = getvalue ( q );

						app.fireEvent ('RequestActionFX_Compressor', val);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><label class="pk_line">Threshold</label>' +
				'<input class="pk_horiz" type="range" min="-100" max="0" step="0.1" value="-24.0" />'+
				'<span class="pk_val">-24.0</span></div>'+

				'<div class="pk_row"><label class="pk_line">Knee</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="40.0" step="0.01" value="30.0" />'+
				'<span class="pk_val">30.0</span></div>'+

				'<div class="pk_row"><label class="pk_line">Ratio</label>' +
				'<input class="pk_horiz" type="range" min="1.0" max="20.0" step="0.01" value="12.0" />'+
				'<span class="pk_val">12.0</span></div>'+

				'<div class="pk_row"><label class="pk_line">Attack</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.001" value="0.003" />'+
				'<span class="pk_val">0.003</span></div>'+

				'<div class="pk_row"><label class="pk_line">Release</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.001" value="0.25" />'+
				'<span class="pk_val">0.25</span></div>'+

				'<div class="pk_row"><label class="pk_line">Makeup</label>' +
				'<input class="pk_horiz" type="range" min="-12" max="24" step="0.1" value="0" />'+
				'<span class="pk_val">0.0 dB</span></div>'+

				'<div class="pk_row pk_grmtr_r" style="border:none"><label class="pk_line">Reduction</label>' +
				'<div class="pk_grmtr"><div class="pk_grmtr_f"></div></div>'+
				'<span class="pk_val pk_grmtr_v">0.0 dB</span></div>',
				//'<a style="float:left;margin:0" class="pk_modal_a_bottom">Volume Graph</a></div>',
			  setup:function( q ) {
				var inputs = q.el_body.getElementsByTagName ('input');
				for (var i = 0; i < inputs.length; ++i)
				{
				  (function (k) {
					inputs[k].oninput = function () {
					  var v = +this.value;
					  this.nextElementSibling.firstChild.nodeValue = k === 5 ? v.toFixed (1) + ' dB' : v.toFixed (3);
					  updateFilter ();
					};
				  })(i);
				}

				//var graph_btn = q.el_body.getElementsByTagName  ('a')[0];
				//graph_btn.onclick = function () {
				//		auto = new PKAudioEditor._deps.FxAUT (PKAudioEditor, q);
				//};

				function updateFilter() {
					var val = getvalue ( q );
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', val);
				}

				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet (modal_name);
				app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
					q.Destroy ();
				}, [27]);

				// Gain reduction meter — reads compressor.reduction during preview
				var gF = q.el_body.getElementsByClassName ('pk_grmtr_f')[0];
				var gV = q.el_body.getElementsByClassName ('pk_grmtr_v')[0].firstChild;
				var lr = NaN;
				function tickGR () {
					q._grRAF = requestAnimationFrame (tickGR);
					var h = app.engine && app.engine.FXPreviewHost, n = h && h.PreviewFilter, r = 0;
					if (h && h.MTPreviewing && h.MTPreviewFilter) n = h.MTPreviewFilter;
					if (h && (h.previewing || h.MTPreviewing) && n) {
						var c = n.length ? n[0] : n;
						r = c.reduction;
						if (typeof r !== 'number') r = (r && r.value) || 0;
					}
					if (r === lr) return;
					lr = r;
					var p = -r * 5; if (p > 100) p = 100; else if (p < 0) p = 0;
					gF.style.width = p + '%';
					gV.nodeValue = r.toFixed (1) + ' dB';
				}
				tickGR ();
				// ---
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Normalize', function () {
			app.fireEvent ('RequestSelect', 1);

			var getMode = function ( q ) {
				return (q._normMode || 'peak');
			};
			var getTarget = function ( q ) {
				var target = q.el_body.getElementsByClassName('pk_lufs_target')[0];
				var custom = q.el_body.getElementsByClassName('pk_lufs_custom_v')[0];
				return target.value === 'custom' ? custom.value / 1 : target.value.split ('|')[1] / 1;
			};
			var getCeiling = function ( q ) {
				var target = q.el_body.getElementsByClassName('pk_lufs_target')[0];
				var ceiling = q.el_body.getElementsByClassName('pk_lufs_ceil')[0];
				return target.value === 'custom' ? ceiling.value / 1 : target.value.split ('|')[2] / 1;
			};
			var getValue = function ( q ) {
				var mode = getMode (q);
				if (mode === 'lufs') return (q._lufsNorm || null);
				return [
					q.el_body.getElementsByClassName('pk_norm_eq')[0].checked,
					q.el_body.getElementsByClassName('pk_norm_amt')[0].value / 1
				];
			};
			var fireFor = function ( mode, preview ) {
				if (mode === 'lufs') return preview ? 'RequestActionFX_PREVIEW_NormalizeLUFS' : 'RequestActionFX_NormalizeLUFS';
				if (mode === 'rms') return preview ? 'RequestActionFX_PREVIEW_NormalizeRMS' : 'RequestActionFX_NormalizeRMS';
				return preview ? 'RequestActionFX_PREVIEW_Normalize' : 'RequestActionFX_Normalize';
			};

			var x = new PKAudioFXModal({
			  id: 'normalize',
			  title: 'Normalize',
			  clss: 'pk_bigger',
			  ondestroy: function( q ) {
				clearTimeout (q._normPreviewTimer);
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			  },
			  preview: function ( q ) {
				var val = getValue (q);
				if (!val) return ;
				app.fireEvent (fireFor (getMode (q), true), val);
			  },
			  buttons:[
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var mode = getMode (q);
						var val = getValue (q);
						if (!val) return ;
						app.fireEvent (fireFor (mode), val);
						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row pk_norm_modes"><label>Mode</label>'+
				'<input type="radio" class="pk_check pk_norm_mode" id="pk_norm_peak" name="pk_norm_mode" value="peak" checked>'+
				'<label for="pk_norm_peak">Peak</label>'+
				'<input type="radio" class="pk_check pk_norm_mode" id="pk_norm_rms" name="pk_norm_mode" value="rms">'+
				'<label for="pk_norm_rms">RMS</label>'+
				'<input type="radio" class="pk_check pk_norm_mode" id="pk_norm_lufs" name="pk_norm_mode" value="lufs">'+
				'<label for="pk_norm_lufs">LUFS</label></div>'+
				'<div class="pk_norm_simple">'+
				'<div class="pk_row">'+
			    '<input type="checkbox" id="vhcjgs" class="pk_check pk_norm_eq" name="normEqually">'+
				'<label for="vhcjgs">Normalize L/R Equally</label></div>' +
				'<div class="pk_row pk_norm_rng" style="border:none"><label class="pk_norm_lbl">Normalize to</label>'+
				'<input type="range" min="0.0" max="2.0" class="pk_horiz pk_w180 pk_norm_amt" step="0.01" value="1.0" />'+
				'<span class="pk_val">100%</span></div></div>'+
				'<div class="pk_norm_lufs" style="display:none">'+
				'<div class="pk_row"><label>Target</label>'+
				'<select class="pk_lufs_target">'+
				'<optgroup label="Streaming">'+
				'<option value="spotify|-14|-1">Spotify (-14 LUFS)</option>'+
				'<option value="spotify-loud|-11|-1">Spotify Loud (-11 LUFS)</option>'+
				'<option value="youtube|-14|-1">YouTube (-14 LUFS)</option>'+
				'<option value="apple|-16|-1">Apple Music (-16 LUFS)</option>'+
				'<option value="tidal|-14|-1">Tidal (-14 LUFS)</option>'+
				'<option value="amazon|-14|-2">Amazon Music (-14 LUFS)</option>'+
				'<option value="soundcloud|-14|-1">SoundCloud (-14 LUFS)</option>'+
				'</optgroup>'+
				'<optgroup label="Broadcast / Voice">'+
				'<option value="podcast|-16|-1">Podcast (-16 LUFS)</option>'+
				'<option value="ebu|-23|-1">Broadcast EBU R128 (-23 LUFS)</option>'+
				'<option value="atsc|-24|-2">Broadcast ATSC A/85 (-24 LUFS)</option>'+
				'</optgroup>'+
				'<optgroup label="Other">'+
				'<option value="club|-8|-0.3">Club / DJ Master (-8 LUFS)</option>'+
				'<option value="custom">Custom</option>'+
				'</optgroup>'+
				'</select></div>'+
				'<div class="pk_row pk_lufs_custom pk_lufs_rng" style="display:none"><label>Custom LUFS</label>'+
				'<input type="range" class="pk_horiz pk_w180 pk_lufs_custom_v" min="-40" max="-6" value="-14" step="0.1">'+
				'<span class="pk_val">-14.0</span></div>'+
				'<div class="pk_row pk_lufs_rng"><label>Peak ceiling</label>'+
				'<input type="range" class="pk_horiz pk_w180 pk_lufs_ceil" min="-6" max="0" value="-1" step="0.1">'+
				'<span class="pk_val">-1.0 dBTP</span></div>'+
				'<div class="pk_row" style="border:none"><label>Analysis</label>'+
				'<span class="pk_lufs_out">Select LUFS to measure integrated loudness.</span></div>'+
				'</div>',
			  setup:function( q ) {
				  var modes = q.el_body.getElementsByClassName('pk_norm_mode');
				  var range = q.el_body.getElementsByClassName('pk_norm_amt')[0];
				  var span = q.el_body.getElementsByClassName('pk_val')[0];
				  var simple = q.el_body.getElementsByClassName('pk_norm_simple')[0];
				  var lufs = q.el_body.getElementsByClassName('pk_norm_lufs')[0];
				  var target = q.el_body.getElementsByClassName('pk_lufs_target')[0];
				  var custom = q.el_body.getElementsByClassName('pk_lufs_custom')[0];
				  var customVal = q.el_body.getElementsByClassName('pk_lufs_custom_v')[0];
				  var ceiling = q.el_body.getElementsByClassName('pk_lufs_ceil')[0];
				  var out = q.el_body.getElementsByClassName('pk_lufs_out')[0];
				  var customOut = custom.getElementsByClassName('pk_val')[0];
				  var ceilingOut = ceiling.parentNode.getElementsByClassName('pk_val')[0];
				  var equally = q.el_body.getElementsByClassName('pk_norm_eq')[0];
				  var applyBtn = q.els.bottom[0];

				  function fmt (v) {
					return isFinite (v) ? v.toFixed (1) : '-inf';
				  }

				  function signed (v) {
					return (v > 0 ? '+' : '') + fmt (v);
				  }

				  function targetName () {
					return target.options[target.selectedIndex].text.replace (/\s*\(.*/, '');
				  }

				  function syncCeiling () {
					ceiling.value = getCeiling (q);
					ceilingOut.innerHTML = (ceiling.value / 1).toFixed (1) + ' dBTP';
				  }

				  function syncApply () {
					if (q._normMode === 'lufs') {
						applyBtn.innerHTML = 'Apply: Match ' + fmt (getTarget (q)) + ' LUFS';
						if (q._lufsNorm) applyBtn.classList.remove ('pk_inact');
						else applyBtn.classList.add ('pk_inact');
					}
					else {
						applyBtn.innerHTML = 'Apply';
						applyBtn.classList.remove ('pk_inact');
					}
				  }

				  function previewOn () {
					return q.els && q.els.toolbar && q.els.toolbar[1] &&
						q.els.toolbar[1].classList.contains ('pk_act');
				  }

					  function refreshPreview () {
						if (!previewOn ()) return ;
						clearTimeout (q._normPreviewTimer);
						q._normPreviewTimer = setTimeout (function () {
							var val = getValue (q);
							if (!previewOn () || !val) return ;
							app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', val);
						}, 60);
					  }

					  function restartPreview () {
						if (!previewOn ()) return ;
						clearTimeout (q._normPreviewTimer);
						var val = getValue (q);
						if (!val) return ;

						app.fireEvent ('RequestActionFX_PREVIEW_STOP');
						setTimeout (function () {
							if (q.els) app.fireEvent (fireFor (getMode (q), true), val);
						}, 20);
					  }

				  function setSimpleMode () {
					if (q._normMode === 'rms') {
						range.min = -40; range.max = 0; range.step = 0.1; range.value = -18;
						span.innerHTML = '-18.0 dBFS';
					}
					else {
						range.min = 0; range.max = 2; range.step = 0.01; range.value = 1;
						span.innerHTML = '100%';
					}
				  }

				  function updateLufs () {
					if (!q._lufsReport) return ;
					var norm = app._deps.lufs.gainForTarget (q._lufsReport, getTarget (q), ceiling.value / 1);
					q._lufsNorm = {
						gain: norm.gain,
						gainDb: norm.gainDb,
						target: getTarget (q),
						ceiling: ceiling.value / 1,
						measuredLUFS: q._lufsReport.lufs,
						expectedLUFS: norm.expectedLUFS,
						expectedTruePeakDb: norm.expectedTruePeakDb,
						limited: norm.limited
					};
					out.innerHTML =
						'Source: ' + fmt (q._lufsReport.lufs) + ' LUFS, est. TP ' + fmt (q._lufsReport.truePeakDb) + ' dBTP<br>'+
						'After: ' + fmt (norm.expectedLUFS) + ' LUFS, est. TP ' + fmt (norm.expectedTruePeakDb) + ' dBTP<br>'+
						'<span class="' + (norm.limited ? 'pk_lufs_warn' : 'pk_lufs_note') + '">' +
						'Gain ' + signed (norm.gainDb) + ' dB for ' + targetName () +
						(norm.limited ? '; target is ceiling-limited.' : '.') +
						'</span>';
					syncApply ();
					refreshPreview ();
				  }

				  function resetLufs () {
					q._lufsReport = null;
					q._lufsNorm = null;
					out.innerHTML = 'Measuring...';
					syncApply ();
				  }

				  range.oninput = function() {
					if (q._normMode === 'rms')
						span.innerHTML = (range.value/1).toFixed (1) + ' dBFS';
					else
						span.innerHTML = (((range.value/1)*100) >> 0) + '%';
					refreshPreview ();
				  };
					  equally.onchange = restartPreview;

				  function setMode (val) {
					q._normMode = val;
					for (var i = 0; i < modes.length; ++i)
						modes[i].checked = modes[i].value === val;
					app.fireEvent ('RequestActionFX_PREVIEW_STOP');
					resetLufs ();
					simple.style.display = val === 'lufs' ? 'none' : '';
					lufs.style.display = val === 'lufs' ? '' : 'none';
					if (val === 'lufs') q.AnalyzeLUFS ();
					else setSimpleMode ();
				  }

				  for (var m = 0; m < modes.length; ++m)
					modes[m].onchange = function () {
						if (this.checked) setMode (this.value);
					};
				  target.onchange = function () {
					custom.style.display = target.value === 'custom' ? '' : 'none';
					syncCeiling ();
					if (q._lufsReport) updateLufs ();
					else q.AnalyzeLUFS ();
				  };
				  customVal.oninput = function () {
					customOut.innerHTML = (customVal.value / 1).toFixed (1);
					if (q._lufsReport) updateLufs ();
					else q.AnalyzeLUFS ();
				  };
				  ceiling.oninput = function () {
					ceilingOut.innerHTML = (ceiling.value / 1).toFixed (1) + ' dBTP';
					if (q._lufsReport) updateLufs ();
					else q.AnalyzeLUFS ();
				  };

				  q.AnalyzeLUFS = function () {
					if (q._measuring) return ;
					q._measuring = true;
					q._lufsNorm = null;
					syncApply ();
					out.innerHTML = 'Measuring...';
					setTimeout (function () {
						app.fireEvent ('RequestActionFX_Loudness', function (report) {
							q._measuring = false;
							if (!report) {
								out.innerHTML = 'Could not analyze audio.';
								return ;
							}
							q._lufsReport = report;
							updateLufs ();
						});
					}, 20);
				  };
				  custom.style.display = target.value === 'custom' ? '' : 'none';
				  syncCeiling ();
				  setMode ('peak');

				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
			  }
			}, app);x.Show();
		});


		app.listenFor ('RequestActionFXUI_ParaGraphicEQ', function () {
			PKAudioEditor._deps.FxEQ (app, custom_presets);
		});

		app.listenFor ('RequestActionTempo', function () {
			PKAudioEditor._deps.FxTMP (app);
		});

		app.listenFor ('RequestActionNewRec', function () {
			PKAudioEditor._deps.FxREC (app);
		});

		//app.listenFor ('RequestActionAUTO', function ( filter ) {
		//	PKAudioEditor._deps.FxAUT (app, filter);
		//});

		app.listenFor ('RequestActionFXUI_GraphicEQ', function ( num_of_bands ) {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'graph_eq';
			var auto = null;
			var getvalue = function ( ranges ) {
				var val = {};

				if (auto) {
					val = auto.GetValue ();
				} else {
					val = [];
					var len = ranges.length;
					for (var i = 0; i < len; ++i)
					{
						var range = ranges [ i ];
						val.push ({
							'type' : range.getAttribute ('data-type'),
							'freq' : range.getAttribute ('data-freq')/1,
							'val'  : range.value / 1,
							'q'    : band_q
						});
					}
				}

				return (val);
			};

			var bands_str = '<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="32" data-type="lowshelf" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">< 32hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="64" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">64hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="125" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">125hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="250" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">250hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="500" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">500hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="1000" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">1000hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="2000" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">2000hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="4000" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">4000hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="8000" data-type="peaking" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm">8000hz</span></div>'+
				'<div class="pk_col"><span class="pk_val">0 db</span>'+
				'<input class="pk_vert" data-freq="16000" data-type="highshelf" '+
				'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
				'<span class="pk_btm"> >16000hz</span></div>';
			var presets = [
				{name:'Reset',           val:'0,0,0,0,0,0,0,0,0,0'},
				{name:'Bass Boost',      val:'8,7,5,2,0,0,0,0,0,0'},
				{name:'Treble Boost',    val:'0,0,0,0,0,0,3,5,7,8'},
				{name:'Vocal Clarity',   val:'-8,-4,-2,-1,1,3,5,4,2,0'},
				{name:'Podcast',         val:'-10,-6,-2,0,2,3,4,3,1,-2'},
				{name:'Warm',            val:'3,4,3,2,1,0,-1,-2,-3,-4'},
				{name:'Bright',          val:'-2,-2,-2,-1,0,1,3,5,6,5'},
				{name:'V-Shape',         val:'6,5,3,0,-2,-3,-2,1,4,6'},
				{name:'Loudness',        val:'8,7,3,0,0,0,0,3,7,9'},
				{name:'Hip Hop',         val:'9,8,4,0,-1,-2,0,2,4,5'},
				{name:'Acoustic',        val:'0,0,-2,-3,-1,1,3,4,3,2'},
				{name:'Rumble Cut',      val:'-25,-12,-4,0,0,0,0,0,0,0'},
				{name:'Telephone',       val:'-25,-25,-15,-2,2,4,2,-2,-25,-25'},
				{name:'Old Radio',       val:'-25,-22,-20,-18,-9,0,8,10,-8,-25'},
				{name:'Lo Fi',           val:'-18,-12,0,2,0,4,4,-1,-6,-8'}
			];
			var band_q = 4.6;

			if (num_of_bands === 20)
			{
				filter_id += '_2';
				presets = [
					{name:'Reset',         val:'0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0'},
					{name:'Bass Boost',    val:'8,8,7,7,6,5,3,2,1,0,0,0,0,0,0,0,0,0,0,0'},
					{name:'Treble Boost',  val:'0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,7'},
					{name:'Vocal Clarity', val:'-10,-9,-7,-5,-3,-2,-1,0,0,1,2,3,4,5,4,3,2,1,0,0'},
					{name:'Podcast',       val:'-12,-10,-8,-5,-3,-1,0,1,2,2,3,3,4,4,3,2,1,0,-1,-2'},
					{name:'Warm',          val:'3,4,4,3,3,2,2,1,1,0,0,-1,-1,-2,-2,-3,-3,-4,-4,-4'},
					{name:'Bright',        val:'-2,-2,-2,-2,-2,-1,-1,0,0,0,1,2,3,4,5,5,6,6,5,5'},
					{name:'V-Shape',       val:'6,7,6,5,4,3,1,0,-1,-2,-3,-3,-2,0,1,3,4,5,6,6'},
					{name:'Loudness',      val:'8,8,7,6,4,3,1,0,0,0,0,0,1,2,4,5,7,8,9,9'},
					{name:'Hip Hop',       val:'9,9,8,7,5,3,1,0,-1,-1,-2,-2,-1,0,2,3,4,5,5,4'},
					{name:'Acoustic',      val:'0,0,0,-1,-2,-3,-3,-2,-1,0,1,2,3,4,4,3,2,2,1,0'},
					{name:'Rumble Cut',    val:'-25,-20,-15,-8,-4,-2,-1,0,0,0,0,0,0,0,0,0,0,0,0,0'},
					{name:'De-Hiss',       val:'0,0,0,0,0,0,0,0,0,0,0,0,0,0,-2,-4,-6,-8,-10,-12'},
					{name:'Air',           val:'0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6'},
					{name:'Telephone',     val:'-25,-25,-25,-20,-15,-8,-2,0,2,3,4,3,2,0,-2,-8,-15,-25,-25,-25'},
					{name:'Old Radio',     val:'-25,-25,-22,-20,-18,-12,-9,-4,0,4,8,9,10,5,-8,-15,-20,-25,-25,-25'},
					{name:'Lo Fi',         val:'-18,-16,-12,-8,-4,0,2,2,1,0,4,4,3,2,-1,-3,-6,-7,-8,-8'}
				];
				band_q = 10.2;
				bands_str = '<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="31" data-type="lowshelf" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">< 31hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="44" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">44hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="63" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">63hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="88" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">88hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="125" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">125hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="180" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">180hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="250" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">250hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="335" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">335hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="500" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">500hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="710" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">710hz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="1000" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">1khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="1400" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">1.4khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="2000" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">2khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="2800" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">2.8khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="4000" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">4khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="5600" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">5.6khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="8000" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">8khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="11300" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">11.3khz</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="16000" data-type="peaking" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm">16k</span></div>'+
					'<div class="pk_col"><span class="pk_val">0 db</span>'+
					'<input class="pk_vert" data-freq="22000" data-type="highshelf" '+
					'type="range" min="-25.0" max="25.0" step="0.01" value="0.0" />'+
					'<span class="pk_btm"> >22khz</span></div>';
			}

			var x = new PKAudioFXModal({
			  id: filter_id,
			  title:'Graphic EQ',
			  clss: num_of_bands === 20 ? 'pk_dens' : '',
			  custom_pres:custom_presets.Get (filter_id),
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var ranges = q.el_body.getElementsByTagName('input');
				var len = ranges.length;

				app.fireEvent ('RequestActionFX_PREVIEW_PARAMEQ', getvalue (ranges));
			},

			  buttons: [
				{
					title:'Apply EQ',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var ranges = q.el_body.getElementsByTagName('input');
						app.fireEvent ('RequestActionFX_PARAMEQ', getvalue (ranges));

						q.Destroy ();
					}
				}
			  ],
			  presets:presets,
			  body:'<div class="pk_h200">' +
			  	bands_str+
				'<div style="clear:both;"></div></div>',
				//'<a style="float:left;margin:0" class="pk_modal_a_bottom">Volume Graph</a></div>',
			  setup:function( q ) {
					var ranges = q.el_body.getElementsByTagName('input');
					var len = ranges.length;

					  //var graph_btn = q.el_body.getElementsByTagName  ('a')[0];
					  //graph_btn.onclick = function () {
					  //		auto = new PKAudioEditor._deps.FxAUT (PKAudioEditor, q, function ( obj, range ) {
					  //			obj.type = range.getAttribute ('data-type');
					  //			obj.freq = range.getAttribute ('data-freq')/1;
					  //			obj.q    = band_q;
					  //		});
					  //};

					for (var i = 0; i < len; ++i) {
						var range = ranges[i];

						range.oninput = function() {
						  var span = this.parentNode.getElementsByTagName('span')[0];
						  span.innerHTML = ((this.value) >> 0) + ' db';
						  app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', getvalue (ranges));
						};
					}

					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_HardLimiter', function () {

			app.fireEvent ('RequestSelect', 1);

			var x = new PKAudioFXModal({
			  title: 'Hard Limiting',
			  ondestroy: function( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback ('modalTemp');
			  },
			  buttons:[
				{
					title:'Hard Limiting',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						app.fireEvent ('RequestActionFX_HardLimit', q.updateFilter (q));
						q.Destroy ();
					}
				}
			  ],
				preview: function ( q ) {
					app.fireEvent ('RequestActionFX_PREVIEW_HardLimit', q.updateFilter ( q ));
				},
			  body:
				'<div class="pk_row"><input type="checkbox" class="pk_check" id="xighs" name="normEqually">'+
				'<label for="xighs">Hard Limiting</label></div>' +

				'<div class="pk_row"><label>Limit to</label>'+
				'<input type="range" min="0.1" max="1.0" class="pk_horiz pk_w180" step="0.01" value="0.99" />'+
				'<span class="pk_val">99%</span></div>'+

				'<div class="pk_row"><label>Ratio between lows and highs</label>'+
				'<input type="range" min="0.0" max="1.0" class="pk_horiz pk_w180" step="0.01" value="0.0" />'+
				'<span class="pk_val">Ratio 0%</span></div>'+

				'<div class="pk_row"><label>Look Ahead (ms)</label>'+
				'<input type="range" min="1.0" max="500.0" class="pk_horiz pk_w180" step="0.01" value="10.0" />'+
				'<span class="pk_val">10 ms</span></div>',
			  updateFilter : function ( q ) {
					var val = [q.el_body.getElementsByClassName('pk_check')[0].checked];
					var ranges = q.el_body.getElementsByClassName('pk_horiz');

					for (var i = 0; i < ranges.length; ++i)
					{
						var range = ranges [ i ];
						val.push (range.value / 1);
					}
					return (val);
				},
			  setup:function( q ) {
				  var ranges = q.el_body.getElementsByClassName('pk_horiz');

				  ranges[0].oninput = function() {
					var span = this.parentNode.getElementsByTagName('span')[0];
					span.innerHTML = (((this.value/1)*100) >> 0) + '%';
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', q.updateFilter (q));
				  };
				  ranges[1].oninput = function() {
					var span = this.parentNode.getElementsByTagName('span')[0];
					span.innerHTML = 'Ratio ' + (((this.value/1)*100) >> 0) + '%';
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', q.updateFilter (q));
				  };
				  ranges[2].oninput = function() {
					var span = this.parentNode.getElementsByTagName('span')[0];
					span.innerHTML = (this.value/1) + 'ms';
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', q.updateFilter (q));
				  };


				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
						q.Destroy ();
					}, [27]);
			  }
			}, app);x.Show();
		});


		app.listenFor ('RequestActionFXUI_Delay', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'delay';
			var auto = null;
			var getvalue = function ( q ) {
				var ret;
				var value = [];

				if (auto) {
					value = auto.GetValue ();
				} else {
					var inputs = q.el_body.getElementsByTagName('input');
					value[0] = {val:inputs[0].value / 1};
					value[1] = {val:inputs[1].value / 1};
					value[2] = {val:inputs[2].value / 1};
				}

				ret = {
					delay: value[0],
					feedback:  value[1],
					mix:  value[2]
				};

				return (ret);
			};

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Delay to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
				presets:[
					{name:'Classic',val:'0.3,0.4,0.4'},
					{name:'Spacey',val:'3.0,0.6,0.3'}
				],
				custom_pres:custom_presets.Get (filter_id),
			preview: function ( q ) {
				var val = getvalue (q);

				app.fireEvent ('RequestActionFX_PREVIEW_DELAY', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var val = getvalue (q);

						app.fireEvent ('RequestActionFX_DELAY', val);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><label class="pk_line">Delay Time</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="6.0" step="0.01" value="0.28" />'+
				'<span class="pk_val">0.28</span></div>'+

				'<div class="pk_row"><label class="pk_line">Feedback</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.01" value="0.5" />'+
				'<span class="pk_val">0.5</span></div>'+

				'<div class="pk_row"><label class="pk_line">Wet</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.01" value="0.4" />'+
				'<span class="pk_val">0.4</span></div>',
				//'<a style="float:left;margin:0" class="pk_modal_a_bottom">Volume Graph</a></div>',
			  setup:function( q ) {
				var inputs = q.el_body.getElementsByTagName ('input');
				for (var i = 0; i < inputs.length; ++i)
				{
				  inputs[i].oninput = function () {
					  var span = this.parentNode.getElementsByTagName ('span')[0];
					  span.innerHTML = (this.value/1).toFixed (3);

					  updateFilter ();
				  };
				}

				//var graph_btn = q.el_body.getElementsByTagName  ('a')[0];
				//graph_btn.onclick = function () {
				//	auto = new PKAudioEditor._deps.FxAUT (app, q);
				//};

				function updateFilter() {
					var val = getvalue (q);
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', val);
				}

				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet (modal_name);
				app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
					q.Destroy ();
				}, [27]);
				// ---
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Distortion', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'dist';
			var auto = null;
			var getvalue = function ( q ) {
				var value;

				if (auto) {
					value = auto.GetValue ();
				} else {
					var input = q.el_body.getElementsByTagName('input')[0];
					value = [{val: input.value / 1}];
				}

				return (value);
			};

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Distortion to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var val = getvalue (q);
				app.fireEvent ('RequestActionFX_PREVIEW_DISTORT', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var val = getvalue (q);
						app.fireEvent ('RequestActionFX_DISTORT', val);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><label class="pk_line">Gain</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="2.0" step="0.01" value="0.5" />'+
				'<span class="pk_val">0.5</span></div>',
				// '<a style="float:left;margin:0" class="pk_modal_a_bottom">Volume Graph</a></div>',

			  setup:function( q ) {
				var inputs = q.el_body.getElementsByTagName ('input');
				for (var i = 0; i < inputs.length; ++i)
				{
				  inputs[i].oninput = function () {
					  var span = this.parentNode.getElementsByTagName ('span')[0];
					  span.innerHTML = (this.value/1).toFixed (2);

					  updateFilter ();
				  };
				}

				//var graph_btn = q.el_body.getElementsByTagName  ('a')[0];
				//graph_btn.onclick = function () {
				//	auto = new PKAudioEditor._deps.FxAUT (app, q);
				//};

				function updateFilter() {
					var val = getvalue (q);
					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', val);
				}

				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet (modal_name);
				app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
					q.Destroy ();
				}, [27]);
				// ---
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Reverb', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'reverb';

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Reverb to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			presets:[
				{name:'Classic',val:'0.3,0.4,0.4'},
				{name:'Spacey',val:'3.0,0.6,0.3'},
				{name:'Small Room',val:'0.3,1.5,0.25'},
				{name:'Medium Room',val:'0.7,1.2,0.35'},
				{name:'Large Hall',val:'2.2,0.5,0.4'},
				{name:'Cathedral',val:'3.0,0.3,0.5'},
				{name:'Plate',val:'1.2,0.8,0.45'},
				{name:'Vocal Booth',val:'0.5,2.0,0.2'},
				{name:'Drum Chamber',val:'0.9,1.0,0.3'},
				{name:'Ambient Wash',val:'2.8,0.2,0.6'},
				{name:'Tight Slap',val:'0.15,2.5,0.35'},
				{name:'Cave',val:'2.5,0.4,0.55'}
			],
			custom_pres:custom_presets.Get (filter_id),
			preview: function ( q ) {
				var inputs = q.el_body.getElementsByTagName('input');
				var val = {
					time:      inputs[0].value/1,
					decay:     inputs[1].value/1,
					mix:       inputs[2].value/1
				};
				app.fireEvent ('RequestActionFX_PREVIEW_REVERB', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var inputs = q.el_body.getElementsByTagName('input');
						var val = {
							time:     inputs[0].value/1,
							decay:  inputs[1].value/1,
							mix:       inputs[2].value/1
						};

						app.fireEvent ('RequestActionFX_REVERB', val);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><label class="pk_line">Time</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="3.0" step="0.01" value="0.3" />'+
				'<span class="pk_val">0.3</span></div>'+

				'<div class="pk_row"><label class="pk_line">Decay</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="3.0" step="0.01" value="0.05" />'+
				'<span class="pk_val">0.05</span></div>'+

				'<div class="pk_row"><label class="pk_line">Wet</label>' +
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.01" value="0.6" />'+
				'<span class="pk_val">0.6</span></div>',
			  setup:function( q ) {
				var inputs = q.el_body.getElementsByTagName ('input');
				for (var i = 0; i < inputs.length; ++i)
				{
				  inputs[i].oninput = function () {
					  var span = this.parentNode.getElementsByTagName ('span')[0];
					  span.innerHTML = (this.value/1).toFixed (3);

					  updateFilter ();
				  };
				}

				function updateFilter() {
					var inputs = q.el_body.getElementsByTagName('input');
					var val = {
						time:     inputs[0].value/1,
						decay:  inputs[1].value/1,
						mix:       inputs[2].value/1
					};

					app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', val);
				}

				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet (modal_name);
				app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
					if (!app.ui.InteractionHandler.check (modal_name)) return ;
					q.Destroy ();
				}, [27]);
				// ---
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Repair', function () {
			var mt = app.multitrack;
			if (mt && mt.IsOn && mt.IsOn ())
				return OneUp ('Audio Repair is not available in multitrack', 1400);
			if (!app.engine.is_ready) return ;
			app.fireEvent ('RequestSelect', 1);

			function mode ( q ) {
				return q.el_body.querySelector ('input[name=rpr_m]:checked').value;
			}
			function getvalue ( q ) {
				var m = mode (q);
				if (m === 'hum') {
					var f = q.el_body.querySelector ('input[name=rpr_f]:checked');
					return f ? f.value : 'auto';
				}
				var sel = q.el_body.querySelector ('input[name=' + (m === 'edit' ? 'rpr_e' : 'rpr_s') + ']:checked');
				return sel ? sel.value : 'med';
			}
			var EVT = {
				click: ['RequestActionFX_DeClick', 'RequestActionFX_PREVIEW_DeClick'],
				hum:   ['RequestActionFX_HumNotch', 'RequestActionFX_PREVIEW_HumNotch'],
				edit:  ['RequestActionFX_RepairSplice', 'RequestActionFX_PREVIEW_RepairSplice']
			};

			var x = new PKAudioFXModal ({
				id : 'repair',
				title : 'Audio Repair',
				ondestroy : function () {
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback (modal_esc_key);
				},
				preview : function ( q ) {
					app.fireEvent (EVT[mode (q)][1], getvalue (q));
				},
				buttons : [{
					title : 'Apply',
					clss : 'pk_modal_a_accpt',
					callback : function ( q ) {
						app.fireEvent (EVT[mode (q)][0], getvalue (q));
						q.Destroy ();
					}
				}],
				body :
					'<div class="pk_row">' +
						'<input type="radio" class="pk_check" name="rpr_m" id="rpr_mc" value="click" checked><label for="rpr_mc">Click Reduction</label>' +
						'<input type="radio" class="pk_check" name="rpr_m" id="rpr_mh" value="hum"><label for="rpr_mh">Hum Reduction</label>' +
						'<input type="radio" class="pk_check" name="rpr_m" id="rpr_me" value="edit"><label for="rpr_me">Edit Repair</label>' +
					'</div>' +
					'<div id="rpr_pc">' +
						'<div class="pk_row"><label>Sensitivity</label>' +
							'<input type="radio" class="pk_check" name="rpr_s" id="rpr_sl" value="low"><label for="rpr_sl">Low</label>' +
							'<input type="radio" class="pk_check" name="rpr_s" id="rpr_sm" value="med" checked><label for="rpr_sm">Medium</label>' +
							'<input type="radio" class="pk_check" name="rpr_s" id="rpr_sh" value="high"><label for="rpr_sh">High</label>' +
						'</div>' +
						'<div class="pk_row pk_inact">Removes short transient clicks<br>(vinyl pops, mouth clicks) by detecting<br>energy spikes and interpolating across them.</div>' +
					'</div>' +
					'<div id="rpr_ph" style="display:none">' +
						'<div class="pk_row"><label>Mains frequency</label>' +
							'<input type="radio" class="pk_check" name="rpr_f" id="rpr_f50" value="50"><label for="rpr_f50">50 Hz</label>' +
							'<input type="radio" class="pk_check" name="rpr_f" id="rpr_f60" value="60"><label for="rpr_f60">60 Hz</label>' +
							'<input type="radio" class="pk_check" name="rpr_f" id="rpr_fa" value="auto" checked><label for="rpr_fa">Auto-detect</label>' +
						'</div>' +
						'<div class="pk_row pk_inact">Notches out the mains hum and seven<br>harmonics. Auto-detect scans the selection<br>and locks to the actual hum frequency.</div>' +
					'</div>' +
					'<div id="rpr_pe" style="display:none">' +
						'<div class="pk_row"><label>Sensitivity</label>' +
							'<input type="radio" class="pk_check" name="rpr_e" id="rpr_el" value="low"><label for="rpr_el">Low</label>' +
							'<input type="radio" class="pk_check" name="rpr_e" id="rpr_em" value="med" checked><label for="rpr_em">Medium</label>' +
							'<input type="radio" class="pk_check" name="rpr_e" id="rpr_eh" value="high"><label for="rpr_eh">High</label>' +
						'</div>' +
						'<div class="pk_row pk_inact">Smooths DC-offset splices between joined<br>audio of similar energy. Use after pasting<br>from another source. Not for note onsets.</div>' +
					'</div>',
				setup : function ( q ) {
					var panes = {
						click: q.el_body.querySelector ('#rpr_pc'),
						hum:   q.el_body.querySelector ('#rpr_ph'),
						edit:  q.el_body.querySelector ('#rpr_pe')
					};
					function applyMode () {
						var m = mode (q);
						panes.click.style.display = m === 'click' ? '' : 'none';
						panes.hum.style.display   = m === 'hum'   ? '' : 'none';
						panes.edit.style.display  = m === 'edit'  ? '' : 'none';
						app.fireEvent ('RequestActionFX_PREVIEW_STOP');
					}
					q.el_body.querySelectorAll ('input[name=rpr_m]').forEach (function ( r ) {
						r.onchange = applyMode;
					});
					applyMode ();
					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function () {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
				}
			}, app);
			x.Show ();
		});


			app.listenFor ('RequestActionFXUI_SeamlessLoop', function () {
				if (!app.engine.is_ready) return ;
				if (!app.engine.wavesurfer.regions.list[0]) {
					app.fireEvent ('RequestSelect');
				}
				if (!app.engine.wavesurfer.regions.list[0]) return ;

				var x = new PKSimpleModal ({
					title:'Seamless Loop',
					ondestroy: function ( q ) {
						app.fireEvent ('RequestActionFX_PREVIEW_STOP');
						if (q._sloopRAF) cancelAnimationFrame (q._sloopRAF);
						if (q._sloopRestart) clearTimeout (q._sloopRestart);
						app.stopListeningFor ('DidStartPreview', q._sloopStart);
						app.stopListeningFor ('DidStopPreview', q._sloopStop);
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback (modal_esc_key);
					},
					toolbar: [
					{
						title:'Preview Loop',
						callback: function( q ) {
							app.fireEvent ('RequestActionFX_PREVIEW_SeamlessLoop', q._val ());
						}
					}
				],
				buttons: [
					{
						title:'Open in New Editor',
						callback: function( q ) {
							app.fireEvent ('RequestActionFX_OpenSeamlessLoop', {
								val:q._val (),
								win:window.open ('about:blank')
							});
							q.Destroy ();
						}
					},
					{
						title:'Apply',
						clss:'pk_modal_a_accpt',
						callback: function( q ) {
							app.fireEvent ('RequestActionFX_SeamlessLoop', q._val ());
							q.Destroy ();
						}
					}
				],
				body:'<canvas class="pk_sloop" width="520" height="96"></canvas>' +
					'<div class="pk_sloop_meta"></div>' +
					'<div class="pk_row" style="border:none"><label>Crossfade</label>' +
					'<input type="range" class="pk_horiz" min="0" max="500" step="1" value="10" />' +
					'<span class="pk_val">10 ms</span></div>' +
					'<div class="pk_row" style="border:none"><label>Repeat loop</label>' +
					'<input class="pk_txt" style="display:inline-block;width:64px;margin:0" type="number" min="1" max="64" step="1" value="1" /></div>' +
					'<div class="pk_row" style="border:none"><input type="checkbox" class="pk_check" id="pk_sloop_trim" />' +
					'<label for="pk_sloop_trim">Trim edge silence</label></div>' +
					'<div class="pk_row" style="border:none"><input type="checkbox" class="pk_check" id="pk_sloop_zc" checked />' +
					'<label for="pk_sloop_zc">Snap to zero crossing</label></div>',
				setup:function( q ) {
					var canvas = q.el_body.getElementsByTagName ('canvas')[0];
					var ctx = canvas.getContext ('2d', {alpha:false,antialias:false});
					var cache = d.createElement ('canvas');
					cache.width = canvas.width; cache.height = canvas.height;
					var cctx = cache.getContext ('2d', {alpha:false,antialias:false});
					var inputs = q.el_body.getElementsByTagName ('input');
					var span = q.el_body.getElementsByTagName ('span')[0];
					var meta = q.el_body.getElementsByClassName ('pk_sloop_meta')[0];
					var region = app.engine.wavesurfer.regions.list[0];
					var buffer = app.engine.wavesurfer.backend.buffer;
					var start = (region.start * buffer.sampleRate) >> 0;
					var len = ((region.end - region.start) * buffer.sampleRate) >> 0;
					var end = start + len;
					var playing = 0;
					var dirty = 1, dur = 0;
					var now = function () {
						return ((w.performance && w.performance.now ? w.performance.now () : Date.now ()) / 1000);
					};
					var repeat = function () {
						return Math.max (1, Math.min (64, inputs[1].value >> 0 || 1));
					};
					var zero = function (data, i, dir, max, slope) {
						var any = -1;
						for (var n = 0; n < max; ++n, i += dir) {
							if (i < 1 || i >= data.length - 1) break;
							if ((data[i - 1] <= 0 && data[i] >= 0) || (data[i - 1] >= 0 && data[i] <= 0)) {
								if (any < 0) any = i;
								if (!slope || (data[i + 1] - data[i - 1]) * slope > 0) return (i);
							}
						}
						return (any);
					};

					function edges () {
						var s = start, e = end, data = buffer.getChannelData (0);
						if (inputs[2].checked) {
							var pad = (buffer.sampleRate / 1000) >> 0;
							while (s < e - 8 && Math.abs (data[s]) < 0.0007) ++s;
							while (e > s + 8 && Math.abs (data[e - 1]) < 0.0007) --e;
							if (e > s + 8) {
								s = Math.max (start, s - pad);
								e = Math.min (end, e + pad);
							}
							else {
								s = start;
								e = end;
							}
						}
						if (inputs[3].checked) {
							var max = Math.min ((buffer.sampleRate / 100) >> 0, (e - s) >> 3);
							var z1 = max > 2 ? zero (data, s + 1, 1, max, 0) : -1;
							var slope = z1 > 0 ? data[z1 + 1] - data[z1 - 1] : 0;
							var z2 = z1 > 0 ? zero (data, e - 2, -1, max, slope) : -1;
							if (z2 > z1 + 8) {
								s = z1;
								e = z2 + 1;
							}
						}
						return ([ s, e ]);
					}

					function draw ( pos ) {
						var w = canvas.width, h = canvas.height;
							if (dirty) {
								var b = edges (), l = b[1] - b[0];
								if (l < 1) { dur = 0; return ; }
							app.engine.GetWave (buffer, w, h, b[0], b[1], cache, cctx);

							var f = Math.min ((inputs[0].value * buffer.sampleRate / 1000) >> 0, l >> 2);
							var fx = f ? Math.max (2, (f / l * w) >> 0) : 0;
							cctx.fillStyle = 'rgba(255,179,92,.22)';
							cctx.fillRect (0, 0, fx, h);
							cctx.fillRect (w - fx, 0, fx, h);
							if (fx > 1) {
								var data = buffer.getChannelData (0);
								cctx.strokeStyle = '#ffb35c';
								cctx.beginPath ();
								for (var x = 0; x < fx; ++x) {
									var v = data[b[1] - f + ((x / fx * f) >> 0)] || 0;
									cctx[x ? 'lineTo' : 'moveTo'] (x, h/2 - v * h/2);
								}
								cctx.stroke ();
							}
							var r = repeat ();
							var ol = l - f;
							dur = ol / buffer.sampleRate;
							meta.innerHTML = 'Loop ' + dur.toFixed (3) + 's' +
								(r > 1 ? ' x' + r + ' = ' + (ol * r / buffer.sampleRate).toFixed (3) + 's' : '');
							dirty = 0;
						}
						ctx.drawImage (cache, 0, 0);
						if (pos >= 0) {
							ctx.fillStyle = '#ff3355';
							ctx.fillRect ((pos * w) >> 0, 0, 2, h);
					}
				}

					function tick () {
						if (!playing) return ;
						if (dirty) draw ();
						if (dur <= 0) return ;
						draw (((now () - playing) % dur) / dur);
						q._sloopRAF = requestAnimationFrame (tick);
					}

					q._val = function () {
						return ({ fade:inputs[0].value/1, repeat:repeat (), trim:inputs[2].checked, snap:inputs[3].checked });
					};
					q._sloopStart = function ( seek ) {
						q.els.toolbar[0].classList.add ('pk_act');
						playing = now () - (seek || 0);
						tick ();
					};
					q._sloopStop = function () {
						q.els.toolbar[0].classList.remove ('pk_act');
						playing = 0;
						if (q._sloopRAF) cancelAnimationFrame (q._sloopRAF);
						q._sloopRAF = 0;
						draw ();
					};
					app.listenFor ('DidStartPreview', q._sloopStart);
					app.listenFor ('DidStopPreview', q._sloopStop);
					var updatePreview = function () {
						if (!playing) return ;
						if (q._sloopRestart) clearTimeout (q._sloopRestart);
						q._sloopRestart = setTimeout (function () {
							app.fireEvent ('RequestActionFX_PREVIEW_STOP');
							app.fireEvent ('RequestActionFX_PREVIEW_SeamlessLoop', q._val ());
						}, 35);
					};
					inputs[0].oninput = function() {
						span.innerHTML = inputs[0].value + ' ms';
						dirty = 1;
						draw ();
						updatePreview ();
					};
					inputs[1].oninput = inputs[1].onchange = function() {
						dirty = 1;
						draw ();
						updatePreview ();
					};
					inputs[2].onchange = function() {
						dirty = 1;
						draw ();
						updatePreview ();
					};
					inputs[3].onchange = function() {
						dirty = 1;
						draw ();
						updatePreview ();
					};
					canvas.onclick = function ( e ) {
						if (!playing) return ;
						if (dirty) draw ();
						if (dur <= 0) return ;
						var r = canvas.getBoundingClientRect ();
						var v = q._val ();
						v.seek = Math.max (0, Math.min (0.999, (e.clientX - r.left) / r.width)) * dur;
						app.fireEvent ('RequestActionFX_PREVIEW_SeamlessLoop', v);
					};
					setTimeout (draw, 0);

					app.fireEvent ('RequestPause');
					app.ui.InteractionHandler.checkAndSet (modal_name);
					app.ui.KeyHandler.addCallback (modal_esc_key, function ( e ) {
						if (!app.ui.InteractionHandler.check (modal_name)) return ;
						q.Destroy ();
					}, [27]);
				}
			});
			x.Show();
		});

		// -----

		var current_tags = null;
		app.listenFor ('RequestActionID3', function (flag, new_tags) {
				if (flag) {
					current_tags = new_tags;
					return ;
				}

				var modal_id = '_id3';
				var live = true;
				var st = {
					tag  : current_tags || {},
					ab   : null,
					type : current_tags && current_tags._type,
					file : null,
					name : '',
					pic  : current_tags && current_tags.picture,
					orig : current_tags && current_tags.picture,
					ch   : false,
					base : null
				};

				var esc = function ( v ) {
					return (v || '').toString().replace(/[&<>"']/g, function (m) {
						return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
					});
				};
				var img = function ( image ) {
					if (!image) return '-';
						var base64str = '';
						for (var i = 0; i < image.data.length; ++i) {
							base64str += String.fromCharCode (image.data[i]);
						}
					return '<img style="max-width:340px;max-height:230px" src="data:' +
						image.format + ';base64,' + window.btoa(base64str) + '"/>';
				};
				var snap = function (t) {
					t = t || {};
					return {
						artist:t.artist || '', title:t.title || '', album:t.album || '',
						year:t.year || '', genre:t.genre || '', track:t.track || '',
						comment:(t.comment||{}).text || '', lyrics:(t.lyrics||{}).lyrics || ''
					};
				};
				var read_tags = function (ab) {
					var b = new Uint8Array (ab), t = null;
					try {
						if (b[0] === 73 && b[1] === 68 && b[2] === 51) {
							t = ID3v2.ReadTags (ab);
							if (t) t._type = 'mp3';
						}
						else if (b.length > 9 && b[4] === 102 && b[5] === 116 && b[6] === 121 && b[7] === 112 && b[8] === 77 && b[9] === 52) {
							t = ID4.ReadTags (ab);
							if (t) t._type = 'm4a';
						}
					} catch (e) {}
					return t;
				};
				var dirty = function ( q, el ) {
					var btn = q.els.bottom[0];
					var on = st.file && st.type === 'mp3' && st.ab && st.ch;

					if (!on && st.file && st.type === 'mp3' && st.ab && st.base) {
						for (var k in st.base) if (st.base.hasOwnProperty(k)) {
							var x = el.querySelector ('[name="' + k + '"]');
							if (x && x.value !== st.base[k]) {
								on = true;
								break;
							}
						}
					}

					btn.style.display = on ? '' : 'none';
					btn.classList[on ? 'remove' : 'add'] ('pk_inact');
				};
				var render_cover = function ( q, el, off ) {
					var box = el.getElementsByClassName ('pk_id3cover')[0];
					if (!box) return ;

					var ttl = 'padding-left:0';
					var str = '<span class="pk_id3ttl" style="' + ttl + '">Cover</span>' +
						'<div class="pk_id3img" style="margin-top:4px">' + img(st.pic) + '</div>';

					if (!off) {
						str += '<div>';
						str += '<a class="pk_modal_a_bottom pk_id3picbtn" style="display:inline-block;float:none;margin:10px 8px 0 0">Change Cover</a>';
						if (st.pic) {
							str += '<a class="pk_modal_a_bottom pk_id3rm" style="display:inline-block;float:none;margin:10px 8px 0 0">Remove Image</a>';
						}
						if (st.ch) {
							str += '<a class="pk_modal_a_bottom pk_id3undo" style="display:inline-block;float:none;margin:10px 8px 0 0">Undo</a>';
						}
						str += '</div>';
					}

					box.innerHTML = str;
					if (off) return ;

					box.getElementsByClassName ('pk_id3picbtn')[0].onclick = function () {
						q.el_body.getElementsByClassName ('pk_id3picfile')[0].click ();
					};

					var rm = box.getElementsByClassName ('pk_id3rm')[0];
					if (rm) rm.onclick = function () {
						st.pic = null;
						st.ch = true;
						render_cover (q, el, off);
						dirty (q, el);
					};

					var undo = box.getElementsByClassName ('pk_id3undo')[0];
					if (undo) undo.onclick = function () {
						st.pic = st.orig || null;
						st.ch = false;
						render_cover (q, el, off);
						dirty (q, el);
					};
				};

				var render_tags = function ( q, el, tags ) {
					var off = st.type !== 'mp3';
					var dis = off ? ' disabled' : '';
					st.tag = tags || {};
					st.base = snap (st.tag);
					if (!st.ch) st.pic = st.tag.picture || null;

					var row = 'display:inline-block;width:49%;box-sizing:border-box;margin:0 1% 3px 0;vertical-align:top';
					var inp = 'width:100%;box-sizing:border-box;margin-top:2px';
					var ttl = 'padding-left:0';
					var field = function (n, l, v) {
						return '<label style="' + row + '"><span class="pk_id3ttl" style="' + ttl + '">' + l + '</span>' +
							'<input name="' + n + '" class="pk_txt" style="' + inp + '" value="' + esc(v) + '"' + dis + '/></label>';
					};
					var area = function (n, l, v, h) {
						return '<label style="display:block;width:68%;min-width:260px;max-width:460px;margin:0 1% 3px 0"><span class="pk_id3ttl" style="' + ttl + '">' + l + '</span>' +
							'<textarea name="' + n + '" class="pk_txt" style="width:100%;height:' + h + 'px;box-sizing:border-box;margin-top:2px"' + dis + '>' + esc(v) + '</textarea></label>';
					};
					var str = '<div style="margin-top:12px;max-width:640px">';
					if (off) {
						str += '<div style="padding:8px 0">Only MP3 files can be edited here. These tags are view-only.</div>';
					}
					str += field('artist', 'Artist', st.tag.artist);
					str += field('title', 'Title', st.tag.title);
					str += field('album', 'Album', st.tag.album);
					str += field('year', 'Year', st.tag.year);
					str += field('genre', 'Genre', st.tag.genre);
					str += field('track', 'Track', st.tag.track);
					str += area('comment', 'Comment', (st.tag.comment||{}).text, 38);
					str += area('lyrics', 'Lyrics', (st.tag.lyrics||{}).lyrics, 50);
					str += '<div class="pk_id3cover" style="margin-top:8px;clear:both"></div>';

					el.innerHTML = str + '</div>';
					var ins = el.querySelectorAll ('input, textarea');
					for (var i = 0; i < ins.length; ++i) {
						ins[i].oninput = function () { dirty (q, el); };
					}
					render_cover (q, el, off);
					dirty (q, el);
				};

				new PKSimpleModal({
				  title:'ID3 Tag Editor',

				  ondestroy: function( q ) {
					live = false;
					st.file = st.ab = st.pic = st.orig = st.base = null;
					st.tag = {};
					st.name = '';
					st.ch = false;
					app.ui.InteractionHandler.forceUnset (modal_id);
					app.ui.KeyHandler.removeCallback (modal_id + 'esc');
				  },

				  buttons:[
					{
						title:'DOWNLOAD COPY',
						clss:'pk_modal_a_accpt pk_inact',
						callback:function ( q ) {
							var e = function (n) {
								var x = q.el_body.querySelector ('[name="' + n + '"]');
								return x ? x.value : '';
							};
							if (!st.file || !st.ab || st.type !== 'mp3') {
								OneUp ('Choose an MP3 file inside this window first', 1200);
								return ;
							}
							var out = ID3v2.WriteTags (st.ab, {
								artist  : e('artist'),
								title   : e('title'),
								album   : e('album'),
								year    : e('year'),
								genre   : e('genre'),
								track   : e('track'),
								comment : { text:e('comment') },
								lyrics  : { lyrics:e('lyrics') },
								picture : st.pic
							});
							var url = (window.URL || window.webkitURL).createObjectURL(new Blob([out], {type:'audio/mpeg'}));
							var a = document.createElement ('a');
							a.href = url;
							a.download = ((st.file && st.file.name) || 'audiomass.mp3').replace(/\.[^\.]+$/, '') + '-tagged.mp3';
							a.style.display = 'none';
							document.body.appendChild (a);
							a.click ();
							setTimeout(function () {
								document.body.removeChild (a);
								(window.URL || window.webkitURL).revokeObjectURL(url);
							}, 100);
						}
					}
				  ],
				  body:'<input class="pk_id3file" type="file" accept="audio/*" style="display:none" />'+
					'<input class="pk_id3picfile" type="file" accept="image/*" style="display:none" />'+
					'<a class="pk_modal_a_bottom pk_id3choose" style="display:inline-block;float:none;margin:10px 0 0 0">Choose Audio File</a>'+
					'<span class="pk_id3fname" style="display:inline-block;margin-left:10px;opacity:.75;vertical-align:middle"></span>'+
					'<div class="pk_row pk_ttx">Choose an MP3 file to view/edit audio tags.</div>',
				  setup:function( q ) {
						var input  = q.el_body.getElementsByClassName ('pk_id3file')[0];
						var picinp = q.el_body.getElementsByClassName ('pk_id3picfile')[0];
						var pick   = q.el_body.getElementsByClassName ('pk_id3choose')[0];
						var fname  = q.el_body.getElementsByClassName ('pk_id3fname')[0];
						var txt_el = q.el_body.getElementsByClassName ('pk_ttx')[0];

						q.els.bottom[0].style.display = 'none';
						pick.onclick = function () { input.click (); };

						input.onchange = function ( e ) {
							var reader = new FileReader();
							var file = this.files[0];
							if (!file) return ;

							st.file = file;
							st.name = file.name || '';
							st.type = (/\.mp3$/i.test(file.name) || /mpeg|mp3/i.test(file.type)) ? 'mp3' :
								(/\.(m4a|mp4)$/i.test(file.name) || /mp4|m4a/i.test(file.type)) ? 'm4a' : '';
							st.ab = null;
							st.tag = {};
							st.orig = null;
							st.pic = null;
							st.ch = false;
							st.base = null;
							fname.textContent = st.name;
							txt_el.innerHTML = '<div style="padding:30px 0">Reading metadata...</div>';
							q.els.bottom[0].style.display = 'none';
							q.els.bottom[0].classList.add ('pk_inact');
							if (!st.type) {
								txt_el.innerHTML = '<div style="padding:30px 0">Unsupported audio file.</div>';
								return ;
							}

							reader.onload = function() {
								if (!live) return ;
								var raw = new Uint8Array (this.result);
								var tags = read_tags (this.result);
								if (!tags && (st.type === 'm4a' || (raw[0] === 73 && raw[1] === 68 && raw[2] === 51))) {
									txt_el.innerHTML = '<div style="padding:30px 0">Unsupported audio file.</div>';
									return ;
								}
								tags = tags || {};
								st.ab = this.result;
								st.type = st.type || tags._type;
								st.orig = tags.picture || null;
								st.pic = st.orig;
								st.ch = false;

								if (!st.type) {
									txt_el.innerHTML = '<div style="padding:30px 0">Unsupported audio file.</div>';
								} else {
									render_tags (q, txt_el, tags);
								}
							};

							reader.readAsArrayBuffer(file);
						};

						picinp.onchange = function () {
							var file = this.files[0];
							if (!file) return ;

							var reader = new FileReader();
							reader.onload = function () {
								if (!live) return ;
								st.pic = {
									format:file.type || 'image/jpeg',
									type:3,
									description:'',
									data:new Uint8Array(this.result)
								};
								st.ch = true;
								render_cover (q, txt_el, false);
								dirty (q, txt_el);
							};
							reader.readAsArrayBuffer(file);
						};

						if (current_tags) {
							render_tags (q, txt_el, current_tags);
						}

						app.ui.InteractionHandler.forceSet (modal_id);
						app.ui.KeyHandler.addCallback (modal_id + 'esc', function ( e ) {
							if (!app.ui.InteractionHandler.check (modal_id)) return ;
							q.Destroy ();
						}, [27]);
				  }
				}).Show();

		});


		// ---- save presets
		app.listenFor ('RequestSavePreset', function () {
			if (!curr_filter_ui) return ;

			var el = curr_filter_ui.el_body;
			if (!el) return ;

			var escapeHtml = function (text) {
			  var map = {
			    '&': '&amp;',
			    '<': '&lt;',
			    '>': '&gt;',
			    '"': '&quot;',
			    "'": '&#039;'
			  };

			  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
			};

			// check if the preset is custom
			var is_new = true;
			var custom_id = null;
			var el_presets = curr_filter_ui.el_presets;
			var sel_opt = el_presets.options[el_presets.selectedIndex];

			var inputs = el.querySelectorAll('select, input');
			var preset_obj = {
				target:curr_filter_ui.id,
				name:'My Preset',
				id:curr_filter_ui.id + '_' + ((Math.random() * 99) >> 0),
				date:Date.now(),
				val:''
			};

			if (sel_opt && sel_opt.getAttribute('data-custom'))
			{
				is_new = false;
				custom_id = sel_opt.getAttribute('data-custom');
			}

			// ----------
			for (var i = 0; i < inputs.length; ++i)
			{
				if (inputs[i].type === 'checkbox') {
					preset_obj.val += (inputs[i].checked ? '1' : '0') + ',';
				}
				else {
					preset_obj.val += inputs[i].value + ',';
				}
			}

			if (preset_obj.val.length > 0)
			{
					preset_obj.val = preset_obj.val.substring(0, preset_obj.val.length - 1);

					// open ui for setting preset name
					var modal_id = '_ctPr';
					var default_txt = '';

					var btn_delete = {};
					var btn_update = {};
					var custom_obj = null;

					if (!is_new)
					{
							custom_obj = custom_presets.GetSingle (preset_obj.target, custom_id);
							default_txt = 'value="' + custom_obj.name + '"';

							btn_delete = {
									title:'Delete',
									clss:'pk_modal_a_red',
									callback: function( q ) {

										OneUp ('Successfully deleted preset!', 1400);

										var custom = custom_presets.Del (preset_obj.target, custom_id);
										app.fireEvent ('DidSetPresets', preset_obj.target, custom);

										q.Destroy ();
										// -
									}
							};

							btn_update = {
									title:'Update',
									callback: function( q ) {

										if (custom_obj)
										{
											var input = q.el_body.getElementsByTagName ('input')[0];
											var value = input.value.trim ();

											value = escapeHtml (value);

											if (value.length > 0)
											{
												OneUp ('Successfully updated preset!', 1400);

												// add preset to localStorage
												custom_obj.name = value;
												custom_obj.val = preset_obj.val;

												custom_presets.Save ();

												var arr = custom_presets.Get (preset_obj.target);
												app.fireEvent ('DidSetPresets', preset_obj.target, arr);

												q.Destroy ();
											}
											else
											{
												OneUp ('Name is too short...', 1200);
											}
										}
										// -
									}
							};
					}

					var title = 'Save Custom Preset for filter "' + curr_filter_ui.id + '"';
					if (!is_new) {
						var cname = custom_obj.name;
						title = 'Edit Custom Preset "' + cname + '", for filter "' + curr_filter_ui.id + '"';
					}

					new PKSimpleModal({
					  title:title,
					  clss: is_new ? '' : 'pk_fnt10',

					  ondestroy: function( q ) {
						app.ui.InteractionHandler.forceUnset (modal_id);

						app.ui.KeyHandler.removeCallback (modal_id + 'esc');
						app.ui.KeyHandler.removeCallback (modal_id + 'ent');
					  },

					  buttons:[
						{
							title: is_new ? 'Save' : 'Save As New',
							clss:'pk_modal_a_accpt',
							callback: function( q ) {
								var input = q.el_body.getElementsByTagName ('input')[0];
								var value = input.value.trim ();

								value = escapeHtml (value);

								if (value.length > 0)
								{
									OneUp ('Successfully saved preset!', 1400);

									// add preset to localStorage
									preset_obj.name = value;

									var custom = custom_presets.Set (preset_obj.target, preset_obj);

									app.fireEvent ('DidSetPresets', preset_obj.target, custom);
									app.fireEvent ('RequestSetPresetActive', preset_obj.target, preset_obj.id);

									q.Destroy ();
								}
								else
								{
									OneUp ('Name is too short...', 1200);
								}
								// -
							}
						},

						btn_update,
						btn_delete
					  ],
					  body:'<label for="k07">Preset Name</label>' +
						'<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="16" placeholder="Please type a name, eg: My Preset" ' + default_txt + ' class="pk_txt" type="text" id="k07" />',
					  setup:function( q ) {
								// app.fireEvent ('RequestPause');

							app.ui.InteractionHandler.forceSet (modal_id);

							app.ui.KeyHandler.addCallback (modal_id + 'esc', function ( e ) {
								if (!app.ui.InteractionHandler.check (modal_id)) return ;

								q.Destroy ();
							}, [27]);

							app.ui.KeyHandler.addCallback (modal_id + 'en', function ( e ) {
								if (!app.ui.InteractionHandler.check (modal_id)) return ;

								q.els.bottom[0].click ();
							}, [13]);

							setTimeout(function() {
								if (q.el) {
									var inp = q.el.getElementsByTagName('input')[0];
									inp.focus ();

									if (inp.value.length > 0) {
										inp.selectionStart = inp.selectionEnd = inp.value.length;
									}
								}
							},20);
					  }
					}).Show();
					// ---
			}

			// document.querySelector('.pk_modal_main').getElementsByTagName('input')[0].value
		});









		// ---- windows ----

		var eq_win = {};
		var mix_dock_h = 280;

		var resizeDock = function () {
			if (!app.ui || !app.ui.BarBtm) return ;
			app.ui.BarBtm.SetHeight (eq_win.mix && eq_win.mix.type === 1 ? mix_dock_h + 30 : 130);
			app.fireEvent ('RequestResize');
		};

		app.listenFor ('WillUnload', function () {
			var cur;

			for (var k in eq_win) {
				cur = eq_win[k];
				if (cur && !cur.type) {
					cur.destroy && cur.destroy ();
				}
			}

			eq_win = {};
		});

		app.listenFor ('RequestDragI', function ( url, start ) {
			if (app.isMobile) {
				alert ('unsupported on mobile');
				return ;
			}

			var cur_win = eq_win[url];

			if (!cur_win || !cur_win.el) return ;

			var dock = app.ui.BarBtm.el;
			dock.classList.add ('pk_drag');

			cur_win.el.style.pointerEvents = 'none';
			cur_win.el.style.zIndex = '15';

			if (cur_win.win && cur_win.win.document && cur_win.win.document.body)
				cur_win.win.document.body.classList.add ('c');

			var el_back = document.createElement ('div');
			el_back.className = 'pk_modal_back';
			document.body.appendChild (el_back);

			var is_drag = true;
			var x = start && start[0] !== undefined ? start[0] : null;
			var y = start && start[1] !== undefined ? start[1] : null;
			var moved = 2;
			var did_undock = false;
			var drag_docs = [];
			var child_doc = cur_win.win && cur_win.win.document;
			if (child_doc && child_doc !== d) drag_docs.push ( child_doc );

			var top = parseInt (cur_win.el.style.top) || 0;
			var left = parseInt (cur_win.el.style.left) || 0;

			app.ui.InteractionHandler.on = true;

			setTimeout (function() {
				if (cur_win && cur_win.el)
				{
					cur_win.el.style.display = 'none';
					setTimeout(function() {
						cur_win.el.style.display = 'block';
					},0);
					el_back.focus ();
				}
			}, 60);

			var evPos = function ( e ) {
				return [
					e.screenX === undefined ? e.pageX : e.screenX,
					e.screenY === undefined ? e.pageY : e.screenY
				];
			};

			var atViewEdge = function ( e ) {
				var win_x = window.screenLeft || window.screenX || 0;
				var win_y = window.screenTop || window.screenY || 0;

				if (e.screenX !== undefined && (
					e.screenX <= win_x + 3 ||
					e.screenX >= win_x + window.innerWidth - 3 ||
					e.screenY <= win_y + 3 ||
					e.screenY >= win_y + window.innerHeight - 3
				)) return true;

				return e.view === window && (
					e.clientX <= 3 || e.clientY <= 3 ||
					e.clientX >= window.innerWidth - 3 ||
					e.clientY >= window.innerHeight - 3
				);
			};

			var outOfView = function () {
				var rect = cur_win.el && cur_win.el.getBoundingClientRect ();
				return rect && (
					rect.left <= -3 ||
					rect.top <= -3 ||
					rect.right >= window.innerWidth + 3 ||
					rect.bottom >= window.innerHeight + 3
				);
			};

			var move = function ( e ) {
				if (!is_drag) return ;
				var pos = evPos ( e );

				if (x === null)
				{
					x = pos[0];
					y = pos[1];

					return ;
				}

				var dist_x = pos[0] - x;
				var dist_y = pos[1] - y;
				if (!dist_x && !dist_y) return ;

				top  += dist_y;
				left += dist_x;

				cur_win.el.style.top  = top + 'px';
				cur_win.el.style.left = left + 'px';

				x = pos[0];
				y = pos[1];

				--moved;

				if (atViewEdge ( e ) || outOfView ()) {
					undock ( e );
				}
			};

			var up = function ( e ) {
				if (!el_back) return ;
				is_drag = false;

				if (cur_win && cur_win.win && cur_win.win.document && cur_win.win.document.body)
					cur_win.win.document.body.classList.remove ('c');
				if (cur_win && cur_win.el) {
					cur_win.el.style.pointerEvents = '';
					cur_win.el.style.zIndex = '';
				}
				dock.classList.remove ('pk_drag');

				app.ui.InteractionHandler.on = false;

				for (var di = 0; di < drag_docs.length; ++di) {
					drag_docs[di].removeEventListener ('mousemove', move);
					drag_docs[di].removeEventListener ('mouseup', up);
				}

				if (el_back && el_back.parentNode)
					document.body.removeChild (el_back);

				if (e.type === 'mouseup')
				{
					cur_win.el.style.top = '0px';
					if (moved > 0)
					{
						var ch = app.ui.BarBtm.el.childNodes;

						var lw = 0;
						for (var ji = 0; ji < ch.length; ++ji) {
							if (cur_win.el === ch[ji]) break;
							lw += ch[ji].clientWidth + 18;
						}

						cur_win.el.style.left = lw + 'px';
						// ----
					}
					// check if we didn't move - in that return
				}

				el_back.onmousemove = null;
				el_back.onmouseleave = null;
				el_back.onmouseup = null;
				el_back = null;
			};

			var eventOutOfView = function ( e ) {
				var x = e.clientX;
				var y = e.clientY;
				if (x === undefined || y === undefined) return true;
				return x <= 0 || y <= 0 ||
					x >= window.innerWidth ||
					y >= window.innerHeight;
			};

			var leavesWindow = function ( e ) {
				return !e.relatedTarget && !e.toElement;
			};

			var screenPos = function ( e ) {
				return [
					e.screenX === undefined ? (window.screenLeft + (e.pageX || e.clientX || 0)) : e.screenX,
					e.screenY === undefined ? (window.screenTop + (e.pageY || e.clientY || 0)) : e.screenY
				];
			};

			var undock = function ( e ) {
				if (did_undock) return ;
				did_undock = true;

				var pos = screenPos ( e );
				up ( e );
				app.fireEvent ('RequestShowFreqAn', url, [ pos, 0]);
			};

			el_back.onmousemove = move;
			el_back.onmouseup = up;
			el_back.onmouseleave = function ( e ) {
				if (!eventOutOfView ( e ) && !leavesWindow ( e )) return ;
				undock ( e );
			};

			for (var di = 0; di < drag_docs.length; ++di) {
				drag_docs[di].addEventListener ('mousemove', move, false);
				drag_docs[di].addEventListener ('mouseup', up, false);
			}
		});

		app.listenFor ('RequestShowFreqAn', function ( url, args_arr ) {

			if (app.isMobile) {
				alert ('Currently unsupported on mobile');
				return ;
			}

			args_arr = args_arr || [];
			var toggle = args_arr[ 0 ];
			var type   = args_arr[ 1 ];
			var title = 'Frequency Analysis';
			var curr_win = eq_win[ url ];
			var is_mix = url === 'mix';

			if (url === 'sp') title = 'Spectrum Analysis';
			if (is_mix) title = 'Multitrack Mixer';

			var toggled = false;
			if (curr_win && toggle)
			{
				var ext = false;
				if (curr_win.type === type || type === undefined) ext = true;

				curr_win.destroy ();
				curr_win = null;

				eq_win[url] = null;
				resizeDock ();

				if (ext) return ;
				toggled = true;
			}

			var freq_cb = function (_, freq) {
				if (is_mix) return ;
				curr_win && curr_win.win && curr_win.win.update && curr_win.win.update (freq);
			};

			var setEvents = function ( obj, _url ) {
				var destroy = obj.destroy;
				var done = false;
				var cleanup = function () {
					if (done) return ;
					done = true;
					if (!is_mix) app.stopListeningFor ('DidAudioProcess', freq_cb);
					app.fireEvent ('DidToggleFreqAn', _url, null);

					// if (obj && obj.type === undefined) {
					if (obj && obj === eq_win[_url]) {
						eq_win[_url] = null;
					}

					var stop = true;
					for (var k in eq_win) {
						if (eq_win[k] && k !== 'mix') {
							stop = false;
							break;
						}
					}

					if (stop) app.engine.wavesurfer.backend.logFrequencies = false;
					resizeDock ();
				};
				obj.destroy = function () {
					destroy && destroy ();
					cleanup ();
				};
				obj.win.destroy = cleanup;

				if (!is_mix) app.listenFor ('DidAudioProcess', freq_cb);
				app.fireEvent ('DidToggleFreqAn', _url, curr_win);
				if (!is_mix) app.engine.wavesurfer.backend.logFrequencies = true;
			};

			if (!type)
			{
				var makePopup = function ( dat ) {
					var extra = '';
					if (dat && dat[0]) {
						dat[0] = Math.max (0, dat[0] - 200) >> 0;
						dat[1] = Math.max (0, dat[1]) >> 0;

						extra = ',left=' + dat[0] + ',top=' + dat[1];
					}

					var size = is_mix ? [760, 320] : [600, 188];
					var wnd = window.open ('/' + url + '.html', title, "directories=no,titlebar=no,toolbar=no,"+
							"location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=" + size[0] + ",height=" + size[1] + extra);

					if (!wnd) {
						OneUp ('Please allow pop-ups for AudioMass!', 3600, 'pk_r');
						return ;
					}

					eq_win[url] = {
						type : type,
						el   : null,
						win  : wnd,
						destroy : function () {
							wnd && wnd.close && wnd.close ();
						}
					};

					curr_win = eq_win[url];

					// wnd.moveTo(500, 100);

					setEvents ( curr_win, url );
				};

				if (!toggled) makePopup (toggle);
				else setTimeout(function(){makePopup (toggle)}, 130);
			}
			else if (type === 1)
			{
				var iframe = document.createElement ('iframe');
				iframe.className = 'pk_frqan' + (is_mix ? ' pk_mixwin' : '');
				iframe.id = 'pk_fr' + url;

				if (app.ui.BarBtm.on) {
					var ch = app.ui.BarBtm.el.childNodes;
					var lw = 0;
					for (var ji = 0; ji < ch.length; ++ji) {
						lw += ch[ji].clientWidth + 18;
					}

					iframe.style.left = lw + 'px';
				}

				app.ui.BarBtm.el.appendChild( iframe );
				app.ui.BarBtm.Show ();

				eq_win[url] = {
					type : type,
					el   : iframe,
					win  : null,
					destroy : function () {
						iframe.parentNode.removeChild ( iframe );
						iframe = null;

						var ch = app.ui.BarBtm.el.childNodes;
						if (ch.length === 0) {
							app.ui.BarBtm.Hide ();
							return ;
						}

						setTimeout(function () {
							var lw = 0;
							for (var ji = 0; ji < ch.length; ++ji) {
								if (!ch[ji] || !ch[ji].parentNode) continue;

								if (ch[ji].offsetTop > -20) {
									ch[ji].style.top = '0px';
									ch[ji].style.left = lw + 'px';
								}

								lw += ch[ji].clientWidth + 18;
							}
						},198);
						// --
					}
				};

				curr_win = eq_win[url];
				resizeDock ();

				iframe.onload = function (e) {
					if (curr_win && curr_win.type === type)
					{
						curr_win.win = iframe.contentWindow;
						setEvents ( curr_win, url );
					}
				};
				iframe.src = '/' + url + '.html?iframe=1';
			}
			// ---

		});

		// ----
	};

	PKAE._deps.uifx = PKUI_FX;

})( window, document, PKAudioEditor );
