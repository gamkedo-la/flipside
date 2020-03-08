// FlipSpider - a grappling-hook style movement experiment

import { rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';

const FlipSpider_W = 30;//32;
const FlipSpider_H = 30;//26;
const SPIDER_SPEED = 0.25;
const SPIDER_DEBUG = false; // set to true for verbose debug info
const SPIDER_SEEK_DIST = 16; // only seek player if farther away than this
const SPIDER_FIRE_DIST = 32; // shoot at the player if we get closer than this

// patrols the area near pos, back and forth horizontally
const FlipSpider = function FlipSpider({pos}={}){
    this.start = pos;
    this.type = "flipspider";
    this.currentAnimation = 'idle';
    this.target = {x: pos.x + 24, y: pos.y };
    this.speed = 0.001;
    this.width = FlipSpider_W; // note: width and height are hitbox, not drawsize
    this.height = FlipSpider_H;
    this.rect = {};
    this.health = 32;
    this.healthMax = 32;
    this.pos = {x: pos.x, y: pos.y-11}; // put feet where bottom of Tiled icon appears
    this.drawOffset = {x: -4, y: -2}; // center the sprite when rendering
    this.gunOffset = {leftX: -20, rightX: 10, y: -2}; // where bullets come from
    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.05;//seconds
    this.brightTime = 0;

    this.healthBar = {
        xOffset: 0,
        yOffset: -FlipSpider_H,
        width: FlipSpider_W, 
        height: 2
    }
    return this;
}

// can we walk forward?
FlipSpider.prototype.canWalkForward = function() {
    
    // how far to look ahead
    let xofs = this.goingLeft ? 2 : -2; // tiles to look ahead
    let yofs = 1;
    let tx = 0;
    let ty = 0;
    let blocked = false;
    let maxTileIndex = G.player.collideIndex; //this is a lazy GAMEJAMMERY way to grab this number 
    let tileHit = 0;

    // is there a wall in front of me?
    tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
    ty = Math.round(this.pos.y / G.world.tileSize) - 1; // slightly above the foot tile
    
    tileHit = G.world.getTileAtPosition(tx,ty); 

    blocked = (tileHit > maxTileIndex); // it HAS to be air to let us through

    // if there's no wall, let's check the floor to ensure we don't fall off a ledge
    if (!blocked) { // yet
        // is there any floor in front of me and a bit down?
        tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
        ty = Math.round(this.pos.y / G.world.tileSize) + yofs; // and below
        tileHit = G.world.getTileAtPosition(tx,ty);
        blocked = (tileHit <= maxTileIndex); // as in, it HAS to be solid
    }

    // highlight the problem
    this.debugX = tx * G.world.tileSize - G.view.x;
    this.debugY = ty * G.world.tileSize - G.view.y;
    this.debugC = blocked ? 6 : 13; // reddish or greenish

    if (SPIDER_DEBUG && blocked) console.log('FlipSpider debug: canWalkForward '+(blocked?'BLOCKED ':'ok ')+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1)+' says tile '+tx+','+ty+' is tile #' + tileHit);

    return !blocked; 
}

FlipSpider.prototype.canMoveVert = function(vertSpdInTiles) {
    
    if (!vertSpdInTiles) return true;
    
    // how far to look ahead
    let xofs = 0;
    let yofs = (vertSpdInTiles>0) ? 1 : -2; // look below feet or above head
    let tx = 0;
    let ty = 0;
    let blocked = false;
    let maxTileIndex = G.player.collideIndex;
    let tileHit = 0;

    // is there any floor or ceiling blocking me?
    tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
    ty = Math.round(this.pos.y / G.world.tileSize) + yofs; // and above/below
    tileHit = G.world.getTileAtPosition(tx,ty);
    blocked = (tileHit > maxTileIndex);

    // highlight the problem
    this.debugX = tx * G.world.tileSize - G.view.x;
    this.debugY = ty * G.world.tileSize - G.view.y;
    this.debugC = blocked ? 4 : 11; // reddish or greenish

    if (SPIDER_DEBUG) console.log('FlipSpider debug: canMoveVert '+(blocked?'BLOCKED ':'ok ')+'by tile '+tx+','+ty+' is tile #' + tileHit);

    return !blocked; 
}

FlipSpider.prototype.flameThrower = function() {
    //console.log("Flame Thrower!");
    let max = rndInt(0,5);
    for (let i=0; i<max; i++) {
        G.particles.spawn(
            this.goingLeft ? this.pos.x+this.gunOffset.rightX : this.pos.x+this.gunOffset.leftX, // gunXOffset
            this.pos.y + this.gunOffset.y, // gunYOffset
            this.goingLeft?rndFloat(100,120):rndFloat(-100,-120),
            rndFloat(-20,20),
            24,//rndInt(26,29), // flippish colours
            2, 
            2,
            20,
            G.POISONPARTICLE
        ) ;   
    }
}  

FlipSpider.prototype.update = function update(dt){
    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.flipspider;
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.flipspider;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.flipspider) {
                    this.spritesheet.image = G.img.flipspider;
                } else {
                    this.spritesheet.image = G.loader.brightImages.flipspider;
                }
            }
            
        }
    }
    this.currentAnimation.update(dt);

    // FIXME: entity pos is 0,0,0 at spawn
    if (this.pos.x==0 && this.pos.y==0) {
        this.pos = this.start;
    }

    // simple ai - follow with fall avoidance
    this.goingLeft = G.player.pos.x > this.pos.x; // try to move toward the player
    let horizDist = Math.abs(G.player.pos.x - this.pos.x);

    // ultra simplistic movement for now
    if (horizDist > SPIDER_SEEK_DIST && this.canWalkForward()) {
        this.pos.x += this.goingLeft ? SPIDER_SPEED : -SPIDER_SPEED;
    }

    // move up and down but collide w ceiling/wall
    let grapplePower = Math.round(Math.sin(performance.now()/1200)*2);
    if (this.canMoveVert(grapplePower)) {
        this.pos.y += grapplePower;
    }

    // maybe shoot the player
    if (horizDist < SPIDER_FIRE_DIST) {
        //if (Math.random()<0.02) {
            this.flameThrower();
        //}
    }
    
    // oscillate like a sin wave if player not nearby
    //this.pos.x = Math.round(lerp(this.start.x, this.target.x, Math.sin(performance.now()*this.speed)));
    //this.pos.y = Math.round(lerp(this.start.y, this.target.y, Math.sin(performance.now()*this.speed)));

    this.rect = { // FIXME: new obj every frame
        top: this.pos.y - this.width/2,
        left: this.pos.x - this.height/2,
        right: this.pos.x + this.height/2,
        bottom: this.pos.y + this.height/2
    }
    var self = this;
    
    if(rectCollision(this.rect, G.player.rect)){
        G.MSG.dispatch('hurt', {amount: 5});
    }

    // look at player
    // G.player.pos.x < this.pos.x ? this.play('idleRight') : this.play('idleLeft');

    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>=0){
            if(pointInRect(G.bullets.pool[i+G.PARTICLE_X], G.bullets.pool[i+G.PARTICLE_Y], this.rect)){
                // ONHIT:
                G.bullets.kill(i)
                this.wasHit = true;
                this.health--;
                // generous! woot
                G.pickups.spawn(
                    this.pos.x+rndInt(-5,5),
                    this.pos.y-10+rndInt(-5,5),
                    rndFloat(-30, 30), 
                    rndFloat(-30),
                    11,
                    6,
                    6,
                    180,
                    G.PICKUP_NANITE
                )

            }
        }
    }

    // look in direction of movement
    this.goingLeft ? this.play('idleLeft') : this.play('idleRight');

    if(this.health <=0){ this.kill(); }


}

FlipSpider.prototype.zapWalls = function() {
    const disth = 20;
    const distv = 100;
    const walkv = 20;
    const walkh= 20;
    const width = 2;
    const chaos = 4;
    const segs = 32; // fixme, optimize!
    const spd1 = 666;
    const spd2 = 555;
    const spd3 = 444;
    let now = performance.now();
    let rgba;

    rgba = 'rgba('+ // pulsing rainbow
    Math.floor(((Math.cos(now/spd1)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd2)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd3)+1)/2)*255)+','+
    '1)';
    //console.log(rgba);

    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
    this.pos.x+disth-G.view.x+Math.cos(now/spd1)*walkh,
    this.pos.y+distv-G.view.y+Math.cos(now/spd2)*walkv,
    width, chaos, segs, rgba, true);

    rgba = 'rgba('+ // pulsing rainbow
    Math.floor(((Math.cos(now/spd3)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd2)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd1)+1)/2)*255)+','+
    '1)';

    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
    this.pos.x-disth-G.view.x+Math.cos(now/spd1)*-walkh,
    this.pos.y+distv-G.view.y+Math.cos(now/spd2)*walkv,
    width, chaos, segs, rgba, true);

    rgba = 'rgba('+ // pulsing rainbow
    Math.floor(((Math.cos(now/spd2)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd1)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd3)+1)/2)*255)+','+
    '1)';

    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
    this.pos.x+disth-G.view.x+Math.cos(now/spd1)*walkh,
    this.pos.y-distv-G.view.y+Math.cos(now/spd2)*-walkv,
    width, chaos, segs, rgba, true);

    rgba = 'rgba('+ // pulsing rainbow
    Math.floor(((Math.cos(now/spd3)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd1)+1)/2)*255)+','+
    Math.floor(((Math.cos(now/spd2)+1)/2)*255)+','+
    '1)';

    G.lightning.bolt(this.pos.x-G.view.x,this.pos.y-G.view.y,
    this.pos.x-disth-G.view.x+Math.cos(now/spd1)*-walkh,
    this.pos.y-distv-G.view.y+Math.cos(now/spd2)*-walkv,
    width, chaos, segs, rgba, true);

}

FlipSpider.prototype.render = function render(glRender, dt){
    //console.log("FlipSpider is rendering at "+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1))

    this.zapWalls(); // legs raycast to walls/floors/ceilings

    if(this.health < this.healthMax){
        let fillWidth = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        G.rb.fillRect(this.pos.x + this.healthBar.xOffset - G.view.x,
            this.pos.y + this.healthBar.yOffset - G.view.y,
            fillWidth,
            this.healthBar.height,
            8)
    }

    if(!glRender) {
        this.currentAnimation.render({
            x: Math.floor(this.pos.x-this.width/2-G.view.x + this.drawOffset.x),
            y: Math.floor(this.pos.y-this.height/2-G.view.y + this.drawOffset.y),
            width: FlipSpider_W,
            height: FlipSpider_H
        });
    }

    if (SPIDER_DEBUG) {
        // draw collision box
        G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
        // draw "this wall/gap got in my way" tile
        if (this.debugC) G.rb.fillRect(this.debugX,this.debugY,G.world.tileSize,G.world.tileSize,this.debugC);
    }
    //G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
}

FlipSpider.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

FlipSpider.prototype.getSpriteSheetFrame = function getSpriteSheetFrame() {
    return this.currentAnimation.frames[this.currentAnimation.currentFrame];
}

FlipSpider.prototype.init = function init(){

    //console.log("FlipSpider init...");
    this.spritesheet = new SpriteSheet({
        image: G.img.flipspider,
        frameWidth: FlipSpider_W,
        frameHeight: FlipSpider_H,
        animations: {
            idleRight: {
                frames: '8..15',
                frameRate: 7
            },
            idleLeft: {
                frames: '0..7',
                frameRate: 7
            }
        }
    });



    //must have an anim set at start, or .currentAnimation is null
    this.play('idleLeft');
    
    return this;
}

FlipSpider.prototype.kill = function kill(){
    //splodey splode
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
            while(--dropCount){
                G.pickups.spawn(
                    this.pos.x+rndInt(-5,5),
                    this.pos.y-10+rndInt(-5,5),
                    rndFloat(-30, 30), 
                    rndFloat(-30),
                    11,
                    6,
                    6,
                    180,
                    G.PICKUP_NANITE
                )
            }

    
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default FlipSpider;
