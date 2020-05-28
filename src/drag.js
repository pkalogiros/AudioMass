(function( parent ) {
	'use strict';

	/** parent object, set in the end of the selfcalling function **/
	var parent = parent || window,
		/** instance of File Reader **/
		reader,
		readFile,
		/**
		*	Removes class from element
		*	@param htmlObject	target element
		*	@param	string	"class to be removed"
		**/
		removeClass	= function( el, value ) {
			if ( !el.className ) return false;
			var classes = el.className.split(' '),
				ret = [];
			for( var i = 0, l = classes.length; i < l; ++i )
				if( classes[i] != value )
					ret.push( classes[ i ] );
			el.className = ret.join(' ');
		};
		
	if( !window.FileReader || !document.addEventListener ) {
		throw( "File API not supported" );
		readFile = function(){ throw( "File API not supported" ); };
	}
	else {
		reader = new FileReader();
		readFile = function ( file, callback, method ) {
			/** Error handler (throws error at the console) **/
			reader.onerror = function( e ) {
				var message,
					lut = [ "File not found.", "File coulnot be opened",  
						"File couldnot be uploaded", "Couldnot read File", "File too large" ];
				// http://www.w3.org/TR/FileAPI/#ErrorDescriptions
				throw( lut[ ( e.target.error.code - 1 ) ] );
			},
			/** Success, calling the callback **/
			reader.onloadend = function( e ) {
				callback && callback( e.target.result, file.name );
				reader.onloadend = null;
			};
			
			// the method is specified in the beginning of the file
			reader[ method ]( file );
			return false;
		};
	}
	
	/**
	*	Drag n Drop Files module
	*	@param	HTMLElement, could be the Body
	*	@param	DOMElement/String, if a string is specified then a div will be built and appended to the body
	*			with that String as its id. If a dom element is passed, that will be used instead. This object
	*			acts as an overlay and the file should be droped to this object. If this object is null, then the first argument
	*			will be used as the overlay.
	*	@param	Function,	will be called with the file data, and the filename as its arguments
	*	@param	String,	possible values "text, binarytext, arrabuffer" decides how the file will be read
	*			if let null, defaults to text
	*	@param	String,	class name to be added to the overlay (default is '__fadingIn')
	**/
	parent.dragNDrop = function( body, overlay_id, callback, method, _clss ) {
		var win = window;
		// check to see if we are using a mobile device - no need for dragNdrop in devices
		// that do not support it somehow yet
		if( ( 'ontouchstart' in window ) )
			return "mobile";
		
			/** JS Object, used to define the file-reading method **/
		var method_lut = {
				'text'		 :	'readAsText',
				'binary'	 :	'readAsBinaryText',
				'arrayBuffer':	'readAsArrayBuffer'
			},
			/** class added/removed from overlay object **/
			clss = _clss ? _clss : "__fadingIn",
			method = method ? method_lut[ method ] : 'readAsText',
			/** how many events cast (dragenter/dragleave) **/
			entered = 0,
			/** 
			* DOMElement sink for the drag events 
			* if left unspecified then the body inherits the role
			**/
			overlay = !!overlay_id ? overlay_id : body,
			/**
			*	(void) if the overlay_id specified is a string, then a div with that id is built
			*	and appended to the body. Else the default is used
			**/
			_overlayBuilder = function() {
				if( typeof overlay_id === "string" )
				{
					var tmp = document.createElement( 'div' );
					overlay = document.createElement( 'div' );
					overlay.id = overlay_id;
					
					tmp.innerHTML = "Drag n drop Files!";
					overlay.appendChild( tmp );

					body.appendChild( overlay );
					tmp = null;
				}
			},
			/**
			*	JS Object
			*	The events Object contains various functions that control 
			*	the behavior of the events fired
			**/
			events = {
				/**
				*	(void) Prevents default action and bubbling up
				**/
				silencer	:	function( e ) {
					e.preventDefault();
					e.stopPropagation()
				},
				
				/**
				*	Shows message to drop file
				**/
				onDragEnter	:	function( e ) {
					// overlay.className += " " + clss;
					++entered;
					
					setTimeout(function() {
						if( entered > 1 )
							entered = 1;
					}, 10 )
				},
				/**
				*	Hides the overlay... twist included!
				**/
				onDragLeave	:	function( e ) {
					--entered;
					
					if( entered <= 0 )
					{
						removeClass( overlay, clss );
						entered = 0;
					}
				},
				/**
				* Files dropped
				**/
				onDrop	:	function( e ) {
					// prevent the event from bubbling/firing default
					events.silencer( e );
					
					// Hide the overlay
					removeClass( overlay, clss );
					entered = 0;
					
					/** dropped files. **/
					var files = e.dataTransfer.files,
						len;
					
					// If anything is wrong with the dropped files, exit.
					if(	!files || !files.length )
						return false;
					
					len = files.length;
					while( len-- )
						// iterate files array and load them
						readFile( files[ len ], callback, method );
				}
			};
		
		(function init() {
			//_overlayBuilder();
			// events initialization
			body.parentNode.addEventListener( "dragenter", events.onDragEnter, false );
			body.addEventListener( "dragleave", events.onDragLeave, false );
			body.addEventListener( "dragover", events.silencer, false);
			body.addEventListener( "drop", events.onDrop, false);
			return false;
		})( body );
	};
})( window );