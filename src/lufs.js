(function (PKAE) {
	'use strict';

	var C = {
		block: 0.400,
		hop: 0.100,
		absGate: -70,
		relGate: -10,
		offset: -0.691,
		truePeakSteps: 4
	};

	function db (v) {
		return v > 0 ? 20 * Math.log (v) / Math.LN10 : -120;
	}

	function loud (v) {
		return v > 0 ? C.offset + 10 * Math.log (v) / Math.LN10 : -Infinity;
	}

	function norm (b0, b1, b2, a0, a1, a2) {
		return {
			b0: b0 / a0,
			b1: b1 / a0,
			b2: b2 / a0,
			a1: a1 / a0,
			a2: a2 / a0
		};
	}

	function highShelf (rate) {
		var f0 = Math.min (1681.974450955533, rate * 0.45);
		var q = 0.7071752369554196;
		var gain = 3.999843853973347;
		var a = Math.pow (10, gain / 40);
		var w0 = 2 * Math.PI * f0 / rate;
		var sn = Math.sin (w0);
		var cs = Math.cos (w0);
		var alpha = sn / (2 * q);
		var sa = Math.sqrt (a);

		return norm (
			a * ((a + 1) + (a - 1) * cs + 2 * sa * alpha),
			-2 * a * ((a - 1) + (a + 1) * cs),
			a * ((a + 1) + (a - 1) * cs - 2 * sa * alpha),
			(a + 1) - (a - 1) * cs + 2 * sa * alpha,
			2 * ((a - 1) - (a + 1) * cs),
			(a + 1) - (a - 1) * cs - 2 * sa * alpha
		);
	}

	function highPass (rate) {
		var f0 = Math.min (38.13547087602444, rate * 0.45);
		var q = 0.5003270373238773;
		var w0 = 2 * Math.PI * f0 / rate;
		var sn = Math.sin (w0);
		var cs = Math.cos (w0);
		var alpha = sn / (2 * q);

		return norm (
			(1 + cs) / 2,
			-(1 + cs),
			(1 + cs) / 2,
			1 + alpha,
			-2 * cs,
			1 - alpha
		);
	}

	function kWeightCoeffs (rate) {
		return [highShelf (rate), highPass (rate)];
	}

	function biquad (x, c, s) {
		var y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2 - c.a1 * s.y1 - c.a2 * s.y2;
		s.x2 = s.x1; s.x1 = x;
		s.y2 = s.y1; s.y1 = y;
		return (y);
	}

	function interp (a, b, c, d, t) {
		var t2 = t * t;
		return 0.5 * ((2 * b) + (-a + c) * t +
			(2 * a - 5 * b + 4 * c - d) * t2 +
			(-a + 3 * b - 3 * c + d) * t2 * t);
	}

	function analyze (buffer) {
		var rate = buffer.sampleRate;
		var len = buffer.length;
		var channels = buffer.numberOfChannels;
		var hop = Math.max (1, (rate * C.hop) >> 0);
		var block = Math.max (1, hop * 4);
		if (len < block) {
			block = len;
			hop = len || 1;
		}
		var blocks = len <= block ? 1 : (((len - block) / hop) >> 0) + 1;
		var sums = new Float64Array (blocks);
		var coeffs = kWeightCoeffs (rate);
		var slots = Math.max (1, (block / hop) >> 0);
		var total = 0;
		var peak = 0;
		var tpeak = 0;

		for (var ch = 0; ch < channels; ++ch) {
			var data = buffer.getChannelData (ch);
			var weight = ch > 2 ? 1.41 : 1.0;
			var idx = [];
			var acc = [];
			var s1 = {x1:0, x2:0, y1:0, y2:0};
			var s2 = {x1:0, x2:0, y1:0, y2:0};
			var next = 0;
			var bi = 0;

			for (var z = 0; z < slots; ++z) {
				idx[z] = -1;
				acc[z] = 0;
			}

			function flush (slot) {
				if (idx[slot] >= 0) {
					sums[idx[slot]] += acc[slot] * weight;
					idx[slot] = -1;
					acc[slot] = 0;
				}
			}

			for (var i = 0; i < len; ++i) {
				if (i === next) {
					var slot = bi % slots;
					flush (slot);
					if (bi < blocks) {
						idx[slot] = bi;
						acc[slot] = 0;
					}
					++bi;
					next += hop;
				}

				var x = data[i];
				var ax = Math.abs (x);
				var y = biquad (biquad (x, coeffs[0], s1), coeffs[1], s2);
				var yy = y * y;

				total += x * x;
				if (ax > peak) peak = ax;
				if (ax > tpeak) tpeak = ax;

				if (i < len - 1) {
					var x0 = i ? data[i - 1] : x;
					var x2 = data[i + 1];
					var x3 = i < len - 2 ? data[i + 2] : x2;
					for (var tp = 1; tp < C.truePeakSteps; ++tp) {
						ax = Math.abs (interp (x0, x, x2, x3, tp / C.truePeakSteps));
						if (ax > tpeak) tpeak = ax;
					}
				}

				for (var j = 0; j < slots; ++j) {
					if (idx[j] >= 0) acc[j] += yy;
				}
			}

			for (var k = 0; k < slots; ++k) flush (k);
		}

		var energies = [];
		var sum = 0;
		for (var n = 0; n < blocks; ++n) {
			var e = sums[n] / block;
			if (loud (e) >= C.absGate) {
				energies.push (e);
				sum += e;
			}
		}

		var lufs = -Infinity;
		if (energies.length) {
			var gate = loud (sum / energies.length) + C.relGate;
			sum = 0;
			var count = 0;
			for (var m = 0; m < energies.length; ++m) {
				if (loud (energies[m]) >= gate) {
					sum += energies[m];
					++count;
				}
			}
			if (count) lufs = loud (sum / count);
		}

		var rms = Math.sqrt (total / Math.max (1, len * channels));
		return {
			lufs: lufs,
			rms: rms,
			rmsDb: db (rms),
			peak: peak,
			peakDb: db (peak),
			truePeak: tpeak,
			truePeakDb: db (tpeak),
			blocks: blocks
		};
	}

	function integratedLUFS (buffer) {
		return analyze (buffer).lufs;
	}

	function gainForTarget (report, target, ceiling) {
		target = target / 1;
		ceiling = ceiling / 1;
		if (!isFinite (ceiling)) ceiling = -1;

		var gainDb = isFinite (report.lufs) ? target - report.lufs : 0;
		var maxGain = ceiling - report.truePeakDb;
		var limited = false;

		if (gainDb > maxGain) {
			gainDb = maxGain;
			limited = true;
		}

		return {
			gain: Math.pow (10, gainDb / 20),
			gainDb: gainDb,
			limited: limited,
			expectedLUFS: isFinite (report.lufs) ? report.lufs + gainDb : report.lufs,
			expectedTruePeakDb: report.truePeakDb + gainDb
		};
	}

	PKAE._deps.lufs = {
		BS1770Block: C,
		kWeightCoeffs: kWeightCoeffs,
		integratedLUFS: integratedLUFS,
		analyze: analyze,
		gainForTarget: gainForTarget,
		db: db
	};
})(PKAudioEditor);
