
const ElectricityRenderer = function ElectricityRenderer()
{
    this.drawZap = function(startPos,endPos) {

        let {img, ctx, tileSheetSize} = G;
        
        let sx=0,sy=0,sw=8,sh=8;
        let lw=endPos.x-startPos.x;
        let lh=8;
        let steps = Math.ceil(lw / sw);
        let scount = 16; // electricity sprites
        let spd = 0.01; // time dt to spritenum scroll ratio

        // FIXME: rotated/stretched is not very pixelarty
        // brezenham line w tiled chunks might look better
        
        for (let n=0; n<steps; n++) {
            
            let px = startPos.x + (n * sw);
            let py = startPos.y;

            // light blue flickers
            if (Math.random()<0.15) { // occasionally
            sx = Math.floor(Math.random()*scount)*sw; // random sprite
            ctx.drawImage(
                img.fx,
                sx,sy+sh,sw,sh,
                px,py,sw,sh);
            }

            // dark blue - always drawn
            sx = Math.floor(((performance.now()*spd)+n)%scount)*sw; // scrolling slow
            ctx.drawImage(
                img.fx,
                sx,sy,sw,sh,
                px,py,sw,sh);

        }
    
    }
}

export default ElectricityRenderer