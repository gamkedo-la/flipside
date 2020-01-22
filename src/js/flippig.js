// PIG - a horizontally patrolling tank unit

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";

const PIG_W = 30;
const PIG_H = 30;

// patrols the area near pos, back and forth horizontally
const PIG = function PIG({pos, pathWidth=3}={}){
    this.start = pos;
    this.target = {x: pos.x + pathWidth*8, y: pos.y }
    this.pos = {x: pos.x, y: pos.y};
    this.speed = 20;
    this.width = PIG_W;
    this.height = PIG_H;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    this.movingRight = true;
    
    // FIXME these seems strange
    // xy is foot pos and in tiles that's the bottom of the obj rect
    this.drawOffset = {x: PIG_W/2-8, y: -PIG_H/2+2}; 

    this.healthBar = {
        xOffset: 0,
        yOffset: -PIG_H,
        width: PIG_W, 
        height: 2
    }
    return this;
}

PIG.prototype.update = function update(dt){

    this.currentAnimation.update(dt);

    //this.po

    this.pos.x = this.pos.x + (this.movingRight ? this.speed*dt : -this.speed*dt);

    if(this.pos.x >= this.target.x || this.pos.x <= this.start.x){
        this.movingRight = !this.movingRight;
    }

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

    this.movingRight ? this.play('idleRight') : this.play('idleLeft');

    if(this.health <=0){ this.kill(); }


}

PIG.prototype.render = function render(dt){
    //console.log("PIG is rendering at "+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1))
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
        width: PIG_W,
        height: PIG_H
    })
}

PIG.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

PIG.prototype.init = function init(){

    //console.log("PIG init...");
    this.spritesheet = new SpriteSheet({
//        image: G.img.EnemyPIG,
        image: G.img.EnemyTinycrawler,
        frameWidth: 30,
        frameHeight: 30,
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
    })
    //must have an anim set at start, or .currentAnimation is null
    this.play('idleLeft');
    
    return this;
}

PIG.prototype.kill = function kill(){
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

export default PIG;
