import { clamp } from './math.js';
import SpriteSheet from './spritesheet.js';
import { rndFloat, rndInt, range } from './math.js';
import Particle from './particle.js';

const Player = {
    spritesheet:{},
    SpritesheetV2:{},
    currentAnimation:{},
    facingLeft: false,
    collideIndex: 128,
    
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

    //when we shoot flipspace tiles, this is how long before they heal
    flipRemovedCooldown: 180,

    vx: 0, 
    vy: 10,
    
    //vars set by in/out of flipspace physics functions. don't try to set them here
    accel: 0,
    jumpVel: 0,
    gravity: 0,
    friction: 0,
    maxVel: {
        x: 0,
        y: 0,
    },
    //-------------------

    falling: false,
    jumping: false,

    inTheFlip: false,
    crossing: false,
    submergedInFlip: false,

    flipTimer: 0,
    flipTimeMax: 200,

    hurtCooldown: 0,
    hurtCooldownMax: 60,
    hurtPush: 40,

    gunCooldown: 0,
    gunCooldownMax: 12,

    flipBar: {
        xOffset: -12,
        yOffset: -18,
        width: 40, 
        height: 4
    },

    input: {
        left: false,
        up: false,
        right: false, 
        down: false,
        jump: false,
        carveWorld: false,
        addWorld: false,

    },

    physicsNormal: {
        maxVel: { x: 130, y: 270 },
        accel: 10,
        jumpVel: 1300,
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

    
    // dangerous tiles
    if(this.tileCollisionCheck(worldForeground, function(tile){ return tile >=113 && tile <= 113+8; } )) {
        if(!this.hurtCooldown){
            MSG.dispatch("hurt", {amount: 1, type: 'groundHazard', x: this.pos.x, y: this.pos.y});
        }
    };

    // pickups (keys/health etc)
    // if(this.tileCollisionCheck(worldForeground, function(tile){ return tile == TILE_KEY; } )) {
    //    MSG.dispatch("pickup", {amount: 1, type: 'key', x: this.pos.x, y: this.pos.y});
    // };

    if(this.hurtCooldown)this.hurtCooldown--;

    if(this.inTheFlip){
        this.inTheFlipPhysics(dt, world, worldFlipped);
        
        if(this.flipTimer){
            this.flipTimer--;
        }else{
            if(!this.hurtCooldown){
                MSG.dispatch("hurt", {amount: 10, type: 'flipSpace', x: this.pos.x, y: this.pos.y});
            }  
        }
    }else{
        this.normalPhysics(dt, world, worldFlipped);
    }

    if(this.health < 0){
        MSG.dispatch("died", {x: this.pos.x, y: this.pos.y});
    }


    //---flipped world checks
    if( this.withinCheck(worldFlipped, function(tile){return tile == 3}) ){
            if(!this.inTheFlip){
                MSG.dispatch('crossed');
                this.inTheFlip = true;
                this.flipTimer = this.flipTimeMax;
                G.audio.enterFlipside();
            }
    }else{
        if(this.inTheFlip){
            MSG.dispatch('crossed');
            this.inTheFlip = false;
            G.audio.exitFlipside();
        }
    }
    var self = this;
    //check exits for overlap------------------------
    world.portals.forEach(function(portal){
        if(self.rectCollision(portal) ){
            //console.log('entered portal');
            let destinationMap = portal.properties.find(function(prop){return prop.name == 'destinationMap'}).value;
            let destinationSpawn = portal.properties.find(function(prop){return prop.name == 'destinationSpawn'}).value;
            console.log(destinationMap, destinationSpawn);
            G.loadMap({map: destinationMap, spawnPoint: destinationSpawn });
        }
    })

    //check onscreen objects-----------
    world.objects.filter(function(obj){return obj.onScreen }).forEach(function(obj, i, arr){
        if(self.rectCollision({x:obj.x, y:obj.y, width: 8, height: 8}) ){
            MSG.dispatch('pickup', {
                name: obj.name,
                amount: obj.properties.find((e)=>{return e.name=='amount'}).value,
                x: obj.x, y: obj.y
            })
            world.objects.splice(i, 1);
        }
    })
}
Player.render = function render(dt, world, worldFlipped, worldForeground){

    if(this.inTheFlip){
        let x = this.pos.x + this.flipBar.xOffset - G.view.x;
        let y = this.pos.y + this.flipBar.yOffset - G.view.y;
        let w = range(this.flipTimer, 0, this.flipTimeMax, 0, this.flipBar.width);
        let h = this.flipBar.height;
        G.ctx.fillStyle = "#44F"
        G.ctx.fillRect(x, y, w, h);
    }

    this.currentAnimation.render({
        x: Math.floor(this.pos.x-this.width/2-G.view.x),
        y: Math.floor(this.pos.y-this.height/2-G.view.y),
        width: 16,
        height: 36
    })
}
Player.inTheFlipPhysics = function inTheFlipPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsFlip.gravity;
    this.friction = this.physicsFlip.friction;
    this.maxVel = this.physicsFlip.maxVel;
    this.accel = this.physicsFlip.accel;
    this.jumpVel = this.physicsFlip.jumpVel;

    if(this.input.carveWorld){
        
        let gunLeft = this.pos.x - 6;
        let gunRight = this.pos.x + 6;
        let gunYoffset = -1;
        G.particles.push(new Particle({
            x: this.pos.x,
            y: this.pos.y,
            vx: -this.vx/50,
            vy: -this.vy/50,
            color: 22,
            width: 3, 
            height: 3,
            life: 50,
            type: 'jetBubble'
        }))
        if(this.input.down){
            this.vy += this.accel;
        }
        if(this.input.up){
            this.vy -= this.accel;
        }
        if(this.input.left){
            this.vx -= this.accel;
        }
        if(this.input.right){
            this.vx += this.accel;
        }
    }

    if(this.vy < 0){
        this.falling = true;
    }

    // if(this.input.left ){
    //     this.vx -= this.accel;
    // }
    // else if(this.input.right ){
    //     this.vx += this.accel;
    // }
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

// emit a poof when the gun is fired
Player.muzzleFlash = function() {
    //console.log("Muzzleflash!");
    let max = rndInt(1,3);
    // big poof
    G.particles.push(new Particle({
        x: rndFloat(-1,1)+(this.facingLeft?this.pos.x-8:this.pos.x+8), // gunXOffset
        y: rndFloat(-1,1)+(this.pos.y-3), // gunYOffset
        vx: this.facingLeft?rndFloat(-1,0):rndFloat(0,1),
        vy: rndFloat(1,1),
        color: rndInt(7,10), // yellow
        width: 6, 
        height: 6,
        life: 1,
        type: 'particle'
    })) ;   
    
    max = rndInt(6,12);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.push(new Particle({
            x: this.facingLeft?this.pos.x-6:this.pos.x+6, // gunXOffset
            y: this.pos.y-1, // gunYOffset
            vx: this.facingLeft?rndFloat(-2,-4):rndFloat(2,4),
            vy: rndFloat(-2,2),
            color: rndInt(1,9), // black to red to yellow
            width: 3, 
            height: 3,
            life: 4,
            type: 'particle'
        })) ;   
    }
}    
        
// emit a poof when we hit the ground after falling
Player.landedFX = function() {
    console.log("landedFX!");
    let max = rndInt(4,8);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.push(new Particle({
            x: this.pos.x+4+rndFloat(-2,2),
            y: this.pos.y+20+rndFloat(-2,-6), // foot offset
            vx: rndFloat(-0.5,0.5),
            vy: rndFloat(-0.1,-0.25),
            color: rndInt(58,63), // sandy dirt color
            width: 1, 
            height: 1,
            life: 20,
            type: 'particle'
        })) ;   
    }
}

Player.normalPhysics = function normalPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsNormal.gravity;
    this.friction = this.physicsNormal.friction;
    this.maxVel = this.physicsNormal.maxVel;
    this.accel = this.physicsNormal.accel;
    this.jumpVel = this.physicsNormal.jumpVel;

    if(this.input.carveWorld && !this.gunCooldown){ //fire gun
        this.gunCooldown = this.gunCooldownMax;
        this.muzzleFlash();

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
    } else if (this.gunCooldown) {
        this.gunCooldown--;
    }

    this.facingLeft ? this.play('idleLeft') : this.play('idleRight');
    if(this.vy < 0){
        //this.falling = true;
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
    if(G.world.pixelToTileID({x:this.prevX, y: (this.prevY+this.height/2)})!=97 && this.prevY < this.pos.y){
        if(G.world.pixelToTileID({x:this.pos.x, y: (this.pos.y+this.height/2) })==97){
        console.log('cloud');
        this.falling = false;
        this.jumping = false;
        this.vy = 0;
        this.pos.y = this.prevY;
        }
        
    }

    if(this.tileCollisionCheck(world, this.collideIndex) ){
        if (this.jumping) {
            if (this.vy > 0) { // did we just stop falling?
                //console.log("Just landed from a jump!");
                this.jumping = false;
                this.landedFX();
                
            } else if (this.vy < 0) {
                //console.log('ceiling');
            }
        }

        this.falling = false;
        this.vy = 0;
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

Player.withinCheck = function tileCollisionCheck(world, tileCheck){
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

                if(!tileCheck(tile)){return false};
            }
            
        }
        return true;
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

Player.play = function play(animationName){
    if(!this.spritesheetV2.animations[animationName]){
        this.currentAnimation = this.spritesheet.animations[animationName];
    } else {
        this.currentAnimation = this.spritesheetV2.animations[animationName];
    }
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

Player.init = function init(){
    let { img, MSG } = G;

    //player events listeners------------------------------------------------------------
    MSG.addEventListener('crossed',     function (event) { G.player.crossedOver(event.detail) });
    MSG.addEventListener('hurt',        function (event) { G.player.hurt(event.detail)        });
    MSG.addEventListener('died',        function (event) { G.player.died(event.detail)        });
    MSG.addEventListener('pickup',      function (event) { G.player.pickup(event.detail)      });


    this.spritesheet = new SpriteSheet({
        image: img.player,
        frameWidth: 50,
        frameHeight: 49,
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

    this.spritesheetV2 = new SpriteSheet({
        image: img.playerRight,
        frameWidth: 50,
        frameHeight: 49,
        animations: {
            idleRight: {
                frames: 0
            }
        }
    })
    //player must have an anim set at start, or player.currentAnimation is null
    this.play('idleRight');

    

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


//player event handlers------------------------------------------------------------

Player.crossedOver = function crossedOver(event){
    console.log('crossed over');
}

Player.hurt = function(params){

    let hurtParticleCount = 20;
    while(--hurtParticleCount){
        G.particles.push(new Particle({
            x: this.pos.x,
            y: this.pos.y,
            vx: -this.vx/50+rndFloat(-5,5),
            vy: -this.vy/50+rndFloat(-5,5),
            color: 4,
            width: 1, 
            height: 1,
            life: 20,
            type: 'blood'
        }))
    }
    
    this.hurtCooldown = this.hurtCooldownMax;

    this.health -= params.amount;

    //if we're moving more left-right than up-down
    if(Math.abs(this.vx) > Math.abs(this.vy)){
        //moving right when hit
        if(this.vx > 0){
            //push back left
            this.vx -= this.hurtPush;
        //moving left when hit
        }else{
            //push back right
            this.vx += this.hurtPush;
        }
    }
    //if we're moving more up-down than left-right
    else{
        //moving down when hit
        if(this.vy > 0){
            //push back up
            this.vy -= this.hurtPush;
        //moving up when hit
        }else {
            //push back down
            this.vy += this.hurtPush
        }
    }
    
    ; 
}

Player.died = function(params){
    console.log('dead');
    G.loadMap({map:'map000', spawnPoint:'PlayerStart'});
    this.health = this.maxHealth;
    G.Records.playerStats.totals.deaths++;
    G.Records.resetSession();
}

Player.pickup = function(params){
    console.log(params);
    G.Records.playerStats.totals.nanitesCollected+=params.amount
    let particles = 40;
    while(--particles){
        G.particles.push(new Particle({
            x: params.x,
            y: params.y,
            vx: rndFloat(-5,5),
            vy: rndFloat(-5,10),
            color: 12,
            width: 1, 
            height: 1,
            life: 30,
            type: 'particle'
        }))
    }
}

export default Player