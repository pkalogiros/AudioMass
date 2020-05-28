(function ( w, d ) {
	
	function OneUp ( _text, _time, _clss ) {
		var el = d.createElement ('div');
		var cl = 'pk_oneup pk_noselect';

		el.style.cssText = 'margin-top:20px;opacity:0';
		if (_clss) cl = cl + ' ' + _clss;

		el.className = cl;
		el.innerHTML = _text || '';

		d.body.appendChild ( el );
		setTimeout (function() {
			el.style.cssText = 'margin-top:0px;opacity:1';
			
			setTimeout (function() {
				el.style.cssText = 'margin-top:-20px;opacity:0';
				
				setTimeout (function() {
					el.parentNode.removeChild ( el );
					el = null;
				}, 330);
			}, _time || 720);
		}, 25);
	}

	w.OneUp = OneUp;
})( window, document );