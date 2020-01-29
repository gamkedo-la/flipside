import { clamp } from './math.js';
import SpriteSheet from './spritesheet.js';
import { rndFloat, rndInt, range } from './math.js';
import Particle from './particle.js';
import { Transitioner } from './graphics.js';
import { rectCollision } from './util.js';

const Player = {
    spritesheet:{},
    currentAnimation:{},
    facingLeft: false,

    collideIndex: 1009,
    hazardTilesStartIndex: 113,
    hazardTilesEndIndex: 120,
    cloudTilesStartIndex: 977,
    cloudTilesEndIndex: 992,

    pos: {
        x: 0,
        y: 0,
    },

    prevX: 0,
    prevY: 0,
    
    rect: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    },

    width: 18,
    height: 41,
    
    health: 100,
    maxHealth: 100,

    //when we shoot flipspace tiles, this is how long before they heal
    flipRemovedCooldown: 240,

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
    fallthru: false,
    jumping: false,
    crouching: false,
    aimingUp: false,

    inTheFlip: false,
    crossing: false,
    submergedInFlip: false,

    flipTimer: 0,
    flipTimeMax: 200,

    hurtCooldown: 0,
    hurtCooldownMax: 180,
    hurtPush: 40,

    gunCooldown: 0,
    gunCooldownMax: 11,

    doorCooldown: 0,

    bulletVXdefault: 4,
    bulletVX: 4,
    bulletVYdefault: 2.5,

    flipBar: {
        xOffset: -12,
        yOffset: -18,
        width: 40, 
        height: 4
    },

    gunOffset: {
        leftX: -15,
        rightX: 18,
        y:-5
    },

    gunOffsetDefault: {
        leftX: -15,
        rightX: 18,
        y:-5
    },

    gunOffsetUp: {
        leftX: 0,
        rightX: 0,
        y:-10
    },


    input: {
        left: false,
        up: false,
        right: false, 
        down: false,
        jump: false,
        primaryFire: false,
        secondaryFire: false,

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
    this.fallthru = false;
    const { MSG } = G;

    this.currentAnimation.update(dt);

    this.doorCooldown--;
    
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;

    this.rect.top = this.pos.y - this.height/2;
    this.rect.bottom = this.pos.y + this.height/2;
    this.rect.left = this.pos.x - this.width/2;
    this.rect.right = this.pos.x + this.width/2;

    
    // dangerous tiles
    var self = this;
    if(this.tileCollisionCheck(world, function(tile){ return tile >=self.hazardTilesStartIndex && tile <= self.hazardTilesEndIndex; } )) {
            MSG.dispatch("hurt", {amount: 1, type: 'groundHazard', x: this.pos.x, y: this.pos.y});
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
                MSG.dispatch("hurt", {amount: 10, type: 'flipSpace', x: this.pos.x, y: this.pos.y});
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
                if (G.audio) G.audio.enterFlipside();
                this.flipMosaic();
            }
    }else{
        if(this.inTheFlip){
            MSG.dispatch('crossed');
            this.inTheFlip = false;
            if (G.audio) G.audio.exitFlipside();
            this.flipMosaic();
        }
    }
    var self = this;
    //check exits for overlap------------------------
    world.portals.forEach(function(portal){
        if(self.rectCollision(portal) ){
            let destinationMap = portal.properties.find(function(prop){return prop.name == 'destinationMap'}).value;
            let destinationSpawn = portal.properties.find(function(prop){return prop.name == 'destinationSpawn'}).value;
            // console.log(destinationMap, destinationSpawn);
            G.loadMap({map: destinationMap, spawnPoint: destinationSpawn });
            G.saver.save(G.gameKey);
            G.Records.update();
        }
    })

    world.doors.forEach(function(door){
        if(self.rectCollision(door) && self.input.up && self.doorCooldown <= 0){
            //console.log('entered portal');
            
            self.doorCooldown = 60;
            var wipe = new Transitioner().start('wipe', function(){
                let destinationMap = door.properties.find(function(prop){return prop.name == 'destinationMap'}).value;
                let destinationSpawn = door.properties.find(function(prop){return prop.name == 'destinationSpawn'}).value;
                console.log(destinationMap, destinationSpawn);
                G.loadMap({map: destinationMap, spawnPoint: destinationSpawn });
            });
            //
            G.saver.save(G.gameKey);
            G.Records.update();
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
        x: Math.floor(this.pos.x-this.width/2-G.view.x)-4,
        y: Math.floor(this.pos.y-this.height/2-G.view.y-3),
        width: 31,
        height: 45
    })
    let dX = this.pos.x-G.view.x, dY = this.rect.bottom-G.view.y
    G.rb.line(dX, dY, dX, dY-3, 11);
    
}
Player.inTheFlipPhysics = function inTheFlipPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsFlip.gravity;
    this.friction = this.physicsFlip.friction;
    this.maxVel = this.physicsFlip.maxVel;
    this.accel = this.physicsFlip.accel;
    this.jumpVel = this.physicsFlip.jumpVel;

    if(this.input.primaryFire){
        
        let gunLeft = this.pos.x - 6;
        let gunRight = this.pos.x + 6;
        let gunYoffset = -1;
        G.particles.push(new Particle(
            this.pos.x,
            this.pos.y,
            -this.vx/50,
            -this.vy/50,
            22,
            3, 
            3,
            50,
            'jetBubble'
        ))
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
    if(this.input.secondaryFire && !this.gunCooldown){ 
        worldFlipped.tileFillCircle({
            tx: Math.floor(this.pos.x/8),
            ty: Math.floor(this.pos.y/8),
            radius: 8,
            value: 3
        })
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
    G.particles.push(new Particle(
        rndFloat(-1,1)+(this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX), // gunXOffset
        rndFloat(-1,1)+(this.pos.y + this.crouching ? 1: -4 ), // gunYOffset
        this.facingLeft?rndFloat(-1,0):rndFloat(0,1),
        rndFloat(1,1),
        rndInt(7,10), // yellow
        6, 
        6,
        1,
        'particle'
    )) ;   
    
    max = rndInt(6,12);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.push(new Particle(
            this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX, // gunXOffset
            this.pos.y+ this.crouching ? 1 : -4, // gunYOffset
            this.facingLeft?rndFloat(-2,-4):rndFloat(2,4),
            rndFloat(-2,2),
            rndInt(1,9), // black to red to yellow
            3, 
            3,
            4,
            'particle'
        )) ;   
    }
}    
        
// emit a poof when we hit the ground after falling
Player.landedFX = function() {
    // console.log("landedFX!");
    let max = rndInt(4,8);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.push(new Particle(
            this.pos.x+4+rndFloat(-2,2),
            this.pos.y+20+rndFloat(-2,-6), // foot offset
            rndFloat(-0.5,0.5),
            rndFloat(-0.1,-0.25),
            rndInt(58,63), // sandy dirt color
            1, 
            1,
            20,
            'particle'
        )) ;   
    }
}

Player.normalPhysics = function normalPhysics(dt, world, worldFlipped){
    this.gravity = this.physicsNormal.gravity;
    this.friction = this.physicsNormal.friction;
    this.maxVel = this.physicsNormal.maxVel;
    this.accel = this.physicsNormal.accel;
    this.jumpVel = this.physicsNormal.jumpVel;

    if(this.input.up){
        this.aimingUp = true;
        if(!this.input.left && !this.input.right){this.bulletVX = 0} 
    } else {
        this.aimingUp = false;
        this.bulletVX = this.bulletVXdefault;
    }

    if(this.input.primaryFire && !this.gunCooldown){ //fire gun
        this.gunCooldown = this.gunCooldownMax;
        this.muzzleFlash();

        let gunYoffset = this.crouching? 7 : -3;
        G.particles.push(new Particle(
            this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX,
            this.pos.y + gunYoffset,
            this.facingLeft ? -this.bulletVX + (this.vx/100) : this.bulletVX + (this.vx/100),
            this.aimingUp ? -this.bulletVYdefault : 0,
            22,
            3, 
            3,
            50,
            'bullet'
        ))
    } else if (this.gunCooldown) {
        this.gunCooldown--;
    }

    //---add flipspace fun
    if(this.input.secondaryFire && !this.gunCooldown){ //fire gun
        this.gunCooldown = this.gunCooldownMax;
        this.muzzleFlash();

        let gunYoffset = this.crouching? 1 : -4;
        G.particles.push(new Particle(
            this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX,
            this.pos.y + gunYoffset,
            this.facingLeft ? -5: 5,
            0,
            26,
            3, 
            3,
            50,
            'bulletFlipped'
        ))
    } else if (this.gunCooldown) {
        this.gunCooldown--;
    }
    this.inAir = false;
    this.falling = false;
    
    if(this.vy < 0.5 && this.vy != 0){
        //this.falling = true;
        // console.log("in Air!")
        this.inAir = true;
        this.facingLeft ? this.play('airLeft') : this.play('airRight');
    }
    if(this.vy > 0.5){
        this.falling = true;
        this.facingLeft ? this.play('fallingLeft') : this.play('fallingRight');
        // console.log("Falling!!")
    }
    if(Math.abs(this.vx) < 0.9 && !this.inAir && !this.falling){
        this.facingLeft ? this.play('idleLeft') : this.play('idleRight');
    }
    if(this.vx < -1 && this.input.left && !this.inAir && !this.falling){
        G.Records.playerStats.stepsTaken+= 1;
        this.facingLeft = true;
        this.play('walkLeft');
    }
    if(this.vx > 1 && this.input.right && !this.inAir && !this.falling){
        G.Records.playerStats.stepsTaken+= 1;
        this.facingLeft = false;
        this.play('walkRight');
    }

    if(this.crouching){
        this.facingLeft ? this.play('crouchLeft') : this.play('crouchRight');
    }

    if(this.input.down && !this.inAir && !this.falling){
        this.crouching = true;
    }else{this.crouching = false}

    if(this.input.left ){
        this.vx -= this.accel;
        
    }
    else if(this.input.right ){
        this.vx += this.accel;
    }
    else{this.vx *= this.friction}

    if(this.input.jump && !this.jumping){
        if(this.input.down){
            this.fallthru = true;
            this.jumping = true;
            this.input.jump = false;
            this.pos.y+=5;
        } else {
            this.vy = -this.jumpVel
            this.jumping = true;
            this.input.jump = false; 
        }
        
    }
    else{
        this.vy += this.gravity;
    }

    if(this.jumping){
        this.input.jump = false;
    }

    
    
    var self = this;
    this.vx = clamp(this.vx, -this.maxVel.x, this.maxVel.x);
    this.vy = clamp(this.vy, -this.maxVel.y, this.maxVel.y);
        
    this.pos.x = this.pos.x + (dt * this.vx);
    if(this.tileCollisionCheck(world, this.collideIndex) ){
        this.pos.x = this.prevX;
        this.vx = 0;
    }

    world.entities.forEach(function(obj){
        if(obj.type == 'barricade'){
            if(rectCollision(obj.rect, self.rect)){
                // console.log(obj);
                self.pos.x = self.prevX;
                self.vx = 0;
            }
        }
        if(obj.type == 'switch'){
            if(rectCollision(obj.rect, self.rect)){
                //obj.active = true;
                // console.log(obj);
            }
        }
        
        
    })

    this.pos.y = this.pos.y + (dt * this.vy);

    

    //one-way platforms------------------------------------------------------------------------------------
    
    

    if(!this.fallthru && this.prevY < this.pos.y){
        let gid = G.world.pixelToTileID(this.pos.x,(this.pos.y+this.height/2)-3)
        if(gid >= this.cloudTilesStartIndex && gid <= this.cloudTilesEndIndex){
        //console.log('cloud');
        this.falling = false;
        this.jumping = false;
        this.vy = 0;
        this.pos.y = this.prevY;
        }
    } 
    
    
    //------------------------------------------------------------------------------------

    if(this.tileCollisionCheck(world, this.collideIndex) ){
        if (this.jumping) {
            if (this.vy > 0) { // did we just stop falling?
                //console.log("Just landed from a jump!");
                this.jumping = false;
                this.falling = false;
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
            let tile = world.getTileAtPosition(i, j)

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
            let tile = world.getTileAtPosition(i, j)

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
    // if(!this.spritesheetV2.animations[animationName]){
        this.currentAnimation = this.spritesheet.animations[animationName];
    // } else {
    //     this.currentAnimation = this.spritesheetV2.animations[animationName];
    // }
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
        frameWidth: 31,
        frameHeight: 45,
        animations: {
            idleLeft: {
                frames: '22..27',
                frameRate: 5
            },
            idleRight: {
                frames: '16..21',
                frameRate: 5
            },
            walkRight: {
                frames: '0..7',
                frameRate: 16
            },
            walkLeft: {
                frames: '8..15',
                frameRate: 16
            },
            fallingLeft:{
                frames: 31
            },
            fallingRight: {
                frames: 30
            },
            airLeft: {
                frames: 29
            },
            airRight: {
                frames: 28
            },
            crouchLeft: {
                frames: 33
            },
            crouchRight: {
                frames: 32
            }

        }
    })

    // this.spritesheetV2 = new SpriteSheet({
    //     image: img.playerRight,
    //     frameWidth: 50,
    //     frameHeight: 49,
    //     animations: {
    //         idleRight: {
    //             frames: 0
    //         }
    //     }
    // })
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

Player.flipMosaic = function() {
    if (!G.mosaicFlipped) return; // might not be enabled
    if (this.inTheFlip) {
        // inverted deepnight pixel bevels
        G.mosaic.canvas.style.display = 'none';
        G.mosaicFlipped.canvas.style.display = 'block';
    } else {
        // normal deepnight pixel bevels
        G.mosaic.canvas.style.display = 'block';
        G.mosaicFlipped.canvas.style.display = 'none';
    }
}

Player.hurt = function(params){

    if(!this.hurtCooldown){
        let hurtParticleCount = 20;
        while(--hurtParticleCount){
            G.particles.push(new Particle(
                this.pos.x,
                this.pos.y,
                -this.vx/50+rndFloat(-2,2),
                -this.vy/50+rndFloat(-2,2),
                4,
                2, 
                2,
                20,
                'blood'
            ))
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

    }//end cooldown check

}//end player.hurt

Player.died = function(params){
    console.log('dead');
    G.loadMap({map:'room01', spawnPoint:'PlayerStart'});
    this.health = this.maxHealth;
    G.Records.playerStats.totals.deaths++;
    console.log(`Steps: ${G.Records.playerStats.totals.stepsTaken}, and Deaths: ${G.Records.playerStats.totals.deaths}`)
    G.Records.resetSession();
}

Player.pickup = function(params){
    console.log(params);
    G.Records.playerStats.totals.nanitesCollected+=params.amount
    let particles = 40;
    while(--particles){
        G.particles.push(new Particle(
            params.x,
            params.y,
            rndFloat(-5,5),
            rndFloat(-5,10),
            12,
            1, 
            1,
            30,
            'particle'
        ))
    }
}

Player.crossedOver = function() {
let particles = 10;
while(--particles){
    G.particles.push(new Particle(
        this.pos.x,
        this.pos.y,
        -this.vx/50+rndFloat(-2, 2),
        -this.vy/50+rndFloat(-2, 2),
        22,
        3, 
        3,
        40,
        'crossBubble'
    ))
}
}

//----------------------------------------------------------------------------------
export default Player