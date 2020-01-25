import { lerp, rectCollision, oscillate } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";


//FlipBat will patrol from pos1 to pos2 and back again, thats it! No chase behavior. 
const MAX_SPEED = 500;
const FlipBat = function FlipBat({pos, height}={}){
    this.start = pos;
    this.target = {x: pos.x, y: pos.y + height * 8}
    this.pos = {x: pos.x, y: pos.y};
    this.speed = 30;
    this.width = 12;
    this.height = 12;
    this.rect = {};
    this.health = 4;
    this.healthMax = 4;
    this.drawOffset = {x: -7, y: -13}
    this.lerpAmount = 0;
    this.movingDown = true

    this.healthBar = {
        xOffset: -8,
        yOffset: -10,
        width: 10, 
        height: 2
    }
    return this;
}

FlipBat.prototype.update = function update(dt){

    this.currentAnimation.update();

    this.pos.y = this.pos.y + (this.movingDown ? this.speed*dt : -this.speed*dt);

    if(this.pos.y >= this.target.y || this.pos.y <= this.start.y){
        this.movingDown = !this.movingDown;
    }

    
    this.rect = {
        top: this.pos.y - this.height/2,
        left: this.pos.x - this.width/2,
        right: this.pos.x + this.width/2,
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

    if(this.health <=0){ this.kill(); }


}

FlipBat.prototype.render = function render(dt){
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
        width: 22,
        height: 29
    })

    //G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
}

FlipBat.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    this.currentAnimation.currentFrame = rndInt(0,4);
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

FlipBat.prototype.init = function init(){

    this.spritesheet = new SpriteSheet({
        image: G.img.EnemyTinyflyer,
        frameWidth: 22,
        frameHeight: 29,
        animations: {
            idleRight: {
                frames: '0..3',
                frameRate: 16
            },
            idleLeft: {
                frames: '4..7',
                frameRate: 16
            }
        }
    })
    //must have an anim set at start, or .currentAnimation is null
    this.play('idleLeft');
    
    
    
    return this;
}

FlipBat.prototype.kill = function kill(){
    //splodey splode
    let splodeCount = 32;
    while(--splodeCount){
        G.particles.push(new Particle({
            x: this.pos.x+rndInt(-5,5),
            y: this.pos.y-10+rndInt(-5,5),
            vx: rndFloat(-.3, .3), 
            vy: rndFloat(-1, -1.5),
            life: 15,
            type: 'enemyDeath'
        }))
    }
    
    G.worldFlipped.tileFillCircle({
        tx: Math.floor(this.pos.x/8),
        ty: Math.floor(this.pos.y/8),
        radius: 6,
        value: 3
    }) 

    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default FlipBat;
