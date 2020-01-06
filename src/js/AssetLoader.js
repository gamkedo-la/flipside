const AssetLoader = function AssetLoader(){
    this.images = {};
    this.tileMaps = {};
    this.sounds = {};
    return this;
}
AssetLoader.prototype.loadImages = function loadImages(names, callback) {

    var n,
        name,
        result = {},
        count  = names.length,
        onload = function() {
            if(--count == 0){
                this.images = result;
                callback(result);
            };
        }
    
    for(n = 0 ; n < names.length ; n++) {
        name = names[n];
        result[name] = document.createElement('img');
        result[name].addEventListener('load', onload);
        result[name].src = "src/img/" + name + ".png";
    }
    
}

AssetLoader.prototype.loadFile = function loadFile(filePath, done){
    let xhr = new XMLHttpRequest();
    xhr.onload = function () { return done(this.responseText) }
    xhr.open("GET", filePath, true);
    xhr.send();
}

AssetLoader.prototype.loadMapData = function loadMapData(tileMapList, done){
        var n,
        name,
        result = {},
        self = this,
        count  = tileMapList.length,
        onload = function() {
            if(--count == 0){
                self.tileMaps = result;
                done(result);
            };
        }
    tileMapList.forEach(function(file){
        self.loadFile(`src/maps/${file}.json`, function(response){
            result[file] = JSON.parse(response);
            return onload();
        })
        
    })
}

AssetLoader.prototype.soundLoader = function ({context, urlList, callback} = {}) {
    this.context = context;
    this.urlList = urlList;
    this.onSoundsLoaded = callback;
    
    this.loadCount = 0;
  }
  
  AssetLoader.prototype.loadBuffer = function(url, key) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
  
    var loader = this;
  
    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('error decoding file data: ' + url);
            return;
          }
          loader.sounds[key] = buffer;
          if (++loader.loadCount == loader.urlList.length)
            loader.onSoundsLoaded(loader.sounds);
        },
        function(error) {
          console.error('decodeAudioData error', error);
        }
      );
    }
  
    request.onerror = function() {
      alert('SoundLoader: XHR error');
    }
  
    request.send();
  }
    AssetLoader.prototype.loadAudioBuffer = function() {
    for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i].url, this.urlList[i].name);
  }
  

export default AssetLoader