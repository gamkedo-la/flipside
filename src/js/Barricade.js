import { rectCollision, pointInRect} from "./util.js";
import { rndFloat, rndInt, range } from "./math.js";
import SpriteSheet from './spritesheet.js';
import { colors } from './graphics.js';


const Barricade = function Barricade(obj){
    this.name = obj.name;
    this.type = obj.type;
    this.open = false;
    this.startY = obj.y;
    this.pos = {x: obj.x, y: obj.y};
    this.height = obj.height;
    this.closedHeight = obj.height;
    this.closedWidth = obj.width;
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

    if(this.open){
        this.height = 0;
        this.width = 0;
    }else{this.height = this.closedHeight; this.width = this.closedWidth};

    var self = this;
    

}

Barricade.prototype.render = function render(dt){
    let color = this.open ? 11 : 5
    //G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, color);
    if(!this.open){
        //this.bolt = function(x0,y0,x1,y1,width=1,chaos=6,numChunks=10,rgba="rgba(0,255,255)") {
        //G.lightning.drawZap(this.pos.x-G.view.x+rndInt(0, this.width),this.pos.y-G.view.y,this.pos.x-G.view.x+rndInt(0, this.width), this.pos.y+this.height-G.view.y, colors[4])
        G.ctx.save();
        G.ctx.globalCompositeOperation = 'screen';

        G.lightning.bolt(
            this.pos.x+this.width/2-G.view.x,
            this.pos.y-G.view.y,
            this.pos.x+this.width/2-G.view.x, 
            this.pos.y+this.height-G.view.y,
            this.width, 2, 3, 'rgba(255,0,0, 0.5)'
            )
        G.lightning.bolt(
            this.pos.x+this.width/2-G.view.x,
            this.pos.y-G.view.y,
            this.pos.x+this.width/2-G.view.x, 
            this.pos.y+this.height-G.view.y,
            this.width*0.7, 1, 3, 'rgba(255,0,0, 0.5)'
            )
        G.lightning.bolt(
            this.pos.x+this.width/2-G.view.x,
            this.pos.y-G.view.y,
            this.pos.x+this.width/2-G.view.x, 
            this.pos.y+this.height-G.view.y,
            this.width*0.6, 0, 2, 'rgba(255,128,0, 0.5)'
            )
        G.lightning.bolt(
            this.pos.x+this.width/2-G.view.x,
            this.pos.y-G.view.y,
            this.pos.x+this.width/2-G.view.x, 
            this.pos.y+this.height-G.view.y,
            this.width*0.4, 0, 2, 'rgba(255,128,0, 0.5)'
            )

        G.ctx.restore();
}
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
