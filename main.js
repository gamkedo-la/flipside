import Stats from './src/js/stats.module.js';
import { Key } from './src/js/util.js';
import { clearScreen } from './src/js/graphics.js'

const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

//get our canvas from the document. for convenience these are global
window.c=document.getElementById("c");
window.ctx = c.getContext('2d');

// canvas is 4x pixel scale, 320x180. 
c.width = 1280 * .25;
c.height = 720 * .25;

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);



//game loop--------------------------------------------------------------------

const   now, 
        dt      = 0,
        last    = performance.now();
        step    = 1/60; //60 frapes per second.

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

function update(dt){
    //update all the things
}

function render(dt){
    //draw all the things
}