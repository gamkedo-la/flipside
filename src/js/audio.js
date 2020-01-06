//Set up WebAudioAPI nodes----------------------------------------------------
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var musicBus = audioCtx.createGain();
var soundEffectsBus = audioCtx.createGain();
var filterBus = audioCtx.createBiquadFilter();
var masterBus = audioCtx.createGain();

musicBus.connect(filterBus);
soundEffectsBus.connect(filterBus);
filterBus.connect(masterBus);
masterBus.connect(audioCtx.destination);

//Variables-------------------------------------------------------------------


//volume handling-------------------------------------------------------------
var isMuted = false;
const VOLUME_INCREMENT = 0.05;

var musicVolume;
var soundEffectsVolume;
try {
	musicVolume = localStorage.getItem("musicVolume");
	soundEffectsVolume = localStorage.getItem("soundEffectsVolume");
}
catch {
	// default volumes
	musicVolume = 0.7;
	soundEffectsVolume = 0.7;
}
if (musicVolume === null){
	musicVolume = 0.7;
}
if (soundEffectsVolume === null){
	soundEffectsVolume = 0.7;
}

musicBus.gain.value = musicVolume;
soundEffectsBus.gain.value = soundEffectsVolume;

function toggleMute() {
	isMuted = !isMuted;
	masterBus.gain.linearRampToValueAtTime(!isMuted, audioCtx.currentTime + 0.03);
}

function setMute(onOff) {
	isMuted = onOff;
	masterBus.gain.linearRampToValueAtTime(onOff, audioCtx.currentTime + 0.03);
}

function setMusicVolume(amount) {
	musicVolume = amount;
	if (musicVolume > 1.0) {
		musicVolume = 1.0;
	} else if (musicVolume < 0.0) {
		musicVolume = 0.0;
	}
	musicBus.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.03);
}

function setSoundEffectsVolume(amount) {
	soundEffectsVolume = amount;
	if (soundEffectsVolume > 1.0) {
		soundEffectsVolume = 1.0;
	} else if (soundEffectsVolume < 0.0) {
		soundEffectsVolume = 0.0;
	}
	soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.03);
}

function setVolumeRelative(amount) {
	setMusicVolume(musicVolume + amount);
	setSoundEffectsVolume(soundEffectsVolume + amount);
}

function turnVolumeUp() {
	setVolumeRelative(VOLUME_INCREMENT);
}

function turnVolumeDown() {
	setVolumeRelative(-VOLUME_INCREMENT);
}

//Audio playback classes------------------------------------------------------
function playSound(buffer, rate = 1, pan = 0, vol = 1, loop = false) {
	var source = audioCtx.createBufferSource();
	var gainNode = audioCtx.createGain();
	var panNode = audioCtx.createStereoPanner();

	source.connect(panNode);
	panNode.connect(gainNode);
	gainNode.connect(soundEffectsBus);

	source.buffer = buffer;

	source.playbackRate.value = rate;
	source.loop = loop;
	gainNode.gain.value = vol;
	panNode.pan.value = pan;
	source.start();

	return {volume: gainNode, pan: panNode, sound: source};
}

//Helper functions------------------------------------------------------------
function getRandomValue(min = 0.8, max =  1){
	let randomValue = Math.random() * (max - min) + min;
	return randomValue.toFixed(3);
}