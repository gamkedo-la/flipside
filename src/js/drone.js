// Drone - a horizontally patrolling unit

import { rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import G from './G.js';

const DRONE_W = 32;
const DRONE_H = 26;
const DRONE_SPEED = 0.25;
// Set to true for verbose debug info
const DRONE_DEBUG = false; 
// Only seek player if farther away than this
const DRONE_SEEK_DIST = 16;
// Shoot at the player if we get closer than this
const DRONE_FIRE_DIST = 64;

// Patrols the area near pos, back and forth horizontally
const Drone = function Drone(obj){
    this.start = {x:obj.x, y:obj.y};
    this.name = obj.name;
    this.type = "EnemyTinydrone";//May need to change, there is no image yet
    this.currentAnimation = 'idle';
    this.target = {x: obj.x + 24, y: obj.y };
    this.speed = 0.001;
    // width and height are hitbox, not drawsize
    this.width = DRONE_W; 
    this.height = DRONE_H;
    this.rect = {};
    this.health = 5;
    this.healthMax = 5;
    this.pos = {x: obj.x, y: obj.y-11};
    // Center the sprite when rendering
    this.drawOffset = {x: 4, y: -2}; 
    // Where bullets come from
    this.gunOffset = {leftX: -14, rightX: 20, y: -3}; 
    this.wasHit = false;
    this.timeSinceHit = 0;
    // In seconds
    this.flashTime = 0.05;
    this.brightTime = 0;

    this.healthBar = {
        xOffset: 0,
        yOffset: -DRONE_H,
        width: DRONE_W, 
        height: 2
    }
    return this;
}

// Can we walk forward?
Drone.prototype.canWalkForward = function() {
    // How far to look ahead
    let tilesToLookX = this.goingLeft ? -2 : 2;
    let tilesToLookY = 1;
    let tx = 0;
    let ty = 0;
    let blocked = false;
    let maxTileIndex = G.player.collideIndex;
    let tileAhead = 0;

    // Get the coordinates for the tile ahead
    tx = Math.round(this.pos.x / G.world.tileSize) + tilesToLookX; 
    ty = Math.round(this.pos.y / G.world.tileSize) - tilesToLookY;
    tileAhead = G.world.getTileAtPosition(tx,ty); 
    
    // It has to be air to let us through
    blocked = (tileAhead > maxTileIndex);

    // highlight the problem
    this.debugX = tx * G.world.tileSize - G.view.x;
    this.debugY = ty * G.world.tileSize - G.view.y;
    this.debugC = blocked ? 4 : 11; // reddish or greenish

    if (DRONE_DEBUG) {
        console.log('Drone debug: canWalkForward '+(blocked?'BLOCKED ':'ok ')+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1)+' says tile '+tx+','+ty+' is tile #' + tileAhead);
    }

    return !blocked; 
}

Drone.prototype.flameThrower = function() {
    let max = rndInt(0,5);

    for (let i=0; i<max; i++) {
        G.particles.spawn(
            this.goingLeft ? this.pos.x+this.gunOffset.leftX : this.pos.x+this.gunOffset.rightX, // gunXOffset
            this.pos.y + this.gunOffset.y, // gunYOffset
            this.goingLeft? rndFloat(-100,-120) : rndFloat(100,120),
            rndFloat(-20,20),
            rndInt(1,9), // black to red to yellow
            2, 
            2,
            20,
            G.FIRE
        ) ;   
    }
}  

Drone.prototype.update = function update(dt){
    // Update drone animation
    this.currentAnimation.update(dt);

    // FIXME: entity pos is 0,0,0 at spawn
    // if (this.pos.x==0 && this.pos.y==0) {
    //     this.pos = this.start;
    // }

    // Check the direction the drone is facing, left or right
    this.goingLeft = G.player.pos.x < this.pos.x;
    // Distance between drone and player
    let horizDist = Math.abs(G.player.pos.x - this.pos.x);

    // Drone movement
    if (horizDist > DRONE_SEEK_DIST && this.canWalkForward()) {
        this.pos.x += this.goingLeft ? -DRONE_SPEED : DRONE_SPEED;
    }

    // Shoot the player
    if (horizDist < DRONE_FIRE_DIST) {
            this.flameThrower();
    }

    // Look in direction of movement
    this.goingLeft ? this.play('idleLeft') : this.play('idleRight');

    // Drone hitbox
    this.rect = {
        top: this.pos.y - this.width/2,
        left: this.pos.x - this.height/2,
        right: this.pos.x + this.height/2,
        bottom: this.pos.y + this.height/2
    }
    
    // Check if collide with player
    if(rectCollision(this.rect, G.player.rect)){
        if(this.name) {
            G.MSG.dispatch('hurt', {amount: 5, message:{text: this.name, speaker:G.PORTRAIT_FLIPDRONE}});
        } else {
            G.MSG.dispatch('hurt', {amount: 5});
        }
    }

    // Check if drone was hit by player's bullets
    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>=0){
            if(pointInRect(G.bullets.pool[i+G.PARTICLE_X], G.bullets.pool[i+G.PARTICLE_Y], this.rect)){
                G.bullets.kill(i)
                this.wasHit = true;
                this.health--;
            }
        }
    }

    // Drone shines when hit by player's bullets
    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.EnemyFlipDrone;
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.EnemyFlipDrone;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.EnemyFlipDrone) {
                    this.spritesheet.image = G.img.EnemyFlipDrone;
                } else {
                    this.spritesheet.image = G.loader.brightImages.EnemyFlipDrone;
                }
            }
            
        }
    }

    // Check if drone died
    if(this.health <= 0) { 
        this.kill(); 
    }
}

Drone.prototype.render = function render(glRender, dt){
    // Draw health bar
    if(this.health < this.healthMax){
        let fillWidth = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        G.rb.fillRect(this.pos.x + this.healthBar.xOffset - G.view.x,
            this.pos.y + this.healthBar.yOffset - G.view.y,
            fillWidth,
            this.healthBar.height,
            8)
    }

    if(!glRender) {
        // Draw the drone
        this.currentAnimation.render({
            x: Math.floor(this.pos.x-this.width/2-G.view.x + this.drawOffset.x),
            y: Math.floor(this.pos.y-this.height/2-G.view.y + this.drawOffset.y),
            width: DRONE_W,
            height: DRONE_H
        });
    }

    if (DRONE_DEBUG) {
        // Draw collision box
        G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
        // Draw "this wall/gap got in my way" tile
        if (this.debugC) G.rb.fillRect(this.debugX,this.debugY,G.world.tileSize,G.world.tileSize,this.debugC);
    }
}

Drone.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

Drone.prototype.getSpriteSheetFrame = function getSpriteSheetFrame() {
    return this.currentAnimation.frames[this.currentAnimation.currentFrame];
}

Drone.prototype.init = function init(){
    this.spritesheet = new SpriteSheet({
        image: G.img.EnemyFlipDrone,
        frameWidth: DRONE_W,
        frameHeight: DRONE_H,
        animations: {
            idleRight: {
                frames: '2..3',
                frameRate: 4
            },
            idleLeft: {
                frames: '0..1',
                frameRate: 4
            }
        }
    })

    // Must have an anim set at start, or .currentAnimation is null
    this.play('idleLeft');
    
    return this;
}

Drone.prototype.kill = function kill(){
    // Play sound when drone dies
    G.audio.playSound(G.sounds.splode1, G.audio.calculatePan(this.pos.x), G.audio.calcuateVolumeDropoff(this.pos)*0.5, 1, false);

    let splodeCount = 32;
    while(--splodeCount){
        G.particles.spawn(
            this.pos.x,
            this.pos.y,
            rndFloat(-1.5, 1.5), 
            rndFloat(-0.5, 1.5),
            27,
            2,
            2,
            15,
            3
        )
    }
    
    let dropCount = 10;
    const dropType = (rndInt(0,10) < 5 ? G.PICKUP_NANITE : G.PICKUP_HEALTH);
    while(--dropCount) {
        G.pickups.spawn(
            this.pos.x+rndInt(-5,5),
            this.pos.y-10+rndInt(-5,5),
            rndFloat(-30, 30), 
            rndFloat(-30),
            11,
            6,
            6,
            180,
            dropType
        )
    }
    
    // Leave flipspace after dead
    G.worldFlipped.tileFillCircle(
        Math.floor(this.pos.x/8),
        Math.floor(this.pos.y/8),
        4,
        3 + G.FLIPSPACE_TIME
    ); 

    // Remove drone from game
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default Drone;