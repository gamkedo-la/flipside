import { clamp } from './math.js';

const Player = {
    spritesheet:{},
    currentAnimation:{},
    facingLeft: false,
    collideIndex: 128,
    color: '#4f0',
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

    width: 12,
    height: 36,


    maxVel: {
        x: 190,
        y: 260,
    },

    dx: 0,
    dy: 0,
    vx: 0, 
    vy: 7,
    
    friction: 0.7,

    accel: 10,
    jumpVel: 1200,
    gravity: 10,
    falling: false,
    jumping: false,
    inTheFlip: false,
    crossing: false,
    
    input: {
        left: false,
        up: false,
        right: false, 
        down: false,
        jump: false,
        carveWorld: false
    },

    physicsNormal: {
        maxVel: { x: 190, y: 260 },
        accel: 10,
        jumpVel: 1200,
        gravity: 10,
        friction: 0.7
    },

    physicsFlip: {
        maxVel: { x: 80, y: 80 },
        accel: 10,
        jumpVel: 1200,
        gravity: 0,
        friction: 0.99
    }
}

Player.update = function update(dt, world, worldFlipped){

    this.currentAnimation.update(dt);
    
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;

    
    //testing dynamic map stuffs. press X to knock a box-shaped hole in the world around you
    if(this.input.carveWorld){
        let tpos = world.pixelToTileGrid(this.pos)
        tpos.x -= 2; tpos.y -= 2;
        worldFlipped.tileFillRect({tx:tpos.x, ty:tpos.y, width: 4, height: 4, value: 0})
    }

    if(this.inTheFlip){
        this.inTheFlipPhysics(dt, world, worldFlipped);
    }else{
        this.normalPhysics(dt, world, worldFlipped)
    }


    //---flipped world checks
    if( this.tileCollisionCheck(worldFlipped, 2) ){
        if(!this.inTheFlip){
            MSG.dispatch('crossed');
        }
        this.inTheFlip = true;
    } else {
        if(this.inTheFlip){
            MSG.dispatch('crossed');
            this.inTheFlip = false;
        }
    }

    
}


Player.inTheFlipPhysics = function inTheFlipPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsFlip.gravity;
    this.friction = this.physicsFlip.friction;
    this.maxVel = this.physicsFlip.maxVel;
    this.accel = this.physicsFlip.accel;
    this.jumpVel = this.physicsFlip.jumpVel;

    if(this.vy < 0){
        this.falling = true;
    }

    if(this.input.left ){
        this.vx -= this.accel;
    }
    else if(this.input.right ){
        this.vx += this.accel;
    }
    else{this.vx *= this.friction}

    if(this.input.jump && !this.jumping){
        this.vy = -this.jumpVel
        this.jumping = true;
         this.input.jump = false; 
    }
    else{
        this.vy += this.gravity;
        this.vy *= this.friction;
    }

    this.vx = clamp(this.vx, -this.maxVel.x, this.maxVel.x);
    this.vy = clamp(this.vy, -this.maxVel.y, this.maxVel.y);
        
    this.pos.x = this.pos.x + (dt * this.vx);
    if( this.tileCollisionCheck(world, this.collideIndex) ){
        this.pos.x = this.prevX;
        this.vx = 0;
    }
    this.pos.y = this.pos.y + (dt * this.vy);
    if( this.tileCollisionCheck(world, this.collideIndex) ){
        this.vy =0;
        this.jumping = false;
        this.falling = false;
        this.pos.y = this.prevY;
    }

}

Player.normalPhysics = function normalPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsNormal.gravity;
    this.friction = this.physicsNormal.friction;
    this.maxVel = this.physicsNormal.maxVel;
    this.accel = this.physicsNormal.accel;
    this.jumpVel = this.physicsNormal.jumpVel;

    this.facingLeft ? this.play('idleLeft') : this.play('idleRight');
    if(this.vy < 0){
        this.falling = true;
        this.facingLeft ? this.play('airLeft') : this.play('airRight');
    }
    if(this.vy > 0){
        this.falling = true;
        this.facingLeft ? this.play('fallingLeft') : this.play('fallingRight');
    }
    if(this.vx < 0 && this.input.left && !this.falling){
        this.facingLeft = true;
        this.play('walkLeft');
    }
    if(this.vx > 0 && this.input.right && !this.falling){
        this.facingLeft = false;
        this.play('walkRight');
    }

    if(this.input.left ){
        this.vx -= this.accel;
        
    }
    else if(this.input.right ){
        this.vx += this.accel;
    }
    else{this.vx *= this.friction}

    if(this.input.jump && !this.jumping){
        this.vy = -this.jumpVel
        this.jumping = true;
         this.input.jump = false; 
    }
    else{
        this.vy += this.gravity;
    }

    if(this.jumping){
        this.input.jump = false;
    }

    this.vx = clamp(this.vx, -this.maxVel.x, this.maxVel.x);
    this.vy = clamp(this.vy, -this.maxVel.y, this.maxVel.y);
        
    this.pos.x = this.pos.x + (dt * this.vx);
    if( this.tileCollisionCheck(world, this.collideIndex) ){
        this.pos.x = this.prevX;
        this.vx = 0;
    }
    this.pos.y = this.pos.y + (dt * this.vy);
    if( this.tileCollisionCheck(world, this.collideIndex) ){
        this.vy =0;
        this.jumping = false;
        this.falling = false;
        this.pos.y = this.prevY;
    }

}


Player.tileCollisionCheck = function tileCollisionCheck(world, tileId){
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
            if(tile >= tileId){
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

Player.crossedOver = function crossedOver(event){
    console.log('crossed over');
    //this.color = 'white';
}

Player.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}


export default Player