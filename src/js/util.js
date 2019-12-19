
    export const Key = {

        _pressed: {},
        _released: {},

        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SPACE: 32,
        ONE: 49,
        TWO: 50,
        THREE: 51,
        FOUR: 52,
        a: 65,
        c: 67,
        w: 87,
        s: 83,
        d: 68,
        z: 90,
        x: 88,
        f: 70,
        p: 80,
        r: 82,

        isDown(keyCode) {
            return this._pressed[keyCode];
        },

        justReleased(keyCode) {
            return this._released[keyCode];
        },

        onKeydown(event) {
            this._pressed[event.keyCode] = true;
        },

        onKeyup(event) {
            this._released[event.keyCode] = true;
            delete this._pressed[event.keyCode];

        },

        update() {
            this._released = {};
        }
    };

    export function calculateMousePos(evt) {
        var rect = c.getBoundingClientRect();
        var root = document.documentElement;
        var mouseX = evt.clientX - rect.left - root.scrollLeft;
        var mouseY = evt.clientY - rect.top - root.scrollTop;
        return {
            x:mouseX,
            y:mouseY
        };
    }

    export function lerp(v0, v1, t) {
        return v0*(1-t)+v1*t
    }

    export function HashMap(cellSize=50){
        this.cellSize = cellSize;
        return this;
    }

    HashMap.prototype._key = function(position){
        let cellSize = this.cellSize;
        return `${Math.floor(position.x/cellSize)*cellSize},${Math.floor(position.x/cellSize)*cellSize}`
    }

    HashMap.prototype.add = function(entity){
        let key = this._key({ x:entity.components.position.x, y:entity.components.position.y } );
        if(!this[key]) {this[key] = []}

        this[key].push(entity);
    }
    HashMap.prototype.getList = function(x,y){
        
        return this[ this._key( { x:x, y:y } ) ];
    }

    