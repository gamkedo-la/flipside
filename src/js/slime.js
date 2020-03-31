/* eslint-disable complexity */

// Slime - a patrolling enemy unit

import { rectCollision, pointInRect } from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import G from './G.js'

// patrols the area near pos, back and forth horizontally
const Slime = function Slime(obj){
    this.type = "EnemyFlipSlime";
    this.start = {x:obj.x, y:obj.y};
    this.pathWidth = obj.properties.find(function(e){return e.name == 'pathWidthInTiles'}).value;
    this.pathHeight = obj.properties.find(function(e){return e.name == 'pathHeightInTiles'}).value;
    this.clockwisePath = obj.properties.find(function(e){return e.name == 'clockwisePath'}).value;
    this.currentAnimation = 'clockwiseRight';
    this.target = {x: obj.x + this.pathWidth * 8, y: obj.y };
    this.speed = 10;
    this.width = 30; // note: width and height are hitbox, not drawsize
    this.height = 30;
    this.rect = {};
    this.health = 2;
    this.healthMax = 2;
    this.pos = {x: obj.x, y: obj.y}; // put feet where bottom of Tiled icon appears
    this.drawOffset = {x: 0, y: 0}; // center the sprite when rendering
    this.wasHit = false;
    this.timeSinceHit = 0;
    this.flashTime = 0.1;//seconds
    this.brightTime = 0;

    this.healthBar = {
        xOffset: 0,
        yOffset: -15,
        width: 30, 
        height: 2
    }
    return this;
}

// can we walk forward?
Slime.prototype.canWalkForward = function() {
    
    // how far to look ahead
    let xofs = this.goingLeft ? 2 : -2; // tiles to look ahead
    let yofs = 1;
    let tx = 0;
    let ty = 0;
    let blocked = false;
    let maxTileIndex = G.player.collideIndex; //this is a lazy GAMEJAMMERY way to grab this number 
    let tileHit = 0;

    // is there a wall in front of me?
    tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
    ty = Math.round(this.pos.y / G.world.tileSize) - 1; // slightly above the foot tile
    
    tileHit = G.world.getTileAtPosition(tx,ty); 

    blocked = (tileHit > maxTileIndex); // it HAS to be air to let us through

    // if there's no wall, let's check the floor to ensure we don't fall off a ledge
    if (!blocked) { // yet
        // is there any floor in front of me and a bit down?
        tx = Math.round(this.pos.x / G.world.tileSize) + xofs; // in front of
        ty = Math.round(this.pos.y / G.world.tileSize) + yofs; // and below
        tileHit = G.world.getTileAtPosition(tx,ty);
        blocked = (tileHit <= maxTileIndex); // as in, it HAS to be solid
    }

    // highlight the problem
    this.debugX = tx * G.world.tileSize - G.view.x;
    this.debugY = ty * G.world.tileSize - G.view.y;
    this.debugC = blocked ? 4 : 11; // reddish or greenish

    return !blocked; 
}



Slime.prototype.update = function update(dt){
    if(this.wasHit) {
        this.spritesheet.image = G.loader.brightImages.EnemyFlipSlime;
        this.timeSinceHit += dt;
        this.brightTime += dt;
        if(this.timeSinceHit > this.flashTime) {
            this.timeSinceHit = 0;
            this.wasHit = false;
            this.spritesheet.image = G.img.EnemyFlipSlime;
        } else {
            if(this.brightTime > this.flashTime / 5) {
                this.brightImages = 0;
                if(this.spritesheet.image == G.img.EnemyFlipSlime) {
                    this.spritesheet.image = G.img.EnemyFlipSlime;
                } else {
                    this.spritesheet.image = G.loader.brightImages.EnemyFlipSlime;
                }
            }
            
        }
    }
    this.currentAnimation.update(dt);

    // FIXME: entity pos is 0,0,0 at spawn
    if (this.pos.x==0 && this.pos.y==0) {
        this.pos = this.start;
    }

    if((this.pos.x >= this.start.x) && (this.pos.x <= this.start.x + this.pathWidth * 8)) {
        //we're need to keep moving either left or right
        if(this.pos.y < this.start.y + this.pathHeight * 4) {
            //we're near the top of the path
            if(this.clockwisePath) {
                //at the top => need to move right
                this.pos.x = this.pos.x + this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.clockwiseRight) {
                    this.play("clockwiseRight");
                }
            } else {
                //at the top => need to move left
                this.pos.x = this.pos.x - this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.CCWLeft) {
                    this.play("CCWLeft");
                }
            }
        } else {
            //we're near the bottom of the path
            if(this.clockwisePath) {
                //at the bottom => need to move left
                this.pos.x = this.pos.x - this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.clockwiseLeft) {
                    this.play("clockwiseLeft");
                }
            } else {
                //at the bottom => need to move right
                this.pos.x = this.pos.x + this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.CCWRight) {
                    this.play("CCWRight");
                }
            }
        }
    } else if((this.pos.y >= this.start.y) && (this.pos.y <= this.start.y + this.pathHeight * 8)){
        //Need to keep moving up or down
        if(this.pos.x < this.start.x + this.pathWidth * 4) {
            //we're near the left side of the path
            if(this.clockwisePath) {
                //at the left side => need to move up
                this.pos.y = this.pos.y - this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.clockwiseUp) {
                    this.play("clockwiseUp");
                }
            } else {
                //at the left side => need to move down
                this.pos.y = this.pos.y + this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.CCWDown) {
                    this.play("CCWDown");
                }
            }
        } else {
            //we're near the right side of the path
            if(this.clockwisePath) {
                //at the right side => need to move down
                this.pos.y = this.pos.y + this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.clockwiseDown) {
                    this.play("clockwiseDown");
                }
            } else {
                //at the right side => need to move up
                this.pos.y = this.pos.y - this.speed * dt;
                if(this.currentAnimation != this.spritesheet.animations.CCWUp) {
                    this.play("CCWUp");
                }
            }
        }
    } else {
        //Time to turn
        if((this.pos.x <= this.start.x) && (this.pos.y <= this.start.y)) {
            //Upper left corner
            if(this.clockwisePath) {
                //upper left => need to start moving right
                this.pos.x = this.pos.x + this.speed * dt;
                this.play("clockwiseRight");
            } else {
                //upper left => need to start moving down
                this.pos.y = this.pos.y + this.speed * dt;
                this.play("CCWDown");
            }
        } else if((this.pos.x >= this.start.x + this.pathWidth * 8) && (this.pos.y <= this.start.y)) {
            //Upper right corner
            if(this.clockwisePath) {
                //upper right => need to start moving down
                this.pos.y = this.pos.y + this.speed * dt;
                this.play("clockwiseDown");
            } else {
                //upper right => need to start moving left
                this.pos.x = this.pos.x - this.speed * dt;
                this.play("CCWLeft");
            }
        } else if((this.pos.x >= this.start.x + this.pathWidth * 8) && (this.pos.y >= this.start.y + this.pathHeight * 8)) {
            //Lower right corner
            if(this.clockwisePath) {
                //lower right => need to start moving left
                this.pos.x = this.pos.x - this.speed * dt;
                this.play("clockwiseLeft");
            } else {
                //lower right => need to start moving up
                this.pos.y = this.pos.y - this.speed * dt;
                this.play("CCWUp");
            }
        } else if((this.pos.x <= this.start.x) && (this.pos.y >= this.start.y + this.pathHeight * 8)) {
            //Lower left corner
            if(this.clockwisePath) {
                //lower left => need to start moving up
                this.pos.y = this.pos.y - this.speed * dt;
                this.play("clockwiseUp");
            } else {
                //lower left => need to start moving right
                this.pos.x = this.pos.x + this.speed * dt;
                this.play("CCWRight");
            }
        }
    }
    if(this.currentAnimation == this.spritesheet.animations.clockwiseRight) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 12,
            left: this.pos.x - 13,
            right: this.pos.x + 13,
            bottom: this.pos.y + 3
        } 
    } else if(this.currentAnimation == this.spritesheet.animations.clockwiseDown) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 7,
            left: this.pos.x - 9,
            right: this.pos.x,
            bottom: this.pos.y + 13
        }
    } else if(this.currentAnimation == this.spritesheet.animations.clockwiseLeft) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 8,
            left: this.pos.x - 13,
            right: this.pos.x + 10,
            bottom: this.pos.y + 2
        }
    } else if(this.currentAnimation == this.spritesheet.animations.clockwiseUp) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 13,
            left: this.pos.x - 10,
            right: this.pos.x + 1,
            bottom: this.pos.y + 13
        }
    } else if(this.currentAnimation == this.spritesheet.animations.CCWDown) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 13,
            left: this.pos.x - 10,
            right: this.pos.x + 1,
            bottom: this.pos.y + 13
        }
    } else if(this.currentAnimation == this.spritesheet.animations.CCWRight) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 8,
            left: this.pos.x - 10,
            right: this.pos.x + 13,
            bottom: this.pos.y + 2
        }
    } else if(this.currentAnimation == this.spritesheet.animations.CCWUp) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 13,
            left: this.pos.x - 9,
            right: this.pos.x,
            bottom: this.pos.y + 13
        }
    } else if(this.currentAnimation == this.spritesheet.animations.CCWLeft) {
        this.rect = {//update collision rect based on current animation
            top: this.pos.y - 15,
            left: this.pos.x - 10,
            right: this.pos.x + 13,
            bottom: this.pos.y + 3
        }
    }

    var self = this;
    
    if(rectCollision(this.rect, G.player.rect)) {
        G.MSG.dispatch('hurt', {amount: 5});
        //FIXME: Do we have a slime portrait?
//        G.MSG.dispatch('hurt', {amount: 5, message:{text: this.name, speaker:G.PORTRAIT_FLIPPIG}});
    }

    // look at player
    // G.player.pos.x < this.pos.x ? this.play('idleRight') : this.play('idleLeft');

    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]>=0) {
            if(rectCollision({left:G.bullets.pool[i+G.PARTICLE_X] - 3, right:G.bullets.pool[i+G.PARTICLE_X] + 3, top:G.bullets.pool[i+G.PARTICLE_Y] - 3, bottom:G.bullets.pool[i+G.PARTICLE_Y] + 3}, this.rect)) {
//                if(pointInRect(G.bullets.pool[i+G.PARTICLE_X], G.bullets.pool[i+G.PARTICLE_Y], this.rect)){
                    G.bullets.kill(i)
                this.wasHit = true;
                this.health--;
            }
        }
    }

    if(this.health <=0){ this.kill(); }


}

Slime.prototype.render = function render(glRender, dt){
//    G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.rect.right - this.rect.left, this.rect.bottom - this.rect.top, 11);

    if(this.health < this.healthMax) {
        let fillWidth = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        let fillHeight = this.healthBar.height;
        let offsetX = this.healthBar.xOffset;
        let offsetY = this.healthBar.yOffset;
        if(this.currentAnimation ==  this.spritesheet.animations.clockwiseDown) {
            offsetX = -this.healthBar.yOffset / 2;
            offsetY = -this.healthBar.xOffset;
            fillWidth = this.healthBar.height;
            fillHeight = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        } else if(this.currentAnimation ==  this.spritesheet.animations.clockwiseUp) {
            offsetX = this.healthBar.yOffset;
            offsetY = -this.healthBar.width / 2;
            fillWidth = this.healthBar.height;
            fillHeight = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        } else if(this.currentAnimation ==  this.spritesheet.animations.clockwiseLeft) {
            offsetX = -this.healthBar.width/2;
            offsetY = -this.healthBar.yOffset/2;
        } else if(this.currentAnimation ==  this.spritesheet.animations.CCWUp) {
            offsetX = -this.healthBar.yOffset / 2;
            offsetY = -this.healthBar.width / 2;
            fillWidth = this.healthBar.height;
            fillHeight = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        } else if(this.currentAnimation ==  this.spritesheet.animations.CCWDown) {
            offsetX = this.healthBar.yOffset;
            offsetY = this.healthBar.xOffset;
            fillWidth = this.healthBar.height;
            fillHeight = range(this.health, 0, this.healthMax, 0, this.healthBar.width);
        } else if(this.currentAnimation ==  this.spritesheet.animations.CCWRight) {
            offsetX = this.healthBar.xOffset;
            offsetY = -this.healthBar.yOffset/2;
        }  else if(this.currentAnimation ==  this.spritesheet.animations.CCWLeft) {
            offsetX = -this.healthBar.width/2;
            offsetY = this.healthBar.yOffset;
        }

        G.rb.fillRect(this.pos.x + offsetX - G.view.x,
            this.pos.y + offsetY - G.view.y,
            fillWidth,
            fillHeight,
            8);
    }

    if(!glRender) {
        this.currentAnimation.render({
            x: Math.floor(this.pos.x-this.width/2-G.view.x + this.drawOffset.x),
            y: Math.floor(this.pos.y-this.height/2-G.view.y + this.drawOffset.y),
            width: this.width,
            height: this.height
        });
    }
}

Slime.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

Slime.prototype.getSpriteSheetFrame = function getSpriteSheetFrame() {
    return this.currentAnimation.frames[this.currentAnimation.currentFrame];
}

Slime.prototype.init = function init(){
    this.spritesheet = new SpriteSheet({
        image: G.img.EnemyFlipSlime,
        frameWidth: 30,
        frameHeight: 30,
        animations: {
            clockwiseRight: {
                frames: '0..3',
                frameRate: 4
            },
            clockwiseLeft: {
                frames: '8..11',
                frameRate: 4
            },
            clockwiseDown: {
                frames: '4..7',
                frameRate: 4
            },
            clockwiseUp: {
                frames: '12..15',
                frameRate: 4
            },
            CCWLeft: {
                frames: '16..19',
                frameRate: 4
            },
            CCWDown: {
                frames: '20..23',
                frameRate: 4
            },
            CCWRight: {
                frames: '24..27',
                frameRate: 4
            },
            CCWUp: {
                frames: '28..31',
                frameRate: 4
            }
        }
    })

    //must have an anim set at start, or .currentAnimation is null
    this.play('clockwiseRight');
    
    return this;
}

Slime.prototype.kill = function kill(){
    //splodey splode
    G.audio.playSound(G.sounds.splode1, G.audio.calculatePan(this.pos.x), G.audio.calcuateVolumeDropoff(this.pos)*0.5, 1, false);
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
    
    let dropCount = 5;
    const dropType = (rndInt(0,10) < 5 ? G.PICKUP_NANITE : G.PICKUP_HEALTH);
    while(--dropCount) {
        G.pickups.spawn(
            this.pos.x+rndInt(-5,5),
            this.pos.y-10+rndInt(-5,5),
            rndFloat(-30, 30), 
            rndFloat(-30),
            11,
            6,
            6,
            180,
            dropType
        )
    }

    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default Slime;
