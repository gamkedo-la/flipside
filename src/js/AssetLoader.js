import G from "./G.js";

const AssetLoader = function AssetLoader(){
    this.images = {};
    this.brightImages = {};
    this.tileMaps = {};
    this.sounds = {};
    this.mapWorker = null;
    this.brightImgWorker = null;
    return this;
}
AssetLoader.prototype.loadImages = function loadImages(names, callback) {

    var n,
        name,
        result = {},
        count  = names.length,
        self = this,
        onload = function() {
            G.imagesLoaded++; // used by the loading Screen
            if(--count == 0){
                this.images = result;
                self.prepareBrightImages(result);
                callback();
            }
        }
    
    for(n = 0 ; n < names.length ; n++) {
        name = names[n];
        result[name] = document.createElement('img');
        result[name].addEventListener('load', onload);
        result[name].src = "src/img/" + name + ".png";
        //G.imagesLoaded++; // not yet! wait till it is fully loaded
    }
    
    return result;
}

AssetLoader.prototype.prepareBrightImages = function prepareBrightImages(inputImages) {
  if(this.brightImgWorker == null) {
    this.brightImgWorker = new Worker('src/js/imageBrightener.js');
  }

  const inputCanvas = document.createElement('canvas');
  const inputContext = inputCanvas.getContext('2d');

  const imageKeys = Object.keys(inputImages);
  for(let key of imageKeys) {
    if((key == "tiles") || ((key == "aap64"))) continue;
    const image = inputImages[key];
    inputCanvas.width = image.width;
    inputCanvas.height = image.height;
    inputContext.drawImage(image, 0, 0);
    const imageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    this.brightImgWorker.postMessage({key:key, imageData: imageData, size:{width:image.width, height:image.height}});
  }

  let self = this;
  this.brightImgWorker.onmessage = function(message) {
    const outputCanvas = document.createElement('canvas');
    const outputContext = outputCanvas.getContext('2d');
  
    self.brightImages[message.data.key] = document.createElement('img');
    outputCanvas.width = message.data.size.width;
    outputCanvas.height = message.data.size.height;
    outputContext.putImageData(message.data.data, 0, 0);
    self.brightImages[message.data.key].src = outputCanvas.toDataURL();
  }
}

AssetLoader.prototype.loadFile = function loadFile(filePath, done){
    let xhr = new XMLHttpRequest();
    xhr.onload = function () { 
      return done(this.responseText) 
    }
    xhr.open("GET", filePath, true);
    xhr.send();
}

/*AssetLoader.prototype.loadMapData = function loadMapData(tileMapList, done){
        var n,
        name,
        result = {},
        self = this,
        count  = tileMapList.length,
        onload = function() {
            if(--count == 0){
                self.tileMaps = result;
                done(result);
            }
        }
    tileMapList.forEach(function(file){
        self.loadFile(`src/maps/${file}.json`, function(response){
            result[file] = JSON.parse(response);
            return onload();
        })
    })
}*/

AssetLoader.prototype.mapIsLoaded = function mapIsLoaded(map) {
  const loadedMaps = Object.keys(this.tileMaps);
  for(let loadedMap of loadedMaps) {
    if(loadedMap == map) {
      return true;
    }
  }

  return false;
}

AssetLoader.prototype.loadInitialMapData = function loadInitialMapData(initialMap, done, spawnPoint = null) {
        var result = {};
        var self = this;
        var didLoad = false;
        onload = function() {
          if(didLoad) {//FIXME Don't know why onload gets called before self.loadFile returns
            self.tileMaps = result;
            done(result, spawnPoint);  
          }
        }

        self.loadFile(`src/maps/${initialMap}.json`, function(response){
          result[initialMap] = JSON.parse(response);
          didLoad = true;
          
          return onload();
      })
}

AssetLoader.prototype.loadConnectedMapData = function loadConnectedMapData(map, done) {
  if(this.mapWorker == null) {
    this.mapWorker = new Worker('src/js/mapLoader.js');
  }
  
  const self = this;

  this.mapWorker.postMessage({map:self.tileMaps, mapName:map});

  this.mapWorker.onmessage = function(message) {
    self.tileMaps = message.data;
  }
}

AssetLoader.prototype.soundLoader = function ({context, urlList, callback} = {}) {
    this.context = context;
    this.urlList = urlList;
    this.onSoundsLoaded = callback;
    
    this.loadCount = G.soundsLoaded;
  }
  
  AssetLoader.prototype.loadBuffer = function(url, key) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
  
    var loader = this;
  
    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      // FIXME: G.audio has to be initialized for this to run!
      // but it is very unlikely to be ready yet
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('error decoding file data: ' + url);
            return;
          }

          // clear screen
          ctx.fillStyle = 'rgba(0,0,0, 1.0)';
          ctx.fillRect(0,0,G.c.width,G.c.height);
          // NOTE: we cannot safely use G.gameFont for drawText here yet, since it may not be loaded!
          ctx.fillStyle = 'rgba(180,180,180, 1.0)';
          ctx.fillText("Images: "+G.imagesLoaded+"/"+G.imagesTotal,25,25);
          ctx.fillText("Audio: "+G.soundsLoaded+"/"+G.soundsTotal,25,35);

          loader.sounds[key] = buffer;
          ++G.soundsLoaded;
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