(function( w, d, PKAE ) {
	'use strict';
	
	function KeyHandler () {
		var q = this;
		
		q.keyMap          = {}; // holds a map of all the active keys
		q.callbacks       = {}; // callbacks for when a key combintation becomes active
		q.singleCallbacks = {}; // callbacks to the 'keypress' event - not required

		q.addCallback = function (callback_name, callback_function, keys) {
			q.callbacks[ callback_name ] = {
				keys : keys,
				callback : callback_function
			};
		};
		q.addSingleCallback = function (callback_name, callback_function, key) {
			q.singleCallbacks[ callback_name ] = {
				key : key,
				callback : callback_function
			};
		};
		q.removeCallback = function ( callback_name ) {
			q.callbacks[ callback_name ] = null;
		};
		
		d.addEventListener ('keydown', function ( e ) {
			var keyCode = e.keyCode;

			q.keyDown (keyCode, e);
		});

		q.keyDown = function (keyCode, e ) {
			q.keyMap[keyCode] = 1;

			for (var key in q.callbacks) {
				var group = q.callbacks[key];
				if (!group) continue;
				
				var l = group.keys.length;
				var all_ok = true;
				while (l-- > 0) {
					if (!q.keyMap[group.keys[l]])
					{
						all_ok = false;
						break;
					}
				}

				all_ok && group.callback && group.callback ( keyCode, q.keyMap, e );
			}			
		};

		q.keyUp = function ( keyCode ) {
			q.keyMap[keyCode] = 0;
		};

		q.keyPress = function ( keyCode, e ) {
			for (var key in q.singleCallbacks) {
				var group = q.singleCallbacks[key];
				if (!group) continue;
				
				if (group.key === keyCode)
					group.callback && group.callback ( e );
			}
		};

		d.addEventListener ('keyup', function ( e ) {
			var keyCode = e.keyCode;
			q.keyUp (keyCode);
		});

		d.addEventListener ('keypress', function ( e ) {
			var keyCode = e.keyCode;

			q.keyPress (keyCode, e);
		});

		w.addEventListener ('blur', function ( e ) {
			q.keyMap = {};
		}, false);
		d.addEventListener ('contextmenu', function( e ) {
			e.preventDefault();
		}, false);
	};
	
	PKAE._deps.keyhandler = KeyHandler;

})( window, document, PKAudioEditor  );