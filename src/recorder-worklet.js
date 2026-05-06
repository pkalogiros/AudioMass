class PKRec extends AudioWorkletProcessor {
	constructor ( opts ) {
		super ();
		opts = opts || {};
		this.b = new Float32Array (opts.processorOptions && opts.processorOptions.size || 4096);
		this.i = 0;
		this.done = false;
		this.port.onmessage = this.flush.bind ( this );
	}

	flush () {
		this.done = true;
		if (this.i) {
			var b = this.b.subarray (0, this.i).slice (0);
			this.i = 0;
			this.port.postMessage ( b, [b.buffer] );
		}
		this.port.postMessage (0);
	}

	process ( ins ) {
		if (this.done) return false;
		var ch = ins[0] && ins[0][0];
		if (!ch) return true;

		var b = this.b;
		var i = this.i;
		var l = b.length;
		for (var off = 0; off < ch.length;) {
			var n = Math.min (l - i, ch.length - off);
			b.set (ch.subarray (off, off + n), i);
			i += n;
			off += n;
			if (i === l) {
				this.port.postMessage ( b, [b.buffer] );
				b = this.b = new Float32Array ( l );
				i = 0;
			}
		}
		this.i = i;
		return true;
	}
}

registerProcessor ('pk-recorder', PKRec);
