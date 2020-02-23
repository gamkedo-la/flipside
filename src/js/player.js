import { clamp } from './math.js';
import SpriteSheet from './spritesheet.js';
import { rndFloat, rndInt, range } from './math.js';
import { Transitioner } from './graphics.js';
import { rectCollision, pointInRect } from './util.js';
import { showMessage } from "./UI.js";
import G from './G.js';

const Player = {
    spritesheet:{},
    currentAnimation:{},
    facingLeft: false,
    wasHit: false,
    timeSinceHit: 0,
    flashTime: 0.1,//seconds
    brightTime: 0,

    coyoteTime: 10,
    maxCoyoteTime: 10,
    canJump: true,

    nanitesCollected: 0,
    nanitesMax: 3000,

    hasPugGun: false,
    hasHighJump: false,

    collideIndex: G.collideIndex,
    hazardTilesStartIndex: G.hazardTilesStartIndex,
    hazardTilesEndIndex: G.hazardTilesEndIndex,
    cloudTilesStartIndex: G.cloudTilesStartIndex,
    cloudTilesEndIndex: G.cloudTilesEndIndex,

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
    hurtCooldownMax: 30,
    hurtPush: 400,

    gunCooldown: 0,
    gunCooldownMax: 7,

    doorCooldown: 0,

    bulletVXdefault: 300,
    bulletVX: 300,
    bulletVY: 300,
    bulletUp: -300,
    bulletDown: 300,

    flipBar: {
        xOffset: -12,
        yOffset: -18,
        width: 40,
        height: 4
    },

    gunOffsets: {
        standingLeft: -11,
        standingRight: 14,
        pointedUpLeft: -2,
        pointedUpRight: 7,
        pointedUpY: -22,
        standingY:-2,
        crouchingY:6,
        pointedDownY:6,
        pointedDownX:3
    },


    //these are set by conditionals in gunOffsets ^^^,  don't set them here.
    gunOffset: {
        leftX: 0,
        rightX: 0,
        y: 0
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
        maxVel: { x: 130, y: 290 },
        accel: 10,
        jumpVel: 170,
        highJumpVel: 290,
        gravity: G.GRAVITY,
        friction: 0.7
    },

    physicsFlip: {
        maxVel: { x: 80, y: 80 },
        accel: 10,
        jumpVel: 70,
        gravity: 0,
        friction: 0.99
    }
}

Player.update = function update(dt, world, worldFlipped, worldForeground){
    this.world = world;
    this.fallthru = false;
    const { MSG } = G;

    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.player
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.player;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.player) {
                    this.spritesheet.image = G.img.player;
                } else {
                    this.spritesheet.image = G.loader.brightImages.player;
                }
            }

        }
    }
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
    if( this.withinCheck(worldFlipped, function(tile){return tile >= 3}) ){
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

    //check pickups for overlap, and pick them up
    for(let i = 0; i < G.pickups.pool.length; i+= G.bullets.tuple){
        if(G.pickups.pool[i]>=0){

            if(pointInRect(G.pickups.pool[i+1], G.pickups.pool[i+2], this.rect)){
                let x = G.pickups.pool[i+1],
                    y = G.pickups.pool[i+2];
                    G.particles.spawn(
                        x,
                        y,
                        rndFloat(-30, 30),
                        rndFloat(-50, -70),
                        11,
                        1,
                        1,
                        25,
                        G.PICKUP_DEATH
                    )
                G.pickups.kill(i);
                this.nanitesCollected += 1;

            }
        }
    }




}

Player.zapWalls = function() {

    const dist = 64;
    const walk = 20;
    const width = 1;
    const chaos = 0;
    const segs = 64; // fixme, optimize!
    const rgba = 'rgba(0,255,255,1)';
    const spd1 = 666;
    const spd2 = 555;
    let now = performance.now();
    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
        this.pos.x+dist-G.view.x+Math.cos(now/spd1)*walk,
        this.pos.y+dist-G.view.y+Math.cos(now/spd2)*walk,
        width, chaos, segs, rgba, true);
    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
        this.pos.x-dist-G.view.x+Math.cos(now/spd1)*-walk,
        this.pos.y+dist-G.view.y+Math.cos(now/spd2)*walk,
        width, chaos, segs, rgba, true);
    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
        this.pos.x+dist-G.view.x+Math.cos(now/spd1)*walk,
        this.pos.y-dist-G.view.y+Math.cos(now/spd2)*-walk,
        width, chaos, segs, rgba, true);
    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
        this.pos.x-dist-G.view.x+Math.cos(now/spd1)*-walk,
        this.pos.y-dist-G.view.y+Math.cos(now/spd2)*-walk,
        width, chaos, segs, rgba, true);

}

Player.render = function render(dt, world, worldFlipped, worldForeground){

    // temp debug test - bolts that collide with walls!
    //this.zapWalls();

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
    //G.rb.line(dX, dY, dX, dY-3, 11);

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
        G.particles.spawn(
            this.pos.x,
            this.pos.y,
            -this.vxx,
            -this.vy,
            22,
            3,
            3,
            50,
            1
        )
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
    let max = 10;
    // big poof
    for (let i=0; i<max; i++) {
        G.particles.spawn(
            rndInt(-5,5)+(this.facingLeft ? this.pos.x+this.gunOffset.leftX -12 : this.pos.x+this.gunOffset.rightX) + 8, // gunXOffset
            (this.pos.y + this.gunOffset.y )+rndInt(-2,2), // gunYOffset
            this.facingLeft ? rndInt(-40,-20) : rndInt(20, 40),
            rndInt(-70,-10),
            22, // yellow
            12,
            12,
            rndInt(5,15),
            G.MUZZLESMOKE
        ) ;
    }

    max = rndInt(12,24);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.spawn(
            this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX, // gunXOffset
            this.pos.y + this.gunOffset.y, // gunYOffset
            this.facingLeft?rndFloat(-200,-400):rndFloat(200,400),
            rndFloat(-200,200),
            rndInt(1,9), // black to red to yellow
            2,
            2,
            4,
            0
            ) ;
    }
}

// emit a poof when we hit the ground after falling
Player.landedFX = function() {
    // console.log("landedFX!");
    let max = rndInt(4,8);
    // small sparks
    for (let i=0; i<max; i++) {
        G.particles.spawn(
            this.pos.x+4+rndFloat(-2,2),
            this.pos.y+20+rndFloat(-2,-6), // foot offset
            rndFloat(-30,30),
            rndFloat(-3,-15),
            rndInt(58,63), // sandy dirt color
            1,
            1,
            25,
            0
        ) ;
    }
}

Player.normalPhysics = function normalPhysics(dt, world, worldFlipped){
    this.aimingUp = false;
    this.gravity = this.physicsNormal.gravity;
    this.friction = this.physicsNormal.friction;
    this.maxVel = this.physicsNormal.maxVel;
    this.accel = this.physicsNormal.accel;
    this.jumpVel = this.hasHighJump ? this.physicsNormal.highJumpVel : this.physicsNormal.jumpVel;

    if(this.input.up){
        this.aimingUp = true;
        this.bulletVX = 0;
        this.bulletVY = this.bulletUp;
        this.gunOffset.y = this.gunOffsets.pointedUpY;
        this.gunOffset.leftX = this.gunOffsets.pointedUpLeft;
        this.gunOffset.rightX = this.gunOffsets.pointedUpRight;

    } else if(this.input.down && (this.inAir || this.falling) ){
        this.bulletVX = 0;
        this.bulletVY = this.bulletDown;
        this.gunOffset.y = this.gunOffsets.pointedDownY;
        this.gunOffset.leftX = this.gunOffsets.pointedDownX;
        this.gunOffset.rightX = this.gunOffsets.pointedDownY;

    }else{
        this.bulletVX = this.bulletVXdefault;
        this.bulletVY = 0;
        this.gunOffset.y = this.gunOffsets.standingY;
        this.gunOffset.leftX = this.gunOffsets.standingLeft;
        this.gunOffset.rightX = this.gunOffsets.standingRight;
    }

    if(this.input.down && !this.inAir && !this.falling){
        this.crouching = true;
    }else{this.crouching = false}

    if(this.crouching){
        this.gunOffset.y = this.gunOffsets.crouchingY;
    }
    if(this.hasPugGun){
        if(this.input.primaryFire && !this.gunCooldown){ //fire gun
            this.gunCooldown = this.gunCooldownMax;
            this.muzzleFlash();
            G.audio.playSound(G.sounds.playerShoot, 0, 0.5, 1, false);
            G.bullets.spawn(
                this.facingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX,
                this.pos.y + this.gunOffset.y,
                this.facingLeft ? -this.bulletVX : this.bulletVX,
                this.bulletVY,
                22,
                3,
                3,
                50,
                4
            )
        } else if (this.gunCooldown) {
            this.gunCooldown--;
        }
    }
    


    this.inAir = false;
    this.falling = false;


    if(this.vy < 10 && this.vy != 0){
        //this.falling = true;
        // console.log("in Air!")
        this.inAir = true;
        if(this.hasPugGun){
            this.facingLeft ? this.play('airLeft') : this.play('airRight');
        }else{
            this.facingLeft ? this.play('airLeftNoGun') : this.play('airRightNoGun');
        }
        
    }
    if(this.vy > 10){
        this.falling = true;
        if(this.hasPugGun){
            this.facingLeft ? this.play('fallingLeft') : this.play('fallingRight');
        }else{
            this.facingLeft ? this.play('fallingLeftNoGun') : this.play('fallingRightNoGun');
        }
        
        // console.log("Falling!!")
    }
    if(Math.abs(this.vx) < 0.9 && !this.inAir && !this.falling){
        if(this.hasPugGun){
            this.facingLeft ? this.play('idleLeft') : this.play('idleRight');
        }
        else{
            this.facingLeft ? this.play('idleLeftNoGun') : this.play('idleRightNoGun');
        }
        
    }
    if(this.vx < -1 && this.input.left && !this.inAir && !this.falling){
        G.Records.playerStats.stepsTaken+= 1;
        this.facingLeft = true;
        this.hasPugGun ? this.play('walkLeft') : this.play('walkLeftNoGun');
    }
    if(this.vx > 1 && this.input.right && !this.inAir && !this.falling){
        G.Records.playerStats.stepsTaken+= 1;
        this.facingLeft = false;
        this.hasPugGun ? this.play('walkRight') : this.play('walkRightNoGun');
    }
    if(this.falling){
        this.coyoteTime -=1;
        if(this.coyoteTime < 0){this.canJump = false};
    }else{this.canJump = true;}

    if(this.crouching){
        if(this.hasPugGun){
            this.facingLeft ? this.play('crouchLeft') : this.play('crouchRight');
        }else{
            this.facingLeft ? this.play('crouchLeftNoGun') : this.play('crouchRightNoGun');
        }
        
    }

    if(this.input.down && ( this.inAir || this.falling ) ){
        this.play('pointedDown');
    }
    if(this.input.up){
        if(this.hasPugGun){
            this.facingLeft ? this.play('pointedUpLeft') : this.play('pointedUpRight');
        }
        else{
            //this.facingLeft ? this.play('pointedUpLeftNoGun') : this.play('pointedUpRightNoGun');
        }
        
    }

    // Player moving left
    if(this.input.left && (!this.crouching && !this.aimingUp)){
        this.vx -= this.accel;

    }
    // Player moving right
    else if(this.input.right && (!this.crouching && !this.aimingUp)){
        this.vx += this.accel;
    }
    else{this.vx *= this.friction}

    if(this.canJump && this.input.jump && !this.jumping){
        if(this.input.down){
            this.fallthru = true;
            this.jumping = true;
            this.input.jump = false;
            this.pos.y+=5;
            G.audio.playSound(G.sounds.footstep, 0, 0.5, 1, false)
        } else {
            this.vy = -this.jumpVel
            this.jumping = true;
            this.input.jump = false;
            this.canJump = false;
            this.hasHighJump ? G.audio.playSound(G.sounds.highJump, 0, 0.5, 1, false) : G.audio.playSound(G.sounds.jump, 0, 0.5, 1, false)

        }

    }
    else{
        this.vy += this.gravity;
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
                G.MSG.dispatch('hurt', { amount: 200 })
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
            if (this.vy >= 0) { // did we just stop falling?
                //console.log("Just landed from a jump!");
                this.jumping = false;
                this.falling = false;
                this.coyoteTime = this.maxCoyoteTime;
                this.landedFX();

            } else if (this.vy < 0) {
                //console.log('ceiling');
            }
        }

        this.falling = false;
        //this.canJump = true;
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
            idleLeftNoGun: {
                frames: '68..69',
                frameRate: 1
            },
            idleRightNoGun: {
                frames: '70..71',
                frameRate: 1
            },
            walkRight: {
                frames: '0..7',
                frameRate: 16
            },
            walkLeft: {
                frames: '8..15',
                frameRate: 16
            },
            walkRightNoGun: {
                frames: '50..57',
                frameRate: 12
            },
            walkLeftNoGun: {
                frames: '58..65',
                frameRate: 12
            },
            fallingLeft:{
                frames: 31
            },
            fallingRight: {
                frames: 30
            },
            fallingLeftNoGun:{
                frames: 67
            },
            fallingRightNoGun: {
                frames: 66
            },
            airLeft: {
                frames: 29
            },
            airRight: {
                frames: 28
            },
            airLeftNoGun: {
                frames: 67
            },
            airRightNoGun: {
                frames: 66
            },
            crouchLeft: {
                frames: 33
            },
            crouchRight: {
                frames: 32
            },
            pointedUpRight: {
                frames: 34
            },
            pointedUpLeft: {
                frames: 35
            },
            crouchLeftNoGun: {
                frames: 73
            },
            crouchRightNoGun: {
                frames: 72
            },
            pointedUpRightNoGun: {
                frames: 74
            },
            pointedUpLeftNoGun: {
                frames: 75
            },
            pointedDown: {
                frames: 36
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
        this.play('pointedUpRightNoGun');
        G.audio.playSound(G.sounds.playerHit, 0, 0.5, 1, false)
        let hurtParticleCount = 20;
        while(--hurtParticleCount){
            G.particles.spawn(
                this.pos.x,
                this.pos.y,
                -this.vx+rndFloat(-60,60),
                -this.vy+rndFloat(-60,60),
                4,
                2,
                2,
                20,
                0
            )
        }

        this.hurtCooldown = this.hurtCooldownMax;
        this.health -= params.amount;
        this.wasHit = true;
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
        if(params.message){
            showMessage(params.message.text, params.message.speaker )
        }
    }//end cooldown check

}//end player.hurt

Player.died = function(params){
    console.log('dead');

    this.health = this.maxHealth;
    if (G.Records && G.Records.playerStats && G.Records.playerStats.totals) {
        G.Records.playerStats.totals.deaths++;
        console.log(`Steps: ${G.Records.playerStats.totals.stepsTaken}, and Deaths: ${G.Records.playerStats.totals.deaths}`)
        G.Records.resetSession();
    } else {
        console.log('G.Records not initialized: ignoring.')
    }

    self.doorCooldown = 60;
    var wipe = new Transitioner().start(G.TRANSITION_DEATH, function(){
        G.loadMap({map:'room01', spawnPoint:'PlayerStart'});
    });
}

Player.pickup = function(params){
    console.log(params);
    G.Records.playerStats.totals.nanitesCollected+=params.amount
    let particles = 40;
    while(--particles){
        G.particles.spawn(
            params.x,
            params.y,
            rndFloat(-50,50),
            rndFloat(-50,50),
            12,
            1,
            1,
            30,
            0
        )
    }
}

Player.crossedOver = function() {
let particles = 10;
while(--particles){
    G.particles.spawn(
        this.pos.x,
        this.pos.y,
        -this.vx/4+rndFloat(-20, 20),
        -this.vy/4+rndFloat(-20, 20),
        22,
        3,
        3,
        40,
        2
    )
}
}

Player.gotPugGun = function() {
    let particles = 10;
    while(--particles){
        G.particles.spawn(
            this.pos.x,
            this.pos.y,
            -this.vx/4+rndFloat(-20, 20),
            -this.vy/4+rndFloat(-20, 20),
            22,
            3,
            3,
            40,
            G.BIGPOWERUP
        )
    }
    }

//----------------------------------------------------------------------------------
export default Player