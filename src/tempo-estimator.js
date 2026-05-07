(function ( w ) {
	'use strict';

	function scoreLag ( flux, lag ) {
		var score = 0;
		var len = flux.length - lag;
		if (len <= 0) return (0);

		for (var i = lag; i < flux.length; ++i)
			score += flux[i] * flux[i - lag];

		return (score / len);
	}

	function makeFlux ( buffer ) {
		var sr = buffer.sampleRate;
		var hop = Math.max (256, (sr / 100) >> 0);
		var frames = Math.max (1, buffer.length / hop >> 0);
		var env = new Float32Array (frames);
		var chans = buffer.numberOfChannels;
		var ch0 = buffer.getChannelData (0);
		var ch1 = chans > 1 ? buffer.getChannelData (1) : null;

		for (var i = 0; i < frames; ++i) {
			var start = i * hop;
			var end = Math.min (buffer.length, start + hop);
			var sum = 0;
			var j = start;

			if (ch1) {
				for (; j < end; ++j)
					sum += Math.abs (ch0[j]) + Math.abs (ch1[j]);
				env[i] = sum / ((end - start) * 2);
			}
			else {
				for (; j < end; ++j)
					sum += Math.abs (ch0[j]);
				env[i] = sum / (end - start);
			}
		}

		var flux = new Float32Array (frames);
		var mean = env[0] || 0;
		flux[0] = mean;
		for (i = 1; i < frames; ++i) {
			var v = env[i] - env[i - 1];
			if (v > 0) {
				flux[i] = v;
				mean += v;
			}
		}

		mean = mean / Math.max (1, frames) * 1.25;
		for (i = 0; i < frames; ++i)
			flux[i] = Math.max (0, flux[i] - mean);

		return ({ data: flux, rate: sr / hop });
	}

	function foldTempo ( bpm, min, max ) {
		while (bpm < min) bpm *= 2;
		while (bpm > max) bpm /= 2;
		return (bpm);
	}

	function pickPeaks ( flux, rate ) {
		var peaks = [];
		var hold = Math.max (1, rate * 0.08 >> 0);
		var last = -hold;

		for (var i = 1; i < flux.length - 1; ++i) {
			if (i - last < hold) continue;
			if (flux[i] <= flux[i - 1] || flux[i] < flux[i + 1] || flux[i] <= 0)
				continue;

			peaks.push ({ pos: i, val: flux[i] });
			last = i;
		}

		peaks.sort (function ( a, b ) { return b.val - a.val; });
		if (peaks.length > 320) peaks.length = 320;
		peaks.sort (function ( a, b ) { return a.pos - b.pos; });
		return (peaks);
	}

	function intervalTempo ( flux, rate, min, max ) {
		var peaks = pickPeaks (flux, rate);
		var bins = {};
		var best = 0;
		var bestScore = 0;
		var second = 0;

		for (var i = 0; i < peaks.length; ++i) {
			for (var j = i + 1; j < peaks.length && j < i + 16; ++j) {
				var dist = (peaks[j].pos - peaks[i].pos) / rate;
				if (dist <= 0) continue;
				var bpm = foldTempo (60 / dist, min, max);
				var key = Math.round (bpm);
				var score = (peaks[i].val + peaks[j].val) / (j - i);

				bins[key] = (bins[key] || 0) + score;
			}
		}

		for (var k in bins) {
			var val = bins[k];
			if (val > bestScore) {
				second = bestScore;
				bestScore = val;
				best = k / 1;
			}
			else if (val > second) {
				second = val;
			}
		}

		return ({
			tempo: best,
			score: bestScore,
			confidence: bestScore ? (bestScore - second) / bestScore : 0
		});
	}

	function analyze ( buffer, opts ) {
		opts = opts || {};
		if (!buffer || !buffer.length || buffer.duration < 2)
			throw new Error ('Audio is too short to estimate tempo.');

		var min = opts.minTempo || 60;
		var max = opts.maxTempo || 200;
		var env = makeFlux (buffer);
		var flux = env.data;
		var rate = env.rate;
		var minLag = Math.max (1, Math.round (rate * 60 / max));
		var maxLag = Math.min (flux.length - 1, Math.round (rate * 60 / min));
		var bestLag = 0;
		var bestScore = 0;
		var secondScore = 0;

		for (var lag = minLag; lag <= maxLag; ++lag) {
			var score = scoreLag (flux, lag);
			if (lag * 2 < flux.length) score += scoreLag (flux, lag * 2) * 0.35;
			if (lag * 3 < flux.length) score += scoreLag (flux, lag * 3) * 0.20;

			if (score > bestScore) {
				secondScore = bestScore;
				bestScore = score;
				bestLag = lag;
			}
			else if (score > secondScore) {
				secondScore = score;
			}
		}

		if (!bestLag || !bestScore)
			throw new Error ('Could not find a reliable tempo.');

		var acTempo = 60 * rate / bestLag;
		var intv = intervalTempo (flux, rate, min, max);
		var tempo = acTempo;
		if (intv.tempo) {
			var ratio = Math.max (tempo, intv.tempo) / Math.min (tempo, intv.tempo);
			if (ratio > 1.85 && ratio < 2.15)
				tempo = intv.tempo;
			else if (Math.abs (tempo - intv.tempo) < 8)
				tempo = (tempo + intv.tempo) / 2;
			else if (intv.confidence > 0.25)
				tempo = intv.tempo;

			bestLag = Math.max (1, Math.round (rate * 60 / tempo));
		}

		var phase = 0;
		var phaseScore = 0;
		for (var p = 0, phaseLen = Math.min (bestLag, flux.length); p < phaseLen; ++p) {
			var ps = 0;
			for (var k = p; k < flux.length; k += bestLag)
				ps += flux[k];

			if (ps > phaseScore) {
				phaseScore = ps;
				phase = p;
			}
		}

		var period = bestLag / rate;
		var offset = phase / rate;
		var beats = Math.max (0, Math.floor ((buffer.duration - offset) / period));
		var confidence = Math.max ((bestScore - secondScore) / bestScore, intv.confidence || 0);
		confidence = Math.max (0, Math.min (100, confidence * 100));

		return ({
			tempo: Math.round (tempo * 10) / 10,
			bpm: Math.round (tempo),
			offset: Math.round (offset * 1000) / 1000,
			beats: beats,
			confidence: Math.round (confidence),
			duration: Math.round (buffer.duration * 10) / 10
		});
	}

	w.PKTempoEstimator = {
		estimate: function ( buffer, opts ) {
			return new Promise (function ( resolve, reject ) {
				setTimeout (function () {
					try { resolve (analyze (buffer, opts)); }
					catch (e) { reject (e); }
				}, 20);
			});
		}
	};
	})( typeof self !== 'undefined' ? self : window );
