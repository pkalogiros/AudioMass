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

		q.init = function ( el_id ) {
			var el = d.getElementById( el_id );
			if (!el) {
				console.log ('invalid element');
				return ;
			}
			q.el = el;

			// init libraries
			q.ui     = new q._deps.ui ( q ); q._deps.uifx ( q );
			q.engine = new q._deps.engine ( q );
			q.state  = new q._deps.state ( 4, q );
			q.rec    = new q._deps.rec ( q );
			q.fls    = new q._deps.fls ( q );

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

// --- AudioMass: Load audio file from ?file= parameter ---
window.addEventListener('load', async () => {
  const params = new URLSearchParams(window.location.search);
  const fileUrl = params.get('file');
  if (fileUrl) {
    try {
      console.log("Loading audio file from URL:", fileUrl);
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file: " + response.status);
      const blob = await response.blob();

      const fileName = fileUrl.split('/').pop() || 'audio.mp3';
      const fileType = blob.type || 'audio/mpeg';
      const file = new File([blob], fileName, { type: fileType });

      // ניצור אובייקט שמדמה input element עם files[0]
      const fakeInput = { files: [file] };

      if (window.PKAudioEditor && window.PKAudioEditor.engine && window.PKAudioEditor.engine.LoadFile) {
        window.PKAudioEditor.engine.LoadFile(fakeInput);
      } else {
        console.error("LoadFile function not found on PKAudioEditor.engine");
      }
    } catch (err) {
      console.error("Error loading file from URL:", err);
      alert("לא ניתן לטעון את הקובץ מהכתובת שסופקה.\nבדוק את הקונסול לפרטים נוספים.");
    }
  }
});

// --- AudioMass: Playback speed controls ---
window.addEventListener('load', () => {
  const buttons = document.querySelectorAll('.speed-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      if (window.PKAudioEditor && window.PKAudioEditor.engine && window.PKAudioEditor.engine.wavesurfer) {
        const ws = window.PKAudioEditor.engine.wavesurfer;
        ws.setPlaybackRate(speed);
        console.log("Playback speed set to", speed + "x");

        // סימון ויזואלי של הכפתור שנבחר
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        alert("הנגן עדיין לא מוכן, נסה שוב אחרי טעינת קובץ.");
      }
    });
  });
});





