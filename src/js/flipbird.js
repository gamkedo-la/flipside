// BIRD - a diving flip creature

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";

const BIRD_W = 30;
const BIRD_H = 30;

// patrols the area near pos, back and forth horizontally
const BIRD = function BIRD({pos}={}){
    this.start = pos;
    this.target = {x: Player.pos.x, y: Player.pos.y }
    this.pos = {x: pos.x, y: pos.y};
    this.vel = {x:0, y:0};
    this.width = BIRD_W;
    this.height = BIRD_H;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    this.isDiving = false;
    this.gravity = 10;
    this.attackRange = 6; //in tiles
    
    // FIXME these seems strange
    // xy is foot pos and in tiles that's the bottom of the obj rect
    this.drawOffset = {x: BIRD_W/2-8, y: -BIRD_H/2+2}; 

    this.healthBar = {
        xOffset: 0,
        yOffset: -BIRD_H,
        width: BIRD_W, 
        height: 2
    }
    return this;
}

BIRD.prototype.update = function update(dt){

    this.currentAnimation.update(dt);

    if(this.isDiving) {
        if(Player.pos.x < this.pos.x) {
            this.vel.x -= this.gravity/4;
        } else if(Player.pos.x > this.pos.x) {
            this.vel.x += this.gravity/4;
        }

        this.vel.y += this.gravity;
    } else {
        const h_distance = Math.abs(Player.pos.x - this.pos.x);
        if(h_distance < this.attackRange * 8) {
            this.isDiving = true;
        }
    }

    this.pos.x = this.pos.x + (this.vel.x * dt);
    this.pos.y = this.pos.y + (this.vel.y * dt);

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

    this.isDiving ? this.play('diving') : this.play('idle');

    if(!this.health){ this.kill(); }
}

BIRD.prototype.render = function render(dt){
    //console.log("BIRD is rendering at "+this.pos.x.toFixed(1)+','+this.pos.y.toFixed(1))
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
        width: BIRD_W,
        height: BIRD_H
    })
}

BIRD.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

BIRD.prototype.init = function init(){
    this.spritesheet = new SpriteSheet({
        image: G.img.EnemyTinydiver,
        frameWidth: 18,
        frameHeight: 27,
        animations: {
            idle: {
                frames: '0..1',
                frameRate: 7
            },
            diving: {
                frames: '2..3',
                frameRate: 7
            }
        }
    })
    //must have an anim set at start, or .currentAnimation is null
    this.play('idle');
    
    return this;
}

BIRD.prototype.kill = function kill(){
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

export default BIRD;