

//declare sounds----------------------------------

//------------------------------------------------

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicBus = audioCtx.createGain();
let soundEffectsBus = audioCtx.createGain();
let filterBus = audioCtx.createBiquadFilter();
let masterBus = audioCtx.createGain();

musicBus.connect(filterBus);
soundEffectsBus.connect(filterBus);
filterBus.connect(masterBus);
masterBus.connect(audioCtx.destination);



let isMuted = false;
const VOLUME_INCREMENT = 0.05;

let musicVolume;
let soundEffectsVolume;
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
	masterBus.gain.linearRampToValueAtTime(!isMuted, audioCtx.currentTime + 0.1);
}

function setMusicVolume(amount) {
	musicVolume = amount;
	if (musicVolume > 1.0) {
		musicVolume = 1.0;
	} else if (musicVolume < 0.0) {
		musicVolume = 0.0;
	}
	musicBus.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.1);
}

function setEffectsVolume(amount) {
	soundEffectsVolume = amount;
	if (soundEffectsVolume > 1.0) {
		soundEffectsVolume = 1.0;
	} else if (soundEffectsVolume < 0.0) {
		soundEffectsVolume = 0.0;
	}
	soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.1);
}

function turnVolumeUp() {
	setMusicVolume(musicVolume + VOLUME_INCREMENT);
	setEffectsVolume(soundEffectsVolume + VOLUME_INCREMENT);
}

function turnVolumeDown() {
	setMusicVolume(musicVolume - VOLUME_INCREMENT);
	setEffectsVolume(soundEffectsVolume - VOLUME_INCREMENT);
}

