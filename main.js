import Stats from './src/js/stats.module.js';
import { Key, lerp, loadImages } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'
import World from './src/js/world.js';

const images = [
    //image loader assumes .png and appends it. all images should be in /src/img/.
    'tiles'
]
//import Camera from './src/js/camera.js';
//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//get our canvas from the document. for convenience these are global
window.c=document.getElementById("c");
window.ctx = c.getContext('2d');

// canvas is 3x pixel scale, 427x240. 
c.width = 1280 * .333;
c.height = 720 * .333;


window.world = new World({
    widthInTiles: 100, heightInTiles: 100, tileSize: 8
})

const player = {
    pos: {
        x: 168,
        y: 168,
    },
    
    targetX: 168,
    targetY: 168,
    diameter: 4,
}

//const camera = new Camera(0 ,0, c.width, c.height, world.widthInTiles * world.tileSize, world.heightInTiles * world.tileSize )

// for(let i = 0; i < world.data.length; i++){
//     world.data[i] = Math.round(Math.random());
// }
for(let i = 0; i < 30; i++){
    let tx = Math.floor( Math.random() * world.widthInTiles );
    let ty = Math.floor( Math.random() * world.heightInTiles );
    let w = Math.floor( Math.random() * 5 + 5);
    let h = Math.floor( Math.random() * 5 + 5);
    world.tileFillRect({tx: tx, ty: ty, width: w, height: h, value: 1});
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
        step    = 1/60; //60 frapes per second.

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
    
    if(Key.justReleased(Key.x)){
        let tpos = world.pixelToTileGrid(player.pos)
        tpos.x -= 2; tpos.y -= 2;
        world.tileFillRect({tx:tpos.x, ty:tpos.y, width: 4, height: 4, value: 0})
    }
    if(Key.justReleased(Key.LEFT) ){
        player.targetX -= world.tileSize;
    }
    if(Key.justReleased(Key.RIGHT) ){
        player.targetX += world.tileSize;
    }
    if(Key.justReleased(Key.DOWN) ){
        player.targetY += world.tileSize;
    }
    if(Key.justReleased(Key.UP) ){
        player.targetY -= world.tileSize;
    }
    player.pos.x = lerp(player.pos.x, player.targetX, .2);
    player.pos.y = lerp(player.pos.y, player.targetY, .2);

    Key.update();
    
}

function render(dt){
    //draw all the things
    clearScreen('black');
    ctx.drawImage(img.tiles, 0,0);
    //simplest possible map data render
    ctx.fillStyle = 'white';
    
    for(let i = 0; i < world.data.length; i++){

        let x = (i % world.widthInTiles) * world.tileSize;
        let y = Math.floor(i / world.heightInTiles)*world.tileSize;
        let s = world.tileSize;
        
        if(world.flipswitch)world.data[i] = !world.data[i]

        if(world.data[i] == 1){
            let tileindex = Math.floor( Math.random()*7 ) + 1;

            ctx.fillRect(x, y, s, s);
        }
    }
    world.flipswitch = false;
    ctx.fillStyle = '#4f0';
    ctx.fillRect(player.pos.x-player.diameter, player.pos.y-player.diameter, player.diameter*2, player.diameter*2)
}

//load assets, then start game

loadImages(images, start);
function start(img){
    window.img = img;
    requestAnimationFrame(frame);
}