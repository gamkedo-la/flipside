import {  rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';


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
    this.health = 32;
    this.healthMax = 32;
    this.drawOffset = {x: -7, y: -13}
    this.lerpAmount = 0;
    this.movingDown = true
    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.05;//seconds
    this.brightTime = 0;


    this.healthBar = {
        xOffset: -8,
        yOffset: -10,
        width: 10, 
        height: 2
    }
    return this;
}

FlipBat.prototype.update = function update(dt){
    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.EnemyTinyflyer;
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.EnemyTinyflyer;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.EnemyTinyflyer) {
                    this.spritesheet.image = G.img.EnemyTinyflyer;
                } else {
                    this.spritesheet.image = G.loader.brightImages.EnemyTinyflyer;
                }
            }
            
        }
    }
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
   
    if(rectCollision(this.rect, G.player.rect)){
        G.MSG.dispatch('hurt', {amount: 5});
    }

    G.player.pos.x > this.pos.x ? this.play('idleRight') : this.play('idleLeft');

    //bullet collision check
    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>0){
            if(pointInRect(G.bullets.pool[i+1], G.bullets.pool[i+2], this.rect)){
                this.wasHit = true;
                G.bullets.kill(i);
                this.health--;
            }
        }
    }

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

   // G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
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
    G.audio.playSound(G.sounds.splode1, range(this.pos.x-G.view.x, 0,427,-1,1), 0.5, 1, false);
    //splodey splode
    let splodeCount = 32;
    while(--splodeCount){
        G.particles.spawn(
            this.pos.x+rndInt(-5,5),
            this.pos.y-10+rndInt(-5,5),
            rndFloat(-50, 50), 
            rndFloat(-50, 50),
            15,
            6,
            6,
            20,
            5
        )
    }


    let dropCount = 5;
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

    
    
    G.worldFlipped.tileFillCircle(
        Math.floor(this.pos.x/8),
        Math.floor(this.pos.y/8),
        4,
        3
    ) 

    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default FlipBat;
