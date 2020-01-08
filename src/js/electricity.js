
const ElectricityRenderer = function ElectricityRenderer()
{
    // multi-line electricity effect
    this.drawZap = function(startPos,endPos) {
        this.bolt(startPos,endPos,1,3,10,"rgba(255,255,255,0.5)");
        this.bolt(startPos,endPos,1,6,10,"rgba(0,255,255,0.5)");
        this.bolt(startPos,endPos,1,6,10,"rgba(0,255,255,0.5)");
        //this.bolt(startPos,endPos,1,4,20,"rgba(0,0,255)");
    }
    
    // canvas line drawing version, looks better
    this.bolt = function(startPos,endPos,width=1,chaos=6,numChunks=10,rgba="rgba(0,255,255)") {
        let {img, ctx, tileSheetSize} = G;

        ctx.beginPath();
        ctx.beginPath();
        ctx.strokeStyle = rgba;
        ctx.lineWidth = width;
        ctx.moveTo(startPos.x,startPos.y);

        for (let chunk=0; chunk<numChunks-1; chunk++) {
            let percent = (chunk+1) / numChunks;
            // linear interp
            let x = startPos.x + ((endPos.x - startPos.x) * percent);
            let y = startPos.y + ((endPos.y - startPos.y) * percent);
            // perturb
            x += (Math.random()*chaos*2)-chaos;
            y += (Math.random()*chaos*2)-chaos;
            ctx.lineTo(x,y);
        }
        
        ctx.lineTo(endPos.x,endPos.y);
        ctx.stroke();
    }

    // lame tile-based solution, looks bad
    this.drawZapUsingSprites = function(startPos,endPos) {
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