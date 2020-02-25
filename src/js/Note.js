import { rndInt, rndFloat } from "./math.js";
import { showMessage } from "./UI.js";
import { rectCollision } from "./util.js";
import G from "./G.js";


const Note = function Note(obj){
    this.message = obj.properties.find(function(e){return e.name == 'message'}).value;
    //this.speaker = obj.properties.find(function(e){return e.name == 'speaker'}).value;
    // this.name = obj.name;
    // this.type = obj.type;
    // this.startY = obj.y;
    this.pos = {x: obj.x, y: obj.y};
    //this.height = obj.height;
    //this.width = obj.width;
    //this.rect={};
    return this;
}

Note.prototype.update = function update(dt){

    //this.currentAnimation.update();

    // this.rect = {
    //     top: this.pos.y,
    //     left: this.pos.x,
    //     right: this.pos.x + this.width,
    //     bottom: this.pos.y + this.height
    // }

    // if(rectCollision(this.rect, G.player.rect)){
    //     let particles = 3;
    //     while(--particles){
    //         G.particles.spawn(
    //             rndInt(this.rect.left, this.rect.right),
    //             this.rect.top,
    //             0,
    //             rndFloat(-20,-70),
    //             21,
    //             1,
    //             2,
    //             10,
    //             0
    //         )
    //     }
        
    //     if(G.player.input.up){
    //         showMessage(this.message, this.speaker);
    //         if(G.showMessageCooldown)
    //         G.audio.playSound(G.sounds.test2, 0, 1, 1, false);
    //     }
        
    // }
}

Note.prototype.render = function render(dt){
   
    G.tinyFont.drawText({
        textString: this.message,
        pos: { x: Math.floor(this.pos.x - G.view.x), y: Math.floor(this.pos.y-G.view.y) },
        spacing: 0
        })
}

Note.prototype.kill = function kill(){
    G.world.entities.splice(G.world.entities.indexOf(this), 1);
}

export default Note;
