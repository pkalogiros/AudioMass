(function ( w, d, PKAE ) {
'use strict';

setTimeout(function () {
	if (/(^|[?&])skipintro=1(&|$)/.test (w.location.search)) return ;
	var scroll_hint = 0;
	var showScrollHint = function () {
		var tbc, el, r;
		if (!PKAE.isMobile || scroll_hint) return ;
		scroll_hint = 1;
		tbc = PKAE.ui.el.getElementsByClassName ('pk_tbc')[0];
		if (!tbc || tbc.scrollWidth <= tbc.clientWidth + 2) return ;
		el = d.createElement ('i');
		r = tbc.getBoundingClientRect ();
		el.className = 'pk_tbhint';
		el.innerHTML = '&#8250;';
		el.style.top = ((r.top + r.height / 2 - 12) >> 0) + 'px';
		PKAE.ui.el.appendChild ( el );
		setTimeout (function () {
			el.parentNode && el.parentNode.removeChild ( el );
		}, 3000);
	};

	PKAudioEditor._deps.Wlc = function () {
			var body_str = '';
			var body_str2 = '';
			var mobile_note = '';

			if (PKAE.isMobile) {
				mobile_note = '(Optimized for desktop - sorry)<br/><br/>';
				body_str = 'Tips:<br/>Please make sure your device is not in silent mode. You might need to physically flip the silent switch. '+
				'<img src="phone-switch.jpg" style="max-width:224px;max-height:126px;width:40%;margin: 10px auto; display: block;"/>'+
				'<br/><br/>';
			}
			else {
				body_str = 'Tips:<br/>Please keep in mind that most key shortcuts rely on the <strong>Shift + <u>key</u></strong> combo. (eg Shift+Z for undo, Shift+C copy, Shift+X cut... etc )<br/><br/>';
				body_str2 = 'Check out the codebase on <a href="https://github.com/pkalogiros/audiomass" target="_blank">Github</a><br/><br/>'; // checkout the code on github
			}

			// Welcome to AudioMass,
			var md = new PKSimpleModal({
				title: '<font style="font-size:15px">Welcome to AudioMass</font>',
				ondestroy: function( q ) {
					PKAE.ui.InteractionHandler.on = false;
					PKAE.ui.KeyHandler.removeCallback ('modalTemp');
					showScrollHint ();
			},
			body:'<div style="overflow:auto;-webkit-overflow-scrolling:touch;max-width:580px;width:calc(100vw - 40px);max-height:calc(100vh - 340px);min-height:110px;font-size:13px; color:#95c6c6;padding-top:7px;">'+
				mobile_note+
				'AudioMass is a free, open source, web-based Audio and Waveform Editor.<br />It runs entirely in the browser with no backend and no plugins required!'+
				'<br/><br/>'+
				body_str+
				'You can load any type of audio your browser supports and perform operations such as fade in, cut, trim, change the volume, '+
				'and apply a plethora of audio effects.<br/><br/>'+
				body_str2+
				'I hope you enjoy the little music pieces. I wrote them a long time ago :)'+
				'</div>',
			setup:function( q ) {
					PKAE.ui.InteractionHandler.checkAndSet ('modal');
					PKAE.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
						q.Destroy ();
					}, [27]);

					// ------
					var scroll = q.el_body.getElementsByTagName('div')[0];
					scroll.addEventListener ('touchstart', function(e){
						e.stopPropagation ();
					}, false);
					scroll.addEventListener ('touchmove', function(e){
						e.stopPropagation ();
					}, false);

					// ------
				}
			});
			md.Show ();
			document.getElementsByClassName('pk_modal_cancel')[0].innerHTML = '&nbsp; &nbsp; &nbsp; OK &nbsp; &nbsp; &nbsp;';
	};

	var change = 99;
	var exists = w.localStorage && w.localStorage.getItem ('k');

	if (!exists) {
		change = 0;
		w.localStorage && w.localStorage.setItem ('k', 1);
	}

	if ( ((Math.random () * 100) >> 0) < change) return ;
	PKAudioEditor._deps.Wlc ();

}, 320);

})( window, document, PKAudioEditor );
