import { rndInt } from "./math.js";
import { showMessage } from "./UI.js";
import { rectCollision } from "./util.js";


const MessageBox = function MessageBox(obj){
    this.message = obj.properties.find(function(e){return e.name == 'text'}).value;
    this.speaker = obj.properties.find(function(e){return e.name == 'speaker'}).value;
    this.name = obj.name;
    this.type = obj.type;
    this.startY = obj.y;
    this.pos = {x: obj.x, y: obj.y};
    this.height = obj.height;
    this.width = obj.width;
    this.rect={};
    return this;
}

MessageBox.prototype.update = function update(dt){

    //this.currentAnimation.update();

    this.rect = {
        top: this.pos.y,
        left: this.pos.x,
        right: this.pos.x + this.width,
        bottom: this.pos.y + this.height
    }

    if(rectCollision(this.rect, G.player.rect)){
        showMessage(this.message);
    }
}

MessageBox.prototype.render = function render(dt){
   
    //G.rb.rect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
    // if(this.active){
    //     G.rb.fillRect(this.rect.left-G.view.x, this.rect.top-G.view.y, this.width, this.height, 11);
    // }
}

MessageBox.prototype.play = function play(animationName){
    this.currentAnimation = this.spritesheet.animations[animationName];
    this.currentAnimation.currentFrame = rndInt(0,4);
    if (!this.currentAnimation.loop){
        this.currentAnimation.reset();
    }
}

MessageBox.prototype.kill = function kill(){
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

MessageBox.prototype.withinCheck = function withinCheck(world, tileCheck){
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

export default MessageBox;
