//Constants-------------------------------------------------------------------
const FILTER_MIN = 500;
const FILTER_MAX = 20000;
const FILTER_TRANSITION_TIME = 1;
const FILTER_Q_CURVE = [0, 1, 0, 1, 0];

const AudioGlobal = function AudioGlobal() {
	//Set up WebAudioAPI nodes------------------------------------------------
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var musicBus = audioCtx.createGain();
	var soundEffectsBus = audioCtx.createGain();
	var filterBus = audioCtx.createBiquadFilter();
	var masterBus = audioCtx.createGain();

	musicBus.connect(filterBus);
	soundEffectsBus.connect(filterBus);
	filterBus.connect(masterBus);
	masterBus.connect(audioCtx.destination);


	//volume handling functions-----------------------------------------------
	var isMuted = false;
	const VOLUME_INCREMENT = 0.05;

	var musicVolume;
	var soundEffectsVolume;
	try {
		musicVolume = localStorage.getItem("musicVolume");
		soundEffectsVolume = localStorage.getItem("soundEffectsVolume");
	}
	catch {
		//default volumes
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
}

//volume handling functions---------------------------------------------------
Audio.prototype.toggleMute = function toggleMute() {
	isMuted = !isMuted;
	masterBus.gain.linearRampToValueAtTime(!isMuted, audioCtx.currentTime + 0.03);
}

Audio.prototype.setMute = function setMute(onOff) {
	isMuted = onOff;
	masterBus.gain.linearRampToValueAtTime(onOff, audioCtx.currentTime + 0.03);
}

Audio.prototype.setMusicVolume = function setMusicVolume(amount) {
	musicVolume = amount;
	if (musicVolume > 1.0) {
		musicVolume = 1.0;
	} else if (musicVolume < 0.0) {
		musicVolume = 0.0;
	}
	musicBus.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.03);
}

Audio.prototype.setSoundEffectsVolume = function setSoundEffectsVolume(amount) {
	soundEffectsVolume = amount;
	if (soundEffectsVolume > 1.0) {
		soundEffectsVolume = 1.0;
	} else if (soundEffectsVolume < 0.0) {
		soundEffectsVolume = 0.0;
	}
	soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.03);
}

Audio.prototype.turnVolumeUp = function turnVolumeUp() {
	setMusicVolume(musicVolume + VOLUME_INCREMENT);
	setSoundEffectsVolume(soundEffectsVolume + VOLUME_INCREMENT);
}

Audio.prototype.turnVolumeDown = function turnVolumeDown() {
	setMusicVolume(musicVolume - VOLUME_INCREMENT);
	setSoundEffectsVolume(soundEffectsVolume - VOLUME_INCREMENT);
}

//Audio playback classes------------------------------------------------------
Audio.prototype.playSound = function playSound(buffer, pan = 0, vol = 1, rate = 1, loop = false) {
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

//Gameplay functions----------------------------------------------------------
Audio.prototype.enterFlipside = function enterFlipside() {
	filterBus.BiquadFilterNode.frequency.linearRampToValueAtTime(FILTER_MAX, audioCtx.currentTime + 0.01);
	filterBus.BiquadFilterNode.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + FILTER_TRANSITION_TIME);
	filterBus.BiquadFilterNode.q.setValueCurveAtTime(FILTER_Q_CURVE, audioCtx.currentTime, FILTER_TRANSITION_TIME);
}

Audio.prototype.exitFlipside = function exitFlipside() {
	filterBus.BiquadFilterNode.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + 0.01);
	filterBus.BiquadFilterNode.frequency.linearRampToValueAtTime(FILTER_MAX, audioCtx.currentTime + FILTER_TRANSITION_TIME);
	filterBus.BiquadFilterNode.q.setValueCurveAtTime(FILTER_Q_CURVE, audioCtx.currentTime, FILTER_TRANSITION_TIME);
}


export default AudioGlobal