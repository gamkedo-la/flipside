import { rndInt } from "./math.js";
import SpriteSheet from './spritesheet.js';
import Player from "./player.js";


const Switch = function Switch(obj){
    this.attachedBarricade = obj.properties.find(function(e){return e.name == 'attachedBarricade'}).value;
    this.name = obj.name;
    this.type = obj.type;
    this.open = false;
    this.active = false;
    this.uncovered = true;
    this.startY = obj.y;
    this.pos = {x: obj.x, y: obj.y};
    this.height = obj.height;
    this.width = obj.width;
    this.rect={};
    return this;
}

Switch.prototype.update = function update(dt){

    //this.currentAnimation.update();

    this.rect = {
        top: this.pos.y,
        left: this.pos.x,
        right: this.pos.x + this.width,
        bottom: this.pos.y + this.height
    }

    this.active = this.withinCheck(G.worldFlipped, function(tile){return tile != 3});
    var barricade = G.world.entities.find(e => e.name == this.attachedBarricade);
    if(this.active){
        barricade.open = true;
    }else barricade.open = false;

}

Switch.prototype.render = function render(dt){
   
    // G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
    // if(this.active){
    //     G.rb.fillRect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
    // }
}

Switch.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    this.currentAnimation.currentFrame = rndInt(0,4);
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

Switch.prototype.init = function init(){

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

Switch.prototype.kill = function kill(){
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

Switch.prototype.withinCheck = function withinCheck(world, tileCheck){
    //update body edges
    this.rect.top = this.pos.y;
    this.rect.bottom = this.pos.y + this.height;
    this.rect.left = this.pos.x;
    this.rect.right = this.pos.x + this.width;

    let leftTile =      Math.floor(this.rect.left / G.world.tileSize),
        rightTile =     Math.floor(this.rect.right / G.world.tileSize),
        topTile =       Math.floor(this.rect.top / G.world.tileSize),
        bottomTile =    Math.floor(this.rect.bottom / G.world.tileSize)
    
    for(let i = leftTile; i <=rightTile; i++){
        for(let j = topTile; j<= bottomTile; j++){
            let tile = world.getTileAtPosition(i, j)

                if(!tileCheck(tile)){return false};
            }
            
        }
        return true;
    }

export default Switch;
