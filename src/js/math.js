export function rndInt(min, max) {
    if(max == null) {
        max = min || 1;
        min = 0;
    }
    return Math.floor( Math.random() * (max - min) + min );
}

export function rndFloat(min, max) {
    if(max == null) {
        max = min || 1;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}

export function rndOneIn(max = 2){
    return rndInt(0,max) === 0;
}

export function rndOneFrom(items){
    return items[rndInt(items.length)];
}

export function distance (a,b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}

export function mix(a, b, p) {
    return a * (1-p) + b * p;
}

export function range(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

