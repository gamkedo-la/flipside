import { rndInt, rndFloat, range } from './math.js';

const SPARK_CHANCE = 0.35; // if >0 ends of line occasionally spark

const ElectricityRenderer = function ElectricityRenderer()
{
    // multi-line electricity effect
    this.drawZap = function(x0,y0,x1,y1,color="rgba(0,190,255,1)") {
        G.ctx.save();
        G.ctx.globalCompositeOperation = 'screen';
        this.bolt(x0,y0,x1,y1,1,1,20,"rgba(255,255,255,1)");
        this.bolt(x0,y0,x1,y1,1,2,20, color);
        this.bolt(x0,y0,x1,y1,1,3,20, color);
        this.bolt(x0,y0,x1,y1,1,4,20, color);
        if (SPARK_CHANCE>0 && Math.random()<SPARK_CHANCE) this.spark(x0,y0);
        if (SPARK_CHANCE>0 && Math.random()<SPARK_CHANCE) this.spark(x1,y1);
        G.ctx.restore();
        //this.bolt(x0,y0,x1,y1,1,4,20,"rgba(0,0,255)");
    }

    this.spark = function(x,y) {
        // particles already accounts for camera position
        x += G.view.x;
        y += G.view.y;
        G.particles.spawn(
            x,
            y,
            Math.random()*110-55,
            Math.random()*110-55,
            rndInt(16,22), // blue to white
            1, 
            1,
            10,
            'particle'
        ) ;       
    }

    function hitWall(x,y) {
        // we need to remove the camera offset
        let tx = Math.round((x+G.view.x) / G.world.tileSize);
        let ty = Math.round((y+G.view.y) / G.world.tileSize);
        let tileHit = G.world.getTileAtPosition(tx,ty); 
        let maxTileIndex = G.player.cloudTilesStartIndex;//.collideIndex;
        return tileHit > maxTileIndex; // true=blocked
    }

    // canvas line drawing version, looks better
    this.bolt = function(x0,y0,x1,y1,width=1,chaos=6,numChunks=10,rgba="rgba(0,255,255)",collideWithMap=false) {
        let {img, ctx, tileSheetSize} = G;
        let hit = false;

        ctx.beginPath();
        ctx.strokeStyle = rgba;
        ctx.lineWidth = width;
        ctx.moveTo(x0,y0);

        for (let chunk=0; chunk<numChunks-1; chunk++) {
            let percent = (chunk+1) / numChunks;
            // linear interp
            let lx = x0 + ((x1 - x0) * percent);
            let ly = y0 + ((y1 - y0) * percent);
            // perturb
            lx += (Math.random()*chaos*2)-chaos;
            ly += (Math.random()*chaos*2)-chaos;
            // optionally stop short when we hit a wall
            if (collideWithMap && hitWall(lx,ly)) { 
                //console.log('bolt collided with wall!');
                hit = true;
                break; // out of the loop early
            }
            // set next line segment
            if (!hit) ctx.lineTo(lx,ly);
            // FIXME ideally actually find the contact point
        }
        
        // made it all the way? finish up the line
        if (!hit) ctx.lineTo(x1,y1);

        // render
        ctx.stroke();
    }

    // lame tile-based solution, looks bad
    /*
    this.drawZapUsingSprites = function(x0,y0,x1,y1) {
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
    */

    /*
    this.stressTest = function() {
        let tmp = performance.now();
        this.drawZap(
            { x:300+Math.cos(tmp*0.0015)*32-G.view.x,
            y:380+Math.cos(tmp*0.0005)*32-G.view.y}, 
            { x:360+Math.cos(tmp*0.003)*32-G.view.x,
            y:420+Math.cos(tmp*0.002)*32-G.view.y });
        this.drawZap(
            { x:200+Math.cos(tmp*0.0015)*32-G.view.x,
            y:280+Math.cos(tmp*0.0005)*32-G.view.y}, 
            { x:160+Math.cos(tmp*0.003)*32-G.view.x,
            y:320+Math.cos(tmp*0.002)*32-G.view.y });
        this.drawZap(
            { x:400+Math.cos(tmp*0.0015)*32-G.view.x,
            y:420+Math.cos(tmp*0.0005)*32-G.view.y}, 
            { x:560+Math.cos(tmp*0.003)*32-G.view.x,
            y:420+Math.cos(tmp*0.002)*32-G.view.y });
        this.drawZap(
            { x:200+Math.cos(tmp*0.0015)*32-G.view.x,
            y:580+Math.cos(tmp*0.0005)*32-G.view.y}, 
            { x:260+Math.cos(tmp*0.003)*32-G.view.x,
            y:520+Math.cos(tmp*0.002)*32-G.view.y });
    }
    */

}

export default ElectricityRenderer