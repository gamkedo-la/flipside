import { clamp } from './math.js';
import SpriteSheet from './spritesheet.js';
import { rndFloat } from './math.js';
import Particle from './particle.js';

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

    width: 10,
    height: 34,
    
    health: 100,
    maxHealth: 100,

    flipRemovedCooldown: 180,

    maxVel: {
        x: 130,
        y: 260,
    },

    vx: 0, 
    vy: 10,
    
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
        maxVel: { x: 130, y: 260 },
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

Player.update = function update(dt, world, worldFlipped, worldForeground){
    this.world = world;
    const { MSG } = G;

    this.currentAnimation.update(dt);
    
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;

    this.rect.top = this.pos.y - this.height/2;
    this.rect.bottom = this.pos.y + this.height/2;
    this.rect.left = this.pos.x - this.width/2;
    this.rect.right = this.pos.x + this.width/2;

    if(this.inTheFlip){
   
    }

    
    //fire gun
    if(this.input.carveWorld){
        
        let gunLeft = this.pos.x - 6;
        let gunRight = this.pos.x + 6;
        let gunYoffset = -1;
        G.particles.push(new Particle({
            x: this.facingLeft ? gunLeft : gunRight,
            y: this.pos.y + gunYoffset,
            vx: this.facingLeft ? -5: 5,
            vy: 0,
            color: 22,
            width: 3, 
            height: 3,
            life: 50,
            type: 'bullet'
        }))
    }

    if(this.tileCollisionCheck(worldForeground, function(tile){ return tile >=113 && tile <= 113+8; } )) {
        MSG.dispatch("hurt", {amount: 1, type: 'groundHazard', x: this.pos.x, y: this.pos.y});
    };

    if(this.inTheFlip){
        this.inTheFlipPhysics(dt, world, worldFlipped);
    }else{
        this.normalPhysics(dt, world, worldFlipped)
    }


    //---flipped world checks
    if( this.tileCollisionCheck(worldFlipped, function(tile){return tile == 3}) ){
        if(!this.inTheFlip){
            MSG.dispatch('crossed');
            this.inTheFlip = true;
        }
        
    } else {
        if(this.inTheFlip){
            MSG.dispatch('crossed');
            this.inTheFlip = false;
        }
    }
    let self = this;

    world.portals.forEach(function(portal){
        if(self.rectCollision(portal) ){
            //console.log('entered portal');
            let destinationMap = portal.properties.find(function(prop){return prop.name == 'destinationMap'}).value;
            let destinationSpawn = portal.properties.find(function(prop){return prop.name == 'destinationSpawn'}).value;
            console.log(destinationMap, destinationSpawn);
            G.loadMap({map: destinationMap, spawnPoint: destinationSpawn });
        }
    })
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
    if(this.tileCollisionCheck(world, this.collideIndex) ){
        this.pos.x = this.prevX;
        this.vx = 0;
    }
    this.pos.y = this.pos.y + (dt * this.vy);
    if(this.tileCollisionCheck(world, this.collideIndex) ){
        this.vy =0;
        this.jumping = false;
        this.falling = false;
        this.pos.y = this.prevY;
    }

}


Player.tileCollisionCheck = function tileCollisionCheck(world, tileCheck){
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

            // G.debugEvents.push(
            // `G.ctx.fillStyle = 'rgba(255,255,0,0.15)';
            // G.ctx.fillRect(${i}*8-G.view.x, ${j}*8-G.view.y, 8,8)`);

            if(typeof tileCheck === "function"){
                if(tileCheck(tile)){return true};
            }
            else if(tile >= tileCheck){
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

Player.init = function init(){
    let { img, MSG } = G;
    this.spritesheet = new SpriteSheet({
        image: img.player,
        frameWidth: 16,
        frameHeight: 36,
        animations: {
            idleLeft: {
                frames: 1
            },
            idleRight: {
                frames: 0
            },
            walkRight: {
                frames: '2..9',
                frameRate: 16
            },
            walkLeft: {
                frames: '10..17',
                frameRate: 16
            },
            fallingLeft:{
                frames: 20
            },
            fallingRight: {
                frames: 18
            },
            airLeft: {
                frames: 21
            },
            airRight: {
                frames: 19
            }

        }
    })
    //player must have an anim set at start, or player.currentAnimation is null
    this.play('idleRight');

    //player events------------------------------------------------------------
    MSG.addEventListener('crossed',     function (event) {      G.player.crossedOver(event) });
    MSG.addEventListener('hurt',        function (event) {      G.player.hurt(event.detail) });


}

Player.rectCollision = function(body) {
    let left    = body.x,
        right   = body.x + body.width,
        top     = body.y, 
        bottom  = body.y + body.height
    //console.log(this.pos.x);
    return (
        this.rect.left < right &&
        left < this.rect.right &&
        this.rect.top < bottom &&
        top < this.rect.bottom
      );
  }

Player.hurt = function(params){
    this.health -= params.amount; 
    this.vx = -this.vx * 3;
    this.vy = -this.vy * 3;
    ; 
}

export default Player