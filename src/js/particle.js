import { inView } from './util.js'
import { rndOneFrom, range, rndFloat, rndInt } from './math.js';
const Particle = function Particle(x, y , vx, vy, color=22, width=1, height=1, life = 40, type='particle'){
    this.x = x;
    this.y = y;
    this.prevX = 0;
    this.prevY = 0;
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
    let { view } = G;

    let sx = this.x - view.x;
    let sy = this.y - view.y;

    if(inView(this.x,this.y)){

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
                G.rb.pset(sx + rndInt(-2,-2), sy + rndInt(-3,3), color);
                break;

            default:
                G.rb.fillRect(sx, sy, this.width, this.height, this.color);
        }    
    }
}


Particle.prototype.update = function update(world){
    this.life--
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    this.rect = {
        top: this.y - this.height/2,
        left: this.x - this.width/2,
        right: this.x + this.width/2,
        bottom: this.y + this.height/2
    }
    
    if(this.life < 0)this.kill();
    
}

Particle.prototype.kill = function kill(){        
   
   G.particles.splice( G.particles.indexOf(this), 1 );
}

export default Particle