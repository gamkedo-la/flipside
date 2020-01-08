
const ElectricityRenderer = function ElectricityRenderer()
{
    this.drawZap = function(startPos,endPos) {

        let {img, ctx, tileSheetSize} = G;

        let sw=8,sh=8,sx=0,sy=0,scount=16,spd=0.01;
        let x1 = Math.round(startPos.x / sw);
        let x2 = Math.round(endPos.x / sw);
        let y1 = Math.round(startPos.y / sh);
        let y2 = Math.round(endPos.y / sh);

        var dy = (y2 - y1);
        var dx = (x2 - x1);
        var stepx, stepy;
    
        if (dy < 0) { dy = -dy; stepy = -1;
        } else { stepy = 1; }
    
        if (dx < 0) { dx = -dx; stepx = -1;
        } else { stepx = 1; }
    
        dy <<= 1;        // dy is now 2*dy
        dx <<= 1;        // dx is now 2*dx
    
        sx = Math.floor(((performance.now()*spd)+x1)%scount)*sw; // scrolling slow
        ctx.drawImage(img.fx,sx,sy,sw,sh,x1*sw,y1*sh,sw,sh);
        sx = Math.floor(Math.random()*scount)*sw; // random sprite
        if (Math.random()<0.1) ctx.drawImage(img.fx,sx,sy+sh,sw,sh,x1*sw+Math.round(Math.random()*sw-sw/2),y1*sh+Math.round(Math.random()*sh-sh/2),sw,sh);
    
        if (dx > dy) {
          var fraction = dy - (dx >> 1);  // same as 2*dy - dx
          while (x1 != x2) {
            if (fraction >= 0) {
              y1 += stepy;
              fraction -= dx;          // same as fraction -= 2*dx
            }
            x1 += stepx;
            fraction += dy;              // same as fraction -= 2*dy

            sx = Math.floor(((performance.now()*spd)+x1)%scount)*sw; // scrolling slow
            ctx.drawImage(img.fx,sx,sy,sw,sh,x1*sw,y1*sh,sw,sh);
            sx = Math.floor(Math.random()*scount)*sw; // random sprite
            if (Math.random()<0.1) ctx.drawImage(img.fx,sx,sy+sh,sw,sh,x1*sw+Math.round(Math.random()*sw-sw/2),y1*sh+Math.round(Math.random()*sh-sh/2),sw,sh);

          }
          ;
        } else {
          fraction = dx - (dy >> 1);
          while (y1 != y2) {
            if (fraction >= 0) {
              x1 += stepx;
              fraction -= dy;
            }
            y1 += stepy;
            fraction += dx;

            sx = Math.floor(((performance.now()*spd)+x1)%scount)*sw; // scrolling slow
            ctx.drawImage(img.fx,sx,sy,sw,sh,x1*sw,y1*sh,sw,sh);
            sx = Math.floor(Math.random()*scount)*sw; // random sprite
            if (Math.random()<0.1) ctx.drawImage(img.fx,sx,sy+sh,sw,sh,x1*sw+Math.round(Math.random()*sw-sw/2),y1*sh+Math.round(Math.random()*sh-sh/2),sw,sh);

          }
        }
    
      }

}

export default ElectricityRenderer