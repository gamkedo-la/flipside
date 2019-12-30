const Signal = function Signal(){
    var target = document.createTextNode(null);
    this.addEventListener = target.addEventListener.bind(target);
    this.removeEventListener = target.removeEventListener.bind(target);
    this.dispatchEvent = target.dispatchEvent.bind(target);

    return this;
}

Signal.prototype.dispatch = function dispatch(eventName, params={}){
    var event = new CustomEvent(eventName, params);
    this.dispatchEvent(event);
}

export default Signal;

/* Use examples:

signal.addEventListener('bulletHitWall', bulletSplode)

emit event in update:

signal.dispatch('bulletHitWall', {x: bullet.x, y: bullet.y })


function bulletSplode(event){
    emitParticles(event.x, event.y);
}

*/