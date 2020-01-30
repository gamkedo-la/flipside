import Stats from './src/js/stats.module.js';
import { Key, inView, pos } from './src/js/util.js';
import { clearScreen, makeMosaic, drawTile, spriteFont, preRenderBlendedSprite, Transitioner } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt, clamp, rndFloat, range } from './src/js/math.js';
import AssetLoader from './src/js/AssetLoader.js';
import AudioGlobal from './src/js/audio.js';
import Signal from './src/js/Signal.js';
import ParticlePool from './src/js/ParticlePool.js';
//import GamepadSupport from './src/js/gamepad.js';
import ElectricityRenderer from './src/js/electricity.js';
import RetroBuffer from './src/js/retroBuffer.js';
import FlipBat from './src/js/flipbat.js';
import FlipPig from './src/js/flippig.js';
import FlipBird from './src/js/flipbird.js';
import RoboTank from './src/js/robotank.js';
import Barricade from './src/js/Barricade.js';
import Switch from './src/js/Switch.js';
// import Drone from './src/js/drone.js';
import GameSaver from './src/js/GameSaver.js';

const invertedMosaicEffectEnabled = false;
const soundEnabled = false;

//one global (G)ame object to rule them all
window.G = {};
G.pos = {x: 0, y: 0};
G.transitioning = false;

// start the gamepad keyboard event emulator
// works fine, disabled for perf testing
// G.GamepadSupport = new GamepadSupport();

//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//canvas init and other data init---------------------------------------------
G.debugEvents = [];
G.c=document.getElementById("c");
G.ctx = G.c.getContext('2d');

G.view = {
    x: 0, y: 0, w: G.c.width, h: G.c.height
}

G.particles = new ParticlePool(20000);
G.bullets = new ParticlePool(10);

G.deadZone = {
    x: 60, y: 60
}

G.tileSheetSize = { height: 16, width: 16 }

G.MSG = new Signal();
G.loader = new AssetLoader();
//G.Records = new Records();

if (soundEnabled) {
    G.audio = new AudioGlobal(); 
    G.audio.init(); // FIXME: defer to after the first click/keypress to avoid browser error
}
G.lightning = new ElectricityRenderer();
G.saver = new GameSaver();
G.gameKey = 'game1';//TODO: User input to decide which game save to load
G.savedGame = G.saver.getSavedGame(G.gameKey);

G.player = player;
G.player.maxHealth = G.savedGame.maxHealth;
G.Records = G.savedGame.Records;
G.transitioner = new Transitioner();

G.currentMap = G.savedGame.map;

const images = [
    //image loader assumes .png and appends it. all images should be in /src/img/.
    'tiles',
    'aap64',
    'player',
    'playerRight',
    'smallFont',
    'labCaveWall',
    'EnemyTinyflyer',
    'EnemyTinycrawler',
    'EnemyTinydiver',
    'EnemyRoboTank',
    'flipSpace'
]

const maps = [
    //map loader assumes JSON files. TMX maps are are at /rawAssets/maps,  exported maps loaded
    //from this array are located in /src/maps/*.json.
    'room01',
    'room02',
    'room03',
    'room04',
    'room05',
    'room06',
    'room07',
    'room08',
    'room09',
    'room10',
    
]
 //sounds list!---------------------------------------------------------------
const soundList = [
    { name: "test1", url:"./src/snd/test1.mp3" },
    { name: "test2", url:"./src/snd/test2.mp3" },
    //{ name: "testMusic1", url:"./src/snd/stebsScaryFlipside(2).mp3" }
    { name: "testMusic1", url:"./src/snd/Vanishing.mp3" }
]

//retro buffer, for no AA lines, circles, indexed-color raster drawing;
G.rb = new RetroBuffer(427,240);
G.rb.c.id="retrobuffer";
document.body.appendChild(G.rb.c);

//for that tasty deepnight pixel mosaic overlay effect
const mosaic = makeMosaic();
mosaic.canvas.id = "mosaic";
//document.body.appendChild(mosaic.canvas);
G.mosaic = mosaic;

// inverted mosaic bevel during flipspace
if (invertedMosaicEffectEnabled) {
    const mosaicFlipped = makeMosaic(true);
    mosaicFlipped.canvas.id = "mosaicFlipped";
    document.body.appendChild(mosaicFlipped.canvas);
    G.mosaicFlipped = mosaicFlipped;
}

//destructure out of global game object for coding convenience----------------
const { loader, audio, view, c, ctx, deadZone } = G;
var { currentMap } = G

c.width = 427;
c.height = 240;

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); event.preventDefault() }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); event.preventDefault() }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);


window.addEventListener('click', function(event) { if (soundEnabled) audio.context.resume(); }, false); //Temporary fix for chrome not strting the audio context until user interaction

G.MSG.addEventListener('achievement',  function (event) { console.log(`%c ACHIEVEMENT GET: ${event.detail.title}`, 'background: #8F0') });

//load assets, then start game-------------------------------------------------------------

loader.loadInitialMapData(G.currentMap, init);

function init(){

    G.img = loader.loadImages(images, soundInit);

    G.world = new World();
    G.worldFlipped = new World();
    G.worldForeground = new World();

}

// this not not ONLY the sound inits, it is init step two after images have downloaded
// with optional sound inits as well as essential map loading and game start callbacks
function soundInit(){ 

    //next we load our soundlist, passing in start as a callback once complete.
    //soundloader just gives loader the properties,  loadAudioBuffer actually decodes the files and
    //creates a list of buffers.
    loadMap({map: G.currentMap, spawnPoint: G.savedGame.spawnPoint});

    if (soundEnabled) {
        loader.soundLoader({context: audio.context, urlList: soundList, callback: start});
        loader.loadAudioBuffer();
    } else {
        start();
    }
}

function start(sounds){
    
    if (soundEnabled) {
        G.sounds = sounds;
        G.loader.sounds = sounds;
    }
    
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

    //create prerendered tile effects
    //numbers appended to the image name, as in tiles26, represents a color index from the AAP64 palette.
    //here' we're pre-rendering the tilesheet with a color overlay,
    // to be used to render the flipspace effect, as an optimization.
    G.img.tiles26 = preRenderBlendedSprite({img:G.img.tiles, blendmode:'overlay', color:"rgba(232, 106, 115, 1)"});
    G.img.tiles27 = preRenderBlendedSprite({img:G.img.tiles, blendmode:'overlay', color:"rgba(188, 74, 155, 1)"});

    //Fire it up!
    requestAnimationFrame(frame);
    if (soundEnabled) G.audio.playMusic(G.sounds.testMusic1);
}

//game loop--------------------------------------------------------------------

var     dt      = 0,
        last    = performance.now(),
        elapsed = 0,
        step    = 1/60; //60 frames per second.
        G.frameCount = 0;

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

    if(G.transitioning){
    }else{
        requestAnimationFrame(frame);
    }
    
}
G.frame = frame;

//game loop steps--------------------------------------------------------------------

function update(dt){
    //update all the things
    elapsed += dt;
    G.frameCount ++;
    // let p = 200;
    // while(--p){
    //     G.particles.spawn(rndInt(0, 1000), rndInt(0, 1000), rndFloat(-2,2), rndFloat(-2,0), 3, 1, 1, 50, 0 )
    // }
    
    handleCamera(dt);

    if (G.GamepadSupport) G.GamepadSupport.handle_gamepad(); // polled each frame

    handleInput(dt);

    //flip healing routine--------------------------------
    for(let i = 0; i < G.worldFlipped.data.length; i++){
        let tile = G.worldFlipped.data[i];
        if(tile <= 3){
        
        }
        if(tile > 3){
           
            G.worldFlipped.data[i] = tile-1;
        }
    }
    G.world.entities.forEach(function(e){e.update(dt)});

    player.update(dt, G.world, G.worldFlipped, G.worldForeground);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();

    G.particles.update(dt);
    G.bullets.update(dt);

}

function render(dt){
    //let {world, worldFlipped, worldForeground, img, rb } = G;
    //draw all the things

    clearScreen('black');
    G.rb.clear(64);

    //render background parallax
    //var parallaxImage = img[world.parallax0];
    //console.log(parallaxImage);
    //var bgWidth = img[world.parallax0].width;
    //var bgHeight = img[world.parallax0].height;
    //let bgPadding = 1; 
    //let bgTileWidth = (Math.round( c.width / img[world.parallax0].width ) + 1 * 2);
    //let bgTileHeight = (Math.round( c.height / img[world.parallax0].width ) + 1 * 2);
    //console.log(bgTileWidth, bgTileHeight);

    for(let i = -1; i <= (Math.round( c.width / G.img[G.world.parallax0].width ) + 1 * 2); i++){
        for (let j = -1; j <= (Math.round( c.height / G.img[G.world.parallax0].width ) + 1 * 2); j++){
            let x = i * G.img[G.world.parallax0].width, y = j * G.img[G.world.parallax0].height;
            ctx.drawImage(G.img[G.world.parallax0], x,y);
        }
    }

    //setup vars for render optimization. we only want to render tiles that would be visible in viewport.
    //tilepad is to prevent 'blinking' at partial tile overlap at edges of screen.
    //rx0, rx1, ry0, ry1 are the edges of the screen in tile positions, left, right, top, bottom, respectively.

    let tilePad = 3,
        rx0 = view.x/G.world.tileSize - tilePad | 0,
        rx1 = (view.x + c.width)/G.world.tileSize + tilePad | 0,
        ry0 = view.y / G.world.tileSize - tilePad | 0,
        ry1 = (view.y + c.height)/G.world.tileSize + tilePad | 0;

    //tile render loop! render order is columns.
    //for each column( i )
    for(let i = rx0; i < rx1; i++){
        //render all tiles in the column
        for(let j = ry0; j < ry1; j++){

            var drawX =     Math.floor(i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * G.world.widthInTiles + i,
                gid = G.world.data[flatIndex]-1;

            if(G.worldFlipped.data[flatIndex] == 3){

                ctx.drawImage(
                    Math.random()>0.5? G.img.tiles26: G.img.tiles27,
                    gid%G.tileSheetSize.height * 8,
                    Math.floor(gid/G.tileSheetSize.width) * 8,
                    8,8,
                    drawX, drawY, 8, 8
                    );

                let Ngid = G.worldFlipped.data[flatIndex - G.world.widthInTiles],
                    Sgid = G.worldFlipped.data[flatIndex + G.world.widthInTiles],
                    Egid = G.worldFlipped.data[flatIndex + 1],
                    Wgid = G.worldFlipped.data[flatIndex -1];
                    //console.log(Ngid, Sgid, Egid, Wgid);
                if(Ngid != 3){
                    ctx.drawImage(
                        G.img.flipSpace, 8*rndInt(0,15), 8, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                }
                if(Sgid != 3){
                    ctx.drawImage(
                        G.img.flipSpace, 8*rndInt(0,15), 0, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                }
                if(Wgid != 3){
                    ctx.drawImage(
                        G.img.flipSpace, 8*rndInt(0,15), 16, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                }
                if(Egid != 3){
                    ctx.drawImage(
                        G.img.flipSpace, 8*rndInt(0,15), 24, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                }
            }else{
                //normalspace tile draw
                ctx.drawImage(
                    G.img.tiles,
                    gid%G.tileSheetSize.height * 8,
                    Math.floor(gid/G.tileSheetSize.width) * 8,
                    8,8,
                    drawX, drawY, 8, 8
                    );
            }

        }//end column render

    }//end x loop

    //render AABB's, including pickups and baddies
    G.world.entities.forEach(function(e){
        if(inView(e.pos.x, e.pos.y)){
            e.render();
        }
    });

    //render player; 
    player.render();
    
    //render foreground tiles if any in front of player-----------------------------------
    for(let i = rx0; i < rx1; i++){
        for(let j = ry0; j < ry1; j++){
            let drawX =     Math.floor(i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * G.world.widthInTiles + i,
                gidFore = G.worldForeground.data[flatIndex];

            if(gidFore > 0)gidFore -=1;
            if(G.worldForeground.data[flatIndex]){
                ctx.drawImage(
                    G.img.tiles,
                    gidFore%G.tileSheetSize.height * 8,
                    Math.floor(gidFore/G.tileSheetSize.width) * 8,
                    8,8,
                    drawX, drawY, 8, 8
                    );
                //drawTile(drawX, drawY, worldForeground, gidFore, img.tiles);
             }
        }//end column render
    }//end x loop

    G.particles.draw();
    G.bullets.draw();

    // TEMP TEST: work in progress electricity bolt line renderer
    //G.lightning.stressTest();

    // world.lightningSpawners.forEach(function(e){
    //     if(e.width > e.height){
    //         let x1 = e.x - G.view.x;
    //         let y1 = e.y - G.view.y + rndInt(0, e.height);
    //         let x0 = e.x  + e.width - G.view.x;
    //         let y0 = e.y - G.view.y + rndInt(0, e.height);
    //         G.lightning.drawZap(x0,y0,x1,y1)
    //     } else {
    //         let x1 = e.x - G.view.x + rndInt(0, e.width);
    //         let y1 = e.y - G.view.y;
    //         let x0 = e.x - G.view.x + rndInt(0, e.width);
    //         let y0 = e.y + e.height - G.view.y;
    //         G.lightning.drawZap(x0,y0,x1,y1);
    //     }
        
    // })

    UIRender();
    debugRender();
    G.rb.render();

}//end render

//update systems---------------------------------------------------------------------

function handleInput(dt){

    if(Key.isDown(Key.LEFT) || Key.isDown(Key.a)){
        player.input.left = true;
    }
    else if(Key.isDown(Key.RIGHT) || Key.isDown(Key.d)){
        player.input.right = true;
    }
    if(Key.isDown(Key.DOWN) || Key.isDown(Key.s)){
        player.input.down = true;
    }
    else if(Key.isDown(Key.UP) || Key.isDown(Key.w)){
        player.input.up = true;
    }
    if(Key.isDown(Key.x) || Key.isDown(Key.o)){
        player.input.primaryFire = true;
    }
    if(Key.isDown(Key.c)){
        player.input.secondaryFire = true;
    }
    if(Key.isDown(Key.z) || Key.isDown(Key.p) || Key.isDown(Key.SPACE)){
        player.input.jump = true;
    }


    if(Key.justReleased(Key.LEFT) || Key.justReleased(Key.a)){
        player.input.left = false;
    }
    if(Key.justReleased(Key.RIGHT) || Key.justReleased(Key.d)){
        player.input.right = false;
    }
    if(Key.justReleased(Key.UP) || Key.justReleased(Key.w)){
        player.input.up = false;
    }
    if(Key.justReleased(Key.DOWN) || Key.justReleased(Key.s)){
        player.input.down = false;
    }
    if(Key.justReleased(Key.x) || Key.justReleased(Key.o)){
        player.input.primaryFire = false;
    }
    if(Key.justReleased(Key.c)){
        player.input.secondaryFire = false;
    }


    if(Key.justReleased(Key.m)){
        audio.toggleMute();
    }
    if(Key.justReleased(Key.COMMA)){
        audio.turnVolumeDown();
    }
    if(Key.justReleased(Key.PERIOD)){
        audio.turnVolumeUp();
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
    
    currentMap = map;

    if(!loader.mapIsLoaded(map)) {
        loader.loadInitialMapData(map, loadFromConsole, spawnPoint);
        return;//can't continue with this function until the map is loaded
    }
    
    loader.loadConnectedMapData(map, function(){});

    updateWorldData(world, worldFlipped, worldForeground, currentMap);

    movePlayerToSpawnPoint(currentMap, spawnPoint);

    G.currentMap = map;
}
G.loadMap = loadMap

function loadFromConsole(loadedMap, spawnPoint) {
    let { loader, currentMap, world, worldFlipped, worldForeground } = G;
    let map = Object.keys(loadedMap)[0];
    currentMap = map;
    
    loader.loadConnectedMapData(map, function(){});

    updateWorldData(world, worldFlipped, worldForeground, currentMap);

    movePlayerToSpawnPoint(currentMap, spawnPoint);

    G.currentMap = map;
}

function updateWorldData(world, worldFlipped, worldForeground, currentMap) {
    world.widthInTiles = loader.tileMaps[currentMap].layers[0].width;
    world.heightInTiles= loader.tileMaps[currentMap].layers[0].height;

    worldFlipped.widthInTiles = loader.tileMaps[currentMap].layers[1].width;
    worldFlipped.heightInTiles= loader.tileMaps[currentMap].layers[1].height;

    worldForeground.widthInTiles = loader.tileMaps[currentMap].layers[2].width;
    worldForeground.heightInTiles= loader.tileMaps[currentMap].layers[2].height;

    world.data = Uint16Array.from(loader.tileMaps[currentMap].layers[0].data);
    worldFlipped.data = Uint16Array.from(loader.tileMaps[currentMap].layers[1].data);
    worldForeground.data = Uint16Array.from(loader.tileMaps[currentMap].layers[2].data);

    world.portals = loader.tileMaps[currentMap].layers[3].objects.filter(function(e){return e.type == "portal"});
    world.doors = loader.tileMaps[currentMap].layers[3].objects.filter(function(e){return e.type == "door"});
    world.spawnPoints = loader.tileMaps[currentMap].layers[3].objects.filter(function(e){return e.type == "spawnPoint"});
    world.lightningSpawners = loader.tileMaps[currentMap].layers[3].objects.filter(function(e){return e.type == "lightningBox"});

    world.entities = processWorldObjects(loader.tileMaps[currentMap].layers[4].objects);
    //world.objects = loader.tileMaps[currentMap].layers[4].objects
    
    if(loader.tileMaps[currentMap].properties){
        world.parallax0 = loader.tileMaps[currentMap].properties.find(function(e){return e.name = 'Parallax0' }).value;
    }
}

function processWorldObjects(objects){
    let results = [];
    // console.log(objects);
    objects.forEach(function(obj){
        switch(obj.type){
            case "flipbat":
                //console.log(obj);
                let height = obj.properties.find(function(e){return e.name == 'pathHeightInTiles'}).value;
                results.push(new FlipBat({pos:{x: obj.x, y: obj.y}, height: height }).init());
            break;
            case "flippig":
                let pathWidth = obj.properties.find(function(e){return e.name == 'pathWidthInTiles'}).value;
                results.push(new FlipPig({pos:{x: obj.x, y: obj.y}, pathWidth: pathWidth, source: obj}).init());
            break;
            case "flipbird":
                results.push(new FlipBird({pos:{x: obj.x, y: obj.y}}).init());
            break;
            case "robotank":
                results.push(new RoboTank({pos:{x: obj.x, y: obj.y}}).init()); 
            break;
            case "barricade":
                // console.log(obj);
                results.push(new Barricade(obj).init());
            break;
            case "switch":
                results.push(new Switch(obj).init());
            default:
                //nothing
            
        }
    })
    return results;
}

function movePlayerToSpawnPoint(currentMap, spawnPoint) {
    if(spawnPoint.x == undefined) {
        let spawn = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == spawnPoint});
        player.pos.x = spawn.x;
        player.pos.y = spawn.y;    
    } else {
        player.pos.x = spawnPoint.x;
        player.pos.y = spawnPoint.y;
    }
}


function debugRender(){
    
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,228,427,12)

    G.gameFont.drawText({
    textString: `${G.currentMap}, x ${Math.round(player.pos.x)}, y ${Math.round(player.pos.y)}, vy${G.player.vy.toFixed(3)}`,
    pos: {x: 4, y: 230},
    spacing: 0
    })

    G.debugEvents.forEach(function(e){
        eval(e);
    })
    G.debugEvents = [];

    //G.rb.rect(player.rect.left-G.view.x, player.rect.top-G.view.y, player.rect.right-player.rect.left, player.rect.bottom-player.rect.top, 22)
}

function UIRender(){
    let healthBarLocation   = {x: 4, y: 4},
        healthBarDimensions = {w: 50, h: 8},
        healthBarPadding    = 1,
        healthBarDrawWidth  = range(G.player.health, 0, G.player.maxHealth, 0, healthBarDimensions.w-healthBarPadding*2);
    ctx.fillStyle = '#777';
    ctx.fillRect(healthBarLocation.x, healthBarLocation.y, healthBarDimensions.w, healthBarDimensions.h);
    ctx.fillStyle = '#444';
    ctx.fillRect(
            healthBarLocation.x + healthBarPadding,
            healthBarLocation.y+healthBarPadding,
            healthBarDimensions.w-healthBarPadding*2,
            healthBarDimensions.h-healthBarPadding*2
            );
    //test by setting lower than full
    //G.player.health = 75;
    ctx.fillStyle = '#4f0'
    ctx.fillRect(
        healthBarLocation.x + healthBarPadding,
        healthBarLocation.y+healthBarPadding,
        healthBarDrawWidth,
        healthBarDimensions.h-healthBarPadding*2
        );

}

