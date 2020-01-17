import { lerp } from "./util.js";

//FlipBat will patrol from pos1 to pos2 and back again, thats it! No chase behavior. 
const FlipBat = function FlipBat({pos, height}={}){

    this.start = pos;
    this.target = {x: this.pos.x, y: this.pos.y + height}
    this.pos = {x: 0, y: 0};
    return this;
}
FlipBat.prototype.update = function update(dt){
    this.pos.x = lerp(this.start.x, this.target.x, Math.sin(performance.now()));
    this.pos.y = lerp(this.start.y, this.target.y, Math.sin(performance.now()));
}

FlipBat.prototype.render = function render(dt){
    
}

FlipBat.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

FlipBat.prototype.init = function init(){
    let { img } = G;

    this.spritesheet = new SpriteSheet({
        image: img.EnemyTinyflyer,
        frameWidth: 22,
        frameHeight: 29,
        animations: {
            idleLeft: {
                frames: '1',
            }
        }
    })
    //must have an anim set at start, or player.currentAnimation is null
    this.play('idle');
    
}

