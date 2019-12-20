import Stats from './src/js/stats.module.js';
import { Key, lerp } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'

const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//get our canvas from the document. for convenience these are global
window.c=document.getElementById("c");
window.ctx = c.getContext('2d');

// canvas is 2x pixel scale, 640x360. 
c.width = 1280 * .5;
c.height = 720 * .5;

window.world = {
    widthInTiles: 100,
    heightInTiles: 100,
    tileSize: 16,
    flipswitch: false,
    data: [],
    
}

const player = {
    x: 168,
    y: 168,
    targetX: 168,
    targetY: 168,
    diameter: 8,

}

for(let i = 0; i < world.widthInTiles * world.heightInTiles; i++){
    world.data[i] = Math.round( Math.random() );
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

requestAnimationFrame(frame);

//game loop steps--------------------------------------------------------------------


function update(dt){
    //update all the things
    elapsed += dt;
    
    if(Key.justReleased(Key.x)){
        world.flipswitch = true;
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
    player.x = lerp(player.x, player.targetX, .2);
    player.y = lerp(player.y, player.targetY, .2);

    Key.update();
    
}

function render(dt){
    //draw all the things
    clearScreen('black');
    //simplest possible map data render
    ctx.fillStyle = 'white';
    
    for(let i = 0; i < world.data.length; i++){

        let x = (i % world.widthInTiles) * world.tileSize;
        let y = Math.floor(i / world.heightInTiles)*world.tileSize;
        let s = world.tileSize;
        
        if(world.flipswitch)world.data[i] = !world.data[i]

        if(world.data[i] == 0)ctx.fillRect(x, y, s, s);
    }
    world.flipswitch = false;
    //red square spinny
    ctx.fillStyle = 'red';
    ctx.fillRect(c.width/2 + Math.sin(elapsed*5)*50, c.height/2+Math.cos(elapsed*5)*50, 16,16);
    //console.log(elapsed);

    ctx.fillStyle = '#4f0';
    ctx.fillRect(player.x-player.diameter, player.y-player.diameter, player.diameter*2, player.diameter*2)
}

