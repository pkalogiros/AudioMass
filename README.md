# AudioMass
Free full-featured web-based audio &amp; waveform editing tool


Live: [https://audiomass.co](https://audiomass.co)

---

## Getting it to Run!
1. please checkout this repo (or download it as zip)
2. navigate to it through your favorite CLI, then access the ```src``` dir
3. Run ```go run audiomass-server.go```  -  or if you do not have golang installed, you can use a simple python webserver by running ```python audiomass-server.py```
4. Navigate to [http://localhost:5055/](http://localhost:5055/) and have fun!

...



---

If you want to build the all.build.js minified file for delivery/publishing this then you can use uglify and run as:
```cat dist/wavesurfer.js dist/plugin/wavesurfer.regions.js oneup.js app.js keys.js contextmenu.js ui-fx.js ui.js modal.js state.js engine.js actions.js drag.js recorder.js welcome.js fx-pg-eq.js fx-auto.js local.js id3.js lzma.js | uglifyjs -c -m -o all.build.js```

Thanks!
