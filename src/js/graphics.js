
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

export function onScreen(position){

    let padding = 50;
    let x = position.x;
    let y = position.y;
    
    let left =   ((-offset.x-padding-cam.x)/cam.scale);
    let top =    ((-offset.y-padding-cam.y)/cam.scale);
    let right =  ((offset.x+padding-cam.x)/cam.scale);
    let bottom = ((offset.y+padding-cam.y)/cam.scale);

  return x > left && x < right && y > top && y < bottom

  //return true;
  
}

export function makeMosaic(){ //totally stealing from deepnight here.
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    let scale = 4;
    c.width = 1280;
    c.height = 720;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0,0, c.width, c.height);
    for(var w = 0; w <= 320; w++){

        for(var h = 0; h <= 180; h++){

            ctx.fillStyle = "#e0e0e0";
            ctx.fillRect(w*scale, h*scale, 2, 2);

            ctx.fillStyle = "#707070";
            ctx.fillRect(w*scale, h*scale + 2, 1, 1);

            ctx.fillStyle = "#f8f8f8";
            ctx.fillRect(w*scale + 2, h*scale, 1, 1);

        }
    }
    return {canvas: c, context: ctx};


}

export const colors = [
    
]