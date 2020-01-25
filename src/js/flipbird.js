// BIRD - a diving flip creature

import { lerp, rectCollision } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from './player.js';
import { onScreen } from './graphics.js';

// patrols the area near pos, back and forth horizontally
const BIRD = function BIRD({pos}={}){
    this.start = pos;
    this.target = {x: Player.pos.x, y: Player.pos.y }
    this.pos = {x: pos.x, y: pos.y};
    this.vel = {x:0, y:0};
    this.width = 18;
    this.height = 27;
    this.rect = {};
    this.health = 16;
    this.healthMax = 16;
    this.isDiving = false;
    this.gravity = 5;
    this.attackRange = 4; //in tiles
    this.collideIndex = 1009;
    this.hazardTilesStartIndex = 113;
    this.hazardTilesEndIndex = 120;
    
    this.drawOffset = {x: 0, y: 0};

    this.healthBar = {
        xOffset: 0,
        yOffset: -this.height,
        width: this.width, 
        height: 2
    }
    return this;
}

BIRD.prototype.update = function update(dt){

    this.currentAnimation.update(dt);

    if(this.isDiving) {
        if(Player.pos.x < this.pos.x) {
            this.vel.x = -this.gravity;
        } else if(Player.pos.x > this.pos.x) {
            this.vel.x = this.gravity;
        }

        const prevX = this.pos.x;
        this.pos.x += this.vel.x * dt;
        if(this.tileCollisionCheck(G.world, this.collideIndex)) {
            this.pos.x = prevX;
        }

        this.vel.y += this.gravity;

        const prevY = this.pos.y;
        this.pos.y += this.vel.y * dt;
        if(this.tileCollisionCheck(G.world, this.collideIndex)) {
            while(this.tileCollisionCheck(G.world, this.collideIndex)) {
                this.pos.y--;
            }

            this.isDiving = false;
        }
        

    } else {
        if((onScreen(this.pos) && (Player.pos.y > this.pos.y))) {
            const h_distance = Math.abs(Player.pos.x - this.pos.x);
            if(h_distance < this.attackRange * 8) {
                this.isDiving = true;
            }
        }
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

    this.isDiving ? this.play('diving') : this.play('idle');

    if(this.health <= 0){ this.kill(); }
}

BIRD.prototype.render = function render(dt){
    if(this.health < this.healthMax){
        let fillWidth = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        G.rb.fillRect(this.pos.x + this.healthBar.xOffset - G.view.x,
            this.pos.y + this.healthBar.yOffset - G.view.y,
            fillWidth,
            this.healthBar.height,
            8);
    }
    this.currentAnimation.render({
        x: Math.floor(this.pos.x-this.width/2-G.view.x + this.drawOffset.x),
        y: Math.floor(this.pos.y-this.height/2-G.view.y + this.drawOffset.y),
        width: this.width,
        height: this.height
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

BIRD.prototype.tileCollisionCheck = function tileCollisionCheck(world, tileCheck) {
    //update body edges
    this.rect.top = this.pos.y - this.height/2;
    this.rect.bottom = this.pos.y + this.height/2;
    this.rect.left = this.pos.x - this.width/2;
    this.rect.right = this.pos.x + this.width/2;

    let leftTile =      Math.floor(this.rect.left / world.tileSize),
        rightTile =     Math.floor(this.rect.right / world.tileSize),
        topTile =       Math.floor(this.rect.top / world.tileSize),
        bottomTile =    Math.floor(this.rect.bottom / world.tileSize)
    
    for(let i = leftTile; i <=rightTile; i++){
        for(let j = topTile; j<= bottomTile; j++){
            let tile = world.getTileAtPosition({tx: i, ty: j})

            if(tile >= tileCheck){
                return true;
            }
        }
    }

    return false;
}

export default BIRD;