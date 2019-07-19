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


		app.listenFor ('RequestFXUI_Gain', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'gain';

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
				var input = q.el_body.getElementsByTagName('input')[0];
				var value = input.value.trim() / 1;
				app.fireEvent ('RequestActionFX_PREVIEW_GAIN', value);
			},

			  buttons: [
				{
					title:'Apply Gain',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var input = q.el_body.getElementsByTagName('input')[0];
						var value = input.value.trim() / 1;

						if (value != 1.0)
							app.fireEvent ('RequestActionFX_GAIN', value);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row" style="border:none"><label>Gain percentage</label>' + 
				'<input type="range" class="pk_horiz" min="0.0" max="2.5" step="0.01" value="1.0" />'+
				'<span class="pk_val">100%</span></div>',
			  setup:function( q ) {
				  var range = q.el_body.getElementsByTagName ('input')[0];
				  var span = q.el_body.getElementsByTagName  ('span')[0];

				  range.oninput = function() {
					span.innerHTML = ((range.value * 100) >> 0) + '%';
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
					{name:'Slightly faster%',val:1.1},
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
							offset = PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(2)/1;

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
				var val = {
					threshold: inputs[0].value/1,
					knee:  inputs[1].value/1,
					ratio:  inputs[2].value/1,
					attack:  inputs[3].value/1,
					release:  inputs[4].value/1
				};
				app.fireEvent ('RequestActionFX_PREVIEW_COMPRESSOR', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {		
						var inputs = q.el_body.getElementsByTagName('input');
						var val = {
							threshold: inputs[0].value/1,
							knee:  inputs[1].value/1,
							ratio:  inputs[2].value/1,
							attack:  inputs[3].value/1,
							release:  inputs[4].value/1
						};
						
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
						threshold: inputs[0].value/1,
						knee:  inputs[1].value/1,
						ratio:  inputs[2].value/1,
						attack:  inputs[3].value/1,
						release:  inputs[4].value/1
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




		app.listenFor ('RequestActionFXUI_GraphicEQ', function ( num_of_bands ) {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'graph_eq';

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
			var band_q = 1.1;

			if (num_of_bands === 20)
			{
				filter_id += '_2';
				presets = null; // maybe add presets?
				band_q = 4.0;
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

						var updateFilter = function () {
							var val = [];
							  
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
							return (val);
						};
				app.fireEvent ('RequestActionFX_PREVIEW_PARAMEQ', updateFilter ());
			},

			  buttons: [
				{
					title:'Apply EQ',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {
						var ranges = q.el_body.getElementsByTagName('input');
						var len = ranges.length;

						var updateFilter = function () {
							var val = [];
							  
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
							return (val);
						};
						app.fireEvent ('RequestActionFX_PARAMEQ', updateFilter ());

						q.Destroy ();
					}
				}
			  ],
			  presets:presets,
			  body:'<div class="pk_h200">' +
			  	bands_str+
				'<div style="clear:both;"></div></div>',
			  setup:function( q ) {
					var ranges = q.el_body.getElementsByTagName('input');
					var len = ranges.length;

					var updateFilter = function () {
						var val = [];
						  
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
						return (val);
					};

					for (var i = 0; i < len; ++i) {
						var range = ranges[i];

						range.oninput = function() {
						  var span = this.parentNode.getElementsByTagName('span')[0];
						  span.innerHTML = ((this.value) >> 0) + ' db';
						  app.fireEvent ('RequestActionFX_UPDATE_PREVIEW', updateFilter ());
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
				var inputs = q.el_body.getElementsByTagName('input');
				var val = {
					delay:     inputs[0].value/1,
					feedback:  inputs[1].value/1,
					mix:       inputs[2].value/1
				};
				app.fireEvent ('RequestActionFX_PREVIEW_DELAY', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {		
						var inputs = q.el_body.getElementsByTagName('input');
						var val = {
							delay:     inputs[0].value/1,
							feedback:  inputs[1].value/1,
							mix:       inputs[2].value/1
						};
						
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
						delay:     inputs[0].value/1,
						feedback:  inputs[1].value/1,
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


		app.listenFor ('RequestActionFXUI_Distortion', function () {
			app.fireEvent ('RequestSelect', 1);

			var filter_id = 'dist';

			var x = new PKAudioFXModal({
			  id    : filter_id,
			  title : 'Apply Distortion to selected range',
			  clss  : 'pk_bigger',
			ondestroy: function ( q ) {
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (modal_esc_key);
			},
			preview: function ( q ) {
				var inputs = q.el_body.getElementsByTagName('input');
				var val = inputs[0].value/1;
				app.fireEvent ('RequestActionFX_PREVIEW_DISTORT', val);
			},

			  buttons: [
				{
					title:'Apply',
					clss:'pk_modal_a_accpt',
					callback: function( q ) {		
						var inputs = q.el_body.getElementsByTagName('input');
						var val = inputs[0].value/1;
						
						app.fireEvent ('RequestActionFX_DISTORT', val);

						q.Destroy ();
					}
				}
			  ],
			  body:'<div class="pk_row"><label class="pk_line">Gain</label>' + 
				'<input class="pk_horiz" type="range" min="0.0" max="2.0" step="0.01" value="0.5" />'+
				'<span class="pk_val">0.5</span></div>',

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
				
				function updateFilter() {
					var inputs = q.el_body.getElementsByTagName('input');
					var val =  inputs[0].value/1;
					
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

		var eq_win = null;

		app.listenFor ('WillUnload', function () {
			if (eq_win && !eq_win.type) {
				eq_win.destroy && eq_win.destroy ();
			}
		});

		app.listenFor ('RequestDragI', function () {
			if (app.isMobile) {
				alert ("unsupported on mobile");
				return ;
			}

			if (!eq_win || !eq_win.el) return ;

			eq_win.el.style.pointerEvents = 'none';
			eq_win.el.style.zIndex = '9';

			eq_win.win.document.body.classList.add ('c');

			var el_back = document.createElement ('div');
			el_back.className = 'pk_modal_back';
			document.body.appendChild (el_back);

			var is_drag = true;
			var x = 0;
			var y = 0;
			var moved = 2;

			var top = parseInt (eq_win.el.style.top) || 0;
			var left = parseInt (eq_win.el.style.left) || 0;

			app.ui.InteractionHandler.on = true;

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

				eq_win.el.style.top  = top + 'px';
				eq_win.el.style.left = left + 'px';

				x = e.pageX;
				y = e.pageY;

				--moved;
			};

			el_back.onmouseup = function ( e ) {
				is_drag = false;

				eq_win.win.document.body.classList.remove ('c');
				eq_win.el.style.pointerEvents = '';
				eq_win.el.style.zIndex = '7';

				app.ui.InteractionHandler.on = false;

				document.body.removeChild (el_back);

				if (e.type === 'mouseup')
				{
					if (moved > 0)
					{
						eq_win.el.style.top  = '0px';
						eq_win.el.style.left = '0px';
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
				app.fireEvent ('RequestShowFreqAn', [(window.screenLeft + e.pageX)||0, (window.screenTop + e.pageY)||0], 0);
			};
		});

		app.listenFor ('RequestShowFreqAn', function ( toggle, type ) {

			if (app.isMobile) {
				alert ("unsupported on mobile");
				return ;
			}

			var toggled = false;
			if (eq_win && toggle)
			{
				var ext = false;
				if (eq_win.type === type) ext = true;

				eq_win.destroy ();
				eq_win = null;

				if (ext) return ;
				toggled = true;
			}

			var freq_cb = function (_, freq) {
				eq_win && eq_win.win && eq_win.win.update && eq_win.win.update (freq);
			};

			var setEvents = function ( type ) {
				eq_win.win.destroy = function () {
					app.engine.wavesurfer.backend.logFrequencies = false;
					app.stopListeningFor ('DidAudioProcess', freq_cb);
					app.fireEvent ('DidToggleFreqAn', null);

					if (eq_win && eq_win.type === type) eq_win = null;
				};

				app.listenFor ('DidAudioProcess', freq_cb);
				app.fireEvent ('DidToggleFreqAn', eq_win);
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

					var wnd = window.open ('/eq.html', "Frequency Analysis", "directories=no,titlebar=no,toolbar=no,"+
							"location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=600,height=188" + extra);

					eq_win = {
						type : type,
						el   : null,
						win  : wnd,
						destroy : function () {
							wnd && wnd.close && wnd.close ();
						}
					};
					// wnd.moveTo(500, 100);

					setEvents ();
				};

				if (!toggled) makePopup (toggle);
				else setTimeout(function(){makePopup (toggle)}, 130);
			}
			else if (type === 1)
			{
				var iframe = document.createElement('iframe');
				iframe.id = 'pk_frqan';

				app.ui.BarBtm.el.appendChild( iframe );
				app.ui.BarBtm.Show ();

				eq_win = {
					type : type,
					el   : iframe,
					win  : null,
					destroy : function () {
						iframe.parentNode.removeChild ( iframe );
						iframe = null;

						app.ui.BarBtm.Hide ();
					}
				};

				iframe.onload = function (e) {
					if (eq_win && eq_win.type === type)
					{
						eq_win.win = iframe.contentWindow;
						setEvents ();
					}
				};
				iframe.src = '/eq.html?iframe=1';
			}
			// ---

		});

		// ----
	};

	PKAE._deps.uifx = PKUI_FX;

})( window, document, PKAudioEditor );