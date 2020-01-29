//Constants-------------------------------------------------------------------
const FILTER_MIN = 400;
const FILTER_MAX = 20000;
const FILTER_TRANSITION_TIME = 1;
const FILTER_Q_CURVE = [0, 1, 0, 1, 0];
const VOLUME_INCREMENT = 0.1;
const CROSSFADE_TIME = 0.25;

const AudioGlobal = function AudioGlobal() {

    var initialized = false;
    var audioCtx, musicBus, soundEffectsBus, filterBus, masterBus;
    var isMuted;
    var musicVolume;
    var soundEffectsVolume;
    var currentMusicTrack;

//--//Set up WebAudioAPI nodes------------------------------------------------
    this.init = function() {
		if (initialized) return;

        console.log("Initializing Audio...");
        // note: this causes a browser error if user has not interacted w page yet    
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.context = audioCtx;
        musicBus = audioCtx.createGain();
        soundEffectsBus = audioCtx.createGain();
        filterBus = audioCtx.createBiquadFilter();
        masterBus = audioCtx.createGain();

        musicVolume = 0.7;
        soundEffectsVolume = 0.7;
        // try {
        // 	musicVolume = localStorage.getItem("musicVolume");
        // 	soundEffectsVolume = localStorage.getItem("soundEffectsVolume");
        // }
        // catch {
        //	
        // }

        filterBus.frequency.value = FILTER_MAX;

        musicBus.gain.value = musicVolume;
        soundEffectsBus.gain.value = soundEffectsVolume;
        filterBus.type = "lowpass";
        musicBus.connect(filterBus);
        soundEffectsBus.connect(filterBus);
        filterBus.connect(masterBus);
        masterBus.connect(audioCtx.destination);

	    initialized = true;
    }

//--//volume handling functions-----------------------------------------------
	this.toggleMute = function() {
        if (!initialized) return;

		var newVol = (masterBus.gain.value === 0 ? 1 : 0);
		masterBus.gain.linearRampToValueAtTime(newVol, audioCtx.currentTime + 0.03);
	}

	this.setMute = function(tOrF) {
        if (!initialized) return;

		var newVol = (tOrF === false ? 1 : 0);
		masterBus.gain.linearRampToValueAtTime(newVol, audioCtx.currentTime + 0.03);
	}

	this.setMusicVolume = function(amount) {
        if (!initialized) return;

		musicVolume = amount;
		if (musicVolume > 1.0) {
			musicVolume = 1.0;
		} else if (musicVolume < 0.0) {
			musicVolume = 0.0;
		}
		musicBus.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.03);
	}

	this.setSoundEffectsVolume = function(amount) {
        if (!initialized) return;

		soundEffectsVolume = amount;
		if (soundEffectsVolume > 1.0) {
			soundEffectsVolume = 1.0;
		} else if (soundEffectsVolume < 0.0) {
			soundEffectsVolume = 0.0;
		}
		soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.03);
	}

	this.turnVolumeUp = function() {
        if (!initialized) return;

		this.setMusicVolume(musicVolume + VOLUME_INCREMENT);
		this.setSoundEffectsVolume(soundEffectsVolume + VOLUME_INCREMENT);
	}

	this.turnVolumeDown = function() {
        if (!initialized) return;

		this.setMusicVolume(musicVolume - VOLUME_INCREMENT);
		this.setSoundEffectsVolume(soundEffectsVolume - VOLUME_INCREMENT);
	}

//--//Audio playback classes--------------------------------------------------
	this.playSound = function(buffer, pan = 0, vol = 1, rate = 1, loop = false) {
        if (!initialized) return;

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

	this.playMusic = function(buffer, fadeIn = false) {
        if (!initialized) return;

		var source = audioCtx.createBufferSource();
		var gainNode = audioCtx.createGain();

		source.connect(gainNode);
		gainNode.connect(musicBus);

		source.buffer = buffer;

		source.loop = true;

		if (currentMusicTrack != null) {
			currentMusicTrack.volume.gain.linearRampToValueAtTime(0, audioCtx.currentTime + CROSSFADE_TIME);
			currentMusicTrack.sound.stop(audioCtx.currentTime + CROSSFADE_TIME);
		}

		if (fadeIn) {
			gainNode.gain.value = 0;
			gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + CROSSFADE_TIME);
		}

		source.start();
		currentMusicTrack = {sound: source, volume: gainNode};

		return {sound: source, volume: gainNode};
	}

//--//Gameplay functions------------------------------------------------------
	this.enterFlipside = function() {
        if (!initialized) return;

		filterBus.frequency.cancelScheduledValues(audioCtx.currentTime);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MAX/2, audioCtx.currentTime + 0.01);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + FILTER_TRANSITION_TIME/2);
	}

	this.exitFlipside = function() {
        if (!initialized) return;

		filterBus.frequency.cancelScheduledValues(audioCtx.currentTime);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MIN, audioCtx.currentTime + 0.01);
		filterBus.frequency.linearRampToValueAtTime(FILTER_MAX, audioCtx.currentTime + FILTER_TRANSITION_TIME*2);
	}

    // this.init(); // FIXME: defer until after a user interation!

    return this;
}

export default AudioGlobal