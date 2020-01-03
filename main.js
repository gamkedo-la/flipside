import Stats from './src/js/stats.module.js';
import { Key } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt, clamp } from './src/js/math.js';
import AssetLoader from './src/js/AssetLoader.js';
import Signal from './src/js/Signal.js';
import SpriteSheet from './src/js/spritesheet.js';
import Animation from './src/js/animation.js';

//one global object to rule them all
window.G = {};

G.MSG = new Signal();
G.loader = new AssetLoader();

G.player = player;

G.currentMap = 'map000'; 

const images = [
    //image loader assumes .png and appends it. all images should be in /src/img/.
    'tiles',
    'aap64',
    'player'
]

const maps = [
    //map loader assumes JSON files. TMX maps are are at /rawAssets/maps,  exported maps loaded
    //from this array are located in /src/maps/*.json. 
    'map000',
    'map001'
]

//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//get our canvas from the document. for convenience these are global
G.c=document.getElementById("c");
G.ctx = G.c.getContext('2d');

G.view = {
    x: 0, y: 0, w: G.c.width, h: G.c.height
}

G.deadZone = {
    x: 60, y: 60
}

//destructure out of global game object for coding convenience----------------
const { MSG, loader, view, c, ctx, currentMap, deadZone } = G;


c.width = 320;
c.height = 180;




//initialize  event listeners-------------------------------------------------



window.addEventListener('keyup',    function (event) { Key.onKeyup(event); event.preventDefault() }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); event.preventDefault() }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);


MSG.addEventListener('crossed',  function (event) { player.crossedOver(event) });


//load assets, then start game-------------------------------------------------------------


loader.loadMapData(maps, init);

function init(){
    G.world = new World({
        widthInTiles: loader.tileMaps[currentMap].layers[0].width,
        heightInTiles: loader.tileMaps[currentMap].layers[0].height,
        tileSize: 8
    })
    G.worldFlipped = new World({
        widthInTiles: loader.tileMaps[currentMap].layers[1].width,
        heightInTiles: loader.tileMaps[currentMap].layers[1].height,
        tileSize: 8
    })
    G.worldForeground = new World({
        widthInTiles: loader.tileMaps[currentMap].layers[2].width,
        heightInTiles: loader.tileMaps[currentMap].layers[2].height,
        tileSize: 8
    })
    
    G.world.data = Uint16Array.from(loader.tileMaps[currentMap].layers[0].data);
    
    G.worldFlipped.data = Uint16Array.from(loader.tileMaps[currentMap].layers[1].data);

    G.worldForeground.data = Uint16Array.from(loader.tileMaps[currentMap].layers[2].data);

    loader.loadImages(images, start);

}

function start(img){
    
    G.img = img;
    const { world, worldFlipped, worldForeground} = G;
    //create player animation------------------------------------------
    player.spritesheet = new SpriteSheet({
        image: img.player,
        frameWidth: 16,
        frameHeight: 36,
        animations: {
            idleLeft: {
                frames: 1
            },
            idleRight: {
                frames: 0
            },
            walkRight: {
                frames: '2..9',
                frameRate: 16
            },
            walkLeft: {
                frames: '10..17',
                frameRate: 16
            },
            fallingLeft:{
                frames: 20
            },
            fallingRight: {
                frames: 18
            },
            airLeft: {
                frames: 21
            },
            airRight: {
                frames: 19
            }

        }
    })
    //player must have an anim set at start, or player.currentAnimation is null
    player.play('idleRight');
    console.log("playerstart", loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == "PlayerStart"}) )
    player.pos = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == "PlayerStart"})
    requestAnimationFrame(frame);
}

//game loop--------------------------------------------------------------------

var     dt      = 0,
        last    = performance.now(),
        elapsed = 0,
        frameCount = 0,
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
    frameCount ++;
    
    handleCamera(dt);

    handleInput(dt);

    player.update(dt, G.world, G.worldFlipped);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();
    
}

function render(dt){
    let {world, worldFlipped, worldForeground, img } = G;
    //draw all the things
    clearScreen('black');

    //setup vars for render optimization. we only want to render tiles that would be visible in viewport.
    //tilepad is to prevent 'blinking' at partial tile overlap at edges of screen.
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
                flatIndex = j * world.widthInTiles + i,
                gid = world.data[flatIndex],
                gidFlipped = worldFlipped[flatIndex],
                tileSheetHeight = 16,
                tileSheetWidth = 16;
                if(gid > 0)gid-=1;
                if(gidFlipped > 0)gid -=1;

                
            if(!worldFlipped.data[flatIndex])
            {
                //todo: abtract out into tile draw function, maybe? -flipped and rotated tiles? 
            ctx.drawImage(
                img.tiles,
                gid%tileSheetHeight * world.tileSize,
                Math.floor(gid/tileSheetWidth) * world.tileSize,
                world.tileSize,
                world.tileSize,
                drawX,
                drawY,
                world.tileSize, world.tileSize
                );
            }
            
            //---additional rendering for pockets of Flip in the map
            if(worldFlipped.data[flatIndex]){
                let modX = rndInt(-1,1);
                let modY = rndInt(-1,1);
                if(frameCount % rndInt(20,60) > 0){
                    modX = 0; modY = 0;
                }
                ctx.drawImage(
                    img.tiles,
                    gid%tileSheetHeight * world.tileSize,
                    Math.floor(gid/tileSheetWidth) * world.tileSize,
                    world.tileSize,
                    world.tileSize,
                    drawX+modX,
                    drawY+modY,
                    world.tileSize, world.tileSize
                    );
                
                ctx.save();
                ctx.globalCompositeOperation = 'difference';
                ctx.drawImage(
                    img.aap64,
                    0,
                    2,
                    1,
                    1,
                    drawX,
                    drawY,
                    world.tileSize, world.tileSize
                    )
                ctx.restore();
            }//end flip render
 
        }//end row render
        
    }//end column render
    
   
    //render player;
    //TODO: abstract away tile rendering, allow for rendering in front of player?
    ctx.fillStyle = player.color;
    //ctx.fillRect(Math.floor(player.pos.x-player.width/2-view.x), Math.floor(player.pos.y-player.height/2-view.y), player.width, player.height)
    player.currentAnimation.render({
        x: Math.floor(player.pos.x-player.width/2-view.x),
        y: Math.floor(player.pos.y-player.height/2-view.y),
        width: 16,
        height: 36

    })
    
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
    let { world } = G;
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

    // view.x = view.x.clamp(0, world.widthInTiles * world.tileSize - c.width);
    // view.y = view.y.clamp(0, world.heightInTiles * world.tileSize - c.height);

    view.x = clamp(view.x, 0, world.widthInTiles * world.tileSize - c.width);
    view.y = clamp(view.y, 0, world.heightInTiles * world.tileSize - c.height);
    
}


