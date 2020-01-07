import Stats from './src/js/stats.module.js';
import { Key } from './src/js/util.js';
import { clearScreen, makeMosaic, drawTile, spriteFont } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt, clamp, rndFloat } from './src/js/math.js';
import AssetLoader from './src/js/AssetLoader.js';
import AudioGlobal from './src/js/audio.js';
import Signal from './src/js/Signal.js';
import Particle from './src/js/particle.js';
import GamepadSupport from './src/js/gamepad.js';

//one global (G)ame object to rule them all
window.G = {};

// start the gamepad keyboard event emulator
G.GamepadSupport = new GamepadSupport();

//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//canvas init and other data init---------------------------------------------
G.c=document.getElementById("c");
G.ctx = G.c.getContext('2d');

G.view = {
    x: 0, y: 0, w: G.c.width, h: G.c.height
}

G.particles = [];

G.deadZone = {
    x: 60, y: 60
}

G.tileSheetSize = { height: 16, width: 16 }

G.MSG = new Signal();
G.loader = new AssetLoader();

G.audio = new AudioGlobal(); // FIXME: defer to after the first click/keypress to avoid browser error

G.player = player;


G.currentMap = 'map000'; 

const images = [
    //image loader assumes .png and appends it. all images should be in /src/img/.
    'tiles',
    'aap64',
    'player',
    'smallFont'
]

const maps = [
    //map loader assumes JSON files. TMX maps are are at /rawAssets/maps,  exported maps loaded
    //from this array are located in /src/maps/*.json. 
    'map000',
    'map001',
    'map002'
]
 //note these sounds don't exist yet, this is an example of the format AssetLoader.soundLoader expects
const soundList = [
    { name: "test1", url:"./src/snd/test1.mp3" },
    { name: "test2", url:"./src/snd/test2.mp3" },
    { name: "testMusic1", url:"./src/snd/stebsScaryFlipside.mp3" }
]
//for that tasty deepnight pixel mosaic overlay effect
const mosaic = makeMosaic();
mosaic.canvas.id = "mosaic";
document.body.appendChild(mosaic.canvas);

//destructure out of global game object for coding convenience----------------
const { MSG, loader, audio, view, c, ctx, deadZone, tileSheetSize } = G;
var { currentMap } = G

//deciding on scale. 3x pixels:
c.width = 427;
c.height = 240;

//or 4x pixels
// c.width = 320;
// c.height = 180;

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); event.preventDefault() }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); event.preventDefault() }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);

MSG.addEventListener('crossed',  function (event) { player.crossedOver(event) });

window.addEventListener('click', function(event) { audio.context.resume();
                                                   audio.init()}, false); //Temporary fix for chrome not strting the audio context until user interaction

//load assets, then start game-------------------------------------------------------------

//TODO: reorganize so one function loads both maps and images, THEN start, no chains
loader.loadMapData(maps, init);

function init(){
    G.world = new World();
    G.worldFlipped = new World();
    G.worldForeground = new World();

    loadMap({map: 'map000', spawnPoint: 'PlayerStart'});
   
    loader.loadImages(images, soundInit);

}

function soundInit(images){
    //img is an array of all image assets. assigned to our (G)ame object here
    G.img = images;

    //next we load our soundlist, passing in start as a callback once complete.
    //soundloader just gives loader the properties,  loadAudioBuffer actually decodes the files and
    //creates a list of buffers.
    loader.soundLoader({context: audio.context, urlList: soundList, callback: start});
    loader.loadAudioBuffer(); 
}

function start(sounds){    
    //sounds..
    G.sounds = sounds;
    G.loader.sounds = sounds;
    //create player spritesheet and animations, and set a default animation
    player.init();

    //create spriteFont
    G.gameFont = new spriteFont({
        width: 255,
        height: 128,
        characterHeight: 9,
        characterWidth: 6,
        image: G.img.smallFont
        //remaining options are in spriteFont defaults
    })

    //get player position from first map
    player.pos = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == "PlayerStart"})

    //Fire it up!
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
/*removing background particles, for now-----------------------
    let bgparticleCount = 10;
    while(bgparticleCount--){
        G.particles.push(new Particle({
            x: rndFloat(view.x, view.x+c.width),
            y: rndFloat(view.y, view.y+c.height),
            vx: -player.vx/400,
            vy: rndFloat(-0.5, -2),
            width: 1,
            height: rndInt(1,4),
            color: 29,
            type: 'bg'
        }) );  
    }
*/
    handleCamera(dt);

    handleInput(dt);

    G.particles.forEach(function(particle){
        if(G.world.data[G.world.pixelToTileIndex(particle.pos)] > 128 && particle.type == 'bullet'){
           
            let splodeCount = 3;
            while(--splodeCount){
                //console.log('making splode')
                G.particles.push(new Particle({
                    x: Math.round(particle.pos.x/8)*8,
                    y: particle.pos.y,
                    vx: -particle.vx/5 + rndFloat(-0.5,0.5),
                    vy: rndFloat(-3, 3),
                    life: 10,
                    color: 8,
                    width: 1,
                    height: 1,
                    type: 'bg'
                }))
            }
            particle.life = 0;
        }
        var flippedIndex = G.world.pixelToTileIndex(particle.pos)
        var flippedGID = G.worldFlipped.data[flippedIndex]
        if(flippedGID){
            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.vx += rndFloat(-.2, .2)
            particle.color = 27;
            if(particle.type == 'bullet'){
                G.worldFlipped.data[flippedIndex] = 0;
                let splodeCount = 3;
            while(--splodeCount){
                //console.log('making splode')
                G.particles.push(new Particle({
                    x: particle.pos.x,
                    y: particle.pos.y,
                    vx: -particle.vx/5 + rndFloat(-0.5,0.5),
                    vy: rndFloat(-3, 3),
                    life: 10,
                    color: 26,
                    width: 1,
                    height: 1,
                    type: 'bg'
                }))
            }
            particle.life = 0;
            }
        }
        particle.update();
    })
    player.update(dt, G.world, G.worldFlipped);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();
    
}

function render(dt){
    let {world, worldFlipped, worldForeground, img, particles } = G;
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
                gidFlipped = worldFlipped[flatIndex];

                if(gid > 0)gid-=1;
                if(gidFlipped > 0)gidFlipped -=1;

                
            if(!gidFlipped){
                drawTile({x:drawX, y:drawY}, world, gid);
            }
            
            //---additional rendering for pockets of Flip in the map
            if(worldFlipped.data[flatIndex]){
                //modify the draw position at random intervals between 20 and 60 ticks for glitchy effect
                let modX = rndInt(-1,1);
                let modY = rndInt(-1,1);
                if(frameCount % rndInt(20,60) > 0){
                    modX = 0; modY = 0;
                }
                drawTile({x: drawX + modX, y: drawY + modY}, world, gid);
                
                //draw a dark color blended over top to create the darkened effect
                ctx.save();
                ctx.globalCompositeOperation = 'difference';
                ctx.drawImage(
                    img.aap64, 0, 4, 1, 1, drawX, drawY, world.tileSize, world.tileSize
                    )
                ctx.restore();
            }//end flip render

        }//end column render
        
    }//end x loop 

   
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

    //render foreground tiles if any in front of player-----------------------------------
    for(let i = rx0; i < rx1; i++){
        for(let j = ry0; j < ry1; j++){
            let drawX =     Math.floor(i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * world.widthInTiles + i,
                gidFore = worldForeground.data[flatIndex],
                tileSheetHeight = 16,
                tileSheetWidth = 16;
            if(gidFore > 0)gidFore -=1;
            if(worldForeground.data[flatIndex]){
                drawTile({x: drawX, y: drawY}, worldForeground, gidFore);
             }
        }//end column render
    }//end x loop
    G.particles.forEach(function(particle){
        if(particle.type == 'bg'){
            if(world.data[world.pixelToTileIndex(particle.pos)] < 128){
                particle.draw();
            }
        }else particle.draw();
    })
    /*
    //debug render stuffs-------------------------------------------------------------------------------

    world.portals.forEach(function(e){
        ctx.fillStyle = 'rgba(0,255,0, 0.25)';
        ctx.fillRect(e.x-view.x, e.y-view.y, e.width, e.height);
    })
    ctx.fillStyle = 'rgba(0,255,0, 0.25)';
    ctx.fillRect(G.player.rect.left-view.x, G.player.rect.top-view.y, G.player.width, G.player.height);

    G.gameFont.drawText({
        textString: 'The quick brown fox jumps over the lazy dog',
        pos: {x: 5, y: 5},
        spacing: 0
    })
    G.gameFont.drawText({
        textString: 'The five boxing wizards jump quickly.',
        pos: {x: 5, y: 13},
        spacing: 0
    })

    //end debug render-----------------------------------------------------------------------------------
    */

    
    
}//end render

//update systems---------------------------------------------------------------------

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


    if(Key.justReleased(Key.m)){
        audio.toggleMute();
    }
    if(Key.justReleased(Key.COMMA)){
        audio.turnVolumeDown();
    }
    if(Key.justReleased(Key.PERIOD)){
        audio.turnVolumeUP();
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

    view.x = clamp(view.x, 0, world.widthInTiles * world.tileSize - c.width);
    view.y = clamp(view.y, 0, world.heightInTiles * world.tileSize - c.height);
    
}

function loadMap({map, spawnPoint}){
    let { loader, currentMap, world, worldFlipped, worldForeground } = G;
    //empty portals array
    //world.portals=[];
    currentMap = map;
    //console.log(currentMap);

    world.widthInTiles = loader.tileMaps[currentMap].layers[0].width,
    world.heightInTiles= loader.tileMaps[currentMap].layers[0].height,

    worldFlipped.widthInTiles = loader.tileMaps[currentMap].layers[1].width,
    worldFlipped.heightInTiles= loader.tileMaps[currentMap].layers[1].height,

    worldForeground.widthInTiles = loader.tileMaps[currentMap].layers[2].width,
    worldForeground.heightInTiles= loader.tileMaps[currentMap].layers[2].height,
    
    world.data = Uint16Array.from(loader.tileMaps[currentMap].layers[0].data);
    worldFlipped.data = Uint16Array.from(loader.tileMaps[currentMap].layers[1].data);
    worldForeground.data = Uint16Array.from(loader.tileMaps[currentMap].layers[2].data);

    world.portals = loader.tileMaps[currentMap].layers[3].objects.filter(function(e){return e.type == "portal"})

    let spawn = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == spawnPoint})
    player.pos.x = spawn.x;
    player.pos.y = spawn.y;
    
    
    
};
G.loadMap = loadMap


