(function ( win, doc, PKAE ) {
	'use strict';

	var activeMenu = [],
		namespace = win,
		contextStorage = {},
		_id = 0;

	var closeEvent = [ 'mousedown', 'touchup' ];

		/**
		*	Goes through every single context instance and terminates
		*	it.
		**/
	var closeContext = function ( e, force ) {
			if (!e) return ;
			if (activeMenu.length === 0) return ;

			var el = e.target || e.srcElement;

			if (!el || el.className.indexOf('_action') === -1 || force)
			{
				var l = activeMenu.length;
				while (l--) terminate (activeMenu[ l ]);
				activeMenu = [];
			}
		},
		/**
		*	Go through every children element of the context el, 
		*	and remove all listeners and added attributes, then remove it
		*	from the dom also
		**/
		terminate = function( e ) {
			var children = e.currentMenu.getElementsByTagName('*'),
			len = children.length;

			while( len-- )
				children[ len ].parentNode.removeChild( children[ len ] );

			e.currentMenu.removeEventListener( closeEvent, stopPropagation );
			doc.body.removeChild( e.currentMenu );
			e.currentMenu = null;
			return false;
		},
		/** stop propagation func, so that we don't have to use anonymous funcs **/
		stopPropagation	=	function(e){ e.stopPropagation(); },
		openContext = function( e, x, y ) {

			closeContext(null);
			activeMenu.push( e );
			
			//go through all the options and make the div
			var div = doc.createElement('div'),
			a,
			marginOffset = 4,
			opts = e.options,
			leftOffset = x - marginOffset,
			topOffset = y - marginOffset,
			width = 0, height = 0;

			div.className = "pk_contextMenu " + e.menuClass;
			div.id = e.token;

			for( var i = 0, len = opts.length; i < len; ++i ) {
				if( opts[ i ].isHTML )
				{
					a = doc.createElement('div');
					a.innerHTML = opts[ i ].isHTML;
					div.appendChild( a );
				}
				else {
					a = doc.createElement('a');
					a.className = 'pk_ctx_action';
					a.cnt = 1;
					a.innerHTML = opts[ i ].name;
					a.callback = opts[ i ].callback;

					a.addEventListener( 'click', a.callback, false );
					
					div.appendChild( a );
				}
			}

			e.currentMenu = div;
			div.addEventListener( closeEvent, stopPropagation, false );

			doc.body.appendChild( div );

			width = div.offsetWidth;
			height = div.offsetHeight;

			if( win.innerWidth < ( leftOffset + width ) && win.innerHeight < ( topOffset + height ) )
				div.style.cssText = "top:" + ( topOffset - height ) + "px;left:" + ( leftOffset - width ) + "px;";
			else if( win.innerWidth < ( leftOffset + width ) )
				div.style.cssText = "top:" + ( topOffset ) + "px;left:" + ( leftOffset - width ) + "px;";
			else if( win.innerHeight < ( topOffset + height ) )
				div.style.cssText = "top:" + ( topOffset - height ) + "px;left:" + ( leftOffset ) + "px;";
			else
				div.style.cssText = "top:" + ( topOffset ) + "px;left:" + ( leftOffset ) + "px;";

			if (e.onOpen) {
				e.onOpen ( e, div );
			}

      	return false;
	},
	openMenu = function( e )
	{
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		else {
			e = {pageX:0, pageY:0};
		}

		// ---- 
		var instance = getInstance ( this );
		var pageX = e.pageX || e.clientX + doc.documentElement.scrollLeft;
		var pageY = e.pageY || e.clientY + doc.documentElement.scrollTop;

		if (!instance) return false;

		instance.curr_target = e.target || e.srcElement;

		openContext ( instance, pageX, pageY );
	},
	getInstance = function( elem ) {
		return contextStorage[ elem.getAttribute( 'data-token' ) ];
	};

	/**
	*	Context Menu Constructor
	**/
	var contextMenu = namespace.contextMenu = function( elem, options ) {
		if (!(this instanceof contextMenu)) return new contextMenu( elem, options );
		if (!options) options = {};

		var open_events = ['contextmenu', 'longpress'];

		this.elem = elem;
		this.options = [];
		this.menuClass = options.className || 'pk_open';
		this.curr_target = null;

		// modified context menu to open only when double click + no movement
		// if (elem) elem.addEventListener( 'contextmenu', openMenu, false );
		if (elem) elem.addEventListener( 'pk_ctxmn', openMenu, false );

		this.token = ++_id;
		if (elem) elem.setAttribute( 'data-token', this.token );

		contextStorage[ this.token ] = this;
	};
	/**
	*	Wrapper to the private openMenu function
	**/
	contextMenu.prototype.open = function( e ) {
		openMenu.call( this.elem, e );
	};
	contextMenu.prototype.close = function( e ) {
		closeContext();
	};
	contextMenu.prototype.openWithToken = function( token, x, y ) {
		openContext( contextStorage[ token ], x||0, y||0 );
	};
	/**
	*	Closes context and removes it fully
	**/
	contextMenu.prototype.destroy = function() {
		// this.elem.removeEventListener( 'contextmenu', openMenu );
		this.elem.removeEventListener( 'pk_ctxmn', openMenu );

		closeContext();
		contextStorage[ this.token ] = null;

		return false;
	},
	/**
	*	Adds option
	*	@param	string	name of the option
	*	@param	function to run when its chosen
	*	@param	if this is set, then append the HTML instead of its name in its position
	*	@param	initialization code to run when the object is appended to the dom
	**/
	contextMenu.prototype.addOption = function( name, callback, isHTML ) {
		var q = this;
		this.options.push({ "name" : name, "callback" : function( e ) {

			callback && callback( q, q._open );
			closeContext( q, true );
		},
		"isHTML"	: isHTML
	});
	};


	// todo touch controls too? #### 
	doc.addEventListener( closeEvent[0], closeContext, false );
	doc.addEventListener( 'killCTX', closeContext, false );


	PKAE._deps.ContextMenu = contextMenu;

})( window, document, PKAudioEditor );