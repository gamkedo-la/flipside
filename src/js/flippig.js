// PIG - a horizontally patrolling flip creature

import { rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import G from './G.js'

// patrols the area near pos, back and forth horizontally
const PIG = function PIG(obj){
    this.start = {x: obj.x, y: obj.y};
    this.pathWidth = obj.properties.find(function(e){return e.name == 'pathWidthInTiles'}).value;
    this.target = {x: obj.x + this.pathWidth*8, y: obj.y }
    
    this.name = obj.name;
    
    this.speed = 20;
    //width and height are hitbox, not the sprite
    this.width = 30;
    this.height = 20;
    this.rect = {};
    this.health = 32;
    this.healthMax = 32;
    this.movingRight = true;
    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.1;//seconds
    this.brightTime = 0;

    //Tiled xy is upper-left of tileObject and can't be changed in-editor
    //modifying actual position here to compensate
    this.pos = {x: obj.x, y: obj.y-6};
        
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
        this.spritesheet.image = G.loader.brightImages.EnemyTinycrawler
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
    
    if(rectCollision(this.rect, G.player.rect)){
        G.MSG.dispatch('hurt', {amount: 5, message:{text: this.name, speaker:G.PORTRAIT_FLIPPIG}});
    }

    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>0){
            if(pointInRect(G.bullets.pool[i+1], G.bullets.pool[i+2], this.rect)){
                self.wasHit = true;
                G.bullets.kill(i);
                this.health--;
            }
        }
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
    G.audio.playSound(G.sounds.splode1, G.audio.calculatePan(this.pos.x), G.audio.calcuateVolumeDropoff(this.pos)*0.5, 1, false);
    let splodeCount = 32;
    while(--splodeCount){
        G.particles.spawn(
            this.pos.x+rndInt(-15,15),
            this.pos.y-10+rndInt(-5,5),
            rndFloat(-.3, .3), 
            rndFloat(-1, -1.5),
            26,
            2,
            2,
            25,
            G.ENEMYDEATH
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

    
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default PIG;
