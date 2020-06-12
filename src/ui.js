(function ( w, d, PKAE ) {
	'use strict';

	// 
	// MAIN UI CLASS
	var PKUI = function( app ) {
		var q = this;

		this.el = app.el;

		// if mobile add proper class
		this.el.className += ' pk_app' + (app.isMobile ? ' pk_mob' : '');
		
		// hold refferences to the event functions
		this.fireEvent = app.fireEvent;
		this.listenFor = app.listenFor;

		// keep track of the active UI element
		this.InteractionHandler = {
			on  : false,
			by  : null,
			arr : [],

			check: function ( _name ) {
				if (this.on && this.by !== _name) {
					return (false);
				}
				return (true);
			},

			checkAndSet: function ( _name ) {
				if (!this.check (_name))
					return (false);

				this.on = true;
				this.by = _name;

				return (true);
			},

			forceSet: function ( _name ) {
				if (this.on)
				{
					this.arr.push ({
						on: this.on,
						by: this.by
					});
				}

				this.on = true;
				this.by = _name;
			},

			forceUnset: function ( _name ) {
				if (this.check (_name))
				{
					var prev = this.arr.pop ();
					if (prev)
					{
						this.on = prev.on;
						this.by = prev.by;
					}
					else
					{
						this.on = false;
						this.by = null;
					}
				}
				// ---
			}
		};

		if (app.isMobile)
		{
			d.body.className = 'pk_stndln';
			var fxd = d.createElement ('div');
			fxd.className = 'pk_fxd';
			fxd.appendChild (this.el);

			d.body.appendChild (fxd);

			_makeMobileScroll (this);
		}

		this.KeyHandler = new app._deps.keyhandler ( this ); // initializing keyhandler
		this.TopHeader  = new _makeUITopHeader ( _topbarConfig ( app ), this ); // topmost menu
		this.Toolbar    = new _makeUIToolbar ( this ); // main toolbar and controls
		this.footer     = new _makeUIMainView ( this, app );
		this.BarBtm     = new _makeUIBarBottom (this, app);

		this.Dock      = function ( id, arg1, arg2 ) {
			app.fireEvent (id, arg1, arg2);
		};

		app.listenFor ('ShowError', function( message ) {
			new PKSimpleModal ({
				title : 'Oops! Something is not right',
				clss:'pk_modal_anim',
				ondestroy : function( q ) {
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback ('modalTempErr');
				},
				buttons:[],
				body:'<p>' + message + '</p>',
				setup:function( q ) {
					app.fireEvent ('RequestPause');
					app.fireEvent( 'RequestRegionClear');

					app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
						q.Destroy ();
					}, [27]);
				}
			}).Show ();
		});

		app.listenFor ('RequestKeyDown', function ( key ) {
			q.KeyHandler.keyDown ( key, null );
			q.KeyHandler.keyUp ( key );
		});
	};


	//top bar config list
	function _topbarConfig ( app, ui ) {
		return [
			{
				name:'File',
				children : [
					{
						name: 'Export / Download',
						action: function () {
								new PKSimpleModal({
								  title:'Export / Download',

								  ondestroy: function( q ) {
									app.ui.InteractionHandler.on = false;
									app.ui.KeyHandler.removeCallback ('modalTemp');
								  },

								  buttons:[
									{
										title:'Export',
										clss:'pk_modal_a_accpt',
										callback: function( q ) {
											var input = q.el_body.getElementsByTagName('input')[0];
											var value = input.value.trim();
											
											var format = 'mp3';
											var kbps = 128;
											var export_sel = false;
											var stereo     = false;
											
											var radios = q.el_body.getElementsByClassName ('pk_check');
											var l = radios.length;
											while (l-- > 0) {
												if (radios[l].checked)
												{
													if (radios[l].name == 'frmtex')
													{
														format = radios[l].value;
													}
													else if (radios[l].name == 'xport')
													{
														if (radios[l].value === 'sel')
														{
															var region = app.engine.wavesurfer.regions.list[0];
															if (!region) export_sel = false;
															else export_sel = [region.start, region.end];
														}
													}
													else if (radios[l].name == 'chnl')
													{
														if (radios[l].value === 'stereo')
														{
															stereo = true;
														}
													}
													else
													{
														kbps = radios[l].value / 1;
													}
												}
											}

											app.engine.DownloadFile ( value, format, kbps, export_sel, stereo );
											q.Destroy ();
											// -
										}
									}
								  ],
								  body:'<div class="pk_row"><label for="k0">File Name</label>' + 
									'<input style="min-width:250px" placeholder="mp3 filename" value="audiomass-output.mp3" ' +
									'class="pk_txt" type="text" id="k0" /></div>'+

									'<div class="pk_row" id="frmtex" style="padding-bottom:4px"><label style="display:inline">Format</label>'+
									'<input type="radio" class="pk_check" id="k01" name="frmtex" checked value="mp3">'+
									'<label for="k01">mp3</label>' +
									'<input type="radio" class="pk_check" id="k02" name="frmtex" value="wav">'+  
									'<label for="k02">wav <i>(44100hz)</i></label>' +
									'</div>' +

									'<div class="pk_row" id="frmtex-mp3"><input type="radio" class="pk_check" id="k1" name="rdslnc" checked value="128">'+ 
									'<label  for="k1">128kbps</label>' +
									'<input type="radio" class="pk_check"  id="k2" name="rdslnc" value="192">'+
									'<label for="k2">192kbps</label>'+
									'<input type="radio" class="pk_check"  id="k3" name="rdslnc" value="256">'+
									'<label for="k3">256kbps</label></div>'+
									'<div class="pk_row" style="padding-bottom:5px">' +
									'<input type="radio" class="pk_check" id="k6" name="chnl" checked value="mono">'+
									'<label for="k6">Mono</label>'+
									'<input type="radio" class="pk_check pk_stereo" id="k7" name="chnl" value="stereo">'+
									'<label for="k7">Stereo</label>'+
									'</div>'+
									'<div class="pk_row">' + 
									'<input type="radio" class="pk_check" id="k4" name="xport" checked value="whole">'+
									'<label for="k4">Export whole file</label>'+
									'<input type="radio" class="pk_check" id="k5" name="xport" value="sel">'+
									'<label class="pk_lblmp3" for="k5">Export Selection Only</label></div>',
									
								  setup:function( q ) {
								  		var wv = PKAudioEditor.engine.wavesurfer;
								  		console.log( document.getElementById('frmtex') );

								  		// if no region
										var region = wv.regions.list[0];
										if (!region) {
											var lbl = q.el_body.getElementsByClassName('pk_lblmp3')[0];
											lbl.className = 'pk_dis';
										}

										var chan_num = wv.backend.buffer.numberOfChannels;
										if (chan_num === 2) {
											q.el_body.getElementsByClassName('pk_stereo')[0].checked = true;
										}

								  		app.fireEvent ('RequestPause');
										app.ui.InteractionHandler.checkAndSet ('modal');
										app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
											q.Destroy ();
										}, [27]);

										setTimeout(function() {
											if (!q.el) return ;
											var inputtxt = q.el.getElementsByTagName('input')[0];
											inputtxt && inputtxt.select ();

									  		var format = document.getElementById('frmtex');
									  		var mp3conf = document.getElementById('frmtex-mp3');

									  		format && format.addEventListener('change', function(e){
												var inputs = this.getElementsByTagName('input');
												for (var i = 0; i < inputs.length; ++i)
												{
													if (inputs[i].checked)
													{
														if (inputs[i].value === 'mp3')
														{
															mp3conf.style.display = 'block';
															inputtxt.value = inputtxt.value.replace('.wav', '.mp3');
														}
														else
														{
															mp3conf.style.display = 'none';
															inputtxt.value = inputtxt.value.replace('.mp3', '.wav');
														}
													}
												}
									  		}, false);

										},20);
								  }
								}).Show();
						},
						clss: 'pk_inact',
						setup: function ( obj ) {
							app.listenFor ('DidUnloadFile', function () {
								obj.classList.add ('pk_inact');
							});
							app.listenFor ('DidLoadFile', function () {
								obj.classList.remove ('pk_inact');
							});
						}
					},

					{
						name: 'Load from Computer',
						type: 'file',
						action: function ( e ) {
							app.fireEvent ('RequestLoadLocalFile');
						}
					},
					
					{
						name: 'Load Sample File',
						action: function ( e ) {
							app.engine.LoadSample ();
						}	
					},
					
					{
						name: 'Load From URL',
						action: function ( e ) {
								new PKSimpleModal({
								  title:'Load audio from remote url',
								  
								  ondestroy: function( q ) {
									app.ui.InteractionHandler.on = false;
									app.ui.KeyHandler.removeCallback ('modalTemp');
									app.ui.KeyHandler.removeCallback ('modalTempEnter');
								  },
								  
								  buttons:[
									{
										title:'Load Asset',
										clss:'pk_modal_a_accpt',
										callback: function( q ) {
											var input = q.el_body.getElementsByTagName('input')[0];
											var value = input.value.trim();

											function isURL ( str ) {
											    var pattern = new RegExp('^((https?:)?\\/\\/)?'+ // protocol
											        '(?:\\S+(?::\\S*)?@)?' + // authentication
											        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
											        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
											        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
											        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
											        '(\\#[-a-z\\d_]*)?$','i'); // fragment locater
											    if (!pattern.test(str)) {
											        return false;
											    } else {
											        return true;
											    }
											};
											
											if (isURL (value))
											{
												// LOAD FROM URL....
												app.engine.LoadURL ( value );
												q.Destroy ();
											}
											else
											{
												OneUp ('Invalid URL entered', 1100);
											}
											// -
										}
									}
								  ],
								  body:'<label for="k00">Insert url</label>' + 
									'<input style="min-width:250px" placeholder="Please insert url" class="pk_txt" type="text" id="k00" />',
								  setup:function( q ) {

								  	  app.fireEvent ('RequestPause');
									  app.ui.InteractionHandler.checkAndSet ('modal');
										app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
											q.Destroy ();
										}, [27]);

										app.ui.KeyHandler.addCallback ('modalTempEnter', function ( e ) {
											q.els.bottom[0].click ();
										}, [13]);

										setTimeout(function() {
											q.el && q.el.getElementsByTagName('input')[0].focus ();
										},20);
								  }
								}).Show();
						}
						// ---
					},

					{
						name: 'New Recording',
						action: function ( e ) {
							app.fireEvent('RequestActionNewRec');
						}
					},

					{
						name: 'Save Draft Locally',
						clss: 'pk_inact',
						action: function ( e ) {
							if (!app.engine.is_ready) return ;

							var saving = function ( type, name ) {
								var buff = app.engine.wavesurfer.backend.buffer;

								if (type === 'copy') buff = app.engine.GetCopyBuff ();
								else if (type === 'sel') buff = app.engine.GetSel ();

								var func = function ( fls ) {								
									var rr = Math.random().toString(36).substring(7);

									fls.SaveSession (buff, rr, name);
									app.stopListeningFor ('DidOpenDB', func);
								};

								app.listenFor ('DidOpenDB', func);

								if (!app.fls.on) app.fls.Init (function(err){if(err){alert("db error")}});
								else app.fireEvent ('DidOpenDB', app.fls);
							};

							// modal that asks for - full file, selection, copy buffer
							new PKSimpleModal ({
								title : 'Save Local Draft of...',

								ondestroy : function( q ) {
									app.ui.InteractionHandler.on = false;
									app.ui.KeyHandler.removeCallback ('modalTempErr');
								},

								buttons:[
									{
										title:'Save',
										clss:'pk_modal_a_accpt',
										callback: function( q ) {
											var type = 'whole';
											var input = q.el_body.getElementsByTagName ('input');
											var name = input[ input.length - 1 ].value;
											if (name) {
												name = name.trim ();
												if (name.length >= 100) name = name.substr(0,99).trim();
												if (name.length === 0) name = null;
											}
											else {
												name = null;
											}

											for (var i = 0; i < input.length; ++i) {
												if (input[i].checked)
												{
													type = input[i].value;
													break;
												}
											}

											saving (type, name);

											q.Destroy ();
										}
									}
								],

								body:'<p>Please choose source...</p>' +
									'<div class="pk_row"><input type="radio" class="pk_check" id="sl1" name="rdslnc" checked value="whole">'+ 
									'<label style="vertical-align:top" for="sl1">Whole Track</label>' +
									'<input type="radio" class="pk_check"  id="sl2" name="rdslnc" value="sel">'+
									'<label style="vertical-align:top" class="pk_lblsel" for="sl2">Selection'+
									'<i style="display:block;font-size:11px;margin-top:-5px"></i></label>'+
									'<input type="radio" class="pk_check"  id="sl3" name="rdslnc" value="copy">'+
									'<label style="vertical-align:top" class="pk_lblsel2" for="sl3">"Copy" clipboard/buffer</label></div>'+

									'<div class="pk_row"><label for="slk0">Draft Name</label>' + 
									'<input style="min-width:250px" placeholder="(optional) filename" maxlength="100" ' +
									'class="pk_txt" type="text" id="slk0" /></div>',

								setup:function( q ) {
									// check if selection
							  		var wv = app.engine.wavesurfer;

							  		// if no region
									var region = wv.regions.list[0];
									var lblr = q.el_body.getElementsByClassName('pk_lblsel')[0];
									if (!region) {
										lblr.className = 'pk_dis';
									} else {
										q.el_body.getElementsByClassName('pk_check')[1].checked = true;
										lblr.childNodes[1].innerText = app.ui.formatTime(region.start) + ' to ' + app.ui.formatTime(region.end);
									}

									// if no copy buffer
									var copy = app.engine.GetCopyBuff ();
									if (!copy) {
										var lbl = q.el_body.getElementsByClassName('pk_lblsel2')[0];
										lbl.className = 'pk_dis';
									}

									if (!app.isMobile)
									{
										setTimeout(function() {
											q.el && q.el.getElementsByClassName('pk_txt')[0].focus ();
										},20);
									}

									app.fireEvent ('RequestPause');

									app.ui.InteractionHandler.checkAndSet ('modal');
									app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
										q.Destroy ();
									}, [27]);
								}
							}).Show ();

							return ;
						},

						setup: function ( obj ) {
							app.listenFor ('DidUnloadFile', function () {
								obj.classList.add ('pk_inact');
							});
							app.listenFor ('DidLoadFile', function () {
								obj.classList.remove ('pk_inact');
							});

							app.listenFor ('DidStoreDB', function ( obj, e ) {
									var name = obj.id;
									var txt = '<div style="padding:2px 0">id: ' + name + '</div>'+
										'<div style="padding:2px 0"><span>durr: ' + obj.durr + 's</span>'+
										'&nbsp;&nbsp;&nbsp;'+
										'<span>chan: ' + (obj.chans === 1 ? 'mono' : 'stereo') + '</span></div>'+
										'<div style="padding:2px 0"><img src="' + obj.thumb + '" /></div>';

									new PKSimpleModal ({
										title : 'Succesfully Stored',

										ondestroy : function( q ) {
											app.ui.InteractionHandler.on = false;
											app.ui.KeyHandler.removeCallback ('modalTempErr');
										},

										buttons:[
											{
												title:'OPEN IN NEW WINDOW',
												callback: function( q ) {
													window.open ( window.location.pathname + '?local=' + name);

													q.Destroy ();
												}
											}
										],

										body:'<p>Open in new window?</p>' + txt,
										setup:function( q ) {
											app.fireEvent ('RequestPause');
											app.fireEvent( 'RequestRegionClear');

											app.ui.InteractionHandler.checkAndSet ('modal');
											app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
												q.Destroy ();
											}, [27]);
										}
									}).Show ();
							});
						}	
					},

					{
						name: 'Open Local Drafts',
						action: function ( e ) {

							var datenow = new Date ();
							var time_ago = function ( arg ) {
							    var a = (datenow - arg) / 1E3 >> 0;
							    if (59 >= a) return datenow = 1 < a ? 's' : '', a + ' second' + datenow + ' ago';
							    if (60 <= a && 3599 >= a) return a = Math.floor(a / 60), a + ' minute' + (1 < a ? 's' : '') + ' ago';
							    if (3600 <= a && 86399 >= a) return a = Math.floor(a / 3600), a + ' hour' + (1 < a ? 's' : '') + ' ago';
							    if (86400 <= a && 2592030 >= a) return a = Math.floor(a / 86400), a + ' day' + (1 < a ? 's' : '') + ' ago';
							    if (2592031 <= a) return a = Math.floor(a / 2592E3), a + ' month' + (1 < a ? 's' : '') + ' ago';
							};
							var func = function ( fls ) {								
								fls.ListSessions(function( ret ) {

									var msg = '';
									if (ret.length === 0) {
										msg += 'No drafts found...';
									}
									else
									{
										for (var i = 0; i < ret.length; ++i)
										{
											var curr = ret[i];
											var date = new Date(curr.created);
											var datestr =  (date.getMonth()+1) + '/' + 
															date.getDate() + '/' + 
															date.getFullYear() + "  " + 
															date.getHours() + ":" + 
															date.getMinutes() + ":" + 
															date.getSeconds();
											var agostr = time_ago (date);
											var filename = curr.name || '-';
											var duration = curr.durr;
											var thumb    = curr.thumb;
											var chns     = (curr.chans === 1 ? 'mono' : 'stereo');

											msg += '<div id="pk_' + curr.id + '" class="pk_lcldrf">'+
											'<div style="padding-bottom:2px"><span><i class="pk_i">name:</i>' + filename + '</span></div>' +
											'<div><span class="pk_lcls"><i class="pk_i">id:</i><strong>' + curr.id + '</strong><br/><i class="pk_i">chn:</i>'+ chns +'</span>' + 
											'<span class="pk_lcls" style="width:50%;text-align:center"><i class="pk_i">date:</i><span>' + datestr + '<br/>'+ agostr +'</span></span>' +
											'<span style="text-align:right;float:right" class="pk_lcls"><i class="pk_i">durr:</i>' + duration + 's</span></div><div>' +

											'<img class="pk_lcli" src="' + thumb + '" />' +
											'<a class="pk_lcla2" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\', 3);">PLAY</a>' +
											'<a class="pk_lcla" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\');">Open</a>';

											if (app.engine.is_ready) {
												msg += '<a onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id +
												 '\',1);" class="pk_lcla">Append to Current Track</a>';
											}
											msg += '<a class="pk_lcla" style="color:#ad2b2b" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\',2);">Del</a>';
											msg += '</div></div>';
										}
									}

									var modal;
									var closeModal = function ( val, val2 ) {
										if (val2 === 2 || val2 === 3) return ;

										modal.Destroy ();
										modal = null;
									};

									var set_act_btn = function ( name, state ) {
										var act;
										if (!state) {
											act = modal.el_body.getElementsByClassName('pk_act')[0];
											if (act) {
												act.classList.remove ('pk_act');
											}
										}
										else {
											var el = document.getElementById ('pk_' + name);
											if (el) {
												act = el.getElementsByClassName ('pk_lcla2')[0];
												act && act.classList.add ('pk_act');
											}
										}
										// --
									};

									app.listenFor ('_lclStart', set_act_btn);

									modal = new PKSimpleModal ({
										title : 'Local Drafts',
										clss  : 'pk_bigger',

										ondestroy : function( q ) {

											app.fireEvent ('_lclStop');

											app.ui.InteractionHandler.on = false;
											app.ui.KeyHandler.removeCallback ('modalTempErr');
											app.stopListeningFor ('LoadDraft', closeModal);
											app.stopListeningFor ('_lclStart', set_act_btn);
										},

										buttons:[],

										body:'<div>' + msg + '</div>',
										setup:function( q ) {
											app.fireEvent ('RequestPause');
											app.fireEvent( 'RequestRegionClear');

											app.listenFor ('LoadDraft', closeModal);

											app.ui.InteractionHandler.checkAndSet ('modal');
											app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
												q.Destroy ();
											}, [27]);
										}
									});

									modal.Show ();
								});

								app.stopListeningFor ('DidOpenDB', func);
							};

							app.listenFor ('DidOpenDB', func);

							if (!app.fls.on) app.fls.Init (function(err){if(err){alert("db error")}});
							else app.fireEvent ('DidOpenDB', app.fls);
						},
						setup: function () {
							var source = {};

							app.listenFor ('_lclStop', function ( name, append ) {
								if (source.src) {
									source.src.stop ();
									source.src.disconnect ();
									source.src.onended = null;
									source.aud.close && source.aud.close ();
									source = {};
								}
							});

							app.listenFor ('LoadDraft', function ( name, append ) {
									app.fls.Init (function (err) {
										if (err) return ;

										if (append === 2)
										{
											if (source.id === name)
											{
												app.fireEvent ('_lclStart', source.id, 0);
												source.src.stop ();
												source.src.disconnect ();
												source.src.onended = null;
												source.aud.close && source.aud.close ();
												source = {};
											}

											app.fls.DelSession (name, function (name) {
												var id = 'pk_' + name;
												var el = document.getElementById (id);

												if (el)
												{
													if ( el.parentNode.children.length === 1 ) {
														el.parentNode.innerHTML = 'No drafts found...';
													}
													else el.parentNode.removeChild(el);


													el = null;
												}
											});
											return ;
										}

										if (append === 3)
										{
											if (source.id) {
												var xt = false;
												if (source.id === name) xt = true;

												app.fireEvent ('_lclStart', source.id, 0);
												source.src.stop ();
												source.src.disconnect ();
												source.src.onended = null;
												source.aud.close && source.aud.close ();

												source = {};

												if (xt) return ;
											}

											// generate audio context here...
											var aud_cont = new (w.AudioContext || w.webkitAudioContext)();
								            if (aud_cont && aud_cont.state == 'suspended') {
								                aud_cont.resume && aud_cont.resume ();
								            }

											app.fls.GetSession (name, function ( e ) {
												if(e && e.id === name )
												{
													source.id  = e.id;
													source.aud = aud_cont;
													source.src = app.engine.PlayBuff (e.data, e.chans, e.samplerate, aud_cont);
													if (!source.src) {
														source.aud && source.aud.close && source.aud.close ();
														source = {};

														return ;
													}

													source.src.onended = function ( e ) {
														app.fireEvent ('_lclStart', source.id, 0);
														source.src.stop ();
														source.src.disconnect ();
														source.src.onended = null;
														source.aud.close && source.aud.close ();

														source = {};
													};

													app.fireEvent ('_lclStart', e.id, 1);
												}
											});
											return ;
										}

										var overwrite = (function ( app, name, append ) {
											return function () {
												app.fls.GetSession (name, function ( e ) {
													if(e && e.id === name )
													{
														app.engine.wavesurfer.backend._add = append ? 1 : 0;
														app.engine.LoadDB ( e );
													}
												});
											};
										})( app, name, append );

										// --- ask if we want to click the first one
										if (app.engine.is_ready && !append)
										{
											var mm = new PKSimpleModal ({
												title : 'Open in Existing?',
												body  : '<div>Open in new window, or in the current one?</div>',
												buttons:[
													{
														title:'OPEN',
														clss:'pk_modal_a_accpt',
														callback: function( q ) {
															overwrite ();

															q.Destroy ();
														}
													},
													{
														title:'OPEN IN NEW',
														clss:'pk_modal_a_accpt',
														callback: function( q ) {
															window.open (window.location.pathname + '?local=' + name);
															q.Destroy ();
														}
													}
												],
												setup: function ( q ) {
													app.ui.InteractionHandler.checkAndSet ('mm');
													app.ui.KeyHandler.addCallback ('mmErr', function ( e ) {
														q.Destroy ();
													}, [27]);
												},
												ondestroy: function ( q ) {
													overwrite = null;
													app.ui.InteractionHandler.on = false;
													app.ui.KeyHandler.removeCallback ('mmErr');
												}
											});

											setTimeout(function() { mm.Show (); },0);
											return ;
										}

										overwrite ();
										// --
									});
							});
							// ---
						}
					}
				]
			},
			{
				name:'Edit',
				children:[
					{
						name: 'Undo <span class="pk_shrtct">Shft+Z</span>',
						clss: 'pk_inact',
						action: function () {
							app.fireEvent ('StateRequestUndo');
						},
						setup: function ( obj ) {
							app.listenFor ('DidStateChange', function ( undo_states, redo_states ) {
								if (undo_states.length === 0)
								{
									obj.innerHTML = 'Undo <span class="pk_shrtct">Shft+Z</span>';
									obj.classList.add ('pk_inact');
								}
								else
								{
									obj.innerHTML = 'Undo&nbsp;<i style="pointer-events:none">' + undo_states[undo_states.length - 1].desc + '</i><span class="pk_shrtct">Shft+Z</span>';
									obj.classList.remove ('pk_inact');
								}
							});
						}
					},
					
					{
						name: 'Redo <span class="pk_shrtct">Shft+Y</span>',
						clss: 'pk_inact',
						action: function () {
							app.fireEvent ('StateRequestRedo');
						},
						setup: function ( obj ) {
							app.listenFor('DidStateChange', function ( undo_states, redo_states ) {
								if (redo_states.length === 0)
								{
									obj.innerHTML = 'Redo <span class="pk_shrtct">Shft+Y</span>';
									obj.classList.add ('pk_inact');
								}
								else
								{
									obj.innerHTML = 'Redo&nbsp;<i style="pointer-events:none">' + redo_states[redo_states.length - 1].desc  + '</i><span class="pk_shrtct">Shft+Y</span>';
									obj.classList.remove ('pk_inact');
								}
							});
						}
					},

					{
						name: 'Play <span class="pk_shrtct">Space</span>',
						action: function () {
							app.fireEvent ('RequestPlay');
						}
					},
					
					{
						name: 'Stop',
						action: function () {
							app.fireEvent ('RequestStop');
						}
					},
					
					{
						name: 'Select All <span class="pk_shrtct">Shft+A</span>',
						action: function () {
							app.fireEvent ('RequestSelect');
						}
					},
					
					{
						name: 'Deselect All <span class="pk_shrtct">~</span>',
						action: function () {
							app.fireEvent ('RequestDeselect');
						}
					},

					{
						name   : 'Channel Info/Flip',
						action : function () {
							app.fireEvent ('RequestActionFXUI_Flip');
						},
						clss: 'pk_inact',
						setup: function ( obj ) {
							app.listenFor ('DidUnloadFile', function () {
								obj.classList.add ('pk_inact');
							});
							app.listenFor ('DidLoadFile', function () {
								obj.classList.remove ('pk_inact');
							});
						}
					}
				]
			},
			{
				name:'Effects',
				children:[
					{
						name:'Gain',
						action:function () {
							app.fireEvent ('RequestFXUI_Gain');
						}
					},

					{
						name:'Fade In',
						action:function () {
							app.fireEvent ('RequestActionFX_FadeIn');
						}
					},

					{
						name:'Fade Out',
						action:function () {
							app.fireEvent ('RequestActionFX_FadeOut');
						}
					},

					{
						name   : 'Paragraphic EQ',
						action:function () {
							app.fireEvent ('RequestActionFXUI_ParaGraphicEQ');
						}
					},

					{
						name:'Compressor',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Compressor');
						}
					},


					{
						name   : 'Normalize',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Normalize');
						}
					},

					{
						name   : 'Graphic EQ',
						action:function () {
							app.fireEvent ('RequestActionFXUI_GraphicEQ', 10);
						}
					},

					{
						name   : 'Graphic EQ (20 bands)',
						action:function () {
							app.fireEvent ('RequestActionFXUI_GraphicEQ', 20);
						}
					},

					{
						name   : 'Hard Limiter',
						action:function () {
							app.fireEvent ('RequestActionFXUI_HardLimiter');
						}
					},

					{
						name   : 'Delay',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Delay');
						}
					},

					{
						name:'Distortion',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Distortion');
						}
					},


					{
						name:'Reverb',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Reverb');
						}
					},

					{
						name   : 'Speed Up / Slow Down',
						action:function () {
							app.fireEvent ('RequestActionFXUI_Speed');
						}
					},

					{
						name   : 'Reverse',
						action : function () {
							app.fireEvent ('RequestActionFX_Reverse');
						}
					},
					
					{
						name   : 'Invert',
						action : function () {
							app.fireEvent ('RequestActionFX_Invert');
						}
					},

					{
						name   : 'Remove Silence',
						action : function () {
							app.fireEvent ('RequestActionFX_RemSil');
						}
					}
					
				]
			},
			{
				name:'View',
				children:[
					{
						name:'Follow Cursor  &#10004;',
						action: function ( obj ) {
							app.fireEvent ('RequestViewFollowCursorToggle');
						},
						setup: function ( obj ) {
							// perhaps read from stored settings?

							app.listenFor ('DidViewFollowCursorToggle', function ( val ) {
								var txt = 'Follow Cursor';

								if (val) {
									obj.innerHTML = txt + ' &#10004;';
								} else {
									obj.textContent = txt;
								}
							});
						}
					},

					{
						name:'Peak Separators &#10004;',
						action: function ( obj ) {
							app.fireEvent ('RequestViewPeakSeparatorToggle');
						},
						setup: function ( obj ) {
							app.listenFor ('DidViewPeakSeparatorToggle', function ( val ) {
								var txt = 'Peak Separators';
								if (val) {
									obj.innerHTML = txt + ' &#10004;';
								} else {
									obj.textContent = txt;
								}
							});
						}
					},

					{
						name:'Timeline &#10004;',
						action: function ( obj ) {
							app.fireEvent ('RequestViewTimelineToggle');
						},
						setup: function ( obj ) {
							app.listenFor ('DidViewTimelineToggle', function ( val ) {
								var txt = 'Timeline';
								if (val) {
									obj.innerHTML = txt + ' &#10004;';
								} else {
									obj.textContent = txt;
								}
							});
						}
					},

					{
						name:'---'
					},

					{
						name:'Frequency Analyser',
						action: function ( obj ) {
							app.fireEvent ('RequestShowFreqAn', 'eq', [1]);
						},
						setup: function ( obj ) {
							app.listenFor ('DidToggleFreqAn', function ( url, val ) {
								if (url !== 'eq') return ;

								var txt = 'Frequency Analyser';
								if (val) {
									obj.innerHTML = txt + ' &#10004;';
								} else {
									obj.textContent = txt;
								}
							});
						}
					},

					{
						name:'Spectrum Analyser',
						action: function ( obj ) {
							app.fireEvent ('RequestShowFreqAn', 'sp', [1]);
						},
						setup: function ( obj ) {
							app.listenFor ('DidToggleFreqAn', function ( url, val ) {
								if (url !== 'sp') return ;

								var txt = 'Spectrum Analyser';
								if (val) {
									obj.innerHTML = txt + ' &#10004;';
								} else {
									obj.textContent = txt;
								}
							});
						}
					},

					{
						name:'Tempo Tools',
						action: function ( obj ) {
							app.fireEvent ('RequestActionTempo');
						}
					},

					{
						name:'ID3 Tags',
						action: function ( obj ) {
							app.fireEvent ('RequestActionID3');
						}
					},

					{
						name:'---'
					},

					{
						name:'Center to Cursor <span class="pk_shrtct">[Tab]</span>',
						action: function ( obj ) {
							app.fireEvent ('RequestViewCenterToCursor');
						}
					},

					{
						name:'Reset Zoom <span class="pk_shrtct">[0]</span>',
						action: function ( obj ) {
							app.fireEvent ('RequestZoomUI', 0);
						}
					}

				]
			},
			{
				name:'Help',
				children:[
					{
						name   : 'Store Offline Version',
						action : function () {
							if (window.location.href.indexOf('-cache') > 0) {

								function onUpdateReady ( e ) {
									if (confirm ('Would you like to refresh the page to load the newer version?'))
										window.location.reload();
								}
								function downLoading ( e ) {
									OneUp ('Downloading newer version', 1500);
								}

								window.applicationCache.onupdateready = onUpdateReady;
								window.applicationCache.ondownloading = downLoading;

								if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
									onUpdateReady ();
								}

								window.applicationCache.update ();

								return ;
							}

							var message = 'This will open a new window that will try to store a local version in your browser'; // nicer text

							new PKSimpleModal ({
								title : 'Open Offline Version?',

								ondestroy : function( q ) {
									app.ui.InteractionHandler.on = false;
									app.ui.KeyHandler.removeCallback ('modalTempErr');
								},

								buttons:[
									{
										title:'OPEN',
										callback: function( q ) {
											window.open ('/index-cache.html');
											q.Destroy ();
										}
									}
								],
								body:'<p>' + message + '</p>',
								setup:function( q ) {
									app.fireEvent ('RequestPause');
									app.fireEvent( 'RequestRegionClear');

									app.ui.InteractionHandler.checkAndSet ('modal');
									app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
										q.Destroy ();
									}, [27]);
								}
							}).Show ();
							// -
						},
						setup: function ( obj ) {
							if (window.location.href.indexOf('-cache') > 0)
							{
								obj.innerHTML = 'Update Offline Version';
							}
						}
					},

					{
						name:'---'
					},

					{
						name   : 'About',
						action : function () {
							window.open ('/about.html');
						}
					},

					{
						name   : 'See Welcome Message',
						action : function () {
							PKAudioEditor._deps.Wlc ();
						}
					},
					// {
					// 	name   : 'About AudioMass',
					// 	action : function () {
					// 		window.open ('/about.html');
					// 	}
					// },

					// {
					// 	name:'---'
					// },

					{
						name   : 'SourceCode on Github',
						action : function () {
							window.open ('https://github.com/pkalogiros/audiomass');
						}
					}
				]
			}
		];
	};

	// 
	// TOP-BAR CLASS
	// 
	function _makeUITopHeader ( menu_tree, UI ) {
		var header = d.createElement ( 'div' );
		header.className = 'pk_hdr pk_noselect';

		var _name = 'TopHeader',
			_default_class = 'pk_btn pk_noselect';

		var target_index = -1;
		var target_el = null;
		var target_el_old = null;
		var target_option = null;
		var top_els = [];
		var q = this;

		// recursively build the interface
		function build_menus ( parent_el, tree_obj, level ) {
			for (var i = 0; i < tree_obj.length; ++i)
			{
				var btn_container = d.createElement ( 'div' );
				var curr_obj = tree_obj[i];
				
				if (level === 0)
				{
					btn_container.className = _default_class;
					var btn = d.createElement ( 'button' );
					btn.innerHTML = curr_obj.name;
					btn_container.appendChild ( btn );
				}
				else
				{
					btn_container.className = 'pk_menu_el';
					var btn = d.createElement ( 'button' );
					btn.className = 'pk_opt ' + (curr_obj.clss ? curr_obj.clss : '');
					btn.setAttribute ( 'tab-index', '-1' );
					btn.setAttribute ( 'data-index', i );
					btn.innerHTML = curr_obj.name;
					btn_container.appendChild ( btn );

					if (curr_obj.action)
					{
						(function ( btn, action ) {
							btn.onclick = function ( obj ) {
								if (this.classList.contains('pk_inact')) return ;

								q.closeMenu ();
								action ( obj );
							};
						})( btn, curr_obj.action );
					}
					if (curr_obj.setup)
					{
						curr_obj.setup ( btn );
					}
				}
				parent_el.appendChild ( btn_container );
				
				if (level === 0)
					top_els[i] = btn_container.childNodes[0];

				if (curr_obj.children)
				{
					var ch = curr_obj.children;
					var list = d.createElement('div');
					list.className = 'pk_menu';
					
					build_menus ( list, curr_obj.children, level + 1 );
					btn_container.appendChild ( list );
				}
				// --- 
			}
		};
		build_menus ( header, menu_tree, 0 );
		
		this.getOpenElement = function () {
			return target_el;
		};
		this.closeMenu = function() {
			if (!target_el) return ;

			target_el.parentNode.className = _default_class;
			target_el = target_el_old = null;

			if (target_option)
			{
				target_option.classList.remove ('pk_act');
				target_option = null;
			}
			
			UI.InteractionHandler.on = false;
			d.removeEventListener ( 'mouseup', mouseup );
			
			// de-register keys
			UI.KeyHandler.removeCallback (_name + 1);
			UI.KeyHandler.removeCallback (_name + 2);
			UI.KeyHandler.removeCallback (_name + 3);
			UI.KeyHandler.removeCallback (_name + 4);
			UI.KeyHandler.removeCallback (_name + 5);
			UI.KeyHandler.removeCallback (_name + 6);
		};
		
		this.openMenu = function ( index, is_mouse ) {
			if (target_el) {
				target_el.parentNode.className = _default_class;
			}

			var curr_target = top_els[ index ];
			target_el = curr_target;

			var parent = curr_target.parentNode;
			var left = parent.getBoundingClientRect ().left;
			var max = window.innerWidth;
			var offset = 0;

			if ( max - left < 200 )
			{
				offset = (264 - (max - left)) >> 0;

				if (offset > 1)
					parent.getElementsByClassName ('pk_menu')[0].style.left = (-offset / 2) + 'px';
			}

			parent.className += ' pk_vis';
			setTimeout(function() {
				if (target_el === curr_target)
					parent.className += ' pk_act';
			},0);

			target_index = index;
			
			UI.InteractionHandler.checkAndSet (_name);
			
			if (!is_mouse)
				d.addEventListener ( 'mouseup', mouseup, false );
			
			// register keystrokes
			UI.KeyHandler.addCallback (_name + 1, function ( key ) {
				if (target_index === 0)
					target_index = top_els.length;
				
				q.closeMenu ();
				q.openMenu ( target_index - 1 );				
			}, [37]);
			UI.KeyHandler.addCallback (_name + 2, function ( key ) {
				if (target_index === top_els.length - 1)
					target_index = -1;

				q.closeMenu ();
				q.openMenu ( target_index + 1 );				
			}, [39]);
			UI.KeyHandler.addCallback (_name + 3, function ( key ) {
				q.closeMenu ();			
			}, [27]);
			UI.KeyHandler.addCallback (_name + 4, function ( key, m, e ) {
				if (!target_option)
				{
					var els = target_el.parentNode.getElementsByClassName ('pk_opt');
					if (els[0]) {
						target_option = els[0];
						target_option.classList.add ('pk_act');
					}
				}
				else
				{
					var ind = target_option.getAttribute ('data-index')/1;
					target_option.classList.remove ('pk_act');
					
					target_option = target_el.parentNode.getElementsByClassName ('pk_opt');
					if (ind - 1 < 0)
					{
						target_option = target_option[target_option.length - 1];
					}
					else
					{
						target_option = target_option[ind - 1];
					}
					target_option.classList.add ('pk_act');
				}
			}, [38]);
			UI.KeyHandler.addCallback (_name + 5, function ( key, m, e ) {
				if (!target_option)
				{
					var els = target_el.parentNode.getElementsByClassName ('pk_opt');
					if (els[0]) {
						target_option = els[0];
						target_option.classList.add ('pk_act');
					}
				}
				else
				{
					var ind = target_option.getAttribute ('data-index')/1;
					target_option.classList.remove ('pk_act');
					
					target_option = target_el.parentNode.getElementsByClassName ('pk_opt');
					if (target_option.length <= ind + 1)
					{
						target_option = target_option[0];
					}
					else
					{
						target_option = target_option[ind + 1];
					}
					target_option.classList.add ('pk_act');				
				}
			}, [40]);
			UI.KeyHandler.addCallback (_name + 6, function ( key ) {
				if (target_option)
					target_option.click();
				else
					q.closeMenu ();
			}, [13]);

			return (true);
		};

		UI.listenFor ('DidReadyFire', function () {
			q.closeMenu ();
		});

		// register hot keys for opening the menu 
		function _checkForAct( x ) {
				if (target_el == x || !x) return (false);

				var par = x.parentNode;
				while (par && target_el) {
					if (target_el.parentNode == par) {
						return (false);
					}
					par = par.parentNode;
				}
				
				var l = top_els.length;
				while(l-- > 0) {
					if (top_els[l] === x) {				
						return q.openMenu (l, true);
					}
				}
				return (false);
		}

		// now make the buttons interactive
		var mousemove = function ( e ) {
			if (!UI.InteractionHandler.check (_name)) {
				return (false);
			}

			if (target_el || (UI.InteractionHandler.on && UI.InteractionHandler.by === _name) )
			{
				var x = e.target || e.srcElement;
				
				if (x.className.indexOf('pk_opt') >= 0)
				{
					if (target_option)
						target_option.classList.remove ('pk_act');

					target_option = x;
					target_option.classList.add ('pk_act');
				}
				else
				{
					if (target_option)
						target_option.classList.remove ('pk_act');
					target_option = null;
				}

				return _checkForAct ( x );
			}

			return (false);
		};
		var mouseup = function( e ) {
			var x = e.target || e.srcElement;

			if (target_el)
			{
				// todo check for inner menu?
				var par = x;
				var found = false;
				while (par && target_el) {
					if (target_el.parentNode == par) {
						found = true;
						break;
					}
					par = par.parentNode;
				}

				if (!found || target_el_old === x) {
					q.closeMenu();
				}
			}
			else
			{
				UI.InteractionHandler.on = false;
				d.removeEventListener ( 'mouseup', mouseup );
			}
			
			target_el_old = null;
		};

		header.addEventListener ( 'mousemove', mousemove, false );
		header.addEventListener ( 'mousedown', function( e ) {
			if (!UI.InteractionHandler.checkAndSet (_name)) {
				return (false);
			}

			d.removeEventListener ( 'mouseup', mouseup );

			if (target_el)
			{
				if (!_checkForAct ( e.target || e.srcElement ))
					target_el_old = target_el;
				else
					target_el_old = null;

				d.addEventListener ( 'mouseup', mouseup, false );
			}
			else
			{
				target_el_old = null;
				d.addEventListener ( 'mouseup', mouseup, false );
				_checkForAct ( e.target || e.srcElement );
			}
			// -
		}, false);

		UI.el.appendChild ( header );
		// -
	};


	// ####
	function _makeUIBarBottom ( UI, app ) {
		var q = this;

		var bar_bottom_el = d.createElement ('div');
		bar_bottom_el.className = 'pk_dck';
		UI.el.appendChild( bar_bottom_el );

		q.el = bar_bottom_el;
		q.on = false;
		q.height = 130;

		q.Show = function () {
			q.on = true;
			bar_bottom_el.style.display = 'block';

			app.fireEvent ('RequestResize');
		};
		q.Hide = function () {
			q.on = false;
			bar_bottom_el.style.display = 'none';

			app.fireEvent ('RequestResize');
		};
	};

	function _makeUIMainView ( UI, app ) {
		var q = this;

		var audio_container = d.createElement ('div');
		audio_container.className = 'pk_av_cont';
		UI.el.appendChild( audio_container );


		var main_audio_view = d.createElement ( 'div' );
		main_audio_view.className = 'pk_av pk_noselect';
		main_audio_view.id = 'pk_av_' + app.id;
		audio_container.appendChild( main_audio_view );

		
		var footer = d.createElement ( 'div' );
		footer.className = 'pk_ftr pk_noselect';
		UI.el.appendChild( footer );

		// make panner buttons
		var btn_panner_cnt = d.createElement ('div');
		btn_panner_cnt.className = 'pk_panner pk_noselect';

		var panner_col_left = d.createElement ('div');
		panner_col_left.className = 'pk_pan_left';
		var panner_col_right = d.createElement ('div');
		panner_col_right.className = 'pk_pan_right';

		var btn_panner_left = d.createElement ('button');
		var btn_panner_right = d.createElement ('button');
		btn_panner_left.setAttribute ('tabIndex', -1);
		btn_panner_right.setAttribute ('tabIndex', -1);
		btn_panner_left.className = 'pk_pan_btn';
		btn_panner_right.className = 'pk_pan_btn';

		btn_panner_left.innerHTML = '<strong>L</strong> ON';
		btn_panner_right.innerHTML = '<strong>R</strong> ON';

		panner_col_left.appendChild ( btn_panner_left );
		panner_col_right.appendChild ( btn_panner_right );
		btn_panner_cnt.appendChild ( panner_col_left );
		btn_panner_cnt.appendChild ( panner_col_right );
		audio_container.appendChild ( btn_panner_cnt );


		btn_panner_left.onclick = function () {
			app.fireEvent ('RequestChanToggle', 0);
			this.blur();
		};
		btn_panner_right.onclick = function () {
			app.fireEvent ('RequestChanToggle', 1);
			this.blur();
		};
		app.listenFor ('DidChanToggle', function ( chan, val ) {
			if ( chan === 0) {
				if (val)
				{
					btn_panner_left.classList.remove ('pk_inact');
					btn_panner_left.innerHTML = '<strong>L</strong> ON';
				}
				else
				{
					btn_panner_left.classList.add ('pk_inact');
					btn_panner_left.innerHTML = '<strong>L</strong> OFF';
				}
			} else {
				if (val)
				{
					btn_panner_right.classList.remove ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> ON';
				}
				else
				{
					btn_panner_right.classList.add ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> OFF';
				}
			}
		});

		// zoom btns
		var btn_zoom_cnt = d.createElement ('div');
		btn_zoom_cnt.className = 'pk_zoombtn';

		var btn_zoom_in_h = d.createElement ('button');
		btn_zoom_in_h.className = 'pk_btn pk_zoom_in_h';
		btn_zoom_in_h.innerHTML = '+<span>Zoom In Horiz (+)</span>';
		btn_zoom_in_h.setAttribute ('tabIndex', -1);
		btn_zoom_in_h.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'h', -1);
			this.blur();
		};

		var btn_zoom_out_h = d.createElement ('button');
		btn_zoom_out_h.className = 'pk_btn pk_zoom_out_h pk_inact';
		btn_zoom_out_h.innerHTML = '&ndash;<span>Zoom Out Horiz (-)</span>';
		btn_zoom_out_h.setAttribute ('tabIndex', -1);
		btn_zoom_out_h.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'h', 1);
			this.blur();
		};

		var btn_zoom_reset = d.createElement ('button');
		btn_zoom_reset.className = 'pk_btn pk_zoom_reset pk_inact';
		btn_zoom_reset.innerHTML = '[R] <span>Reset Zoom (0)</span>';
		btn_zoom_reset.setAttribute ('tabIndex', -1);
		btn_zoom_reset.onclick = function () {
			app.fireEvent ('RequestZoomUI', 0);
			this.blur();
		};
		UI.KeyHandler.addCallback ('Key0', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 0);
		}, [48]);

		UI.KeyHandler.addCallback ('KeyZO', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 'h', 1);
		}, [189]);
		UI.KeyHandler.addCallback ('KeyZI', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 'h', -1);
		}, [187]);

		var btn_zoom_in_v = d.createElement ('button');
		btn_zoom_in_v.className = 'pk_btn pk_zoom_in_v';
		btn_zoom_in_v.innerHTML = '&#x2195; +<span>Zoom In Vertically</span>';
		btn_zoom_in_v.setAttribute ('tabIndex', -1);
		btn_zoom_in_v.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'v', -1);
			this.blur();
		};

		var btn_zoom_out_v = d.createElement ('button');
		btn_zoom_out_v.className = 'pk_btn pk_zoom_out_v';
		btn_zoom_out_v.innerHTML = '&#x2195; &ndash;<span>Zoom Out Vertically</span>';
		btn_zoom_out_v.setAttribute ('tabIndex', -1);
		btn_zoom_out_v.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'v', 1);
			this.blur();
		};

		btn_zoom_cnt.appendChild ( btn_zoom_in_h );
		btn_zoom_cnt.appendChild ( btn_zoom_out_h );
		btn_zoom_cnt.appendChild ( btn_zoom_reset );
		btn_zoom_cnt.appendChild ( btn_zoom_in_v );
		btn_zoom_cnt.appendChild ( btn_zoom_out_v );

		footer.appendChild ( btn_zoom_cnt );
		// end of zoom btns
		
		var wavezoom = d.createElement ( 'div' );
		wavezoom.className = 'pk_wavescroll';

		var wavepoint_visible = false;
		var wavepoint = d.createElement ( 'div' );
		wavepoint.className = 'pk_wavepoint';

		var wavedrag = d.createElement ( 'div' );
		wavedrag.className = 'pk_wavedrag pk_inact';

		var wavedrag_left = d.createElement ( 'div' );
		wavedrag_left.className = 'pk_wavedrag_l';
		var wavedrag_right = d.createElement ( 'div' );
		wavedrag_right.className = 'pk_wavedrag_r';

		wavezoom.appendChild ( wavepoint );
		wavedrag.appendChild ( wavedrag_left );
		wavedrag.appendChild ( wavedrag_right );
		wavezoom.appendChild ( wavedrag );
		footer.appendChild ( wavezoom );

		var temp = 0;
		var wavedrag_width = 100;
		wavezoom.onclick = function( e ) {
			if (window.performance.now() - temp < 20)
			{
				return ;
			}

			var rect = e.target.getBoundingClientRect();
			var x = e.clientX - rect.left;
			UI.fireEvent ('RequestPan', x, 2);
		};
		
		// add zoom event, and add seek event....
		UI.listenFor ('DidZoom', function ( v ) {
			var e = v[0];
			var o = v[1];

			if (e === 1) {
				btn_zoom_out_h.classList.add ('pk_inact');
				btn_zoom_reset.classList.add ('pk_inact');
			} else {
				btn_zoom_out_h.classList.remove ('pk_inact');
				btn_zoom_reset.classList.remove ('pk_inact');
			}

			if (v[2] != 1) {
				btn_zoom_reset.classList.remove ('pk_inact');
			}

			if (e === 1) {
				if (wavepoint_visible)
				{
					wavepoint.style.display = 'none';
					wavepoint_visible = false;
				}
			} else {

				if (!wavepoint_visible)
				{
					wavepoint.style.display = 'block';
					var perc = app.engine.wavesurfer.getCurrentTime() / app.engine.wavesurfer.getDuration ();
					wavepoint.style.left = ((perc * 100).toFixed(2)/1) + '%';
					wavepoint_visible = true;
				}
			}

			// get zoom value and left...
			if ((100/e) > 99)
			{
				wavedrag_width = 100;
				wavedrag.style.width = '100%';
				wavedrag.style.left =  '0%';
				//wavedrag.style.transform = 'translate3d(0,0,0)';
				wavedrag.classList.add ('pk_inact');
			}
			else
			{
				wavedrag_width = (100/e);
				wavedrag.style.width = wavedrag_width + '%';
				wavedrag.style.left =  o + '%';
				// wavedrag.style.transform = 'translate3d(' + o + '%,0,0)';
				wavedrag.classList.remove ('pk_inact');
			}
		});
		UI.listenFor ('DidCursorCenter', function( val ) {
			wavedrag.style.left = (val * 100) + '%';
			// wavedrag.style.transform = 'translate3d(' + (val * 100) + '%,0,0)';
		});
		
		var drag_mode = 0;
		var startingX = 0;
		var waveScrollMouseMove = function( e ) {
			e.stopPropagation(); e.preventDefault();

			var clx = e.clientX;

			if (e.touches) {
				if (e.touches.length > 1) return ;

				clx = e.touches[0].clientX;
			}

			var diff = -startingX + clx;
			if (drag_mode === 0)
				UI.fireEvent ('RequestPan', diff, 1);
			else if (drag_mode === -1)
			{
				UI.fireEvent ('RequestZoom', diff, -1);
			}
			else if (drag_mode === 1)
			{
				UI.fireEvent ('RequestZoom', diff, 1);
			}
			
			startingX = clx;
		},
		waveScrollMouseUp = function ( e ) {
			if (e.touches && e.touches.length > 1) return ;

			PKAudioEditor.engine.wavesurfer.Interacting &= ~(1 << 1);
			e.stopPropagation();e.preventDefault();
			drag_mode = 0;
			temp = window.performance.now();
			
			wavedrag.classList.remove ('pk_drag');
			
			document.removeEventListener('mousemove', waveScrollMouseMove);
			document.removeEventListener('mouseup', waveScrollMouseUp);

			document.removeEventListener('touchmove', waveScrollMouseMove, {passive:false});
			document.removeEventListener('touchend', waveScrollMouseUp);
		};

		var mdown = function ( e ) {
			if (!PKAudioEditor.engine.is_ready) return ;

			if (e.target === wavedrag) {
				drag_mode = 0;
			} else if ( e.target === wavedrag_left) {
				drag_mode = -1;
			} else if ( e.target === wavedrag_right) {
				drag_mode = 1;
			}
			
			wavedrag.className += ' pk_drag';

			startingX = e.clientX;
			PKAudioEditor.engine.wavesurfer.Interacting |= (1 << 1);

			if (e.is_touch)
			{
				document.addEventListener ('touchmove', waveScrollMouseMove, {passive:false});
				document.addEventListener ('touchend', waveScrollMouseUp, false);
			}
			else
			{		
				document.addEventListener ('mousemove', waveScrollMouseMove, false);
				document.addEventListener ('mouseup', waveScrollMouseUp, false);	
			}
		};

		wavedrag.addEventListener ('mousedown', mdown, false);

		if ('ontouchstart' in window) {
			wavedrag.addEventListener ('touchstart', function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();

				if (e.touches.length > 1) {
					return ;
				}

				var ev = {
					is_touch : true,
					target : wavedrag,
					clientX: e.touches[0].clientX
				};
				mdown ( ev );
			}, false);
		}
		
		
		this.volumeGauge = d.createElement( 'div' );
		this.volumeGauge2 = d.createElement( 'div' );
		
		this.volumeGaugeInner = d.createElement( 'div' );
		this.volumeGaugeInner2 = d.createElement( 'div' );
		this.volumeGaugePeaker = d.createElement( 'div' );
		this.volumeGaugePeaker2 = d.createElement( 'div' );

		var volume_parent = d.createElement('div');
		
		this.volumeGauge.className = 'pk_volpar';
		this.volumeGauge2.className = 'pk_volpar';
		this.volumeGaugeInner.className = 'pk_vol';
		this.volumeGaugeInner2.className = 'pk_vol';
		this.volumeGaugePeaker.className = 'pk_peaker';
		this.volumeGaugePeaker2.className = 'pk_peaker';
		
		this.volumeGauge.appendChild ( this.volumeGaugeInner );
		this.volumeGauge.appendChild( this.volumeGaugePeaker );
		
		this.volumeGauge2.appendChild ( this.volumeGaugeInner2 );
		this.volumeGauge2.appendChild( this.volumeGaugePeaker2 );
		
		var markers = d.createElement('div');
		markers.className = 'pk_markers pk_noselect';
		
		var str = '<span class="pk_mark1">-Inf</span>';
		for (var i = 35; i >= 0; --i)
		{
			str += '<span class="pk_mark1 '+(i%2?'pk_odd':'')+'">' + -(i*2) + '</span>';
		}
		markers.innerHTML = str;
		
		volume_parent.appendChild( this.volumeGauge );
		volume_parent.appendChild( this.volumeGauge2 );
		volume_parent.appendChild( markers );
		
		volume_parent.onclick = function() {
			q.volumeGaugePeaker.className = 'pk_peaker';
			q.volumeGaugePeaker2.className = 'pk_peaker';
		};

		footer.appendChild( volume_parent );

		// change temp message, it's pretty ugly #### TODO
		var ttmp = d.createElement('div');
		ttmp.className = 'pk_tmpMsg';
		ttmp.innerHTML = 'Drag n drop an Audio File in this window, or click ' +
		'<a style="white-space:nowrap;border:1px solid;border-radius:23px;padding:5px 18px;font-size:0.94em;margin-left:5px" '+
		'onclick="PKAudioEditor.engine.LoadSample()">here to use a sample</a>';
		main_audio_view.appendChild( ttmp );

		var ttmp2 = d.createElement('div');
		ttmp2.className = 'pk_tmpMsg2';
		ttmp2.innerHTML = '<span>Please Wait...</span><div class="pk_mload"><div></div></div>' + 
			'<div class="pk_prc"><span>0%</span>' + 
			'<button tabIndex="-1" class="pk_btn" '+
			'onclick="PKAudioEditor.fireEvent(\'RequestCancelModal\');">cancel</button></div>';

		d.body.appendChild( ttmp2 );
		UI.loaderEl = ttmp2;

		UI.listenFor ('WillDownloadFile', function() {
			UI.loaderEl.classList.add ('pk_act');
			UI.loaderEl.getElementsByTagName('span')[1].style.display = 'none';
		});
		UI.listenFor ('DidDownloadFile', function() {
			UI.loaderEl.classList.remove ('pk_act');
		});
		UI.listenFor ('DidProgressModal', function ( val ) {
			UI.loaderEl.getElementsByTagName('span')[1].style.display = 'block';
			UI.loaderEl.getElementsByTagName('span')[1].innerText = val + '%';
		});
	}

	
	function _makeUIToolbar (UI) {
		var container = d.createElement ( 'div' );
		container.className = 'pk_tbc';

		var toolbar = d.createElement ( 'div' );
		toolbar.className = 'pk_tb pk_noselect';

		var btn_groups = d.createElement( 'div' );
		btn_groups.className = 'pk_btngroup';
		
		var transport = d.createElement( 'div' );
		transport.className = 'pk_transport';

		// play button
		var btn_stop = d.createElement ('button');
		btn_stop.setAttribute ('tabIndex', -1);
		btn_stop.innerHTML = '<span>Stop Playback (Space)</span>';
		btn_stop.className = 'pk_btn pk_stop icon-stop2';
		btn_stop.onclick = function() {
			UI.fireEvent('RequestStop');
		};
		transport.appendChild ( btn_stop );

		var btn_play = d.createElement ('button');
		btn_play.setAttribute ('tabIndex', -1);
		btn_play.className = 'pk_btn pk_play icon-play3';
		btn_play.innerHTML = '<span>Play (Space)</span>';
		transport.appendChild ( btn_play );
		btn_play.onclick = function() {
			UI.fireEvent('RequestPlay');
			this.blur();
		};
		UI.listenFor ('DidStopPlay', function(){
			btn_play.classList.remove ('pk_act');
		});
		UI.listenFor ('DidPlay', function(){
			btn_play.classList.add ('pk_act');
		});

		var btn_pause = d.createElement ('button');
		btn_pause.setAttribute('tabIndex', -1);
		btn_pause.className = 'pk_btn pk_pause icon-pause2';
		btn_pause.innerHTML = '<span>Pause (Shift+Space)</span>';
		transport.appendChild ( btn_pause );
		btn_pause.onclick = function() {
			UI.fireEvent('RequestPause');
			this.blur();
		};

		var btn_loop = d.createElement ('button');
		btn_loop.setAttribute('tabIndex', -1);
		btn_loop.className = 'pk_btn pk_loop icon-loop';
		btn_loop.innerHTML = '<span>Toggle Loop (L)</span>';
		transport.appendChild ( btn_loop );
		btn_loop.onclick = function() {
			UI.fireEvent('RequestSetLoop');
			this.blur();
		};
		UI.listenFor('DidSetLoop', function( val ) {
			val ? btn_loop.classList.add('pk_act') :
				  btn_loop.classList.remove('pk_act');
		});

		var btn_back_jump = d.createElement ('button');
		btn_back_jump.setAttribute('tabIndex', -1);
		btn_back_jump.className = 'pk_btn pk_back_jump icon-backward2';
		btn_back_jump.innerHTML = '<span>Seek (left arrow)</span>';
		transport.appendChild ( btn_back_jump );

		///////////////////////////////////////////////////////////
		// REWING / BACK BTN
		var btn_back_focus = false;
		var btn_back_tm = null;
		btn_back_jump.onclick = function() {

			if (!btn_back_focus)
			{
				if (btn_back_tm) {
					clearTimeout(btn_back_tm);
					btn_back_tm = null;
				}

				var big_step = PKAudioEditor.engine.wavesurfer.getDuration () / 20;
				var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
				big_step /= ((zoom/2)+0.5);
				if (big_step > 1) big_step = big_step << 0;

				UI.fireEvent ('RequestSkipBack', big_step);
			}

			this.blur();
			btn_back_focus = false;
		};

		btn_back_jump.onmouseleave = function () {
			if (btn_back_tm) {
				clearTimeout(btn_back_tm);
				btn_back_tm = null;
			}
			this.blur();
		};

		btn_back_jump.onfocus = function() {
			var btn = this;
			btn_back_focus = false;

			var step = function ( num, count ) {
				if (document.activeElement === btn)
				{
					btn_back_focus = true;

					UI.fireEvent ('RequestSkipBack', num);

					var block = 4450;

					var middle_step = PKAudioEditor.engine.wavesurfer.getDuration () / block;
					var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
					middle_step /= zoom;

					if (count < 12) {
						middle_step = 0;
					}

					setTimeout(function() {
						step (num + middle_step, ++count);
					},40);
				}
			};
			btn_back_tm = setTimeout(function(){

				var small = PKAudioEditor.engine.wavesurfer.getDuration () / 2000;
				var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
				small /= zoom;

				if (small < 0.01) {
					small = 0.01;
				}

				step (small, 0);
			},390);
		};
		////////////////////////

		var btn_front_jump = d.createElement ('button');
		btn_front_jump.setAttribute('tabIndex', -1);
		btn_front_jump.className = 'pk_btn pk_front_jump icon-forward3';
		btn_front_jump.innerHTML = '<span>Seek (right arrow)</span>';
		transport.appendChild ( btn_front_jump );

		var btn_frnt_focus = false;
		var btn_frnt_tm = null;
		btn_front_jump.onclick = function() {
			if (!btn_frnt_focus)
			{
				if (btn_frnt_tm) {
					clearTimeout(btn_frnt_tm);
					btn_frnt_tm = null;
				}

				var big_step = PKAudioEditor.engine.wavesurfer.getDuration () / 20;
				var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
				big_step /= ((zoom/2)+0.5);
				if (big_step > 1) big_step = big_step << 0;

				UI.fireEvent ('RequestSkipFront', big_step);
			}

			this.blur();
			btn_frnt_focus = false;
		};
		btn_front_jump.onmouseleave = function () {
			if (btn_frnt_tm) {
				clearTimeout(btn_frnt_tm);
				btn_frnt_tm = null;
			}
			this.blur();
		};
		btn_front_jump.onfocus = function() {
			var btn = this;
			btn_frnt_focus = false;

			var step = function ( num, count ) {
				if (document.activeElement === btn)
				{
					btn_frnt_focus = true;

					UI.fireEvent ('RequestSkipFront', num);

					var block = 4450;

					var middle_step = PKAudioEditor.engine.wavesurfer.getDuration () / block;
					var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
					middle_step /= zoom;

					if (count < 12) {
						middle_step = 0;
					}

					setTimeout(function() {
						step (num + middle_step, ++count);
					},40);
				}
			};
			btn_frnt_tm = setTimeout(function(){

				var small = PKAudioEditor.engine.wavesurfer.getDuration () / 2000;
				var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
				small /= zoom;

				if (small < 0.01) {
					small = 0.01;
				}

				step (small, 0);
			},390);
		};
		////////////////////////


		var k_arr_bck_time = 0;
		var k_arr_bck_mult = 1;
		var k_arr_bck_skip_frames = 4;
		UI.KeyHandler.addCallback ('KeyArrowBack', function ( key, c, ev ) {
			if (UI.InteractionHandler.on || !PKAudioEditor.engine.is_ready) return ;

			var time = ev.timeStamp;
			var diff = time - k_arr_bck_time;

			if (diff > 158) {
				k_arr_bck_mult = 1;
				k_arr_bck_skip_frames = 4;
			} else {
				if (--k_arr_bck_skip_frames < 0 && k_arr_bck_mult < 6.0)
					k_arr_bck_mult += 0.05;
			}

			k_arr_bck_time = time;

			// get zoom factor
			var jump = 0.5;
			var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
			jump /= zoom;
			jump *= k_arr_bck_mult;

			UI.fireEvent( 'RequestSkipBack', jump );
		}, [37]);

		var k_arr_frnt_time = 0;
		var k_arr_frnt_mult = 1;
		var k_arr_frnt_skip_frames = 4;
		UI.KeyHandler.addCallback ('KeyArrowFront', function ( key, c, ev ) {
			if (UI.InteractionHandler.on || !PKAudioEditor.engine.is_ready) return ;

			var time = ev.timeStamp;
			var diff = time - k_arr_frnt_time;

			if (diff > 158) {
				k_arr_frnt_mult = 1;
				k_arr_frnt_skip_frames = 4;
			} else {
				if (--k_arr_frnt_skip_frames < 0 && k_arr_frnt_mult < 6.0)
					k_arr_frnt_mult += 0.05;
			}

			k_arr_frnt_time = time;

			var jump = 0.5;
			var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
			jump /= zoom;
			jump *= k_arr_frnt_mult;

			UI.fireEvent( 'RequestSkipFront', jump );
		}, [39]);
		UI.KeyHandler.addCallback ('KeyShiftArrowBack', function ( key ) {
			if (UI.InteractionHandler.on || !PKAudioEditor.engine.is_ready) return ;

			var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
			if (region)
			{
				var pos = PKAudioEditor.engine.wavesurfer.ActiveMarker;
				var total_dur = PKAudioEditor.engine.wavesurfer.getDuration ();

				var durr = region.end / total_dur;

				if (pos > (durr + 0.004))
				{
					UI.fireEvent( 'RequestSeekTo', durr - 0.0001 );
					return ;
				}

				durr = region.start / total_dur;
				
				if (pos > (durr + 0.004))
				{
					UI.fireEvent( 'RequestSeekTo', durr );
					return ;
				}
			}
			
			UI.fireEvent( 'RequestSeekTo', 0 );
		}, [16, 37]);
		UI.KeyHandler.addCallback ('KeyShiftArrowFront', function ( key ) {
			if (UI.InteractionHandler.on || !PKAudioEditor.engine.is_ready) return ;

			// if region skip to the region
			var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
			if (region)
			{
				var pos = PKAudioEditor.engine.wavesurfer.ActiveMarker;
				var total_dur = PKAudioEditor.engine.wavesurfer.getDuration ();

				var durr = region.start / total_dur;
				
				if (pos < (durr - 0.004))
				{
					UI.fireEvent( 'RequestSeekTo', durr );
					return ;
				}

				durr = region.end / total_dur;

				if (pos < (durr - 0.004))
				{
					UI.fireEvent( 'RequestSeekTo', durr - 0.0001 );
					return ;
				}
			}

			UI.fireEvent( 'RequestSeekTo', 0.994 );
		}, [16, 39]);
		UI.KeyHandler.addCallback ('killctx', function ( e ) {
			var event = new Event ('killCTX', {bubbles: true});
			document.body.dispatchEvent (event);
		}, [27]);

		var btn_back_total = d.createElement ('button');
		btn_back_total.setAttribute('tabIndex', -1);
		btn_back_total.className = 'pk_btn icon-previous2';
		btn_back_total.innerHTML = '<span>Seek Start (Shift + left arrow)</span>';
		transport.appendChild ( btn_back_total );
		btn_back_total.onclick = function() {
			UI.fireEvent( 'RequestRegionClear');
			UI.fireEvent( 'RequestSeekTo', 0 );
			this.blur();
		};

		var btn_front_total = d.createElement ('button');
		btn_front_total.setAttribute('tabIndex', -1);
		btn_front_total.className = 'pk_btn icon-next2';
		btn_front_total.innerHTML = '<span>Seek End (Shift + right arrow)</span>';
		btn_front_total.onclick = function() {
			UI.fireEvent( 'RequestRegionClear');
			UI.fireEvent( 'RequestSeekTo', 0.996);
			this.blur();
		};
		transport.appendChild ( btn_front_total );


		var btn_rec = d.createElement ('button');
		btn_rec.setAttribute('tabIndex', -1);
		btn_rec.className = 'pk_btn icon-rec';
		btn_rec.innerHTML = '<span>Record (R)</span>';
		btn_rec.onclick = function() {
			if (this.getAttribute('disabled') === 'disabled') {
				this.blur (); return ;
			}

			UI.fireEvent('RequestActionRecordToggle');
			this.blur();
		};

		UI.listenFor ('ErrorRec', function() {
			btn_rec.style.opacity = 0.6;
			btn_rec.setAttribute("disabled", "disabled");
		});

		transport.appendChild ( btn_rec );
		UI.KeyHandler.addCallback ('KeyRecR', function( k ) {
			if (UI.InteractionHandler.on) return ;
			btn_rec.click ();
		}, [82]);

		UI.listenFor ('DidActionRecordStart', function () {
			btn_rec.classList.add ('pk_act');
		});
		UI.listenFor ('DidActionRecordStop', function () {
			btn_rec.classList.remove ('pk_act');
		});

		UI.KeyHandler.addCallback ('KeyTab', function ( key ) {
			if (UI.InteractionHandler.on || !PKAudioEditor.engine.is_ready) return ;

			UI.fireEvent ('RequestViewCenterToCursor');
		}, [9]);

		var timing = d.createElement( 'div' );
		timing.className = 'pk_timecontainer';

		var timingspan = d.createElement( 'span' );
		timingspan.innerText = '00:00:000';
		timingspan.className = 'pk_timing';
		timing.appendChild( timingspan );
		this.timing_el = timingspan;
		
		var total_duration = d.createElement( 'span' );
		total_duration.innerText = '00:00:000';
		total_duration.className = 'pk_total_dur';
		timing.appendChild( total_duration );
		
		var hover_duration = d.createElement( 'span' );
		hover_duration.innerText = '00:00:000';
		hover_duration.className = 'pk_hover_dur';
		timing.appendChild( hover_duration );

		setTimeout(function () {
			UI.listenFor ('DidZoom', function (v, f) {
				// do something smarter for f (event) ####
				if (f)
					hover_duration.textContent = formatTime (
						PKAudioEditor.engine.wavesurfer.drawer.handleEvent(f) * 
						PKAudioEditor.engine.wavesurfer.VisibleDuration + 
						PKAudioEditor.engine.wavesurfer.LeftProgress );
			});

			var old_refresh = 0;

			var avv = d.getElementsByClassName('pk_av')[0]; 
			avv.addEventListener ('mousemove', function ( e ) {
				// re-run the mousemove fam on zoom based on the pointer position)

				// throttle this as well ####  violation
				var new_refresh = e.timeStamp;

				if (new_refresh - old_refresh < 58) {
					return ;
				}

				old_refresh = new_refresh;

				hover_duration.textContent = formatTime (
					PKAudioEditor.engine.wavesurfer.drawer.handleEvent( e ) * 
					PKAudioEditor.engine.wavesurfer.VisibleDuration + 
					PKAudioEditor.engine.wavesurfer.LeftProgress );
			}, false);


			var main_context = PKAudioEditor._deps.ContextMenu ( avv );

			main_context.addOption ('Select Visible View', function( e,x,i ) {
				UI.fireEvent ('RequestRegionSet');
			}, false );

			main_context.addOption ('Reset Zoom', function( e ) {
				UI.fireEvent ('RequestZoomUI', 0);
			}, false );

			main_context.addOption ('Set Volume/Gain', function( e ) {
				UI.fireEvent ('RequestFXUI_Gain');
			}, false );

			main_context.addOption ('Copy', function( e ) {
				var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
				if (!region) return ;

				UI.fireEvent( 'RequestActionCopy');
			}, false );
			main_context.addOption ('Paste', function( e ) {
				if (!copable) return ;
				UI.fireEvent( 'RequestActionPaste');
			}, false );
			main_context.addOption ('Cut', function( e ) {
				var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
				if (!region) return ;

				UI.fireEvent( 'RequestActionCut');
			}, false );
			main_context.addOption ('Insert Silence', function( e ) {
				UI.fireEvent ('RequestFXUI_Silence', 0); // #### call effect
			}, false );
			// --- 


			var copable = false;
			UI.listenFor ('DidSetClipboard', function ( val ) {
				if (val)
					copable = true;
				else
					copable = false;
			});

			main_context.onOpen = function ( menu, div ) {
				var divs = div.childNodes;
				if (!copable) divs[4].className += ' pk_inact';

				UI.fireEvent ('RequestPause');

				var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
				if (region) return ;

				divs[3].className += ' pk_inact';
				divs[5].className += ' pk_inact';
			};

		}, 1000);
		
		UI.listenFor ('DidUpdateLen', function( val ) {
			total_duration.textContent = formatTime (val);
		});
		
		function formatTime( time ) {
			// if (time === 0) return '00:00:000';

			var time_s = time >> 0;
			var miliseconds = time - time_s;
			
			if (time_s < 10)
			{
				if (time === 0) return '00:00:000';
				time_s = '00:0' + time_s;
			}
			else if (time_s < 60)
			{
				time_s = '00:' + time_s;
			}
			else
			{
				var m = (time_s / 60) >> 0;
				var s = (time_s % 60);
				time_s = ((m<10)?'0':'') + m + ':' + (s < 10 ? '0'+s : s);
			}
			
			return time_s + ':' + ((miliseconds*1000)>>0); // (miliseconds+'').substr(2, 3);
		}
		UI.formatTime = formatTime;
		
		var volume1 = 0;
		var volume2 = 0;
		var old_refresh = 0;
		var wvpnt = document.querySelector('.pk_wavepoint');

		UI.listenFor ('DidAudioProcess', function( val ) {

			var time = val[0];
			var loudness = val[1];

			var new_refresh =  val[2] || w.performance.now ();

			if (new_refresh - old_refresh < 50) {
				return ;
			}

			old_refresh = new_refresh;

			if (time > -1) {
				timingspan.innerText = formatTime (time);
				
				if (PKAudioEditor.engine.wavesurfer.ZoomFactor > 1)
				{
					var perc = time / PKAudioEditor.engine.wavesurfer.getDuration ();

					if (!wvpnt) wvpnt = document.querySelector('.pk_wavepoint');
					wvpnt.style.left = ((perc * 100).toFixed(2)/1) + '%';
				}
			}

			if (!loudness)
			{
				UI.footer.volumeGaugePeaker.className = 'pk_peaker';
				UI.footer.volumeGaugePeaker2.className = 'pk_peaker';

				UI.footer.volumeGaugeInner.style.transform = 'translate3d(0,0,0)';
				UI.footer.volumeGaugeInner2.style.transform = 'translate3d(0,0,0)';
				// UI.footer.volumeGaugeInner.style.width = '100%';
				// UI.footer.volumeGaugeInner2.style.width = '100%';
			}
			else if (loudness[0] > 0) {
				UI.footer.volumeGaugePeaker.className = 'pk_peaker pk_act';
				
				UI.footer.volumeGaugeInner.style.transform = 'translate3d(100%,0,0)';
				// UI.footer.volumeGaugeInner.style.width = '0%';
				volume1 = 100;

				UI.footer.volumeGaugePeaker.setAttribute ('title', 'Peak at ' + PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(2) );
				if (loudness[1] > 0) {
					UI.footer.volumeGaugePeaker2.className = 'pk_peaker pk_act';
					
					UI.footer.volumeGaugeInner2.style.transform = 'translate3d(100%,0,0)';
					// UI.footer.volumeGaugeInner2.style.width = '0%';
					volume2 = 100;

					UI.footer.volumeGaugePeaker2.setAttribute ('title', 'Peak at ' + PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(2) );
				}
			}
			else if (loudness[1] > 0) {
				UI.footer.volumeGaugePeaker2.className = 'pk_peaker pk_act';
				
				UI.footer.volumeGaugeInner2.style.transform = 'translate3d(100%,0,0)';
				// UI.footer.volumeGaugeInner2.style.width = '0%';
				volume2 = 100;

				UI.footer.volumeGaugePeaker2.setAttribute ('title', 'Peak at ' + PKAudioEditor.engine.wavesurfer.getCurrentTime().toFixed(2) );
			}
			else
			{
				var tmp = (100 + loudness[0]);
				if (tmp < -100) volume1 = 0; // tmp = -100;
				else
				{
					volume1 = volume1 + (tmp - volume1)/4;
					if (isNaN (volume1)) volume1 = 0;
				}

				tmp = (100 + loudness[1]);
				if (tmp < -100) volume2 = 0; //tmp = -100;
				else
				{
					volume2 = volume2 + (tmp - volume2)/4;
					if (isNaN (volume2)) volume2 = 0;
				}

				UI.footer.volumeGaugeInner.style.transform = 'translate3d(' + volume1 + '%,0,0)';
				UI.footer.volumeGaugeInner2.style.transform = 'translate3d(' + volume2 + '%,0,0)';
				// UI.footer.volumeGaugeInner.style.width = (100 - volume1) + '%';
				// UI.footer.volumeGaugeInner2.style.width = (100 - volume2) + '%';
			}
		});
		
		
		var actions = d.createElement( 'div' );
		actions.className = 'pk_ctns';
		
		var copy_btn = d.createElement ('button');
		copy_btn.setAttribute('tabIndex', -1);
		copy_btn.className = 'pk_btn icon-files-empty pk_inact';
		copy_btn.innerHTML = '<span>Copy Selection (Shift + C)</span>';
		actions.appendChild ( copy_btn );

		copy_btn.onclick = function() {
			UI.fireEvent( 'RequestActionCopy');
			this.blur();
		};

		UI.listenFor ('DidSetClipboard', function ( val ) {
			if (val)
				paste_btn.classList.remove ('pk_inact');
			else
				paste_btn.classList.add ('pk_inact');
		});

		var paste_btn = d.createElement ('button');
		paste_btn.setAttribute('focusable', 'false');
		paste_btn.className = 'pk_btn icon-file-text2 pk_inact';
		paste_btn.innerHTML = '<span>Paste Selection (Shift + V)</span>';
		actions.appendChild ( paste_btn );

		paste_btn.onclick = function() {
			UI.fireEvent( 'RequestActionPaste');
			this.blur();
		};

		var cut_btn = d.createElement ('button');
		cut_btn.setAttribute('tabIndex', -1);
		cut_btn.className = 'pk_btn icon-scissors pk_inact';
		cut_btn.innerHTML = '<span>Cut Selection (Shift + X)</span>';
		actions.appendChild ( cut_btn );

		cut_btn.onclick = function() {
			UI.fireEvent( 'RequestActionCut');
			this.blur();
		};
		
		var silence_btn = d.createElement ('button');
		silence_btn.setAttribute('tabIndex', -1);
		silence_btn.className = 'pk_btn icon-silence';
		silence_btn.innerHTML = '<span>Insert Silence (Shift + N)</span>';
		actions.appendChild ( silence_btn );
		
		UI.KeyHandler.addCallback ('KeyShiftN', function( k ) {
			if (UI.InteractionHandler.on) return ;
			
			silence_btn.click ();
		},[16, 78]);

		silence_btn.onclick = function() {
			UI.fireEvent( 'RequestFXUI_Silence');			
			this.blur();
		};

		
		
		var selection = d.createElement( 'div' );
		selection.className = 'pk_selection';
		selection.innerHTML = '<div class="pk_sellist">' + 
			'<span class="pk_title">Selection:</span>' + 
			'<div><span class="title">Start:</span><span class="s_s pk_dat">-</span></div>' + 
			'<div><span class="title">End:</span><span class="s_e pk_dat">-</span></div>' + 
			'<div><span  class="title">Duration:</span><span class="s_d pk_dat">-</span></div>' +
		'</div>';
		
		var btn_clear_selection = d.createElement ('button');
		btn_clear_selection.setAttribute('tabIndex', -1);
		btn_clear_selection.className = 'pk_btn icon-clearsel pk_inact';
		btn_clear_selection.innerHTML = '<span>Clear Selection (~ tilda)</span>';

		var sel_spans = selection.getElementsByClassName('pk_dat');
		UI.listenFor ('DidCreateRegion', function ( region ) {
			copy_btn.classList.remove ('pk_inact');
			cut_btn.classList.remove ('pk_inact');
			btn_clear_selection.classList.remove  ('pk_inact');
			
			if (region)
			{
				if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
				sel_spans[0].innerText = region.start.toFixed(3);
				sel_spans[1].innerText = region.end.toFixed(3);
				sel_spans[2].innerText = (region.end - region.start).toFixed(3);
			}
		});
		UI.listenFor ('DidDestroyRegion', function () {
			copy_btn.classList.add ('pk_inact');
			cut_btn.classList.add  ('pk_inact');
			btn_clear_selection.classList.add  ('pk_inact');

			if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
			sel_spans[0].innerText = '-';
			sel_spans[1].innerText = '-';
			sel_spans[2].innerText = '-';
		});
		
		btn_clear_selection.onclick = function () {
			UI.fireEvent( 'RequestRegionClear');
			this.blur ();
		};
		selection.appendChild ( btn_clear_selection );
		
		toolbar.appendChild ( timing );
		
		
		UI.listenFor ('DidChanToggle', function ( chan, val ) {
			var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
			if (!region) return ;

			if (val === 1) {
				region.element.style.top = '0';
				region.element.style.height = '100%';
				return ;
			}

			if (chan === 0) {
				region.element.style.top = '50%';
				region.element.style.height = '50%';
				return ;
			}

			if (chan === 1) {
				region.element.style.top = '0';
				region.element.style.height = '50%';
			}
			//
		});

		// end
		toolbar.appendChild ( btn_groups );
		btn_groups.appendChild ( transport );
		btn_groups.appendChild ( actions );
		toolbar.appendChild ( selection );

		container.appendChild ( toolbar );

		UI.el.appendChild ( container );

		dragNDrop( d.getElementById('app'), 'pk_overlay', function ( e ) {
			PKAudioEditor.engine.LoadArrayBuffer ( new Blob([e]) );
		}, 'arrayBuffer' );

		// -
	};

	function _makeMobileScroll (UI) {

		var getFactor = function () {
			var screen_h = window.screen.height;
			var screen_w = window.screen.width;

			var iw = window.innerWidth;
			var ih = window.innerHeight;

			var bars_visible = false;
			var ratio = 0;

			if (window.orientation === 0) {
				ratio = ih / screen_h;
			}
			else if (window.orientation === 90 || window.orientation === -90) {
				ratio = ih / screen_w;
			}
			if (ratio < 0.8) bars_visible = true;

			return (bars_visible);
		};

		var ex = -1;
		var ey = -1;

		var allow = false;
		// var first = false;
		d.body.addEventListener ('touchstart', function( e ) {
			ex = e.touches[0].pageX;
			ey = e.touches[0].pageY;

			// first = true;
			allow = false;
		});

		d.body.addEventListener ('touchend', function( e ) {
			ex = -1;
			ey = -1;

			// first = false;
			allow = false;
		});

		d.body.addEventListener ('touchmove', function( e ) {
			if (e.target.tagName === 'INPUT') return ;
			if (allow) return ;

			var ny = e.touches[0].pageY;
			var nx = e.touches[0].pageX;
			var direction = ey - ny;
			var direction2 = ex - nx;

			// if (first) {
			//	first = false;
			// }

			if ( direction === 0 || (Math.abs (direction) < 3 && Math.abs (direction2) > 3 ) || (Math.abs (direction) < 6 && Math.abs (direction2) > 10 ) ) {
				ey = ny;
				ex = nx;
				allow = true;

				return ;
			}

			ey = ny;
			ex = nx;

			var xx = document.getElementsByClassName ('pk_modal_back');

			if (xx[0])
			{
				xx = xx[0];
				if ( xx.scrollHeight > window.innerHeight )
				{
					var scrolled = xx.scrollTop;

					if (direction > 0)
					{
						var modal_h = document.getElementsByClassName ('pk_modal')[0].clientHeight;

						if ((modal_h - scrolled) < (window.innerHeight - 80))
						{
							e.preventDefault ();
						}
					}
					else
					{
						if (scrolled <= 0)
						{
							e.preventDefault ();
						}
					}

					allow = true;
					return ;
				}
				else
				{
					e.preventDefault ();

					allow = true;
					return ;
				}
			}


			if (!getFactor ()) {
				e.preventDefault ();
				allow = true;
			}

		}, {passive:false});
	};
	// ---

	PKAE._deps.ui = PKUI;
	
})( window, document, PKAudioEditor );