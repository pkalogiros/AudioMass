(function ( w, d, PKAE ) {
	'use strict';

	var db;
	var db_name    = 'audiomass';
	var db_version = 1;
	var db_ready   = false;

	var compressors = {
		'l4z' : {
			ready: false,
			loading: false,
			compress: null,
			decompress: null,
			init : function ( callback ) {

				var q = this;
				q.loading = true;

				var lz4BlockWASM;

				lz4BlockCodec.createInstance('wasm').then(instance => {
				    lz4BlockWASM = instance;

				    q.ready = true;
				    q.loading = false;
				    q.compress = function( input, offset ) {
				    	if (!lz4BlockWASM) {
				    		if (input instanceof ArrayBuffer)
				    			return new Uint8Array(input);
				    		else
				    			return input;
				    	}

			    		return lz4BlockWASM.encodeBlock(input, 0);
					};
				    q.decompress = function( input, offset, size ) {
				    	if (!lz4BlockWASM) {
				    		if (input instanceof ArrayBuffer)
				    			return new Uint8Array(input);
				    		else
				    			return input;
				    	}

			    		return lz4BlockWASM.decodeBlock(input, 0, size);
					};

					callback && callback ();
				});
				// ---
			}
		}
	};

	var compression = 'l4z';

	function SaveLocal ( app ) {
		var q = this;
		q.on = false;

		this.Init = function ( callback ) {
			if (q.on) {
				callback && callback ();
				return ;
			}

			if (!window.indexedDB) {
				callback && callback ('err');
				return ;
			}

			var request = indexedDB.open (db_name, db_version);

			request.onerror = function(e) {
				callback && callback ('err');
				// console.error('Unable to open database.');
			};

			request.onupgradeneeded = function(e) {
				var db = e.target.result;
				db.createObjectStore('sessions', {keyPath:'id'});
			};

			request.onsuccess = function(e) {
				db = e.target.result;

				db.onerror = function( e ) {
					console.log( e );
				};

				setTimeout(function() {
					db_ready = true;
					q.on = true;

					callback && callback ();
					app.fireEvent ('DidOpenDB', q);
				},120);
			};
		};

		this.SaveSession = function ( buffer, id, name ) {
			var q = this;

			var comp = compressors[ compression ];
			if (!comp.loading && !comp.ready) {
				comp.init (function() {
					q.SaveSession (buffer, id, name);
				});

				return ;
			}

			var chans = buffer.numberOfChannels;
			var arr_buffs = [];
			var arr_buffs2 = [];
			var arr;
			var tmp;

			var sample_rate = buffer.sampleRate;

			for (var i = 0; i < chans; ++i) {
				arr = buffer.getChannelData ( i );

				arr_buffs2.push (arr.buffer.byteLength);
				tmp = comp.compress ( arr.buffer, 0);
				arr_buffs.push ( tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset));
			}

			tmp = null;

			var ob = {
				id : id,
				name: name,
				created: new Date().getTime(),
				data: arr_buffs,
				data2: arr_buffs2,
				durr: buffer.duration.toFixed(3)/1,
				chans: chans,
				comp: compression,
				thumb: PKAudioEditor.engine.GetWave (buffer),
				samplerate: sample_rate
			};

			var trans = db.transaction(['sessions'], 'readwrite');
			var addReq = trans.objectStore('sessions').add(ob);

			addReq.onerror = function(e) {
				app.fireEvent ('ErrorDB', e);

				console.log('error storing data');
				console.error(e);
			};

			trans.oncomplete = function ( e ) {
				app.fireEvent ('DidStoreDB', ob, e );
				// console.log( 'data stored', id, e );
            };
		};

		this.GetSession = function ( id, callback ) {
			var trans = db.transaction(['sessions'], 'readonly');
			//hard coded id
			var req = trans.objectStore('sessions').get(id);

			req.onsuccess = function(e) {
				// console.log( e.target.result );


				var record = e.target.result;

				if (record && record.comp)
				{
					var comp = compressors[ compression ];
					if (!comp.loading && !comp.ready) {
						comp.init (function() {

							var data_arr = [];
							var tmp = null;

							for (var i = 0; i < record.data.length; ++i) {
								tmp = comp.decompress (record.data[i], 0, record.data2[i]);
								data_arr.push ( 
									tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset)
								);
							}

							tmp = null;
							record.data = data_arr;

							callback && callback ( record );
						});

						return ;
					}

					var data_arr = [];
					var tmp = null;

					for (var i = 0; i < record.data.length; ++i) {
						tmp = comp.decompress (record.data[i], 0, record.data2[i]);
						data_arr.push ( 
							tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset)
						);
					}

					tmp = null;
					record.data = data_arr;
				}

				callback && callback ( record );
			};
		};

		this.DelSession = function ( id, callback ) {
			var trans = db.transaction(['sessions'], 'readwrite');

			var req = trans.objectStore('sessions').delete (id);
			req.onsuccess = function (e) {
				callback && callback ( id );
			};
		};

		this.ListSessions = function ( callback ) {
			var trans = db.transaction(['sessions'], 'readonly');
			var object_store = trans.objectStore('sessions');
			var req = object_store.openCursor();
			var ret = [];

			req.onerror = function(event) {
			   console.err("error fetching data");
			};
			req.onsuccess = function(event) {
			   var cursor = event.target.result;
			   if (cursor) {
			       var key = cursor.primaryKey;
			       var value = cursor.value;

			       ret.push (value);
			       cursor.continue();
			   }
			   else {
					var rr = ret.sort(function compare( a, b ) {
						  if ( a.created > b.created ){
						    return -1;
						  }
						  if ( a.created < b.created ){
						    return 1;
						  }
						  return 0;
					});

					callback && callback (rr);
			       // no more results
			   }
			};
		};
		// ---
	};

	PKAudioEditor._deps.fls = SaveLocal;

})( window, document, PKAudioEditor );