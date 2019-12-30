const AssetLoader = function AssetLoader(){
    this.images = {};
    this.tileMaps = {};
    this.sounds = {};
    return this;
}
AssetLoader.prototype.loadImages = function loadImages(names, callback) {

    var n,name,
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
    var self = this;
    tileMapList.forEach(function(file){
        self.loadFile(`src/maps/${file}.json`, function(response){
            self.tileMaps[file] = JSON.parse(response);
            return done();
        })
        
    })
}

export default AssetLoader