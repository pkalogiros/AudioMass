(function ( w, d ) {
	
	var _id = 0;

	function PKSimpleModal ( config ) {
		var q = this;

		this.id = config.id ? config.id : (++_id);

		var el = d.createElement ('div');
		this.els = {
			toolbar:[],
			bottom:[]
		};
		el.className = 'pk_modal ' + (config.clss ? config.clss : '');

		q.el = el;

		// backdrop
		var el_back = d.createElement ('div');
		el_back.className = 'pk_modal_back';
		this.el_back = el_back;

		// var centerer
		var el_cont = d.createElement ('div');
		el_cont.className = 'pk_modal_cnt';
		this.el_cont = el_cont;
		
		// title
		var el_title = d.createElement ('div');
		el_title.className = 'pk_noselect pk_modal_title';
		el_title.innerHTML = '<span>'+ (config.title || '') +'</span>';
		el.appendChild ( el_title );
		this.el_title = el_title;

		// main
		var el_main = d.createElement ('div');
		el_main.className = 'pk_modal_main';
		el.appendChild ( el_main );
		this.el_body = el_main;

		// bottom buttons
		var el_bottom = d.createElement ('div');
		el_bottom.className = 'pk_noselect pk_modal_bottom';
		// -----------
		var a_cancel = d.createElement ('a');
		a_cancel.innerHTML = 'CANCEL';
		a_cancel.className = 'pk_modal_cancel pk_modal_a_bottom';
		a_cancel.onclick = function () {
			q.Destroy ();
		};
		el_bottom.appendChild ( a_cancel );
		
		// check if we need to construct more buttons from the config...
		if (config.buttons && config.buttons.length > 0)
		{
			for (var i = 0; i < config.buttons.length; ++i)
			{
				var curr = config.buttons[i];

				if (!curr.title || !curr.callback) continue;
				var a_bottom = d.createElement ('a');
				a_bottom.innerHTML = curr.title;
				a_bottom.className = 'pk_modal_a_bottom ' + (curr.clss ? curr.clss : '');
				
				if (curr.callback)
				{
					(function ( callback ) {
						a_bottom.onclick = function () {
							callback ( q );
						};
					})( curr.callback );
				}
				q.els.bottom.push (a_bottom);
				el_bottom.appendChild ( a_bottom );
			}
		}
		el.appendChild ( el_bottom );

		// -----
		if (config.toolbar && config.toolbar.length > 0)
		{
			for (var i = 0; i < config.toolbar.length; ++i)
			{
				var curr = config.toolbar[i];
				if (!curr.title || !curr.callback) continue;
				var a_link = d.createElement ('a');
				a_link.innerHTML = curr.title;
				a_link.className = 'pk_modal_a_top ' + (curr.clss ? curr.clss : '');
				el_title.appendChild ( a_link );

				if (curr.callback)
				{
					(function ( callback ) {
						a_link.onclick = function () {
							callback ( q, this );
						};
					})( curr.callback );
				}
				q.els.toolbar.push (a_link);
			}
		}

		this.ondestroy = config.ondestroy;
		if (config.body) q.el_body.innerHTML = config.body;
		if (config.onpreset) this.onpreset = config.onpreset;
		if (config.setup) config.setup ( this );
	};
	
	PKSimpleModal.prototype.Show = function () {

		this.el_back.appendChild ( this.el_cont );
		this.el_cont.appendChild ( this.el );

		d.body.appendChild ( this.el_back );

		return (this);
	};

	PKSimpleModal.prototype.Destroy = function () {

		if (this.ondestroy) {
			this.ondestroy ( this );
			this.ondestroy = null;
		}
		this.els = null;
		d.body.removeChild ( this.el_back );
	};

	
	// Extended modal 
	function PKAudioFXModal ( config, app ) {
		var toolbar = null;

		if (config.preview)
		{
			toolbar = [
				{
					title:'ON',
					clss:'pk_inact',
					callback: function ( q, el ) {
						app.fireEvent ('RequestActionFX_TOGGLE');
					}
				},
				{
					title:'Preview',
					callback: function ( q ) {
						config.preview && config.preview ( q );
					}
				}
			];
		}

		var inner_modal = new PKSimpleModal({
			id: config.id,
			title: config.title,
			clss: config.clss,
			presets: config.presets,
			updateFilter: config.updateFilter,
			ondestroy: function ( q ) {

				app.fireEvent ('DidCloseFX_UI');

				app.stopListeningFor ('DidStartPreview',  q._evstart);
				app.stopListeningFor ('DidStopPreview',   q._evstop);
				app.stopListeningFor ('DidTogglePreview', q._evtoggle);
				app.stopListeningFor ('DidSetPresets', q._updatePresets);
				app.stopListeningFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);
				app.stopListeningFor ('RequestSetPresetActive',  q._updpreset);

				app.fireEvent ('RequestActionFX_PREVIEW_STOP');

				// if preview remove callback
				app.ui.KeyHandler.removeCallback ('ksp' + q.id);

				
				config.ondestroy && config.ondestroy ( q );
			},
			toolbar: toolbar,
			buttons: config.buttons,
			body: config.body,
			onpreset: config.onpreset,
			setup:function( q ) {
				app.fireEvent ('RequestActionFX_TOGGLE', 1);

				var slf = this;
				app.ui.KeyHandler.addCallback ('ksp' + q.id, function ( key, map ) {
					if (!app.ui.InteractionHandler.check ('modalfx')) return ;

					var tb = slf.toolbar;
					if (tb && tb.length > 0)
					{
						var k = tb.length;
						while (k-- > 0) {
							if (tb[k].title === 'Preview') {
								tb[k].callback ( q );
								break;
							}
						}
					}
				}, [32]);

			  q._evstart = function () {
				  q.els.toolbar[0].classList.remove ('pk_inact');
				  q.els.toolbar[1].classList.add ('pk_act');
			  };
			  q._evstop = function () {
				  q.els.toolbar[0].classList.add ('pk_inact');
				  q.els.toolbar[1].classList.remove ('pk_act');										  
			  }

			  q._evtoggle = function ( val ) {
				  var el = q.els.toolbar[0];
				  if (val) el.innerHTML = 'ON';
				  else el.innerHTML = 'OFF';									
			  };

			  var stopped_listening = false;
			  q._updpreview = function ( val ) {
					var sel_opt = q.el_presets.options[q.el_presets.selectedIndex];
				  	var btn = q.el.getElementsByClassName('pk_sel_edt')[0];

				  	if (val === 't')
				  	{
				  		if (sel_opt && sel_opt.getAttribute('data-custom')) {
							btn.style.visibility = 'visible';
							btn.style.opacity = '1';
							app.stopListeningFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);
				  		}
				  		else
				  		{
							btn.style.visibility = 'hidden';
							btn.style.opacity = '0';

							app.stopListeningFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);

							//if (stopped_listening)
							//{
								setTimeout(function (){
				  					app.listenFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);
				  				}, 100);
				  				stopped_listening = false;
							//}
				  		}
						return ;
				  	}

					// if (sel_opt && sel_opt.getAttribute('data-custom')) {
					btn.style.visibility = 'visible';
					btn.style.opacity = '1';
					stopped_listening = true;
					app.stopListeningFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);
					// }
			  };

			  q._updpreset = function ( fx_id, preset_id ) {
			  	  if (fx_id && fx_id !== q.id) {
			  	  	return ;
			  	  }

		  		  var opts = q.el_presets.getElementsByTagName('option');
		  		  var ll = opts.length;
		  		  var curr = null;

		  		  while (ll-- > 0) {
		  		  	curr = opts[ll];

		  		  	if (curr.getAttribute('data-custom') === preset_id) {
		  		  		curr.selected = 'selected';
		  		  		break;
		  		  	}
		  		  }
			  };

			  q._updatePresets = function ( fx_id, presets ) {
			  	  if (fx_id && fx_id !== q.id) {
			  	  	return ;
			  	  }

				  var d = document;
				  var sel_presets = q.el.getElementsByClassName ('pk_sel'); 

				  // if presets exist remove them
				  if (sel_presets.length > 0)
				  {
				  		  sel_presets = sel_presets[0];
				  		  var opts = sel_presets.getElementsByTagName('option');
				  		  var ll = opts.length;
				  		  var curr = null;

				  		  while (ll-- > 0) {
				  		  	curr = opts[ll];

				  		  	if (curr.getAttribute('data-custom')) {
				  		  		sel_presets.removeChild( curr );
				  		  	}
				  		  }

				  		  if (presets.length === 0) return ;

							var opt = d.createElement ('option');
							// opt.value = '---custom----';
							opt.setAttribute ('disabled', '1');
							opt.setAttribute ('data-custom', '1');
							opt.innerHTML = '----custom-----';
							sel_presets.appendChild( opt );

						  for (var i = 0; i < presets.length; ++i)
						  {
							var opt = d.createElement ('option');
							var curr = presets[ i ];
							opt.value = curr.val;
							opt.setAttribute ('data-custom', curr.id);
							opt.innerHTML = curr.name;
							sel_presets.appendChild( opt );
						  }

				  		  return ;
				  }
				  else
				  {
				  		sel_presets = d.createElement ('select');
				  		sel_presets.className = 'pk_sel';
				  }

				  if (presets.length === 0) return ;


				  for (var i = -1; i < presets.length; ++i)
				  {
					var opt = d.createElement ('option');
					
					if (i === -1)
					{
						opt.value = 'null';
						opt.innerHTML = 'Presets';
					}
					else
					{
						var curr = presets[ i ];
						opt.value = curr.val;
						opt.innerHTML = curr.name;
					}
					sel_presets.appendChild( opt );
				  }
				  
				  sel_presets.onchange = function () {
					  var val_arr = this.value.split(',');
					  var els = q.el.getElementsByTagName('input');

					  q._updpreview ('t');

					  if (q.onpreset)
					  {
					  	q.onpreset (this.value);
					  	return ;
					  }

					  var len = els.length;
					  
					  for (var i = 0; i < len; ++i) {
						  if (!val_arr[ i ]) break;

						  var curr_val = val_arr[ i ].trim ();
						  var curr_input = els[ i ];
						  
						  if (curr_val === 'null') continue;
						  
						  if (curr_input.type === 'checkbox' || curr_input.type === 'radio')
							curr_input.checked = curr_val;
						  else
						  {
							curr_input.value = curr_val;
							curr_input.oninput && curr_input.oninput.apply (curr_input);
						  }
					  }
				  };
				  var btm = q.el.getElementsByClassName('pk_modal_bottom')[0];

				  btm.appendChild ( sel_presets );
				  q.el_presets = sel_presets;

				  // now add preset edit button
				  var edit_presets = d.createElement ('a');
				  edit_presets.className = 'pk_sel_edt';
				  edit_presets.innerHTML = '...<span>Save or Modify preset</span>';
				  edit_presets.onclick = function () {
				  	app.fireEvent ('RequestSavePreset');
				  };

				  btm.appendChild ( edit_presets );
				  app.listenFor ('RequestActionFX_UPDATE_PREVIEW',  q._updpreview);
				  app.listenFor ('RequestSetPresetActive',  q._updpreset);
			  };


			  app.listenFor ('DidStartPreview',  q._evstart);
			  app.listenFor ('DidStopPreview',   q._evstop);
			  app.listenFor ('DidTogglePreview', q._evtoggle);
			  app.fireEvent ('DidOpenFX_UI', q);

			  if (config.updateFilter) q.updateFilter = config.updateFilter;
			  
			  if (config.presets)
			  {
			  	q._updatePresets (null, config.presets);
			  	if (config.custom_pres) q._updatePresets (null, config.custom_pres);

				app.listenFor ('DidSetPresets', q._updatePresets);
			  }

			  config.setup && config.setup ( q );
			}
		});
	
		return (inner_modal);
	};
	
	w.PKSimpleModal = PKSimpleModal;
	w.PKAudioFXModal = PKAudioFXModal;
})( window, document );