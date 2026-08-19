(function ( PKAE ) {
	'use strict';
	
	function PKState ( _depth, app ) {
		if (!_depth) _depth = 1;

		var q = this;

		var _id = 1;
		var _fireEvent = app.fireEvent;
		var _listenFor = app.listenFor;

		var undo_state_list = [];
		var redo_state_list = [];

		// snapshots retain full audio buffers, so long files can hold
		// gigabytes hostage well before the depth cap is reached - keep
		// the total retained bytes bounded instead. _min_keep undo steps
		// are always available no matter their size (product decision:
		// never fall below 10), the byte budget only trims beyond them
		var _max_bytes = 1.5 * 1024 * 1024 * 1024;
		var _min_keep  = 10;

		function bufferBytes ( b, seen ) {
			if (!b || !b.length || !b.numberOfChannels || seen.indexOf ( b ) !== -1) return 0;
			seen.push ( b );
			return b.length * b.numberOfChannels * 4;
		}

		function stateBytes ( state, seen ) {
			var total = bufferBytes ( state && state.data, seen );
			var clips = state && state.mt && state.mt.clips;
			if (clips)
				for (var i = 0; i < clips.length; ++i)
					total += bufferBytes ( clips[i] && clips[i].buffer, seen );
			return total;
		}

		function seedLiveMultitrackBuffers ( seen, pending_editor_buffer ) {
			// buffers still referenced by live multitrack clips are
			// retained regardless, so snapshots sharing them cost nothing.
			// The pending editor buffer is the exception: editing a clip will
			// replace that live reference immediately after this state push.
			var mt = app.multitrack && app.multitrack.getState ?
				app.multitrack.getState () : null;
			var clips = mt && mt.clips;
			if (clips)
				for (var i = 0; i < clips.length; ++i) {
					var b = clips[i] && clips[i].buffer;
					if (b && b !== pending_editor_buffer && seen.indexOf ( b ) === -1) seen.push ( b );
				}
		}

		function liveEditorBuffer () {
			var eng = app.engine;
			return eng && eng.wavesurfer && eng.wavesurfer.backend ?
				eng.wavesurfer.backend.buffer : null;
		}

		function trimForMemory () {
			var len = undo_state_list.length;
			if (len <= _min_keep) return ;

			// An untyped (audio edit) push is about to replace the live
			// editor buffer, so count the newest snapshot as pending
			// retention. Typed pushes ('mult'/'mrk') leave the editor
			// buffer live - it costs nothing wherever history shares it
			// (including entries recycled through undo/redo). Live
			// multitrack clip buffers cost nothing either way.
			var seen = [];
			var newest = undo_state_list[len - 1];
			var live = liveEditorBuffer ();
			var pending = newest && !newest.type && newest.data === live ?
				live : null;
			if (live && !pending) seen.push ( live );
			seedLiveMultitrackBuffers ( seen, pending );

			var total = 0;
			for (var i = len - 1; i >= 0; --i) {
				var add = stateBytes ( undo_state_list[i], seen );
				if (add > 0 && total + add > _max_bytes && (len - 1 - i) >= _min_keep) {
					undo_state_list.splice ( 0, i + 1 );
					return ;
				}
				total += add;
			}
		}

		function currentStateFor ( state ) {
			var current = {
				data: app.engine.wavesurfer.backend.buffer
			};
			if (state.type === 'mult' && app.multitrack)
				current.mt = app.multitrack.getState ();
			if (state.type === 'mrk' && app.mrk)
				current.markers = app.mrk.ser (state.ctx);
			return current;
		}

		function updateStateData ( state, current ) {
			state.data = current.data;
			if (current.mt) state.mt = current.mt;
			if (current.markers) state.markers = current.markers;
		}

		q.getLastUndoState = function () {
			return (undo_state_list [ undo_state_list.length - 1]);
		};

		q.pushUndoState = function ( state ) {
			if (!state) return (false);

			if (!state.id) state.id = ++_id;
			if (undo_state_list.length >= _depth) undo_state_list.shift ();

			if (undo_state_list.length > 0)
			{
				if (undo_state_list[undo_state_list.length - 1].id !== state.id - 1)
					undo_state_list = [];
			}
			if (redo_state_list.length > 0)
			{
				if (redo_state_list[0].id !== state.id + 1)
					redo_state_list = [];
			}

			undo_state_list.push ( state );
			trimForMemory ();

			_fireEvent ( 'StatePush', undo_state_list.length );
			_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);

			return (true);
		};

		q.popUndoState = function () {
			var last_state =undo_state_list.pop ();

			if (last_state) {
				var current = currentStateFor ( last_state );

				_fireEvent ( 'StateDidPop', last_state, 1 );

				// a listener that could not apply the snapshot flags it -
				// put the entry back untouched so history is not corrupted
				if (last_state._restore_failed) {
					delete last_state._restore_failed;
					undo_state_list.push ( last_state );
					_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
					return ( null );
				}

				if (redo_state_list.length > 0)
				{
					if (redo_state_list[0].id !== last_state.id + 1)
						redo_state_list = [];
				}

				updateStateData ( last_state, current );
				redo_state_list.unshift (last_state);

				_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
			}

			return (last_state);
		};
		
		q.shiftRedoState = function () {
			var last_state = redo_state_list.shift ();

			if (last_state) {
				var current = currentStateFor ( last_state );

				_fireEvent ( 'StateDidPop', last_state, 0 );

				// see popUndoState - a failed restore must be a no-op
				if (last_state._restore_failed) {
					delete last_state._restore_failed;
					redo_state_list.unshift ( last_state );
					_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
					return ( null );
				}

				if (undo_state_list.length > 0)
				{
					if (undo_state_list[undo_state_list.length - 1].id !== last_state.id - 1)
						undo_state_list = [];
				}

				updateStateData ( last_state, current );
				undo_state_list.push (last_state);

				_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
			}

			return (last_state);
		};
		
		q.clearAllState = function () {
			undo_state_list = [];
			redo_state_list = [];

			_fireEvent ( 'StateClearAll' );
			_fireEvent ( 'DidStateChange', [], []);
		};

		_listenFor ('StateRequestPush', function ( _state ) {
			q.pushUndoState ( _state );
		});
		_listenFor ('StateRequestUndo', function () {
			q.popUndoState ();
		});
		_listenFor ('StateRequestRedo', function () {
			q.shiftRedoState ();
		});
		_listenFor ('StateRequestClearAll', function () {
			q.clearAllState ();
		});
		_listenFor ('StateRequestLastState', function () {
			_fireEvent ('StateDidLastState', q.getLastUndoState ());
		});
		// -
	};
	
	PKAE._deps.state = PKState;
	
})( PKAudioEditor );
