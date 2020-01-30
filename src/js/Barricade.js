import { rectCollision, pointInRect} from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';


const Barricade = function Barricade(obj){
    this.name = obj.name;
    this.type = obj.type;
    this.open = false;
    this.startY = obj.y;
    this.pos = {x: obj.x, y: obj.y};
    this.height = obj.height;
    this.width = obj.width;
    this.rect={};
    return this;
}

Barricade.prototype.update = function update(dt){

    //this.currentAnimation.update();

    this.rect = {
        top: this.pos.y,
        left: this.pos.x,
        right: this.pos.x + this.width,
        bottom: this.pos.y + this.height
    }

    if(this.open && this.pos.y >= this.startY - this.height){
        this.pos.y -= 1;
    }
    if(!this.open && this.pos.y != this.startY ){
        this.pos.y += 1;
    }

    var self = this;
    

}

Barricade.prototype.render = function render(dt){
    let color = this.open ? 11 : 5
    G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, color);
}

Barricade.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    this.currentAnimation.currentFrame = rndInt(0,4);
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

Barricade.prototype.init = function init(){

    this.spritesheet = new SpriteSheet({
        image: G.img.tiles,
        frameWidth: 8,
        frameHeight: 8,
        animations: {
            idle: {
                frames: '36',
            },
            
        }
    })
    //must have an anim set at start, or .currentAnimation is null
    this.play('idle');
    
    return this;
}

Barricade.prototype.kill = function kill(){
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default Barricade;
