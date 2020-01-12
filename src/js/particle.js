import { inView } from './util.js'
const Particle = function Particle({x,y,vx,vy,color=22,width=1,height=1, life = 40, type='particle'}={}){
    this.pos = {x: x, y: y};
    this.oldPos = {x: 0, y: 0};
    this.width = width;
    this.height = height;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.color = color;
    this.type = type;

    return this;
}

Particle.prototype.draw = function draw(){
let { ctx, view } = G;
this.oldPos = this.pos

let sx = this.pos.x - view.x;
let sy = this.pos.y - view.y;

if(inView(this.pos)){
    if(this.type == 'jetBubble'){
        G.rb.circle(sx, sy, this.life/3, this.color);
    }
    else{
        G.rb.fillRect(sx, sy, this.width, this.height, this.color);
    }
}
    
}

Particle.prototype.update = function update(world){
    this.life--
    this.oldPos = this.pos;
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    
    if(this.life < 0)this.kill();
    
}

Particle.prototype.kill = function kill(){        
   
   G.particles.splice( G.particles.indexOf(this), 1 );
}

export default Particle