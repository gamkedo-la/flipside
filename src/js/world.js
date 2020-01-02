const World = function World(params={
    widthInTiles: 100,
    heightInTiles: 100,
    tileSize: 8
}){
    this.heightInTiles = params.heightInTiles;
    this.widthInTiles = params.widthInTiles;
    this.tileSize = params.tileSize;
    this.data = new Uint16Array(params.widthInTiles * params.heightInTiles);
    this.portals = {};
    this.spawnPoints = {};
    return this;
}

World.prototype.getTileAtPosition = function getTileAtPosition(pos={tx:0, ty:0}){
    return this.data[this.widthInTiles*pos.ty + pos.tx];
}

World.prototype.setTileAtPosition = function setTileAtPosition(pos={tx:0, ty:0}, value=1){
    return this.data[this.widthInTiles*pos.ty + pos.tx] = value;
}


World.prototype.getIndexAtPosition = function getIndexAtPosition(pos={tx:0, ty:0}){
    return this.widthInTiles*pos.ty + pos.tx;
}

World.prototype.pixelToTileIndex = function pixelToTileIndex(params = {x:0, y:0}){
    let tx = Math.floor(params.x / this.tileSize);
    let ty = Math.floor(params.y / this.tileSize);
    return this.getIndexAtPosition({tx: tx, ty: ty});
}

World.prototype.pixelToTileGrid = function pixelToTileGrid(params = {x:0, y:0}){
    return {
            x: Math.floor(params.x / this.tileSize),
            y: Math.floor(params.y / this.tileSize)
            }
}

World.prototype.drawLine = function drawLine(params={
    x1: 0, x2: 0, y1: 0, y2: 0, value: 1
}) {
    
    var x1 = params.x1|0;
    var x2 = params.x2|0;
    var y1 = params.y1|0;
    var y2 = params.y2|0;
    var value = params.value|0;

    var dy = (y2 - y1);
    var dx = (x2 - x1);
    var stepx, stepy;

    if (dy < 0) { dy = -dy; stepy = -1;
    } else { stepy = 1; }

    if (dx < 0) { dx = -dx; stepx = -1;
    } else { stepx = 1; }

    dy <<= 1;        // dy is now 2*dy
    dx <<= 1;        // dx is now 2*dx

    this.setTileAtPosition({x: x1, y: y1}, value);

    if (dx > dy) {
      var fraction = dy - (dx >> 1);  // same as 2*dy - dx
      while (x1 != x2) {
        if (fraction >= 0) {
          y1 += stepy;
          fraction -= dx;          // same as fraction -= 2*dx
        }
        x1 += stepx;
        fraction += dy;              // same as fraction -= 2*dy
        this.setTileAtPosition({x: x1, y: y1}, value);
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
        this.setTileAtPosition({x: x1, y: y1}, params.value);
      }
    }

  }

World.prototype.tileFillRect = function tileFillRect(params = {
    tx: 0, ty: 0, width: 1, height: 1, value: 1,
}){
    for(let i = params.ty; i <= params.ty + params.height; i++){
        let start = this.widthInTiles * i + params.tx;
        let finish = start + params.width+1;
        this.data.fill(params.value, start, finish);
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

World.prototype.tileFillCircle = function tileFillCircle(params = {
    tx: 0, ty: 0, radius: 1, value: 1,
}){
    let rad = Math.floor(params.radius);
    for(let y = -rad; y <= rad; y++){
        for(let x = -rad; x <=rad; x++){
            if(x*x+y*y <= rad*rad){
                this.data[this.getIndexAtPosition({tx: params.tx+x, ty: params.ty+y})] = params.value;
            }
            
        }
    }
}

World.prototype.loadMap = function loadMap(params = {

}){
    
}

export default World;