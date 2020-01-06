
//declare sounds here---------------------------------------------------------

//----------------------------------------------------------------------------

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

function setSoundEffectsVolume(amount) {
	soundEffectsVolume = amount;
	if (soundEffectsVolume > 1.0) {
		soundEffectsVolume = 1.0;
	} else if (soundEffectsVolume < 0.0) {
		soundEffectsVolume = 0.0;
	}
	soundEffectsBus.gain.linearRampToValueAtTime(soundEffectsVolume, audioCtx.currentTime + 0.1);
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
function SoundClass(filenameWithPath) {
	var audioBuffer;
	loadSample(filenameWithPath, function(buffer){audioBuffer = buffer;});
	var player;
	var gainNode = audioCtx.createGain();
	var pannerNode = audioCtx.createStereoPanner();

	gainNode.connect(pannerNode);
	pannerNode.connect(soundEffectsBus);
	
	this.play = function(panning = 0) {
		pan = panning;
		if (pan > 1.0) {
			pan = 1.0;
		} else if (pan < -1) {
			pan = -1;
		}
		pannerNode.pan.value = pan;

		player = audioCtx.createBufferSource();
        player.buffer = audioBuffer;
        player.start();
        player.loop = false;
        player.connect(pannerNode);
	}

	this.stop = function() {
		if (player != null;) {
			player.stop();
		}
	}

	this.setMixVolume = function(volume) {
		var mixVolume = volume;
		if (mixVolume > 1.0) {
			mixVolume = 1.0;
		} else if (mixVolume < 0.0) {
			mixVolume = 0.0;
		}
		gainNode.gain.value = mixVolume;
	}
}

//Helper functions------------------------------------------------------------
function LoadAudioFile(url, callback){
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function(){
        var audioData = request.response;
        audioCtx.decodeAudioData(audioData, function(buffer) {
            console.log(buffer);
            callback(buffer);
        });
    };
    request.send();
}