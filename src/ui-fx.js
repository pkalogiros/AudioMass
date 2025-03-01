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
				'<input type="range" class="pk_horiz" min="0.2" max="2.0" step="0.05" value="1.0" />'+
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
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'speed';

			var x = new PKAudioFXModal({
				id: filter_id,
			  title:'Change Speed',
				presets:[
					{name:'-1/4',val:0.25},
					{name:'-1/2',val:0.5},
					{name:'Slightly slower',val:0.85},
					{name:'Slightly faster',val:1.1},
					{name:'+1/4',val:1.25},
					{name:'+1/2',val:1.5}
				],
				custom_pres:custom_presets.Get (filter_id),
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var input = q.el_body.getElementsByTagName('input')[0];
				var value = input.value.trim() / 1;
				app.fireEvent ('RequestActionFX_PREVIEW_SPEED', value);
			},

			  buttons: [
				{
					title:'Apply Rate',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var input = q.el_body.getElementsByTagName('input')[0];
						var value = input.value.trim() / 1;

						if (value != 1.0)
							app.fireEvent ('RequestActionFX_SPEED', value);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row" style="border:none"><label>Playback Rate</label>' + 
				'<input type="range" class="pk_horiz" min="0.2" max="2.0" step="0.05" value="1.0" />'+
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
							offset = PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(3)/1;

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
					cursor_pos_el.innerHTML = PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(2) + 's';

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
					value[0] = {val:inputs[0].value / 1};
					value[1] = {val:inputs[1].value / 1};
					value[2] = {val:inputs[2].value / 1};
					value[3] = {val:inputs[3].value / 1};
					value[4] = {val:inputs[4].value / 1};
				}

				ret = {
					threshold: value[0],
					knee:  value[1],
					ratio:  value[2],
					attack:  value[3],
					release:  value[4]
				};

				return (ret);
			};

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Compression to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
				presets:[
					{name:'Classic',val:'-40,5,7,0.002,0.1'},
					{name:'Light',val:'-6,2,2.5,0.002,0.05'},
					{name:'Dashed Distortion',val:'-45,26,2.05,0.233,0.0'},
					{name:'Chaotic Distortion',val:'-60,14,11.07,0.036,0.00'}
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

				'<div class="pk_row" style="border:none"><label class="pk_line">Release</label>' + 
				'<input class="pk_horiz" type="range" min="0.0" max="1.0" step="0.001" value="0.25" />'+
				'<span class="pk_val">0.25</span></div>',
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
				// ---
			  }
			}, app);
			x.Show();
		});


		app.listenFor ('RequestActionFXUI_Normalize', function () {
			app.fireEvent ('RequestSelect', 1);

			var x = new PKSimpleModal({
			  title: 'Normalize',
			  ondestroy: function( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback ('modalTemp');
			  },
			  buttons:[
				{
					title:'Normalize Audio',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var input = q.el_body.getElementsByClassName('pk_horiz')[0];
						var value = (input.value / 1);

						var toggle = q.el_body.getElementsByClassName('pk_check')[0].checked;
						app.fireEvent ('RequestActionFX_Normalize', [toggle, value]);
						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row">'+
			    '<input type="checkbox" id="vhcjgs" class="pk_check" name="normEqually">'+
				'<label for="vhcjgs">Normalize L/R Equally</label></div>' + 
				'<div class="pk_row" style="border:none"><label>Normalize to</label>'+
				'<input type="range" min="0.0" max="2.0" class="pk_horiz" step="0.01" value="1.0" />'+
				'<span class="pk_val">100%</span></div>',
			  setup:function( q ) {
				  var range = q.el_body.getElementsByClassName('pk_horiz')[0];
				  var span = q.el_body.getElementsByClassName('pk_val')[0];

				  range.oninput = function() {
					span.innerHTML = (((range.value/1)*100) >> 0) + '%';
				  };

				  app.fireEvent ('RequestPause');
				  app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
						q.Destroy ();
					}, [27]);
			  }
			});x.Show();
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
				{name:'Reset', val:'0,0,0,0,0,0,0,0,0,0'},
				{name:'Old Radio', val:'-25,-22,-20,-18,-9,0,8,10,-8,-25'},
				{name:'Lo Fi', val:'-18,-12,0,2,0,4,4,-1,-6,-8'}
			];
			var band_q = 4.6;

			if (num_of_bands === 20)
			{
				filter_id += '_2';
				presets = null; // maybe add presets?
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
				{name:'Spacey',val:'3.0,0.6,0.3'}
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

		// -----

		var current_tags = null;
		app.listenFor ('RequestActionID3', function (flag, new_tags) {
				if (flag) {
					current_tags = new_tags;
					return ;
				}

				var modal_id = '_id3';

				var render_tags = function ( el, tags ) {
					var str = '<div style="margin-top:18px">';

					str += '<div><span class="pk_id3ttl">Artist</span><span>' + (tags.artist || '-') + '</span></div>';
					str += '<div><span class="pk_id3ttl">Title</span><span>' + (tags.title || '-') + '</span></div>';
					str += '<div><span class="pk_id3ttl">Album</span><span>' + (tags.album || '-') + '</span></div>';
					str += '<div><span class="pk_id3ttl">Year</span><span>' + (tags.year || '-') + '</span></div>';
					str += '<div><span class="pk_id3ttl">Genre</span><span>' + (tags.genre || '-') + '</span></div>';
					str += '<div style="max-width:700px"><span class="pk_id3ttl">Comment</span><span>' + ((tags.comment||{}).text || '-') + '</span></div>';
					str += '<div><span class="pk_id3ttl">Track</span><span>' + (tags.track || '-') + '</span></div>';
					str += '<div style="max-width:700px"><span class="pk_id3ttl">Lyrics</span><span>' + ((tags.lyrics||{}).lyrics || '-') + '</span></div>';

					if ('picture' in tags)
					{
						var image = tags.picture;
						var base64str = '';
						for (var i = 0; i < image.data.length; ++i) {
							base64str += String.fromCharCode (image.data[i]);
						}

						str += '<div><span style="float:left" class="pk_id3ttl">Cover</span>' +
								'<span><img style="max-width:340px" src="data:' + 
								image.format + ';base64,' + window.btoa(base64str) + '"/></span></div>';
					}

					el.innerHTML = str + '</div>';
				};

				new PKSimpleModal({
				  title:'ID3 Metatags Explorer',

				  ondestroy: function( q ) {
				  	app.ui.InteractionHandler.forceUnset (modal_id);
					app.ui.KeyHandler.removeCallback (modal_id + 'esc');
				  },

				  buttons:[
				  ],
				  body:'<input type="file" accept="audio/*" />'+
				  	'<div class="pk_row pk_ttx">Choose file to view audio metatags!</div>',
				  setup:function( q ) {
				  		var input  = q.el_body.getElementsByTagName ('input')[0];
				  		var txt_el = q.el_body.getElementsByClassName ('pk_ttx')[0];

				  		input.onchange = function ( e ) {
							var reader = new FileReader();
							
							reader.onload = function() {
								var tags = PKAudioEditor.engine.ID3 (this.result);

								if (!tags) {
									txt_el.innerHTML = '<div style="padding:30px 0">No audio metadata found...</div>';
								} else {
									render_tags (txt_el, tags);
								}
							};

							reader.readAsArrayBuffer(this.files[0]);
				  		};

				  		if (current_tags) {
				  			render_tags (txt_el, current_tags);
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
						'<input style="min-width:340px" maxlength="16" placeholder="Please type a name, eg: My Preset" ' + default_txt + ' class="pk_txt" type="text" id="k07" />',
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

		app.listenFor ('RequestDragI', function ( url ) {
			if (app.isMobile) {
				alert ('unsupported on mobile');
				return ;
			}

			var cur_win = eq_win[url];

			if (!cur_win || !cur_win.el) return ;

			cur_win.el.style.pointerEvents = 'none';
			cur_win.el.style.zIndex = '9';

			cur_win.win.document.body.classList.add ('c');

			var el_back = document.createElement ('div');
			el_back.className = 'pk_modal_back';
			document.body.appendChild (el_back);

			var is_drag = true;
			var x = 0;
			var y = 0;
			var moved = 2;

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

			el_back.onmousemove = function ( e ) {
				if (!is_drag) return ;

				if (x === 0 && y === 0)
				{
					x = e.pageX;
					y = e.pageY;

					return ;
				}

				var dist_x = e.pageX - x;
				var dist_y = e.pageY - y;

				top  += dist_y;
				left += dist_x;

				cur_win.el.style.top  = top + 'px';
				cur_win.el.style.left = left + 'px';

				x = e.pageX;
				y = e.pageY;

				--moved;
			};

			el_back.onmouseup = function ( e ) {
				is_drag = false;

				cur_win.win.document.body.classList.remove ('c');
				cur_win.el.style.pointerEvents = '';
				cur_win.el.style.zIndex = '7';

				app.ui.InteractionHandler.on = false;

				document.body.removeChild (el_back);

				if (e.type === 'mouseup')
				{
					if (moved > 0)
					{
						cur_win.el.style.top  = '0px';

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

			el_back.onmouseleave = function ( e ) {
				el_back.onmouseup ( e );
				app.fireEvent ('RequestShowFreqAn', url, [ [(window.screenLeft + e.pageX)||0, (window.screenTop + e.pageY)||0], 0]);
			};
		});

		app.listenFor ('RequestShowFreqAn', function ( url, args_arr ) {

			if (app.isMobile) {
				alert ('Currently unsupported on mobile');
				return ;
			}

			var toggle = args_arr[ 0 ];
			var type   = args_arr[ 1 ];
			var title = 'Frequency Analysis';
			var curr_win = eq_win[ url ];

			if (url === 'sp') title = 'Spectrum Analysis';

			var toggled = false;
			if (curr_win && toggle)
			{
				var ext = false;
				if (curr_win.type === type) ext = true;

				curr_win.destroy ();
				curr_win = null;

				eq_win[url] = null;

				if (ext) return ;
				toggled = true;
			}

			var freq_cb = function (_, freq) {
				curr_win && curr_win.win.update && curr_win.win.update (freq);
			};

			var setEvents = function ( obj, _url ) {
				obj.win.destroy = function () {
					app.stopListeningFor ('DidAudioProcess', freq_cb);
					app.fireEvent ('DidToggleFreqAn', _url, null);

					// if (obj && obj.type === undefined) {
					if (obj && obj === eq_win[url]) {
						eq_win[url] = null;
					}

					var stop = true;
					for (var k in eq_win) {
						if (eq_win[k]) {
							stop = false;
							break;
						}
					}

					if (stop) app.engine.wavesurfer.backend.logFrequencies = false;
				};

				app.listenFor ('DidAudioProcess', freq_cb);
				app.fireEvent ('DidToggleFreqAn', _url, curr_win);
				app.engine.wavesurfer.backend.logFrequencies = true;
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

					var wnd = window.open ('/' + url + '.html', title, "directories=no,titlebar=no,toolbar=no,"+
							"location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=600,height=188" + extra);

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
				iframe.className = 'pk_frqan';
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