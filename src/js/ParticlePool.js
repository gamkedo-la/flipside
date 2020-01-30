import { inView } from './util.js'
import { rndOneFrom, range, rndInt } from './math.js';
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
    this.pool = new Float32Array(this.size*this.tuple);
    this.i = 0;
    
    return this;
}
ParticlePool.prototype.spawn = function(x, y , vx, vy, color=22, width=1, height=1, life = 40, type=0){
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
    
    //increment index to be ready for next spawned particle
    this.i >= this.size*this.tuple ? this.i = 0 : this.i += this.tuple;
}

ParticlePool.prototype.draw = function draw(){

    for(let i = 0; i<this.pool.length; i+=this.tuple){

        if(this.pool[i] <= 0){i+=this.tuple}else{
           // console.log(this.pool[i+1], this.pool[i+2]);

            if(inView(this.pool[i+1],this.pool[i+2])){

                switch(this.pool[i+8]) {
                    case  1: //jetbubble
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
        
                    case 3: //enemydeath
                        G.rb.fillCircle(
                            this.pool[i+1]-G.view.x,
                            this.pool[i+2]-G.view.y,
                            this.pool[i]/4,
                            rndOneFrom([25,26,27,28])
                            );
                        break;
        
                    case 4: //bullet
                        G.rb.fillCircle(
                            this.pool[i+1]-G.view.x,
                            this.pool[i+2]-G.view.y,
                            2,
                            rndOneFrom([22,9,10])
                            );
                        break;
        
                    case 5: //fire
                        let color = range(this.pool[i], 0, 19, 0, 9);
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
}

ParticlePool.prototype.update = function update(){
    
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

    for(let i = 0; i<this.pool.length; i+=this.tuple){
        //if life is zero, skip update, increment i 1 tuple. 
        //we don't delete particles, we just don't update or draw them
        if(this.pool[i]<=0){i+=this.tuple}
        else{
            this.pool[i] = this.pool[i]-1;
            this.pool[i+9] = this.pool[i+1]; //prevX = this X
            this.pool[i+10] = this.pool[i+2]; //prevY = this Y;
            this.pool[i+1] += this.pool[i+3]; //x += vx;
            this.pool[i+2] += this.pool[i+4]; //y += vy;
           // console.log(this.pool[i+1], this.pool[i+2])
        }
        
        //no more rect object, we'll do that inline when needed
    }
    // this.life--
    // this.prevX = this.x;
    // this.prevY = this.y;
    // this.x += this.vx;
    // this.y += this.vy;
    // this.rect = {
    //     top: this.y - this.height/2,
    //     left: this.x - this.width/2,
    //     right: this.x + this.width/2,
    //     bottom: this.y + this.height/2
    // }
}

export default ParticlePool