export function clearScreen(color='#040408'){
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
}

export function polyCircle(x,y,r,sides){
    sides = sides || Math.floor( 120 * (r*2) )+16;
    ctx.beginPath();
    for(let i = 0; i < sides; i++){
        let j = i/sides * 6.283185;
        let px = x + Math.cos(j)*r;
        let py = y + Math.sin(j)*r;
        //ctx.moveTo(px, py);
        ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fill();
}

export function rect(x,y,width,height){
    ctx.fillRect(x, y,width, height );
}

export function pset(x,y){
    //assumes global ctx
    ctx.fillRect(x,y, 1, 1);
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

export const colors = [
    
]