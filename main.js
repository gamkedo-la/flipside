import Stats from './src/js/stats.module.js';
import { Key,loadImages } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt } from './src/js/math.js';

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

window.view = {
    x: 0, y: 0, w: c.width, h: c.height
}

const deadZone = {
    x: 60, y: 60
}

window.world = new World({
    widthInTiles: 1000, heightInTiles: 1000, tileSize: 8
})
window.worldFlipped = new World({
    widthInTiles: 1000, heightInTiles: 1000, tileSize: 8
})

player.pos.x = 500*8;
player.pos.y = 500*8;

//------fill the world with random rectangles/platforms made of tiles----------
for(let i = 0; i < 6000; i++){
    let tx = rndInt(0, world.widthInTiles);
    let ty = rndInt(0, world.heightInTiles);
    let w =  rndInt(0,5);
    let h =  rndInt(0,5);
    world.tileFillRectRandom({tx: tx, ty: ty, width: w, height: h, rangeStart: 1, rangeEnd: 3 });
}
for(let i = 0; i < 3000; i++){
    let tx = rndInt(0, world.widthInTiles);
    let ty = rndInt(510, 1000);
    let w =  rndInt(5,10);
    let h =  rndInt(1,2);
    world.tileFillRectRandom({tx: tx, ty: ty, width: w, height: h, rangeStart: 4, rangeEnd: 7 });
}
for(let i = 0; i < 10000; i++){
    let tx = rndInt(0,worldFlipped.widthInTiles),
        ty = rndInt(0,worldFlipped.heightInTiles),
        radius = rndInt(1,4)
    
        worldFlipped.tileFillCircle({tx: tx, ty: ty, radius:radius, value: 8 });
}
 //add a section of Flip
worldFlipped.tileFillCircle({tx: 495, ty: 495, radius:7, value: 8 });
//and platform to stand on
world.tileFillRect({tx: 450, ty: 505, width: 100, height: 3, value: 5})

world.tileFillRect({tx: 0, ty: 0, width: 1000, height: 1, value: 5})
world.tileFillRect({tx: 0, ty: 0, width: 1, height: 1000, value: 5})
world.tileFillRect({tx: 1000, ty: 0, width: 1, height: 1000, value: 5})
world.tileFillRect({tx: 0, ty: 1000, width: 1000, height: 1, value: 5})

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); event.preventDefault}, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); event.preventDefault}, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);


//load assets, then start game-------------------------------------------------------------

loadImages(images, start);
function start(img){
    window.img = img;
    requestAnimationFrame(frame);
}


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
    
    //-------------------------------------------------------
    handleCamera(dt);
    handleInput(dt);
    player.update(dt, world, worldFlipped);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();
    
}

function render(dt){
    //draw all the things
    clearScreen('black');

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

            let drawX =     Math.floor(i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * world.widthInTiles + i

            //todo: abtract out into tile draw function, maybe? -flipped and rotated tiles? 
            ctx.drawImage(
                img.tiles, world.data[flatIndex] * world.tileSize,
                0,
                world.tileSize,
                world.tileSize,
                drawX,
                drawY,
                world.tileSize, world.tileSize
                )
            if(worldFlipped.data[flatIndex]){
                ctx.drawImage(
                    img.tiles, worldFlipped.data[flatIndex] * world.tileSize,
                    0,
                    world.tileSize,
                    world.tileSize,
                    drawX,
                    drawY,
                    world.tileSize, world.tileSize
                    )
            }
                
        }
        
    }
    world.flipswitch = false;

    
    player.inTheFlip ? ctx.fillStyle = '#4f0' : ctx.fillStyle = '#F40'; 
    ctx.fillRect(Math.floor(player.pos.x-player.width/2-view.x), Math.floor(player.pos.y-player.height/2-view.y), player.width, player.height)

 
}



function handleInput(dt){

    if(Key.isDown(Key.LEFT)){
        player.input.left = true;
    }
    else if(Key.isDown(Key.RIGHT)){
        player.input.right = true;
    }
    if(Key.isDown(Key.DOWN)){
        player.input.down = true;
    }
    else if(Key.isDown(Key.UP)){
        player.input.up = true;
    }
    if(Key.isDown(Key.x)){
        player.input.carveWorld = true;
    }
    if(Key.isDown(Key.z)){
        player.input.jump = true;
    }
    

    if(Key.justReleased(Key.LEFT)){
        player.input.left = false;
    }
    if(Key.justReleased(Key.RIGHT)){
        player.input.right = false;
    }
    if(Key.justReleased(Key.UP)){
        player.input.up = false;
    }
    if(Key.justReleased(Key.DOWN)){
        player.input.down = false;
    }
    if(Key.justReleased(Key.x)){
        player.input.carveWorld = false;
    }
   
}

function handleCamera(dt){
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

    view.x = view.x.clamp(0, world.widthInTiles * world.tileSize - c.width);
    view.y = view.y.clamp(0, world.heightInTiles * world.tileSize - c.height);
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