// BIRD - a diving flip creature

import { rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
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
    this.health = 32;
    this.healthMax = 32;
    this.isDiving = false;
    this.diveCount = 0;
    this.gravity = 5;
    this.attackRange = 4; //in tiles
    this.collideIndex = 961;
    this.hazardTilesStartIndex = 113;
    this.hazardTilesEndIndex = 120;

    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.05;//seconds
    this.brightTime = 0;
    
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
    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.EnemyTinydiver;
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.EnemyTinydiver;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.EnemyTinydiver) {
                    this.spritesheet.image = G.img.EnemyTinydiver;
                } else {
                    this.spritesheet.image = G.loader.brightImages.EnemyTinydiver;
                }
            }
            
        }
    }
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

        this.pos.y += this.vel.y * dt;
        if(this.tileCollisionCheck(G.world, this.collideIndex)) {
            while(this.tileCollisionCheck(G.world, this.collideIndex)) {
                this.pos.y--;
            }

            this.isDiving = false;
            
        }
        
        this.diveCount++;
        if(this.diveCount % 10 == 0) {
            G.worldFlipped.tileFillCircle(
                Math.floor(this.pos.x/8),
                Math.floor(this.pos.y/8),
                0.5,
                3
            );
        }
    } else {
        if((onScreen(this.pos) && (Player.pos.y > this.pos.y))) {
            const h_distance = Math.abs(Player.pos.x - this.pos.x);
            if(h_distance < this.attackRange * 8) {
                this.isDiving = true;
            }
        }

        if(this.diveCount > 0) {
            this.diveCount++;
            if(this.diveCount > 150) {
                this.kill();
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
    

    if(rectCollision(this.rect, G.player.rect)){
        G.MSG.dispatch('hurt', {amount: 5});
    }

    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>=0){
            if(pointInRect(G.bullets.pool[i+1], G.bullets.pool[i+2], this.rect)){
                G.bullets.kill(i);
                this.wasHit = true;
                this.health--;
            }
        }
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
    G.audio.playSound(G.sounds.splode1, range(this.pos.x-G.view.x, 0,427,-1,1), 0.5, 1, false);
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

    G.worldFlipped.tileFillCircle(
        Math.floor(this.pos.x/8),
        Math.floor(this.pos.y/8),
        3,
        3
    )


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
            let tile = world.getTileAtPosition(i, j)

            if(tile >= tileCheck){
                return true;
            }
        }
    }

    return false;
}

export default BIRD;