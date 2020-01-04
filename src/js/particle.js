import { inView } from './util.js'
const Particle = function Particle({x,y,vx,vy,color=22,width=1,height=1, life = 40}={}){
    this.pos = {x: x, y: y};
    this.oldPos = {x: 0, y: 0};
    this.width = width;
    this.height = height;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.color = color;

    return this;
}

Particle.prototype.draw = function draw(){
let { ctx, view } = G;
this.oldPos = this.pos

let sx = this.pos.x - view.x;
let sy = this.pos.y - view.y;

if(inView(this.pos)){
    ctx.drawImage(
        G.img.aap64,
        0,
        this.color,
        1,
        1,
        Math.round(sx),
        Math.round(sy),
        this.width,
        this.height
    )
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