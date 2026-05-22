(function ( w, d ) {
	'use strict';

	var _v = '0.9',
		_id = -1;

	function PKAE () {
		var q = this; // keeping track of current context

		q.el = null; // reference of main html element
		q.id = ++_id; // auto incremental id
		q._deps = {}; // dependencies

		w.PKAudioList[q.id] = q;

		var events = {};

		q.fireEvent = function ( eventName, value, value2 ) {
			if (q.multitrack &&
				typeof eventName === 'string' &&
				eventName.substr (0, 7) === 'Request' &&
				q.multitrack.Propagate &&
				q.multitrack.Propagate ( eventName, value, value2 ))
			{
				return (true);
			}

			var group = events[eventName];
			if (!group) return (false);

			var l = group.length;
			while (l-- > 0) {
				group[l] && group[l] ( value, value2 );
			}
		};

		q.listenFor = function ( eventName, callback ) {
			if (!events[eventName])
				events[eventName] = [ callback ];
			else
				events[eventName].unshift ( callback  );
		};

		q.stopListeningFor = function ( eventName, callback ) {
			var group = events[eventName];
			if (!group) return (false);

			var l = group.length;
			while (l-- > 0) {
				if (group[l] && group[l] === callback) {
					group[l] = null; break;
				}
			}
		};

		q.stopListeningForName = function ( eventName ) {
			var group = events[eventName];
			if (!group) return (false);
			events[eventName] = null;
		};

		q.wheelInfo = function ( e ) {
			var m = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? w.innerHeight : 1);
			var x = (e.deltaX || 0) * m;
			var y = (e.deltaY || 0) * m;
			if (e.shiftKey && Math.abs (x) < Math.abs (y)) {
				x = y;
				y = 0;
			}
			return {
				x: x,
				y: y,
				ax: Math.abs (x),
				ay: Math.abs (y),
				pinch: !!e.ctrlKey
			};
		};

		q.wheelZoomFactor = function ( delta ) {
			return Math.max (0.2, Math.min (5, Math.pow (1.0025, -delta)));
		};

		q.fadeGain = function ( p ) {
			p = p < 0 ? 0 : (p > 1 ? 1 : p);
			return p * p;
		};

		var scripts = {};
		q.loadScript = function ( src, ok, fail ) {
			if (scripts[src] === true) {
				ok && ok ();
				return ;
			}
			if (scripts[src]) {
				scripts[src].push ([ ok, fail ]);
				return ;
			}

			scripts[src] = [[ ok, fail ]];
			var script = d.createElement ('script');
			script.onload = function () {
				var list = scripts[src];
				scripts[src] = true;
				for (var i = 0; i < list.length; ++i)
					list[i][0] && list[i][0] ();
			};
			script.onerror = function () {
				var list = scripts[src];
				scripts[src] = null;
				for (var i = 0; i < list.length; ++i)
					list[i][1] && list[i][1] ();
			};
			script.src = src;
			d.head.appendChild (script);
		};

		q.init = function ( el_id ) {
			var el = d.getElementById( el_id );
			if (!el) {
				console.log ('invalid element');
				return ;
			}
			q.el = el;

			// init libraries
			q.mrk    = q._deps.mrk ? new q._deps.mrk ( q ) : null;
			q.ui     = new q._deps.ui ( q ); q._deps.uifx ( q );
			q.engine = new q._deps.engine ( q );
			q.state  = new q._deps.state ( 96, q );
			q.rec    = new q._deps.rec ( q );
			q.fls    = new q._deps.fls ( q );
			q.amss   = q._deps.amss ? new q._deps.amss ( q ) : null;
			q.multitrack = q._deps.multitrack ? new q._deps.multitrack ( q ) : null;

			if (q.multitrack && /[?&]multitrack=1\b/.test(w.location.search)) {
				q.multitrack.Toggle (true);
			}

			if (w.location.href.split('local=')[1]) {
				var sess = w.location.href.split('local=')[1];

				q.fls.Init (function () {
					q.fls.GetSession (sess, function ( e ) {
						if(e && e.id === sess )
						{
							q.engine.LoadDB ( e );
						}
					});
				});
			}

			return (q);
		};

		// check if we are mobile and hide tooltips on hover
		q.isMobile = (/iphone|ipod|ipad|android/).test
			(navigator.userAgent.toLowerCase ());
	};

	!w.PKAudioList && (w.PKAudioList = []);

	// ideally we do not want a global singleto refferencing our audio tool
	// but since this is a limited demo we can safely do it.
	w.PKAudioEditor = new PKAE ();

	PKAudioList.push (w.PKAudioEditor); // keeping track in the audiolist array of our instance

})( window, document );
