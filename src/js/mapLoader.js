//Asynchronous Loading of MapData
let workerTileMaps = {};
let mapsToLoad = 0;

onmessage = function(message) {
    const data = message.data;
    workerTileMaps = data.map;

    loadConnectedMaps(data.mapName);
}

function loadConnectedMaps(map) {
  const currentMap = workerTileMaps[map];

  const portals = currentMap.layers[3].objects;
  const connectedMaps = [];
  for(let portal of portals) {
    const portalName = portal.name;
    if( portalName.startsWith('exit')) {
      connectedMaps.push(portal.properties[0].value);
    }
  }

  let loadedMaps = Object.keys(workerTileMaps);
  loadedMaps = unloadDistantMapData(loadedMaps, map, connectedMaps);

  for(let connectedMap of connectedMaps) {
    let alreadyLoaded = false;
    for(let loaded of loadedMaps) {
      if(connectedMap == loaded) {
        alreadyLoaded = true;
        break;
      }
    }

    if(!alreadyLoaded) {
      mapsToLoad++;
      loadFile(`../../src/maps/${connectedMap}.json`, function(response){
        workerTileMaps[connectedMap] = JSON.parse(response);

        finishedLoadingMap();
      })
    }
  }
}

function finishedLoadingMap() {
    mapsToLoad--;
    if(mapsToLoad == 0) {
        postMessage(workerTileMaps);
    }
}

function unloadDistantMapData(loadedMaps, currentMap, connectedMaps) {
    for(let i = loadedMaps.length - 1; i >= 0; i--) {
      const thisOldMap = loadedMaps[i];
      if(thisOldMap == currentMap) continue;//current map should already be loaded and should stay that way
  
      let shouldKeepIt = false;
      for(let newMap of connectedMaps) {
        if(thisOldMap == newMap) {
          shouldKeepIt = true;
          break;
        }
      }
  
      if(!shouldKeepIt) {
        loadedMaps.splice(i, 1);
        delete workerTileMaps[thisOldMap];
      }
    }
  
    return loadedMaps;
}

function loadFile(filePath, done) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () { 
      return done(this.responseText) 
    }
    xhr.open("GET", filePath, true);
    xhr.send();
}