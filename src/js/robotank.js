// RoboTank - a horizontally patrolling tank unit

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";

const ROBOTANK_W = 32;
const ROBOTANK_H = 34;

// patrols the area near pos, back and forth horizontally
const RoboTank = function RoboTank({pos}={}){
    this.start = pos;
    this.currentAnimation = 'idle';
    this.target = {x: pos.x + 24, y: pos.y }
    this.pos = {x: 0, y: 0};
    this.speed = 0.001;
    this.width = ROBOTANK_W;
    this.height = ROBOTANK_H;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    
    // FIXME these seems strange
    // xy is foot pos and in tiles that's the bottom of the obj rect
    this.drawOffset = {x: ROBOTANK_W/2-8, y: -ROBOTANK_H/2+8}; 

    this.healthBar = {
        xOffset: 0,
        yOffset: -ROBOTANK_H,
        width: ROBOTANK_W, 
        height: 2
    }
    return this;
}

RoboTank.prototype.update = function update(dt){

    this.currentAnimation.update(dt);

    this.pos.x = lerp(this.start.x, this.target.x, Math.sin(performance.now()*this.speed));
    this.pos.y = lerp(this.start.y, this.target.y, Math.sin(performance.now()*this.speed));

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

    G.player.pos.x > this.pos.x ? this.play('idleRight') : this.play('idleLeft');

    if(!this.health){ this.kill(); }


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
        width: ROBOTANK_W,
        height: ROBOTANK_H
    })
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
                frames: '0..0',
                frameRate: 16
            },
            idleLeft: {
                frames: '0..0',
                frameRate: 16
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
