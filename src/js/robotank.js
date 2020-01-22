// RoboTank - a horizontally patrolling tank unit

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";

const ROBOTANK_W = 32;
const ROBOTANK_H = 24;
const ROBO_SPEED = 0.25;
const ROBO_DEBUG = false; // set to true for verbose debug info

// patrols the area near pos, back and forth horizontally
const RoboTank = function RoboTank({pos}={}){
    this.start = pos;
    this.currentAnimation = 'idle';
    this.target = {x: pos.x + 24, y: pos.y }
    
    this.speed = 0.001;
    //width and height are hitbox, not drawsize
    this.width = ROBOTANK_W;
    this.height = ROBOTANK_H;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    
    // FIXME these seems strange
    // offset so that in Tiled editor the center of the patrol zone
    // is the bottom center of the editor obj rect

    this.pos = {x: pos.x, y: pos.y-10};

    // Unfortunately this isn't possible. TileObject XY is upperLeft, can't be changed AFAIk. 
    this.drawOffset = {x: 4, y: -7}; 

    this.healthBar = {
        xOffset: 0,
        yOffset: -ROBOTANK_H,
        width: ROBOTANK_W, 
        height: 2
    }
    return this;
}

// can we walk forward?
RoboTank.prototype.canWalkForward = function() {
    
    // how far to look ahead
    let xofs = this.goingLeft ? 2 : -2; // tiles to look ahead
    let yofs = 1;
    let tilePos = {};
    let blocked = false;
    let maxTileIndex = G.player.collideIndex; // FIXME this is a lame way to grab this number
    let tileHit = 0;

    // is there a wall in front of me?
    tilePos.tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
    tilePos.ty = Math.round(this.pos.y / G.world.tileSize) - 1; // slightly above the foot tile
    tileHit = G.world.getTileAtPosition(tilePos);

    blocked = (tileHit > maxTileIndex); // it HAS to be air to let us through

    // if there's no wall, let's check the floor to ensure we don't fall off a ledge
    if (!blocked) { // yet
        // is there any floor in front of me and a bit down?
        tilePos.tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
        tilePos.ty = Math.round(this.pos.y / G.world.tileSize) + yofs; // and below
        tileHit = G.world.getTileAtPosition(tilePos);
        blocked = (tileHit <= maxTileIndex); // as in, it HAS to be solid
    }

    // highlight the problem
    this.debugX = tilePos.tx * G.world.tileSize - G.view.x;
    this.debugY = tilePos.ty * G.world.tileSize - G.view.y;
    this.debugC = blocked ? 4 : 11; // reddish or greenish

    if (ROBO_DEBUG) console.log('RoboTank debug: canWalkForward '+(blocked?'BLOCKED ':'ok ')+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1)+' says tile '+tilePos.tx+','+tilePos.ty+' is tile #' + tileHit);

    return !blocked; 
}

RoboTank.prototype.update = function update(dt){

    this.currentAnimation.update(dt);

    // FIXME: entity pos is 0,0,0 at spawn
    if (this.pos.x==0 && this.pos.y==0) {
        this.pos = this.start;
    }

    // simple ai - follow with fall avoidance
    this.goingLeft = G.player.pos.x > this.pos.x; // try to move toward the player

    // ultra simplistic movement for now
    if (this.canWalkForward()) {
        this.pos.x += this.goingLeft ? ROBO_SPEED : -ROBO_SPEED;
    }
    
    // oscillate like a sin wave if player not nearby
    //this.pos.x = Math.round(lerp(this.start.x, this.target.x, Math.sin(performance.now()*this.speed)));
    //this.pos.y = Math.round(lerp(this.start.y, this.target.y, Math.sin(performance.now()*this.speed)));

    this.rect = {
        top: this.pos.y - this.width/2,
        left: this.pos.x - this.height/2,
        right: this.pos.x + this.height/2,
        bottom: this.pos.y + this.height/2
    }
    var self = this;
    G.bullets.forEach(function(bullet){
        if(rectCollision(bullet.rect, self.rect)){
            let splodeCount = 10;
            while(--splodeCount){
                G.particles.push(new Particle({
                    x: bullet.pos.x,
                    y: bullet.pos.y,
                    vx: (bullet.vx > 0 ? -1 : 1)+ rndFloat(-1, 1), 
                    vy: rndFloat(1, 2),
                    life: 10,
                    color: 27,
                    width: 1,
                    height: 1,
                    type: 'bg'
                }))
            }
            bullet.kill();
            
            self.health--;
        }
    });

    if(rectCollision(this.rect, G.player.rect)){
        G.MSG.dispatch('hurt', {amount: 5});
    }

    // look at player
    // G.player.pos.x < this.pos.x ? this.play('idleRight') : this.play('idleLeft');

    // look in direction of movement
    this.goingLeft ? this.play('idleLeft') : this.play('idleRight');

    if(this.health <=0){ this.kill(); }


}

RoboTank.prototype.render = function render(dt){
    //console.log("Robotank is rendering at "+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1))
    if(this.health < this.healthMax){
        let fillWidth = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        G.rb.fillRect(this.pos.x + this.healthBar.xOffset - G.view.x,
            this.pos.y + this.healthBar.yOffset - G.view.y,
            fillWidth,
            this.healthBar.height,
            8)
    }
    this.currentAnimation.render({
        x: Math.floor(this.pos.x-this.width/2-G.view.x + this.drawOffset.x),
        y: Math.floor(this.pos.y-this.height/2-G.view.y + this.drawOffset.y),
        width: 32,
        height: 26
    });

    //G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);

    if (this.debugC) G.rb.fillRect(this.debugX,this.debugY,G.world.tileSize,G.world.tileSize,this.debugC);
}

RoboTank.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

RoboTank.prototype.init = function init(){

    //console.log("RoboTank init...");
    this.spritesheet = new SpriteSheet({
        image: G.img.EnemyRoboTank,
        frameWidth: ROBOTANK_W,
        frameHeight: ROBOTANK_H,
        animations: {
            idleRight: {
                frames: '0..1',
                frameRate: 4
            },
            idleLeft: {
                frames: '2..3',
                frameRate: 4
            }
        }
    })
    //must have an anim set at start, or .currentAnimation is null
    this.play('idleLeft');
    
    return this;
}

RoboTank.prototype.kill = function kill(){
    //splodey splode
    let splodeCount = 32;
            while(--splodeCount){
                G.particles.push(new Particle({
                    x: this.pos.x,
                    y: this.pos.y,
                    vx: rndFloat(-1.5, 1.5), 
                    vy: rndFloat(-0.5, 1.5),
                    life: 15,
                    color: 27,
                    width: 2,
                    height: 2,
                    type: 'bg'
                }))
            }
    
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default RoboTank;
