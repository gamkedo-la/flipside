import Stats from './src/js/stats.module.js';
import { Key, lerp, loadImages } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'
import World from './src/js/world.js';

const images = [
    //image loader assumes .png and appends it. all images should be in /src/img/.
    'tiles'
]
//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//get our canvas from the document. for convenience these are global
window.c=document.getElementById("c");
window.ctx = c.getContext('2d');

// canvas is 4x pixel scale, 320x180 
c.width = 1280 * .25;
c.height = 720 * .25;

const view = {
    x: 0, y: 0, w: c.width, h: c.height
}

const deadZone = {
    x: 50, y: 50
}

window.world = new World({
    widthInTiles: 100, heightInTiles: 100, tileSize: 8
})

window.player = {
    pos: {
        x: 50*world.tileSize,
        y: 50*world.tileSize,
    },

    maxVel: {
        x: 10,
        y: 10
    },

    dx: 0,
    dy: 0,
    vx: 0, 
    vy: 0,
    
    friction: 0.7,

    accel: 7,
    gravity: 1,
    
    targetX: 50*world.tileSize,
    targetY: 50*world.tileSize,
    diameter: 4,
}

//const camera = new Camera(0 ,0, c.width, c.height, world.widthInTiles * world.tileSize, world.heightInTiles * world.tileSize )

//------fill the world with random rectangles/platforms made of tiles----------
for(let i = 0; i < 200; i++){
    let tx = Math.floor( Math.random() * world.widthInTiles );
    let ty = Math.floor( Math.random() * world.heightInTiles );
    let w = Math.floor( Math.random() * 5);
    let h = Math.floor( Math.random() * 5);
    world.tileFillRectRandom({tx: tx, ty: ty, width: w, height: h, rangeStart: 1, rangeEnd: 3 });
}
for(let i = 0; i < 30; i++){
    let tx = Math.floor( Math.random() * world.widthInTiles );
    let ty = Math.floor( Math.random() * world.heightInTiles );
    let w = Math.floor( Math.random() * 5 + 5);
    let h = Math.floor( Math.random() * 5 + 5);
    world.tileFillRectRandom({tx: tx, ty: ty, width: w, height: h, rangeStart: 4, rangeEnd: 7 });
}

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);


//game loop--------------------------------------------------------------------

var     dt      = 0,
        last    = performance.now(),
        elapsed = 0,
        step    = 1/60; //60 frames per second.

var     now,
        paused = false;

function frame(){
    stats.begin();

    //get current timestamp in milliseconds
    now = performance.now();

    //dt = time since last frame in seconds, with a maximum value of 1 second.
    dt = dt + Math.min(1, (now-last) / 1000);

    while(dt > step) {
        dt = dt - step;
        update(step);
    }

    //we pass dt to render to lerp if necessary
    render(dt);
    last = now; 
    stats.end();
    requestAnimationFrame(frame);
}



//game loop steps--------------------------------------------------------------------


function update(dt){
    //update all the things
    elapsed += dt;
    //---camera follow player-------------------------------
    if(player.pos.x - view.x + deadZone.x > view.w){
        view.x = player.pos.x - (view.w - deadZone.x)
    }
    if(player.pos.x - deadZone.x < view.x){
        view.x = player.pos.x - deadZone.x
    }
    if(player.pos.y - view.y + deadZone.y > view.h){
        view.y = player.pos.y -(view.h - deadZone.y)
    }
    if(player.pos.y - deadZone.y < view.y){
        view.y = player.pos.y - deadZone.y 
    }
    //-------------------------------------------------------


    //testing dynamic map stuffs. press X to knock a box-shaped hole in the world around you
    if(Key.justReleased(Key.x)){
        let tpos = world.pixelToTileGrid(player.pos)
        tpos.x -= 2; tpos.y -= 2;
        world.tileFillRect({tx:tpos.x, ty:tpos.y, width: 4, height: 4, value: 0})
    }

    //basic player movement.
    if(Key.isDown(Key.LEFT) ){
        player.vx -= player.accel;
    }
    else if(Key.isDown(Key.RIGHT) ){
        player.vx += player.accel;
    }
    else(player.vx *= player.friction)

    if(Key.isDown(Key.DOWN) ){
        player.vy += player.accel;
    }
    else if(Key.isDown(Key.UP) ){
        player.vy -= player.accel;
    }
    else(player.vy *= player.friction)
    
    
    

        
    player.pos.x = player.pos.x + (dt * player.vx);
    player.pos.y = player.pos.y + (dt * player.vy);

    player.vx.clamp(-player.maxVel.x, player.maxVel.x);
    player.vy.clamp(-player.maxVel.y, player.maxVel.y);
    //player.dx = ( player.dx + (dt * player.vx) ).clamp( -player.maxVel.x, player.maxVel.x );
   // player.dy = ( player.dy + (dt * player.vy) ).clamp( -player.maxVel.y, player.maxVel.y );

    


    

    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();
    
}

function render(dt){
    //draw all the things
    clearScreen('black');
    //ctx.drawImage(img.tiles, 0,0);
    ctx.fillStyle = 'white';

    //setup vars for render optimization. we only want to render tiles that would be visible in viewport.
    //tilepad to prevent 'blinking' at partial tile overlap at edges of screen.
    //rx0, rx1, ry0, ry1 are the edges of the screen in tile positions, left, right, top, bottom, respectively.

    let tilePad = 3,
        rx0 = view.x/world.tileSize - tilePad | 0,
        rx1 = (view.x + c.width)/world.tileSize + tilePad | 0,
        ry0 = view.y / world.tileSize - tilePad | 0,
        ry1 = (view.y + c.height)/world.tileSize + tilePad | 0;

    //tile render loop! render order is columns.  
    //for each column( i )
    for(let i = rx0; i < rx1; i++){
        //render all tiles in the column
        for(let j = ry0; j < ry1; j++){

            let drawX =     Math.floor( i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * world.widthInTiles + i
            //todo: abtract out into tile draw function, maybe? -flipped and rotated tiles? 
            ctx.drawImage(img.tiles, world.data[flatIndex] * 8, 0, 8,8, drawX, drawY,  8,8)
        }
        
    }
    world.flipswitch = false;

    
    ctx.fillStyle = '#4f0';
    ctx.fillRect(Math.floor(player.pos.x-player.diameter-view.x), Math.floor(player.pos.y-player.diameter-view.y), player.diameter*2, player.diameter*2)
}

//load assets, then start game-------------------------------------------------------------

loadImages(images, start);
function start(img){
    window.img = img;
    requestAnimationFrame(frame);
}

//Number utility functions------
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