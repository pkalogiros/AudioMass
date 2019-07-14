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

			_fireEvent ( 'StatePush', undo_state_list.length );
			_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
			
			return (true);
		};

		q.popUndoState = function () {
			var last_state =undo_state_list.pop ();

			if (last_state) {	
				if (redo_state_list.length > 0)
				{
					if (redo_state_list[0].id !== last_state.id + 1)
						redo_state_list = [];
				}

				var temp = app.engine.wavesurfer.backend.buffer;
				_fireEvent ( 'StateDidPop', last_state, 1 );
				
				last_state.data = temp; 
				redo_state_list.unshift (last_state);

				_fireEvent ( 'DidStateChange', undo_state_list, redo_state_list);
			}

			return (last_state);
		};
		
		q.shiftRedoState = function () {
			var last_state = redo_state_list.shift ();
			
			if (last_state) {
				if (undo_state_list.length > 0)
				{
					if (undo_state_list[undo_state_list.length - 1].id !== last_state.id - 1)
						undo_state_list = [];
				}

				var temp = app.engine.wavesurfer.backend.buffer;
				_fireEvent ( 'StateDidPop', last_state, 0 );

				last_state.data = temp; 
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