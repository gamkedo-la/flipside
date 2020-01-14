function RetroBuffer({width, height}={}){

  this.WIDTH =     width;
  this.HEIGHT =    height;
  this.PAGESIZE = this.WIDTH *  this.HEIGHT;
  this.PAGES = 2;

  this.SCREEN = 0;

  //relative drawing position and pencolor, for drawing functions that require it.
  this.cursorX = 0;
  this.cursorY = 0;
  this.cursorColor = 22;

  //default palette index
  this.palDefault = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
                      32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63];


  this.c =               document.createElement('canvas');
  this.c.width = 427;
  this.c.height = 240;
  this.ctx =             this.c.getContext('2d');
  this.renderTarget =    0x00000;
  this.renderSource =    this.PAGESIZE; //buffer is ahead one screen's worth of pixels

  //this.ctx.fillStyle = 'rgba(0,0,0,0)';
  //this.ctx.fillRect(0,0,this.c.width,this.c.height);


  //Adigun Azikiwe Polack's AAP64 Palette.
  //ofcourse you can change this to whatever you like, up to 256 colors.
  //one GOTCHA: colors are stored 0xAABBGGRR, so you'll have to flop the values from your typical hex colors.

  this.colors =
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
  0xff343942,
  ]

  //active palette index. maps to indices in colors[]. can alter this whenever for palette effects.
  this.pal =            [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
                    32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64];

  this.ctx.imageSmoothingEnabled = false;

  this.imageData =   this.ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT),
  this.buf =             new ArrayBuffer(this.imageData.data.length),
  this.buf8 =            new Uint8Array(this.buf),
  this.data =            new Uint32Array(this.buf),
  this.ram =             new Uint8Array(this.WIDTH * this.HEIGHT * this.PAGES);

  return this;
}

//--------------graphics functions----------------

RetroBuffer.prototype.clear = function clear(color = 0){
  this.ram.fill(color, this.renderTarget, this.renderTarget + this.PAGESIZE);
}

RetroBuffer.prototype.pset = function pset(x=cursorX, y=cursorY, color=cursorColor) { //an index from colors[], 0-63
  
  
  if(x < 0 | x > this.WIDTH) return;
  if(y < 0 | y > this.HEIGHT) return;
  this.ram[this.renderTarget + (y|0) * this.WIDTH + (x|0)] = color|0;
  //this.ctx.drawImage(G.img.aap64, 0, color, 1, 1, x, y, 1, 1);
}

RetroBuffer.prototype.pget = function pget(x=cursorX, y=cursorY, page=0){
  return this.ram[page + x + y * this.WIDTH];
}

RetroBuffer.prototype.moveTo = function moveTo(x,y){
  cursorX = x;
  cursorY = y;
}

RetroBuffer.prototype.lineTo = function lineTo(x,y, color=cursorColor){
  line(cursorX, cursorY, x, y, color);
  cursorX = x;
  cursorY = y;
}

RetroBuffer.prototype.line = function line(x1, y1, x2, y2, color=cursorColor) {
  
  x1 = x1|0,
  x2 = x2|0,
  y1 = y1|0,
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

this.pset(x1, y1, color);
  if (dx > dy) {
    var fraction = dy - (dx >> 1);  // same as 2*dy - dx
    while (x1 != x2) {
      if (fraction >= 0) {
        y1 += stepy;
        fraction -= dx;          // same as fraction -= 2*dx
      }
      x1 += stepx;
      fraction += dy;              // same as fraction -= 2*dy
      this.pset(x1, y1, color);
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
      this.pset(x1, y1, color);
    }
  }

}

RetroBuffer.prototype.circle = function circle(xm=cursorX, ym=cursorY, r=5, color=cursorColor) {
  xm = xm|0;
  ym = ym|0;
  r = r|0;
  color = color|0;
  var x = -r, y = 0, err = 2 - 2 * r;
  /* II. Quadrant */
  do {
    this.pset(xm - x, ym + y, color);
    /*   I. Quadrant */
    this.pset(xm - y, ym - x, color);
    /*  II. Quadrant */
    this.pset(xm + x, ym - y, color);
    /* III. Quadrant */
    this.pset(xm + y, ym + x, color);
    /*  IV. Quadrant */
    r = err;
    if (r <= y) err += ++y * 2 + 1;
    /* e_xy+e_y < 0 */
    if (r > x || err > y) err += ++x * 2 + 1;
    /* e_xy+e_x > 0 or no 2nd y-step */

  } while (x < 0);
}

RetroBuffer.prototype.fillCircle = function fillCircle(xm, ym, r=5, color=cursorColor) {
  xm = xm|0;
  ym = ym|0;
  r = r|0;
  color = color|0;

  if(r < 0) return;
  xm = xm|0; ym = ym|0, r = r|0; color = color|0;
  var x = -r, y = 0, err = 2 - 2 * r;
  /* II. Quadrant */
  do {
    this.line(xm-x, ym-y, xm+x, ym-y, color);
    this.line(xm-x, ym+y, xm+x, ym+y, color);
    r = err;
    if (r <= y) err += ++y * 2 + 1;
    if (r > x || err > y) err += ++x * 2 + 1;
  } while (x < 0);
}

RetroBuffer.prototype.rect = function rect(x, y, w=16, h=16, color=cursorColor) {
  //let { line } = this;
  let
  x1 = x|0,
  y1 = y|0,
  x2 = (x+w)|0,
  y2 = (y+h)|0;


  this.line(x1,y1, x2, y1, color);
  this.line(x2, y1, x2, y2, color);
  this.line(x1, y2, x2, y2, color);
  this.line(x1, y1, x1, y2, color);
}

RetroBuffer.prototype.fillRect = function fillRect(x, y, w=16, h=16, color=cursorColor) {
  let
  x1 = x|0,
  y1 = y|0,
  x2 = ( (x+w)|0 )-1,
  y2 = ((y+h)|0 )-1;
  color = color|0;

  var i = Math.abs(y2 - y1);
  this.line(x1, y1, x2, y1, color);

  if(i > 0){
    while (--i) {
      this.line(x1, y1+i, x2, y1+i, color);
    }
  }

  this.line(x1,y2, x2, y2, color);
}



RetroBuffer.prototype.outline = function outline(renderSource, renderTarget, color=cursorColor, color2=color, color3=color, color4=color){

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

RetroBuffer.prototype.triangle = function triangle(x1, y1, x2, y2, x3, y3, color=cursorColor) {
  line(x1,y1, x2,y2, color);
  line(x2,y2, x3,y3, color);
  line(x3,y3, x1,y1, color);
}

RetroBuffer.prototype.fillTriangle = function fillTriangle( x1, y1, x2, y2, x3, y3, color=cursorColor ) {
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

RetroBuffer.prototype.imageToRam = function imageToRam(image, address) {

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

RetroBuffer.prototype.render = function render() {

  var i = this.PAGESIZE;  // display is first page of ram

  while (i--) {
    /*
    data is 32bit view of final screen buffer
    for each pixel on screen, we look up it's color and assign it
    */
   if(i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];

  }

  this.imageData.data.set(this.buf8);

  this.ctx.putImageData(this.imageData, 0, 0);

}

export default RetroBuffer;

//--------END Engine.js-------------------
