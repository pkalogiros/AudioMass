(function ( w ) {
	'use strict';

	importScripts ('tempo-estimator.js?v=mt2');

	function makeBuffer ( data ) {
		return ({
			sampleRate: data.sampleRate,
			length: data.length,
			duration: data.length / data.sampleRate,
			numberOfChannels: data.channels.length,
			getChannelData: function ( index ) {
				return data.channels[index] || data.channels[0];
			}
		});
	}

	w.onmessage = function ( e ) {
		var msg = e.data || {};
		if (msg.type !== 'estimate') return ;

		w.PKTempoEstimator.estimate (makeBuffer (msg.buffer), msg.opts).then (
			function ( ret ) {
				w.postMessage ({ id: msg.id, result: ret });
			},
			function ( err ) {
				w.postMessage ({
					id: msg.id,
					error: err && err.message ? err.message : 'Could not estimate tempo.'
				});
			}
		);
	};
})( self );
