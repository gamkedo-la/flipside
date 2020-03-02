/*
███████╗██╗░░░░░██╗██████╗░░██████╗██╗██████╗░███████╗
██╔════╝██║░░░░░██║██╔══██╗██╔════╝██║██╔══██╗██╔════╝
█████╗░░██║░░░░░██║██████╔╝╚█████╗░██║██║░░██║█████╗░░
██╔══╝░░██║░░░░░██║██╔═══╝░░╚═══██╗██║██║░░██║██╔══╝░░
██║░░░░░███████╗██║██║░░░░░██████╔╝██║██████╔╝███████╗
╚═╝░░░░░╚══════╝╚═╝╚═╝░░░░░╚═════╝░╚═╝╚═════╝░╚══════╝
Flipside - made by the http://hometeamgamedev.com club
*/

/* eslint-disable max-depth */
/* eslint-disable complexity */
import Stats from './src/js/stats.module.js';

import G from './src/js/G.js';
import { Key, inView, pos } from './src/js/util.js';
import { clearScreen, makeMosaic, drawTile, spriteFont, preRenderBlendedSprite, Transitioner, colors } from './src/js/graphics.js'
import World from './src/js/world.js';
import player from './src/js/player.js';
import { rndInt, clamp, rndFloat, range, coinFlip } from './src/js/math.js';
import AssetLoader from './src/js/AssetLoader.js';
import AudioGlobal from './src/js/audio.js';
import Signal from './src/js/Signal.js';
import ParticlePool from './src/js/ParticlePool.js';
import GamepadSupport from './src/js/gamepad.js';
import ElectricityRenderer from './src/js/electricity.js';
import RetroBuffer from './src/js/retroBuffer.js';
import FlipBat from './src/js/flipbat.js';
import FlipPig from './src/js/flippig.js';
import FlipBird from './src/js/flipbird.js';
import RoboTank from './src/js/robotank.js';
// import Drone from './src/js/drone.js';
import FlipSpider from './src/js/flipspider.js';
import Barricade from './src/js/Barricade.js';
import Switch from './src/js/Switch.js';
import MessageBox from './src/js/MessageBox.js';
import Note from './src/js/Note.js';
import Drone from './src/js/drone.js';
import GameSaver from './src/js/GameSaver.js';
import { UIRender, showMessage } from './src/js/UI.js';
import WebRenderer from './src/js/webRenderer.js';



const USE_GL_RENDERER = true;
const invertedMosaicEffectEnabled = false;
const soundEnabled = true;

//one global (G)ame object to rule them all, constants defined here
window.G = G;

G.transitioning = false;

// start the gamepad keyboard event emulator
// works fine, disabled for perf testing
G.GamepadSupport = new GamepadSupport();

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

G.particles = new ParticlePool(5000);
G.bullets = new ParticlePool(300);
G.pickups = new ParticlePool(150);

G.deadZone = {
    x: 300, y: 100
}

G.tileSheetSize = { height: 16, width: 16 }

G.MSG = new Signal();
G.loader = new AssetLoader();

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
    '3x5font',
    'labCaveWall',
    'EnemyTinyflyer',
    'EnemyTinycrawler',
    'EnemyTinydiver',
    'EnemyRoboTank',
    'EnemyFlipTank',
    'flipspider',
    'flipSpace',
    'msgBox1',
    'msgBox2',
    'msgBox3',
    'pauseScreen',
    'portraits',
    'face1',
    'face2',
    'face3'
]

 //sounds list!---------------------------------------------------------------
const soundList = [
    { name: "test1", url:"./src/snd/test1.mp3" },
    { name: "test2", url:"./src/snd/test2.mp3" },
    { name: "testMusic2", url:"./src/snd/stebsScaryFlipside(2).mp3" },
    { name: "testMusic1", url:"./src/snd/klaim-wip-draft2.mp3" },
    { name: "playerShoot", url:"./src/snd/playerShoot1.mp3" },
    { name: "splode1", url:"./src/snd/splode1.mp3"},
    { name: "footstep", url:"./src/snd/footstep.mp3"},
    { name: "highJump", url:"./src/snd/highJump.mp3"},
    { name: "jump", url:"./src/snd/jump.mp3"},
    { name: "playerDeath", url:"./src/snd/playerDeath.mp3"},
    { name: "playerHit", url:"./src/snd/playerHit.mp3"},
    { name: "mobHit1", url:"./src/snd/mobHit1.mp3"}
]

//retro buffer, for no AA lines, circles, indexed-color raster drawing;
G.rb = new RetroBuffer(427,240);
G.rb.c.id="retrobuffer";
document.body.appendChild(G.rb.c);

//for that tasty deepnight pixel mosaic overlay effect
const mosaic = makeMosaic();
mosaic.canvas.id = "mosaic";
document.body.appendChild(mosaic.canvas);
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

G.MSG.addEventListener('achievement',  function (event) { showMessage(`ACHIEVEMENT GET: ${event.detail.title}`) });

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
    if(USE_GL_RENDERER) {
        G.GLRenderer = new WebRenderer(60, 36, G.img.tiles, G.img.labCaveWall, G.img.flipSpace);
    }
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
    if(USE_GL_RENDERER) {
        const entityData = {
            player: {
                image:G.player.spritesheet.image,
                frameCount:G.player.spritesheet._f
            },
            flipbat: {
                image:G.img.EnemyTinyflyer,
                frameCount:8 
            }
        }
        G.GLRenderer.prepareEntityData(entityData);
    }

    //create spriteFont
    G.gameFont = new spriteFont({
        width: 255,
        height: 128,
        characterHeight: 9,
        characterWidth: 6,
        image: G.img.smallFont
        //remaining options are in spriteFont defaults
    })

    G.tinyFont = new spriteFont({
        width: 320,
        height: 240,
        characterHeight: 6,
        characterWidth: 4,
        image: G.img["3x5font"]
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
    if (soundEnabled) G.music = G.audio.playMusic(G.sounds.testMusic1)
    G.music.volume.gain.value = 0.65;
    console.log(G.music);

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
    if(G.showMessageBox)G.messageCooldown--
    if(G.messageCooldown < 0)G.showMessageBox = false;

    if (G.GamepadSupport) G.GamepadSupport.handle_gamepad(); // polled each frame

    handleInput(dt);

    if (paused) {

        // If we don't run Key.update() then the escape key "justReleased" state  will never reset
        // and we will unpause automatically next frame when calling handleInput(dt) above
        Key.update();

        return;
    }

    if (G.showMiniMap){
        //same behavior as pause...maybe handle some animation, like blinking of player location
        //but game loop is skipped.
        Key.update();
        return;
    }

    handleCamera(dt); //

    G.world.entities.forEach(function(e){e.update(dt)});

    player.update(dt, G.world, G.worldFlipped, G.worldForeground);
    //Key needs updated so justReleased queue gets emptied at end of frame
    Key.update();//

    G.particles.update(dt);
    G.pickups.update(dt);
    G.bullets.update(dt);

    //---bullet collision checks-----------------------------------------------------
    for(let i = 0; i < G.bullets.pool.length; i+= G.bullets.tuple){
        if(G.bullets.pool[i]==0){i+=G.bullets.tuple}else{
            if(G.world.pixelToTileID(G.bullets.pool[i+1], G.bullets.pool[i+2]) > G.player.collideIndex){
                G.bullets.kill(i);
            }
            //console.log(G.worldFlipped.pixelToTileID(G.bullets.pool[i+1], G.bullets.pool[i+2]));
            if(G.worldFlipped.pixelToTileID(G.bullets.pool[i+1], G.bullets.pool[i+2]) >= 3){
                G.worldFlipped.tileFillCircle(
                    Math.floor(G.bullets.pool[i+1]/8),
                    Math.floor(G.bullets.pool[i+2]/8),
                     2, -G.FLIPSPACE_TIME);
                G.bullets.kill(i);
                
            }
        }
    }
    //---end bullet collision checks-----------------------------------------------------
    

}

function drawPauseMenu() {
    
    ctx.drawImage(G.img.pauseScreen, 0,0);
}

function render(dt){
    

    //let {world, worldFlipped, worldForeground, img, rb } = G;
    //draw all the things

//    clearScreen('black');
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

    if(!USE_GL_RENDERER) {
        for(let i = -1; i <= (Math.round( c.width / G.img[G.world.parallax0].width ) + 1 * 2); i++){
            for (let j = -1; j <= (Math.round( c.height / G.img[G.world.parallax0].width ) + 1 * 2); j++){
                let x = i * G.img[G.world.parallax0].width, y = j * G.img[G.world.parallax0].height;
                ctx.drawImage(G.img[G.world.parallax0], x,y);
            }
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

    if(USE_GL_RENDERER) {
        rx0 = view.x/G.world.tileSize | 0;
        ry0 = view.y / G.world.tileSize | 0;
        const GIDs = [];
        const flips = [];
        let tileIndex = 0;
        for(let k = ry0; k < ry0 + 36; k++) {
            for(let l = rx0; l < rx0 + 60; l++) {
                const flatIndex = k * G.world.widthInTiles + l;
                GIDs.push(G.world.data[flatIndex] - 1);

                if(G.worldFlipped.data[flatIndex] >= 3) {
                    flips.push(tileIndex);
                }

                tileIndex++;

                //an enemy has added some flipspace, begin reverting back           
                if(G.worldFlipped.data[flatIndex] > loader.tileMaps[G.currentMap].layers[1].data[flatIndex]){
                    if(coinFlip())G.worldFlipped.data[flatIndex]--;
                }
                //we've removed flipspace with weapons, begin reverting back    
                if(G.worldFlipped.data[flatIndex] < loader.tileMaps[G.currentMap].layers[1].data[flatIndex]){
                    if(coinFlip())G.worldFlipped.data[flatIndex]++;
                }
            }
        }

        const x = Math.floor(G.player.pos.x-G.player.width/2-G.view.x)-4;
        const y = Math.floor(G.player.pos.y-G.player.height/2-G.view.y-3) + 90;//No idea why this is the magic number
        const deltaX = view.x % G.world.tileSize;
        const deltaY = view.y % G.world.tileSize;
        const backgroundCanvas = G.GLRenderer.getBackgroundImageCanvas(paused, GIDs, flips, deltaX, deltaY, x, y, G.player.getSpriteSheetFrame(), G.player.wasHit,  null);
        //the view.x/y % tileSize accounts for sub-tile scrolling
        ctx.drawImage(backgroundCanvas, 0, 0);

    } else {//not using the gl_renderer
        
        /* tile render loop! render order is columns.
           for each column( i ) */
        for(let i = rx0; i < rx1; i++){
            //render all tiles in the column
            for(let j = ry0; j < ry1; j++){

                var drawX =     Math.floor(i*8 - view.x),
                    drawY =     Math.floor(j*8 - view.y),
                    flatIndex = j * G.world.widthInTiles + i,
                    gid = G.world.data[flatIndex]-1;

                /* technically this next bit should be in update not render, but yay optimizing!
                   check worldFlipped index against loaded map index, since this layer is destructable.
                   if not equal, random chance of 'healing' back to loaded map state. */

                //an enemy has added some flipspace, begin reverting back           
                if(G.worldFlipped.data[flatIndex] > loader.tileMaps[G.currentMap].layers[1].data[flatIndex]){
                    if(coinFlip())G.worldFlipped.data[flatIndex]--;
                }
                //we've removed flipspace with weapons, begin reverting back    
                if(G.worldFlipped.data[flatIndex] < loader.tileMaps[G.currentMap].layers[1].data[flatIndex]){
                    if(coinFlip())G.worldFlipped.data[flatIndex]++;
                }
                
                
                //flipped area affect, purple/pink stuff----------------------------------------
                if(G.worldFlipped.data[flatIndex] >= 3){
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
                    if(Ngid < 3){
                        ctx.drawImage(
                            G.img.flipSpace, 8*rndInt(0,15), 8, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                    }
                    if(Sgid < 3){
                        ctx.drawImage(
                            G.img.flipSpace, 8*rndInt(0,15), 0, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                    }
                    if(Wgid < 3){
                        ctx.drawImage(
                            G.img.flipSpace, 8*rndInt(0,15), 16, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                    }
                    if(Egid < 3){
                        ctx.drawImage(
                            G.img.flipSpace, 8*rndInt(0,15), 24, 8, 8, drawX, drawY, G.world.tileSize, G.world.tileSize
                        )
                    }
                } else {
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

    }//end if using gl_renderer

    //render AABB's, including pickups and baddies
    

    //render player;
    if(!USE_GL_RENDERER) {
        player.render();
    }

    G.world.entities.forEach(function(e){
        if(inView(e.pos.x, e.pos.y)){
            e.render();
        }
    });
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
    G.pickups.draw();

    // TEMP TEST: work in progress electricity bolt line renderer
    //G.lightning.stressTest();

    G.world.lightningSpawners.forEach(function(e){
        if(e.width > e.height){
            let x1 = e.x - G.view.x;
            let y1 = e.y - G.view.y + rndInt(0, e.height);
            let x0 = e.x  + e.width - G.view.x;
            let y0 = e.y - G.view.y + rndInt(0, e.height);
            let colorIndex = e.properties[0].value;
            G.lightning.drawZap(x0,y0,x1,y1,colors[colorIndex])
        } else {
            let x1 = e.x - G.view.x + rndInt(0, e.width);
            let y1 = e.y - G.view.y;
            let x0 = e.x - G.view.x + rndInt(0, e.width);
            let y0 = e.y + e.height - G.view.y;
            let colorIndex = e.properties[0].value;
            G.lightning.drawZap(x0,y0,x1,y1,colors[colorIndex]);
        }

     })

    UIRender();
    debugRender();
    if(G.showMiniMap){
        
        //G.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        //G.ctx.fillRect(0,0,G.c.width, G.c.height);
        let px = Math.round(G.player.pos.x / 8),
            py = Math.round(G.player.pos.y / 8),
            hw = Math.round(G.c.width /2),
            hh = Math.round(G.c.height /2),
            xStart = px-hw,
            yStart = py-hh;

        for(let x = 0; x <= G.c.width; x++){
            for(let y = 0; y <= G.c.height; y++){
                ctx.fillStyle = 'rgba(25,25,25, 0.7)';
                ctx.fillRect(x,y,1,1);

                // if(G.world.data[x + G.world.widthInTiles*y] >= G.collideIndex){
                //     G.rb.pset(x,y, 4);
                // }

                let lx = x + xStart;
                let ly = y + yStart;
                
                    //and position isn't outside the tilemap
                    if(lx < G.world.widthInTiles && lx > 0 && ly > 0 && ly < G.world.heightInTiles){
                        //optimize by pre-rendering tiny tilemap at 1px or just hardcoding a few tile types
                        ctx.drawImage(
                            G.img.tiles,
                            G.world.data[lx + G.world.widthInTiles*ly]%G.tileSheetSize.height * 8 +3,
                            Math.floor(G.world.data[lx + G.world.widthInTiles*ly]/G.tileSheetSize.width) * 8 +3,
                            1,1,
                            x,y, 1, 1
                            );
                    }       
                
            }
        }
        G.rb.fillRect(px-xStart-1, py-yStart-2, 3, 5, 9);
    }

    G.rb.render(); 
    
    if (paused) {
        G.rb.ctx.clearRect(0,0,427,240);
        drawPauseMenu();
    }

   

    
    
    

    

}//end render

//update systems---------------------------------------------------------------------

function handleInput(dt){
    if (Key.justReleased(Key.ESCAPE)) {
        paused = !paused;
    }

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
    if(Key.justReleased(Key.c)){
        G.showMessageBox = false;
    }
    if(Key.justReleased(Key.m)){
        G.showMiniMap = !G.showMiniMap
    }
    if(Key.isDown(Key.z) || Key.isDown(Key.p) || Key.isDown(Key.SPACE)){
        player.input.jump = true;
        //player.canJump = false;
    }
    if(Key.justReleased(Key.z) || Key.justReleased(Key.p) || Key.justReleased(Key.SPACE)){
        player.input.jump = false;
        player.canJump = true;
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
    if(Key.justReleased(Key.ONE)){
        console.log("CHEAT KEY: toggling gun");
        player.hasPugGun = !player.hasPugGun;
    }
    if(Key.justReleased(Key.TWO)){
        console.log("CHEAT KEY: toggling highjump");
        player.hasHighJump = !player.hasHighJump;
    }
    if(Key.justReleased(Key.THREE)){
        console.log("CHEAT KEY: clearing localstorage savegame");
        localStorage.removeItem("flipside-game1");
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

    if (Key.isDown(Key.b)) {
        showMessage();
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
    
    console.log("Loading map: " + map);
    
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
    worldFlipped.data = Int32Array.from(loader.tileMaps[currentMap].layers[1].data);
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
        console.log("spawning a " + obj.type);
        switch(obj.type){
            case "flipbat":
                results.push(new FlipBat(obj).init());
            break;
            case "flippig":
                results.push(new FlipPig(obj).init());
            break;
            case "flipbird":
                results.push(new FlipBird({pos:{x: obj.x, y: obj.y}}).init());
            break;
            case "robotank":
                results.push(new RoboTank({pos:{x: obj.x, y: obj.y}}).init());
            break;
            case "flipspider":
                results.push(new FlipSpider({pos:{x: obj.x, y: obj.y}}).init());
            break;
             case "drone":
                 results.push(new Drone({pos:{x: obj.x, y: obj.y}}).init());
             break;
            case "barricade":
                results.push(new Barricade(obj));
            break;
            case "switch":
                results.push(new Switch(obj));
            break;
            case "messageBox":
                results.push(new MessageBox(obj));
            break;
            case "note":
                results.push(new Note(obj));
            break
            default:
                //nothing

        }
    })
    return results;
}

function movePlayerToSpawnPoint(currentMap, spawnPoint) {
    if(spawnPoint.x == undefined) {
        let spawn = loader.tileMaps[currentMap].layers[3].objects.find(function(e){return e.name == spawnPoint});
        if (!spawn) {
            console.log("ERROR: missing spawn point ["+spawnPoint+"] in tiled data! ignoring.")
            return;
        }
        player.pos.x = spawn.x;
        player.pos.y = spawn.y;
    } else {
        player.pos.x = spawnPoint.x;
        player.pos.y = spawnPoint.y;
    }
    
    
}


function debugRender(){

    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,232,427,8)

    G.tinyFont.drawText({
    textString: `${G.currentMap}, x: ${Math.round(player.pos.x)}, y: ${Math.round(player.pos.y)}, vy: ${G.player.vy.toFixed(3)}`,
    pos: {x: 4, y: 233},
    spacing: 0
    })

    G.debugEvents.forEach(function(e){
        eval(e);
    })
    G.debugEvents = [];

    //G.rb.rect(player.rect.left-G.view.x, player.rect.top-G.view.y, player.rect.right-player.rect.left, player.rect.bottom-player.rect.top, 22)
}
