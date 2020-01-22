import { inView } from './util.js'
import { rndOneFrom, range } from './math.js';
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
    this.rect = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    }

    return this;
}

Particle.prototype.draw = function draw(){
    let { ctx, view } = G;
    this.oldPos = this.pos

    let sx = this.pos.x - view.x;
    let sy = this.pos.y - view.y;

    if(inView(this.pos)){

        switch(this.type) {
            case  'jetBubble':
                G.rb.circle(sx, sy, this.life/3, 27);
                break;
            case 'crossBubble':
                G.rb.circle(sx, sy, this.life/4, 26);
                break;

            case 'enemyDeath':
                G.rb.fillCircle(sx, sy, this.life/4, rndOneFrom([25,26,27,28]));
                break;

            case 'bullet':
                G.rb.fillCircle(sx, sy, 2, rndOneFrom([22,9,10]) );
                break;

            case 'fire':
                let color = range(this.life, 0, 19, 0, 9);
                G.rb.fillCircle(sx, sy, 2, color );
                break;

            default:
                G.rb.fillRect(sx, sy, this.width, this.height, this.color);
        }    
    }
}


Particle.prototype.update = function update(world){
    this.life--
    this.oldPos = this.pos;
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    this.rect = {
        top: this.pos.y - this.height/2,
        left: this.pos.x - this.width/2,
        right: this.pos.x + this.width/2,
        bottom: this.pos.y + this.height/2
    }
    
    if(this.life < 0)this.kill();
    
}

Particle.prototype.kill = function kill(){        
   
   G.particles.splice( G.particles.indexOf(this), 1 );
}

export default Particle