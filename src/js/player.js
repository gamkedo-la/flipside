const Player = {
    pos: {
        x: 0,
        y: 0
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
    vy: 0,
    
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

Player.update = function update(dt){
    //testing dynamic map stuffs. press X to knock a box-shaped hole in the world around you
    if(this.input.carveWorld){
        let tpos = world.pixelToTileGrid(player.pos)
        tpos.x -= 2; tpos.y -= 2;
        world.tileFillRect({tx:tpos.x, ty:tpos.y, width: 4, height: 4, value: 0})
    }

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
    this.pos.y = this.pos.y + (dt * this.vy);
}

export default Player