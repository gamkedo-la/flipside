const Particle = function Particle({x,y,color,xspeed,yspeed,pool, life = 40}={}){
    this.pos = {x: x, y: y};
    
    this.width = 1;
    this.height = 1;
    this.xspeed = xspeed;
    this.yspeed = yspeed;
    this.life = life;
    this.color = color;

    
    }
    Particle.prototype.draw = function draw(){
        this.oldX = this.x;
        this.oldY = this.y;
        let sx = this.x - viewX;
        let sy = this.y - viewY;
        
        if(inView(sx,sy,24)){
            //pat = dither[random()*15|0]
            renderTarget = SCREEN;
            setColors(this.color, this.color-1);
            pset(sx,sy);
            //pat = dither[8];
        }
    Particle.prototype.update = function update(){
        this.life--
        this.oldX = this.x;
        this.oldY = this.y;
        this.x += this.xspeed;
        this.y += this.yspeed;
        let sx = this.x - viewX;
        let sy = this.y - viewY;

        if(getGID(this.x,this.y) == 1)this.kill();
        
        if(this.life < 0)this.kill();
        
    }

    Particle.prototype.kill = function kill(){
        //splode play
        
        this.pool.splice( this.pool.indexOf(this), 1 );
    }
}