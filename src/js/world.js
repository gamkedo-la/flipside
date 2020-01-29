const World = function World(widthInTiles=100, heightInTiles=100, tileSize=8){
    this.heightInTiles = heightInTiles;
    this.widthInTiles = widthInTiles;
    this.tileSize = tileSize;
    this.data = new Uint16Array(widthInTiles * heightInTiles);
    this.portals = [];
    this.spawnPoints = [];
    this.spawnPoints = [];
    this.lightningSpawners = [];
    this.entities = [];

    return this;
}

World.prototype.getTileAtPosition = function getTileAtPosition(tx, ty){
    return this.data[this.widthInTiles*ty + tx];
}

World.prototype.setTileAtPosition = function setTileAtPosition(tx, ty, value=1){
    return this.data[this.widthInTiles*ty + tx] = value;
}


World.prototype.getIndexAtPosition = function getIndexAtPosition(tx, ty){
    return this.widthInTiles*ty + tx;
}

World.prototype.pixelToTileID = function pixelToTileID(x, y){
    return this.data[this.pixelToTileIndex(x, y)];
}

World.prototype.pixelToTileIndex = function pixelToTileIndex(x, y){
    let tx = Math.round(x / this.tileSize);
    let ty = Math.round(y / this.tileSize);
    return this.getIndexAtPosition(tx, ty);
}

World.prototype.pixelToTileGrid = function pixelToTileGrid(x, y){
    return {
            x: Math.round(x / this.tileSize),
            y: Math.round(y / this.tileSize)
            }
}

World.prototype.drawLine = function drawLine( x1, x2, y1, y2, value ) {
    
    var x1 = x1|0;
    var x2 = x2|0;
    var y1 = y1|0;
    var y2 = y2|0;
    var value = value|0;

    var dy = (y2 - y1);
    var dx = (x2 - x1);
    var stepx, stepy;

    if (dy < 0) { dy = -dy; stepy = -1;
    } else { stepy = 1; }

    if (dx < 0) { dx = -dx; stepx = -1;
    } else { stepx = 1; }

    dy <<= 1;        // dy is now 2*dy
    dx <<= 1;        // dx is now 2*dx

    this.setTileAtPosition(x1, y1, value);

    if (dx > dy) {
      var fraction = dy - (dx >> 1);  // same as 2*dy - dx
      while (x1 != x2) {
        if (fraction >= 0) {
          y1 += stepy;
          fraction -= dx;          // same as fraction -= 2*dx
        }
        x1 += stepx;
        fraction += dy;              // same as fraction -= 2*dy
        this.setTileAtPosition(x1, y1, value);
      }
      ;
    } else {
      fraction = dx - (dy >> 1);
      while (y1 != y2) {
        if (fraction >= 0) {
          x1 += stepx;
          fraction -= dy;
        }
        y1 += stepy;
        fraction += dx;
        this.setTileAtPosition(x1, y1, value);
      }
    }

  }

World.prototype.tileFillRect = function tileFillRect( tx, ty, width, height, value ){
    for(let i = ty; i <= ty + height; i++){
        let start = this.widthInTiles * i + tx;
        let finish = start + width+1;
        this.data.fill(value, start, finish);
    }
}

World.prototype.tileFillRectRandom = function tileFillRectRandom(params = {
    tx: 0, ty: 0, width: 1, height: 1, rangeStart: 0, rangeEnd: 0,
}){
    for(let i = params.tx; i <= params.tx + params.width; i++){
        for(let j = params.ty; j <= params.ty + params.height; j++){
            this.data[j * this.widthInTiles + i] = Math.floor( Math.random() * (params.rangeEnd-params.rangeStart) ) + params.rangeStart
        }
    }
}

World.prototype.tileFillCircle = function tileFillCircle( tx, ty, radius, value ){
    let rad = Math.floor(radius);
    for(let y = -rad; y <= rad; y++){
        for(let x = -rad; x <=rad; x++){
            if(x*x+y*y <= rad*rad){
                this.data[this.getIndexAtPosition(tx+x, ty+y)] = value;
            }
            
        }
    }
}

export default World;