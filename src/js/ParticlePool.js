import { inView } from './util.js'
import { rndOneFrom, range, rndInt } from './math.js';
import G from './G.js';


const ParticlePool = function ParticlePool(size){
    /*
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
    */  //11 parameters
    this.size = size;
    this.tuple = 11;
    this.pool = new Float32Array(this.size * this.tuple).fill(0);
    this.i = 0;
    this.nothingDead = false;
    
    return this;
}
ParticlePool.prototype.spawn = function(x, y , vx, vy, color=22, width=1, height=1, life = 40, type=0){
//    for(let l = 0; l < 15; l++){
//        for(let i = 0; i <= this.pool.length; i+=this.tuple){
//            if(this.pool[i] <= l){
                this.pool[this.i] = life;
                this.pool[this.i+1] = x;
                this.pool[this.i+2] = y;
                this.pool[this.i+3] = vx;
                this.pool[this.i+4] = vy;
                this.pool[this.i+5] = width;
                this.pool[this.i+6] = height;
                this.pool[this.i+7] = color;
                this.pool[this.i+8] = type;
                this.pool[this.i+9] = 0; //prevX
                this.pool[this.i+10] = 0; //prevY
//                break;
//            }
//    }
    
        
//    }
    this.i += this.tuple;
    //reset counter 
    if(this.i >= this.size*this.tuple-this.tuple) this.i = 0; 
}

ParticlePool.prototype.draw = function draw(){

    for(let i = 0; i<=this.pool.length-this.tuple; i+=this.tuple){
        if(this.pool[i+8] == 0) continue;
        
        if(inView(this.pool[i+1],this.pool[i+2])){
            let color;
            let pcolor;

            switch(this.pool[i+8]) {
                case  G.JET: //jetbubble
                    G.rb.circle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/3,
                        27
                        );
                    break;
                case  2: //crossbubble
                    G.rb.circle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/4,
                        26
                        );
                    break;
    
                case G.ENEMYDEATH: //enemydeath
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/4,
                        rndOneFrom([25,26,27,28])
                        );
                    break;

                case G.MUZZLESMOKE: //enemydeath
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/2,
                        rndOneFrom([23,22,37])
                        );
                break;
    
                case G.BULLET: //bullet
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        2,
                        rndOneFrom([22,9,10])
                        );
                    break;
    
                case G.FIRE: //fire
                    color = range(this.pool[i], 0, 19, 0, 9);
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        2,
                        color
                        );
                    G.rb.pset(
                        this.pool[i+1]-G.view.x + rndInt(-2,-2),
                        this.pool[i+2]-G.view.y + rndInt(-3,3),
                        color);
                    break;

                case G.POISONPARTICLE: // like fire, but a different color
                    pcolor = range(this.pool[i], 24, 26, 27, 30); // FIXME: I don't understand this function, these values produced unexpected ranges
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        2,
                        pcolor
                        );
                    G.rb.pset(
                        this.pool[i+1]-G.view.x + rndInt(-2,-2),
                        this.pool[i+2]-G.view.y + rndInt(-3,3),
                        pcolor);
                    break;                        

                case G.PICKUP_NANITE: //enemydeath
                    G.rb.fillRect(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        3,3,
                        rndOneFrom([10,11,12,13])
                        );
                break;

                case G.PICKUP_HEALTH: //enemydeath
                    pcolor = 50;
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        2,
                        pcolor
                        );
                    pcolor = 5;
                    G.rb.pset(
                        this.pool[i+1]-G.view.x + rndInt(-2,-2),
                        this.pool[i+2]-G.view.y + rndInt(-3,3),
                        pcolor);
                break;

                case G.PICKUP_DEATH: 
                    G.rb.fillRect(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/4,
                        this.pool[i]/4,
                        rndOneFrom([10,11,12,13])
                        );
                break;

                case G.BIGPOWERUP: 
                    G.rb.circle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i]/3,
                        7
                        );
                break;

                case G.PLAYER_ITEM_HEALTH: {
                    pcolor = 50;
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        4,
                        pcolor
                        );
                    pcolor = 5;
                    G.rb.pset(
                        this.pool[i+1]-G.view.x + rndInt(-8,8),
                        this.pool[i+2]-G.view.y + rndInt(-8,8),
                        pcolor);
                    break;
                }

                case G.PLAYER_ITEM_NANITE: {
                    pcolor = 11;
                    G.rb.fillCircle(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        4,
                        pcolor
                        );
                    pcolor = 19;
                    G.rb.pset(
                        this.pool[i+1]-G.view.x + rndInt(8,-8),
                        this.pool[i+2]-G.view.y + rndInt(8,-8),
                        pcolor);
                    break;
                }
    
                default:
                    G.rb.fillRect(
                        this.pool[i+1]-G.view.x,
                        this.pool[i+2]-G.view.y,
                        this.pool[i+5],
                        this.pool[i+6],
                        this.pool[i+7]
                        );
            }    
        }
         
    }    
}

ParticlePool.prototype.update = function update(dt){
    
    // this.pool[this.i] = life;
    // this.pool[this.i+1] = x;
    // this.pool[this.i+2] = y;
    // this.pool[this.i+3] = vx;
    // this.pool[this.i+4] = vy;
    // this.pool[this.i+5] = width;
    // this.pool[this.i+6] = height;
    // this.pool[this.i+7] = color;
    // this.pool[this.i+8] = type;
    // this.pool[this.i+9] = 0; //prevX
    // this.pool[this.i+10] = 0; //prevY

    for(let i = 0; i<=this.pool.length-this.tuple; i+=this.tuple){
        if(this.pool[i+8] == 0) continue; //if type == 0, this isn't a particle
        //if life is zero, skip update, increment i 1 tuple. 
        //we don't delete particles, we just don't update or draw them
        
        if(this.pool[i]<=0){this.kill(i); }
        else{
            switch(this.pool[i+G.PARTICLE_TYPE]){
                case G.PICKUP_NANITE: {
                    this.pool[i] = this.pool[i]-1;
                    this.pool[i+9] = this.pool[i+1]; //prevX = this X
                    this.pool[i+10] = this.pool[i+2]; //prevY = this Y;
                    this.pool[i+3] *= 0.98;
                    this.pool[i+4] *= 0.98;

                    this.pool[i+1] += this.pool[i+3]*dt; //x += vx;
                    this.pool[i+2] += this.pool[i+4]*dt; //y += vy;
                    break;

                }

                case G.PLAYER_ITEM_HEALTH: {

                    break;
                }

                case G.PLAYER_ITEM_NANITE: {

                    break;
                }
                default: 
                this.pool[i] = this.pool[i]-1;
                this.pool[i+9] = this.pool[i+1]; //prevX = this X
                this.pool[i+10] = this.pool[i+2]; //prevY = this Y;
                this.pool[i+1] += this.pool[i+3]*dt; //x += vx;
                this.pool[i+2] += this.pool[i+4]*dt; //y += vy;
            // console.log(this.pool[i+1], this.pool[i+2])
            }
            
        }
    }
   
}



ParticlePool.prototype.kill = function kill(index){
    this.pool.fill(0, index, index+10)
}

export default ParticlePool