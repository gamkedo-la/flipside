// PIG - a horizontally patrolling flip creature

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";

// patrols the area near pos, back and forth horizontally
const PIG = function PIG({pos, pathWidth=3, source={}}={}){
    this.start = pos;
    this.target = {x: pos.x + pathWidth*8, y: pos.y }
    this.obj = source;
    
    this.speed = 20;
    //width and height are hitbox, not the sprite
    this.width = 30;
    this.height = 20;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    this.movingRight = true;
    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.05;//seconds
    this.brightTime = 0;

    //Tiled xy is upper-left of tileObject and can't be changed in-editor
    //modifying actual position here to compensate
    this.pos = {x: pos.x, y: pos.y-6};
        
    this.drawOffset = {x:4, y:-12}; 

    this.healthBar = {
        xOffset: 0,
        yOffset: -30,
        width: 30, 
        height: 2
    }
    return this;
}

PIG.prototype.update = function update(dt){
    if(this.wasHit) {
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.EnemyTinycrawler;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.EnemyTinycrawler) {
                    this.spritesheet.image = G.img.EnemyTinycrawler;
                } else {
                    this.spritesheet.image = G.loader.brightImages.EnemyTinycrawler;
                }
            }
            
        }
    }
    this.currentAnimation.update(dt);

    this.pos.x = this.pos.x + (this.movingRight ? this.speed*dt : -this.speed*dt);

    if(this.pos.x >= this.target.x || this.pos.x <= this.start.x){
        this.movingRight = !this.movingRight;
    }

    this.rect = {
        top: this.pos.y - this.height/2,
        left: this.pos.x - this.width/2,
        right: this.pos.x + this.width/2,
        bottom: this.pos.y + this.height/2
    }
    var self = this;
    G.particles.forEach(function(bullet){
        if(bullet.type == 'bullet'){
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
                self.wasHit = true;
                self.spritesheet.image = G.loader.brightImages.EnemyTinycrawler;
            }
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
        // width: PIG_W,
        // height: PIG_H
    })

  //  G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
}

PIG.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

PIG.prototype.init = function init(){
    this.spritesheet = new SpriteSheet({
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
                    x: this.pos.x+rndInt(-15,15),
                    y: this.pos.y-10+rndInt(-5,5),
                    vx: rndFloat(-.3, .3), 
                    vy: rndFloat(-1, -1.5),
                    life: 25,
                    color: 26,
                    width: 2,
                    height: 2,
                    type: 'enemyDeath'
                }))
            }
    
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default PIG;
