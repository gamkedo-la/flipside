import { lerp } from "./util.js";
import SpriteSheet from './spritesheet.js';


//FlipBat will patrol from pos1 to pos2 and back again, thats it! No chase behavior. 
const FlipBat = function FlipBat({pos, height}={}){

    this.start = pos;
    this.currentAnimation = 'idle';
    this.target = {x: pos.x, y: pos.y + height * 8}
    this.pos = {x: 0, y: 0};
    this.speed = 0.001;
    this.width = 18;
    this.height = 26;
    this.rect = {};
    return this;
}
FlipBat.prototype.update = function update(dt){
    this.pos.x = lerp(this.start.x, this.target.x, Math.sin(performance.now()*this.speed));
    this.pos.y = lerp(this.start.y, this.target.y, Math.sin(performance.now()*this.speed));
    this.rect = {
        top: this.pos.y - this.width/2,
        left: this.pos.x - this.height/2,
        right: this.pos.x + this.height/2,
        bottom: this.pos.y + this.height/2
    }
}

FlipBat.prototype.render = function render(dt){
    this.currentAnimation.render({
        x: Math.floor(this.pos.x-this.width/2-G.view.x),
        y: Math.floor(this.pos.y-this.height/2-G.view.y),
        width: 22,
        height: 29
    })
}

FlipBat.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
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
            idle: {
                frames: '0',
            }
        }
    })
    //must have an anim set at start, or player.currentAnimation is null
    this.play('idle');
    
    return this;
}

export default FlipBat;
