import { lerp, rectCollision} from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Particle from './particle.js'
import Player from "./player.js";


const Barricade = function Barricade(obj){
    this.open = false;
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
        }
    });

}

Barricade.prototype.render = function render(dt){
   
    G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
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
