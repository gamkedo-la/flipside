
export const Key = {

    _pressed: {},
    _released: {},

    ESCAPE: 27,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    COMMA: 188,
    PERIOD: 190,
    a: 65,
    b: 66,
    c: 67,
    w: 87,
    s: 83,
    d: 68,
    z: 90,
    x: 88,
    f: 70,
    p: 80,
    r: 82,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    o: 79,

    isDown(keyCode) {
        return this._pressed[keyCode];
    },

    justReleased(keyCode) {
        return this._released[keyCode];
    },

    onKeydown(event) {
        if (/* not global: soundEnabled &&*/ G.audio && !G.audio.initialized) G.audio.init(); // FIX browser permission errors
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

export function pos(x, y){
    G.pos.x = x;
    G.pos.y = y;
    return G.pos;
}

export function inView(x,y){
    let screenX = x - G.view.x,
        screenY = y - G.view.y,
        padding = 200;
        return (screenX > -padding &&
               screenX < (G.c.width + padding) &&
               screenY > -padding &&
               screenY < (G.c.height+padding))
}

export function rectCollision(rect1, rect2) {

    //console.log(this.x);
    return (
        rect1.left < rect2.right &&
        rect2.left < rect1.right &&
        rect1.top < rect2.bottom &&
        rect2.top < rect1.bottom
      );

      /*
      return (
        this.rect.left < right &&
        left < this.rect.right &&
        this.rect.top < bottom &&
        top < this.rect.bottom
      );
      */
}

export function pointInRect(x, y, rect){
    return  x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
}


export function oscillate(input, min, max)
{
    let range = max - min ;
    return min + Math.abs(((input + range) % (range * 2)) - range);
}



