# AudioMass

> A full-featured audio editor in 83kb of vanilla JavaScript

AudioMass lets you record, or use your existing audio tracks, and modify them by trimming, cutting, pasting or applying a plethora of effects, from compression and paragraphic equalizers to reverb, delay and distortion fx. AudioMass also supports more than 20 hotkeys combinations and a dynamic responsive interface to ensure ease of use and that your producivity remains high. it is written solely in plain old-school javascript, weights approximately 83kb and has no backend or framework dependencies.

## Feature List

Loading Audio, navigating the waveform, zoom and pan
Visualization of frequency levels
Peak and distortion signaling
Cutting/Pasting/Trimming parts of the audio
Inverting and Reversing Audio
Exporting to mp3
Modifying volume levels
Fade In/Out
Compressor
Normalization
Reverb
Delay
Distortion
Pitch Shift
Keeps track of states so you can undo mistakes
Offline support!

## Getting Started

To get started, drag and drop an audio file, or try the included sample.

Once the file is loaded and you can view the waveform, zoom in, pan around, or select a region.

[Selecting portion of the waveform](https://audiomass.co/about/audiomass_2.jpg)

### Recording Audio

To record audio, simply press the Recording button, or the `R` key.
[Recording audio](https://audiomass.co/about/audiomass_3.jpg)

### Exporting to mp3

In order to export back to mp3, click on 'File', then 'Export to mp3', and follow the modal's instructions.

[mp3 export modal](https://audiomass.co/about/audiomass_4.jpg)


## Future work and performance considerations

The next big feature that is planned, is multitrack support. The ability to mix tracks and different sounds is currently lacking and its usefulness as it stands is limited.

There is also a lot of room for improvement in almost all aspects.

First of all we can further reduce the filesize by around 20kb by removing the library we are using for rendering the waveform. We use only a fraction of its functionality so there is no reason to include it all.

We can also optimize a lot the rendering of the waveform. I heavily modified the library used to compute and draw only the visible range. However it is still clearing and re-drawing all of the canvas at each frame. We can take advantage of 2d Context's translate calls, and shift the canvas around instead of redrawing all of the pixels.

We can also move some operations to a background thread, such as the filters processing so that the UI does not freeze when applying a long chain of effects.

However, the biggest issue I encountered, is the Web Audio API itself. Every operation results in iterating over multiple long arrays per frame. Eventually the garbage collector fires and crackling is introduced. Only way to go around this is to use a small fftSize, but then the frequency range we have to work with is very narrow. Perhaps a pure WASM implementation would outperform trying to modify audio signals with JS. Only one way to find out I guess :)

Additionally, decodeAudioData provides no progress callback, and no way of cancelling it. So if you attempt to load a huge audio file, you will waste resources until it gets processed. There is no way around this currently and it can get annoying if you push a big file by mistake.
