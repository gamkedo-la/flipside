import Stats from './src/js/stats.module.js';
import { Key, inView } from './src/js/util.js';
import { clearScreen, makeMosaic, drawTile, spriteFont } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt, clamp, rndFloat, range } from './src/js/math.js';
import AssetLoader from './src/js/AssetLoader.js';
import AudioGlobal from './src/js/audio.js';
import Signal from './src/js/Signal.js';
import Particle from './src/js/particle.js';
import GamepadSupport from './src/js/gamepad.js';
import ElectricityRenderer from './src/js/electricity.js';
import RetroBuffer from './src/js/retroBuffer.js';
import Records from './src/js/records.js';
import FlipBat from './src/js/flipbat.js';
import GameSaver from './src/js/GameSaver.js';

const invertedMosaicEffectEnabled = false;

//one global (G)ame object to rule them all
window.G = {};

// start the gamepad keyboard event emulator
G.GamepadSupport = new GamepadSupport();

//initialize and show the FPS/mem use counter
const stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//canvas init and other data init---------------------------------------------
G.debugEvents = [];
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
//G.Records = new Records();

G.audio = new AudioGlobal(); // FIXME: defer to after the first click/keypress to avoid browser error
G.lightning = new ElectricityRenderer();
G.saver = new GameSaver();
G.gameKey = 'game1';//TODO: User input to decide which game save to load
G.savedGame = G.saver.getSavedGame(G.gameKey);

G.player = player;
G.player.maxHealth = G.savedGame.maxHealth;
G.Records = G.savedGame.Records;

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
    { name: "testMusic1", url:"./src/snd/stebsScaryFlipside(2).mp3" }
]

//retro buffer, for no AA lines, circles, indexed-color raster drawing;
G.rb = new RetroBuffer({width: 427, height: 240});
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


window.addEventListener('click', function(event) { audio.context.resume(); }, false); //Temporary fix for chrome not strting the audio context until user interaction

//load assets, then start game-------------------------------------------------------------

loader.loadInitialMapData(G.currentMap, init);

function init(){
    G.img = loader.loadImages(images, soundInit);

    G.world = new World();
    G.worldFlipped = new World();
    G.worldForeground = new World();

    
}

function soundInit(){

    //next we load our soundlist, passing in start as a callback once complete.
    //soundloader just gives loader the properties,  loadAudioBuffer actually decodes the files and
    //creates a list of buffers.
    loadMap({map: G.currentMap, spawnPoint: G.savedGame.spawnPoint});
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
    //player.pos = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == "PlayerStart"})

    //Fire it up!
    requestAnimationFrame(frame);
    G.audio.playMusic(G.sounds.testMusic1);
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
    G.bullets = G.particles.filter(function(particle){return particle.type=='bullet'});

    G.particles.forEach(function(particle){
        if(particle.type == 'bullet'){

            let splodeCount = 1, velX, randX;

            if (particle.life <= 0) {
                splodeCount = 6;
                velX = 0;
                randX = 1.5;
            } else if (G.world.data[G.world.pixelToTileIndex(particle.pos)] > G.player.collideIndex) {
                splodeCount = 3;
                velX = -particle.vx/5;
                randX = 0.5;
                particle.life = 0;
            }

             while(--splodeCount){
                //console.log('making splode')
                G.particles.push(new Particle({
                    x: Math.round(particle.pos.x/8)*8,
                    y: particle.pos.y,
                    vx: velX + rndFloat(-randX, randX),
                    vy: rndFloat(-2, 2),
                    life: 10,
                    color: 8,
                    width: 1,
                    height: 1,
                    type: 'bg'
                }))
            }
        }
        var flippedIndex = G.world.pixelToTileIndex(particle.pos)
        var flippedGID = G.worldFlipped.data[flippedIndex]
        if(flippedGID == 3){
            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.vx += rndFloat(-0.2, 0.2)
            particle.color = 27;
            if(particle.type == 'bullet'){
                //magic number is amount of ticks before it returns to being flipspace
                G.worldFlipped.tileFillCircle({
                    tx: Math.floor(particle.pos.x/8),
                    ty: Math.floor(particle.pos.y/8),
                    radius: 2,
                    value: G.player.flipRemovedCooldown+rndInt(-20,20)
                })  
                
               // G.worldFlipped.data[flippedIndex]+=G.player.flipRemovedCooldown+rndInt(-20, 20);
                let splodeCount = 6;
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
            if(particle.type == 'bulletFlipped'){
                //magic number is amount of ticks before it returns to being flipspace
                G.worldFlipped.tileFillCircle({
                    tx: Math.floor(particle.pos.x/8),
                    ty: Math.floor(particle.pos.y/8),
                    radius: 2,
                    value: 3
                })  
                
               // G.worldFlipped.data[flippedIndex]+=G.player.flipRemovedCooldown+rndInt(-20, 20);
                let splodeCount = 6;
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

    //flip healing routine--------------------------------
    for(let i = 0; i < G.worldFlipped.data.length; i++){
        let tile = G.worldFlipped.data[i];
        if(tile <= 3){
        
        }
        if(tile > 3){
           
            G.worldFlipped.data[i] = tile-1;
        }
    }
    G.world.entities.forEach(function(e){e.update()});

    player.update(dt, G.world, G.worldFlipped, G.worldForeground);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();

}

function render(dt){
    let {world, worldFlipped, worldForeground, img, particles, rb } = G;
    //draw all the things

    clearScreen('black');
    rb.clear(64);

    //render background parallax
    var parallaxImage = img[world.parallax0];
    //console.log(parallaxImage);
    var bgWidth = parallaxImage.width;
    var bgHeight = parallaxImage.height;
    let bgPadding = 1; 
    let bgTileWidth = Math.round( c.width / bgWidth ) + bgPadding * 2;
    let bgTileHeight = Math.round( c.height / bgHeight ) + bgPadding * 2;
    //console.log(bgTileWidth, bgTileHeight);
    for(let i = -bgPadding; i <= bgTileWidth; i++){
        for (let j = -bgPadding; j <= bgTileHeight; j++){
            let x = i * bgWidth, y = j * bgHeight;
            ctx.drawImage(parallaxImage, x,y);
        }
    }

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

            var drawX =     Math.floor(i*8 - view.x),
                drawY =     Math.floor(j*8 - view.y),
                flatIndex = j * world.widthInTiles + i,
                
                gid = world.data[flatIndex],
                gidFlipped = worldFlipped[flatIndex];


                gid-=1;
                gidFlipped -=1;

            if(!gidFlipped){
                drawTile({x:drawX, y:drawY}, world, gid);
            }

            //---additional rendering for pockets of Flip in the map
            if(worldFlipped.data[flatIndex] == 3){
                //modify the draw position at random intervals between 20 and 60 ticks for glitchy effect
                let modX = rndInt(-1,1);
                let modY = rndInt(-1,1);
                if(frameCount % rndInt(20,60) > 0){
                    modX = 0; modY = 0;
                }
                drawTile({x: drawX + modX, y: drawY + modY}, world, gid);

                //draw a dark color blended over top to create the darkened effect
                ctx.save();
                ctx.globalCompositeOperation = 'overlay';
                ctx.drawImage(
                    img.aap64, 0, rndInt(26,28), 1, 1, drawX, drawY, world.tileSize, world.tileSize
                    )
                ctx.restore();

                //perimeter effects

                let Ngid = worldFlipped.data[flatIndex - world.widthInTiles],
                    Sgid = worldFlipped.data[flatIndex + world.widthInTiles],
                    Egid = worldFlipped.data[flatIndex + 1],
                    Wgid = worldFlipped.data[flatIndex -1];
                    //console.log(Ngid, Sgid, Egid, Wgid);
                if(Ngid != 3){
                    ctx.drawImage(
                        img.flipSpace, 8*rndInt(0,15), 8, 8, 8, drawX, drawY, world.tileSize, world.tileSize
                        )
                }
                if(Sgid != 3){
                    ctx.drawImage(
                        img.flipSpace, 8*rndInt(0,15), 0, 8, 8, drawX, drawY, world.tileSize, world.tileSize
                        )
                }
                if(Wgid != 3){
                    ctx.drawImage(
                        img.flipSpace, 8*rndInt(0,15), 16, 8, 8, drawX, drawY, world.tileSize, world.tileSize
                        )
                }
                if(Egid != 3){
                    ctx.drawImage(
                        img.flipSpace, 8*rndInt(0,15), 24, 8, 8, drawX, drawY, world.tileSize, world.tileSize
                        )
                }

                
            }//end flip render

        }//end column render

    }//end x loop

    //render AABB's, including pickups and baddies
    G.world.entities.forEach(function(e){
        if(inView(e.pos)){
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

    // TEMP TEST: work in progress electricity bolt line renderer
    //G.lightning.stressTest();

    world.lightningSpawners.forEach(function(e){
        if(e.width > e.height){
            let x1 = e.x - G.view.x;
            let y1 = e.y - G.view.y + rndInt(0, e.height);
            let x0 = e.x  + e.width - G.view.x;
            let y0 = e.y - G.view.y + rndInt(0, e.height);
            G.lightning.drawZap({x: x0, y: y0}, {x: x1, y: y1})
        } else {
            let x1 = e.x - G.view.x + rndInt(0, e.width);
            let y1 = e.y - G.view.y;
            let x0 = e.x - G.view.x + rndInt(0, e.width);
            let y0 = e.y + e.height - G.view.y;
            G.lightning.drawZap({x: x0, y: y0}, {x: x1, y: y1})
        }
        
    })

    
    UIRender();
    debugRender();
    rb.render();

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
    objects.forEach(function(obj){
        switch(obj.type){
            case "flipbat": {
                //console.log(obj);
                let height = obj.properties.find(function(e){return e.name == 'pathHeightInTiles'}).value;
                results.push(new FlipBat({pos:{x: obj.x, y: obj.y}, height: height }).init());
            }
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

function flipSpaceRender(){

}
