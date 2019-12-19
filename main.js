import Stats from './src/js/stats.module.js';
import { Key } from './src/js/util.js';

const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const c=document.getElementById("c");
const ctx = c.getContext('2d');

// canvas is 2x pixel scale
c.width = 1280 * .5;
c.height = 720 * .5;

//initialize  event listeners-------------------------------------------------

window.addEventListener('keyup',    function (event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown',  function (event) { Key.onKeydown(event); }, false);
window.addEventListener('blur',     function (event) { paused = true; }, false);
window.addEventListener('focus',    function (event) { paused = false; }, false);



//game loop--------------------------------------------------------------------
function frame(){

    stats.begin();
    update();
    render();
    stats.end();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);