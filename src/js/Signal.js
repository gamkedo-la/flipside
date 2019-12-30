const Signal = function Signal(){
    var target = document.createTextNode(null);
    this.addEventListener = target.addEventListener.bind(target);
    this.removeEventListener = target.removeEventListener.bind(target);
    this.dispatchEvent = target.dispatchEvent.bind(target);

    return this;
}

Signal.prototype.dispatch = function dispatch(eventName, params={bubbles: true}){
    var event = new CustomEvent(eventName, params);
    this.dispatchEvent(event);
}

export default Signal;