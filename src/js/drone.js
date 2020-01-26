// Drone = flying drone, leaves behind flipspace when killed 

import { rect } from './graphics.js';

const DRONE_W = 10;
const DRONE_H = 10;
// const DRONE_SPEED = 0.25;
// const DRONE_SEEK_DIST = 16; // only seek player if farther away than this

const Drone = function({pos} = {}) {
    this.start = pos;
    this.width = DRONE_W;
    this.height = DRONE_H;
    // this.health = 16;
    // this.healthMax = 16;

    return this;
}

// Drone.prototype.init = function(dt) {
//     // Do nothing for now
// } 

// Drone.prototype.update = function(dt) {
//     // Do nothing for now
// } 

Drone.prototype.render = function render(dt) {
    rect(this.start.x, this.start.y, this.width, this.height);
}

export default Drone

/*
{
                 "gid":11,
                 "height":8,
                 "id":144,
                 "name":"Drone",
                 "rotation":0,
                 "type":"drone",
                 "visible":true,
                 "width":8,
                 "x":4417.5,
                 "y":503
                }

                case "drone": 
                results.push(new Drone({pos:{x: obj.x, y: obj.y}}).render());
            break;
*/