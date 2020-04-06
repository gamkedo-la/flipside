
import G from './G.js'
export function clearScreen(color='#040408'){
    G.ctx.save();
    G.ctx.setTransform(1,0,0,1,0,0);
    G.ctx.fillStyle = color;
    G.ctx.fillRect(0, 0, c.width, c.height);
    G.ctx.restore();
}

export function polyCircle(x,y,r,sides){
    sides = sides || Math.floor( 120 * (r*2) )+16;
    G.ctx.beginPath();
    for(let i = 0; i < sides; i++){
        let j = i/sides * 6.283185;
        let px = x + Math.cos(j)*r;
        let py = y + Math.sin(j)*r;
        //G.ctx.moveTo(px, py);
        G.ctx.lineTo(px,py);
    }
    G.ctx.closePath();
    G.ctx.fill();
}

export function rect(x,y,width,height){
    G.ctx.fillRect(x, y,width, height );
}

export function pset(x,y){
    //assumes global G.ctx
    G.ctx.fillRect(x,y, 1, 1);
}

export function onScreen(position, width = 0, height = 0){

    let padding = 50;
    let x = position.x;
    let y = position.y;
    
/*    let left =   ((-offset.x-padding-cam.x)/cam.scale);
    let top =    ((-offset.y-padding-cam.y)/cam.scale);
    let right =  ((offset.x+padding-cam.x)/cam.scale);
    let bottom = ((offset.y+padding-cam.y)/cam.scale);*/
    const left = G.view.x - width;
    const top = G.view.y - height;
    const right = G.view.x + G.c.width;
    const bottom = G.view.y + G.c.height;

  return x > left && x < right && y > top && y < bottom

  //return true;
  
}

export function makeMosaic(flipped=false){ //totally stealing from deepnight here.
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    let scale = 3; //4
    c.width = 1278;
    c.height = 720;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0,0, c.width, c.height);
    for(var w = 0; w <= 427; w++){ //320

        for(var h = 0; h <= 240; h++){ //180

            ctx.fillStyle = flipped?"#A0A0A0":"#505050";
            ctx.fillRect(w*scale, h*scale, 3, 3); //4

            ctx.fillStyle =  "#808080"; //flipped?"#A08050":"#808080"; // tint?
            ctx.fillRect(w*scale+1, h*scale, 2, 2); //3

            ctx.fillStyle = flipped?"#505050":"#A0A0A0";
            ctx.fillRect(w*scale + 2, h*scale, 1, 1); //2

        }
    }
    return {canvas: c, context: ctx};


}

export function drawTile(x, y, world, gid, tileset){
        let {img, ctx, tileSheetSize} = G
        ctx.drawImage(
            tileset,
            gid%tileSheetSize.height * world.tileSize,
            Math.floor(gid/tileSheetSize.width) * world.tileSize,
            world.tileSize,
            world.tileSize,
            x,
            y,
            world.tileSize, world.tileSize
            );
}

export function spriteFont({
    width, 
    height,  
    characterWidth, 
    characterHeight, 
    characterOrderString = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.0123456789 '!@#$%^&*()+-=,":;><`,
    image }
    ={}
    ){
        this.width = width;
        this.height = height;
        this.characterWidth = characterWidth;
        this.characterHeight = characterHeight;
        
        this.widthInCharacters = Math.floor( width / characterWidth );
        this.heightInCharacters = Math.floor( height / characterHeight );
        this.characterMap = characterOrderString.split("");
        this.image = image;

        return this;
    }

spriteFont.prototype.drawText = function drawText({ textString, pos={x: 0, y: 0}, hspacing=0, vspacing = 2 } = {}){
    if (!textString) return;
    var lines = textString.split("\n");
    var self = this;
    self.pos = pos, self.hspacing = hspacing, self.vspacing = vspacing;
    lines.forEach(function(line, index, arr){
        self.textLine( { textString:line, pos:{x: self.pos.x, y: self.pos.y + index * (self.characterHeight + self.vspacing) }, hspacing: self.hspacing } )
    })
}

spriteFont.prototype.textLine = function textLine({ textString, pos={x: 0, y: 0}, hspacing=0 } = {}){
    var textStringArray = textString.split("");
    var self = this;

    textStringArray.forEach(function(character, index, arr){
        //find index in characterMap
        let keyIndex = self.characterMap.indexOf(character);
        //tranform index into x,y coordinates in spritefont texture
        let spriteX = (keyIndex % self.widthInCharacters) * self.characterWidth;
        let spriteY = Math.floor( keyIndex / self.widthInCharacters ) * self.characterHeight;
        //draw
        //console.log(character);
        
        G.ctx.drawImage(
            self.image,
            spriteX,
            spriteY,
            self.characterWidth,
            self.characterHeight,
            pos.x + ( (self.characterWidth + hspacing) * index),
            pos.y,
            self.characterWidth,
            self.characterHeight
        )
        //console.log(keyIndex);
    })
}

export function preRenderBlendedSprite({img, blendmode, color}={}){
    var stencilCanvas = document.createElement('canvas');
    stencilCanvas.width = img.width;
    stencilCanvas.height = img.height;
    var stencilCTX = stencilCanvas.getContext('2d');
    stencilCTX.drawImage(img, 0,0);
    //set composite mode to stencil, we want to fillbucket with color but preserve alpha
    stencilCTX.globalCompositeOperation = 'source-atop';
    //fillRect over entire stencilcanvas
    stencilCTX.fillStyle = color;
    stencilCTX.fillRect(0,0,stencilCanvas.width, stencilCanvas.height);

    var blendedCanvas = document.createElement('canvas')
    blendedCanvas.width = img.width;
    blendedCanvas.height = img.height;
    var blendedCTX = blendedCanvas.getContext('2d');
    blendedCTX.drawImage(img, 0,0);
    //set composite mode to blendmode
    blendedCTX.globalCompositeOperation = blendmode;
    //draw fillbucket'd canvas overtop
    blendedCTX.drawImage(stencilCanvas, 0, 0);

    
    //return blendedCanvas
    return blendedCanvas; 
}

export function Transitioner() {
   
    this.width = 0;
    this.transitioningIn = true;
    this.done = false;
    this.type = 'wipe';
    this.callback = {};

    this.update = function(dt){
       
        switch(this.type){
            case G.TRANSITION_DEATH:

                if(this.transitioningIn){
                    this.width+=15;
                    if(this.width >= G.c.width){
                        this.callback();
                        requestAnimationFrame(G.frame);
                        this.transitioningIn = false;
                    }
                }else{
                    this.width-=15;
                    if(this.width <= 0){
                        this.done = true;
                        G.transitioning = false;
                        //requestAnimationFrame(G.frame);
                        //return;
                    }
                }


            break;


            default:

                if(this.transitioningIn){
                    this.width+=20;
                    if(this.width >= G.c.width){
                        this.callback();
                        requestAnimationFrame(G.frame);
                        this.transitioningIn = false;
                    }
                }else{
                    this.width-=20;
                    if(this.width <= 0){
                        this.done = true;
                        G.transitioning = false;
                        //requestAnimationFrame(G.frame);
                        //return;
                    }
                }
            
        }
        
    }

    this.render = function(dt){
        G.rb.clear(64);
        switch(this.type){
            case G.TRANSITION_DEATH:
                G.rb.fillRect(0,0,this.width,G.c.height,4);
            break;
            default: 
            G.rb.fillRect(0,0,this.width,G.c.height,0);
            
        }
        G.rb.render();
        if(!this.done){
            requestAnimationFrame(this.frame.bind(this));
        }else{requestAnimationFrame(G.frame)}
        
    }

    this.frame = function(dt){
        this.update(dt);
        this.render(dt);
    }

    this.start = function(type, callback){
        this.type = type;
        this.callback = callback;
        this.done = false;
        this.transitioningIn = true;
        G.transitioning = true;
        requestAnimationFrame(this.frame.bind(this));
    }

}//end Transitioner

export const colors = [
    "rgba(6,6,8,1)", //0
    "rgba(20,16,19,1)", //1
    "rgba(59,23,37,1)", //2
    "rgba(115,23,45,1)", //3
    "rgba(180,32,42,1)", //4
    "rgba(223,62,35,1)", //5
    "rgba(250,106,10,1)", //6
    "rgba(249,163,27,1)", //7
    "rgba(255,213,65,1)", //8
    "rgba(255,252,64,1)", //9
    "rgba(214,242,100,1)", //10
    "rgba(156,219,67,1)", //11
    "rgba(89,193,53,1)", //12
    "rgba(20,160,46,1)", //13
    "rgba(26,122,62,1)", //14
    "rgba(36,82,59,1)", //15

    "rgba(18,32,32,1)", //16
    "rgba(20,52,100,1)", //17
    "rgba(40,92,196,1)", //18
    "rgba(36,159,222,1)", //19
    "rgba(32,214,199,1)", //20
    "rgba(166,252,219,1)", //21
    "rgba(255,255,255,1)", //22
    "rgba(254,243,192,1)", //23
    "rgba(250,214,184,1)", //24
    "rgba(245,160,151,1)", //25
    "rgba(232,106,115,1)", //26
    "rgba(188,74,155,1)", //27
    "rgba(121,58,128,1)", //28
    "rgba(64,51,83,1)", //29
    "rgba(36,34,52,1)", //30
    "rgba(34,28,26,1)", //31

    "rgba(255,255,255,1)", //32
    "rgba(255,255,255,1)", //33
    "rgba(255,255,255,1)", //34
    "rgba(255,255,255,1)", //35
    "rgba(255,255,255,1)", //36
    "rgba(255,255,255,1)", //37
    "rgba(255,255,255,1)", //38
    "rgba(255,255,255,1)", //39
    "rgba(255,255,255,1)", //40
    "rgba(255,255,255,1)", //41
    "rgba(255,255,255,1)", //42
    "rgba(255,255,255,1)", //43
    "rgba(255,255,255,1)", //44
    "rgba(255,255,255,1)", //45
    "rgba(255,255,255,1)", //46
    "rgba(255,255,255,1)", //47

    "rgba(255,255,255,1)", //48
    "rgba(255,255,255,1)", //49
    "rgba(255,255,255,1)", //50
    "rgba(255,255,255,1)", //51
    "rgba(255,255,255,1)", //52
    "rgba(255,255,255,1)", //53
    "rgba(255,255,255,1)", //54
    "rgba(255,255,255,1)", //55
    "rgba(255,255,255,1)", //56
    "rgba(255,255,255,1)", //57
    "rgba(255,255,255,1)", //58
    "rgba(255,255,255,1)", //59
    "rgba(255,255,255,1)", //60
    "rgba(255,255,255,1)", //61
    "rgba(255,255,255,1)", //62
    "rgba(255,255,255,1)", //63

]

