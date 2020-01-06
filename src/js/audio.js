//Constants-------------------------------------------------------------------
const FILTER_MIN = 500;
const FILTER_MAX = 20000;
const FILTER_TRANSITION_TIME = 1;
const FILTER_Q_CURVE = [0, 1, 0, 1, 0];
const VOLUME_INCREMENT = 0.05;

const AudioGlobal = function AudioGlobal() {
//--//Set up WebAudioAPI nodes------------------------------------------------
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	this.context = audioCtx;
	var musicBus = audioCtx.createGain();
	var soundEffectsBus = audioCtx.createGain();
	var filterBus = audioCtx.createBiquadFilter();
	var masterBus = audioCtx.createGain();


	var isMuted = false;

	var musicVolume = 0.7;
	var soundEffectsVolume = 0.7;
	// try {
	// 	musicVolume = localStorage.getItem("musicVolume");
	// 	soundEffectsVolume = localStorage.getItem("soundEffectsVolume");
	// }
	// catch {
	//	
	// }

	musicBus.gain.value = musicVolume;
	soundEffectsBus.gain.value = soundEffectsVolume;

	filterBus.type = "lowpass";

	musicBus.connect(filterBus);
	soundEffectsBus.connect(filterBus);
	filterBus.connect(masterBus);
	masterBus.connect(audioCtx.destination);
	
//--//volume handling functions---------------------------------------------------
	this.toggleMute = function() {
		isMuted = !isMuted;
		masterBus.gain.linearRampToValueAtTime(!isMuted, audioCtx.currentTime + 0.03);
	}

	this.setMute = function(onOff) {
		isMuted = onOff;
		masterBus.gain.linearRampToValueAtTime(onOff, audioCtx.currentTime + 0.03);
	}

	this.setMusicVolume = function(amount) {
		musicVolume = amount;
		if (musicVolume > 1.0) {
			musicVolume = 1.0;
		} else if (musicVolume < 0.0) {
			musicVolume = 0.0;
		}
		musicBus.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.03);
	}

	this.setSoundEffectsVolume = function(amount) {
		soundEffectsVolume = amount;
		if (soundEffectsVolume > 1.0) {
			soundEffectsVolume = 1.0;
		} else if (soundEffectsVolume < 0.0) {
			soundEffectsVolume = 0.0;
		}
		soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.03);
	}

	this.turnVolumeUp = function() {
		this.setMusicVolume(musicVolume + VOLUME_INCREMENT);
		this.setSoundEffectsVolume(soundEffectsVolume + VOLUME_INCREMENT);
	}

	this.turnVolumeDown = function() {
		this.setMusicVolume(musicVolume - VOLUME_INCREMENT);
		this.setSoundEffectsVolume(soundEffectsVolume - VOLUME_INCREMENT);
	}

//--//Audio playback classes------------------------------------------------------
	this.playSound = function(buffer, pan = 0, vol = 1, rate = 1, loop = false) {
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

		return {sound: source, volume: gainNode, pan: panNode};
	}

//--//Gameplay functions----------------------------------------------------------
	this.enterFlipside = function() {
		filterBus.frequency.linearRampToValueAtTime(FILTER_MAX, audioCtx.currentTime + 0.01);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + FILTER_TRANSITION_TIME);
		filterBus.Q.setValueCurveAtTime(FILTER_Q_CURVE, audioCtx.currentTime, FILTER_TRANSITION_TIME);
	}

	this.exitFlipside = function() {
		filterBus.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + 0.01);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MAX, audioCtx.currentTime + FILTER_TRANSITION_TIME);
		filterBus.Q.setValueCurveAtTime(FILTER_Q_CURVE, audioCtx.currentTime, FILTER_TRANSITION_TIME);
	}

	return this;
}

export default AudioGlobal