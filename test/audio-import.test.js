'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadScript(file, globals) {
	const script = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
	vm.runInNewContext(script, globals, { filename: file });
}

function makePicker(navigator) {
	const listeners = new Map();
	const loaded = [];
	const app = {
		id: 1,
		_deps: { audioutils: function () {} },
		ui: { MainHeight: () => 300, KeyHandler: { addCallback() {}, addSingleCallback() {} } },
		el: {
			getElementsByClassName: () => [],
			appendChild: function (child) { child.parentNode = this; },
			removeChild: function () {}
		},
		listenFor: (name, cb) => listeners.set(name, cb),
		fireEvent: () => {}
	};
	const wavesurfer = {
		backend: {},
		container: { addEventListener: () => {} },
		drawer: { wrapper: { addEventListener: () => {} } },
		on: () => {},
		pause: () => {},
		loadBlob: (file) => loaded.push(file)
	};
	let input;
	const document = {
		body: { addEventListener: () => {} },
		addEventListener: () => {},
		createElement: () => {
			input = {
				attributes: {},
				setAttribute: function (name, value) { this.attributes[name] = value; },
				click: function () {}
			};
			return input;
		}
	};
	loadScript('engine.js', {
		window: { addEventListener: () => {}, navigator },
		document,
		WaveSurfer: { create: () => wavesurfer, regions: { create: () => ({}) } },
		PKAudioEditor: app,
		setTimeout: () => {}
	});
	new app._deps.engine(app);
	return {
		open: () => {
			listeners.get('RequestLoadLocalFile')();
			return input;
		},
		loaded
	};
}

for (const [name, navigator] of [
	['iPhone', { userAgent: 'Mozilla/5.0 (iPhone)', platform: 'iPhone', maxTouchPoints: 5 }],
	['desktop-mode iPad', { userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }]
]) {
	test(name + ' enables common audio extensions in the file picker without the wildcard', () => {
		const picker = makePicker(navigator);
		for (const filename of ['clip.WAV', 'recording.mp3', 'example.m4a']) {
			const input = picker.open();
			const hints = input.attributes.accept.split(',');
			for (const type of ['.wav', '.mp3', '.m4a', '.amss']) assert.ok(hints.includes(type), type);
			for (const type of ['audio/*', '.mp4', '.mov']) assert.ok(!hints.includes(type), type);
			input.files = [{ name: filename, type: '' }];
			input.onchange();
		}
		assert.deepEqual(picker.loaded.map((file) => file.name), ['clip.WAV', 'recording.mp3', 'example.m4a']);
	});
}

test('the desktop picker retains the audio wildcard and accepts an audio MIME type without a known extension', () => {
	const picker = makePicker({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 });
	const input = picker.open();
	assert.ok(input.attributes.accept.split(',').includes('audio/*'));
	const audio = { name: 'recording', type: 'audio/aac' };
	input.files = [audio];
	input.onchange();
	assert.deepEqual(picker.loaded, [audio]);
});

test('a touch-capable browser can drop an audio file through the native drag handlers', () => {
	const listeners = new Map();
	const reader = function () {
		this.readAsArrayBuffer = function (file) {
			this.onloadend({ target: { result: file.buffer } });
		};
	};
	const window = { FileReader: reader, ontouchstart: null };
	loadScript('drag.js', { window, document: { addEventListener: () => {} }, FileReader: reader });
	const body = {
		parentNode: { addEventListener: () => {} },
		addEventListener: (name, cb) => listeners.set(name, cb)
	};
	const file = { name: 'recording.wav', buffer: new ArrayBuffer(4) };
	const received = [];
	window.dragNDrop(body, body, (buffer, name) => received.push({ buffer, name }), 'arrayBuffer');
	assert.ok(listeners.has('drop'), 'touch capability must not disable native file drops');
	let prevented = false;
	listeners.get('drop')({
		dataTransfer: { files: [file] },
		preventDefault: () => { prevented = true; },
		stopPropagation: () => {}
	});
	assert.equal(prevented, true);
	assert.deepEqual(received, [{ buffer: file.buffer, name: file.name }]);
});
