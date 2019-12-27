
const Player = {
    pos: {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0
    },
    
    rect: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    },

    width: 6,
    height: 18,

    maxVel: {
        x: 60,
        y: 60,
    },

    dx: 0,
    dy: 0,
    vx: 0, 
    vy: 7,
    
    friction: 0.7,

    accel: 7,
    gravity: 1,
    
    targetX: 0,
    targetY: 0,
    //diameter: 4,

    input: {
        left: false,
        up: false,
        right: false, 
        down: false,
        carveWorld: false
    }
}

Player.update = function update(dt, world){
    
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;
    //testing dynamic map stuffs. press X to knock a box-shaped hole in the world around you
    if(this.input.carveWorld){
        let tpos = world.pixelToTileGrid(player.pos)
        tpos.x -= 2; tpos.y -= 2;
        world.tileFillRect({tx:tpos.x, ty:tpos.y, width: 4, height: 4, value: 0})
    }

    let dx, dy
    //basic player movement.
    if(this.input.left ){
        this.vx -= this.accel;
    }
    else if(this.input.right ){
        this.vx += this.accel;
    }
    else{this.vx *= this.friction}

    if(this.input.down ){
        this.vy += this.accel;
    }
    else if(this.input.up ){
        this.vy -= this.accel;
    }
    else{this.vy *= this.friction}
    
    this.vx = this.vx.clamp(-this.maxVel.x, this.maxVel.x);
    this.vy = this.vy.clamp(-this.maxVel.y, this.maxVel.y);
        
    this.pos.x = this.pos.x + (dt * this.vx);
    if( this.tileCollisionCheck() ){
        this.pos.x = this.prevX;
    }
    this.pos.y = this.pos.y + (dt * this.vy);
    if( this.tileCollisionCheck() ){
        this.pos.y = this.prevY;
    }
}

Player.tileCollisionCheck = function tileCollisionCheck(){
    //update body edges
    this.rect.top = this.pos.y - this.height/2;
    this.rect.bottom = this.pos.y + this.height/2;
    this.rect.left = this.pos.x - this.width/2;
    this.rect.right = this.pos.x + this.width/2;

    let leftTile =      Math.floor(this.rect.left / world.tileSize),
        rightTile =     Math.floor(this.rect.right / world.tileSize),
        topTile =       Math.floor(this.rect.top / world.tileSize),
        bottomTile =    Math.floor(this.rect.bottom / world.tileSize)
        //collision = false;

    for(let i = leftTile; i <=rightTile; i++){
        for(let j = topTile; j<= bottomTile; j++){
            let tile = world.getTileAtPosition({tx: i, ty: j})
            if(tile > 3){
                return true;
            }
        }
    }
}

Player.getTiles = function getTiles(world){
    this.rect.top = this.pos.y - this.height/2;
    this.rect.bottom = this.pos.y + this.height/2;
    this.rect.left = this.pos.x - this.width/2;
    this.rect.right = this.pos.x + this.width/2;

    let leftTile =      Math.floor(this.rect.left / world.tileSize),
        rightTile =     Math.floor(this.rect.right / world.tileSize),
        topTile =       Math.floor(this.rect.top / world.tileSize),
        bottomTile =    Math.floor(this.rect.bottom / world.tileSize)

    return {
        topleft:    world.widthInTiles * topTile + leftTile,
        topRight:   world.widthInTiles * topTile + rightTile,
        bottomLeft: world.widthInTiles * bottomTile + leftTile,
        bottomRight: world.widthInTiles * bottomTile + rightTile
    }
}


export default Player