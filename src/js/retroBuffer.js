//--------------Engine.js-------------------

const WIDTH =     428;
const HEIGHT =    256;
const PAGES =     10;  //page = 1 screen HEIGHTxWIDTH worth of screenbuffer.
const PAGESIZE = WIDTH*HEIGHT;

const SCREEN = 0;
const BUFFER = PAGESIZE;
const SPRITES = PAGESIZE*4;

//Cantelope's dweet/codegolf shorthands
S=Math.sin;
C=Math.cos;

audioCtx = new AudioContext;
audioMaster = audioCtx.createGain();
audioMaster.connect(audioCtx.destination);

//relative drawing position and pencolor, for drawing functions that require it.
cursorX = 0;
cursorY = 0;
cursorColor = 22;

fontString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()";

//default palette index
palDefault = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
                    32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63];

var
c =               document.getElementById('canvas'),
ctx =             c.getContext('2d'),
renderTarget =    0x00000,
renderSource =    PAGESIZE, //buffer is ahead one screen's worth of pixels

//Adigun Azikiwe Polack's AAP64 Palette.
//ofcourse you can change this to whatever you like, up to 256 colors.
//one GOTCHA: colors are stored 0xAABBGGRR, so you'll have to flop the values from your typical hex colors.

colors =
[
0xff080606,
0xff131014,
0xff25173B,
0xff2D1773,
0xff2A20B4,
0xff233EDF,
0xff0A6AFA,
0xff1BA3F9,
0xff41D5FF,
0xff40FCFF,
0xff64F2D6,
0xff43DB9C,
0xff35C159,
0xff2EA014,
0xff3E7A1A,
0xff3B5224,

0xff202012,
0xff643414,
0xffC45C28,
0xffDE9F24,
0xffC7D620,
0xffDBFCA6,
0xffFFFFFF,
0xffC0F3FE,
0xffB8D6FA,
0xff97A0F5,
0xff736AE8,
0xff9B4ABC,
0xff803A79,
0xff533340,
0xff342224,
0xff1A1C22,

0xff282b32,
0xff3b4171,
0xff4775bb,
0xff63a4db,
0xff9cd2f4,
0xffeae0da,
0xffd1b9b3,
0xffaf938b,
0xff8d756d,
0xff62544a,
0xff413933,
0xff332442,
0xff38315b,
0xff52528e,
0xff6a75ba,
0xffa3b5e9,

0xffffe6e3,
0xfffbbfb9,
0xffe49b84,
0xffbe8d58,
0xff857d47,
0xff4e6723,
0xff648432,
0xff8daf5d,
0xffbadc92,
0xffe2f7cd,
0xffaad2e4,
0xff8bb0c7,
0xff6286a0,
0xff556779,
0xff444e5a,
0xff343942,]

//active palette index. maps to indices in colors[]. can alter this whenever for palette effects.
pal =            [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
                  32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63];

//paldrk =          [0,0,1,2,3,4,5,6,6,10,11,12,13,14,2,2,15,16,17,18,22,20,23,24,25,26,2,2,27,28,31,13]

ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

c.width = WIDTH;
c.height = HEIGHT;
var imageData =   ctx.getImageData(0, 0, WIDTH, HEIGHT),
buf =             new ArrayBuffer(imageData.data.length),
buf8 =            new Uint8Array(buf),
data =            new Uint32Array(buf),
ram =             new Uint8Array(WIDTH * HEIGHT * PAGES);

//--------------graphics functions----------------

  function clear(color = 0){
    ram.fill(color, renderTarget, renderTarget + PAGESIZE);
  }

  function pset(x=cursorX, y=cursorY, color=cursorColor) { //an index from colors[], 0-63
    x = x|0;
    y = y|0;
    color = color|0;
    if(x < 1 | x > WIDTH-1) return;
    if(y < 1 | y > HEIGHT-1) return;
    ram[renderTarget + y * WIDTH + x] = color;
  }

  function pget(x=cursorX, y=cursorY, page=renderTarget){
    return ram[page + x + y * WIDTH];
  }

  function moveTo(x,y){
    cursorX = x;
    cursorY = y;
  }

  function lineTo(x,y, color=cursorColor){
    line(cursorX, cursorY, x, y, color);
    cursorX = x;
    cursorY = y;
  }

  function line(x1, y1, x2, y2, color=cursorColor) {

    x1 = x1|0;
    x2 = x2|0;
    y1 = y1|0;
    y2 = y2|0;

    var dy = (y2 - y1);
    var dx = (x2 - x1);
    var stepx, stepy;

    if (dy < 0) {
      dy = -dy;
      stepy = -1;
    } else {
      stepy = 1;
    }
    if (dx < 0) {
      dx = -dx;
      stepx = -1;
    } else {
      stepx = 1;
    }
    dy <<= 1;        // dy is now 2*dy
    dx <<= 1;        // dx is now 2*dx

    pset(x1, y1, color);
    if (dx > dy) {
      var fraction = dy - (dx >> 1);  // same as 2*dy - dx
      while (x1 != x2) {
        if (fraction >= 0) {
          y1 += stepy;
          fraction -= dx;          // same as fraction -= 2*dx
        }
        x1 += stepx;
        fraction += dy;              // same as fraction -= 2*dy
        pset(x1, y1, color);
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
        pset(x1, y1, color);
      }
    }

  }

  function circle(xm=cursorX, ym=cursorY, r=5, color=cursorColor) {
    xm = xm|0;
    ym = ym|0;
    r = r|0;
    color = color|0;
    var x = -r, y = 0, err = 2 - 2 * r;
    /* II. Quadrant */
    do {
      pset(xm - x, ym + y, color);
      /*   I. Quadrant */
      pset(xm - y, ym - x, color);
      /*  II. Quadrant */
      pset(xm + x, ym - y, color);
      /* III. Quadrant */
      pset(xm + y, ym + x, color);
      /*  IV. Quadrant */
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      /* e_xy+e_y < 0 */
      if (r > x || err > y) err += ++x * 2 + 1;
      /* e_xy+e_x > 0 or no 2nd y-step */

    } while (x < 0);
  }

  function fillCircle(xm, ym, r=5, color=cursorColor) {
    xm = xm|0;
    ym = ym|0;
    r = r|0;
    color = color|0;

    if(r < 0) return;
    xm = xm|0; ym = ym|0, r = r|0; color = color|0;
    var x = -r, y = 0, err = 2 - 2 * r;
    /* II. Quadrant */
    do {
      line(xm-x, ym-y, xm+x, ym-y, color);
      line(xm-x, ym+y, xm+x, ym+y, color);
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
  }

  function rect(x, y, w=16, h=16, color=cursorColor) {
    x1 = x|0;
    y1 = y|0;
    x2 = (x+w)|0;
    y2 = (y+h)|0;


    line(x1,y1, x2, y1, color);
    line(x2, y1, x2, y2, color);
    line(x1, y2, x2, y2, color);
    line(x1, y1, x1, y2, color);
  }

  function fillRect(x, y, w=16, h=16, color=cursorColor) {
    x1 = x|0;
    y1 = y|0;
    x2 = (x+w)|0;
    y2 = (y+h)|0;
    color = color|0;

    var i = Math.abs(y2 - y1);
    line(x1, y1, x2, y1, color);

    if(i > 0){
      while (--i) {
        line(x1, y1+i, x2, y1+i, color);
      }
    }

    line(x1,y2, x2, y2, color);
  }

  function cRect(x,y,w,h,c,color=cursorColor){
    x = x|0;
    y = y|0;
    w = w|0;
    h = h|0;
    c = c|0;
    color = color|0;
    for(let i = 0; i <= c; i++){
      fillRect(x+i,y-i,w-i*2,h+i*2,color);
    }
  }

  function outline(renderSource, renderTarget, color=cursorColor, color2=color, color3=color, color4=color){

    for(let i = 0; i <= WIDTH; i++ ){
      for(let j = 0; j <= HEIGHT; j++){
        let left = i-1 + j * WIDTH;
        let right = i+1 + j * WIDTH;
        let bottom = i + (j+1) * WIDTH;
        let top = i + (j-1) * WIDTH;
        let current = i + j * WIDTH;

        if(ram[renderSource + current]){
          if(!ram[renderSource + left]){
            ram[renderTarget + left] = color;
          };
          if(!ram[renderSource + right]){
            ram[renderTarget + right] = color3;
          };
          if(!ram[renderSource + top]){
            ram[renderTarget + top] = color2;
          };
          if(!ram[renderSource + bottom]){
            ram[renderTarget + bottom] = color4;
          };
        }
      }
    }
  }

  function triangle(x1, y1, x2, y2, x3, y3, color=cursorColor) {
    line(x1,y1, x2,y2, color);
    line(x2,y2, x3,y3, color);
    line(x3,y3, x1,y1, color);
  }

  function fillTriangle( x1, y1, x2, y2, x3, y3, color=cursorColor ) {
    //I don't pretend to know how this works exactly; I know it uses barycentric coordinates.
    //Might replace with simpler line-sweep; haven't perf tested yet.
    var canvasWidth = WIDTH;
    // http://devmaster.net/forums/topic/1145-advanced-rasterization/
    // 28.4 fixed-point coordinates
    var x1 = Math.round( 16 * x1 );
    var x2 = Math.round( 16 * x2 );
    var x3 = Math.round( 16 * x3 );
    var y1 = Math.round( 16 * y1 );
    var y2 = Math.round( 16 * y2 );
    var y3 = Math.round( 16 * y3 );
    // Deltas
    var dx12 = x1 - x2, dy12 = y2 - y1;
    var dx23 = x2 - x3, dy23 = y3 - y2;
    var dx31 = x3 - x1, dy31 = y1 - y3;
    // Bounding rectangle
    var minx = Math.max( ( Math.min( x1, x2, x3 ) + 0xf ) >> 4, 0 );
    var maxx = Math.min( ( Math.max( x1, x2, x3 ) + 0xf ) >> 4, WIDTH );
    var miny = Math.max( ( Math.min( y1, y2, y3 ) + 0xf ) >> 4, 0 );
    var maxy = Math.min( ( Math.max( y1, y2, y3 ) + 0xf ) >> 4, HEIGHT );
    // Block size, standard 8x8 (must be power of two)
    var q = 8;
    // Start in corner of 8x8 block
    minx &= ~(q - 1);
    miny &= ~(q - 1);
    // Constant part of half-edge functions
    var c1 = -dy12 * x1 - dx12 * y1;
    var c2 = -dy23 * x2 - dx23 * y2;
    var c3 = -dy31 * x3 - dx31 * y3;
    // Correct for fill convention
    if ( dy12 > 0 || ( dy12 == 0 && dx12 > 0 ) ) c1 ++;
    if ( dy23 > 0 || ( dy23 == 0 && dx23 > 0 ) ) c2 ++;
    if ( dy31 > 0 || ( dy31 == 0 && dx31 > 0 ) ) c3 ++;

    c1 = (c1 - 1) >> 4;
    c2 = (c2 - 1) >> 4;
    c3 = (c3 - 1) >> 4;
    // Set up min/max corners
    var qm1 = q - 1; // for convenience
    var nmin1 = 0, nmax1 = 0;
    var nmin2 = 0, nmax2 = 0;
    var nmin3 = 0, nmax3 = 0;
    if (dx12 >= 0) nmax1 -= qm1*dx12; else nmin1 -= qm1*dx12;
    if (dy12 >= 0) nmax1 -= qm1*dy12; else nmin1 -= qm1*dy12;
    if (dx23 >= 0) nmax2 -= qm1*dx23; else nmin2 -= qm1*dx23;
    if (dy23 >= 0) nmax2 -= qm1*dy23; else nmin2 -= qm1*dy23;
    if (dx31 >= 0) nmax3 -= qm1*dx31; else nmin3 -= qm1*dx31;
    if (dy31 >= 0) nmax3 -= qm1*dy31; else nmin3 -= qm1*dy31;
    // Loop through blocks
    var linestep = (canvasWidth-q);
    for ( var y0 = miny; y0 < maxy; y0 += q ) {
      for ( var x0 = minx; x0 < maxx; x0 += q ) {
        // Edge functions at top-left corner
        var cy1 = c1 + dx12 * y0 + dy12 * x0;
        var cy2 = c2 + dx23 * y0 + dy23 * x0;
        var cy3 = c3 + dx31 * y0 + dy31 * x0;
        // Skip block when at least one edge completely out
        if (cy1 < nmax1 || cy2 < nmax2 || cy3 < nmax3) continue;
        // Offset at top-left corner
        var offset = (x0 + y0 * canvasWidth);
        // Accept whole block when fully covered
        if (cy1 >= nmin1 && cy2 >= nmin2 && cy3 >= nmin3) {
          for ( var iy = 0; iy < q; iy ++ ) {
            for ( var ix = 0; ix < q; ix ++, offset ++ ) {
              ram[renderTarget + offset] = color;
            }
            offset += linestep;
          }
        } else { // Partially covered block
          for ( var iy = 0; iy < q; iy ++ ) {
            var cx1 = cy1;
            var cx2 = cy2;
            var cx3 = cy3;
            for ( var ix = 0; ix < q; ix ++ ) {
              if ( (cx1 | cx2 | cx3) >= 0 ) {
                ram[renderTarget + offset] = color;
              }
              cx1 += dy12;
              cx2 += dy23;
              cx3 += dy31;
              offset ++;
            }
            cy1 += dx12;
            cy2 += dx23;
            cy3 += dx31;
            offset += linestep;
          }
        }
      }
    }
  }

  function spr(sx = 0, sy = 0, sw = WIDTH, sh = HEIGHT, x=0, y=0, flipx = false, flipy = false, palette=pal){

    sx = sx|0
    sy = sy|0
    sw = sw|0
    sh = sh|0
    x = x|0
    y = y|0

    for(var i = 0; i < sh; i++){

      for(var j = 0; j < sw; j++){

        if(y+i < HEIGHT && x+j < WIDTH && y+i > -1 && x+j > -1){
          if(flipx & flipy){

            if(ram[(renderSource + ( ( sy + (sh-i) )*WIDTH+sx+(sw-j)))] > 0) {

              ram[ (renderTarget + ((y+i)*WIDTH+x+j)) ] = palette[ ram[(renderSource + ((sy+(sh-i))*WIDTH+sx+(sw-j)))] ];

            }

          }
          else if(flipy && !flipx){

            if(ram[(renderSource + ( ( sy + (sh-i) )*WIDTH+sx+j))] > 0) {

              ram[ (renderTarget + ((y+i)*WIDTH+x+j)) ] = palette[ ram[(renderSource + ((sy+(sh-i))*WIDTH+sx+j))] ];

            }

          }
          else if(flipx && !flipy){

            if(ram[(renderSource + ((sy+i)*WIDTH+sx+(sw-j)))] > 0) {

              ram[ (renderTarget + ((y+i)*WIDTH+x+j)) ] = palette[ ram[(renderSource + ((sy+i)*WIDTH+sx+(sw-j)))] ];

            }

          }
          else if(!flipx && !flipy){

            if(ram[(renderSource + ((sy+i)*WIDTH+sx+j))] > 0) {

              ram[ (renderTarget + ((y+i)*WIDTH+x+j)) ] = palette [ ram[(renderSource + ((sy+i)*WIDTH+sx+j))] ] ;

            }

          }
        }
      }
    }
  }

  function sspr(sx = 0, sy = 0, sw = 16, sh = 16, x=0, y=0, dw=16, dh=16, palette=pal){

    sx = sx|0
    sy = sy|0
    sw = sw|0
    sh = sh|0
    x = x|0
    y = y|0
    dw = dw|0
    dh = dh|0

    var xratio = sw / dw;
    var yratio = sh / dh;

    for(var i = 0; i < dh; i++){
      for(var j = 0; j < dw; j++){

        px = (j*xratio)|0;
        py = (i*yratio)|0;

        if(y+i < HEIGHT && x+j < WIDTH && y+i > -1 && x+j > -1) {
          if (ram[(renderSource + ((sy + py) * WIDTH + sx + px))] > 0) {
            ram[(renderTarget + ((y + i) * WIDTH + x + j))] = palette[ ram[(renderSource + ((sy + py) * WIDTH + sx + px))] ]
          }
        }

      }
    }


  }

  function rspr( sx, sy, sw, sh, destCenterX, destCenterY, scale, angle, palette=pal ){

    //angle = angle * 0.0174533 //convert to radians in place
    let sourceCenterX = (sw / 2)|0;
    let sourceCenterY = (sh / 2)|0;

   let destWidth = sw * scale;
    let destHeight = sh * scale;

   let halfWidth = (destWidth / 2 * 1.41421356237)|0 + 5;  //area will always be square, hypotenuse trick
    let halfHeight = (destHeight / 2 * 1.41421356237)|0 + 5;

   let startX = -halfWidth;
    let endX = halfWidth;

   let startY = -halfHeight;
    let endY = halfHeight;

   let scaleFactor = 1.0 / scale;

   let cos = Math.cos(-angle) * scaleFactor;
   let sin = Math.sin(-angle) * scaleFactor;

   for(let y = startY; y < endY; y++){
      for(let x = startX; x < endX; x++){

       let u = sourceCenterX + Math.round(cos * x + sin * y);
        let v = sourceCenterY + Math.round(-sin * x + cos * y);

       let drawX = (x + destCenterX)|0;
        let drawY = (y + destCenterY)|0;

       //screen check. otherwise drawn pix will wrap to next line due to 1D nature of buffer array
       if(drawX > 0 && drawX < WIDTH && drawY > 0 && drawY < HEIGHT){

          if(u >= 0 && v >= 0 && u < sw && v < sh){
          if( ram[renderSource + (u+sx) + (v+sy) * WIDTH] > 0) {
            ram[renderTarget + drawX + drawY * WIDTH] = palette[ ram[renderSource + (u+sx) + (v+sy) * WIDTH] ]
          }

        }

       }


     } //end x loop

   } //end outer y loop
  }

  function checker(x, y, w, h, nRow, nCol, color=cursorColor) {
    //var w = 256;
    //var h = 256;

    nRow = nRow || 8;    // default number of rows
    nCol = nCol || 8;    // default number of columns

    w /= nCol;            // width of a block
    h /= nRow;            // height of a block

    for (var i = 0; i < nRow; ++i) {
      for (var j = 0, col = nCol / 2; j < col; ++j) {
        let bx = x + (2 * j * w + (i % 2 ? 0 : w) );
        let by = i * h;
        fillRect(bx, by, w-1, h-1, color);
      }
    }
  }

  function imageToRam(image, address) {

         //var image = E.smallcanvas.toDataURL("image/png");
          let tempCanvas = document.createElement('canvas');
         tempCanvas.width = WIDTH;
         tempCanvas.height = HEIGHT;
         let context = tempCanvas.getContext('2d');
         //draw image to canvas
         context.drawImage(image, 0, 0);

         //get image data
         var imageData = context.getImageData(0,0, WIDTH, HEIGHT);

         //set up 32bit view of buffer
         let data = new Uint32Array(imageData.data.buffer);

         //compare buffer to palette (loop)
         for(var i = 0; i < data.length; i++) {

             ram[address + i] = colors.indexOf(data[i]);
         }
  }

function render() {

  var i = PAGESIZE;  // display is first page of ram

  while (i--) {
    data[i] = colors[pal[ram[i]]];
  }

  imageData.data.set(buf8);

  ctx.putImageData(imageData, 0, 0);

}




Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

Number.prototype.map = function(old_bottom, old_top, new_bottom, new_top) {
  return (this - old_bottom) / (old_top - old_bottom) * (new_top - new_bottom) + new_bottom;
};

Number.prototype.pad = function(size, char="0") {
  var s = String(this);
  while (s.length < (size || 2)) {s = char + s;}
  return s;
};

//--------END Engine.js-------------------
